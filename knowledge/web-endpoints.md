# Control UI backend endpoints

The OpenClaw **Control UI** (web app under `ui/src/ui/**`) talks to the backend in two ways:

- **HTTP**: a small set of REST-ish endpoints (plus the UI’s own static asset + avatar serving).
- **WebSocket**: a single Gateway WebSocket connection that carries a request/response (“RPC”) protocol with method names like `chat.send`, `config.get`, etc.

This document lists **every HTTP endpoint and WebSocket RPC method used by the Control UI**, including:

- **Responsibility**
- **Contract** (summary-level params/response)
- **Triggered in web** (file + function name)
- **Handled in backend** (file + function / handler key)

---

## HTTP endpoints used by the Control UI

### Control UI static assets (Control UI itself)

- **Responsibility**: Serve the built Control UI SPA (JS/CSS/assets) and SPA fallback to `index.html`.
- **Contract**:
  - **Method/path**: `GET|HEAD {basePath}/` and `GET|HEAD {basePath}/*`
  - **Params**: none
  - **Response**: static file bytes (with SPA fallback)
- **Triggered in web**: browser navigation / asset loads (not a JS call)
- **Handled in backend**: `src/gateway/control-ui.ts#handleControlUiHttpRequest`

Notes:

- `{basePath}` is configured by `gateway.controlUi.basePath` (default is handled by `normalizeControlUiBasePath()`).
- The server injects values into `index.html` (e.g. `window.__OPENCLAW_CONTROL_UI_BASE_PATH__`), which the UI uses to build some URLs.

### Agent avatar metadata (used by chat UI)

- **Responsibility**: Resolve the assistant avatar URL for a given `agentId` (so the UI can display the correct avatar).
- **Contract**:
  - **Method/path**: `GET|HEAD {basePath}/avatar/{agentId}?meta=1`
  - **Path params**:
    - `agentId`: validated by backend (simple id regex; invalid ids 404)
  - **Query params**:
    - `meta=1`: returns JSON metadata instead of the image bytes
  - **Response**: JSON `{ avatarUrl: string | null }`
- **Triggered in web**: `ui/src/ui/app-chat.ts#refreshChatAvatar` (via `fetch()`)
- **Handled in backend**: `src/gateway/control-ui.ts#handleControlUiAvatarRequest`

### Nostr profile management (Nostr plugin HTTP handler)

These are provided by the `@openclaw/nostr` extension plugin and registered into the Gateway’s HTTP handler chain.

#### Update + publish Nostr profile

- **Responsibility**: Validate profile fields, publish to relays, and (on success) persist profile into config.
- **Contract**:
  - **Method/path**: `PUT /api/channels/nostr/{accountId}/profile`
  - **Path params**:
    - `accountId`: string (from URL segment)
  - **Body**: JSON `NostrProfile` (validated by zod; errors returned as `details: string[]`)
  - **Response** (success): `{ ok: true, persisted: boolean, successes: unknown[], failures: unknown[], eventId?: string, createdAt?: number }`
  - **Response** (failure): `{ ok: false, error: string, details?: unknown }` (status varies; validation errors are `400`)
- **Triggered in web**: `ui/src/ui/app-channels.ts#handleNostrProfileSave` (via `fetch()`)
- **Handled in backend**:
  - Registration: `extensions/nostr/index.ts#register` (calls `api.registerHttpHandler(...)`)
  - Handler: `extensions/nostr/src/nostr-profile-http.ts#createNostrProfileHttpHandler` → `handleUpdateProfile` (internal)
  - Gateway dispatch: `src/gateway/server/plugins-http.ts#createGatewayPluginRequestHandler` (invokes registered plugin http handlers)

#### Import Nostr profile from relays

- **Responsibility**: Fetch profile from relays, optionally merge into local config.
- **Contract**:
  - **Method/path**: `POST /api/channels/nostr/{accountId}/profile/import`
  - **Path params**:
    - `accountId`: string
  - **Body**: JSON `{ autoMerge?: boolean }` (optional)
  - **Response** (success): `{ ok: true, imported?: NostrProfile, merged?: NostrProfile, saved?: boolean }`
  - **Response** (relay import failure): `{ ok: false, error: string, relaysQueried?: unknown }` (note: can still be HTTP 200)
