# Discord setup via configuration file

How to set up the Discord channel by editing the OpenClaw config file directly.

## Where the config file is

- **Default path:** `~/.openclaw/openclaw.json`
  - On most systems this is `$HOME/.openclaw/openclaw.json`.
- **If you use a custom state directory:** the config is `openclaw.json` inside that directory (e.g. `$OPENCLAW_STATE_DIR/openclaw.json`).
- **Override the config path:** set `OPENCLAW_CONFIG_PATH` (or legacy `CLAWDBOT_CONFIG_PATH`) to the full path of your config file. The file is JSON5 (comments and trailing commas allowed).

Config is **not** in the repo; it lives on the machine where the gateway runs.

## Minimal Discord config

Add a `channels.discord` block to your config. Smallest working example:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN",
    },
  },
}
```

Replace `YOUR_BOT_TOKEN` with the bot token from the Discord Developer Portal (Bot → Copy Token). Store the raw token only; do not add a `DISCORD_BOT_TOKEN=` prefix in the config file.

If both `channels.discord.token` and the environment variable `DISCORD_BOT_TOKEN` are set, the **config value wins** for the default account.

## Common options in the config file

All of these go under `channels.discord` in `openclaw.json`:

| Key               | Purpose                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `enabled`         | Set to `false` to disable the Discord channel (default: true when config exists).                         |
| `token`           | Bot token for the default account.                                                                        |
| `dm.policy`       | DM access: `"pairing"` (default), `"open"`, `"allowlist"`, or `"disabled"`.                               |
| `dm.allowFrom`    | List of Discord user IDs (numeric strings) allowed to DM the bot; use `["*"]` only with `policy: "open"`. |
| `dm.enabled`      | Set to `false` to disable DMs entirely.                                                                   |
| `guilds`          | Guild allowlist and per-channel rules; key by guild id (numeric).                                         |
| `groupPolicy`     | Guild access: `"allowlist"` (default) or `"open"`.                                                        |
| `commands.native` | Slash commands: `true`, `false`, or `"auto"` (default).                                                   |
| `configWrites`    | Allow `/config set                                                                                        | unset`from Discord (default: true). Set to`false` to disable. |

### Adding a Discord user ID (DM allowlist)

To allow a specific user to DM the bot, add their Discord user ID to `channels.discord.dm.allowFrom`. Use numeric IDs (Developer Mode: right-click user → Copy User ID). Example for user ID `453176791754997760`:

**Allowlist-only DMs** (only listed users can DM):

```json5
"dm": {
  "policy": "allowlist",
  "allowFrom": ["453176791754997760"]
}
```

**Pairing with pre-approved user** (everyone else uses pairing; this user is allowed without a code):

```json5
"dm": {
  "policy": "pairing",
  "allowFrom": ["453176791754997760"]
}
```

Add more users by extending the array: `["453176791754997760", "123456789012345678"]`.

Example with DM policy and one guild:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN",
      dm: {
        policy: "pairing",
        allowFrom: [],
      },
      guilds: {
        "123456789012345678": {
          channels: {
            "987654321098765432": { allow: true },
          },
        },
      },
    },
  },
}
```

Use numeric guild and channel IDs (Developer Mode in Discord: right-click server/channel → Copy ID).

## Multi-account (optional)

For multiple Discord bots, use `channels.discord.accounts` instead of a single `token`:

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        default: { token: "TOKEN_FOR_PRIMARY_BOT" },
        work: { token: "TOKEN_FOR_SECOND_BOT", name: "Work Bot" },
      },
    },
  },
}
```

Env var `DISCORD_BOT_TOKEN` only applies to the default account; other accounts must have their token in config.

## After editing the config

- Save `openclaw.json`.
- Restart the gateway (or use config reload if your setup supports it) so the new Discord settings are applied.
- For DM access with `policy: "pairing"`, approve the pairing code via `openclaw pairing approve discord <code>` after first contact.

## References

- Full channel doc: [docs/channels/discord](docs/channels/discord).
- Gateway config reference: [docs/gateway/configuration](docs/gateway/configuration) (search for `channels.discord`).
- Config path logic: `src/config/paths.ts` (`resolveCanonicalConfigPath`, `resolveConfigPathCandidate`).
- Token resolution: `src/discord/token.ts` (`resolveDiscordToken`).
