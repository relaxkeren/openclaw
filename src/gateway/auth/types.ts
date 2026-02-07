import type { IncomingMessage, ServerResponse } from "node:http";

// Auth Configuration
export type AuthConfig = {
  email: string;
  password: string;
  accessTokenTtl: number; // seconds
  refreshTokenTtl: number; // seconds
  jwtSecret: string;
  cookieDomain?: string;
  cookieSecure: boolean;
  rateLimitEnabled: boolean;
  rateLimitStrict: boolean;
};

// Session stored in memory
export interface AuthSession {
  id: string;
  email: string;
  refreshToken: string;
  refreshTokenExpiresAt: number; // timestamp
  accessTokenJti: string;
  issuedAt: number; // timestamp
  lastUsedAt: number; // timestamp
  ipAddress?: string;
  userAgent?: string;
}

// JWT Payload
export interface AccessTokenPayload {
  sub: string; // email
  email: string;
  role: "operator";
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
  type: "access";
}

// Auth error codes
export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "REFRESH_EXPIRED"
  | "REFRESH_INVALID"
  | "RATE_LIMITED"
  | "SESSION_REVOKED"
  | "AUTH_REQUIRED"
  | "INTERNAL_ERROR";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  retryAfter?: number; // seconds for rate limiting
}

// Login request/response
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: number; // timestamp
}

// Refresh response
export interface RefreshResponse {
  accessToken: string;
  expiresAt: number; // timestamp
}

// User info response
export interface MeResponse {
  email: string;
  role: string;
}

// Rate limit entry
export interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp
  firstAttemptAt: number; // timestamp
}

// Auth context for requests
export interface AuthContext {
  isAuthenticated: boolean;
  email?: string;
  sessionId?: string;
  error?: AuthError;
}

// Auth middleware function type
export type AuthMiddleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

// Cookie options
export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number; // seconds
  domain?: string;
  path: string;
}
