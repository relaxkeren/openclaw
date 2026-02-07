# Control UI Authentication Design Spec

## Overview

This document describes the authentication mechanism for the OpenClaw Control UI using the **Split Token Pattern** (industry gold standard for SPA authentication).

## Goals

- Secure email/password authentication for Control UI access
- Protection against XSS, CSRF, and token theft
- Simple deployment (credentials via environment variables)
- Seamless user experience with automatic token refresh
- No breaking changes to existing WebSocket RPC architecture

---

## Split Token Pattern

The Split Token Pattern separates authentication into two tokens:

### 1. Access Token (Short-lived JWT)

- **Storage**: Browser memory only (never localStorage/cookies)
- **Lifetime**: 15 minutes
- **Contents**: User identity, permissions, expiration
- **Transport**: HTTP `Authorization: Bearer <token>` header and WebSocket auth
- **Algorithm**: HS256 (HMAC-SHA256)

### 2. Refresh Token (Long-lived Opaque Token)

- **Storage**: HttpOnly, SameSite=Strict, Secure cookie
- **Lifetime**: 7 days (configurable)
- **Contents**: Random opaque string (UUID) mapping to server-side session
- **Transport**: Automatically sent by browser with cookie

### Security Benefits

| Threat              | Protection                                       |
| ------------------- | ------------------------------------------------ |
| XSS stealing tokens | Access token in memory, refresh token httpOnly   |
| CSRF attacks        | SameSite=Strict cookies                          |
| Token interception  | Short-lived access tokens, automatic refresh     |
| Replay attacks      | Token binding to session, rotation on refresh    |
| Logout issues       | Server can invalidate refresh tokens immediately |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Control UI SPA                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Login View   │  │ Auth Context │  │ Protected Routes     │  │
│  │              │  │ (in-memory   │  │ (check auth state)   │  │
│  │ - Email      │  │  access      │  │                      │  │
│  │ - Password   │  │  token)      │  │                      │  │
│  │ - Submit     │  │              │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                      │
│         └─────────────────┘                                      │
│                    │                                             │
│    ┌───────────────┴───────────────┐                            │
│    │  Token Refresh (background)  │                            │
│    │  - 1 min before expiry       │                            │
│    │  - Silent iframe/promise     │                            │
│    └───────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP / WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                         Gateway Server                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  HTTP Middleware Stack                                     ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  ││
│  │  │ CORS     │ │ Cookie   │ │ Auth     │ │ Static/      │  ││
│  │  │ Setup    │ │ Parser   │ │ Check    │ │ API Routes   │  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  WebSocket Auth Layer                                      ││
│  │  - Verify access token in connect.auth.token               ││
│  │  - Fallback: check httpOnly cookie for refresh flow       ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Auth Service (src/gateway/auth/session.ts)                ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      ││
│  │  │ Credential   │  │ Token        │  │ Session      │      ││
│  │  │ Validation   │  │ Generation   │  │ Management   │      ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘      ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Session Store (in-memory, per-gateway)                    ││
│  │  Map<refreshToken, { userId, email, expiresAt, issuedAt }> ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow Diagrams

### 1. Login Flow

```
User                    Control UI              Gateway
 │                          │                      │
 │  Enter credentials       │                      │
 │─────────────────────────>│                      │
 │                          │  POST /api/auth/login│
 │                          │  { email, password } │
 │                          │─────────────────────>│
 │                          │                      │
 │                          │                      │  Validate against
 │                          │                      │  AUTH_EMAIL/PASSWORD
 │                          │                      │
 │                          │  200 OK              │
 │                          │  Set-Cookie:         │
 │                          │    refresh_token=... │
 │                          │    (httpOnly,        │
 │                          │     SameSite=Strict) │
 │                          │  Body:               │
 │                          │  { accessToken }     │
 │                          │<─────────────────────│
 │                          │                      │
 │  Store in memory         │                      │
 │  Redirect to app         │                      │
 │<─────────────────────────│                      │
 │                          │                      │
```

### 2. Authenticated Request Flow (HTTP)

