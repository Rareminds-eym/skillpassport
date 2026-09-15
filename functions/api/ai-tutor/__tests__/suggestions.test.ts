import { describe, expect, it } from "vitest";
import { handleAiTutorSuggestions } from "../handlers/ai-tutor-suggestions.js";

function makeSupabase(overrides: { lesson?: unknown; module?: unknown; lessonError?: unknown } = {}) {
  const lesson = overrides.lesson ?? { lesson_id: "l-1", title: "Fractions", content: "A fraction is a part.", module_id: "m-1" };
  const mod = overrides.module ?? { title: "Arithmetic" };
  return {
    from(table: string) {
      if (table === "lessons") {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle() {
                    if (overrides.lessonError) return Promise.resolve({ data: null, error: overrides.lessonError });
                    return Promise.resolve({ data: lesson, error: null });
                  },
                };
              },
            };
          },
        } as any;
      }
      if (table === "course_modules") {
        return {
          select() {
            return {
              eq() {
                return { maybeSingle: () => Promise.resolve({ data: mod, error: null }) };
              },
            };
          },
        } as any;
      }
      return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) } as any;
    },
  } as any;
}

function makeContext(body: unknown, env: Record<string, string> = {}, supabase?: unknown): any {
  const context: any = {
    request: new Request("https://pages.local/api/ai-tutor/suggestions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    env: { AI_ASSERT_SECRET: "test-secret-min-32-chars-0000000000", ...env },
    data: { user: { sub: "user-1", id: "user-1" } },
  };
  // inject supabase via ports, not env
  return { context, supabase: (supabase as any) ?? makeSupabase() };
}

const workerQuestions = ["What is a fraction?", "Why does it matter?", "How to add them?"];

describe("tutor suggestions via worker", () => {
  it("returns worker questions on success", async () => {
    let seen: unknown;
    const { context, supabase } = makeContext({ lessonId: "l-1" });
    const res = await handleAiTutorSuggestions(context, {
      supabase,
      callWorker: async (args: unknown) => {
        seen = args;
        return { ok: true as const, questions: workerQuestions };
      },
    } as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { questions: string[]; lessonTitle: string } };
    expect(body.success).toBe(true);
    expect(body.data.questions).toEqual(workerQuestions);
    expect(body.data.lessonTitle).toBe("Fractions");
    const sent = seen as { lessonTitle: string; moduleTitle: string; lessonContent: string };
    expect(sent.lessonTitle).toBe("Fractions");
    expect(sent.moduleTitle).toBe("Arithmetic");
    expect(sent.lessonContent).toContain("fraction");
  });

  it("returns defaults when lesson missing", async () => {
    const { context } = makeContext({ lessonId: "missing" }, {}, makeSupabase({ lesson: null }));
    const res = await handleAiTutorSuggestions(context, { supabase: makeSupabase({ lesson: null }) } as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { questions: string[]; lessonTitle: string } };
    expect(body.data.questions.length).toBe(3);
    expect(body.data.lessonTitle).toBe("Unknown Lesson");
  });

  it("falls back to defaults on INVALID_MODEL_OUTPUT", async () => {
    const { context, supabase } = makeContext({ lessonId: "l-1" });
    const res = await handleAiTutorSuggestions(context, {
      supabase,
      callWorker: async () => ({ ok: false as const, code: "INVALID_MODEL_OUTPUT", message: "short" }),
    } as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { questions: string[] } };
    expect(body.data.questions[0]).toContain("Fractions");
  });

  it("maps entitlement denial to 403", async () => {
    const { context, supabase } = makeContext({ lessonId: "l-1" });
    const res = await handleAiTutorSuggestions(context, {
      supabase,
      callWorker: async () => ({ ok: false as const, code: "FEATURE_ACCESS_DENIED", message: "nope" }),
    } as any);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.error.code).toBe("FEATURE_ACCESS_DENIED");
  });

  it("rejects bad bodies without spending", async () => {
    let calls = 0;
    const stub = {
      supabase: makeSupabase(),
      callWorker: async () => {
        calls += 1;
        return { ok: true as const, questions: workerQuestions };
      },
    } as any;
    for (const body of [{}, { lessonId: "" }, { lessonId: null }]) {
      const { context } = makeContext(body);
      const res = await handleAiTutorSuggestions(context, stub as any);
      expect(res.status).toBe(400);
    }
    expect(calls).toBe(0);
  });

  it("returns 405 on bad method", async () => {
    const context: any = {
      request: new Request("https://pages.local/api/ai-tutor/suggestions", { method: "GET" }),
      env: { AI_ASSERT_SECRET: "s" },
      data: { user: { sub: "u" } },
    };
    const res = await handleAiTutorSuggestions(context, { supabase: makeSupabase() } as any);
    expect(res.status).toBe(405);
  });
});
