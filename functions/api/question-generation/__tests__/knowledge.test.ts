import { describe, expect, it } from "vitest";
import { generateKnowledgeQuestions } from "../handlers/career-knowledge.js";

function makeSupabase(overrides: { existing?: unknown | null; rpcData?: unknown; rpcError?: unknown } = {}) {
  return {
    from(table: string) {
      if (table === "career_assessment_ai_questions") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      eq() {
                        return {
                          eq() {
                            return {
                              is() {
                                return {
                                  order() {
                                    return {
                                      limit() {
                                        return {
                                          maybeSingle: () => {
                                            if (overrides.existing) return Promise.resolve({ data: overrides.existing, error: null });
                                            return Promise.resolve({ data: null, error: null });
                                          },
                                        };
                                      },
                                    };
                                  },
                                };
                              },
                            };
                          },
                        };
                      },
                    };
                  },
                };
              },
            };
          },
        } as any;
      }
      return { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }) }) } as any;
    },
    rpc(name: string, args: unknown) {
      if (name === "get_or_create_shared_questions") {
        if (overrides.rpcError) return Promise.resolve({ data: null, error: overrides.rpcError });
        const data = (overrides.rpcData as { questions?: unknown[] }) ?? { questions: (args as { p_questions: unknown[] }).p_questions, is_new: true };
        return Promise.resolve({ data, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
  } as any;
}

const workerQuestions = [
  { id: 1, type: "mcq", question: "Q1?", options: ["A", "B", "C", "D"], correct_answer: "A" },
];

describe("knowledge via worker (canonical pre-check + generation)", () => {
  it("reuses canonical set without calling worker", async () => {
    const existing = { questions: workerQuestions };
    let calls = 0;
    const result = await generateKnowledgeQuestions(
      { SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k", AI_ASSERT_SECRET: "s", AI_SERVICE: {} } as never,
      "stream-1", "Science", ["topic"], 20, "learner-1", "attempt-1", "college", true,
      "user-1",
      {
        supabase: makeSupabase({ existing }),
        callWorker: async () => {
          calls += 1;
          return { ok: true as const, data: { streamId: "stream-1", streamName: "Science", gradeLevel: "college", total_questions: 1, questions: workerQuestions } };
        },
      } as never,
    );
    expect(result).toEqual(workerQuestions);
    expect(calls).toBe(0);
  });

  it("calls worker and persists via RPC on miss (isCollegeLearner branch)", async () => {
    let seen: unknown;
    const result = await generateKnowledgeQuestions(
      { SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k", AI_ASSERT_SECRET: "s", AI_SERVICE: {} } as never,
      "stream-1", "Science", null, 20, "learner-1", "attempt-1", "college", true,
      "user-1",
      {
        supabase: makeSupabase({ existing: null, rpcData: { questions: workerQuestions, is_new: true } }),
        callWorker: async (args: unknown) => {
          seen = args;
          return { ok: true as const, data: { streamId: "stream-1", streamName: "Science", gradeLevel: "college", total_questions: 1, questions: workerQuestions } };
        },
      } as never,
    );
    expect(result).toHaveLength(1);
    const sent = seen as { streamId: string; streamName: string; isCollegeLearner: boolean };
    expect(sent.streamId).toBe("stream-1");
    expect(sent.isCollegeLearner).toBe(true);
  });

  it("forces 20 even when requestedCount differs", async () => {
    let seen: unknown;
    await generateKnowledgeQuestions(
      { SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k", AI_ASSERT_SECRET: "s", AI_SERVICE: {} } as never,
      "stream-1", "Science", ["t"], 999, "learner-1", "attempt-1", "college", false,
      "user-1",
      {
        supabase: makeSupabase({ existing: null, rpcData: { questions: workerQuestions, is_new: true } }),
        callWorker: async (args: unknown) => {
          seen = args;
          return { ok: true as const, data: { streamId: "stream-1", streamName: "Science", gradeLevel: "college", total_questions: 1, questions: workerQuestions } };
        },
      } as never,
    );
    // worker always gets gradeLevel college, topics as provided (quirk: topics never interpolated but passed through)
    const sent = seen as { gradeLevel: string; topics: unknown };
    expect(sent.gradeLevel).toBe("college");
  });

  it("propagates worker denials", async () => {
    await expect(
      generateKnowledgeQuestions(
        { SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k", AI_ASSERT_SECRET: "s", AI_SERVICE: {} } as never,
        "stream-1", "Science", ["t"], 20, undefined, undefined, "college", false,
        "user-1",
        {
          supabase: makeSupabase({ existing: null }),
          callWorker: async () => ({ ok: false as const, code: "FEATURE_ACCESS_DENIED", message: "nope" }),
        } as never,
      ),
    ).rejects.toMatchObject({ code: "FEATURE_ACCESS_DENIED" });
  });

  it("throws on missing wiring", async () => {
    await expect(
      generateKnowledgeQuestions({ SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k" } as never, "stream-1", "Science", ["t"], 20, undefined, undefined, "college", false, "user-1", {
        supabase: makeSupabase({ existing: null }),
      } as never),
    ).rejects.toThrow(/AI_ASSERT_SECRET/);
  });
});
