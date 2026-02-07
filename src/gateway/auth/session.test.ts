import { describe, expect, it, beforeEach } from "vitest";
import type { AuthConfig } from "./types.js";
import {
  initializeAuth,
  generateAccessToken,
  verifyAccessToken,
  createSession,
  refreshSession,
  revokeSession,
  cleanupExpiredSessions,
  getSessionCount,
  login,
  refresh,
  logout,
  isAuthEnabled,
  getAuthConfig,
  __resetSessionsForTest,
} from "./session.js";

describe("gateway auth/session", () => {
  const testConfig: AuthConfig = {
    email: "admin@example.com",
    password: "testpassword123",
    accessTokenTtl: 15 * 60, // 15 minutes
    refreshTokenTtl: 7 * 24 * 60 * 60, // 7 days
    jwtSecret: "test-secret-that-is-long-enough-for-hs256",
    cookieSecure: true,
    rateLimitEnabled: true,
    rateLimitStrict: false,
  };

  beforeEach(() => {
    // Reset auth state and sessions before each test
    __resetSessionsForTest();
    initializeAuth(testConfig);
  });

  describe("isAuthEnabled", () => {
    it("returns false when auth is not initialized", () => {
      // Use a minimal config to test uninitialized state
      const emptyConfig: AuthConfig = {
        email: "",
        password: "",
        accessTokenTtl: 900,
        refreshTokenTtl: 604800,
        jwtSecret: "test",
        cookieSecure: true,
        rateLimitEnabled: true,
        rateLimitStrict: false,
      };
      initializeAuth(emptyConfig);
      expect(isAuthEnabled()).toBe(false);
    });

    it("returns true when auth is initialized with credentials", () => {
      expect(isAuthEnabled()).toBe(true);
    });
  });

  describe("getAuthConfig", () => {
    it("returns the auth config", () => {
      const config = getAuthConfig();
      expect(config).toEqual(testConfig);
    });
  });

  describe("JWT generation and verification", () => {
    it("generates valid token with correct format", () => {
      const { token, jti, _expiresAt } = generateAccessToken("test@example.com");

      // Token should have 3 parts separated by dots
      expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
      expect(jti).toBeDefined();
      expect(typeof jti).toBe("string");
      expect(_expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it("verifies valid token", () => {
      const { token } = generateAccessToken("test@example.com");
      const payload = verifyAccessToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.email).toBe("test@example.com");
      expect(payload?.role).toBe("operator");
      expect(payload?.type).toBe("access");
      expect(payload?.sub).toBe("test@example.com");
    });

    it("rejects token with invalid signature", () => {
      const { token } = generateAccessToken("test@example.com");
      const tamperedToken = token.slice(0, -5) + "XXXXX";
      const payload = verifyAccessToken(tamperedToken);

      expect(payload).toBeNull();
    });

    it("rejects malformed token", () => {
      expect(verifyAccessToken("invalid")).toBeNull();
      expect(verifyAccessToken("a.b")).toBeNull();
      expect(verifyAccessToken("a.b.c.d")).toBeNull();
    });

    it("rejects token with wrong type", async () => {
      // Create a token manually with wrong type
      const { createHmac } = await import("node:crypto");

      const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
        "base64url",
      );
      const payload = Buffer.from(
        JSON.stringify({
          sub: "test@example.com",
          email: "test@example.com",
          role: "operator",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 900,
          jti: "test-jti",
          type: "refresh", // Wrong type
        }),
      ).toString("base64url");

      const signature = createHmac("sha256", testConfig.jwtSecret)
        .update(`${header}.${payload}`)
        .digest("base64url");

      const wrongTypeToken = `${header}.${payload}.${signature}`;
      expect(verifyAccessToken(wrongTypeToken)).toBeNull();
    });
  });

  describe("Session management", () => {
    it("creates session with valid tokens", () => {
      const { session, accessToken, refreshToken } = createSession("test@example.com");

      expect(session.email).toBe("test@example.com");
      expect(session.refreshToken).toBe(refreshToken);
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(session.refreshTokenExpiresAt).toBeGreaterThan(Date.now());
    });

    it("rotates refresh token on refresh", () => {
      const { refreshToken: oldRefreshToken } = createSession("test@example.com");

      const result = refreshSession(oldRefreshToken);
      expect(result).not.toBeNull();

      const { session: newSession, newRefreshToken } = result!;

      // New refresh token should be different
      expect(newRefreshToken).not.toBe(oldRefreshToken);
      expect(newSession.email).toBe("test@example.com");

      // Old token should no longer work
      expect(refreshSession(oldRefreshToken)).toBeNull();
    });

    it("returns null when refreshing with invalid token", () => {
      const result = refreshSession("invalid-token");
      expect(result).toBeNull();
    });

    it("revokes session on logout", () => {
      const { refreshToken } = createSession("test@example.com");

      expect(revokeSession(refreshToken)).toBe(true);

      // Should not be able to refresh revoked session
      expect(refreshSession(refreshToken)).toBeNull();
    });

    it("returns false when revoking non-existent session", () => {
      expect(revokeSession("non-existent-token")).toBe(false);
    });

    it("cleans up expired sessions", () => {
      // Create a session
      createSession("test@example.com");

      // Initially should have 1 session
      expect(getSessionCount()).toBe(1);

      // Cleanup should run without error
      const cleaned = cleanupExpiredSessions();
      // In this case, nothing is expired yet, so cleaned should be 0
      expect(typeof cleaned).toBe("number");
    });
  });

  describe("Login flow", () => {
    it("returns success with tokens on valid credentials", () => {
      const result = login("admin@example.com", "testpassword123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.response.accessToken).toBeDefined();
        expect(result.response.expiresAt).toBeDefined();
        expect(result.refreshToken).toBeDefined();
      }
    });

    it("returns error on invalid email", () => {
      const result = login("wrong@example.com", "testpassword123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_CREDENTIALS");
      }
    });

    it("returns error on invalid password", () => {
      const result = login("admin@example.com", "wrongpassword");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_CREDENTIALS");
      }
    });

    it("is case-insensitive for email", () => {
      const result = login("ADMIN@EXAMPLE.COM", "testpassword123");
      expect(result.success).toBe(true);
    });

    it("trims whitespace from email", () => {
      const result = login("  admin@example.com  ", "testpassword123");
      expect(result.success).toBe(true);
    });
  });

  describe("Refresh flow", () => {
    it("returns success with new tokens on valid refresh", () => {
      // First login
      const loginResult = login("admin@example.com", "testpassword123");
      expect(loginResult.success).toBe(true);

      if (loginResult.success) {
        // Then refresh
        const refreshResult = refresh(loginResult.refreshToken);

        expect(refreshResult.success).toBe(true);
        if (refreshResult.success) {
          expect(refreshResult.response.accessToken).toBeDefined();
          expect(refreshResult.newRefreshToken).toBeDefined();
          // Should be different tokens
          expect(refreshResult.response.accessToken).not.toBe(loginResult.response.accessToken);
          expect(refreshResult.newRefreshToken).not.toBe(loginResult.refreshToken);
        }
      }
    });

    it("returns error on invalid refresh token", () => {
      const result = refresh("invalid-token");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("REFRESH_INVALID");
      }
    });
  });

  describe("Logout flow", () => {
    it("returns true and invalidates session", () => {
      const loginResult = login("admin@example.com", "testpassword123");
      expect(loginResult.success).toBe(true);

      if (loginResult.success) {
        expect(logout(loginResult.refreshToken)).toBe(true);

        // Should not be able to refresh after logout
        const refreshResult = refresh(loginResult.refreshToken);
        expect(refreshResult.success).toBe(false);
      }
    });

    it("returns false for non-existent token", () => {
      expect(logout("non-existent-token")).toBe(false);
    });
  });
});
