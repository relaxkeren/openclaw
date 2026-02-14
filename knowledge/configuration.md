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

## Model Configuration

**Path:** `agents.defaults.model.primary`

Current primary model: `moonshot/kimi-k2.5`

---

## Change History

| Date | Change | File |
|------|--------|------|
| 2026-02-13 | Added `skills.load.extraDirs` for custom skills | `openclaw.json` |
| 2026-02-13 | Added `commands.restart: true` to enable gateway restart | `openclaw.json` |

---

_This file documents machine-specific OpenClaw configuration. See `C:\project_management` for project-specific setup._