- **Triggered in web**: `ui/src/ui/app-channels.ts#handleNostrProfileImport` (via `fetch()`)
- **Handled in backend**:
  - Registration: `extensions/nostr/index.ts#register`
  - Handler: `extensions/nostr/src/nostr-profile-http.ts#createNostrProfileHttpHandler` → `handleImportProfile` (internal)
  - Gateway dispatch: `src/gateway/server/plugins-http.ts#createGatewayPluginRequestHandler`

---

## WebSocket RPC used by the Control UI

### WebSocket “endpoint” + handshake

- **Responsibility**: Establish an authenticated Gateway session and negotiate protocol features.
- **Where it connects from web**:
  - `ui/src/ui/app-gateway.ts#connectGateway` (constructs `GatewayBrowserClient` with `settings.gatewayUrl`)
  - `ui/src/ui/gateway.ts#GatewayBrowserClient.connect` / `#sendConnect`
- **Where it’s handled in backend**:
  - Connection setup + challenge: `src/gateway/server/ws-connection.ts#attachGatewayWsConnectionHandler`
    - Sends initial event: `{ type: "event", event: "connect.challenge", payload: { nonce, ts } }`
  - Handshake parsing + `hello-ok` response: `src/gateway/server/ws-connection/message-handler.ts#attachGatewayWsMessageHandler`

#### Frame shapes (as used by the UI)

- **Request**: `{ type: "req", id: string, method: string, params?: unknown }`
- **Response**: `{ type: "res", id: string, ok: boolean, payload?: unknown, error?: { code: string, message: string, details?: unknown } }`
- **Event**: `{ type: "event", event: string, payload?: unknown, seq?: number, stateVersion?: { presence: number, health: number } }`

#### `connect` handshake request

- **Method**: `connect` (must be the **first** request on a new socket)
- **Params** (summary; UI sends these from `ui/src/ui/gateway.ts#GatewayBrowserClient.sendConnect`):
  - `minProtocol`, `maxProtocol` (currently `3`)
  - `client`: `{ id, version, platform, mode, instanceId? }`
  - `role`: `"operator"`
  - `scopes`: `["operator.admin","operator.approvals","operator.pairing"]` (UI default)
  - `device?`: device identity signature payload (secure contexts)
  - `auth?`: `{ token?: string, password?: string }`
  - `userAgent`, `locale`
- **Response payload**: a `hello-ok` object (includes `features.methods[]`, `features.events[]`, `snapshot`, and optional issued `deviceToken`)

### RPC method dispatch (after handshake)

After `connect` succeeds, the backend routes each request by `method`:

- **Dispatcher**: `src/gateway/server-methods.ts#handleGatewayRequest` (looks up handlers in `coreGatewayHandlers`)
- **Handler registry**: `src/gateway/server-methods.ts#coreGatewayHandlers` (spreads handler maps from `src/gateway/server-methods/*.ts`)

### RPC methods by domain

#### Chat

##### `chat.history`

- **Responsibility**: Return recent transcript messages for a session (and defaults like thinking/verbose).
- **Contract**:
  - **Params**: `{ sessionKey: string, limit?: number }`
  - **Response**: `{ sessionKey, sessionId?, messages: unknown[], thinkingLevel?, verboseLevel? }`
- **Triggered in web**: `ui/src/ui/controllers/chat.ts#loadChatHistory`
- **Handled in backend**: `src/gateway/server-methods/chat.ts#chatHandlers["chat.history"]`

##### `chat.send`

- **Responsibility**: Run a chat turn for the session, stream events (`event: "chat"`) as output is produced.
- **Contract** (summary):
  - **Params**: `{ sessionKey: string, message: string, idempotencyKey: string, deliver?: boolean, attachments?: { type, mimeType, content }[], timeoutMs?: number }`
  - **Response**: `{ ok: true, runId?: string, ... }` (exact payload varies; UI primarily relies on chat events)
