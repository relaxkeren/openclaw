import type { LoginRequest, LoginResponse, RefreshResponse, AuthUser, AuthError } from "./types.js";

const API_BASE = "/api/auth";

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T | AuthError> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  const error = await response.json().catch(() => ({ error: "UNKNOWN", message: "Unknown error" }));

  const authError: AuthError = {
    code: error.error || "INTERNAL_ERROR",
    message: error.message || "An error occurred",
  };

  if (response.status === 429 && error.retryAfter) {
    authError.retryAfter = error.retryAfter;
  }

  return authError;
}

// Login
export async function loginApi(credentials: LoginRequest): Promise<LoginResponse | AuthError> {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      credentials: "include", // Include cookies for refresh token
    });

    return handleResponse<LoginResponse>(response);
  } catch (error) {
    return {
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

// Refresh token
export async function refreshTokenApi(): Promise<RefreshResponse | AuthError> {
  try {
    const response = await fetch(`${API_BASE}/refresh`, {
      method: "POST",
      credentials: "include", // Include refresh token cookie
    });

    return handleResponse<RefreshResponse>(response);
  } catch (error) {
    return {
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

// Logout
export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore errors on logout
  }
}

// Get current user
export async function getCurrentUserApi(token: string): Promise<AuthUser | AuthError> {
  try {
    const response = await fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<AuthUser>(response);
  } catch (error) {
    return {
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}