```
Control UI              Gateway
     │                      │
     │  GET /api/config     │
     │  Authorization:      │
     │    Bearer <token>    │
     │─────────────────────>│
     │                      │
     │                      │  Verify JWT signature
     │                      │  Check expiration
     │                      │
     │  200 OK              │
     │  { config }          │
     │<─────────────────────│
     │                      │
```

### 3. Token Refresh Flow

```
Control UI              Gateway
     │                      │
     │  POST /api/auth/refresh
     │  (cookie sent auto)  │
     │─────────────────────>│
     │                      │
     │                      │  Validate refresh token
     │                      │  Lookup session
     │                      │  Generate new tokens
     │                      │
     │  200 OK              │
     │  Set-Cookie:         │
     │    refresh_token=... │
     │    (new token,       │
     │     rotation)        │
     │  Body:               │
     │  { accessToken }     │
     │<─────────────────────│
     │                      │
```

### 4. WebSocket Connection Flow

```
Control UI              Gateway
     │                      │
     │  WS CONNECT          │
     │  query: ?token=...   │
     │  OR header           │
     │─────────────────────>│
     │                      │
     │                      │  Verify access token
     │                      │  from query param
     │                      │
     │  connect.challenge   │
     │<─────────────────────│
     │                      │
     │  connect {           │
     │    auth: {           │
     │      token: "..."    │
     │    }                 │
     │  }                   │
     │─────────────────────>│
     │                      │
     │  hello-ok            │
     │<─────────────────────│
     │                      │
```

---

## Existing Token/Password Authentication (Current Implementation)

### Overview

The current authentication system uses **shared secrets** (token or password) configured via environment variables or config file. Unlike the Split Token Pattern design above, this is a simpler system without user identity or session management.

**Key Security Behavior:**

- **HTTP requests are unauthenticated** - The Control UI static files (HTML/JS/CSS) are served without any authentication check
- **Authentication happens at the WebSocket level** - The token is validated during the WebSocket handshake, not when loading the page
- **Localhost bypass** - Connections from 127.0.0.1/localhost bypass authentication entirely

### Configuration

```bash
# Environment variables (checked in order)
OPENCLAW_GATEWAY_TOKEN=<shared-secret>
OPENCLAW_GATEWAY_PASSWORD=<shared-password>

# Or config file
{
  "gateway": {
    "auth": {
      "token": "<shared-secret>",
      "password": "<shared-password>",
      "mode": "token",  // or "password"
      "allowTailscale": true
    },
    "controlUi": {
      "allowInsecureAuth": false,        // Allow token-only over HTTP (DANGEROUS)
      "dangerouslyDisableDeviceAuth": false  // Skip device identity (DANGEROUS)
    }
  }
}
```

### Auth Modes

| Mode          | Configuration                                          | How It Works                                                              |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| **Token**     | `OPENCLAW_GATEWAY_TOKEN` or `gateway.auth.token`       | Client sends token in WebSocket `connect` frame auth field                |
| **Password**  | `OPENCLAW_GATEWAY_PASSWORD` or `gateway.auth.password` | Same as token but uses password field                                     |
| **Tailscale** | `allowTailscale: true` + Tailscale Serve headers       | Validates Tailscale identity via whois lookup; bypasses token requirement |

### The Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTROL UI TOKEN FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│  TOKEN SOURCES   │     │  STORAGE         │     │  WEBSOCKET HANDSHAKE     │
│                  │     │                  │     │                          │
│ 1. URL param     │     │  localStorage    │     │  1. WS CONNECT           │
│    ?token=xxx    │────▶│  KEY:            │────▶│     (no auth yet)        │
│                  │     │  "openclaw.      │     │                          │
│ 2. Manual input  │     │  control.        │     │  2. Server sends         │
│    Settings UI   │     │  settings.v1"    │     │     connect.challenge    │
│                  │     │                  │     │                          │
│ 3. Saved session │     │  Fields:         │     │  3. Client sends connect │
│    (localStorage)│     │  - token         │────▶│     {                    │
│                  │     │  - gatewayUrl    │     │       auth: {            │
└──────────────────┘     │  - sessionKey    │     │         token: "..."     │
                         │  - theme         │     │       },                 │
                         └──────────────────┘     │       device: {...}      │
                                                  │     }                    │
                                                  │                          │
