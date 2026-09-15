import { describe, expect, it } from "vitest";
import { generateAssessment } from "../handlers/course-assessment.js";

function makeSupabase(overrides: { existing?: unknown | null; insertError?: unknown } = {}) {
  const existing = overrides.existing;
  return {
    from(table: string) {
      if (table === "generated_external_assessment") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      single: () => {
                        if (existing) return Promise.resolve({ data: existing, error: null });
                        return Promise.resolve({ data: null, error: { message: "not found" } });
                      },
                    };
                  },
                };
              },
            };
          },
          insert() {
            return Promise.resolve({ error: overrides.insertError ?? null });
          },
        } as any;
      }
      return { select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }), insert: () => Promise.resolve({ error: null }) } as any;
    },
  } as any;
}

const workerQuestions = [
  { id: 1, type: "mcq", difficulty: "easy", question: "What is 2+2?", options: ["3", "4", "5", "6"], correct_answer: "4", skill_tag: "math", estimated_time: 50 },
  { id: 2, type: "mcq", difficulty: "medium", question: "What is capital?", options: ["A", "B", "C", "D"], correct_answer: "A", skill_tag: "", estimated_time: 80 },
];

describe("course-assessment via worker (cached + generation)", () => {
  it("returns cached without calling worker", async () => {
    const cached = { assessment_level: "Beginner", questions: workerQuestions };
    let calls = 0;
    const result = await generateAssessment(
      { SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k", AI_ASSERT_SECRET: "secret-min-32-chars-0000000000", AI_SERVICE: {} } as never,
      "Python", "Beginner", 2, "user-1",
      {
        supabase: makeSupabase({ existing: cached }),
        callWorker: async () => {
          calls += 1;
          return { ok: true as const, data: { course: "Python", level: "Beginner", total_questions: 2, questions: workerQuestions } };
        },
      } as never,
    );
    expect(result.cached).toBe(true);
    expect(result.questions).toHaveLength(2);
    expect(calls).toBe(0);
  });

  it("calls worker and caches on miss", async () => {
    let seen: unknown;
    const result = await generateAssessment(
      { SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k", AI_ASSERT_SECRET: "secret-min-32-chars-0000000000", AI_SERVICE: {} } as never,
      "Python", "Beginner", 2, "user-1",
      {
        supabase: makeSupabase({ existing: null }),
        callWorker: async (args: unknown) => {
          seen = args;
          return { ok: true as const, data: { course: "Python", level: "Beginner", total_questions: 2, questions: workerQuestions } };
        },
      } as never,
    );
    expect(result.cached).toBe(false);
    expect(result.questions).toHaveLength(2);
    const sent = seen as { courseName: string; level: string; questionCount: number };
    expect(sent.courseName).toBe("Python");
    expect(sent.level).toBe("Beginner");
    expect(sent.questionCount).toBe(2);
  });

  it("propagates worker denials with code", async () => {
    await expect(
      generateAssessment(
        { SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k", AI_ASSERT_SECRET: "s", AI_SERVICE: {} } as never,
        "Python", "Beginner", 2, "user-1",
        {
          supabase: makeSupabase({ existing: null }),
          callWorker: async () => ({ ok: false as const, code: "FEATURE_ACCESS_DENIED", message: "nope" }),
        } as never,
      ),
    ).rejects.toMatchObject({ code: "FEATURE_ACCESS_DENIED" });
  });

  it("throws on missing wiring", async () => {
    await expect(
      generateAssessment({ SUPABASE_URL: "https://x", SUPABASE_SERVICE_ROLE_KEY: "k" } as never, "Python", "Beginner", 2, "user-1", {
        supabase: makeSupabase({ existing: null }),
      } as never),
    ).rejects.toThrow(/AI_ASSERT_SECRET/);
  });
});
