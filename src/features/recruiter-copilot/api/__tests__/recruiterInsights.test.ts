import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiPost } from "@/shared/api/apiClient";
import { recruiterInsights } from "../recruiterInsights";
vi.mock("@/shared/api/apiClient", () => ({ apiPost: vi.fn() }));
vi.mock("@/shared/config/logging", () => ({
  getLogger: () => ({ error: vi.fn() }),
}));
const applicant = {
  id: 1,
  learner_id: "learner-a",
  opportunity_id: 2,
  learner: { id: "learner-a", name: "Candidate", email: "", cgpa: "8" },
  opportunity: {
    id: 2,
    job_title: "Software engineer",
    skills_required: ["TypeScript"],
  },
};
beforeEach(() => vi.clearAllMocks());
describe("Recruiter insights API response contract", () => {
  it("analyzes real API envelopes containing arrays and counts", async () => {
    vi.mocked(apiPost).mockImplementation(async (_path, body: any) => ({
      success: true,
      data:
        body.action === "fetch-skills"
          ? [{ name: "TypeScript" }]
          : body.action === "count-trainings"
            ? 2
            : [
                {
                  title: "TypeScript Developer",
                  issuer: "Test",
                  level: "advanced",
                },
              ],
      error: null,
      meta: {},
    }));
    const result = await recruiterInsights.analyzeApplicantsForRecommendation([
      applicant,
    ]);
    expect(result.summary.totalAnalyzed).toBe(1);
    expect(result.topRecommendations[0]).toMatchObject({
      applicantId: 1,
      matchedSkills: ["TypeScript"],
      missingSkills: [],
    });
    expect(result.topRecommendations[0].reasons).toContain(
      "2 training programs completed",
    );
    expect(result.topRecommendations[0].reasons).toContain(
      "Relevant certifications: TypeScript Developer",
    );
    expect(Number.isFinite(result.topRecommendations[0].matchScore)).toBe(true);
  });
  it("handles empty certificate data without dropping an otherwise valid candidate", async () => {
    vi.mocked(apiPost).mockImplementation(async (_path, body: any) => ({
      success: true,
      data:
        body.action === "fetch-skills"
          ? [{ name: "TypeScript" }]
          : body.action === "count-trainings"
            ? 0
            : [],
      error: null,
    }));
    expect(
      (await recruiterInsights.analyzeApplicantsForRecommendation([applicant]))
        .summary.totalAnalyzed,
    ).toBe(1);
  });
});