┌──────────────────────────────────────────────────────────────────────────┐
│  SERVER-SIDE VALIDATION                                                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  isLocalDirectRequest(req)?                                      │   │
│  │  ├─ YES (127.0.0.1/localhost) → Skip auth, allow connection      │   │
│  │  └─ NO (remote client) → Continue validation                     │   │
│  │                                                                  │   │
│  │  Check gateway.auth.token matches connect.auth.token             │   │
│  │  ├─ MISMATCH → Reject with "unauthorized: gateway token mismatch"│   │
│  │  └─ MATCH → Continue to device identity check                    │   │
│  │                                                                  │   │
│  │  Device identity required?                                       │   │
│  │  ├─ YES (secure context, HTTPS) → Verify Ed25519 signature       │   │
│  │  └─ NO (allowInsecureAuth=true) → Skip device check              │   │
│  │                                                                  │   │
│  │  All checks pass → Send hello-ok                                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### How Users Provide the Token

Users must provide the shared secret token through one of two methods:

#### Method 1: URL Parameter (One-time)

Users can pass the token via URL query parameter:

```
http://localhost:51442/?token=YOUR_SECRET_TOKEN
```

**Implementation Details:**

- **Code Location**: `ui/src/ui/app-settings.ts:85-98` in function `applySettingsFromUrl()`
- **Extraction**: Token is read from `window.location.search` using `URLSearchParams.get("token")`
- **Security Behavior**:
  - Token is **immediately removed from URL** to prevent it from being visible in browser history or shared links
  - URL is cleaned via `window.history.replaceState()` (line 135)
  - **Important**: URL token does **NOT** override or save to stored settings (line 95-98 just deletes it)

**Example Code Flow**:

```typescript
// ui/src/ui/app-settings.ts
const params = new URLSearchParams(window.location.search);
const tokenRaw = params.get("token"); // Extract from URL

if (tokenRaw != null) {
  params.delete("token"); // Remove from URL immediately
  shouldCleanUrl = true;
  // Note: tokenRaw is NOT saved to settings here
}

// Clean URL so token is not in browser history
if (shouldCleanUrl) {
  window.history.replaceState({}, "", url.toString());
}
```

#### Method 2: Settings UI (Persistent)

Users enter the token in the Control UI settings panel:

- **Location**: Overview/Settings tab → "Gateway Token" input field
- **Code Location**: `ui/src/ui/views/overview.ts:140-148`
- **Placeholder Text**: "OPENCLAW_GATEWAY_TOKEN"
- **Storage**: Saved to `localStorage` under key `"openclaw.control.settings.v1"` (field: `token`)
- **Persistence**: Token persists across browser sessions until manually cleared

**Settings UI Code**:

```typescript
// ui/src/ui/views/overview.ts
<label class="field">
  <span>Gateway Token</span>
  <input
    .value=${props.settings.token}
    @input=${(e: Event) => {
      const v = (e.target as HTMLInputElement).value;
      props.onSettingsChange({ ...props.settings, token: v });
    }}
    placeholder="OPENCLAW_GATEWAY_TOKEN"
  />
</label>
```

#### Token vs Password Handling

| Aspect                       | Token        | Password             |
| ---------------------------- | ------------ | -------------------- |
| URL parameter                | `?token=xxx` | `?password=xxx`      |
| Saved to localStorage        | **Yes**      | **No** (memory only) |
| URL param overrides settings | **No**       | **No**               |
| Displayed in UI              | Yes (masked) | No (type="password") |
| Security level               | Persistent   | Session-only         |

**Important Distinction**:

- **Token**: Saved to localStorage for convenience; reused across sessions
- **Password**: Stored only in memory (`host.password`), never persisted; must be re-entered each session

