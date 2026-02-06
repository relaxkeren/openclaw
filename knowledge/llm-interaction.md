# LLM interaction: prompt send and response receive

Internal reference for where the user prompt is sent to the LLM and where the LLM response is consumed in the embedded Pi agent flow. The actual HTTP/API call lives in `@mariozechner/pi-coding-agent` and `@mariozechner/pi-ai`; this doc describes the in-repo boundaries.

## Flow overview

1. **Prompt**: User text (`params.prompt`) is optionally augmented by hooks, then passed to `activeSession.prompt(effectivePrompt, ...)`. The session is from `createAgentSession` (@mariozechner/pi-coding-agent); that package (and pi-ai’s `streamSimple`) perform the real API call.
2. **Response**: The session emits events (`message_update` with `text_delta` / `text_start` / `text_end`, and `message_end`). This repo subscribes via `subscribeEmbeddedPiSession`, which fills `assistantTexts` and updates session messages. After `prompt()` resolves, the run reads the final response from `activeSession.messages` and from the subscription’s `assistantTexts`.

## Where the user prompt is sent to the LLM

**File:** `src/agents/pi-embedded-runner/run/attempt.ts`

- **Effective prompt**: Built from `params.prompt` (line 744). If `before_agent_start` hooks run and return `prependContext`, it becomes `effectivePrompt = prependContext + "\n\n" + params.prompt` (lines 757–760).
- **Send call**: **Lines 839 and 841** — `await abortable(activeSession.prompt(effectivePrompt, { images: imageResult.images }))` or `await abortable(activeSession.prompt(effectivePrompt))`. Images are only passed when `imageResult.images.length > 0`.
- **Session origin**: `activeSession` comes from `createAgentSession` (**line 499**); the session’s `.prompt()` is implemented in `@mariozechner/pi-coding-agent`. The stream function used for the API is `streamSimple` from `@mariozechner/pi-ai`, set on `activeSession.agent.streamFn` at **line 538** (and optionally wrapped by cache trace and anthropic payload logger).

So: **prompt is sent in attempt.ts at lines 839/841**; the actual network call is inside the dependency.

## Where the LLM response is received

### Streaming path (session events)

The run subscribes to the session in **attempt.ts** at **lines 644–662** via `subscribeEmbeddedPiSession`. The subscription registers an event handler; when the session receives stream chunks from the LLM it emits `message_update` (with `text_delta` / `text_start` / `text_end`) and `message_end`.

- **Event routing**: `src/agents/pi-embedded-subscribe.handlers.ts` — **lines 27–31**: `message_update` → `handleMessageUpdate`, `message_end` → `handleMessageEnd`.
- **Stream deltas and final text**: `src/agents/pi-embedded-subscribe.handlers.messages.ts`
  - **Lines 49–109**: `handleMessageUpdate` — handles `text_delta`, `text_start`, `text_end`; accumulates in `ctx.state.deltaBuffer` and the block chunker; chunker/block buffer later feed `emitBlockChunk` in pi-embedded-subscribe.ts, which pushes into `assistantTexts`.
  - **Lines 191–259**: `handleMessageEnd` — final assistant message; calls `ctx.finalizeAssistantTexts(...)` (line 258), which in pi-embedded-subscribe.ts pushes the final text into `assistantTexts` (streaming and non-streaming).
- **Where `assistantTexts` is written**: `src/agents/pi-embedded-subscribe.ts`
  - **Lines 131–141**: `pushAssistantText` → `assistantTexts.push(text)`.
  - **Lines 166–171**: `finalizeAssistantTexts` → `pushAssistantText(text)` for the final answer (or splice when reasoning is included).
  - **Lines 401–427**: `emitBlockChunk` → `assistantTexts.push(chunk)` for streamed block replies.

So the **streaming LLM response** is received in **pi-embedded-subscribe.handlers.messages.ts** (handleMessageUpdate 49–109, handleMessageEnd 191–259) and written into **pi-embedded-subscribe.ts** (pushAssistantText, finalizeAssistantTexts, emitBlockChunk at the lines above).

### After the run (snapshot and last assistant)

**File:** `src/agents/pi-embedded-runner/run/attempt.ts`

- **Line 863**: `messagesSnapshot = activeSession.messages.slice()` — full message list including the new assistant turn.
- **Lines 872–881**: Response text for logging: from streamed `assistantTexts` if non-empty, else `extractTextFromAssistantMessage(lastAssistantForLog)` from the snapshot. Helper `extractTextFromAssistantMessage` (same file, after imports) pulls text from the last assistant message’s `content` (string or text blocks) and `errorMessage`.
- **Lines 882–892**: LLM exchange logging (file-only) via `logLlmExchange({ prompt: effectivePrompt, response: responseText, meta })`; see `knowledge/logging-setup.md` and `src/logging/llm-file-log.ts`.
- **Lines 927–929**: `lastAssistant` = last assistant message in `messagesSnapshot`, returned to the caller.

## Quick reference

| What                                                | File                                                    | Lines                          |
| --------------------------------------------------- | ------------------------------------------------------- | ------------------------------ |
| User prompt sent to LLM                             | `src/agents/pi-embedded-runner/run/attempt.ts`          | 839, 841                       |
| Effective prompt built                              | `src/agents/pi-embedded-runner/run/attempt.ts`          | 744, 757–760                   |
| Session created (owns `.prompt()`)                  | `src/agents/pi-embedded-runner/run/attempt.ts`          | 499                            |
| Stream events handled (text_delta / message_end)    | `src/agents/pi-embedded-subscribe.handlers.messages.ts` | 49–109, 191–259                |
| Response pushed to `assistantTexts`                 | `src/agents/pi-embedded-subscribe.ts`                   | 131–141, 166–171, 401–427      |
| Response read after run (snapshot + last assistant) | `src/agents/pi-embedded-runner/run/attempt.ts`          | 863, 872–881, 882–892, 927–929 |