- **Triggered in web**: `ui/src/ui/controllers/chat.ts#sendChatMessage`
- **Handled in backend**: `src/gateway/server-methods/chat.ts#chatHandlers["chat.send"]`

##### `chat.abort`

- **Responsibility**: Abort an in-flight chat run (by `runId`) or all in-flight runs for `sessionKey`.
- **Contract**:
  - **Params**: `{ sessionKey: string, runId?: string }`
  - **Response**: `{ ok: true, aborted: boolean, runIds: string[] }`
- **Triggered in web**: `ui/src/ui/controllers/chat.ts#abortChatRun`
- **Handled in backend**: `src/gateway/server-methods/chat.ts#chatHandlers["chat.abort"]`

#### Sessions

##### `sessions.list`

- **Responsibility**: List known sessions for display in the Sessions panel.
- **Contract**:
  - **Params**: `{ includeGlobal?: boolean, includeUnknown?: boolean, activeMinutes?: number, limit?: number }`
  - **Response**: `SessionsListResult` (see `ui/src/ui/types.ts`)
- **Triggered in web**: `ui/src/ui/controllers/sessions.ts#loadSessions`
- **Handled in backend**: `src/gateway/server-methods/sessions.ts#sessionsHandlers["sessions.list"]`

##### `sessions.patch`

- **Responsibility**: Update session metadata (label, model/thinking settings, etc.).
- **Contract**:
  - **Params**: `{ key: string, label?: string | null, thinkingLevel?: string | null, verboseLevel?: string | null, reasoningLevel?: string | null, ... }`
  - **Response**: `{ ok: true, key: string, entry: unknown, resolved?: unknown, path?: string }`
- **Triggered in web**: `ui/src/ui/controllers/sessions.ts#patchSession`
- **Handled in backend**: `src/gateway/server-methods/sessions.ts#sessionsHandlers["sessions.patch"]`

##### `sessions.delete`

- **Responsibility**: Delete a session entry (and optionally archive transcript).
- **Contract**:
  - **Params**: `{ key: string, deleteTranscript?: boolean }`
  - **Response**: `{ ok: true, key: string, existed?: boolean, ... }` (details depend on delete path)
- **Triggered in web**: `ui/src/ui/controllers/sessions.ts#deleteSession`
- **Handled in backend**: `src/gateway/server-methods/sessions.ts#sessionsHandlers["sessions.delete"]`

#### Usage

##### `usage.cost`

- **Responsibility**: Return cost + token usage summary for the selected date range.
- **Contract**:
  - **Params**: `{ startDate?: string, endDate?: string, days?: number }`
  - **Response**: `CostUsageSummary` (UI uses totals + breakdowns)
- **Triggered in web**: `ui/src/ui/controllers/usage.ts#loadUsage` (runs in parallel with `sessions.usage`)
- **Handled in backend**: `src/gateway/server-methods/usage.ts#usageHandlers["usage.cost"]`

##### `sessions.usage`

- **Responsibility**: Return per-session usage entries + aggregates for a date range.
- **Contract**:
  - **Params**: `{ startDate: string, endDate: string, limit?: number, includeContextWeight?: boolean, key?: string }`
  - **Response**: `SessionsUsageResult`
- **Triggered in web**: `ui/src/ui/controllers/usage.ts#loadUsage`
- **Handled in backend**: `src/gateway/server-methods/usage.ts#usageHandlers["sessions.usage"]`

##### `sessions.usage.timeseries`

- **Responsibility**: Return a per-turn usage time series for a single session.
- **Contract**:
  - **Params**: `{ key: string }`
  - **Response**: `SessionUsageTimeSeries`
- **Triggered in web**: `ui/src/ui/controllers/usage.ts#loadSessionTimeSeries`
- **Handled in backend**: `src/gateway/server-methods/usage.ts#usageHandlers["sessions.usage.timeseries"]`

##### `sessions.usage.logs`

- **Responsibility**: Return recent usage/log entries for a single session.
- **Contract**:
  - **Params**: `{ key: string, limit?: number }`
  - **Response**: `{ logs: SessionLogEntry[] }`
