import { describe, expect, it } from "vitest";
import { handleRoleOverviewRpc } from "../handlers/role-overview.js";

function post(body: unknown): Request {
  return new Request("https://pages.local/api/role-overview/role-overview", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const workerData = {
  responsibilities: ["A", "B", "C", "D"],
  demandDescription: "Hot demand.",
  demandLevel: "High",
  demandPercentage: 88,
  careerProgression: [],
  learningRoadmap: [],
  recommendedCourses: [],
  freeResources: [],
  actionItems: [],
  suggestedProjects: [],
};

describe("role overview via worker", () => {
  it("adapts worker output to the live inline shape", async () => {
    let seen: unknown;
    const res = await handleRoleOverviewRpc(
      post({ roleName: "Nurse", clusterTitle: "Healthcare" }),
      {} as never,
      "user-1",
      {
        callWorker: async (args: unknown) => {
          seen = args;
          return { ok: true as const, data: workerData };
        },
      } as never,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: {
        data: {
          responsibilities: string[];
          industryDemand: { description: string; demandLevel: string; demandPercentage: number };
        };
        source: string;
      };
    };
    expect(body.data.data.responsibilities).toEqual(["A", "B", "C"]);
    expect(body.data.data.industryDemand).toEqual({
      description: "Hot demand.",
      demandLevel: "High",
      demandPercentage: 88,
    });
    expect(body.data.source).toBe("openrouter");
    const sent = seen as { roleName: string; clusterTitle: string; fallback: { responsibilities: string[] } };
    expect(sent.roleName).toBe("Nurse");
    expect(sent.clusterTitle).toBe("Healthcare");
    expect(sent.fallback.responsibilities.length).toBeGreaterThan(0);
  });

  it("rejects bad bodies without spending", async () => {
    let calls = 0;
    const stub = {
      callWorker: async () => {
        calls += 1;
        return { ok: true as const, data: workerData };
      },
    } as never;
    for (const body of [{ roleName: "", clusterTitle: "x" }, { roleName: "x" }, {}]) {
      const res = await handleRoleOverviewRpc(post(body), {} as never, "user-1", stub);
      expect(res.status).toBe(400);
    }
    expect(calls).toBe(0);
  });

  it("maps worker failure to the legacy 500 contract", async () => {
    const res = await handleRoleOverviewRpc(
      post({ roleName: "Nurse", clusterTitle: "Healthcare" }),
      {} as never,
      "user-1",
      {
        callWorker: async () => ({ ok: false as const, code: "INVALID_MODEL_OUTPUT", message: "bad" }),
      } as never,
    );
    expect(res.status).toBe(500);
    const body = (await res.text());
    expect(body).toContain("Failed to generate role overview");
  });

  it("maps missing wiring to 500 without calling the worker", async () => {
    let calls = 0;
    const res = await handleRoleOverviewRpc(
      post({ roleName: "Nurse", clusterTitle: "Healthcare" }),
      {} as never,
      "user-1",
      {
        callWorker: async () => {
          calls += 1;
          return { ok: true as const, data: workerData };
        },
      } as never,
    );
    expect(res.status).toBe(200);
    expect(calls).toBe(1);
    const noSecret = await handleRoleOverviewRpc(
      post({ roleName: "Nurse", clusterTitle: "Healthcare" }),
      { AI_ASSERT_SECRET: "" } as never,
      "user-1",
    );
    expect(noSecret.status).toBe(500);
  });
});
