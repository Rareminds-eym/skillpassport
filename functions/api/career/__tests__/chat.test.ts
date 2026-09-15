import { describe, expect, it } from "vitest";
import { handleCareerChat } from "../handlers/chat.js";
import type { StoredMessage } from "../types.js";

const USER = "user-1";

function post(body: unknown): Request {
  return new Request("https://pages.local/api/career/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function workerSse(texts: string[]): Response {
  const lines = [
    `data: ${JSON.stringify({ type: "started", requestId: "r", executionId: "e" })}`,
    ...texts.map((text, i) => `data: ${JSON.stringify({ type: "delta", sequence: i, text })}`),
    `data: ${JSON.stringify({ type: "completed", executionId: "e", outcome: "answered" })}`,
  ];
  return new Response(lines.join("\n\n") + "\n\n");
}

function basePorts(overrides: Record<string, unknown> = {}) {
  return {
    checkRateLimit: async () => true,
    loadConversation: async () => ({ messages: [] as StoredMessage[], updated_at: "t" }),
    countUserMessages: async () => 0,
    assembleContext: async () => ({
      conversationPhase: "exploring",
      intent: "general",
      confidence: "high",
      hasAssessment: false,
      systemPromptWithMemory: "SYS",
      historyTail: [{ role: "user" as const, content: "prior" }],
    }),
    saveMessages: async () => ({ success: true as const, conversation_id: "conv-1" }),
    ...overrides,
  };
}

describe("career chat via worker", () => {
  it("streams worker deltas as legacy lines, completes, and persists identically", async () => {
    let workerInput: unknown;
    let saved: unknown;
    const ports = basePorts({
      callWorker: async (args: unknown) => {
        workerInput = args;
        return workerSse(["Hel", "lo"]);
      },
      saveMessages: async (_db: unknown, args: unknown) => {
        saved = args;
        return { success: true as const, conversation_id: "conv-1" };
      },
    });
    const res = await handleCareerChat(post({ message: "hi" }), {} as never, USER, ports as never);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain(`data: ${JSON.stringify({ content: "Hel" })}`);
    expect(text).toContain(`data: ${JSON.stringify({ content: "lo" })}`);
    expect(text).toContain('"done":true');
    expect(text).toContain('"conversationId":"conv-1"');
    expect(text).toContain('"intent":"general"');
    expect(text).toContain('"phase":"exploring"');
    expect(text).toContain('"hasAssessment":false');
    expect(text).toContain('"messageId"');

    const sent = workerInput as { message: string; system: string; history: unknown[] };
    expect(sent.message).toBe("hi");
    expect(sent.system).toBe("SYS");
    expect(sent.history).toEqual([{ role: "user", content: "prior" }]);

    const persisted = saved as {
      learnerId: string;
      conversationId: null;
      title: string;
      messages: StoredMessage[];
    };
    expect(persisted.learnerId).toBe(USER);
    expect(persisted.conversationId).toBeNull();
    expect(persisted.title.length).toBeGreaterThan(0);
    expect(persisted.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(persisted.messages[0]?.content).toBe("hi");
    expect(persisted.messages[1]?.content).toBe("Hello");
    expect(persisted.messages[0]?.id).toBe(persisted.messages[1]?.id);
  });
});

describe("career chat guards", () => {
  it("blocks on quota before spending (worker never called)", async () => {
    let calls = 0;
    const ports = basePorts({
      countUserMessages: async () => 2,
      callWorker: async () => {
        calls += 1;
        return workerSse(["x"]);
      },
    });
    const res = await handleCareerChat(post({ message: "hi" }), {} as never, USER, ports as never);
    expect(res.status).toBe(403);
    expect(await res.text()).toContain("QUOTA_EXCEEDED");
    expect(calls).toBe(0);
  });

  it("denies unknown conversations before spending", async () => {
    let calls = 0;
    const ports = basePorts({
      loadConversation: async () => null,
      callWorker: async () => {
        calls += 1;
        return workerSse(["x"]);
      },
    });
    const res = await handleCareerChat(
      post({ message: "hi", conversationId: "123e4567-e89b-12d3-a456-426614174000" }),
      {} as never,
      USER,
      ports as never,
    );
    expect(res.status).toBe(403);
    expect(calls).toBe(0);
  });

  it("maps worker failure without persisting", async () => {
    let saved = 0;
    const failed = new Response(
      `data: ${JSON.stringify({ type: "failed", error: { code: "DOWNSTREAM_TIMEOUT", message: "t", requestId: "r", retryable: true } })}\n\n`,
    );
    const ports = basePorts({
      callWorker: async () => failed,
      saveMessages: async () => {
        saved += 1;
        return { success: true as const, conversationId: "c" };
      },
    });
    const res = await handleCareerChat(post({ message: "hi" }), {} as never, USER, ports as never);
    const text = await res.text();
    expect(text).toContain("Worker generation failed");
    expect(saved).toBe(0);
  });

  it("rejects bad methods and bodies like the legacy path", async () => {
    const ports = basePorts();
    const get = await handleCareerChat(
      new Request("https://pages.local/api/career/chat"),
      {} as never,
      USER,
      ports as never,
    );
    expect(get.status).toBe(405);
    const empty = await handleCareerChat(post({ message: "" }), {} as never, USER, ports as never);
    expect(empty.status).toBe(400);
  });
});