- **Triggered in web**: `ui/src/ui/controllers/usage.ts#loadSessionLogs`
- **Handled in backend**: `src/gateway/server-methods/usage.ts#usageHandlers["sessions.usage.logs"]`

#### Skills

##### `skills.status`

- **Responsibility**: Report installed/configured skills (optionally for a specific agent workspace).
- **Contract**:
  - **Params**: `{ agentId?: string }`
  - **Response**: `SkillStatusReport`
- **Triggered in web**:
  - `ui/src/ui/controllers/skills.ts#loadSkills` (no `agentId`)
  - `ui/src/ui/controllers/agent-skills.ts#loadAgentSkills` (`agentId` set)
- **Handled in backend**: `src/gateway/server-methods/skills.ts#skillsHandlers["skills.status"]`

##### `skills.update`

- **Responsibility**: Update skill configuration (enable/disable, API key, env vars).
- **Contract**:
  - **Params**: `{ skillKey: string, enabled?: boolean, apiKey?: string, env?: Record<string,string> }`
  - **Response**: `{ ok: true, skillKey: string, config: unknown }`
- **Triggered in web**:
  - `ui/src/ui/controllers/skills.ts#updateSkillEnabled`
  - `ui/src/ui/controllers/skills.ts#saveSkillApiKey`
- **Handled in backend**: `src/gateway/server-methods/skills.ts#skillsHandlers["skills.update"]`

##### `skills.install`

- **Responsibility**: Install a skill package into the default agent workspace.
- **Contract**:
  - **Params**: `{ name: string, installId: string, timeoutMs?: number }`
  - **Response**: `{ ok: boolean, message: string, ... }` (shape from installer; UI uses `message`)
- **Triggered in web**: `ui/src/ui/controllers/skills.ts#installSkill`
- **Handled in backend**: `src/gateway/server-methods/skills.ts#skillsHandlers["skills.install"]`

#### Agents + identity + files

##### `agents.list`

- **Responsibility**: List configured agents and defaults for selection in the UI.
- **Contract**:
  - **Params**: `{}`
  - **Response**: `AgentsListResult`
- **Triggered in web**: `ui/src/ui/controllers/agents.ts#loadAgents`
- **Handled in backend**: `src/gateway/server-methods/agents.ts#agentsHandlers["agents.list"]`

##### `agent.identity.get`

- **Responsibility**: Resolve assistant identity (name/avatar/agentId), optionally by `sessionKey` or explicit `agentId`.
- **Contract**:
  - **Params**: `{ agentId?: string, sessionKey?: string }`
  - **Response**: `AgentIdentityResult | null`
- **Triggered in web**:
  - `ui/src/ui/controllers/assistant-identity.ts#loadAssistantIdentity`
  - `ui/src/ui/controllers/agent-identity.ts#loadAgentIdentity`
  - `ui/src/ui/controllers/agent-identity.ts#loadAgentIdentities`
- **Handled in backend**: `src/gateway/server-methods/agent.ts#agentHandlers["agent.identity.get"]`

##### `agents.files.list`

- **Responsibility**: List supported workspace files for an agent (bootstrap + memory files).
- **Contract**:
  - **Params**: `{ agentId: string }`
  - **Response**: `{ agentId, workspace, files: { name, path, missing, size?, updatedAtMs? }[] }`
- **Triggered in web**: `ui/src/ui/controllers/agent-files.ts#loadAgentFiles`
- **Handled in backend**: `src/gateway/server-methods/agents.ts#agentsHandlers["agents.files.list"]`

##### `agents.files.get`

- **Responsibility**: Load a specific supported file’s contents for an agent.
- **Contract**:
  - **Params**: `{ agentId: string, name: string }` (name must be in an allowlist)
  - **Response**: `{ agentId, workspace, file: { name, path, missing, content? } }`
- **Triggered in web**: `ui/src/ui/controllers/agent-files.ts#loadAgentFileContent`
- **Handled in backend**: `src/gateway/server-methods/agents.ts#agentsHandlers["agents.files.get"]`

