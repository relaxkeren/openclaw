import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthConfig } from "./types.js";
import {
  getRefreshTokenFromCookie,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getClientIp,
  getUserAgent,
  sendAuthError,
  sendJsonResponse,
} from "./middleware.js";
import { checkRateLimit, recordFailedAttempt } from "./rate-limit.js";
import { login, refresh, logout, getAuthConfig } from "./session.js";

// Parse JSON body from request
function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        if (!body) {
          resolve({});
          return;
        }
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

// Handle POST /api/auth/login
async function handleLogin(
  req: IncomingMessage,
  res: ServerResponse,
  config: AuthConfig,
): Promise<void> {
  const clientIp = getClientIp(req);

  // Check rate limit
  const rateLimitCheck = checkRateLimit(clientIp, "login");
  if (!rateLimitCheck.allowed) {
    recordFailedAttempt(clientIp, "login");
    sendAuthError(
      res,
      429,
      rateLimitCheck.error!.code,
      rateLimitCheck.error!.message,
      rateLimitCheck.error!.retryAfter,
    );
    return;
  }

  try {
    const body = await parseJsonBody(req);

    if (!body || typeof body !== "object") {
      recordFailedAttempt(clientIp, "login");
      sendAuthError(res, 400, "INVALID_REQUEST", "Invalid request body");
      return;
    }

    const { email, password } = body as { email?: unknown; password?: unknown };

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      recordFailedAttempt(clientIp, "login");
      sendAuthError(res, 400, "INVALID_CREDENTIALS", "Email and password are required");
      return;
    }

    const result = login(email, password, clientIp, getUserAgent(req));

    if (!result.success) {
      recordFailedAttempt(clientIp, "login");
      sendAuthError(res, 401, result.error.code, result.error.message);
      return;
    }

    // Set refresh token cookie
    setRefreshTokenCookie(res, result.refreshToken, config);

    // Return access token
    sendJsonResponse(res, 200, result.response);
  } catch {
    recordFailedAttempt(clientIp, "login");
    sendAuthError(res, 400, "INVALID_REQUEST", "Failed to parse request body");
  }
}

// Handle POST /api/auth/refresh
async function handleRefresh(
  req: IncomingMessage,
  res: ServerResponse,
  config: AuthConfig,
): Promise<void> {
  const clientIp = getClientIp(req);

  // Check rate limit
  const rateLimitCheck = checkRateLimit(clientIp, "refresh");
  if (!rateLimitCheck.allowed) {
    recordFailedAttempt(clientIp, "refresh");
    sendAuthError(
      res,
      429,
      rateLimitCheck.error!.code,
      rateLimitCheck.error!.message,
      rateLimitCheck.error!.retryAfter,
    );
    return;
  }

  const refreshToken = getRefreshTokenFromCookie(req);

  if (!refreshToken) {
    recordFailedAttempt(clientIp, "refresh");
    sendAuthError(res, 401, "REFRESH_INVALID", "No refresh token provided");
    return;
  }

  const result = refresh(refreshToken, clientIp, getUserAgent(req));

  if (!result.success) {
    recordFailedAttempt(clientIp, "refresh");
    sendAuthError(res, 401, result.error.code, result.error.message);
    return;
  }

  // Set new refresh token cookie (rotation)
  setRefreshTokenCookie(res, result.newRefreshToken, config);

  // Return new access token
  sendJsonResponse(res, 200, result.response);
}

// Handle POST /api/auth/logout
async function handleLogout(
  req: IncomingMessage,
  res: ServerResponse,
  config: AuthConfig,
): Promise<void> {
  const refreshToken = getRefreshTokenFromCookie(req);

  if (refreshToken) {
    logout(refreshToken);
  }

  // Clear cookie regardless of whether token was valid
  clearRefreshTokenCookie(res, config);

  sendJsonResponse(res, 200, { success: true });
}

// Handle GET /api/auth/me
async function handleMe(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Get access token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendAuthError(res, 401, "AUTH_REQUIRED", "Authentication required");
    return;
  }

  const token = authHeader.substring(7);

  // Import verifyAccessToken
  const { verifyAccessToken } = await import("./session.js");
  const payload = verifyAccessToken(token);

  if (!payload) {
    sendAuthError(res, 401, "TOKEN_INVALID", "Invalid or expired token");
    return;
  }

  sendJsonResponse(res, 200, {
    email: payload.email,
    role: payload.role,
  });
}

// Main route handler
export function handleAuthRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  // Only handle /api/auth/* routes
  if (!path.startsWith("/api/auth/")) {
    return false;
  }

  const config = getAuthConfig();
  if (!config) {
    // Auth not configured - return error
    sendAuthError(res, 503, "AUTH_NOT_CONFIGURED", "Authentication not configured");
    return true;
  }

  const route = path.replace("/api/auth/", "");

  // Handle based on method and route
  if (req.method === "POST" && route === "login") {
    void handleLogin(req, res, config);
    return true;
  }

  if (req.method === "POST" && route === "refresh") {
    void handleRefresh(req, res, config);
    return true;
  }

  if (req.method === "POST" && route === "logout") {
    void handleLogout(req, res, config);
    return true;
  }

  if (req.method === "GET" && route === "me") {
    void handleMe(req, res);
    return true;
  }

  // Unknown auth route
  sendAuthError(res, 404, "NOT_FOUND", "Unknown auth endpoint");
  return true;
}

// CORS headers for auth endpoints
export function setAuthCorsHeaders(res: ServerResponse, allowedOrigin: string): void {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");
}

// Handle OPTIONS preflight
export function handleAuthPreflight(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method === "OPTIONS") {
    const path = req.url || "";
    if (path.startsWith("/api/auth/")) {
      res.statusCode = 204;
      res.end();
      return true;
    }
  }
  return false;
}