#### Token Priority Order

When the Control UI connects to the gateway, it uses the first available token:

1. **Device Auth Token** (if previously paired): `loadDeviceAuthToken()` from `ui/src/ui/device-auth.ts`
2. **Settings Token**: `host.settings.token` from localStorage
3. **No Token**: Connection will fail for non-localhost (unless `allowInsecureAuth`)

### Localhost Bypass Explained

The gateway automatically trusts localhost connections via `isLocalDirectRequest()`:

```typescript
// Returns true for:
// - Client IP: 127.0.0.1, ::1, or 127.x.x.x
// - Host header: localhost, 127.0.0.1, ::1, or *.ts.net
// - No untrusted proxy headers present
```

**Security Implications:**

- Running on `http://localhost:51442/` requires **no authentication**
- The Control UI loads and works immediately without entering a token
- This is why you see no login page on localhost

### When is Authentication Required?

| Scenario                              | Auth Required? | Device Identity?                 | Notes                      |
| ------------------------------------- | -------------- | -------------------------------- | -------------------------- |
| `gateway.bind: "loopback"` (default)  | No (bypassed)  | No                               | Only localhost access      |
| `gateway.bind: "lan"` or `"auto"`     | **Yes**        | Yes (unless `allowInsecureAuth`) | Exposed to network         |
| `gateway.bind: "tailnet"`             | Via Tailscale  | No                               | Uses Tailscale identity    |
| HTTPS with `allowInsecureAuth: false` | Yes            | **Yes** (Ed25519 signature)      | Full security              |
| HTTP with `allowInsecureAuth: true`   | Yes            | No                               | **DANGEROUS** - token only |

### Security Configuration Warnings

Running `openclaw doctor` will flag these critical configurations:

| Setting                                                 | Severity     | Risk                                   |
| ------------------------------------------------------- | ------------ | -------------------------------------- |
| `gateway.bind: "lan"` without `gateway.auth.token`      | **Critical** | Gateway refuses to start               |
| `controlUi.allowInsecureAuth: true`                     | **Critical** | Allows token-only auth over HTTP       |
| `controlUi.dangerouslyDisableDeviceAuth: true`          | **Critical** | Disables device identity entirely      |
| `gateway.bind: "loopback"` without auth + reverse proxy | **Warn**     | Proxy can bypass auth if misconfigured |

### Device Identity Layer (Optional but Recommended)

Beyond shared secrets, the system supports **device identity** for paired devices:

1. **Browser generates Ed25519 keypair** (stored in IndexedDB)
2. **First connection**: Device pairs with gateway via pairing request
3. **Subsequent connections**: Device signs the challenge nonce with private key
4. **Server verifies**: Signature proves device identity cryptographically

**Control UI Behavior:**

- Uses token/password auth (can skip device identity with `allowInsecureAuth`)
- Stores device credentials in localStorage (secure contexts only - HTTPS/localhost)
- Falls back to shared-secret-only auth for non-HTTPS deployments when `allowInsecureAuth: true`

### WebSocket Auth Flow (Detailed)

```
┌─────────────┐                           ┌─────────────────┐
│ Control UI  │                           │   Gateway       │
└──────┬──────┘                           └────────┬────────┘
       │                                           │
       │ 1. HTTP GET /index.html                   │
       │──────────────────────────────────────────>│
       │    (No authentication - static files)     │
       │<──────────────────────────────────────────│
       │                                           │
       │ 2. WS CONNECT ws://host/ws                │
       │──────────────────────────────────────────>│
       │                                           │
       │    [Server checks isLocalDirectRequest()] │
       │    ├─ Local: Skip to step 5               │
       │    └─ Remote: Continue auth flow          │
       │                                           │
       │ 3. connect.challenge { nonce, ts }        │
       │<──────────────────────────────────────────│
       │                                           │
       │ 4. connect {                              │
       │      auth: {                              │
       │        token?: "shared-secret",           │
       │        password?: "shared-password"       │
       │      },                                   │
       │      device: {                            │  ← Required for remote
       │        id, publicKey, signature,          │     unless allowInsecureAuth
       │        signedAt, nonce                    │
       │      }                                    │
       │    }                                      │
       │──────────────────────────────────────────>│
       │                                           │
       │    [Gateway validates]                    │
       │    - Check token/password match           │
       │    - Verify device signature (if present) │
       │    - Check origin for browser clients     │
       │                                           │
       │ 5. hello-ok / error                       │
       │<──────────────────────────────────────────│
       │                                           │
```