##### `agents.files.set`

- **Responsibility**: Write a supported file’s contents for an agent.
- **Contract**:
  - **Params**: `{ agentId: string, name: string, content: string }` (name must be in an allowlist)
  - **Response**: `{ ok: true, agentId, workspace, file: { name, path, content, ... } }`
- **Triggered in web**: `ui/src/ui/controllers/agent-files.ts#saveAgentFile`
- **Handled in backend**: `src/gateway/server-methods/agents.ts#agentsHandlers["agents.files.set"]`

#### Channels (status + WhatsApp web login)

##### `channels.status`

- **Responsibility**: Return channel/account status snapshots; optionally probe live connectivity.
- **Contract**:
  - **Params**: `{ probe?: boolean, timeoutMs?: number }`
  - **Response**: `ChannelsStatusSnapshot` (UI expects `channels`, `channelAccounts`, etc.)
- **Triggered in web**: `ui/src/ui/controllers/channels.ts#loadChannels`
- **Handled in backend**: `src/gateway/server-methods/channels.ts#channelsHandlers["channels.status"]`

##### `web.login.start`

- **Responsibility**: Start QR-based web login for the active “web provider” (e.g. WhatsApp web).
- **Contract**:
  - **Params**: `{ force?: boolean, timeoutMs?: number, verbose?: boolean, accountId?: string }`
  - **Response**: `{ message?: string, qrDataUrl?: string }`
- **Triggered in web**: `ui/src/ui/controllers/channels.ts#startWhatsAppLogin`
- **Handled in backend**: `src/gateway/server-methods/web.ts#webHandlers["web.login.start"]`

##### `web.login.wait`

- **Responsibility**: Wait for QR login completion; if connected, start the channel.
- **Contract**:
  - **Params**: `{ timeoutMs?: number, accountId?: string }`
  - **Response**: `{ message?: string, connected?: boolean }`
- **Triggered in web**: `ui/src/ui/controllers/channels.ts#waitWhatsAppLogin`
- **Handled in backend**: `src/gateway/server-methods/web.ts#webHandlers["web.login.wait"]`

##### `channels.logout`

- **Responsibility**: Log out of a channel account (UI currently calls it for WhatsApp).
- **Contract**:
  - **Params**: `{ channel: string, accountId?: string }`
  - **Response**: `{ channel, accountId, cleared: boolean, loggedOut: boolean, ... }`
- **Triggered in web**: `ui/src/ui/controllers/channels.ts#logoutWhatsApp`
- **Handled in backend**: `src/gateway/server-methods/channels.ts#channelsHandlers["channels.logout"]`

#### Nodes

##### `node.list`

- **Responsibility**: List nodes (paired + connected) and basic metadata for display.
- **Contract**:
  - **Params**: `{}`
  - **Response**: `{ ts: number, nodes: unknown[] }`
- **Triggered in web**: `ui/src/ui/controllers/nodes.ts#loadNodes`
- **Handled in backend**: `src/gateway/server-methods/nodes.ts#nodeHandlers["node.list"]`

#### Devices (pairing + tokens)

##### `device.pair.list`

- **Responsibility**: List pending device pairing requests and paired devices.
- **Contract**:
  - **Params**: `{}`
  - **Response**: `{ pending: unknown[], paired: unknown[] }` (paired tokens are summarized/redacted)
- **Triggered in web**: `ui/src/ui/controllers/devices.ts#loadDevices`
- **Handled in backend**: `src/gateway/server-methods/devices.ts#deviceHandlers["device.pair.list"]`

##### `device.pair.approve`

- **Responsibility**: Approve a device pairing request.
- **Contract**:
  - **Params**: `{ requestId: string }`
  - **Response**: `{ requestId, device }`
- **Triggered in web**: `ui/src/ui/controllers/devices.ts#approveDevicePairing`
- **Handled in backend**: `src/gateway/server-methods/devices.ts#deviceHandlers["device.pair.approve"]`

##### `device.pair.reject`

- **Responsibility**: Reject a device pairing request.
- **Contract**:
  - **Params**: `{ requestId: string }`
  - **Response**: `{ requestId, deviceId, ... }`
