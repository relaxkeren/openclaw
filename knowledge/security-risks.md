# Security Risks (Known)

This document records known security risks identified from reviews (e.g. Control UI JWT authentication). See `docs/configuration/auth.md` for auth configuration.

---

## 1. Rate limit bypass via spoofed client IP (High)

**Location**: `src/gateway/auth/middleware.ts` `getClientIp()`, used by `src/gateway/auth/routes.ts` for login and refresh rate limiting.

**Issue**: `getClientIp()` uses `X-Forwarded-For` (first value) or `X-Real-IP` or `socket.remoteAddress`, with **no** check that the connection is from a trusted proxy. So:

- **Direct exposure**: An attacker can send `X-Forwarded-For: 1.2.3.4` (or a different IP per request) and get a new rate-limit bucket per spoofed IP, enabling brute force on login.
- **Behind a proxy**: If the proxy only appends the real IP, the leftmost value may still be attacker-controlled unless the proxy overwrites the header.

**Contrast**: Gateway request handling uses `src/gateway/net.ts` `resolveGatewayClientIp()`, which only uses forwarded headers when the **direct connection** is from a `trustedProxies` address.

**Recommendation**: Use a trusted-proxy–aware client IP for auth rate limiting (e.g. a helper that takes `req` and `trustedProxies`, uses `resolveGatewayClientIp`-style logic). Pass `trustedProxies` from config into auth routes so login/refresh rate limits use the same IP resolution as the rest of the gateway.

---

## 2. Canvas and WS upgrade auth by IP only (Medium)

**Location**: `src/gateway/server-http.ts` `authorizeCanvasRequest()` and `hasAuthorizedWsClientForIp()`.

**Issue**: When session auth is enabled, canvas HTTP and canvas WebSocket upgrade are allowed if:

1. `isLocalDirectRequest(req, trustedProxies)` is true, or
2. Bearer matches gateway token, or
3. `hasAuthorizedWsClientForIp(clients, clientIp)` is true.

There is **no** JWT check for canvas. So once **any** client from IP X has an authorized WebSocket connection (e.g. Control UI with a valid JWT), **any other** request from the same IP can access canvas/WS upgrade without presenting a JWT.

**Risk**: In NAT or corporate proxy environments, many users share one outward IP. One user with an active session could effectively allow others on the same NAT to pass canvas (and possibly canvas WS) auth without their own login.

**Recommendation**: Either document this as an intentional tradeoff (one-session-per-IP for canvas), or when session auth is enabled, require a valid JWT (e.g. `Authorization: Bearer`) for canvas requests unless the request is local. That would align canvas with “remote connections must use JWT” from the auth doc.

---

## 3. WebSocket client object holds auth secrets (Medium)

**Location**: `src/gateway/server/ws-connection/message-handler.ts` (around line 1030): `GatewayWsClient` is built with `connect: connectParams`, and `connectParams` includes `connectParams.auth` (token/password/JWT).

**Issue**: The full connect params (including `auth.token` and `auth.password`) are stored in memory on every connected client. Any code that logs, serializes, or exposes the client object (e.g. debug endpoints, metrics, or admin UIs) could leak JWTs or gateway tokens.

**Recommendation**: Ensure no logging or serialization of `client.connect` (or of `client` including `connect`) to logs, external systems, or user-facing APIs. If client metadata is needed for debugging or status, either omit `connect.auth` or redact it. Optionally, store only non-sensitive connect fields on `GatewayWsClient` and drop `auth` after handshake.

---

## 4. Local bypass and proxy trust (Low – informational)

**Location**: `src/gateway/auth.ts` `isLocalDirectRequest()`, and `src/gateway/server/ws-connection/message-handler.ts` (use of `isLocalClient` for legacy token/password and device nonce).

**Observation**: “Local” is defined as: resolved client IP is loopback, Host is local or `*.ts.net`, and either no forwarded headers or the direct connection is from a trusted proxy. That prevents simple spoofing (e.g. just sending `Host: localhost` from a remote IP). The message-handler also warns when proxy headers come from an untrusted address and when Host is non-local on a loopback connection. No change required; worth keeping in mind for any future “local-only” features.

---

## 5. Dangerous config flags (Low)

**Location**: `src/gateway/server/ws-connection/message-handler.ts` (e.g. `allowInsecureControlUi`, `dangerouslyDisableDeviceAuth`).

**Observation**: These explicitly weaken security (insecure Control UI auth or disabling device auth). Ensure they are documented as dangerous and not enabled by default or by mistake (env/config naming and docs already signal risk).

---

## 6. JWT secret and cookie handling (Low)

**Observation**:

- **JWT secret**: Default is `process.env.AUTH_JWT_SECRET || randomUUID()` in `src/gateway/server.impl.ts`. Restart invalidates all sessions; no predictability. Doc already recommends setting a strong `AUTH_JWT_SECRET` in production.
- **Cookie parsing**: `src/gateway/auth/middleware.ts` `parseCookies()` uses `decodeURIComponent()` on cookie values. Malformed or hostile `Cookie` headers could throw; wrapping in try/catch would avoid 500s and potential information leakage from error messages.

---

## Summary

| Risk                                              | Severity | Mitigation                                                                                                             |
| ------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Rate limit bypass (login/refresh) via IP spoofing | High     | Use trusted-proxy–aware client IP for auth rate limits (align with `resolveGatewayClientIp` / config `trustedProxies`) |
| Canvas/WS auth by IP only (NAT sharing)           | Medium   | Document as intended or require JWT for non-local canvas when session auth is on                                       |
| Client object stores full connect params (auth)   | Medium   | Do not log/serialize `connect.auth`; optionally strip after handshake                                                  |
| Local bypass / proxy trust                        | Low      | No change; design is sound                                                                                             |
| Dangerous config flags                            | Low      | Keep documented and off by default                                                                                     |
| Cookie parsing / JWT secret                       | Low      | Harden cookie parsing; JWT secret default is acceptable                                                                |

Implementing the **high** and **medium** items (rate limit IP resolution, canvas JWT vs IP policy, and safe handling of client connect params) will materially reduce security risk while staying consistent with the auth doc.
