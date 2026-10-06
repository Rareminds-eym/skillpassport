import { describe, expect, it } from "vitest";
import { handleCounsellingChat } from "../counselling-chat.js";
import { buildlearnerContextPrompt, parseTopic, sanitizeLearnerContext, systemPromptFor } from "../../lib/counselling-prompts.js";
import { requireAdmin } from "../../../../lib/auth.js";

function post(body: unknown): Request {
  return new Request("https://pages.local/api/counselling/chat", {
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
        ? sseStream(["kind", "-reply"])
        : { response: "3-4 sentence summary.", usage: { prompt_tokens: 8, completion_tokens: 5 } },
  },
};

describe("counselling chat handler", () => {
  it("rejects bad ops and empty inputs", async () => {
    for (const body of [
      { op: "nope" },
      { op: "chat", message: " " },
      { op: "summarize", messages: [] },
    ]) {
      const res = await handleCounsellingChat(ENV, post(body));
      expect(res.status).toBe(400);
    }
  });

  it("requires the Cloudflare binding", async () => {
    const res = await handleCounsellingChat({}, post({ op: "chat", message: "hi" }));
    expect(res.status).toBe(500);
  });

  it("chats with topic gating and sanitized context", async () => {
    const res = await handleCounsellingChat(
      ENV,
      post({
        op: "chat",
        topic: "career",
        message: "resume tips?",
        learner_context: { name: "Asha", gpa: "8.1", junk: "x".repeat(5000) },
        history: [{ role: "user", content: "hi" }],
      }),
    );
    expect(res.status).toBe(200);
    expect(typeof ((await res.json()) as { data: { message: string } }).data.message).toBe("string");
  });

  it("summarizes sessions", async () => {
    const res = await handleCounsellingChat(
      ENV,
      post({ op: "summarize", topic: "academic", messages: [{ role: "user", content: "hello" }] }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ data: { summary: "3-4 sentence summary." } });
  });

  it("streams SSE text then DONE", async () => {
    const res = await handleCounsellingChat(ENV, post({ op: "chat-stream", topic: "general", message: "hi" }));
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain('"text":"kind"');
    expect(text).toContain('"text":"-reply"');
    expect(text).toContain("[DONE]");
  });

  it("keeps prompt builders faithful and bounded", () => {
    expect(parseTopic("career")).toBe("career");
    expect(parseTopic("bogus")).toBe("general");
    expect(systemPromptFor("mental-health")).toContain("NOT a licensed therapist");
    const ctx = sanitizeLearnerContext({ name: "A", enrolled_courses: ["M1", 7], recent_performance: [{ subject: "Math", grade: "A" }] });
    expect(ctx.enrolled_courses).toEqual(["M1"]);
    expect(buildlearnerContextPrompt(ctx)).toContain("Enrolled Courses: M1");
  });

  it("denies non-admin roles at the gate", async () => {
    const gate = requireAdmin(async () => new Response("ok")) as (ctx: unknown) => Promise<Response> | Response;
    expect((await gate({ data: { user: { roles: ["learner"] } } })).status).toBe(403);
    expect(await (await gate({ data: { user: { roles: ["college_admin"] } } })).text()).toBe("ok");
  });
});
