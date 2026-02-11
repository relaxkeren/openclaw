# Repository Knowledge Overview

This file is an **exhaustive map** of the Markdown knowledge in this repository. It lists every in-repo Markdown page, organized so you can quickly find docs, runbooks, READMEs, hooks, and skills.

**Scope**

- Includes: all `*.md` plus Mintlify `docs/*.mdx` pages
- Excludes: `docs/zh-CN/**` (generated translations)

## Start here

- [knowledge/overview.md](knowledge/overview.md) — Repository Knowledge Overview (this file)
- [README.md](README.md) — 🦞 OpenClaw — Personal AI Assistant
- [ops.md](ops.md) — Ops notes (from-source)
- [knowledge/local-development.md](knowledge/local-development.md) — Local development setup (init, run from repo)
- [knowledge/logging-setup.md](knowledge/logging-setup.md) — Logging mechanism (file appender, LOG_FOLDER, LLM file log)
- [docs/index.md](docs/index.md) — OpenClaw
- [docs/start/docs-directory.md](docs/start/docs-directory.md) — Docs directory
- [docs/start/hubs.md](docs/start/hubs.md) — Docs Hubs
- [docs/docs.json](docs/docs.json) — Docs site navigation (Mintlify)

## Docs site map (`docs/`)

Mintlify navigation lives in `docs/docs.json`. The sections below follow the **English nav tabs/groups**, then list any docs pages not referenced by the nav.

### Get started

- **Overview**
  - [docs/index.md](docs/index.md) — OpenClaw
  - [docs/concepts/features.md](docs/concepts/features.md) — Features
  - [docs/start/showcase.md](docs/start/showcase.md) — Showcase
- **First steps**
  - [docs/start/getting-started.md](docs/start/getting-started.md) — Getting Started
  - [docs/start/wizard.md](docs/start/wizard.md) — Onboarding Wizard (CLI)
  - [docs/start/onboarding.md](docs/start/onboarding.md) — Onboarding (macOS App)
- **Guides**
  - [docs/start/openclaw.md](docs/start/openclaw.md) — Personal Assistant Setup

### Install

- **Install overview**
  - [docs/install/index.md](docs/install/index.md) — Install Overview
  - [docs/install/installer.md](docs/install/installer.md) — Installer Internals
- **Install methods**
  - [docs/install/node.md](docs/install/node.md) — Node.js + npm (PATH sanity)
  - [docs/install/docker.md](docs/install/docker.md) — Docker
  - [docs/install/nix.md](docs/install/nix.md) — Nix
  - [docs/install/ansible.md](docs/install/ansible.md) — Ansible
  - [docs/install/bun.md](docs/install/bun.md) — Bun (Experimental)
- **Maintenance**
  - [docs/install/updating.md](docs/install/updating.md) — Updating
  - [docs/install/migrating.md](docs/install/migrating.md) — Migration Guide
  - [docs/install/uninstall.md](docs/install/uninstall.md) — Uninstall
- **Hosting and deployment**
  - [docs/install/fly.md](docs/install/fly.md) — Fly.io
  - [docs/install/hetzner.md](docs/install/hetzner.md) — Hetzner
  - [docs/install/gcp.md](docs/install/gcp.md) — GCP
  - [docs/install/macos-vm.md](docs/install/macos-vm.md) — macOS VMs
  - [docs/install/exe-dev.md](docs/install/exe-dev.md) — exe.dev
  - [docs/install/railway.mdx](docs/install/railway.mdx) — Deploy on Railway
  - [docs/install/render.mdx](docs/install/render.mdx) — Deploy on Render
  - [docs/install/northflank.mdx](docs/install/northflank.mdx) — Deploy on Northflank
- **Advanced**
  - [docs/install/development-channels.md](docs/install/development-channels.md) — Development Channels

### Channels

- **Overview**
  - [docs/channels/index.md](docs/channels/index.md) — Chat Channels
- **Messaging platforms**
  - [docs/channels/whatsapp.md](docs/channels/whatsapp.md) — WhatsApp
  - [docs/channels/telegram.md](docs/channels/telegram.md) — Telegram
  - [docs/channels/grammy.md](docs/channels/grammy.md) — grammY
  - [docs/channels/discord.md](docs/channels/discord.md) — Discord
  - [docs/channels/slack.md](docs/channels/slack.md) — Slack
  - [docs/channels/feishu.md](docs/channels/feishu.md) — Feishu
  - [docs/channels/googlechat.md](docs/channels/googlechat.md) — Google Chat
  - [docs/channels/mattermost.md](docs/channels/mattermost.md) — Mattermost
  - [docs/channels/signal.md](docs/channels/signal.md) — Signal
  - [docs/channels/imessage.md](docs/channels/imessage.md) — iMessage
  - [docs/channels/msteams.md](docs/channels/msteams.md) — Microsoft Teams
  - [docs/channels/line.md](docs/channels/line.md) — LINE
  - [docs/channels/matrix.md](docs/channels/matrix.md) — Matrix
  - [docs/channels/zalo.md](docs/channels/zalo.md) — Zalo
  - [docs/channels/zalouser.md](docs/channels/zalouser.md) — Zalo Personal
- **Configuration**
  - [docs/start/pairing.md](docs/start/pairing.md) — Pairing
  - [docs/concepts/group-messages.md](docs/concepts/group-messages.md) — Group Messages
  - [docs/concepts/groups.md](docs/concepts/groups.md) — Groups
  - [docs/broadcast-groups.md](docs/broadcast-groups.md) — Broadcast Groups
  - [docs/concepts/channel-routing.md](docs/concepts/channel-routing.md) — Channel Routing
  - [docs/channels/location.md](docs/channels/location.md) — Channel Location Parsing
  - [docs/channels/troubleshooting.md](docs/channels/troubleshooting.md) — Channel Troubleshooting

### Agents

- **Fundamentals**
  - [docs/concepts/architecture.md](docs/concepts/architecture.md) — Gateway Architecture
  - [docs/concepts/agent.md](docs/concepts/agent.md) — Agent Runtime
  - [docs/concepts/agent-loop.md](docs/concepts/agent-loop.md) — Agent Loop
  - [docs/concepts/system-prompt.md](docs/concepts/system-prompt.md) — System Prompt
  - [docs/concepts/context.md](docs/concepts/context.md) — Context
  - [docs/concepts/agent-workspace.md](docs/concepts/agent-workspace.md) — Agent Workspace
  - [docs/start/bootstrapping.md](docs/start/bootstrapping.md) — Agent Bootstrapping
  - [docs/concepts/oauth.md](docs/concepts/oauth.md) — OAuth