### Current Limitations

1. **Single shared secret** - All users share the same token/password
2. **No session management** - Can't revoke individual sessions
3. **No expiration** - Tokens valid forever unless changed
4. **No user identity** - Can't distinguish between different users
5. **Stored in localStorage** - Vulnerable to XSS (mitigated: access token in memory, refresh would need design spec implementation)
6. **No audit trail** - Can't track who did what

---

## Rate Limiting Strategy

### Option A: Built-in Rate Limiting

```
┌─────────────────────────────────────────────────────────────────┐
│                        Gateway Server                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Request Flow                                                ││
│  │                                                              ││
│  │  ┌─────────┐   ┌──────────────┐   ┌──────────────┐         ││
│  │  │ Request │──>│ Rate Limiter │──>│ Auth Handler │         ││
│  │  └─────────┘   └──────────────┘   └──────────────┘         ││
│  │       │               │                    │                ││
│  │       │          ┌────┴────┐              │                ││
│  │       │          │         │              │                ││
│  │       │          ▼         ▼              ▼                ││
│  │       │    ┌────────┐  ┌────────┐   ┌──────────┐          ││
│  │       │    │ Allow  │  │ Block  │   │ Validate │          ││
│  │       │    │ +1 req │  │ 429    │   │ token    │          ││
│  │       │    │ count  │  │retry   │   │          │          ││
│  │       │    └────────┘  └────────┘   └──────────┘          ││
│  │                                                             ││
│  │  Rate Limiter Implementation:                               ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ Map<clientIP, { count, resetTime }>                │   ││
│  │  │ - Login: 5 attempts / 5 min per IP                 │   ││
│  │  │ - API: 100 req / min per IP                        │   ││
│  │  │ - Burst: 10 req allowed                            │   ││
│  │  │ - Cleanup: Every hour remove expired               │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**

- Self-contained, no external dependencies
- Works in all deployment scenarios (including local development)
- Can implement sophisticated logic (exponential backoff, per-user limits)
- Easy to add custom headers for client feedback

**Cons:**

- Memory usage grows with client count (needs cleanup)
- Not shared across gateway instances (stateful)
- Can be bypassed by IP spoofing (if not behind proxy)
- Adds complexity to the application

### Option B: Reverse Proxy Rate Limiting

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Request                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Reverse Proxy (nginx/traefik/CF)              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Rate Limiting Layer                                        ││
│  │                                                              ││
│  │  nginx config:                                               ││
│  │  limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;││
│  │  limit_req zone=login burst=3 nodelay;                      ││
│  │                                                              ││
│  │  Cloudflare:                                                 ││
│  │  - Rate limiting rules in dashboard                         ││
│  │  - 429 responses handled by CF                              ││
│  │                                                              ││
│  │  Traefik:                                                    ││
│  │  - middleware ratelimit                                     ││
│  │  - average: 5, burst: 10                                    ││
│  │                                                              ││
│  └──────────────────────┬──────────────────────────────────────┘│
└─────────────────────────┼────────────────────────────────────────┘
                          │ (if allowed)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Gateway Server                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  No rate limiting here - assumes proxy handled it           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**

- Offloads work from application
- Works across multiple gateway instances (shared state in Redis)
- More efficient (written in C/Rust)
- Can use distributed rate limiting (Redis, etc.)
- Blocks attacks before reaching application

**Cons:**

- Requires additional infrastructure setup
- Not available in local development
- Less visibility into rate limit state
- Harder to customize per-endpoint logic
- Need to trust proxy headers for client IP

**Example Configurations:**

**Nginx:**

```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

