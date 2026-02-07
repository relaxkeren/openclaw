---
summary: "Control UI authentication: mandatory email/password and JWT sessions"
read_when:
  - Enabling or troubleshooting the Control UI login
  - Configuring AUTH_EMAIL and AUTH_PASSWORD
title: "Control UI Authentication"
---

# Control UI Authentication

Control UI authentication is **mandatory**. The gateway does not start unless both `AUTH_EMAIL` and `AUTH_PASSWORD` are set. Users must sign in with email and password before accessing the web UI.

## Architecture

The system uses a **unified JWT**:

- **Access token**: Short-lived JWT (default 15 minutes) kept in browser memory only. Used for HTTP `Authorization: Bearer` and WebSocket `connect.auth.token`.
- **Refresh token**: Long-lived opaque token (default 7 days) in an HttpOnly, SameSite=Strict cookie. Used to obtain new access tokens without re-entering credentials.

## Quick start

Set both environment variables, then run the gateway:

```bash
export AUTH_EMAIL="admin@example.com"
export AUTH_PASSWORD="your-secure-password"
openclaw gateway run
```

Open the Control UI (e.g. http://localhost:18789). You will see the login page; after signing in, the full app and WebSocket connection use the same JWT.

## Environment variables

| Variable                  | Required | Default        | Description                                                  |
| ------------------------- | -------- | -------------- | ------------------------------------------------------------ |
| `AUTH_EMAIL`              | Yes      | -              | Admin email (used as login identity)                         |
| `AUTH_PASSWORD`           | Yes      | -              | Admin password (plain text)                                  |
| `AUTH_ACCESS_TOKEN_TTL`   | No       | `15m`          | Access token lifetime (e.g. `15m`, `1h`)                     |
| `AUTH_REFRESH_TOKEN_TTL`  | No       | `7d`           | Refresh token lifetime (e.g. `7d`, `24h`)                    |
| `AUTH_JWT_SECRET`         | No       | Auto-generated | JWT signing secret (min 256 bits recommended for production) |
| `AUTH_COOKIE_SECURE`      | No       | `true`         | Set to `false` for HTTP localhost development                |
| `AUTH_RATE_LIMIT_ENABLED` | No       | `true`         | Enable login/refresh rate limiting                           |
| `AUTH_RATE_LIMIT_STRICT`  | No       | `false`        | Always enforce rate limits (even behind proxy)               |

### Duration formats

Token TTL values support:

- `15m` – 15 minutes
- `1h` – 1 hour
- `7d` – 7 days
- `3600` – seconds when no unit is given

## Security recommendations

### Production

1. **HTTPS** – Use HTTPS; auth cookies are Secure in production (except localhost).
2. **JWT secret** – Set a strong random secret, e.g. `AUTH_JWT_SECRET=$(openssl rand -base64 32)`.
3. **Password** – Use a strong password (e.g. from a password manager).
4. **Rate limiting** – Keep it enabled to limit brute force.
5. **Token lifetimes** – Keep access tokens short (e.g. 15m) and refresh tokens reasonable (e.g. 7d).

### Development (HTTP localhost)

```bash
export AUTH_EMAIL="admin@example.com"
export AUTH_PASSWORD="dev-password"
export AUTH_COOKIE_SECURE="false"
openclaw gateway run
```

## Rate limiting

Failed login attempts are limited:

- **Limit**: 5 attempts per 5 minutes per IP
- **Block**: 15 minutes after exceeding the limit
- The UI shows a countdown when rate limited

## Troubleshooting

### "Control UI authentication is required"

The gateway refuses to start when auth is not configured.

- Ensure both `AUTH_EMAIL` and `AUTH_PASSWORD` are set and exported.
- Check for typos and trailing spaces.
- Restart the gateway after setting variables.

### Token refresh fails or repeated logouts

- Confirm the browser sends the refresh cookie (e.g. in DevTools, Application → Cookies).
- For HTTP (no HTTPS), set `AUTH_COOKIE_SECURE=false`.
- Ensure the gateway is receiving the cookie (check server logs).

### Rate limited

- Wait for the countdown to finish (up to 15 minutes).
- Verify the password; avoid automated or repeated login attempts.

### CORS or WebSocket auth errors

- Use the same origin for the Control UI and gateway.
- Ensure the access token is sent (e.g. in WebSocket `connect.auth.token` and HTTP `Authorization: Bearer`).
