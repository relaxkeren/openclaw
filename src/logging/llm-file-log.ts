import fs from "node:fs";
import path from "node:path";
import { resolveLogFolder } from "./logger.js";

const LOG_PREFIX = "openclaw-llm";
const LOG_SUFFIX = ".jsonl";

const writers = new Map<string, { write: (line: string) => void }>();

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWriter(env: NodeJS.ProcessEnv = process.env): { write: (line: string) => void } | null {
  try {
    const logFolder = resolveLogFolder(env);
    const today = formatLocalDate(new Date());
    const filePath = path.join(logFolder, `${LOG_PREFIX}-${today}${LOG_SUFFIX}`);
    const existing = writers.get(filePath);
    if (existing) {
      return existing;
    }
    fs.mkdirSync(logFolder, { recursive: true });
    let queue = Promise.resolve();
    const writer = {
      write: (line: string) => {
        queue = queue
          .then(() => fs.promises.appendFile(filePath, line, "utf8"))
          .catch(() => undefined);
      },
    };
    writers.set(filePath, writer);
    return writer;
  } catch {
    return null;
  }
}

export type LlmExchangeMeta = {
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  provider?: string;
  modelId?: string;
  error?: string;
};

/**
 * Logs a single LLM prompt/response exchange to a file only (no console).
 * Writes to LOG_FOLDER or ~/.openclaw/logs/openclaw-llm-YYYY-MM-DD.jsonl.
 */
export function logLlmExchange(
  params: {
    prompt: string;
    response: string | undefined;
    meta?: LlmExchangeMeta;
  },
  env: NodeJS.ProcessEnv = process.env,
): void {
  const writer = getWriter(env);
  if (!writer) {
    return;
  }
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      prompt: params.prompt,
      response: params.response ?? null,
      ...params.meta,
    });
    writer.write(`${line}\n`);
  } catch {
    // never block on logging failures
  }
}