- **Triggered in web**: `ui/src/ui/controllers/devices.ts#rejectDevicePairing`
- **Handled in backend**: `src/gateway/server-methods/devices.ts#deviceHandlers["device.pair.reject"]`

##### `device.token.rotate`

- **Responsibility**: Rotate (issue) a new device token for a device/role.
- **Contract**:
  - **Params**: `{ deviceId: string, role: string, scopes?: string[] }`
  - **Response**: `{ deviceId, role, token, scopes, rotatedAtMs }`
- **Triggered in web**: `ui/src/ui/controllers/devices.ts#rotateDeviceToken`
- **Handled in backend**: `src/gateway/server-methods/devices.ts#deviceHandlers["device.token.rotate"]`

##### `device.token.revoke`

- **Responsibility**: Revoke a device token for a device/role.
- **Contract**:
  - **Params**: `{ deviceId: string, role: string }`
  - **Response**: `{ deviceId, role, revokedAtMs }`
- **Triggered in web**: `ui/src/ui/controllers/devices.ts#revokeDeviceToken`
- **Handled in backend**: `src/gateway/server-methods/devices.ts#deviceHandlers["device.token.revoke"]`

#### Cron

##### `cron.status`

- **Responsibility**: Return cron subsystem status.
- **Contract**:
  - **Params**: `{}`
  - **Response**: `CronStatus`
- **Triggered in web**: `ui/src/ui/controllers/cron.ts#loadCronStatus`
- **Handled in backend**: `src/gateway/server-methods/cron.ts#cronHandlers["cron.status"]`

##### `cron.list`

- **Responsibility**: List cron jobs.
- **Contract**:
  - **Params**: `{ includeDisabled?: boolean }`
  - **Response**: `{ jobs: CronJob[] }`
- **Triggered in web**: `ui/src/ui/controllers/cron.ts#loadCronJobs`
- **Handled in backend**: `src/gateway/server-methods/cron.ts#cronHandlers["cron.list"]`

##### `cron.add`

- **Responsibility**: Create a cron job.
- **Contract**:
  - **Params**: `CronJobCreate` (object; UI sends `{ name, description?, agentId?, enabled, schedule, sessionTarget, wakeMode, payload, delivery? }`)
  - **Response**: created `CronJob`
- **Triggered in web**: `ui/src/ui/controllers/cron.ts#addCronJob`
- **Handled in backend**: `src/gateway/server-methods/cron.ts#cronHandlers["cron.add"]`

##### `cron.update`

- **Responsibility**: Patch an existing cron job (UI toggles `enabled`).
- **Contract**:
  - **Params**: `{ id?: string, jobId?: string, patch: CronJobPatch }`
  - **Response**: updated `CronJob`
- **Triggered in web**: `ui/src/ui/controllers/cron.ts#toggleCronJob`
- **Handled in backend**: `src/gateway/server-methods/cron.ts#cronHandlers["cron.update"]`

##### `cron.run`

- **Responsibility**: Run a cron job immediately (UI uses `mode: "force"`).
- **Contract**:
  - **Params**: `{ id?: string, jobId?: string, mode?: "due" | "force" }`
  - **Response**: `{ ok: true, ... }` (run metadata)
- **Triggered in web**: `ui/src/ui/controllers/cron.ts#runCronJob`
- **Handled in backend**: `src/gateway/server-methods/cron.ts#cronHandlers["cron.run"]`

##### `cron.remove`

- **Responsibility**: Remove a cron job.
- **Contract**:
  - **Params**: `{ id?: string, jobId?: string }`
  - **Response**: `{ ok: true, ... }`
- **Triggered in web**: `ui/src/ui/controllers/cron.ts#removeCronJob`
- **Handled in backend**: `src/gateway/server-methods/cron.ts#cronHandlers["cron.remove"]`

##### `cron.runs`

- **Responsibility**: Return recent cron run log entries for a job.
- **Contract**:
  - **Params**: `{ id?: string, jobId?: string, limit?: number }`
  - **Response**: `{ entries: CronRunLogEntry[] }`
