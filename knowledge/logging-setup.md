# Logging setup and mechanism

Internal reference for how logging is implemented: file appenders, log folder resolution, and LLM prompt/response logging. User-facing overview: [docs/logging.md](../docs/logging.md) and [docs/gateway/logging.md](../docs/gateway/logging.md).

## Where logs go

- **Main file log**: JSONL, one object per line. Default path is under a “log folder” (see below), filename `openclaw-YYYY-MM-DD.log`. Overridable via config `logging.file`.
- **LLM prompt/response log**: File-only (no console). **Separate file** in the same log folder: `openclaw-llm-YYYY-MM-DD.jsonl`. One JSON object per exchange (ts, prompt, response, runId, sessionKey, provider, modelId, error). Not written to the main log file; check e.g. `~/.openclaw/logs/openclaw-llm-YYYY-MM-DD.jsonl` or `$LOG_FOLDER/openclaw-llm-*.jsonl`.
- **Console**: TTY-aware formatting, subsystem prefixes, level/color. Controlled by `logging.consoleLevel` and `logging.consoleStyle`; `--verbose` only affects console, not file level.

## Log folder resolution

All file logs (main + LLM) use a single “log folder”:

- **`LOG_FOLDER`** (env): If set, this directory is used (supports `~`). Example: `LOG_FOLDER=/var/log/openclaw` or `LOG_FOLDER=~/my-logs`.
- **Otherwise**: `~/.openclaw/logs` (or `$OPENCLAW_STATE_DIR/logs` when that env is set).

Implementation: `resolveLogFolder(env)` in `src/logging/logger.ts`. The default rolling main log path is `resolveLogFolder() + "/openclaw-YYYY-MM-DD.log"`. If config sets `logging.file` to an explicit path, that path is used as-is (directory is still created); the log folder is only used when no `logging.file` is configured.

## Code layout

- **`src/logging/logger.ts`**: TsLog-based file logger, `resolveLogFolder`, `defaultRollingPathForToday`, rolling prune (24h), `getLogger` / `getChildLogger`, `registerLogTransport`. Exports `DEFAULT_LOG_DIR` (legacy `/tmp/openclaw`), `DEFAULT_LOG_FILE`, `resolveLogFolder`, `getResolvedLoggerSettings`, `setLoggerOverride` (tests).
- **`src/logging/config.ts`**: `readLoggingConfig()` reads `logging` from `openclaw.json` (via `resolveConfigPath()`).
- **`src/logging/llm-file-log.ts`**: `logLlmExchange({ prompt, response, meta })` writes one JSON line to `openclaw-llm-YYYY-MM-DD.jsonl` in the log folder. No console. Called from `src/agents/pi-embedded-runner/run/attempt.ts` after each LLM turn.
- **`src/logging/console.ts`**: Console routing, styles, redaction, capture (CLI routes console to file logger as well).
- **`src/logging/levels.js`**, **`src/logging/state.js`**: Level normalization and cached logger/console state.
- **`src/logger.ts`**: High-level helpers (`logInfo`, `logWarn`, etc.) and subsystem splitting; uses `getLogger()` from `logging/logger.js`.
- **`src/logging.ts`**: Re-exports for the rest of the app (`getLogger`, `resolveLogFolder`, `setLoggerOverride`, etc.).

## Config

Read from `~/.openclaw/openclaw.json` (or `OPENCLAW_CONFIG_PATH`) under the `logging` key:

- **`logging.file`**: Explicit log file path. If omitted, default is `resolveLogFolder() + "/openclaw-YYYY-MM-DD.log"`.
- **`logging.level`**: File log level (e.g. `info`, `debug`, `trace`).
- **`logging.consoleLevel`**: Console level.
- **`logging.consoleStyle`**: `pretty` | `compact` | `json`.
- **`logging.redactSensitive`**, **`logging.redactPatterns`**: Console-only redaction for tool output.

Config is read by `readLoggingConfig()` and (when needed) by `resolveSettings()` in `logger.ts`, which also falls back to `loadConfig()?.logging` if the config file is missing or has no `logging` section.

## Other file sinks (opt-in)

- **Anthropic payload log**: `OPENCLAW_ANTHROPIC_PAYLOAD_LOG=1` and optional `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`. Implemented in `src/agents/anthropic-payload-log.ts`; writes request/usage to a JSONL file (default `$OPENCLAW_STATE_DIR/logs/anthropic-payload.jsonl`).
- **Raw stream**: `OPENCLAW_RAW_STREAM=1` and optional `OPENCLAW_RAW_STREAM_PATH`. Used by gateway dev; see `src/agents/pi-embedded-subscribe.raw-stream.ts`.

## Tests

- **`src/logger.test.ts`**: Uses `setLoggerOverride` and (for rolling default) sets `LOG_FOLDER` to a temp dir so the default path is under that folder without touching `~/.openclaw/logs`.
- **`src/logging/*.test.ts`**: Console, redact, parse-log-line, etc.