server {
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://gateway;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://gateway;
    }
}
```

**Traefik:**

```yaml
middlewares:
  rateLimit:
    rateLimit:
      average: 5
      burst: 10
      period: 1m
```

### Recommendation: Hybrid Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Deployment                         │
│  (Behind reverse proxy with rate limiting)                       │
│                                                                  │
│  Proxy: Block obvious abuse (1000s of req/s)                    │
│  App:   Handle business logic limits (login attempts, etc)      │
└─────────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────┐
│               Local Development / Single Instance                │
│  (No reverse proxy)                                              │
│                                                                  │
│  App:  Full rate limiting built-in                              │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Strategy:**

```typescript
// src/gateway/auth/rate-limit.ts
interface RateLimitConfig {
  enabled: boolean;
  strict: boolean; // true = always enforce, false = only if no proxy
}

function shouldEnforceRateLimit(req: IncomingMessage, config: RateLimitConfig): boolean {
  if (!config.enabled) return false;

  // Check if behind proxy
  const hasProxyHeaders = req.headers["x-forwarded-for"] || req.headers["x-real-ip"];

  // If strict mode or no proxy headers, enforce
  return config.strict || !hasProxyHeaders;
}
```

**Recommendation:**

1. Implement built-in rate limiting for auth endpoints (`/api/auth/login`, `/api/auth/refresh`)
2. Make it configurable with environment variables
3. Document reverse proxy setup for production
4. Default to strict mode for simplicity

---

## Backend Implementation

### New Files

```
src/gateway/auth/
├── session.ts       # Session management, token generation
├── middleware.ts    # Express-style auth middleware
├── routes.ts        # /api/auth/* route handlers
├── types.ts         # Auth-related type definitions
└── rate-limit.ts    # Rate limiting implementation
```

### Environment Variables

```bash
# Required (BOTH must be set together, or neither)
AUTH_EMAIL=admin@example.com
AUTH_PASSWORD=secure-password-here