- **Sessions and memory**
  - [docs/concepts/session.md](docs/concepts/session.md) — Session Management
  - [docs/concepts/sessions.md](docs/concepts/sessions.md) — Sessions
  - [docs/concepts/session-pruning.md](docs/concepts/session-pruning.md) — Session Pruning
  - [docs/concepts/session-tool.md](docs/concepts/session-tool.md) — Session Tools
  - [docs/concepts/memory.md](docs/concepts/memory.md) — Memory
  - [docs/concepts/compaction.md](docs/concepts/compaction.md) — Compaction
- **Multi-agent**
  - [docs/concepts/multi-agent.md](docs/concepts/multi-agent.md) — Multi-Agent Routing
  - [docs/concepts/presence.md](docs/concepts/presence.md) — Presence
- **Messages and delivery**
  - [docs/concepts/messages.md](docs/concepts/messages.md) — Messages
  - [docs/concepts/streaming.md](docs/concepts/streaming.md) — Streaming and Chunking
  - [docs/concepts/retry.md](docs/concepts/retry.md) — Retry Policy
  - [docs/concepts/queue.md](docs/concepts/queue.md) — Command Queue

### Tools

- **Overview**
  - [docs/tools/index.md](docs/tools/index.md) — Tools
- **Built-in tools**
  - [docs/tools/lobster.md](docs/tools/lobster.md) — Lobster
  - [docs/tools/llm-task.md](docs/tools/llm-task.md) — LLM Task
  - [docs/tools/exec.md](docs/tools/exec.md) — Exec Tool
  - [docs/tools/web.md](docs/tools/web.md) — Web Tools
  - [docs/tools/apply-patch.md](docs/tools/apply-patch.md) — apply_patch Tool
  - [docs/tools/elevated.md](docs/tools/elevated.md) — Elevated Mode
  - [docs/tools/thinking.md](docs/tools/thinking.md) — Thinking Levels
  - [docs/tools/reactions.md](docs/tools/reactions.md) — Reactions
- **Browser**
  - [docs/tools/browser.md](docs/tools/browser.md) — Browser (OpenClaw-managed)
  - [docs/tools/browser-login.md](docs/tools/browser-login.md) — Browser Login
  - [docs/tools/chrome-extension.md](docs/tools/chrome-extension.md) — Chrome Extension
  - [docs/tools/browser-linux-troubleshooting.md](docs/tools/browser-linux-troubleshooting.md) — Browser Troubleshooting
- **Agent coordination**
  - [docs/tools/agent-send.md](docs/tools/agent-send.md) — Agent Send
  - [docs/tools/subagents.md](docs/tools/subagents.md) — Sub-Agents
  - [docs/multi-agent-sandbox-tools.md](docs/multi-agent-sandbox-tools.md) — Multi-Agent Sandbox & Tools
- **Skills and extensions**
  - [docs/tools/slash-commands.md](docs/tools/slash-commands.md) — Slash Commands
  - [docs/tools/skills.md](docs/tools/skills.md) — Skills
  - [docs/tools/skills-config.md](docs/tools/skills-config.md) — Skills Config
  - [docs/tools/clawhub.md](docs/tools/clawhub.md) — ClawHub
  - [docs/plugin.md](docs/plugin.md) — Plugins
  - [docs/plugins/voice-call.md](docs/plugins/voice-call.md) — Voice Call Plugin
  - [docs/plugins/zalouser.md](docs/plugins/zalouser.md) — Zalo Personal Plugin
- **Automation**
  - [docs/hooks.md](docs/hooks.md) — Hooks
  - [docs/hooks/soul-evil.md](docs/hooks/soul-evil.md) — SOUL Evil Hook
  - [docs/automation/cron-jobs.md](docs/automation/cron-jobs.md) — Cron Jobs
  - [docs/automation/cron-vs-heartbeat.md](docs/automation/cron-vs-heartbeat.md) — Cron vs Heartbeat
  - [docs/automation/webhook.md](docs/automation/webhook.md) — Webhooks
  - [docs/automation/gmail-pubsub.md](docs/automation/gmail-pubsub.md) — Gmail PubSub
  - [docs/automation/poll.md](docs/automation/poll.md) — Polls
  - [docs/automation/auth-monitoring.md](docs/automation/auth-monitoring.md) — Auth Monitoring
- **Media and devices**
  - [docs/nodes/index.md](docs/nodes/index.md) — Nodes
  - [docs/nodes/images.md](docs/nodes/images.md) — Image and Media Support
  - [docs/nodes/audio.md](docs/nodes/audio.md) — Audio and Voice Notes
  - [docs/nodes/camera.md](docs/nodes/camera.md) — Camera Capture
  - [docs/nodes/talk.md](docs/nodes/talk.md) — Talk Mode
  - [docs/nodes/voicewake.md](docs/nodes/voicewake.md) — Voice Wake
  - [docs/nodes/location-command.md](docs/nodes/location-command.md) — Location Command

### Models

- **Overview**
  - [docs/providers/index.md](docs/providers/index.md) — Model Providers
  - [docs/providers/models.md](docs/providers/models.md) — Model Provider Quickstart
  - [docs/concepts/models.md](docs/concepts/models.md) — Models CLI
- **Configuration**
  - [docs/concepts/model-providers.md](docs/concepts/model-providers.md) — Model Providers
  - [docs/concepts/model-failover.md](docs/concepts/model-failover.md) — Model Failover
