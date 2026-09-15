import { describe, expect, it } from "vitest";
import { handleAiTutorChat } from "../handlers/ai-tutor-chat.js";

function makeSupabase(overrides: {
  learnerType?: string | null;
  existingMessages?: unknown[] | null;
} = {}) {
  return {
    from(table: string) {
      if (table === "tutor_conversations") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: () => Promise.resolve({ data: overrides.existingMessages ? { messages: overrides.existingMessages } : null, error: null }),
                    };
                  },
                };
              },
            };
          },
          insert() {
            return {
              select() {
                return {
                  single: () => Promise.resolve({ data: { id: "new-conv" }, error: null }),
                };
              },
            };
          },
        } as any;
      }
      if (table === "learners") {
        return {
          select() {
            return {
              eq() {
                return { maybeSingle: () => Promise.resolve({ data: overrides.learnerType ? { learner_type: overrides.learnerType } : null, error: null }) };
              },
            };
          },
        } as any;
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      } as any;
    },
    rpc: async () => ({ error: null }),
  } as any;
}

function makeCourseContext() {
  return {
    courseTitle: "Biology 101",
    courseDescription: "Desc",
    courseCode: "BIO101",
    currentModule: null,
    currentLesson: null,
    availableResources: [],
    learnerProgress: { completedLessons: [], currentLessonStatus: null, totalLessons: 0, completionPercentage: 0 },
    allModules: [],
    allLessons: [],
    videoSummary: null,
  };
}

function makeContext(body: unknown, user: { id: string; roles?: string[] } = { id: "learner-1", roles: ["learner"] }, env: Record<string, string> = {}): any {
  return {
    request: new Request("https://pages.local/api/ai-tutor/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    env: { AI_ASSERT_SECRET: "test-secret-min-32-chars-0000000000", SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k", ...env },
    data: { user: { sub: user.id, id: user.id, roles: user.roles, user_id: user.id } },
  };
}

