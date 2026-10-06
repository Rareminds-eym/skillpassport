import { describe, expect, it } from "vitest";
import { handleRecruiterCopilotChat } from "../recruiter-chat.js";
import { buildLayer3ClassifyPrompt, buildParsePrompt, parseLayer3Result } from "../../lib/recruiter-prompts.js";
import { requireRole } from "../../../../lib/auth.js";

function post(body: unknown): Request {
  return new Request("https://pages.local/api/recruiter-ai/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function sseStream(texts: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const t of texts) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`));
      }
      controller.enqueue(enc.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

const ENV = {
  AI: {
    run: async (_model: string, inputs: Record<string, unknown>) =>
      inputs && (inputs as { stream?: boolean }).stream
        ? sseStream(["chunk-one"])
        : { response: '{"primary": "candidate-search", "confidence": 0.9}', usage: { prompt_tokens: 9, completion_tokens: 4 } },
  },
};

describe("recruiter copilot chat handler", () => {
  it("rejects bad ops and empty inputs", async () => {
    for (const body of [
      { op: "nope" },
      { op: "classify-llm", query: " " },
      { op: "parse", query: "" },
      { op: "analyze", kind: "hiring-recommendations", prompt: " " },
      { op: "respond", prompt: "" },
      { op: "analyze", kind: "bogus", prompt: "data" },
    ]) {
      const res = await handleRecruiterCopilotChat(ENV, post(body));
      expect(res.status).toBe(400);
    }
  });

  it("requires the Cloudflare binding", async () => {
    const res = await handleRecruiterCopilotChat({}, post({ op: "parse", query: "find react devs" }));
    expect(res.status).toBe(500);
  });

  it("classifies through the verbatim layer-3 prompt", async () => {
    const res = await handleRecruiterCopilotChat(
      ENV,
      post({ op: "classify-llm", query: "find react developers", history: [] }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      data: { primary: "candidate-search", confidence: 0.9, secondaryIntents: [] },
    });
  });

  it("returns raw parse text for browser-side merge", async () => {
    const res = await handleRecruiterCopilotChat(ENV, post({ op: "parse", query: "find react devs" }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { text: string } };
    expect(typeof json.data.text).toBe("string");
  });

  it("streams SSE text then DONE", async () => {
    const res = await handleRecruiterCopilotChat(ENV, post({ op: "respond-stream", prompt: "general prompt" }));
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("chunk-one");
    expect(text).toContain("[DONE]");
  });

  it("parses fenced classification JSON and keeps prompt builders intact", () => {
    expect(parseLayer3Result('```json\n{"primary": "general", "confidence": 0.5}\n```')).toEqual({
      primary: "general",
      confidence: 0.5,
    });
    const { user } = buildLayer3ClassifyPrompt("hire for nurse", []);
    expect(user).toContain("job-matching");
    expect(buildParsePrompt("top universities").user).toContain('["IIT", "NIT", "IIIT", "BITS"]');
  });

  it("denies non-recruiter roles at the gate", async () => {
    const gate = requireRole(["recruiter", "company_admin", "owner"], async () => new Response("ok"));
    expect((await gate({ data: { user: { roles: ["learner"] } } })).status).toBe(403);
    expect(await (await gate({ data: { user: { roles: ["company_admin"] } } })).text()).toBe("ok");
  });
});
