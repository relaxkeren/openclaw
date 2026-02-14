import type { CommandHandler } from "./commands-types.js";
import { logVerbose } from "../../globals.js";
import { handleRunChatCommand } from "./run-command.js";

export const handleRunCommand: CommandHandler = async (params, allowTextCommands) => {
  if (!allowTextCommands) {
    return null;
  }
  const { command } = params;
  const runSlashRequested =
    command.commandBodyNormalized === "/run" || command.commandBodyNormalized.startsWith("/run ");
  if (!runSlashRequested) {
    return null;
  }
  if (!command.isAuthorizedSender) {
    logVerbose(`Ignoring /run from unauthorized sender: ${command.senderId || "<unknown>"}`);
    return { shouldContinue: false };
  }
  const reply = await handleRunChatCommand({
    ctx: params.ctx,
    cfg: params.cfg,
    agentId: params.agentId,
    sessionKey: params.sessionKey,
    isGroup: params.isGroup,
    elevated: params.elevated,
  });
  return { shouldContinue: false, reply };
};
