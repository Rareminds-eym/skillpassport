/**
 * Cloudflare Workers AI transport for Pages Functions (Stage B, additive).
 *
 * Intentional mirror of ai-worker's `cloudflareAdapter.ts` with identical
 * failure semantics: full-attempt deadline, truncation as failure,
 * reasoning stripped from user-visible text, single terminal usage snapshot,
 * and PARTIAL_MODEL_OUTPUT when a stream dies after visible text (so callers
 * never concatenate a second model's restarted answer). Duplication is
 * deliberate per the migration plan — share later only through an
 * intentional server-only package. Nothing imports this yet; cutover is
 * Stage C per-callsite after the authorized live probe.
 *
 * Thrown errors use the `CODE: message` prefix convention consumed by
 * `rpcErrorToHttpStatus` in `functions/api/ai/lib/aiBinding.ts`.
 */

/* eslint-disable no-unused-vars -- interface documents the binding call shape; params are never implemented here */
export interface CfAiBinding {
  run(
    model: string,
    inputs: Record<string, unknown>,
    options?: { gateway?: { id: string; skipCache?: boolean } },
  ): Promise<unknown>;
}
/* eslint-enable no-unused-vars */

export interface CfAdapterConfig {
  /** Request-scoped binding. Never module-global. */
  ai: CfAiBinding;
  gatewayId?: string;
  skipCache?: boolean;
}

export interface CfChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CfModelPolicy {
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export interface CfModelUsage {
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface CfStreamChunk {
  text?: string;
  done?: boolean;
  usage?: CfModelUsage | null;
}

export const CF_PRIMARY_MODEL = "@cf/zai-org/glm-4.7-flash";
export const CF_FALLBACK_MODEL = "@cf/nvidia/nemotron-3-120b-a12b";

function fail(code: string, message: string): Error {
  return new Error(`${code}: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

interface CfBindingResponse {
  response?: unknown;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  finish_reason?: string;
  error?: { message?: string } | string;
  choices?: Array<{
    message?: { content?: unknown };
    delta?: { content?: unknown };
    finish_reason?: string;
  }>;
}

function toUsage(usage?: CfBindingResponse["usage"]): CfModelUsage | null {
  if (!usage) return null;
  return {
    inputTokens: usage.prompt_tokens ?? null,
    outputTokens: usage.completion_tokens ?? null,
  };
}

function extractText(json: CfBindingResponse): string | null {
  if (typeof json.response === "string") return json.response;
  const message = json.choices?.[0]?.message?.content;
  if (typeof message === "string") return message;
  const delta = json.choices?.[0]?.delta?.content;
  if (typeof delta === "string") return delta;
  return null;
}

function withDeadline<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(fail("DOWNSTREAM_TIMEOUT", "Provider timed out")), timeoutMs);
  });
  return Promise.race([work, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.message.startsWith("DEPENDENCY_UNAVAILABLE:") || err.message.startsWith("DOWNSTREAM_TIMEOUT:");
}

async function withRetry<T>(fn: () => Promise<T>, attempts: number, baseMs: number): Promise<T> {
  let last: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isRetryable(err) || attempt === attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, baseMs * 2 ** (attempt - 1)));
    }
  }
  throw last;
}

/** Frames raw SSE bytes into text deltas; never treats bare EOF as success. */
class CfSseFramer {
  private buffer = "";
  private done = false;

  feed(bytes: string): Array<{ text?: string; done: boolean; usage: CfModelUsage | null }> {
    if (this.done) return [];
    this.buffer += bytes;
    const out: Array<{ text?: string; done: boolean; usage: CfModelUsage | null }> = [];
    let idx: number;
    while ((idx = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, idx).trimEnd();
      this.buffer = this.buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") {
        this.done = true;
        out.push({ done: true, usage: null });
        break;
      }
      try {
        const json = JSON.parse(payload) as CfBindingResponse;
        const text = extractText(json) ?? "";
        const usage = toUsage(json.usage);
        if (!text && usage == null) continue;
        out.push({ text: text || undefined, done: false, usage });
      } catch {
        // Malformed line: skip, keep framing intact.
      }
    }
    return out;
  }
}

export function createCloudflareClient(config: CfAdapterConfig) {
  const gatewayOptions =
    config.gatewayId != null && config.gatewayId !== ""
      ? { gateway: { id: config.gatewayId, skipCache: config.skipCache ?? true } }
      : undefined;

  async function run(model: string, inputs: Record<string, unknown>, policy: CfModelPolicy): Promise<unknown> {
    return withRetry(() => withDeadline(config.ai.run(model, inputs, gatewayOptions), policy.timeoutMs), 3, 500);
  }

  async function complete(
    model: string,
    messages: CfChatMessage[],
    policy: CfModelPolicy,
  ): Promise<{ text: string; usage: CfModelUsage | null }> {
    const raw = await run(
      model,
      { messages, max_completion_tokens: policy.maxTokens, temperature: policy.temperature, stream: false },
      policy,
    );
    if (!isRecord(raw)) throw fail("INVALID_MODEL_OUTPUT", "Empty provider response");
    const json = raw as unknown as CfBindingResponse;
    const providerError = typeof json.error === "string" ? json.error : json.error?.message;
    if (providerError) throw fail("INVALID_MODEL_OUTPUT", providerError.slice(0, 200));
    if (json.finish_reason === "length") throw fail("INVALID_MODEL_OUTPUT", "Truncated provider response");
    const text = extractText(json);
    if (typeof text !== "string" || text.length === 0) throw fail("INVALID_MODEL_OUTPUT", "Empty provider response");
    return { text, usage: toUsage(json.usage) };
  }

  async function* stream(
    model: string,
    messages: CfChatMessage[],
    policy: CfModelPolicy,
  ): AsyncIterable<CfStreamChunk> {
    const raw = await run(
      model,
      { messages, max_completion_tokens: policy.maxTokens, temperature: policy.temperature, stream: true },
      policy,
    );
    if (!(raw instanceof ReadableStream)) throw fail("INVALID_MODEL_OUTPUT", "Provider returned no stream");
    const framer = new CfSseFramer();
    const reader = raw.getReader();
    const textDecoder = new TextDecoder();
    let usage: CfModelUsage | null = null;
    let emittedText = false;
    try {
      for (;;) {
        const read = await withDeadline(reader.read(), policy.timeoutMs);
        if (read.done) break;
        for (const chunk of framer.feed(textDecoder.decode(read.value, { stream: true }))) {
          if (chunk.text) {
            emittedText = true;
            yield { text: chunk.text };
          }
          if (chunk.usage) usage = chunk.usage;
          if (chunk.done) {
            if (usage) yield { usage };
            yield { done: true };
            return;
          }
        }
      }
      throw fail(emittedText ? "PARTIAL_MODEL_OUTPUT" : "INVALID_MODEL_OUTPUT", "Stream ended without completion");
    } catch (err) {
      if (
        emittedText &&
        err instanceof Error &&
        (isRetryable(err) || err.message.startsWith("INVALID_MODEL_OUTPUT:"))
      ) {
        throw fail("PARTIAL_MODEL_OUTPUT", err.message.replace(/^[A-Z_]+: /, "").slice(0, 200));
      }
      throw err;
    } finally {
      reader.releaseLock();
    }
  }

  return { complete, stream };
}
