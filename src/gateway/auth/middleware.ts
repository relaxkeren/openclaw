import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext, CookieOptions, AuthConfig } from "./types.js";
import { verifyAccessToken, isAuthEnabled } from "./session.js";

const REFRESH_TOKEN_COOKIE = "refresh_token";

// Parse cookies from request headers
export function parseCookies(req: IncomingMessage): Map<string, string> {
  const cookies = new Map<string, string>();
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return cookies;
  }

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [name, ...valueParts] = pair.trim().split("=");
    if (name) {
      const value = valueParts.join("="); // Handle values that contain =
      cookies.set(name, decodeURIComponent(value));
    }
  }

  return cookies;
}

// Get refresh token from cookie
export function getRefreshTokenFromCookie(req: IncomingMessage): string | undefined {
  const cookies = parseCookies(req);
  return cookies.get(REFRESH_TOKEN_COOKIE);
}

// Get access token from Authorization header
export function getAccessTokenFromHeader(req: IncomingMessage): string | undefined {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return undefined;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return undefined;
  }

  return parts[1];
}

// Build auth context from request
export function buildAuthContext(req: IncomingMessage): AuthContext {
  if (!isAuthEnabled()) {
    // Auth is disabled - treat as authenticated for backward compatibility
    return { isAuthenticated: true };
  }

  const accessToken = getAccessTokenFromHeader(req);

  if (!accessToken) {
    return {
      isAuthenticated: false,
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication required",
      },
    };
  }

  const payload = verifyAccessToken(accessToken);

  if (!payload) {
    return {
      isAuthenticated: false,
      error: {
        code: "TOKEN_INVALID",
        message: "Invalid or expired token",
      },
    };
  }

  return {
    isAuthenticated: true,
    email: payload.email,
    sessionId: payload.jti,
  };
}

// Set refresh token cookie
export function setRefreshTokenCookie(
  res: ServerResponse,
  refreshToken: string,
  config: AuthConfig,
): void {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "strict",
    maxAge: config.refreshTokenTtl,
    path: "/",
    domain: config.cookieDomain,
  };

  let cookieValue = `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refreshToken)}`;
  cookieValue += `; Max-Age=${cookieOptions.maxAge}`;
  cookieValue += `; Path=${cookieOptions.path}`;
  cookieValue += `; HttpOnly`;
  cookieValue += `; SameSite=${cookieOptions.sameSite}`;

  if (cookieOptions.secure) {
    cookieValue += `; Secure`;
  }

  if (cookieOptions.domain) {
    cookieValue += `; Domain=${cookieOptions.domain}`;
  }

  const existingCookies = res.getHeader("Set-Cookie");
  if (existingCookies) {
    // Append to existing cookies
    const cookies: string[] = Array.isArray(existingCookies)
      ? existingCookies.map(String)
      : [String(existingCookies)];
    cookies.push(cookieValue);
    res.setHeader("Set-Cookie", cookies);
  } else {
    res.setHeader("Set-Cookie", cookieValue);
  }
}

// Clear refresh token cookie (logout)
export function clearRefreshTokenCookie(res: ServerResponse, config: AuthConfig): void {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "strict",
    maxAge: 0, // Expire immediately
    path: "/",
    domain: config.cookieDomain,
  };

  let cookieValue = `${REFRESH_TOKEN_COOKIE}=`;
  cookieValue += `; Max-Age=0`;
  cookieValue += `; Path=${cookieOptions.path}`;
  cookieValue += `; HttpOnly`;
  cookieValue += `; SameSite=${cookieOptions.sameSite}`;

  if (cookieOptions.secure) {
    cookieValue += `; Secure`;
  }

  if (cookieOptions.domain) {
    cookieValue += `; Domain=${cookieOptions.domain}`;
  }

  const existingCookies = res.getHeader("Set-Cookie");
  if (existingCookies) {
    const cookies: string[] = Array.isArray(existingCookies)
      ? existingCookies.map(String)
      : [String(existingCookies)];
    cookies.push(cookieValue);
    res.setHeader("Set-Cookie", cookies);
  } else {
    res.setHeader("Set-Cookie", cookieValue);
  }
}

// Auth middleware factory
export function createAuthMiddleware() {
  return (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    // Skip auth for certain paths
    const url = req.url || "";
    const publicPaths = ["/api/auth/login", "/api/auth/refresh", "/login", "/assets/"];

    const isPublicPath = publicPaths.some((path) => url.startsWith(path));

    if (isPublicPath) {
      next();
      return;
    }

    // Check if auth is enabled
    if (!isAuthEnabled()) {
      next();
      return;
    }

    // Build auth context
    const authContext = buildAuthContext(req);

    if (!authContext.isAuthenticated) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: authContext.error?.code || "AUTH_REQUIRED",
          message: authContext.error?.message || "Authentication required",
        }),
      );
      return;
    }

    // Attach auth context to request for use in handlers
    (req as IncomingMessage & { authContext: AuthContext }).authContext = authContext;

    next();
  };
}

// Helper to send JSON error response
export function sendAuthError(
  res: ServerResponse,
  statusCode: number,
  code: string,
  message: string,
  retryAfter?: number,
): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");

  if (retryAfter) {
    res.setHeader("Retry-After", String(retryAfter));
  }

  const body: Record<string, unknown> = { error: code, message };
  if (retryAfter) {
    body.retryAfter = retryAfter;
  }

  res.end(JSON.stringify(body));
}

// Helper to send JSON success response
export function sendJsonResponse(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

// Get client IP from request
export function getClientIp(req: IncomingMessage): string {
  // Check for forwarded headers (when behind proxy)
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp;
  }

  // Fall back to socket address
  return req.socket.remoteAddress || "unknown";
}

// Get user agent from request
export function getUserAgent(req: IncomingMessage): string | undefined {
  const ua = req.headers["user-agent"];
  return typeof ua === "string" ? ua : undefined;
}
