# Local development setup

How to set up the OpenClaw **local development environment**, initialise config and workspace, and run the CLI and Gateway from this repository (no global install required).

## Prerequisites

- **Node.js 22+** (runtime baseline for the project)
- **pnpm** (recommended; used for install and scripts)
- Optional: **Bun** for running TypeScript directly (`bun <file.ts>`, tests)
- Optional: **Docker** for containerized e2e tests and some live tests

Ensure Node and pnpm are on your PATH. From the repo root you can use `pnpm openclaw ...` without linking the CLI globally.

## 1. Clone and install dependencies

From the repository root:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
```

This installs all dependencies. The repo uses pnpm workspaces; plugins and UI live in `extensions/` and `ui/` and are installed by the root `pnpm install`.

## 2. Build (first time and after pulling changes)

Build the TypeScript bundle, Control UI assets, and plugin SDK so the Gateway and CLI work from source:

```bash
pnpm ui:build
pnpm build
```

- **`pnpm ui:build`** — builds the Control UI (Vite + Lit) so the Gateway can serve it.
- **`pnpm build`** — compiles TypeScript to `dist/`, bundles A2UI, generates protocol/build info, and builds the plugin SDK.

Run both after a fresh clone and when you pull changes that touch build steps or dependencies.

## 3. Initialise config and workspace

To create `~/.openclaw/openclaw.json` and seed the default workspace (same as the installed CLI):

```bash
pnpm openclaw setup
```

Common options:

```bash
pnpm openclaw setup --workspace ~/.openclaw/workspace
pnpm openclaw setup --wizard
```

For an **isolated dev profile** (separate state; does not touch your main `~/.openclaw`):

```bash
pnpm openclaw --dev setup
```

Use the same `--dev` profile when running the gateway in dev mode so config and state stay isolated.

## 4. Run the Gateway from this repo

Set local mode (required for running the Gateway from source in normal use):

```bash
pnpm openclaw config set gateway.mode local
```

Start the Gateway in the foreground:

```bash
pnpm openclaw gateway
```

Useful flags:

```bash
pnpm openclaw gateway --port 51442      # custom port (default often 18789)
pnpm openclaw gateway --verbose         # more console logs
pnpm openclaw gateway --force           # reclaim port if in use
pnpm openclaw gateway --bind loopback   # default bind
```

To run without setting `gateway.mode=local` (e.g. ad-hoc testing):

```bash
pnpm openclaw gateway --allow-unconfigured
```

**Control UI:** served on the same port as the Gateway (e.g. `http://127.0.0.1:51442/` or `http://localhost:51442/`). If you set `gateway.controlUi.basePath` (e.g. `/openclaw`), use that path in the URL.

## 5. Development workflows

### CLI without global install

Run any CLI command via the repo entrypoint:

```bash
pnpm openclaw <command> [options]
```

Examples:

```bash
pnpm openclaw health
pnpm openclaw channels status
pnpm openclaw config list
```

Equivalent direct entry (no pnpm wrapper):

```bash
node scripts/run-node.mjs <command>
```

### Gateway with auto-reload (watch)

Rebuild and restart the Gateway when source changes:

```bash
pnpm gateway:watch
```

### Isolated dev instance (no channels, separate state)

Use a separate config/state and skip channel loading (good for working on gateway/CLI without touching your main setup):

```bash
pnpm gateway:dev
```

Reset that dev profile:

```bash
pnpm gateway:dev:reset
```

### Control UI development (separate dev server)

To run the UI with hot reload against a Gateway (e.g. remote or another terminal):

```bash
pnpm ui:dev
```

For cross-origin dev (e.g. UI dev server → remote Gateway), configure CORS / base URL as needed (see docs for Control UI and remote access).

## 6. Quality checks (before committing)

- **Lint and format:** `pnpm check` (runs TypeScript checks, oxlint, oxfmt).
- **Tests:** `pnpm test` (Vitest).
- **Pre-commit hooks (same as CI):** `prek install` then rely on hooks, or run `pnpm check` and `pnpm test` manually.

Fix format:

```bash
pnpm format:fix
```

## 7. Optional: global CLI link

If you want the `openclaw` command available globally from this checkout:

```bash
pnpm build
pnpm link --global
```

Then you can run `openclaw setup`, `openclaw gateway`, etc. from anywhere. Without linking, always use `pnpm openclaw ...` from the repo root.

## 8. Optional: macOS app from source

To build and run the OpenClaw macOS app from this repo (menubar app that runs the Gateway):

1. Install dependencies and build as above (`pnpm install`, `pnpm ui:build`, `pnpm build`).
2. Follow **[macOS Dev Setup](https://docs.openclaw.ai/platforms/mac/dev-setup)** (Xcode, `./scripts/package-mac-app.sh`, CLI install via app or `npm install -g openclaw@<version>`).

## Quick reference

| Goal                 | Command                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| Install deps         | `pnpm install`                                                             |
| First-time build     | `pnpm ui:build && pnpm build`                                              |
| Initialise config    | `pnpm openclaw setup`                                                      |
| Run Gateway          | `pnpm openclaw config set gateway.mode local` then `pnpm openclaw gateway` |
| Gateway + watch      | `pnpm gateway:watch`                                                       |
| Isolated dev Gateway | `pnpm gateway:dev`                                                         |
| Run CLI command      | `pnpm openclaw <command>`                                                  |
| Lint/format          | `pnpm check`                                                               |
| Tests                | `pnpm test`                                                                |

## See also

- **Ops runbook (from-source):** [ops.md](../ops.md) — same topics in a short runbook form.
- **Docs:** [Install (from source)](https://docs.openclaw.ai/install/index#from-source), [Setup](https://docs.openclaw.ai/start/setup), [Gateway](https://docs.openclaw.ai/cli/gateway), [Control UI](https://docs.openclaw.ai/web/control-ui), [Troubleshooting](https://docs.openclaw.ai/gateway/troubleshooting).
