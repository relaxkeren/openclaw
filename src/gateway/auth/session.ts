import { randomUUID, timingSafeEqual, createHmac } from "node:crypto";
import type {
  AccessTokenPayload,
  AuthConfig,
  AuthSession,
  LoginResponse,
  RefreshResponse,
  AuthError,
} from "./types.js";

// In-memory session store
const sessions = new Map<string, AuthSession>();

// Track access token JTI to session mapping (for revocation)
const accessTokenJtiToSession = new Map<string, string>();

let config: AuthConfig | null = null;

export function initializeAuth(authConfig: AuthConfig): void {
  config = authConfig;
}

export function getAuthConfig(): AuthConfig | null {
  return config;
}

export function isAuthEnabled(): boolean {
  if (!config) {
    return false;
  }
  return config.email.length > 0 && config.password.length > 0;
}

// Validate credentials against configured email/password
export function validateCredentials(email: string, password: string): boolean {
  if (!config) {
    return false;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedConfigEmail = config.email.toLowerCase().trim();

  if (normalizedEmail.length !== normalizedConfigEmail.length) {
    return false;
  }

  const emailMatch = timingSafeEqual(
    Buffer.from(normalizedEmail),
    Buffer.from(normalizedConfigEmail),
  );

  if (!emailMatch) {
    return false;
  }

  if (password.length !== config.password.length) {
    return false;
  }

  const passwordMatch = timingSafeEqual(Buffer.from(password), Buffer.from(config.password));

  return passwordMatch;
}

// Base64 URL encoding (JWT standard)
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Create JWT signature using HMAC-SHA256
function createJwtSignature(header: string, payload: string, secret: string): string {
  const data = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return signature;
}

// Generate access token (JWT) without external library
export function generateAccessToken(email: string): {
  token: string;
  jti: string;
  _expiresAt: number;
} {
  if (!config) {
    throw new Error("Auth not initialized");
  }

  const jti = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const _expiresAt = now + config.accessTokenTtl;

  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: email,
      email,
      role: "operator",
      iat: now,
      exp: _expiresAt,
      jti,
      type: "access",
    }),
  );

  const signature = createJwtSignature(header, payload, config.jwtSecret);
  const token = `${header}.${payload}.${signature}`;

  return { token, jti, _expiresAt };
}

// Verify access token without external library
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  if (!config) {
    return null;
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signature] = parts;

    // Verify signature
    const expectedSignature = createJwtSignature(headerB64, payloadB64, config.jwtSecret);
    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
    ) as AccessTokenPayload;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    // Verify it's an access token
    if (payload.type !== "access") {
      return null;
    }

    // Check if token has been revoked
    if (accessTokenJtiToSession.has(payload.jti)) {
      const sessionId = accessTokenJtiToSession.get(payload.jti);
      const session = sessionId ? sessions.get(sessionId) : undefined;
      if (!session) {
        // Session was deleted, token is revoked
        return null;
      }
    }

    return payload;
  } catch {
    return null;
  }
}

// Generate refresh token (opaque UUID)
export function generateRefreshToken(): string {
  return randomUUID();
}

// Create a new session
export function createSession(
  email: string,
  ipAddress?: string,
  userAgent?: string,
): { session: AuthSession; accessToken: string; refreshToken: string } {
  if (!config) {
    throw new Error("Auth not initialized");
  }

  const refreshToken = generateRefreshToken();
  const { token: accessToken, jti } = generateAccessToken(email);
  const now = Date.now();

  const session: AuthSession = {
    id: randomUUID(),
    email,
    refreshToken,
    refreshTokenExpiresAt: now + config.refreshTokenTtl * 1000,
    accessTokenJti: jti,
    issuedAt: now,
    lastUsedAt: now,
    ipAddress,
    userAgent,
  };

  sessions.set(refreshToken, session);
  accessTokenJtiToSession.set(jti, session.id);

  return { session, accessToken, refreshToken };
}