- **Triggered in web**: `ui/src/ui/controllers/cron.ts#loadCronRuns`
- **Handled in backend**: `src/gateway/server-methods/cron.ts#cronHandlers["cron.runs"]`

#### Config + update

##### `config.get`

- **Responsibility**: Return a (redacted) config snapshot with validation status and a hash used for optimistic concurrency.
- **Contract**:
  - **Params**: `{}`
  - **Response**: `ConfigSnapshot` (includes `hash`, `raw` or `config`, `valid`, `issues`)
- **Triggered in web**: `ui/src/ui/controllers/config.ts#loadConfig`
- **Handled in backend**: `src/gateway/server-methods/config.ts#configHandlers["config.get"]`

##### `config.schema`

- **Responsibility**: Return config JSON schema + UI hints (including plugin/channel-provided schema).
- **Contract**:
  - **Params**: `{}`
  - **Response**: `ConfigSchemaResponse`
- **Triggered in web**: `ui/src/ui/controllers/config.ts#loadConfigSchema`
- **Handled in backend**: `src/gateway/server-methods/config.ts#configHandlers["config.schema"]`

##### `config.set`

- **Responsibility**: Validate and write config (does not necessarily run an agent turn).
- **Contract**:
  - **Params**: `{ raw: string, baseHash: string }`
  - **Response**: `{ ok: true, path: string, config: object, restart: unknown, sentinel?: unknown }`
- **Triggered in web**: `ui/src/ui/controllers/config.ts#saveConfig`
- **Handled in backend**: `src/gateway/server-methods/config.ts#configHandlers["config.set"]`

##### `config.apply`

- **Responsibility**: Validate + write config and schedule a gateway restart; optionally attach the change to a session.
- **Contract**:
  - **Params**: `{ raw: string, baseHash: string, sessionKey?: string, note?: string }`
  - **Response**: `{ ok: true, path: string, config: object, restart: unknown, sentinel?: unknown }`
- **Triggered in web**: `ui/src/ui/controllers/config.ts#applyConfig`
- **Handled in backend**: `src/gateway/server-methods/config.ts#configHandlers["config.apply"]`

##### `update.run`

- **Responsibility**: Run the gateway update routine and schedule a restart.
- **Contract**:
  - **Params**: `{ sessionKey?: string, note?: string, restartDelayMs?: number, timeoutMs?: number }`
  - **Response**: `{ ok: true, restart: unknown, sentinel?: unknown, result?: unknown }`
- **Triggered in web**: `ui/src/ui/controllers/config.ts#runUpdate`
- **Handled in backend**: `src/gateway/server-methods/update.ts#updateHandlers["update.run"]`

#### Presence

##### `system-presence`

- **Responsibility**: Return current system presence entries (recent gateway/node instances).
- **Contract**:
  - **Params**: `{}`
  - **Response**: `PresenceEntry[]`
- **Triggered in web**: `ui/src/ui/controllers/presence.ts#loadPresence`
- **Handled in backend**: `src/gateway/server-methods/system.ts#systemHandlers["system-presence"]`

#### Logs

##### `logs.tail`

- **Responsibility**: Tail the gateway log file from a cursor, returning lines + new cursor.
- **Contract**:
  - **Params**: `{ cursor?: number, limit?: number, maxBytes?: number }`
  - **Response**: `{ file: string, cursor: number, size: number, lines: string[], truncated?: boolean, reset?: boolean }`
- **Triggered in web**: `ui/src/ui/controllers/logs.ts#loadLogs`
- **Handled in backend**: `src/gateway/server-methods/logs.ts#logsHandlers["logs.tail"]`

#### Exec approvals (policy file)

##### `exec.approvals.get`

- **Responsibility**: Load the local exec approvals policy file (with hash for optimistic concurrency).
- **Contract**:
  - **Params**: `{}`
  - **Response**: `{ path, exists, hash, file }`
- **Triggered in web**: `ui/src/ui/controllers/exec-approvals.ts#loadExecApprovals`
- **Handled in backend**: `src/gateway/server-methods/exec-approvals.ts#execApprovalsHandlers["exec.approvals.get"]`