- **Providers**
  - [docs/providers/anthropic.md](docs/providers/anthropic.md) — Anthropic
  - [docs/providers/openai.md](docs/providers/openai.md) — OpenAI
  - [docs/providers/openrouter.md](docs/providers/openrouter.md) — OpenRouter
  - [docs/bedrock.md](docs/bedrock.md) — Amazon Bedrock
  - [docs/providers/vercel-ai-gateway.md](docs/providers/vercel-ai-gateway.md) — Vercel AI Gateway
  - [docs/providers/moonshot.md](docs/providers/moonshot.md) — Moonshot AI
  - [docs/providers/minimax.md](docs/providers/minimax.md) — MiniMax
  - [docs/providers/opencode.md](docs/providers/opencode.md) — OpenCode Zen
  - [docs/providers/glm.md](docs/providers/glm.md) — GLM Models
  - [docs/providers/zai.md](docs/providers/zai.md) — Z.AI
  - [docs/providers/synthetic.md](docs/providers/synthetic.md) — Synthetic

### Platforms

- **Platforms overview**
  - [docs/platforms/index.md](docs/platforms/index.md) — Platforms
  - [docs/platforms/macos.md](docs/platforms/macos.md) — macOS App
  - [docs/platforms/linux.md](docs/platforms/linux.md) — Linux App
  - [docs/platforms/windows.md](docs/platforms/windows.md) — Windows (WSL2)
  - [docs/platforms/android.md](docs/platforms/android.md) — Android App
  - [docs/platforms/ios.md](docs/platforms/ios.md) — iOS App
- **macOS companion app**
  - [docs/platforms/mac/dev-setup.md](docs/platforms/mac/dev-setup.md) — macOS Dev Setup
  - [docs/platforms/mac/menu-bar.md](docs/platforms/mac/menu-bar.md) — Menu Bar
  - [docs/platforms/mac/voicewake.md](docs/platforms/mac/voicewake.md) — Voice Wake
  - [docs/platforms/mac/voice-overlay.md](docs/platforms/mac/voice-overlay.md) — Voice Overlay
  - [docs/platforms/mac/webchat.md](docs/platforms/mac/webchat.md) — WebChat
  - [docs/platforms/mac/canvas.md](docs/platforms/mac/canvas.md) — Canvas
  - [docs/platforms/mac/child-process.md](docs/platforms/mac/child-process.md) — Gateway Lifecycle
  - [docs/platforms/mac/health.md](docs/platforms/mac/health.md) — Health Checks
  - [docs/platforms/mac/icon.md](docs/platforms/mac/icon.md) — Menu Bar Icon
  - [docs/platforms/mac/logging.md](docs/platforms/mac/logging.md) — macOS Logging
  - [docs/platforms/mac/permissions.md](docs/platforms/mac/permissions.md) — macOS Permissions
  - [docs/platforms/mac/remote.md](docs/platforms/mac/remote.md) — Remote Control
  - [docs/platforms/mac/signing.md](docs/platforms/mac/signing.md) — macOS Signing
  - [docs/platforms/mac/release.md](docs/platforms/mac/release.md) — macOS Release
  - [docs/platforms/mac/bundled-gateway.md](docs/platforms/mac/bundled-gateway.md) — Gateway on macOS
  - [docs/platforms/mac/xpc.md](docs/platforms/mac/xpc.md) — macOS IPC
  - [docs/platforms/mac/skills.md](docs/platforms/mac/skills.md) — Skills
  - [docs/platforms/mac/peekaboo.md](docs/platforms/mac/peekaboo.md) — Peekaboo Bridge

### Gateway & Ops

- **Gateway**
  - [docs/gateway/index.md](docs/gateway/index.md) — Gateway Runbook
  - [docs/gateway/configuration.md](docs/gateway/configuration.md) — Configuration
  - [docs/gateway/configuration-examples.md](docs/gateway/configuration-examples.md) — Configuration Examples
  - [docs/gateway/authentication.md](docs/gateway/authentication.md) — Authentication
  - [docs/gateway/health.md](docs/gateway/health.md) — Health Checks
  - [docs/gateway/heartbeat.md](docs/gateway/heartbeat.md) — Heartbeat
  - [docs/gateway/doctor.md](docs/gateway/doctor.md) — Doctor
  - [docs/gateway/logging.md](docs/gateway/logging.md) — Logging
  - [docs/gateway/gateway-lock.md](docs/gateway/gateway-lock.md) — Gateway Lock
  - [docs/gateway/background-process.md](docs/gateway/background-process.md) — Background Exec and Process Tool
  - [docs/gateway/multiple-gateways.md](docs/gateway/multiple-gateways.md) — Multiple Gateways
  - [docs/gateway/troubleshooting.md](docs/gateway/troubleshooting.md) — Troubleshooting
  - [docs/gateway/security/index.md](docs/gateway/security/index.md) — Security
  - [docs/gateway/sandboxing.md](docs/gateway/sandboxing.md) — Sandboxing
  - [docs/gateway/sandbox-vs-tool-policy-vs-elevated.md](docs/gateway/sandbox-vs-tool-policy-vs-elevated.md) — Sandbox vs Tool Policy vs Elevated
  - [docs/gateway/protocol.md](docs/gateway/protocol.md) — Gateway Protocol
  - [docs/gateway/bridge-protocol.md](docs/gateway/bridge-protocol.md) — Bridge Protocol
  - [docs/gateway/openai-http-api.md](docs/gateway/openai-http-api.md) — OpenAI Chat Completions
  - [docs/gateway/tools-invoke-http-api.md](docs/gateway/tools-invoke-http-api.md) — Tools Invoke API
  - [docs/gateway/cli-backends.md](docs/gateway/cli-backends.md) — CLI Backends
  - [docs/gateway/local-models.md](docs/gateway/local-models.md) — Local Models
  - [docs/gateway/network-model.md](docs/gateway/network-model.md) — Network model
  - [docs/gateway/pairing.md](docs/gateway/pairing.md) — Gateway-Owned Pairing
  - [docs/gateway/discovery.md](docs/gateway/discovery.md) — Discovery and Transports
  - [docs/gateway/bonjour.md](docs/gateway/bonjour.md) — Bonjour Discovery
- **Remote access**
  - [docs/gateway/remote.md](docs/gateway/remote.md) — Remote Access
  - [docs/gateway/remote-gateway-readme.md](docs/gateway/remote-gateway-readme.md) — Remote Gateway Setup
  - [docs/gateway/tailscale.md](docs/gateway/tailscale.md) — Tailscale
- **Security**
  - [docs/security/formal-verification.md](docs/security/formal-verification.md) — Formal Verification (Security Models)
