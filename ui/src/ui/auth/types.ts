// Auth error codes
export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "REFRESH_EXPIRED"
  | "RATE_LIMITED"
  | "SESSION_REVOKED"
  | "AUTH_REQUIRED"
  | "NETWORK_ERROR"
  | "INTERNAL_ERROR";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  retryAfter?: number;
}

// User info
export interface AuthUser {
  email: string;
  role: string;
}

// Login request/response
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: number;
}

// Refresh response
export interface RefreshResponse {
  accessToken: string;
  expiresAt: number;
}

// Auth state
export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  expiresAt: number | null;
  isLoading: boolean;
  error: AuthError | null;
  rateLimitCountdown: number | null;
}

// Auth context type
export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
}

// Token refresh scheduler
export interface TokenRefreshScheduler {
  schedule: (expiresAt: number) => void;
  cancel: () => void;
  isScheduled: () => boolean;
}

// Auth configuration
export interface AuthConfig {
  apiBaseUrl: string;
}