##### `exec.approvals.set`

- **Responsibility**: Save the local exec approvals policy file.
- **Contract**:
  - **Params**: `{ file: ExecApprovalsFile, baseHash?: string }`
  - **Response**: `{ path, exists, hash, file }`
- **Triggered in web**: `ui/src/ui/controllers/exec-approvals.ts#saveExecApprovals`
- **Handled in backend**: `src/gateway/server-methods/exec-approvals.ts#execApprovalsHandlers["exec.approvals.set"]`

##### `exec.approvals.node.get`

- **Responsibility**: Load exec approvals policy from a node (remote invoke).
- **Contract**:
  - **Params**: `{ nodeId: string }`
  - **Response**: node-provided snapshot payload
- **Triggered in web**: `ui/src/ui/controllers/exec-approvals.ts#loadExecApprovals` (when target is `{ kind: "node" }`)
- **Handled in backend**: `src/gateway/server-methods/exec-approvals.ts#execApprovalsHandlers["exec.approvals.node.get"]`

##### `exec.approvals.node.set`

- **Responsibility**: Save exec approvals policy to a node (remote invoke).
- **Contract**:
  - **Params**: `{ nodeId: string, file: ExecApprovalsFile, baseHash?: string }`
  - **Response**: node-provided response payload
- **Triggered in web**: `ui/src/ui/controllers/exec-approvals.ts#saveExecApprovals` (node target)
- **Handled in backend**: `src/gateway/server-methods/exec-approvals.ts#execApprovalsHandlers["exec.approvals.node.set"]`

#### Exec approvals (approve/deny prompts)

##### `exec.approval.resolve`

- **Responsibility**: Resolve an exec approval prompt (allow once/always/deny).
- **Contract**:
  - **Params**: `{ id: string, decision: "allow-once" | "allow-always" | "deny" }`
  - **Response**: `{ ok: true }`
- **Triggered in web**: `ui/src/ui/app.ts#handleExecApprovalDecision`
- **Handled in backend**: `src/gateway/server-methods/exec-approval.ts#createExecApprovalHandlers` → `["exec.approval.resolve"]`

#### Debug/system

##### `status`

- **Responsibility**: Return a status summary for the gateway.
- **Contract**:
  - **Params**: `{}`
  - **Response**: `StatusSummary`
- **Triggered in web**: `ui/src/ui/controllers/debug.ts#loadDebug`
- **Handled in backend**: `src/gateway/server-methods/health.ts#healthHandlers.status`

##### `health`

- **Responsibility**: Return gateway health snapshot (cached unless `probe: true`).
- **Contract**:
  - **Params**: `{ probe?: boolean }`
  - **Response**: `HealthSnapshot`
- **Triggered in web**: `ui/src/ui/controllers/debug.ts#loadDebug`
- **Handled in backend**: `src/gateway/server-methods/health.ts#healthHandlers.health`

##### `models.list`

- **Responsibility**: Return the gateway’s model catalog.
- **Contract**:
  - **Params**: `{}`
  - **Response**: `{ models: unknown[] }`
- **Triggered in web**: `ui/src/ui/controllers/debug.ts#loadDebug`
- **Handled in backend**: `src/gateway/server-methods/models.ts#modelsHandlers["models.list"]`

##### `last-heartbeat`

- **Responsibility**: Return the last heartbeat event snapshot.
- **Contract**:
  - **Params**: `{}`
  - **Response**: unknown (heartbeat event payload)
- **Triggered in web**: `ui/src/ui/controllers/debug.ts#loadDebug`
- **Handled in backend**: `src/gateway/server-methods/system.ts#systemHandlers["last-heartbeat"]`

##### Debug arbitrary RPC calls

The debug tab also lets an operator call an arbitrary method name:

- **Triggered in web**: `ui/src/ui/controllers/debug.ts#callDebugMethod` (uses `state.debugCallMethod`)
- **Handled in backend**: whatever handler matches that method in `src/gateway/server-methods.ts#handleGatewayRequest`
