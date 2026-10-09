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
    claimTurnIntent: async () => ({ created: true, sessionId: null as string | null, state: 'preparing' }),
    resolveTurnSession: async () => ({ sessionId: 'sess-1' }),
    freezeTurnIntent: async () => ({ ok: true }),
    completeTurnIntent: async () => undefined,
    loadConversation: async () => ({ messages: [] as StoredMessage[], updated_at: "t" }),
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
      conversationId: string | null;
      title: string;
      messages: StoredMessage[];
    };
    expect(persisted.learnerId).toBe(USER);
    expect(persisted.conversationId).toBe("sess-1");
    expect(persisted.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(persisted.messages[0]?.content).toBe("hi");
    expect(persisted.messages[1]?.content).toBe("Hello");
    expect(persisted.messages[0]?.id).toBe(persisted.messages[1]?.id);
  });
});

describe("career chat guards", () => {
  it("denies unknown conversations before spending", async () => {
    let calls = 0;
    const ports = basePorts({
      resolveTurnSession: async () => ({ error: "Conversation not found or access denied", status: 403 }),
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

  it("rejects malformed turn ids", async () => {
    const res = await handleCareerChat(
      post({ message: "hi", turnId: "not-a-uuid" }), {} as never, USER, basePorts() as never,
    );
    expect(res.status).toBe(400);
  });
});

describe("stable turns", () => {
  const TURN = "123e4567-e89b-12d3-a456-426614174000";

  it("returns 409 on turn payload conflict without calling the worker", async () => {
    let calls = 0;
    const ports = basePorts({
      claimTurnIntent: async () => ({ error: "TURN_PAYLOAD_CONFLICT" }),
      callWorker: async () => {
        calls += 1;
        return workerSse(["x"]);
      },
    });
    const res = await handleCareerChat(post({ message: "hi", turnId: TURN }), {} as never, USER, ports as never);
    expect(res.status).toBe(409);
    expect(await res.text()).toContain("TURN_PAYLOAD_CONFLICT");
    expect(calls).toBe(0);
  });

  it("maps worker credit denials to typed 429s", async () => {
    for (const [code, body] of [
      ["AI_CREDITS_EXHAUSTED", "AI_CREDITS_EXHAUSTED"],
      ["AI_REQUEST_IN_PROGRESS", "AI_REQUEST_IN_PROGRESS"],
      ["AI_CREDITS_PENDING", "AI_CREDITS_PENDING"],
    ] as const) {
      const ports = basePorts({
        callWorker: async () => { throw new Error(`${code}: denied`); },
      });
      const res = await handleCareerChat(post({ message: "hi", turnId: TURN }), {} as never, USER, ports as never);
      expect(res.status).toBe(429);
      expect(await res.text()).toContain(body);
    }
  });

  it("replays the saved answer when the worker dedupes", async () => {
    const ports = basePorts({
      claimTurnIntent: async () => ({
        created: false, sessionId: "sess-1", state: "terminal",
        workerInput: { conversationId: "sess-1", message: "hi" }, workerInputHash: "h",
        responseText: "saved answer", assistantMessageId: TURN,
      }),
      callWorker: async () => ({ duplicate: true as const, executionId: "exec-1" }),
    });
    const res = await handleCareerChat(post({ message: "hi", turnId: TURN }), {} as never, USER, ports as never);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("saved answer");
    expect(text).toContain('"replayed":true');
  });

  it("recovers from the transcript when the intent is open but the answer exists", async () => {
    const stored: StoredMessage[] = [
      { id: TURN, role: "user", content: "hi", timestamp: "t" },
      { id: TURN, role: "assistant", content: "recovered", timestamp: "t" },
    ];
    let completed = 0;
    const ports = basePorts({
      claimTurnIntent: async () => ({ created: false, sessionId: "sess-1", state: "dispatched" }),
      loadConversation: async () => ({ messages: stored, updated_at: "t" }),
      completeTurnIntent: async () => { completed += 1; },
      callWorker: async () => ({ duplicate: true as const }),
    });
    const res = await handleCareerChat(post({ message: "hi", turnId: TURN }), {} as never, USER, ports as never);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("recovered");
    expect(completed).toBe(1);
  });

  it("fails closed with 409 when a duplicate has no recoverable answer", async () => {
    const ports = basePorts({
      claimTurnIntent: async () => ({ created: false, sessionId: "sess-1", state: "dispatched" }),
      loadConversation: async () => ({ messages: [] as StoredMessage[], updated_at: "t" }),
      callWorker: async () => ({ duplicate: true as const }),
    });
    const res = await handleCareerChat(post({ message: "hi", turnId: TURN }), {} as never, USER, ports as never);
    expect(res.status).toBe(409);
    expect(await res.text()).toContain("TURN_STATE_UNKNOWN");
  });
});