# Optional (with defaults)
AUTH_ACCESS_TOKEN_TTL=15m        # Access token lifetime
AUTH_REFRESH_TOKEN_TTL=7d        # Refresh token lifetime
AUTH_JWT_SECRET=<auto-generated> # JWT signing secret (auto-gen if not set)
AUTH_COOKIE_DOMAIN=<auto>        # Cookie domain (auto-detect)
AUTH_COOKIE_SECURE=true          # Secure cookie flag
AUTH_RATE_LIMIT_ENABLED=true     # Enable rate limiting
AUTH_RATE_LIMIT_STRICT=false     # Always enforce (even behind proxy)
```

> ⚠️ **Authentication Required**: Control UI authentication is **mandatory**. The gateway will refuse to start if authentication is not configured.
>
> | Scenario                                       | Result                                        |
> | ---------------------------------------------- | --------------------------------------------- |
> | Both `AUTH_EMAIL` and `AUTH_PASSWORD` set      | ✅ Control UI authentication enabled          |
> | Either `AUTH_EMAIL` or `AUTH_PASSWORD` missing | ❌ **Fatal Error** - Gateway refuses to start |
>
> **Error Message:**
>
> ```
> Control UI authentication is required.
> Please set both AUTH_EMAIL and AUTH_PASSWORD environment variables.
> Example: AUTH_EMAIL=admin@example.com AUTH_PASSWORD=yourpassword
> ```
>
> **Why mandatory?** Ensures the Control UI is always protected. No accidental unprotected deployments.

### Session Store

**In-memory only** - Sessions are lost on gateway restart.

```typescript
// Simple in-memory store (per-gateway instance)
interface Session {
  id: string;
  email: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  accessTokenJti: string; // JWT ID for revocation
  issuedAt: Date;
  lastUsedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Map<refreshToken, Session>
const sessions = new Map<string, Session>();

// Cleanup job: Remove expired sessions every hour
```

**Rationale for no persistence:**

- Simplifies deployment (no external dependencies)
- Appropriate for single-gateway deployments
- Sessions naturally clear on deploy/restart
- Can add Redis later if multi-gateway support needed

### Token Format

**Access Token (JWT):**

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "admin@example.com",
    "email": "admin@example.com",
    "role": "operator",
    "iat": 1704067200,
    "exp": 1704068100,
    "jti": "uuid-for-revocation",
    "type": "access"
  }
}
```

**Refresh Token:** Opaque UUID string (e.g., `a1b2c3d4-e5f6-...`)

### API Endpoints

| Method | Endpoint            | Description                      | Auth Required    |
| ------ | ------------------- | -------------------------------- | ---------------- |
| POST   | `/api/auth/login`   | Authenticate with email/password | No               |
| POST   | `/api/auth/refresh` | Refresh access token             | Cookie           |
| POST   | `/api/auth/logout`  | Invalidate session               | Cookie or Bearer |
| GET    | `/api/auth/me`      | Get current user info            | Bearer           |

### WebSocket Auth Integration

Modify `src/gateway/server/ws-connection/message-handler.ts`:

1. Extract access token from WebSocket query params OR connect frame auth
2. Verify JWT signature and expiration
3. If expired, reject with specific error code
4. UI will then trigger refresh flow and reconnect

---

## Frontend Implementation

### New Files

```
ui/src/ui/auth/
├── auth-context.ts      # Auth state management
├── auth-service.ts      # API calls for auth
├── token-manager.ts     # Token storage/refresh logic
└── views/login.ts       # Login page component
```

### Auth State Management

```typescript
// In-memory only - NEVER persist to localStorage
interface AuthState {
  isAuthenticated: boolean;
  user: { email: string } | null;
  accessToken: string | null;
  expiresAt: number | null; // Unix timestamp
  isLoading: boolean;
  error: string | null;
}

// Token refresh scheduler
// - Refresh 60 seconds before expiry
// - Use visibilitychange event to refresh when tab becomes active
// - Exponential backoff on refresh failure
```

### Login Page Design

```
┌──────────────────────────────────────┐
│                                      │
│           OpenClaw                   │
│         Control UI                   │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 📧 Email                       │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔒 Password                    │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │        Sign In                 │  │
│  └────────────────────────────────┘  │
│                                      │
│  [Error message displays here]       │
│                                      │
└──────────────────────────────────────┘
```

### Protected Route Pattern

```typescript
// All existing views check auth context
// If not authenticated, redirect to login
// If token expiring soon, show subtle indicator

// In app.ts router:
if (!authState.isAuthenticated && !isPublicRoute(path)) {
  redirectToLogin();
}
```

### WebSocket Integration

Modify `ui/src/ui/gateway.ts`:

1. Include access token in `connect` frame auth
2. On auth error (expired token), trigger refresh
3. After refresh, automatically reconnect WebSocket
4. If refresh fails, redirect to login

```typescript
// GatewayBrowserClient modification
private async sendConnect() {
  const accessToken = getAccessToken(); // From auth context

  const auth = accessToken
    ? { token: accessToken }
    : undefined;

  // ... rest of connect logic
}

// On auth error:
if (error.code === 'TOKEN_EXPIRED') {
  const refreshed = await refreshAccessToken();
  if (refreshed) {
    this.reconnect();
  } else {
    redirectToLogin();
  }
}
```

---

## Migration Strategy

### Phase 1: Add Auth Layer (Backward Compatible)

- Add new auth endpoints and middleware
- Keep existing token/password auth working
- Add feature flag: `gateway.controlUi.authMode: "legacy" | "session"`

### Phase 2: Frontend Updates

- Add login view and auth context
- Update WebSocket client to use new auth
- Graceful fallback to login on auth failure

### Phase 3: Default to New Auth

- Change default `authMode` to `"session"`
- Keep legacy mode as opt-out for migration period

### Phase 4: Remove Legacy (Future)

- Remove legacy auth code paths
- Simplify auth configuration

---

## Error Handling

### Backend Error Codes

| Code                  | HTTP | Description             | Client Action           |
| --------------------- | ---- | ----------------------- | ----------------------- |
| `INVALID_CREDENTIALS` | 401  | Email/password mismatch | Show error              |
| `TOKEN_EXPIRED`       | 401  | Access token expired    | Refresh token           |
| `TOKEN_INVALID`       | 401  | Token signature invalid | Redirect login          |
| `REFRESH_EXPIRED`     | 401  | Refresh token expired   | Redirect login          |
| `RATE_LIMITED`        | 429  | Too many login attempts | Show error, retry after |
| `SESSION_REVOKED`     | 401  | Session invalidated     | Redirect login          |

### Frontend Error Handling

```typescript
// API response interceptor
if (response.status === 401) {
  if (response.code === "TOKEN_EXPIRED") {
    await refreshToken();
    retryRequest();
  } else {
    logout();
    redirectToLogin();
  }
}
```

---

## Testing Strategy

### Unit Tests

- Token generation/validation
- Session store operations
- Credential validation
- Rate limiting logic

### Integration Tests

- Login flow end-to-end
- Token refresh flow
- WebSocket auth with tokens
- Logout and session invalidation

### Security Tests

- XSS attempt to steal tokens
- CSRF attempt with cookies
- Replay attack with old refresh token
- Brute force login protection

---

## Security Considerations

### 1. HTTPS Required

- Authentication only works over HTTPS (except localhost development)
- `AUTH_COOKIE_SECURE=true` enforces this

### 2. Brute Force Protection

- Rate limit login attempts: 5 per minute per IP
- Exponential backoff after failures

### 3. Session Binding

- Store IP address and user agent hash
- Optional: Validate on each request (configurable)

### 4. Token Rotation

- New refresh token issued on every refresh
- Old refresh token invalidated immediately
- Prevents replay attacks

### 5. Secure Logout

- Client: Clear in-memory tokens
- Server: Invalidate refresh token in store
- Both: Clear httpOnly cookie

---

## Configuration Examples

### Validation Examples

#### ✅ Valid: Both authentication variables set

```bash
export AUTH_EMAIL="admin@example.com"
export AUTH_PASSWORD="secure-password"
openclaw gateway run
# Output: [auth] Control UI authentication enabled
```

#### ❌ Invalid: Missing AUTH_EMAIL or AUTH_PASSWORD (Fatal Error)

```bash
# Missing authentication configuration
openclaw gateway run
# ERROR: Gateway fails to start
# Control UI authentication is required.
# Please set both AUTH_EMAIL and AUTH_PASSWORD environment variables.
# Example: AUTH_EMAIL=admin@example.com AUTH_PASSWORD=yourpassword
```

### Minimal Setup

```bash
# .env or environment
AUTH_EMAIL=admin@mydomain.com
AUTH_PASSWORD=your-secure-password
```

### Advanced Options

```bash
# Custom token lifetimes (for testing or specific needs)
AUTH_ACCESS_TOKEN_TTL=5m
AUTH_REFRESH_TOKEN_TTL=1d

# Explicit JWT secret (auto-generated if not set)
AUTH_JWT_SECRET=your-secret-key-min-32-chars

# Cookie settings for specific deployments
AUTH_COOKIE_DOMAIN=.openclaw.local
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=strict

# Rate limiting
AUTH_RATE_LIMIT_ENABLED=true
AUTH_RATE_LIMIT_STRICT=false
```

---

## Future Enhancements

1. **Multi-user support**: Database-backed user store
2. **RBAC**: Role-based access control (admin, operator, viewer)
3. **OIDC/OAuth2**: Integration with external identity providers
4. **MFA**: TOTP-based multi-factor authentication
5. **Session persistence**: Redis-backed session store for multi-gateway deployments
6. **Audit logging**: Track all auth events

---

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Security_Cheat_Sheet.html)
- [IETF: JWT Best Current Practices](https://tools.ietf.org/html/draft-ietf-oauth-jwt-bcp)
- [Cookie Flags and Security](https://owasp.org/www-community/controls/SecureCookieAttribute)
