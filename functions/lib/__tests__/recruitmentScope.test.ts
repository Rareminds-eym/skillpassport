// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { scopedRecruitmentQuery, recruitmentScope } from "../recruitment-scope";
import { assertInterviewAccess } from "../org-ownership";
const mocks = vi.hoisted(() => ({ access: vi.fn() }));
vi.mock("../permissions", () => ({ verifyOrgAccess: mocks.access }));
const scope = {
  orgId: "org-a",
  memberIds: ["member-a"],
  opportunityIds: ["job-a"],
  candidateIds: ["candidate-a"],
  shortlistIds: ["list-a"],
  recruiterIds: ["recruiter-a"],
};
function database(data: any = []) {
  const chain: any = {};
  for (const key of ["select", "eq", "in", "limit", "maybeSingle"])
    chain[key] = vi.fn().mockReturnValue(chain);
  chain.then = (resolve: any) =>
    Promise.resolve({ data, error: null }).then(resolve);
  return { chain, db: { from: vi.fn().mockReturnValue(chain) } as any };
}
beforeEach(() => vi.clearAllMocks());
describe("Recruitment organization boundary", () => {
  it.each([
    ["pipeline_candidates", "in", "opportunity_id", ["job-a"]],
    ["applied_jobs", "in", "opportunity_id", ["job-a"]],
    ["offers", "in", "job_id", ["job-a"]],
    ["shortlists", "eq", "organization_id", "org-a"],
    ["shortlist_candidates", "in", "shortlist_id", ["list-a"]],
    ["pipeline_activities", "in", "candidate_uuid", ["candidate-a"]],
    ["interviews", "eq", "organization_id", "org-a"],
  ])("scopes %s on the server", (table, method, column, value) => {
    const { db, chain } = database();
    scopedRecruitmentQuery(db, scope, String(table));
    expect(chain[String(method)]).toHaveBeenCalledWith(column, value);
  });
  it("uses a sentinel for an empty scope rather than issuing a global read", () => {
    const { db, chain } = database();
    scopedRecruitmentQuery(db, { ...scope, opportunityIds: [] }, "offers");
    expect(chain.in).toHaveBeenCalledWith("job_id", [
      "00000000-0000-0000-0000-000000000000",
    ]);
  });
  it("refuses unsupported tables", () => {
    const { db } = database();
    expect(() => scopedRecruitmentQuery(db, scope, "users")).toThrow(
      "Unsupported",
    );
  });
  it("rejects inactive or underprivileged callers before loading records", async () => {
    const { db } = database();
    mocks.access.mockResolvedValue({ allowed: false });
    await expect(
      recruitmentScope(
        db,
        { id: "member-a", org_id: "org-a" },
        "manage_candidates",
      ),
    ).rejects.toThrow("permission");
    expect(db.from).not.toHaveBeenCalled();
  });
  it("sharing a candidate does not grant foreign interview access, including to its creator", async () => {
    const { db } = database([{ user_id: "member-a" }]);
    expect(
      await assertInterviewAccess(db, { id: "member-a" }, "org-a", {
        organization_id: "org-b",
        created_by: "member-a",
        learner_id: "shared-learner",
      }),
    ).toBe(false);
    expect(db.from).not.toHaveBeenCalled();
  });
  it("checks active membership even for an interview in the claimed organization", async () => {
    const { db } = database([]);
    expect(
      await assertInterviewAccess(db, { id: "former-member" }, "org-a", {
        organization_id: "org-a",
      }),
    ).toBe(false);
  });
  it("keeps unattributed legacy interviews private to their author", async () => {
    const { db } = database();
    expect(
      await assertInterviewAccess(db, { id: "member-a" }, "org-a", {
        created_by: "other",
        learner_id: "shared",
      }),
    ).toBe(false);
    expect(
      await assertInterviewAccess(db, { id: "member-a" }, "org-a", {
        created_by: "member-a",
      }),
    ).toBe(true);
  });
});
