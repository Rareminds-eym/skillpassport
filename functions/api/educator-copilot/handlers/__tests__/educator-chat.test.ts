import { describe, expect, it } from "vitest";
import { handleEducatorCopilotChat } from "../educator-chat.js";
import { parseIntent, sanitizeEducatorContext } from "../../lib/educator-prompts.js";
import { requireRole } from "../../../../lib/auth.js";

function post(body: unknown): Request {
  return new Request("https://pages.local/api/educator-copilot/chat", {
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
    run: async (model: string, inputs: Record<string, unknown>) =>
      inputs && (inputs as { stream?: boolean }).stream
        ? sseStream([`hi-from-${model.includes("glm") ? "glm" : "nemotron"}`])
        : { response: "learner-insights", usage: { prompt_tokens: 3, completion_tokens: 1 } },
  },
};

describe("educator copilot chat handler", () => {
  it("rejects bad ops and empty queries", async () => {
    for (const body of [{ op: "nope", query: "hi" }, { op: "classify", query: "  " }, {}]) {
      const res = await handleEducatorCopilotChat(ENV, post(body));
      expect(res.status).toBe(400);
    }
  });

  it("requires the Cloudflare binding", async () => {
    const res = await handleEducatorCopilotChat({}, post({ op: "classify", query: "hi" }));
    expect(res.status).toBe(500);
  });

  it("classifies intent through the server prompt", async () => {
    const res = await handleEducatorCopilotChat(ENV, post({ op: "classify", query: "who is struggling?" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ data: { intent: "learner-insights" } });
  });

  it("degrades unknown intents to general", () => {
    expect(parseIntent("  CLASS-ANALYTICS ")).toBe("class-analytics");
    expect(parseIntent("nonsense")).toBe("general");
  });

  it("sanitizes client context to bounded values", () => {
    const sane = sanitizeEducatorContext({
      name: "A".repeat(500),
      total_learners: -3,
      subjects_taught: ["Math", 42, "x".repeat(300)],
      injected: "drop",
    });
    expect(sane.name).toHaveLength(80);
    expect(sane.total_learners).toBe(0);
    expect(sane.subjects_taught).toEqual(["Math", "x".repeat(60)]);
    expect(sane).not.toHaveProperty("injected");
  });

  it("responds non-streaming with intent echo", async () => {
    const res = await handleEducatorCopilotChat(
      ENV,
      post({ op: "respond", query: "tips?", intent: "guidance-request", context: { name: "Ravi" }, history: [] }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { intent: string; message: string } };
    expect(json.data.intent).toBe("guidance-request");
    expect(typeof json.data.message).toBe("string");
  });

  it("streams SSE text then DONE", async () => {
    const res = await handleEducatorCopilotChat(ENV, post({ op: "respond-stream", query: "tips?" }));
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain('"text":"hi-from-glm"');
    expect(text).toContain("[DONE]");
  });

  it("denies non-educator roles at the gate", async () => {
    const gate = requireRole(["educator", "school_educator", "college_educator"], async () => new Response("ok"));
    const denied = await gate({ data: { user: { roles: ["learner"] } } });
    expect(denied.status).toBe(403);
    const allowed = await gate({ data: { user: { roles: ["school_educator"] } } });
    expect(await allowed.text()).toBe("ok");
  });
});
