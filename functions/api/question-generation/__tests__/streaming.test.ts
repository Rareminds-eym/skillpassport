import { describe, expect, it } from "vitest";
import { handleStreamingAptitude } from "../handlers/streaming.js";

function post(body: unknown): Request {
  return new Request("https://pages.local/api/question-generation/career-assessment/generate-aptitude/stream", {
    method: "POST",
    headers: { "content-type": "application/json", "x-user-id": "user-1" },
    body: JSON.stringify(body),
  });
}

function makeSupabase(opts: { gradeLevel?: string | null; rpcIsNew?: boolean; rpcError?: unknown } = {}) {
  const gradeLevel = opts.gradeLevel === undefined ? "college" : opts.gradeLevel;
  return {
    from(table: string) {
      if (table === "personal_assessment_streams") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: () => {
                        if (gradeLevel === null) return Promise.resolve({ data: null, error: null });
                        return Promise.resolve({ data: { id: "s-1", grade_level: gradeLevel }, error: null });
                      },
                    };
                  },
                };
              },
            };
          },
        } as any;
      }
      return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }) } as any;
    },
    rpc(name: string, _args: unknown) {
      if (name === "get_or_create_shared_questions") {
        if (opts.rpcError) return Promise.resolve({ data: null, error: opts.rpcError });
        return Promise.resolve({ data: { is_new: opts.rpcIsNew ?? true, questions: [] }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
  } as any;
}

const env = { AI_ASSERT_SECRET: "test-secret-min-32-chars-0000000000", AI_SERVICE: {} } as never;

function parseSse(text: string): Array<{ type: string; [k: string]: unknown }> {
  return text.split("\n").map(l => l.trim()).filter(l => l.startsWith("data: ")).map(l => JSON.parse(l.replace("data: ", "")));
}

describe("streaming via worker (SSE progress/question/complete)", () => {
  it("streams questions and completes on success", async () => {
    const workerQuestions = [
      { id: 1, type: "mcq", question: "Q1?", options: ["A", "B", "C", "D"], correct_answer: "A" },
      { id: 2, type: "mcq", question: "Q2?", options: ["A", "B", "C", "D"], correct_answer: "B" },
    ];
    let seen: unknown;
    const res = await handleStreamingAptitude(
      post({ streamId: "s-1", learnerId: "l-1" }),
      env as never,
      undefined,
      {
        adminSupabase: makeSupabase(),
        supabase: makeSupabase(),
        callWorker: async (args: unknown) => {
          seen = args;
          return { ok: true as const, data: { streamId: "s-1", gradeLevel: "college", total_questions: 2, questions: workerQuestions } };
        },
      } as never,
    );
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    const events = parseSse(text);
    const kinds = events.map(e => e.type);
    expect(kinds[0]).toBe("progress");
    expect(kinds).toContain("question");
    expect(kinds[kinds.length - 1]).toBe("complete");
    const qs = events.filter(e => e.type === "question");
    expect(qs).toHaveLength(2);
    const sent = seen as { streamId: string; gradeLevel: string };
    expect(sent.streamId).toBe("s-1");
    expect(sent.gradeLevel).toBe("college");
  });

  it("emits warning when canonical race is lost (is_new false)", async () => {
    const res = await handleStreamingAptitude(
      post({ streamId: "s-1", learnerId: "l-1" }),
      env as never,
      undefined,
      {
        adminSupabase: makeSupabase(),
        supabase: makeSupabase({ rpcIsNew: false }),
        callWorker: async () => ({ ok: true as const, data: { streamId: "s-1", gradeLevel: "college", total_questions: 1, questions: [{ id: 1, question: "Q?" }] } }),
      } as never,
    );
    const events = parseSse(await res.text());
    expect(events.map(e => e.type)).toContain("warning");
  });

  it("rejects bad bodies without spending", async () => {
    let calls = 0;
    const stub = {
      adminSupabase: makeSupabase(),
      supabase: makeSupabase(),
      callWorker: async () => {
        calls += 1;
        return { ok: true as const, data: { streamId: "s", gradeLevel: "c", total_questions: 0, questions: [] } };
      },
    } as never;
    for (const body of [{}, { streamId: "" }, { learnerId: "l" }]) {
      const res = await handleStreamingAptitude(post(body), env as never, undefined, stub);
      expect(res.status).toBe(400);
    }
    expect(calls).toBe(0);
  });

  it("rejects unknown stream without spending", async () => {
    let calls = 0;
    const res = await handleStreamingAptitude(
      post({ streamId: "nope" }),
      env as never,
      undefined,
      {
        adminSupabase: makeSupabase({ gradeLevel: null }),
        supabase: makeSupabase({ gradeLevel: null }),
        callWorker: async () => {
          calls += 1;
          return { ok: true as const, data: { streamId: "x", gradeLevel: "c", total_questions: 0, questions: [] } };
        },
      } as never,
    );
    expect(res.status).toBe(400);
    expect(calls).toBe(0);
  });

  it("emits error event on worker denial", async () => {
    const res = await handleStreamingAptitude(
      post({ streamId: "s-1" }),
      env as never,
      undefined,
      {
        adminSupabase: makeSupabase(),
        supabase: makeSupabase(),
        callWorker: async () => ({ ok: false as const, code: "FEATURE_ACCESS_DENIED", message: "nope" }),
      } as never,
    );
    const events = parseSse(await res.text());
    expect(events[events.length - 1]?.type).toBe("error");
  });

  it("returns 405 on bad method", async () => {
    const res = await handleStreamingAptitude(new Request("https://pages.local/x", { method: "GET" }), env as never, undefined, {
      adminSupabase: makeSupabase(),
      supabase: makeSupabase(),
    } as never);
    expect(res.status).toBe(405);
  });
});