describe("tutor-chat via worker (learner streaming)", () => {
  it("streams worker delta as legacy token events and completes", async () => {
    const workerSse = [
      'data: {"type":"started","requestId":"r","executionId":"e"}',
      'data: {"type":"delta","sequence":0,"text":"Hello"}',
      'data: {"type":"delta","sequence":1,"text":" world"}',
      'data: {"type":"completed","executionId":"e","outcome":"answered"}',
    ].join("\n");
    const workerResponse = new Response(workerSse, { headers: { "content-type": "text/event-stream" } });
    const ctx = makeContext({ courseId: "c-1", message: "hi" });
    const res = await handleAiTutorChat(ctx, {
      supabase: makeSupabase(),
      buildCourseContext: async () => makeCourseContext() as never,
      callWorker: async () => workerResponse,
    } as any);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("event: token");
    expect(text).toContain("Hello");
    expect(text).toContain("event: done");
    expect(text).toContain("new-conv");
  });

  it("rejects bad bodies without spending", async () => {
    let calls = 0;
    const stub = {
      supabase: makeSupabase(),
      buildCourseContext: async () => makeCourseContext() as never,
      callWorker: async () => {
        calls += 1;
        return new Response('data: {"type":"delta","text":"x"}', { headers: { "content-type": "text/event-stream" } });
      },
    } as any;
    for (const body of [{}, { courseId: "c" }, { message: "hi" }, { courseId: "", message: "" }]) {
      const ctx = makeContext(body);
      const res = await handleAiTutorChat(ctx, stub as any);
      expect(res.status).toBe(400);
    }
    expect(calls).toBe(0);
  });

  it("blocks educator without generation config", async () => {
    const ctx = makeContext({ courseId: "c-1", message: "hi" }, { id: "u", roles: ["educator"] });
    const res = await handleAiTutorChat(ctx, { supabase: makeSupabase(), buildCourseContext: async () => makeCourseContext() as never } as any);
    expect(res.status).toBe(403);
  });

  it("maps missing wiring to 503", async () => {
    const ctx = makeContext({ courseId: "c-1", message: "hi" }, { id: "u" }, { AI_ASSERT_SECRET: "" });
    const res = await handleAiTutorChat(ctx, { supabase: makeSupabase(), buildCourseContext: async () => makeCourseContext() as never } as any);
    expect(res.status).toBe(503);
  });

  it("returns 405 on bad method", async () => {
    const ctx: any = {
      request: new Request("https://pages.local/api/ai-tutor/chat", { method: "GET" }),
      env: { AI_ASSERT_SECRET: "s", SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k" },
      data: { user: { sub: "u", id: "u", roles: ["learner"] } },
    };
    const res = await handleAiTutorChat(ctx, { supabase: makeSupabase(), buildCourseContext: async () => makeCourseContext() as never } as any);
    expect(res.status).toBe(405);
  });
});

describe("generate-material via worker (educator streaming)", () => {
  const worksheetConfig = {
    templateType: "multiple_choice",
    difficulty: "medium",
    gradeLevel: "",
    questionCount: 10,
    includeAnswerKey: true,
    includeRubric: false,
    includeExtension: false,
    topic: "",
  };

  it("streams worker delta as legacy token events and completes", async () => {
    const workerSse = [
      'data: {"type":"started","requestId":"r","executionId":"e"}',
      'data: {"type":"delta","sequence":0,"text":"Quiz: "}',
      'data: {"type":"delta","sequence":1,"text":"Q1?"}',
      'data: {"type":"completed","executionId":"e","outcome":"answered"}',
    ].join("\n");
    const workerResponse = new Response(workerSse, { headers: { "content-type": "text/event-stream" } });
    let seen: unknown;
    const ctx = makeContext(
      { courseId: "c-1", message: "Make a quiz", worksheetConfig },
      { id: "educator-1", roles: ["educator"] },
    );
    const res = await handleAiTutorChat(ctx, {
      supabase: makeSupabase(),
      buildCourseContext: async () => makeCourseContext() as never,
      callMaterialWorker: async (args: unknown) => {
        seen = args;
        return workerResponse;
      },
    } as any);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("event: token");
    expect(text).toContain("Quiz: ");
    expect(text).toContain("event: done");
    const sent = seen as { userRole: string; messageCount: number; worksheetConfig: unknown };
    expect(sent.userRole).toBe("educator");
    expect(sent.messageCount).toBe(0);
    expect(sent.worksheetConfig).toMatchObject({ templateType: "multiple_choice" });
  });

  it("passes messageCount from full history length", async () => {
    const workerSse = [
      'data: {"type":"started","requestId":"r","executionId":"e"}',
      'data: {"type":"delta","sequence":0,"text":"Doc"}',
      'data: {"type":"completed","executionId":"e","outcome":"answered"}',
    ].join("\n");
    let seen: unknown;
    const existing = Array.from({ length: 8 }, (_, i) => ({ id: `m${i}`, role: i % 2 === 0 ? "user" : "assistant", content: `m${i}`, timestamp: new Date().toISOString() }));
    const ctx = makeContext(
      { conversationId: "conv-1", courseId: "c-1", message: "Make a quiz", worksheetConfig },
      { id: "educator-1", roles: ["educator"] },
    );
    const res = await handleAiTutorChat(ctx, {
      supabase: makeSupabase({ existingMessages: existing }),
      buildCourseContext: async () => makeCourseContext() as never,
      callMaterialWorker: async (args: unknown) => {
        seen = args;
        return new Response(workerSse, { headers: { "content-type": "text/event-stream" } });
      },
    } as any);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const sent = seen as { messageCount: number; history: unknown[] };
    expect(sent.messageCount).toBe(8);
    expect((sent.history as unknown[])).toHaveLength(6);
  });

  it("maps worker denial to status without streaming", async () => {
    const ctx = makeContext(
      { courseId: "c-1", message: "Make a quiz", worksheetConfig },
      { id: "educator-1", roles: ["educator"] },
    );
    const res = await handleAiTutorChat(ctx, {
      supabase: makeSupabase(),
      buildCourseContext: async () => makeCourseContext() as never,
      callMaterialWorker: async () => {
        throw new Error("FEATURE_ACCESS_DENIED: nope");
      },
    } as any);
    expect(res.status).toBe(403);
  });

  it("maps missing wiring to 503", async () => {
    const ctx = makeContext(
      { courseId: "c-1", message: "Make a quiz", worksheetConfig },
      { id: "educator-1", roles: ["educator"] },
      { AI_ASSERT_SECRET: "" },
    );
    const res = await handleAiTutorChat(ctx, {
      supabase: makeSupabase(),
      buildCourseContext: async () => makeCourseContext() as never,
    } as any);
    expect(res.status).toBe(503);
  });
});
