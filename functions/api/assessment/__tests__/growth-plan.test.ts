import { describe, expect, it } from "vitest";
import { generateStrengthsGrowthPlanHandler } from "../handlers/generate-strengths-growth-plan.js";

function makeContext(body: unknown, env: Record<string, string> = {}): any {
  return {
    request: new Request("https://pages.local/api/assessment/generate-strengths-growth-plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    env: { AI_ASSERT_SECRET: "test-secret-min-32-chars-0000000000", ...env },
    data: { user: { sub: "user-1", id: "user-1" } },
  };
}

function fakeSupabase(overrides: {
  occupations?: Array<{ id: string }>;
  capabilities?: unknown[];
  existing?: unknown;
  current?: unknown;
} = {}) {
  const occupations = overrides.occupations ?? [{ id: "occ-1" }];
  const capabilities =
    overrides.capabilities ??
    [
      { capability_master: { name: "Care", description: "c" }, capability_priority: "high", required_level: 3 },
      { capability_master: { name: "Records", description: "d" }, capability_priority: "medium", required_level: 2 },
    ];
  const existing = overrides.existing ?? { gemini_results: {} };
  const current = overrides.current ?? { gemini_results: {} };
  return {
    from(table: string) {
      if (table === "occupations") {
        return {
          select() {
            return {
              eq() {
                return Promise.resolve({ data: occupations, error: null });
              },
            };
          },
        };
      }
      if (table === "role_capability_sequence") {
        return {
          select() {
            return {
              in() {
                return {
                  order() {
                    return {
                      limit() {
                        return Promise.resolve({ data: capabilities, error: null });
                      },
                    };
                  },
                };
              },
            };
          },
        };
      }
      if (table === "personal_assessment_results") {
        return {
          select() {
            return {
              eq(_col: string, val: unknown) {
                // Distinguish fetch for existing vs current — return same shape
                // The handler calls .maybeSingle() after .eq, not .select() directly
                return {
                  maybeSingle() {
                    // If val looks like test id with cached role, return that
                    if (typeof val === "string" && (existing as any)?.gemini_results?.strengthsGrowthPlan) {
                      return Promise.resolve({ data: existing, error: null });
                    }
                    if ((existing as any) && typeof (existing as any).gemini_results !== "undefined") {
                      return Promise.resolve({ data: existing, error: null });
                    }
                    return Promise.resolve({ data: current, error: null });
                  },
                } as any;
              },
            };
          },
          update(_values: unknown) {
            return {
              eq() {
                return {
                  select() {
                    return Promise.resolve({ data: [{}], error: null });
                  },
                };
              },
            };
          },
          insert(_values: unknown) {
            return {
              select() {
                return Promise.resolve({ data: [{}], error: null });
              },
            };
          },
        } as any;
      }
      return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) } as any;
    },
  } as any;
}

const workerData = {
  strengths: [{ title: "Caring", reason: "You help people" }],
  growthAreas: [{ title: "Records", reason: "Learn it" }],
  immediateActions: [{ title: "Read docs" }],
  timeline: [{ month: "Month 1-2", capability: "Care" }],
};

describe("growth-plan via worker", () => {
  it("calls worker with derived capabilities and returns parsed plan", async () => {
    let seen: unknown;
    const ctx = makeContext({ roleName: "Nurse", learnerProfile: { riasec: { R: 10 } }, assessmentResultId: "ass-1" });
    const res = await generateStrengthsGrowthPlanHandler(ctx, {
      supabase: fakeSupabase(),
      callWorker: async (args: unknown) => {
        seen = args;
        return { ok: true as const, data: workerData };
      },
    } as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as typeof workerData & { cached: boolean };
    expect(body.strengths).toEqual(workerData.strengths);
    expect(body.cached).toBe(false);
    const sent = seen as { roleName: string; capabilities: string[]; learnerRiasec: Record<string, number> };
    expect(sent.roleName).toBe("Nurse");
    expect(sent.capabilities).toEqual(["Care", "Records"]);
    expect(sent.learnerRiasec).toEqual({ R: 10 });
  });

  it("returns cached without calling worker", async () => {
    let calls = 0;
    const cached = {
      gemini_results: {
        strengthsGrowthPlan: {
          Nurse: {
            strengths: [{ title: "Cached", reason: "r" }],
            growthAreas: [],
            immediateActions: [],
            timeline: [],
          },
        },
      },
    };
    const ctx = makeContext({ roleName: "Nurse", learnerProfile: { riasec: {} }, assessmentResultId: "ass-1" });
    const res = await generateStrengthsGrowthPlanHandler(ctx, {
      supabase: fakeSupabase({ existing: cached, current: cached }),
      callWorker: async () => {
        calls += 1;
        return { ok: true as const, data: workerData };
      },
    } as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { strengths: unknown[]; cached: boolean };
    expect(body.cached).toBe(true);
    expect(body.strengths).toEqual([{ title: "Cached", reason: "r" }]);
    expect(calls).toBe(0);
  });

  it("rejects bad bodies without spending", async () => {
    let calls = 0;
    const stub = {
      supabase: fakeSupabase(),
      callWorker: async () => {
        calls += 1;
        return { ok: true as const, data: workerData };
      },
    } as any;
    for (const body of [{ roleName: "" }, { roleName: "Nurse" }, {}, { roleName: "Nurse", learnerProfile: null }]) {
      const ctx = makeContext(body);
      const res = await generateStrengthsGrowthPlanHandler(ctx, stub);
      expect(res.status).toBe(400);
    }
    expect(calls).toBe(0);
  });

  it("maps worker denials", async () => {
    const ctx = makeContext({ roleName: "Nurse", learnerProfile: { riasec: {} } });
    const res = await generateStrengthsGrowthPlanHandler(ctx, {
      supabase: fakeSupabase(),
      callWorker: async () => ({ ok: false as const, code: "FEATURE_ACCESS_DENIED", message: "nope" }),
    } as any);
    expect(res.status).toBe(403);
  });

  it("maps missing wiring to 500", async () => {
    const ctx = makeContext({ roleName: "Nurse", learnerProfile: { riasec: {} } });
    // no AI_ASSERT_SECRET — should 500
    const noSecretCtx = { ...ctx, env: {} };
    const res = await generateStrengthsGrowthPlanHandler(noSecretCtx, {
      supabase: fakeSupabase(),
    } as any);
    expect(res.status).toBe(500);
  });
});