- **Web interfaces**
  - [docs/web/index.md](docs/web/index.md) — Web
  - [docs/web/control-ui.md](docs/web/control-ui.md) — Control UI
  - [docs/web/dashboard.md](docs/web/dashboard.md) — Dashboard
  - [docs/web/webchat.md](docs/web/webchat.md) — WebChat
  - [docs/tui.md](docs/tui.md) — TUI

### Reference

- **CLI commands**
  - [docs/cli/index.md](docs/cli/index.md) — CLI Reference
  - [docs/cli/agent.md](docs/cli/agent.md) — agent
  - [docs/cli/agents.md](docs/cli/agents.md) — agents
  - [docs/cli/approvals.md](docs/cli/approvals.md) — approvals
  - [docs/cli/browser.md](docs/cli/browser.md) — browser
  - [docs/cli/channels.md](docs/cli/channels.md) — channels
  - [docs/cli/configure.md](docs/cli/configure.md) — configure
  - [docs/cli/cron.md](docs/cli/cron.md) — cron
  - [docs/cli/dashboard.md](docs/cli/dashboard.md) — dashboard
  - [docs/cli/directory.md](docs/cli/directory.md) — directory
  - [docs/cli/dns.md](docs/cli/dns.md) — dns
  - [docs/cli/docs.md](docs/cli/docs.md) — docs
  - [docs/cli/doctor.md](docs/cli/doctor.md) — doctor
  - [docs/cli/gateway.md](docs/cli/gateway.md) — gateway
  - [docs/cli/health.md](docs/cli/health.md) — health
  - [docs/cli/hooks.md](docs/cli/hooks.md) — hooks
  - [docs/cli/logs.md](docs/cli/logs.md) — logs
  - [docs/cli/memory.md](docs/cli/memory.md) — memory
  - [docs/cli/message.md](docs/cli/message.md) — message
  - [docs/cli/models.md](docs/cli/models.md) — models
  - [docs/cli/nodes.md](docs/cli/nodes.md) — nodes
  - [docs/cli/onboard.md](docs/cli/onboard.md) — onboard
  - [docs/cli/pairing.md](docs/cli/pairing.md) — pairing
  - [docs/cli/plugins.md](docs/cli/plugins.md) — plugins
  - [docs/cli/reset.md](docs/cli/reset.md) — reset
  - [docs/cli/sandbox.md](docs/cli/sandbox.md) — Sandbox CLI
  - [docs/cli/security.md](docs/cli/security.md) — security
  - [docs/cli/sessions.md](docs/cli/sessions.md) — sessions
  - [docs/cli/setup.md](docs/cli/setup.md) — setup
  - [docs/cli/skills.md](docs/cli/skills.md) — skills
  - [docs/cli/status.md](docs/cli/status.md) — status
  - [docs/cli/system.md](docs/cli/system.md) — system
  - [docs/cli/tui.md](docs/cli/tui.md) — tui
  - [docs/cli/uninstall.md](docs/cli/uninstall.md) — uninstall
  - [docs/cli/update.md](docs/cli/update.md) — update
  - [docs/cli/voicecall.md](docs/cli/voicecall.md) — voicecall
- **RPC and API**
  - [docs/reference/rpc.md](docs/reference/rpc.md) — RPC Adapters
  - [docs/reference/device-models.md](docs/reference/device-models.md) — Device Model Database
- **Templates**
  - [docs/reference/AGENTS.default.md](docs/reference/AGENTS.default.md) — AGENTS.md — OpenClaw Personal Assistant (default)
  - [docs/reference/templates/AGENTS.md](docs/reference/templates/AGENTS.md) — AGENTS.md - Your Workspace
  - [docs/reference/templates/BOOT.md](docs/reference/templates/BOOT.md) — BOOT.md
  - [docs/reference/templates/BOOTSTRAP.md](docs/reference/templates/BOOTSTRAP.md) — BOOTSTRAP.md - Hello, World
  - [docs/reference/templates/HEARTBEAT.md](docs/reference/templates/HEARTBEAT.md) — HEARTBEAT.md
  - [docs/reference/templates/IDENTITY.md](docs/reference/templates/IDENTITY.md) — IDENTITY.md - Who Am I?
  - [docs/reference/templates/SOUL.md](docs/reference/templates/SOUL.md) — SOUL.md - Who You Are
  - [docs/reference/templates/TOOLS.md](docs/reference/templates/TOOLS.md) — TOOLS.md - Local Notes
  - [docs/reference/templates/USER.md](docs/reference/templates/USER.md) — USER.md - About Your Human
- **Technical reference**
  - [docs/reference/wizard.md](docs/reference/wizard.md) — Onboarding Wizard Reference
  - [docs/concepts/typebox.md](docs/concepts/typebox.md) — TypeBox
  - [docs/concepts/markdown-formatting.md](docs/concepts/markdown-formatting.md) — Markdown Formatting
  - [docs/concepts/typing-indicators.md](docs/concepts/typing-indicators.md) — Typing Indicators
  - [docs/concepts/usage-tracking.md](docs/concepts/usage-tracking.md) — Usage Tracking
  - [docs/concepts/timezone.md](docs/concepts/timezone.md) — Timezones
  - [docs/token-use.md](docs/token-use.md) — Token Use and Costs
- **Project**
  - [docs/reference/credits.md](docs/reference/credits.md) — Credits
- **Release notes**
  - [docs/reference/RELEASING.md](docs/reference/RELEASING.md) — Release Checklist (npm + macOS)
  - [docs/reference/test.md](docs/reference/test.md) — Tests

### Help

- **Help**
  - [docs/help/index.md](docs/help/index.md) — Help
  - [docs/help/troubleshooting.md](docs/help/troubleshooting.md) — Troubleshooting
  - [docs/help/faq.md](docs/help/faq.md) — FAQ
- **Community**
  - [docs/start/lore.md](docs/start/lore.md) — OpenClaw Lore
- **Environment and debugging**
  - [docs/environment.md](docs/environment.md) — Environment Variables
  - [docs/debugging.md](docs/debugging.md) — Debugging
  - [docs/testing.md](docs/testing.md) — Testing
  - [docs/scripts.md](docs/scripts.md) — Scripts
  - [docs/reference/session-management-compaction.md](docs/reference/session-management-compaction.md) — Session Management Deep Dive
