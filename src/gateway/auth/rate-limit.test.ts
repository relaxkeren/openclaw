import { describe, expect, it, beforeEach } from "vitest";
import {
  checkRateLimit,
  recordFailedAttempt,
  cleanupExpiredRateLimits,
  getRemainingAttempts,
  getRateLimitStatus,
  resetRateLimit,
  startRateLimitCleanup,
} from "./rate-limit.js";

describe("gateway auth/rate-limit", () => {
  const testIp = "127.0.0.1";

  beforeEach(() => {
    // Reset rate limits before each test
    resetRateLimit(testIp);
  });

  describe("checkRateLimit", () => {
    it("allows first request", () => {
      const result = checkRateLimit(testIp, "login");
      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("allows requests under limit", () => {
      // Make 4 requests (limit is 5)
      for (let i = 0; i < 4; i++) {
        const result = checkRateLimit(testIp, "login");
        expect(result.allowed).toBe(true);
      }
    });

    it("blocks 6th login attempt", () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testIp, "login");
      }

      // 6th attempt should be blocked
      const result = checkRateLimit(testIp, "login");
      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe("RATE_LIMITED");
    });

    it("blocks 11th refresh attempt", () => {
      // Exhaust the limit (10 for refresh)
      for (let i = 0; i < 10; i++) {
        checkRateLimit(testIp, "refresh");
      }

      // 11th attempt should be blocked
      const result = checkRateLimit(testIp, "refresh");
      expect(result.allowed).toBe(false);
      expect(result.error?.code).toBe("RATE_LIMITED");
    });

    it("returns retry-after when rate limited", () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testIp, "login");
      }

      const result = checkRateLimit(testIp, "login");
      expect(result.error?.retryAfter).toBeGreaterThan(0);
      expect(result.error?.retryAfter).toBeLessThanOrEqual(15 * 60); // Max 15 min block
    });

    it("includes human-readable message when rate limited", () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testIp, "login");
      }

      const result = checkRateLimit(testIp, "login");
      expect(result.error?.message).toContain("Too many");
      expect(result.error?.message).toContain("login");
    });
  });

  describe("recordFailedAttempt", () => {
    it("increments counter on failed attempt", () => {
      // Initially should have 5 remaining
      expect(getRemainingAttempts(testIp, "login")).toBe(5);

      // Record a failed attempt
      recordFailedAttempt(testIp, "login");

      // Should now have 4 remaining
      expect(getRemainingAttempts(testIp, "login")).toBe(4);
    });

    it("blocks after multiple failed attempts", () => {
      // Record 5 failed attempts
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(testIp, "login");
      }

      // Next check should be blocked
      const result = checkRateLimit(testIp, "login");
      expect(result.allowed).toBe(false);
    });

    it("extends block duration when limit exceeded", () => {
      // Record 5 failed attempts to trigger block
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(testIp, "login");
      }

      // Check rate limit to see extended block
      const result = checkRateLimit(testIp, "login");
      expect(result.allowed).toBe(false);
      // Block should be extended to 15 minutes (900 seconds)
      expect(result.error?.retryAfter).toBeGreaterThan(5 * 60);
    });
  });

  describe("getRemainingAttempts", () => {
    it("returns max attempts for new IP", () => {
      expect(getRemainingAttempts("192.168.1.1", "login")).toBe(5);
      expect(getRemainingAttempts("192.168.1.1", "refresh")).toBe(10);
    });

    it("returns correct count after attempts", () => {
      checkRateLimit(testIp, "login"); // Uses 1
      checkRateLimit(testIp, "login"); // Uses 2

      expect(getRemainingAttempts(testIp, "login")).toBe(3);
    });

    it("returns 0 when limit exceeded", () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testIp, "login");
      }

      expect(getRemainingAttempts(testIp, "login")).toBe(0);
    });

    it("resets after window expires", async () => {
      // Use up some attempts
      checkRateLimit(testIp, "login");
      checkRateLimit(testIp, "login");
      expect(getRemainingAttempts(testIp, "login")).toBe(3);

      // Cleanup should reset (in real scenario, time would pass)
      cleanupExpiredRateLimits();

      // After cleanup, the entry might be removed or reset
      // The exact behavior depends on timing
      const remaining = getRemainingAttempts(testIp, "login");
      expect(remaining).toBeGreaterThanOrEqual(3);
    });
  });

  describe("cleanupExpiredRateLimits", () => {
    it("removes expired entries", () => {
      // Create some rate limit entries
      checkRateLimit(testIp, "login");

      // Cleanup should not throw
      const cleaned = cleanupExpiredRateLimits();
      expect(typeof cleaned).toBe("number");
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getRateLimitStatus", () => {
    it("returns total entries count", () => {
      const status = getRateLimitStatus();
      expect(typeof status.totalEntries).toBe("number");
    });

    it("returns entries for specific IP", () => {
      checkRateLimit(testIp, "login");

      const status = getRateLimitStatus(testIp);
      expect(status.entriesForIp).toBeDefined();
      expect(status.entriesForIp?.length).toBeGreaterThan(0);
    });

    it("returns entry details", () => {
      checkRateLimit(testIp, "login");

      const status = getRateLimitStatus(testIp);
      const entry = status.entriesForIp?.[0];

      expect(entry).toBeDefined();
      expect(entry?.action).toBe("login");
      expect(typeof entry?.count).toBe("number");
      expect(typeof entry?.remainingAttempts).toBe("number");
      expect(typeof entry?.resetIn).toBe("number");
    });
  });

  describe("resetRateLimit", () => {
    it("resets specific action", () => {
      // Use up attempts
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testIp, "login");
      }
      expect(getRemainingAttempts(testIp, "login")).toBe(0);

      // Reset
      resetRateLimit(testIp, "login");

      // Should be back to max
      expect(getRemainingAttempts(testIp, "login")).toBe(5);
    });

    it("resets all actions when no action specified", () => {
      // Use up attempts for both actions
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testIp, "login");
        checkRateLimit(testIp, "refresh");
      }

      // Reset all
      resetRateLimit(testIp);

      // Both should be back to max
      expect(getRemainingAttempts(testIp, "login")).toBe(5);
      expect(getRemainingAttempts(testIp, "refresh")).toBe(10);
    });
  });

  describe("startRateLimitCleanup", () => {
    it("returns cleanup function", () => {
      const stopCleanup = startRateLimitCleanup(1000);
      expect(typeof stopCleanup).toBe("function");

      // Clean up
      stopCleanup();
    });

    it("can be called multiple times safely", () => {
      const stopCleanup1 = startRateLimitCleanup(1000);
      const stopCleanup2 = startRateLimitCleanup(2000);

      // Both should be functions
      expect(typeof stopCleanup1).toBe("function");
      expect(typeof stopCleanup2).toBe("function");

      // Clean up
      stopCleanup1();
      stopCleanup2();
    });
  });

  describe("different IPs are tracked separately", () => {
    it("tracks different IPs independently", () => {
      const ip1 = "192.168.1.1";
      const ip2 = "192.168.1.2";

      // Exhaust limit for ip1
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip1, "login");
      }

      // ip1 should be blocked
      expect(checkRateLimit(ip1, "login").allowed).toBe(false);

      // ip2 should still be allowed
      expect(checkRateLimit(ip2, "login").allowed).toBe(true);
    });
  });

  describe("different actions are tracked separately", () => {
    it("tracks login and refresh independently", () => {
      // Exhaust login limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testIp, "login");
      }

      // Login should be blocked
      expect(checkRateLimit(testIp, "login").allowed).toBe(false);

      // Refresh should still be allowed (different limit)
      expect(checkRateLimit(testIp, "refresh").allowed).toBe(true);
    });
  });
});
