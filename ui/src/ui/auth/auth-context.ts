import type { AuthState, AuthContextType, AuthError } from "./types.js";
import { loginApi, refreshTokenApi, logoutApi, getCurrentUserApi } from "./auth-service.js";
import {
  createTokenRefreshScheduler,
  setupVisibilityRefresh,
  setGlobalScheduler,
} from "./token-manager.js";

// Initial state
const state: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  expiresAt: null,
  isLoading: true,
  error: null,
  rateLimitCountdown: null,
};

// Listeners for state changes
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

// Create a reactive-like proxy
function createReactiveState<T extends object>(target: T): T {
  return new Proxy(target, {
    set(obj, prop, value) {
      (obj as Record<string, unknown>)[prop as string] = value;
      notifyListeners();
      return true;
    },
  });
}

// Create reactive state
export const authState = createReactiveState<AuthState>(state);

// Subscribe to state changes
export function subscribeAuthState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Token refresh scheduler
const scheduler = createTokenRefreshScheduler(
  async () => {
    return await refreshToken();
  },
  (seconds) => {
    authState.rateLimitCountdown = seconds;
  },
);

setGlobalScheduler(scheduler);

// Visibility refresh cleanup
let visibilityCleanup: (() => void) | null = null;

// Initialize auth state from session (if user has valid refresh token)
export async function initAuth(): Promise<void> {
  authState.isLoading = true;
  notifyListeners();

  try {
    // Try to refresh token - if successful, user was previously logged in
    const success = await refreshToken();

    if (success) {
      // Set up visibility refresh
      if (visibilityCleanup) {
        visibilityCleanup();
      }
      visibilityCleanup = setupVisibilityRefresh(() => {
        // Refresh when tab becomes visible if token is close to expiry
        if (authState.expiresAt && authState.expiresAt - Date.now() < 2 * 60 * 1000) {
          void refreshToken();
        }
      });
    }
  } catch (error) {
    console.error("[auth] Failed to initialize auth:", error);
  } finally {
    authState.isLoading = false;
    notifyListeners();
  }
}

// Login
export async function login(email: string, password: string): Promise<boolean> {
  authState.isLoading = true;
  authState.error = null;
  authState.rateLimitCountdown = null;
  notifyListeners();

  try {
    const result = await loginApi({ email, password });

    if ("code" in result) {
      // It's an error
      authState.error = result;
      authState.isLoading = false;

      // Handle rate limiting
      if (result.code === "RATE_LIMITED" && result.retryAfter) {
        startRateLimitCountdown(result.retryAfter);
      }

      notifyListeners();
      return false;
    }

    // Success - update state
    authState.accessToken = result.accessToken;
    authState.expiresAt = result.expiresAt;
    authState.isAuthenticated = true;

    // Get user info
    const userResult = await getCurrentUserApi(result.accessToken);
    if (!("code" in userResult)) {
      authState.user = userResult;
    }

    // Schedule token refresh
    scheduler.schedule(result.expiresAt);

    authState.isLoading = false;
    notifyListeners();
    return true;
  } catch (error) {
    authState.error = {
      code: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "An error occurred",
    };
    authState.isLoading = false;
    notifyListeners();
    return false;
  }
}

// Refresh token
export async function refreshToken(): Promise<boolean> {
  try {
    const result = await refreshTokenApi();

    if ("code" in result) {
      // It's an error - token is invalid or expired
      if (
        (result.code as string) === "REFRESH_INVALID" ||
        (result.code as string) === "REFRESH_EXPIRED"
      ) {
        // Clear auth state
        clearAuthState();
      }
      return false;
    }

    // Success - update state
    authState.accessToken = result.accessToken;
    authState.expiresAt = result.expiresAt;
    authState.isAuthenticated = true;
    authState.error = null;

    // Get user info
    if (authState.accessToken) {
      const userResult = await getCurrentUserApi(authState.accessToken);
      if (!("code" in userResult)) {
        authState.user = userResult;
      }
    }

    // Schedule next refresh
    scheduler.schedule(result.expiresAt);

    notifyListeners();
    return true;
  } catch (error) {
    console.error("[auth] Token refresh failed:", error);
    return false;
  }
}

// Logout
export async function logout(): Promise<void> {
  // Call logout API to invalidate refresh token
  await logoutApi();

  // Clear local state
  clearAuthState();

  // Clean up visibility handler
  if (visibilityCleanup) {
    visibilityCleanup();
    visibilityCleanup = null;
  }

  notifyListeners();
}

// Clear auth state
function clearAuthState(): void {
  scheduler.cancel();
  authState.isAuthenticated = false;
  authState.user = null;
  authState.accessToken = null;
  authState.expiresAt = null;
  authState.error = null;
  authState.rateLimitCountdown = null;
}

// Clear error
export function clearError(): void {
  authState.error = null;
  authState.rateLimitCountdown = null;
  notifyListeners();
}

// Start rate limit countdown
function startRateLimitCountdown(seconds: number): void {
  authState.rateLimitCountdown = seconds;

  const interval = setInterval(() => {
    if (authState.rateLimitCountdown && authState.rateLimitCountdown > 0) {
      authState.rateLimitCountdown--;
    } else {
      authState.rateLimitCountdown = null;
      clearInterval(interval);
    }
    notifyListeners();
  }, 1000);
}

// Get access token for API calls
export function getAccessToken(): string | null {
  return authState.accessToken;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return authState.isAuthenticated;
}

// Auth context object for Lit components
export const authContext: AuthContextType = {
  get isAuthenticated() {
    return authState.isAuthenticated;
  },
  get user() {
    return authState.user;
  },
  get accessToken() {
    return authState.accessToken;
  },
  get expiresAt() {
    return authState.expiresAt;
  },
  get isLoading() {
    return authState.isLoading;
  },
  get error() {
    return authState.error;
  },
  get rateLimitCountdown() {
    return authState.rateLimitCountdown;
  },
  login,
  logout,
  refreshToken,
  clearError,
};

// Hook for components to access auth state
export function useAuth(): AuthContextType {
  return authContext;
}
