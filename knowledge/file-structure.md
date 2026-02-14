# Repository file structure

This document explains what each major folder/package in this repository is for, and which part of OpenClaw it owns.

OpenClaw is a **pnpm workspace monorepo**. The root package (`openclaw`) is the CLI + Gateway runtime; additional workspace packages live in `ui/`, `packages/*`, and `extensions/*` (see `pnpm-workspace.yaml`).

## Top-level overview

### `src/` (core TypeScript)

The main product code: CLI, Gateway, built-in channels, routing, tools, and shared infrastructure.

Common entrypoints by responsibility (not exhaustive):

- **CLI surface**: `src/cli/` (command wiring, flags, UX helpers) + `src/commands/` (command implementations)
- **Gateway runtime**: `src/gateway/` (server/control-plane, APIs, lifecycle)
- **Channels + routing**:
  - `src/channels/` (shared channel abstractions, allowlists, pairing, outbound, status, normalization)
  - Per-channel implementations exist both as built-ins and as plugins (see `extensions/`)
  - `src/routing/` (routing logic)
- **Tools + automation**:
  - `src/browser/` (browser automation/control)
  - `src/process/` (process/exec abstractions, command queue)
  - `src/cron/` (cron/wakeups)
  - `src/hooks/` (hook system; includes bundled hook docs under `src/hooks/bundled/**`)
- **Sessions + agents**: `src/agents/`, `src/sessions/`, `src/pairing/`, `src/auto-reply/`
- **Media**: `src/media/` (parsing, storage, MIME, image/audio handling) + `src/media-understanding/`
- **Terminal UI**: `src/tui/` + `src/terminal/` (TTY tables/palette helpers, etc.)
- **Infrastructure + security**: `src/infra/`, `src/security/`, `src/config/`, `src/logging/`
- **Plugin SDK surface**: `src/plugin-sdk/` and `openclaw` export `./plugin-sdk` (see root `package.json`)

### `docs/` (Mintlify documentation site)

The documentation content for `docs.openclaw.ai`.

- **Site navigation**: `docs/docs.json` (defines tabs/groups/pages; English + `zh-Hans`).
- **Docs content**: `docs/**/*.md` and a few `docs/**/*.mdx`.
- **Generated translations**: `docs/zh-CN/**` (generated; do not edit unless explicitly requested).
- **i18n pipeline assets**: `docs/.i18n/` (glossary + translation memory; see `docs/.i18n/README.md`).

### `ui/` (Web Control UI frontend)

The browser UI served/used for Gateway control surfaces (chat, config forms, sessions, nodes, logs, etc.).

- Build tooling: `ui/vite.config.ts`, `ui/package.json`
- Main source: `ui/src/` (Lit-based UI, controllers, views, styles)

### `extensions/` (plugin workspace packages)

Each folder under `extensions/*` is a **workspace package** (see `pnpm-workspace.yaml`) implementing a plugin. Plugins are used for:

- **Additional channels** (e.g. `matrix`, `msteams`, `zalo`, `zalouser`, etc.)
- **Tools / capabilities** (e.g. `lobster`, `llm-task`)
- **Auth helpers / providers** (e.g. `google-gemini-cli-auth`, `minimax-portal-auth`, `qwen-portal-auth`)
- **Backends** (e.g. memory providers like `memory-core`, `memory-lancedb`)

Typical structure inside an extension:

- `package.json` (package metadata)
- `openclaw.plugin.json` (plugin manifest)
- `index.ts` (plugin entry)
- `src/` (implementation)
- Optional `README.md` / `CHANGELOG.md` / `SKILL.md` depending on plugin

### `skills/` (bundled skills library)

The bundled skill catalog shipped with/for OpenClaw.

- Each skill lives in `skills/<skill-name>/` and is typically defined by `SKILL.md`.
- Some skills include scripts or small helper code (Python/TS/shell) under that skill directory.

### `apps/` (companion apps and shared Swift/Kotlin code)

Companion apps and “node” clients that pair to the Gateway.

- `apps/android/`: Android app (Kotlin)
- `apps/ios/`: iOS app (Swift)
- `apps/macos/`: macOS menu bar app (Swift) and app-specific resources/docs
- `apps/shared/`: shared Swift modules (`OpenClawKit`, protocol models, UI components)

### `packages/` (compatibility shims)

Additional published packages that forward to `openclaw` for compatibility:

- `packages/clawdbot/`: `clawdbot` shim (forwards to `openclaw`)
- `packages/moltbot/`: `moltbot` shim (forwards to `openclaw`)

### `scripts/` (build, test, packaging, ops tooling)

Automation scripts for local development, CI, release packaging, docs, and tests.

Notable areas:

- **Dev runner**: `scripts/run-node.mjs`, `scripts/watch-node.mjs`
- **Docs tooling**: `scripts/docs-list.js`, `scripts/build-docs-list.mjs`, `scripts/docs-i18n/`
- **Packaging**: `scripts/package-mac-app.sh`, `scripts/create-dmg.sh`, signing/notary helpers
- **E2E and Docker tests**: `scripts/e2e/`, `scripts/docker/`

### `vendor/` (vendored upstream code)

Vendored dependencies kept in-tree (not installed via npm).

- `vendor/a2ui/`: the A2UI spec + renderers and tooling used by the Canvas/A2UI pipeline.

### `assets/` (static assets)

Static files used by the repo and tooling.

- `assets/chrome-extension/`: Chrome extension assets + README
- DMG backgrounds and SVGs at the top level of `assets/`

### `test/` (repo-level tests)

Vitest tests and helpers that are not colocated next to the source (some tests are also colocated under `src/**` and `ui/src/**`).

### `knowledge/` (internal knowledge docs for this repo)

Meta documentation intended to help contributors/agents navigate the repository.

- `knowledge/overview.md`: exhaustive index of Markdown knowledge
- `knowledge/file-structure.md`: this document

## Other notable top-level files/folders

- **`CHANGELOG.md`**: release notes
- **`git-hooks/`**: local git hook scripts (configured by root `package.json` `prepare`)
- **`patches/`**: patch artifacts used by the package manager/tooling (treat as infra; don’t edit casually)
- **`Swabble/`**: a separate Swift project (speech/wake-word hook daemon) with its own docs/README
- **`.pi/`, `.agent/`, `.agents/`**: internal agent/dev tooling and configuration used by the project
- **`Dockerfile.sandbox`**: sandbox container support
