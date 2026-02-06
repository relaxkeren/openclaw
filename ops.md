# Ops notes (from-source)

This is a lightweight runbook for running the OpenClaw Gateway **directly from this repository**
(no global install).

## Prereqs

- Node **22+**
- `pnpm` (recommended for this repo)

From the repo root:

```bash
pnpm install
```

## Setup (initialize config + workspace)

To initialize `~/.openclaw/openclaw.json` and seed the default workspace (like the installed CLI),
run `setup` via the local repo entrypoint:

```bash
pnpm openclaw setup
```

### Common options

```bash
pnpm openclaw setup --workspace ~/.openclaw/workspace
pnpm openclaw setup --wizard
```

### Isolated dev profile (recommended for experimenting)

This keeps state/config/workspace separate (does not touch your main `~/.openclaw`):

```bash
pnpm openclaw --dev setup
```

## Run the Gateway (foreground)

Build the Control UI assets once (so the UI is served by the Gateway), set `gateway.mode=local`,
then start the gateway:

```bash
pnpm ui:build
pnpm openclaw config set gateway.mode local
pnpm openclaw gateway
```

### Common flags

```bash
pnpm openclaw gateway --port 51442     # choose port (default is usually 18789)
pnpm openclaw gateway --verbose        # more console logs
pnpm openclaw gateway --force          # reclaim port if it is already in use
pnpm openclaw gateway --bind loopback  # default bind
```

### Ad-hoc/dev-only (bypass the `gateway.mode=local` guard)

```bash
pnpm openclaw gateway --allow-unconfigured
```

## Control UI (served by the Gateway)

The Control UI is a small Vite + Lit single-page app served on the **same port** as the Gateway
WebSocket.

- Default: `http://127.0.0.1:51442/` (or `http://localhost:51442/`)
- Optional prefix: set `gateway.controlUi.basePath` (e.g. `/openclaw`)
  - Example URL: `http://127.0.0.1:51442/openclaw`

## Dev loop (auto-reload)

```bash
pnpm gateway:watch
```

## Isolated dev instance (separate state/config; skips channels)

Useful when you don’t want to touch your main `~/.openclaw` setup.

```bash
pnpm gateway:dev
```

Reset the dev profile state:

```bash
pnpm gateway:dev:reset
```

## Equivalent direct entry (no pnpm wrapper)

`pnpm openclaw ...` ultimately runs the repo entrypoint. This is equivalent:

```bash
node scripts/run-node.mjs gateway
```

## Quick troubleshooting

- If you see **“Gateway start blocked: set gateway.mode=local”**:

```bash
pnpm openclaw config set gateway.mode local
```

## References

- `https://docs.openclaw.ai/cli/gateway`
- `https://docs.openclaw.ai/web/control-ui`
- `https://docs.openclaw.ai/gateway/troubleshooting`
