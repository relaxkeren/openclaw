# OpenClaw Configuration Reference

**Config File Location:** `C:\Users\Ke\.openclaw\openclaw.json`

---

## Skills Configuration

### Custom Skills Directory

**Path:** `skills.load.extraDirs`

**Purpose:** Add additional directories to scan for skills beyond the default bundled skills.

**Example:**

```json
"skills": {
  "load": {
    "extraDirs": ["C:\\Users\\Ke\\.openclaw\\skills"]
  }
}
```

**Effect:** Enables loading of user-installed skills from `C:\Users\Ke\.openclaw\skills`. Skills placed here become available to the agent alongside bundled skills.

**Skills Currently Installed:**

- `agent-browser` — Browser automation CLI for web interaction
- `find-skills` — Skill discovery and installation helper
- `news-aggregator-skill` — News aggregation and analysis

---

## Commands Configuration

### Gateway Restart

**Path:** `commands.restart`

**Purpose:** Enable the agent to restart the Gateway process programmatically.

**Example:**

```json
"commands": {
  "native": "auto",
  "nativeSkills": "auto",
  "restart": true
}
```

**Effect:** When `true`, the agent can call `gateway restart` to reload configuration changes without manual intervention. Requires Gateway to be running in local mode.

**Note:** Gateway was launched via `pnpm openclaw gateway` from `C:\Users\Ke\repos\openclaw`.

---

### Elevated Mode

**Path:** `tools.elevated`

**Purpose:** Control who can execute privileged commands on the host machine. Elevated mode is required for:

- Running `/run` commands (executing binaries from PATH)
- Running `/bash` shell commands
- Exec tool running on the gateway host (instead of sandbox)

**Configuration:**

```json
"tools": {
  "elevated": {
    "enabled": true,
    "allowFrom": {
      "discord": ["user:123456789"],
      "telegram": ["+15551234567"]
    }
  }
}
```

**Fields:**

- `enabled` (default: `true`) - Global on/off switch for elevated permissions
- `allowFrom` - Per-provider list of approved senders. Format depends on provider:
  - **Discord:** `"user:123456789"` (user ID)
  - **Telegram:** `"+15551234567"` (phone number) or `"user:123456789"` (user ID)
  - **Slack:** `"U123456789"` (user ID), `"C123456789"` (channel ID)
  - **WhatsApp:** `"+15551234567"` (phone number)

**How to find your Discord user ID:**

1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click on your username → "Copy User ID"

**Example - Allow your Discord user:**

```json
"tools": {
  "elevated": {
    "allowFrom": {
      "discord": ["user:453176791754997760"]
    }
  }
}
```

**Effect:** Once your user ID is added to the allowlist, you can use `/run` and `/bash` commands from Discord.

**Note:** The gateway watches `openclaw.json` and applies changes automatically - no restart needed.

---

### Exec Safe Bins

**Path:** `tools.exec.safeBins`

**Purpose:** Control which executables can be run via the `/run` command. Executables must be in this list to run.

**Default safe bins:** `git`, `opencode`, `opencode-discord`, `jq`, `grep`, `cut`, `sort`, `uniq`, `head`, `tail`, `tr`, `wc`

**Configuration:**

```json
"tools": {
  "exec": {
    "safeBins": ["pwd", "ls", "curl", "node", "python3", "npm"]
  }
}
```

**Example - Allow common commands:**

```json
"tools": {
  "exec": {
    "safeBins": ["pwd", "ls", "cd", "curl", "wget", "git", "node", "python3", "npm", "pnpm"]
  }
}
```

**Effect:** Users can now run `/run pwd`, `/run ls`, `/run curl https://example.com`, etc.

**Note:** Executable names should not include `.exe` on Windows - just use the base name (e.g., `"node"` not `"node.exe"`).

---

## Model Configuration

**Path:** `agents.defaults.model.primary`

Current primary model: `moonshot/kimi-k2.5`

---

## Change History

| Date       | Change                                                   | File            |
| ---------- | -------------------------------------------------------- | --------------- |
| 2026-02-13 | Added `skills.load.extraDirs` for custom skills          | `openclaw.json` |
| 2026-02-13 | Added `commands.restart: true` to enable gateway restart | `openclaw.json` |
| 2026-02-22 | Added `tools.elevated.allowFrom` for /run and /bash      | `openclaw.json` |
| 2026-02-22 | Added `tools.exec.safeBins` for /run command             | `openclaw.json` |

---

_This file documents machine-specific OpenClaw configuration. See `C:\project_management` for project-specific setup._
