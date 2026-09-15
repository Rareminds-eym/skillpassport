import { describe, expect, it } from "vitest";
import { handleGenerateProgramCareerPaths } from "../handlers/program-career-paths.js";

function post(body: unknown): Request {
  return new Request("https://pages.local/api/analyze-assessment/generate-program-career-paths", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const workerPaths = [
  { role: "Data Analyst", salary: { min: 60000, max: 90000 }, matchScore: 80, whyItFits: "fits", requiredSkills: ["SQL"], growthPotential: "good" },
  { role: "Nurse", salary: { min: 50000, max: 70000 } },
];

describe("program-paths via worker", () => {
  it("returns worker paths via apiSuccess envelope", async () => {
    let seen: unknown;
    const res = await handleGenerateProgramCareerPaths(
      post({ programName: "BSc Nursing", programCategory: "Healthcare", learnerProfile: { riasecScores: { R: 80, I: 70, A: 60, S: 50, E: 40, C: 30 } } }),
      { AI_ASSERT_SECRET: "test-secret-min-32-chars-0000000000", AI_SERVICE: {} } as never,
      "user-1",
      {
        callWorker: async (args: unknown) => {
          seen = args;
          return { ok: true as const, careerPaths: workerPaths };
        },
      } as never,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { careerPaths: typeof workerPaths } };
    expect(body.success).toBe(true);
    expect(body.data.careerPaths).toEqual(workerPaths);
    const sent = seen as { programName: string; programCategory: string; learnerProfile: unknown };
    expect(sent.programName).toBe("BSc Nursing");
    expect(sent.programCategory).toBe("Healthcare");
  });

  it("rejects bad input without spending", async () => {
    let calls = 0;
    const stub = {
      callWorker: async () => {
        calls += 1;
        return { ok: true as const, careerPaths: workerPaths };
      },
    } as never;
    for (const body of [
      { programName: "", programCategory: "Healthcare", learnerProfile: { riasecScores: { R: 1, I: 1, A: 1, S: 1, E: 1, C: 1 } } },
      { programName: "X", learnerProfile: { riasecScores: { R: 1, I: 1, A: 1, S: 1, E: 1, C: 1 } } },
      { programName: "X", programCategory: "Y" },
      {},
    ]) {
      const res = await handleGenerateProgramCareerPaths(post(body), { AI_ASSERT_SECRET: "s", AI_SERVICE: {} } as never, "user-1", stub);
      expect(res.status).toBe(400);
    }
    expect(calls).toBe(0);
  });

  it("maps worker denials", async () => {
    const res = await handleGenerateProgramCareerPaths(
      post({ programName: "X", programCategory: "Y", learnerProfile: { riasecScores: { R: 1, I: 1, A: 1, S: 1, E: 1, C: 1 } } }),
      { AI_ASSERT_SECRET: "s", AI_SERVICE: {} } as never,
      "user-1",
      {
        callWorker: async () => ({ ok: false as const, code: "FEATURE_ACCESS_DENIED", message: "nope" }),
      } as never,
    );
    expect(res.status).toBe(403);
  });

  it("maps missing binding to 503", async () => {
    const res = await handleGenerateProgramCareerPaths(
      post({ programName: "X", programCategory: "Y", learnerProfile: { riasecScores: { R: 1, I: 1, A: 1, S: 1, E: 1, C: 1 } } }),
      { AI_ASSERT_SECRET: "s" } as never,
      "user-1",
    );
    // no AI_SERVICE binding — error path via callProgramPathsWorker throws binding error -> 503
    expect(res.status).toBe(503);
  });
});
