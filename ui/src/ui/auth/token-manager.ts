import type { TokenRefreshScheduler } from "./types.js";

// Refresh 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

let refreshCallback: (() => Promise<boolean>) | null = null;
let scheduledTimeout: ReturnType<typeof setTimeout> | null = null;
let countdownInterval: ReturnType<typeof setInterval> | null = null;
let countdownListeners: Array<(seconds: number | null) => void> = [];

// Set the refresh callback function
export function setRefreshCallback(callback: () => Promise<boolean>): void {
  refreshCallback = callback;
}

// Notify countdown listeners
function notifyCountdownListeners(seconds: number | null): void {
  for (const listener of countdownListeners) {
    listener(seconds);
  }
}

// Subscribe to countdown updates
export function onCountdownUpdate(callback: (seconds: number | null) => void): () => void {
  countdownListeners.push(callback);
  return () => {
    const index = countdownListeners.indexOf(callback);
    if (index > -1) {
      countdownListeners.splice(index, 1);
    }
  };
}

// Schedule token refresh
export function scheduleTokenRefresh(expiresAt: number): void {
  // Cancel any existing scheduled refresh
  cancelScheduledRefresh();

  const now = Date.now();
  const delay = expiresAt - now - REFRESH_BUFFER_MS;

  if (delay <= 0) {
    // Token is already expired or will expire soon, refresh immediately
    void performRefresh();
    return;
  }

  // Schedule the refresh
  scheduledTimeout = setTimeout(() => {
    void performRefresh();
  }, delay);

  // Start countdown for rate limit UI
  const totalSeconds = Math.ceil(delay / 1000);
  let remainingSeconds = totalSeconds;

  notifyCountdownListeners(remainingSeconds);

  countdownInterval = setInterval(() => {
    remainingSeconds--;
    notifyCountdownListeners(remainingSeconds);

    if (remainingSeconds <= 0) {
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      notifyCountdownListeners(null);
    }
  }, 1000);
}

// Cancel scheduled refresh
export function cancelScheduledRefresh(): void {
  if (scheduledTimeout) {
    clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  notifyCountdownListeners(null);
}

// Check if a refresh is scheduled
export function isRefreshScheduled(): boolean {
  return scheduledTimeout !== null;
}

// Perform the actual refresh
async function performRefresh(): Promise<void> {
  if (!refreshCallback) {
    console.warn("[auth] No refresh callback set");
    return;
  }

  try {
    const success = await refreshCallback();
    if (!success) {
      console.warn("[auth] Token refresh failed");
    }
  } catch (error) {
    console.error("[auth] Error during token refresh:", error);
  }
}

// Handle visibility change - refresh when tab becomes active
export function setupVisibilityRefresh(onVisible: () => void): () => void {
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      onVisible();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}

// Create scheduler instance for a specific auth context
export function createTokenRefreshScheduler(
  refreshFn: () => Promise<boolean>,
  onCountdown?: (seconds: number | null) => void,
): TokenRefreshScheduler {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const schedule = (expiresAt: number) => {
    cancel();

    const now = Date.now();
    const delay = expiresAt - now - REFRESH_BUFFER_MS;

    if (delay <= 0) {
      void refreshFn();
      return;
    }

    timeoutId = setTimeout(() => {
      void refreshFn();
    }, delay);

    if (onCountdown) {
      let remainingSeconds = Math.ceil(delay / 1000);
      onCountdown(remainingSeconds);

      intervalId = setInterval(() => {
        remainingSeconds--;
        onCountdown(remainingSeconds > 0 ? remainingSeconds : null);

        if (remainingSeconds <= 0 && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 1000);
    }
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    onCountdown?.(null);
  };

  const isScheduled = () => timeoutId !== null;

  return { schedule, cancel, isScheduled };
}

// Global scheduler instance
let globalScheduler: TokenRefreshScheduler | null = null;

export function getGlobalScheduler(): TokenRefreshScheduler | null {
  return globalScheduler;
}

export function setGlobalScheduler(scheduler: TokenRefreshScheduler): void {
  globalScheduler = scheduler;
}
