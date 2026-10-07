import { describe, expect, it } from "vitest";
import { createCloudflareClient, type CfAiBinding } from "../cloudflare-ai.js";
import { rpcErrorToHttpStatus } from "../../ai/lib/aiBinding.js";

const POLICY = { maxTokens: 10, temperature: 0, timeoutMs: 1000 };

function fake(run: CfAiBinding["run"]): CfAiBinding {
  return { run };
}

function sseStream(payloads: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of payloads) controller.enqueue(enc.encode(`data: ${p}\n\n`));
      controller.close();
    },
  });
}

describe("pages cloudflare client", () => {
  it("extracts binding text with gateway options and completion budget", async () => {
    const seen: Array<{ inputs: Record<string, unknown>; options: unknown }> = [];
    const client = createCloudflareClient({
      ai: fake(async (_model, inputs, options) => {
        seen.push({ inputs: inputs as Record<string, unknown>, options });
        return { response: "ok", usage: { prompt_tokens: 4, completion_tokens: 1 } };
      }),
      gatewayId: "gw-1",
    });
    const out = await client.complete("m", [{ role: "user", content: "hi" }], POLICY);
    expect(out.text).toBe("ok");
    expect(out.usage).toEqual({ inputTokens: 4, outputTokens: 1 });
    expect(seen[0].inputs).toMatchObject({ max_completion_tokens: 10, stream: false });
    expect(seen[0].inputs).not.toHaveProperty("max_tokens");
    expect(seen[0].inputs).toMatchObject({ chat_template_kwargs: { enable_thinking: false } });
    expect(seen[0].options).toEqual({ gateway: { id: "gw-1", skipCache: true } });
  });

  it("treats truncation and empty output as failure", async () => {
    for (const shape of [{ response: "cut", finish_reason: "length" }, { response: "" }, { nope: 1 }]) {
      const client = createCloudflareClient({ ai: fake(async () => shape) });
      await expect(client.complete("m", [{ role: "user", content: "hi" }], POLICY)).rejects.toThrowError(
        /INVALID_MODEL_OUTPUT/,
      );
    }
  });

  it("streams text with one terminal usage snapshot then done", async () => {
    const client = createCloudflareClient({
      ai: fake(async () =>
        sseStream([
          '{"choices":[{"delta":{"content":"A"}}]}',
          '{"choices":[{"delta":{"content":"B"}}],"usage":{"prompt_tokens":3,"completion_tokens":2}}',
          "[DONE]",
        ]),
      ),
    });
    const texts: string[] = [];
    const usages: unknown[] = [];
    let done = false;
    for await (const chunk of client.stream("m", [{ role: "user", content: "hi" }], POLICY)) {
      if (chunk.text) texts.push(chunk.text);
      if (chunk.usage) usages.push(chunk.usage);
      if (chunk.done) done = true;
    }
    expect(texts).toEqual(["A", "B"]);
    expect(usages).toHaveLength(1);
    expect(done).toBe(true);
  });

  it("marks EOF after visible text as partial failure", async () => {
    const client = createCloudflareClient({
      ai: fake(async () => sseStream(['{"choices":[{"delta":{"content":"half"}}]}'])),
    });
    const seen: string[] = [];
    await expect(
      (async () => {
        for await (const chunk of client.stream("m", [{ role: "user", content: "hi" }], POLICY)) {
          if (chunk.text) seen.push(chunk.text);
        }
      })(),
    ).rejects.toThrowError(/PARTIAL_MODEL_OUTPUT/);
    expect(seen).toEqual(["half"]);
  });

  it("maps the new partial code to HTTP 502", () => {
    expect(rpcErrorToHttpStatus(new Error("PARTIAL_MODEL_OUTPUT: cut"))).toBe(502);
  });
});
