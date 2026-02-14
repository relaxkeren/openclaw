import type { OpenClawConfig } from "../../config/config.js";
import type { MsgContext } from "../templating.js";
import type { ReplyPayload } from "../types.js";
import { createExecTool } from "../../agents/bash-tools.js";
import { resolveSandboxRuntimeStatus } from "../../agents/sandbox.js";
import { formatCliCommand } from "../../cli/command-format.js";
import { logVerbose } from "../../globals.js";
import { DEFAULT_SAFE_BINS } from "../../infra/exec-approvals-analysis.js";
import { runCommandWithTimeout } from "../../process/exec.js";

function formatElevatedUnavailableMessage(params: {
  runtimeSandboxed: boolean;
  failures: Array<{ gate: string; key: string }>;
  sessionKey?: string;
}): string {
  const lines: string[] = [];
  lines.push(
    `elevated is not available right now (runtime=${params.runtimeSandboxed ? "sandboxed" : "direct"}).`,
  );
  if (params.failures.length > 0) {
    lines.push(`Failing gates: ${params.failures.map((f) => `${f.gate} (${f.key})`).join(", ")}`);
  } else {
    lines.push(
      "Failing gates: enabled (tools.elevated.enabled / agents.list[].tools.elevated.enabled), allowFrom (tools.elevated.allowFrom.<provider>).",
    );
  }
  lines.push("Fix-it keys:");
  lines.push("- tools.elevated.enabled");
  lines.push("- tools.elevated.allowFrom.<provider>");
  lines.push("- agents.list[].tools.elevated.enabled");
  lines.push("- agents.list[].tools.elevated.allowFrom.<provider>");
  if (params.sessionKey) {
    lines.push(
      `See: ${formatCliCommand(`openclaw sandbox explain --session ${params.sessionKey}`)}`,
    );
  }
  return lines.join("\n");
}

function buildUsageReply(): ReplyPayload {
  return {
    text: [
      "Usage: /run <executable> [arguments...]",
      "",
      "Run an executable from PATH.",
      "",
      "Examples:",
      "  /run curl https://example.com",
      "  /run git status",
      "  /run node script.js",
      "",
      "The executable must be in the safeBins allowlist (tools.exec.safeBins).",
      "Default safe bins: git, opencode, opencode-discord",
    ].join("\n"),
  };
}

function parseRunRequest(raw: string): { name: string; args: string } | null {
  const trimmed = raw.trimStart();
  if (!trimmed.toLowerCase().startsWith("/run")) {
    return null;
  }
  const match = trimmed.match(/^\/run(?:\s*:\s*|\s+|$)([\s\S]*)$/i);
  if (!match) {
    return null;
  }
  const rest = match[1]?.trim() ?? "";
  if (!rest) {
    return null;
  }
  const tokenMatch = rest.match(/^(\S+)(?:\s+([\s\S]+))?$/);
  if (!tokenMatch) {
    return null;
  }
  const name = tokenMatch[1]?.trim() ?? "";
  const args = tokenMatch[2]?.trim() ?? "";
  if (!name) {
    return null;
  }
  return { name, args };
}

function resolveSafeBins(cfg: OpenClawConfig): string[] {
  const configured = cfg.tools?.exec?.safeBins ?? [];
  const combined = new Set([...DEFAULT_SAFE_BINS, ...configured]);
  return Array.from(combined);
}

async function resolveExecutablePath(name: string): Promise<string | null> {
  const isWindows = process.platform === "win32";
  const argv = isWindows ? [name] : ["which", name];

  try {
    const result = await runCommandWithTimeout(argv, { timeoutMs: 5000 });
    if (result.code === 0 && result.stdout.trim()) {
      const resolvedPath = result.stdout.trim().split("\n")[0] ?? result.stdout.trim();
      return resolvedPath;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function handleRunChatCommand(params: {
  ctx: MsgContext;
  cfg: OpenClawConfig;
  agentId?: string;
  sessionKey: string;
  isGroup: boolean;
  elevated: {
    enabled: boolean;
    allowed: boolean;
    failures: Array<{ gate: string; key: string }>;
  };
}): Promise<ReplyPayload> {
  if (!params.elevated.enabled || !params.elevated.allowed) {
    const runtimeSandboxed = resolveSandboxRuntimeStatus({
      cfg: params.cfg,
      sessionKey: params.ctx.SessionKey,
    }).sandboxed;
    return {
      text: formatElevatedUnavailableMessage({
        runtimeSandboxed,
        failures: params.elevated.failures,
        sessionKey: params.ctx.SessionKey,
      }),
    };
  }

  const rawBody = params.ctx.CommandBody ?? params.ctx.RawBody ?? params.ctx.Body ?? "";
  const request = parseRunRequest(rawBody);
  if (!request) {
    return buildUsageReply();
  }

  const safeBins = resolveSafeBins(params.cfg);
  const normalizedName = request.name.toLowerCase();

  if (!safeBins.some((bin) => bin.toLowerCase() === normalizedName)) {
    return {
      text: [
        `⚠️ Executable "${request.name}" is not in the safeBins allowlist.`,
        "",
        `Allowed executables: ${safeBins.join(", ")}`,
        "",
        "To add more, set tools.exec.safeBins in your config.",
      ].join("\n"),
    };
  }

  const resolvedPath = await resolveExecutablePath(request.name);
  if (!resolvedPath) {
    return {
      text: `⚠️ Executable "${request.name}" not found in PATH.`,
    };
  }

  const command = request.args ? `${resolvedPath} ${request.args}` : resolvedPath;

  try {
    const timeoutSec = params.cfg.tools?.exec?.timeoutSec;
    const execTool = createExecTool({
      timeoutSec,
      sessionKey: params.sessionKey,
      elevated: {
        enabled: params.elevated.enabled,
        allowed: params.elevated.allowed,
        defaultLevel: "on",
      },
    });

    const result = await execTool.execute("chat-run", {
      command,
      timeout: timeoutSec,
      elevated: true,
    });

    const output =
      result.details?.status === "completed"
        ? result.details.aggregated
        : result.content.map((chunk) => (chunk.type === "text" ? chunk.text : "")).join("\n");

    const exitCode = result.details?.status === "completed" ? (result.details.exitCode ?? 0) : 1;

    if (exitCode !== 0 || !output.trim()) {
      return {
        text: [
          `⚠️ ${request.name} exited with code ${exitCode}`,
          output ? `\`\`\`\n${output}\n\`\`\`` : "",
        ].join("\n"),
      };
    }

    return {
      text: `\`\`\`\n${output}\n\`\`\``,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logVerbose(`run command failed: ${message}`);
    return {
      text: `⚠️ Failed to run ${request.name}: ${message}`,
    };
  }
}
