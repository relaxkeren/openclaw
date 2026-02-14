/**
 * Cross-tab auth state synchronization.
 * Uses BroadcastChannel when available; falls back to storage events (no token in storage).
 */

export type AuthSyncMessage =
  | { type: "LOGIN"; payload: { accessToken: string; expiresAt: number } }
  | { type: "LOGOUT" }
  | { type: "TOKEN_REFRESH"; payload: { accessToken: string; expiresAt: number } };

const CHANNEL_NAME = "openclaw-auth";
const STORAGE_KEY = "openclaw.auth.sync";

type AuthSyncCallback = (msg: AuthSyncMessage) => void;

let channel: BroadcastChannel | null = null;
let storageUnsubscribe: (() => void) | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") {
    return null;
  }
  try {
    return new BroadcastChannel(CHANNEL_NAME);
  } catch {
    return null;
  }
}

/**
 * Subscribe to auth sync messages from other tabs.
 * Returns an unsubscribe function.
 * BroadcastChannel is used when available; otherwise storage events are used
 * (only type is broadcast, no token; receiver should call refreshToken() for LOGIN/TOKEN_REFRESH).
 */
export function subscribeToAuthSync(callback: AuthSyncCallback): () => void {
  const ch = getChannel();
  if (ch) {
    channel = ch;
    const handler = (ev: MessageEvent<AuthSyncMessage>) => {
      callback(ev.data);
    };
    channel.addEventListener("message", handler);
    return () => {
      channel?.removeEventListener("message", handler);
      channel?.close();
      channel = null;
    };
  }

  // Fallback: storage event (same origin, other tabs only). We only write type; no token in storage.
  const handler = (ev: StorageEvent) => {
    if (ev.key !== STORAGE_KEY || ev.newValue == null) {
      return;
    }
    try {
      const parsed = JSON.parse(ev.newValue) as { type: string };
      if (parsed.type === "LOGIN" || parsed.type === "TOKEN_REFRESH") {
        callback({ type: parsed.type, payload: { accessToken: "", expiresAt: 0 } });
      } else if (parsed.type === "LOGOUT") {
        callback({ type: "LOGOUT" });
      }
    } catch {
      // ignore
    }
  };
  window.addEventListener("storage", handler);
  storageUnsubscribe = () => {
    window.removeEventListener("storage", handler);
    storageUnsubscribe = null;
  };
  return storageUnsubscribe;
}

/**
 * Broadcast login to other tabs (BroadcastChannel only; payload included).
 * For storage fallback we write type only; other tabs will refresh to get token.
 */
export function broadcastLogin(accessToken: string, expiresAt: number): void {
  const ch = getChannel();
  if (ch) {
    ch.postMessage({
      type: "LOGIN",
      payload: { accessToken, expiresAt },
    } satisfies AuthSyncMessage);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: "LOGIN", ts: Date.now() }));
  } catch {
    // ignore
  }
}

/**
 * Broadcast logout to other tabs.
 */
export function broadcastLogout(): void {
  const ch = getChannel();
  if (ch) {
    ch.postMessage({ type: "LOGOUT" } satisfies AuthSyncMessage);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: "LOGOUT", ts: Date.now() }));
  } catch {
    // ignore
  }
}

/**
 * Broadcast token refresh to other tabs (BroadcastChannel only; payload included).
 */
export function broadcastTokenRefresh(accessToken: string, expiresAt: number): void {
  const ch = getChannel();
  if (ch) {
    ch.postMessage({
      type: "TOKEN_REFRESH",
      payload: { accessToken, expiresAt },
    } satisfies AuthSyncMessage);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: "TOKEN_REFRESH", ts: Date.now() }));
  } catch {
    // ignore
  }
}