- **Developer workflows**
  - [docs/start/setup.md](docs/start/setup.md) — Setup
  - [docs/help/submitting-a-pr.md](docs/help/submitting-a-pr.md) — Submitting a PR
  - [docs/help/submitting-an-issue.md](docs/help/submitting-an-issue.md) — Submitting an Issue
- **Docs meta**
  - [docs/start/hubs.md](docs/start/hubs.md) — Docs Hubs
  - [docs/start/docs-directory.md](docs/start/docs-directory.md) — Docs directory

### Unlinked docs pages

Docs files present under `docs/` but not referenced in `docs/docs.json` navigation.

- [docs/.i18n/README.md](docs/.i18n/README.md) — OpenClaw docs i18n assets
- [docs/brave-search.md](docs/brave-search.md) — Brave Search
- [docs/channels/bluebubbles.md](docs/channels/bluebubbles.md) — BlueBubbles
- [docs/channels/nextcloud-talk.md](docs/channels/nextcloud-talk.md) — Nextcloud Talk
- [docs/channels/nostr.md](docs/channels/nostr.md) — Nostr
- [docs/channels/tlon.md](docs/channels/tlon.md) — Tlon
- [docs/channels/twitch.md](docs/channels/twitch.md) — Twitch
- [docs/cli/acp.md](docs/cli/acp.md) — acp
- [docs/cli/config.md](docs/cli/config.md) — config
- [docs/cli/devices.md](docs/cli/devices.md) — devices
- [docs/cli/node.md](docs/cli/node.md) — node
- [docs/cli/webhooks.md](docs/cli/webhooks.md) — webhooks
- [docs/date-time.md](docs/date-time.md) — Date and Time
- [docs/debug/node-issue.md](docs/debug/node-issue.md) — Node + tsx Crash
- [docs/diagnostics/flags.md](docs/diagnostics/flags.md) — Diagnostics Flags
- [docs/experiments/onboarding-config-protocol.md](docs/experiments/onboarding-config-protocol.md) — Onboarding and Config Protocol
- [docs/experiments/plans/cron-add-hardening.md](docs/experiments/plans/cron-add-hardening.md) — Cron Add Hardening
- [docs/experiments/plans/group-policy-hardening.md](docs/experiments/plans/group-policy-hardening.md) — Telegram Allowlist Hardening
- [docs/experiments/plans/openresponses-gateway.md](docs/experiments/plans/openresponses-gateway.md) — OpenResponses Gateway Plan
- [docs/experiments/proposals/model-config.md](docs/experiments/proposals/model-config.md) — Model Config Exploration
- [docs/experiments/research/memory.md](docs/experiments/research/memory.md) — Workspace Memory Research
- [docs/gateway/openresponses-http-api.md](docs/gateway/openresponses-http-api.md) — OpenResponses API
- [docs/gateway/security/formal-verification.md](docs/gateway/security/formal-verification.md) — Formal Verification (Security Models)
- [docs/logging.md](docs/logging.md) — Logging
- [docs/network.md](docs/network.md) — Network
- [docs/nodes/media-understanding.md](docs/nodes/media-understanding.md) — Media Understanding
- [docs/perplexity.md](docs/perplexity.md) — Perplexity Sonar
- [docs/pi-dev.md](docs/pi-dev.md) — Pi Development Workflow
- [docs/pi.md](docs/pi.md) — Pi Integration Architecture
- [docs/platforms/digitalocean.md](docs/platforms/digitalocean.md) — DigitalOcean
- [docs/platforms/oracle.md](docs/platforms/oracle.md) — Oracle Cloud
- [docs/platforms/raspberry-pi.md](docs/platforms/raspberry-pi.md) — Raspberry Pi
- [docs/plugins/agent-tools.md](docs/plugins/agent-tools.md) — Plugin Agent Tools
- [docs/plugins/manifest.md](docs/plugins/manifest.md) — Plugin Manifest
- [docs/prose.md](docs/prose.md) — OpenProse
- [docs/providers/claude-max-api-proxy.md](docs/providers/claude-max-api-proxy.md) — Claude Max API Proxy
- [docs/providers/cloudflare-ai-gateway.md](docs/providers/cloudflare-ai-gateway.md) — Cloudflare AI Gateway
- [docs/providers/deepgram.md](docs/providers/deepgram.md) — Deepgram
- [docs/providers/github-copilot.md](docs/providers/github-copilot.md) — GitHub Copilot
- [docs/providers/ollama.md](docs/providers/ollama.md) — Ollama
- [docs/providers/qwen.md](docs/providers/qwen.md) — Qwen
- [docs/providers/venice.md](docs/providers/venice.md) — Venice AI
- [docs/providers/xiaomi.md](docs/providers/xiaomi.md) — Xiaomi MiMo
- [docs/refactor/clawnet.md](docs/refactor/clawnet.md) — Clawnet Refactor
- [docs/refactor/exec-host.md](docs/refactor/exec-host.md) — Exec Host Refactor
- [docs/refactor/outbound-session-mirroring.md](docs/refactor/outbound-session-mirroring.md) — Outbound Session Mirroring Refactor (Issue #1520)
- [docs/refactor/plugin-sdk.md](docs/refactor/plugin-sdk.md) — Plugin SDK Refactor
- [docs/refactor/strict-config.md](docs/refactor/strict-config.md) — Strict Config Validation
- [docs/reference/api-usage-costs.md](docs/reference/api-usage-costs.md) — API Usage and Costs
- [docs/reference/templates/AGENTS.dev.md](docs/reference/templates/AGENTS.dev.md) — AGENTS.md - OpenClaw Workspace
- [docs/reference/templates/IDENTITY.dev.md](docs/reference/templates/IDENTITY.dev.md) — IDENTITY.md - Agent Identity
- [docs/reference/templates/SOUL.dev.md](docs/reference/templates/SOUL.dev.md) — SOUL.md - The Soul of C-3PO
- [docs/reference/templates/TOOLS.dev.md](docs/reference/templates/TOOLS.dev.md) — TOOLS.md - User Tool Notes (editable)
- [docs/reference/templates/USER.dev.md](docs/reference/templates/USER.dev.md) — USER.md - User Profile
- [docs/reference/transcript-hygiene.md](docs/reference/transcript-hygiene.md) — Transcript Hygiene
- [docs/start/quickstart.md](docs/start/quickstart.md) — Quick start
- [docs/start/wizard-cli-automation.md](docs/start/wizard-cli-automation.md) — CLI Automation
- [docs/start/wizard-cli-reference.md](docs/start/wizard-cli-reference.md) — CLI Onboarding Reference
- [docs/tools/creating-skills.md](docs/tools/creating-skills.md) — Creating Skills
- [docs/tools/exec-approvals.md](docs/tools/exec-approvals.md) — Exec Approvals
- [docs/tools/firecrawl.md](docs/tools/firecrawl.md) — Firecrawl
- [docs/tts.md](docs/tts.md) — Text-to-Speech
- [docs/vps.md](docs/vps.md) — VPS Hosting

## Repository docs outside Mintlify

Everything that is Markdown but not under `docs/`.

### .agent

- [.agent/workflows/update_clawdbot.md](.agent/workflows/update_clawdbot.md) — Clawdbot Upstream Sync Workflow

### .agents

- [.agents/skills/merge-pr/SKILL.md](.agents/skills/merge-pr/SKILL.md) — Merge PR
- [.agents/skills/prepare-pr/SKILL.md](.agents/skills/prepare-pr/SKILL.md) — Prepare PR
- [.agents/skills/review-pr/SKILL.md](.agents/skills/review-pr/SKILL.md) — Review PR

### .github

- [.github/ISSUE_TEMPLATE/bug_report.md](.github/ISSUE_TEMPLATE/bug_report.md) — [Bug]:
- [.github/ISSUE_TEMPLATE/feature_request.md](.github/ISSUE_TEMPLATE/feature_request.md) — [Feature]:

### .pi

- [.pi/prompts/cl.md](.pi/prompts/cl.md) — cl.md
- [.pi/prompts/is.md](.pi/prompts/is.md) — is.md
- [.pi/prompts/landpr.md](.pi/prompts/landpr.md) — landpr.md
- [.pi/prompts/reviewpr.md](.pi/prompts/reviewpr.md) — reviewpr.md

### Root-level docs

- [AGENTS.md](AGENTS.md) — Repository Guidelines
- [CHANGELOG.md](CHANGELOG.md) — Changelog
- [CLAUDE.md](CLAUDE.md) — Repository Guidelines
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contributing to OpenClaw
- [docs.acp.md](docs.acp.md) — OpenClaw ACP Bridge
- [ops.md](ops.md) — Ops notes (from-source)
- [README.md](README.md) — 🦞 OpenClaw — Personal AI Assistant
- [SECURITY.md](SECURITY.md) — Security Policy

### apps

- [apps/android/README.md](apps/android/README.md) — README.md
- [apps/ios/fastlane/SETUP.md](apps/ios/fastlane/SETUP.md) — fastlane setup (OpenClaw iOS)
- [apps/ios/README.md](apps/ios/README.md) — OpenClaw (iOS)
- [apps/macos/README.md](apps/macos/README.md) — OpenClaw macOS app (dev + signing)
- [apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md](apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md) — Apple device identifier mappings

### assets

- [assets/chrome-extension/README.md](assets/chrome-extension/README.md) — OpenClaw Chrome Extension (Browser Relay)

### extensions

- [extensions/bluebubbles/README.md](extensions/bluebubbles/README.md) — BlueBubbles extension (developer reference)
- [extensions/copilot-proxy/README.md](extensions/copilot-proxy/README.md) — Copilot Proxy (OpenClaw plugin)
- [extensions/feishu/skills/feishu-doc/references/block-types.md](extensions/feishu/skills/feishu-doc/references/block-types.md) — Feishu Block Types Reference
- [extensions/feishu/skills/feishu-doc/SKILL.md](extensions/feishu/skills/feishu-doc/SKILL.md) — Feishu Document Tool
- [extensions/feishu/skills/feishu-drive/SKILL.md](extensions/feishu/skills/feishu-drive/SKILL.md) — Feishu Drive Tool
- [extensions/feishu/skills/feishu-perm/SKILL.md](extensions/feishu/skills/feishu-perm/SKILL.md) — Feishu Permission Tool
- [extensions/feishu/skills/feishu-wiki/SKILL.md](extensions/feishu/skills/feishu-wiki/SKILL.md) — Feishu Wiki Tool
- [extensions/google-antigravity-auth/README.md](extensions/google-antigravity-auth/README.md) — Google Antigravity Auth (OpenClaw plugin)
- [extensions/google-gemini-cli-auth/README.md](extensions/google-gemini-cli-auth/README.md) — Google Gemini CLI Auth (OpenClaw plugin)
- [extensions/llm-task/README.md](extensions/llm-task/README.md) — LLM Task (plugin)
- [extensions/lobster/README.md](extensions/lobster/README.md) — Lobster (plugin)
- [extensions/lobster/SKILL.md](extensions/lobster/SKILL.md) — Lobster
- [extensions/matrix/CHANGELOG.md](extensions/matrix/CHANGELOG.md) — Changelog
- [extensions/minimax-portal-auth/README.md](extensions/minimax-portal-auth/README.md) — MiniMax OAuth (OpenClaw plugin)
- [extensions/msteams/CHANGELOG.md](extensions/msteams/CHANGELOG.md) — Changelog
- [extensions/nostr/CHANGELOG.md](extensions/nostr/CHANGELOG.md) — Changelog
- [extensions/nostr/README.md](extensions/nostr/README.md) — @openclaw/nostr
- [extensions/open-prose/README.md](extensions/open-prose/README.md) — OpenProse (plugin)
- [extensions/open-prose/skills/prose/alt-borges.md](extensions/open-prose/skills/prose/alt-borges.md) — OpenProse Borges Alternative
- [extensions/open-prose/skills/prose/alts/arabian-nights.md](extensions/open-prose/skills/prose/alts/arabian-nights.md) — OpenProse Arabian Nights Register
- [extensions/open-prose/skills/prose/alts/borges.md](extensions/open-prose/skills/prose/alts/borges.md) — OpenProse Borges Register
- [extensions/open-prose/skills/prose/alts/folk.md](extensions/open-prose/skills/prose/alts/folk.md) — OpenProse Folk Register
- [extensions/open-prose/skills/prose/alts/homer.md](extensions/open-prose/skills/prose/alts/homer.md) — OpenProse Homeric Register
- [extensions/open-prose/skills/prose/alts/kafka.md](extensions/open-prose/skills/prose/alts/kafka.md) — OpenProse Kafka Register
- [extensions/open-prose/skills/prose/compiler.md](extensions/open-prose/skills/prose/compiler.md) — OpenProse Language Reference
- [extensions/open-prose/skills/prose/examples/README.md](extensions/open-prose/skills/prose/examples/README.md) — OpenProse Examples
- [extensions/open-prose/skills/prose/examples/roadmap/README.md](extensions/open-prose/skills/prose/examples/roadmap/README.md) — Roadmap Examples
- [extensions/open-prose/skills/prose/guidance/antipatterns.md](extensions/open-prose/skills/prose/guidance/antipatterns.md) — OpenProse Antipatterns
- [extensions/open-prose/skills/prose/guidance/patterns.md](extensions/open-prose/skills/prose/guidance/patterns.md) — OpenProse Design Patterns
- [extensions/open-prose/skills/prose/guidance/system-prompt.md](extensions/open-prose/skills/prose/guidance/system-prompt.md) — OpenProse VM System Prompt Enforcement
- [extensions/open-prose/skills/prose/help.md](extensions/open-prose/skills/prose/help.md) — OpenProse Help
- [extensions/open-prose/skills/prose/lib/README.md](extensions/open-prose/skills/prose/lib/README.md) — OpenProse Standard Library
- [extensions/open-prose/skills/prose/primitives/session.md](extensions/open-prose/skills/prose/primitives/session.md) — Session Context Management
- [extensions/open-prose/skills/prose/prose.md](extensions/open-prose/skills/prose/prose.md) — OpenProse VM
- [extensions/open-prose/skills/prose/SKILL.md](extensions/open-prose/skills/prose/SKILL.md) — OpenProse Skill
- [extensions/open-prose/skills/prose/state/filesystem.md](extensions/open-prose/skills/prose/state/filesystem.md) — File-System State Management
- [extensions/open-prose/skills/prose/state/in-context.md](extensions/open-prose/skills/prose/state/in-context.md) — In-Context State Management
- [extensions/open-prose/skills/prose/state/postgres.md](extensions/open-prose/skills/prose/state/postgres.md) — PostgreSQL State Management (Experimental)
- [extensions/open-prose/skills/prose/state/sqlite.md](extensions/open-prose/skills/prose/state/sqlite.md) — SQLite State Management (Experimental)
- [extensions/qwen-portal-auth/README.md](extensions/qwen-portal-auth/README.md) — Qwen OAuth (OpenClaw plugin)
- [extensions/tlon/README.md](extensions/tlon/README.md) — Tlon (OpenClaw plugin)
- [extensions/twitch/CHANGELOG.md](extensions/twitch/CHANGELOG.md) — Changelog
- [extensions/twitch/README.md](extensions/twitch/README.md) — @openclaw/twitch
- [extensions/voice-call/CHANGELOG.md](extensions/voice-call/CHANGELOG.md) — Changelog
- [extensions/voice-call/README.md](extensions/voice-call/README.md) — @openclaw/voice-call
- [extensions/zalo/CHANGELOG.md](extensions/zalo/CHANGELOG.md) — Changelog
- [extensions/zalo/README.md](extensions/zalo/README.md) — @openclaw/zalo
- [extensions/zalouser/CHANGELOG.md](extensions/zalouser/CHANGELOG.md) — Changelog
- [extensions/zalouser/README.md](extensions/zalouser/README.md) — @openclaw/zalouser

### skills

- [skills/1password/references/cli-examples.md](skills/1password/references/cli-examples.md) — op CLI examples (from op help)
- [skills/1password/references/get-started.md](skills/1password/references/get-started.md) — 1Password CLI get-started (summary)
- [skills/1password/SKILL.md](skills/1password/SKILL.md) — 1Password CLI
- [skills/apple-notes/SKILL.md](skills/apple-notes/SKILL.md) — Apple Notes CLI
- [skills/apple-reminders/SKILL.md](skills/apple-reminders/SKILL.md) — Apple Reminders CLI (remindctl)
- [skills/bear-notes/SKILL.md](skills/bear-notes/SKILL.md) — Bear Notes
- [skills/bird/SKILL.md](skills/bird/SKILL.md) — bird 🐦
- [skills/blogwatcher/SKILL.md](skills/blogwatcher/SKILL.md) — blogwatcher
- [skills/blucli/SKILL.md](skills/blucli/SKILL.md) — blucli (blu)
- [skills/bluebubbles/SKILL.md](skills/bluebubbles/SKILL.md) — BlueBubbles Actions
- [skills/camsnap/SKILL.md](skills/camsnap/SKILL.md) — camsnap
- [skills/canvas/SKILL.md](skills/canvas/SKILL.md) — Canvas Skill
- [skills/clawhub/SKILL.md](skills/clawhub/SKILL.md) — ClawHub CLI
- [skills/coding-agent/SKILL.md](skills/coding-agent/SKILL.md) — Coding Agent (bash-first)
- [skills/discord/SKILL.md](skills/discord/SKILL.md) — Discord Actions
- [skills/eightctl/SKILL.md](skills/eightctl/SKILL.md) — eightctl
- [skills/food-order/SKILL.md](skills/food-order/SKILL.md) — Food order (Foodora via ordercli)
- [skills/gemini/SKILL.md](skills/gemini/SKILL.md) — Gemini CLI
- [skills/gifgrep/SKILL.md](skills/gifgrep/SKILL.md) — gifgrep
- [skills/github/SKILL.md](skills/github/SKILL.md) — GitHub Skill
- [skills/gog/SKILL.md](skills/gog/SKILL.md) — gog
- [skills/goplaces/SKILL.md](skills/goplaces/SKILL.md) — goplaces
- [skills/healthcheck/SKILL.md](skills/healthcheck/SKILL.md) — OpenClaw Host Hardening
- [skills/himalaya/references/configuration.md](skills/himalaya/references/configuration.md) — Himalaya Configuration Reference
- [skills/himalaya/references/message-composition.md](skills/himalaya/references/message-composition.md) — Message Composition with MML (MIME Meta Language)
- [skills/himalaya/SKILL.md](skills/himalaya/SKILL.md) — Himalaya Email CLI
- [skills/imsg/SKILL.md](skills/imsg/SKILL.md) — imsg Actions
- [skills/local-places/SERVER_README.md](skills/local-places/SERVER_README.md) — Local Places
- [skills/local-places/SKILL.md](skills/local-places/SKILL.md) — 📍 Local Places
- [skills/mcporter/SKILL.md](skills/mcporter/SKILL.md) — mcporter
- [skills/model-usage/references/codexbar-cli.md](skills/model-usage/references/codexbar-cli.md) — CodexBar CLI quick ref (usage + cost)
- [skills/model-usage/SKILL.md](skills/model-usage/SKILL.md) — Model usage
- [skills/nano-banana-pro/SKILL.md](skills/nano-banana-pro/SKILL.md) — Nano Banana Pro (Gemini 3 Pro Image)
- [skills/nano-pdf/SKILL.md](skills/nano-pdf/SKILL.md) — nano-pdf
- [skills/notion/SKILL.md](skills/notion/SKILL.md) — notion
- [skills/obsidian/SKILL.md](skills/obsidian/SKILL.md) — Obsidian
- [skills/openai-image-gen/SKILL.md](skills/openai-image-gen/SKILL.md) — OpenAI Image Gen
- [skills/openai-whisper-api/SKILL.md](skills/openai-whisper-api/SKILL.md) — OpenAI Whisper API (curl)
- [skills/openai-whisper/SKILL.md](skills/openai-whisper/SKILL.md) — Whisper (CLI)
- [skills/openhue/SKILL.md](skills/openhue/SKILL.md) — OpenHue CLI
- [skills/oracle/SKILL.md](skills/oracle/SKILL.md) — oracle — best use
- [skills/ordercli/SKILL.md](skills/ordercli/SKILL.md) — ordercli
- [skills/peekaboo/SKILL.md](skills/peekaboo/SKILL.md) — Peekaboo
- [skills/sag/SKILL.md](skills/sag/SKILL.md) — sag
- [skills/session-logs/SKILL.md](skills/session-logs/SKILL.md) — session-logs
- [skills/sherpa-onnx-tts/SKILL.md](skills/sherpa-onnx-tts/SKILL.md) — sherpa-onnx-tts
- [skills/skill-creator/SKILL.md](skills/skill-creator/SKILL.md) — Skill Creator
- [skills/slack/SKILL.md](skills/slack/SKILL.md) — Slack Actions
- [skills/songsee/SKILL.md](skills/songsee/SKILL.md) — songsee
- [skills/sonoscli/SKILL.md](skills/sonoscli/SKILL.md) — Sonos CLI
- [skills/spotify-player/SKILL.md](skills/spotify-player/SKILL.md) — spogo / spotify_player
- [skills/summarize/SKILL.md](skills/summarize/SKILL.md) — Summarize
- [skills/things-mac/SKILL.md](skills/things-mac/SKILL.md) — Things 3 CLI
- [skills/tmux/SKILL.md](skills/tmux/SKILL.md) — tmux Skill (OpenClaw)
- [skills/trello/SKILL.md](skills/trello/SKILL.md) — Trello Skill
- [skills/video-frames/SKILL.md](skills/video-frames/SKILL.md) — Video Frames (ffmpeg)
- [skills/voice-call/SKILL.md](skills/voice-call/SKILL.md) — Voice Call
- [skills/wacli/SKILL.md](skills/wacli/SKILL.md) — wacli
- [skills/weather/SKILL.md](skills/weather/SKILL.md) — Weather

### src

- [src/hooks/bundled/boot-md/HOOK.md](src/hooks/bundled/boot-md/HOOK.md) — Boot Checklist Hook
- [src/hooks/bundled/command-logger/HOOK.md](src/hooks/bundled/command-logger/HOOK.md) — Command Logger Hook
- [src/hooks/bundled/README.md](src/hooks/bundled/README.md) — Bundled Hooks
- [src/hooks/bundled/session-memory/HOOK.md](src/hooks/bundled/session-memory/HOOK.md) — Session Memory Hook
- [src/hooks/bundled/soul-evil/HOOK.md](src/hooks/bundled/soul-evil/HOOK.md) — SOUL Evil Hook
- [src/hooks/bundled/soul-evil/README.md](src/hooks/bundled/soul-evil/README.md) — SOUL Evil Hook

### Swabble

- [Swabble/CHANGELOG.md](Swabble/CHANGELOG.md) — Changelog
- [Swabble/docs/spec.md](Swabble/docs/spec.md) — swabble — macOS 26 speech hook daemon (Swift 6.2)
- [Swabble/README.md](Swabble/README.md) — 🎙️ swabble — Speech.framework wake-word hook daemon (macOS 26)

### vendor

- [vendor/a2ui/.gemini/GEMINI.md](vendor/a2ui/.gemini/GEMINI.md) — A2UI Gemini Agent Guide
- [vendor/a2ui/CONTRIBUTING.md](vendor/a2ui/CONTRIBUTING.md) — How to contribute to A2UI
- [vendor/a2ui/README.md](vendor/a2ui/README.md) — A2UI: Agent-to-User Interface
- [vendor/a2ui/renderers/angular/README.md](vendor/a2ui/renderers/angular/README.md) — README.md
- [vendor/a2ui/renderers/lit/README.md](vendor/a2ui/renderers/lit/README.md) — README.md
- [vendor/a2ui/specification/0.8/eval/GEMINI.md](vendor/a2ui/specification/0.8/eval/GEMINI.md) — A2UI Protocol Message Validation Logic
- [vendor/a2ui/specification/0.8/eval/README.md](vendor/a2ui/specification/0.8/eval/README.md) — Genkit Eval Framework for UI generation
- [vendor/a2ui/specification/0.8/json/README.md](vendor/a2ui/specification/0.8/json/README.md) — A2UI JSON Schema Files
- [vendor/a2ui/specification/0.9/eval/README.md](vendor/a2ui/specification/0.9/eval/README.md) — Genkit Eval Framework for UI generation

## Generated docs note

- `docs/zh-CN/**` is generated and intentionally excluded from this map.
- Translation tooling and glossary live under `docs/.i18n/` (see `docs/.i18n/README.md`).
