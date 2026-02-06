import type { RateLimitEntry, AuthError } from "./types.js";

// Rate limit configuration
const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDurationMs: 15 * 60 * 1000, // 15 minutes block after limit
  },
  refresh: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000, // 5 minutes block
  },
};

// In-memory rate limit store: Map<clientIP + action, RateLimitEntry>
const rateLimits = new Map<string, RateLimitEntry>();

// Cleanup interval reference
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

// Generate rate limit key
function getRateLimitKey(ip: string, action: "login" | "refresh"): string {
  return `${ip}:${action}`;
}

// Check if request should be rate limited
export function checkRateLimit(
  ip: string,
  action: "login" | "refresh",
): { allowed: boolean; error?: AuthError } {
  const key = getRateLimitKey(ip, action);
  const now = Date.now();
  const config = RATE_LIMITS[action];

  const entry = rateLimits.get(key);

  // No entry exists - allow and create entry
  if (!entry) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
      firstAttemptAt: now,
    });
    return { allowed: true };
  }

  // Entry expired - reset and allow
  if (now > entry.resetAt) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
      firstAttemptAt: now,
    });
    return { allowed: true };
  }

  // Check if currently blocked
  const isBlocked = entry.count >= config.maxAttempts;
  if (isBlocked) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many ${action} attempts. Please try again in ${formatDuration(retryAfter)}.`,
        retryAfter,
      },
    };
  }

  // Increment counter
  entry.count++;
  return { allowed: true };
}

// Record failed attempt (increment counter more aggressively)
export function recordFailedAttempt(ip: string, action: "login" | "refresh"): void {
  const key = getRateLimitKey(ip, action);
  const now = Date.now();
  const config = RATE_LIMITS[action];

  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
      firstAttemptAt: now,
    });
  } else {
    entry.count++;
    // If exceeded limit, extend block duration
    if (entry.count >= config.maxAttempts) {
      entry.resetAt = now + config.blockDurationMs;
    }
  }
}

// Format duration for human-readable message
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
  const hours = Math.ceil(seconds / 3600);
  return `${hours} hour${hours > 1 ? "s" : ""}`;
}

// Get remaining attempts for client
export function getRemainingAttempts(ip: string, action: "login" | "refresh"): number {
  const key = getRateLimitKey(ip, action);
  const config = RATE_LIMITS[action];
  const entry = rateLimits.get(key);

  if (!entry) {
    return config.maxAttempts;
  }

  if (Date.now() > entry.resetAt) {
    return config.maxAttempts;
  }

  return Math.max(0, config.maxAttempts - entry.count);
}

// Cleanup expired entries
export function cleanupExpiredRateLimits(): number {
  const now = Date.now();
  let count = 0;

  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) {
      rateLimits.delete(key);
      count++;
    }
  }

  return count;
}

// Start automatic cleanup
export function startRateLimitCleanup(intervalMs = 10 * 60 * 1000): () => void {
  // Clear any existing interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  cleanupInterval = setInterval(() => {
    const cleaned = cleanupExpiredRateLimits();
    if (cleaned > 0) {
      console.log(`[auth] Cleaned up ${cleaned} expired rate limit entries`);
    }
  }, intervalMs);

  return () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  };
}

// Get rate limit status for debugging/monitoring
export function getRateLimitStatus(ip?: string): {
  totalEntries: number;
  entriesForIp?: Array<{
    action: string;
    count: number;
    remainingAttempts: number;
    resetIn: number;
  }>;
} {
  if (ip) {
    const entries = [];
    for (const action of ["login", "refresh"] as const) {
      const key = getRateLimitKey(ip, action);
      const entry = rateLimits.get(key);
      if (entry) {
        entries.push({
          action,
          count: entry.count,
          remainingAttempts: getRemainingAttempts(ip, action),
          resetIn: Math.max(0, entry.resetAt - Date.now()),
        });
      }
    }
    return { totalEntries: rateLimits.size, entriesForIp: entries };
  }

  return { totalEntries: rateLimits.size };
}

// Reset rate limit for an IP (useful for testing or admin actions)
export function resetRateLimit(ip: string, action?: "login" | "refresh"): void {
  if (action) {
    const key = getRateLimitKey(ip, action);
    rateLimits.delete(key);
  } else {
    // Reset all actions for this IP
    for (const a of ["login", "refresh"] as const) {
      const key = getRateLimitKey(ip, a);
      rateLimits.delete(key);
    }
  }
}

// Reset all rate limits (for testing only)
export function __resetAllRateLimitsForTest(): void {
  rateLimits.clear();
}