// Refresh session with new tokens
export function refreshSession(
  refreshToken: string,
  ipAddress?: string,
  userAgent?: string,
): { session: AuthSession; accessToken: string; newRefreshToken: string } | null {
  if (!config) {
    return null;
  }

  const session = sessions.get(refreshToken);
  if (!session) {
    return null;
  }

  // Check if refresh token is expired
  if (Date.now() > session.refreshTokenExpiresAt) {
    sessions.delete(refreshToken);
    accessTokenJtiToSession.delete(session.accessTokenJti);
    return null;
  }

  // Remove old session data
  sessions.delete(refreshToken);
  accessTokenJtiToSession.delete(session.accessTokenJti);

  // Create new tokens (token rotation)
  const newRefreshToken = generateRefreshToken();
  const { token: accessToken, jti } = generateAccessToken(session.email);
  const now = Date.now();

  const newSession: AuthSession = {
    id: session.id, // Keep same session ID
    email: session.email,
    refreshToken: newRefreshToken,
    refreshTokenExpiresAt: now + config.refreshTokenTtl * 1000,
    accessTokenJti: jti,
    issuedAt: session.issuedAt, // Keep original issue time
    lastUsedAt: now,
    ipAddress: ipAddress ?? session.ipAddress,
    userAgent: userAgent ?? session.userAgent,
  };

  sessions.set(newRefreshToken, newSession);
  accessTokenJtiToSession.set(jti, newSession.id);

  return { session: newSession, accessToken, newRefreshToken };
}

// Revoke a session
export function revokeSession(refreshToken: string): boolean {
  const session = sessions.get(refreshToken);
  if (!session) {
    return false;
  }

  sessions.delete(refreshToken);
  accessTokenJtiToSession.delete(session.accessTokenJti);
  return true;
}

// Revoke all sessions for a user (logout everywhere)
export function revokeAllUserSessions(email: string): number {
  let count = 0;
  for (const [token, session] of sessions.entries()) {
    if (session.email === email) {
      sessions.delete(token);
      accessTokenJtiToSession.delete(session.accessTokenJti);
      count++;
    }
  }
  return count;
}

// Get session by refresh token
export function getSession(refreshToken: string): AuthSession | undefined {
  return sessions.get(refreshToken);
}

// Cleanup expired sessions (call periodically)
export function cleanupExpiredSessions(): number {
  const now = Date.now();
  let count = 0;

  for (const [token, session] of sessions.entries()) {
    if (now > session.refreshTokenExpiresAt) {
      sessions.delete(token);
      accessTokenJtiToSession.delete(session.accessTokenJti);
      count++;
    }
  }

  return count;
}

// Get session count (for monitoring)
export function getSessionCount(): number {
  return sessions.size;
}

// Login handler
export type LoginResult =
  | { success: true; response: LoginResponse; refreshToken: string }
  | { success: false; error: AuthError };

export function login(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string,
): LoginResult {
  if (!validateCredentials(email, password)) {
    return {
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    };
  }

  const { session, accessToken, refreshToken } = createSession(email, ipAddress, userAgent);

  return {
    success: true,
    response: {
      accessToken,
      expiresAt: session.refreshTokenExpiresAt,
    },
    refreshToken,
  };
}

// Refresh handler
export type RefreshResult =
  | { success: true; response: RefreshResponse; newRefreshToken: string }
  | { success: false; error: AuthError };

export function refresh(
  refreshToken: string,
  ipAddress?: string,
  userAgent?: string,
): RefreshResult {
  const result = refreshSession(refreshToken, ipAddress, userAgent);

  if (!result) {
    return {
      success: false,
      error: {
        code: "REFRESH_INVALID",
        message: "Invalid or expired session",
      },
    };
  }

  const { session, accessToken, newRefreshToken } = result;

  return {
    success: true,
    response: {
      accessToken,
      expiresAt: session.refreshTokenExpiresAt,
    },
    newRefreshToken,
  };
}

// Logout handler
export function logout(refreshToken: string): boolean {
  return revokeSession(refreshToken);
}

// Start cleanup interval (call once on server start)
export function startSessionCleanup(intervalMs = 60 * 60 * 1000): () => void {
  const interval = setInterval(() => {
    const cleaned = cleanupExpiredSessions();
    if (cleaned > 0) {
      console.log(`[auth] Cleaned up ${cleaned} expired sessions`);
    }
  }, intervalMs);

  return () => clearInterval(interval);
}

// Reset all sessions (for testing only)
export function __resetSessionsForTest(): void {
  sessions.clear();
  accessTokenJtiToSession.clear();
}
