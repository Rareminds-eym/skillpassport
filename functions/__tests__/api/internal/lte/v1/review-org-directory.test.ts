import { describe, expect, it, vi } from "vitest";
import { handleReviewOrgDirectory } from "../../../../../api/internal/lte/v1/actions/review-org-directory";
import type { GatewayContext } from "../../../../../api/internal/lte/v1/types";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const COLLEGE = id(2);
const SCHOOL = id(3);

function fixture(memberships: unknown[], opts: { blocked?: boolean } = {}) {
  const query = vi.fn(async (path: string): Promise<unknown[]> => {
    if (path.startsWith("organizations?"))
      return [
        { id: COLLEGE, name: "Soundarya College" },
        { id: SCHOOL, name: "Soundarya School" },
      ];
    if (path.startsWith("learners?college_id="))
      return [
        { user_id: id(10), name: "Asha Rao", email: "asha@x.test", school_id: null, college_id: COLLEGE, program_id: id(20), school_class_id: null },
        { user_id: id(11), name: null, email: "bilal@x.test", school_id: null, college_id: COLLEGE, program_id: null, school_class_id: null },
      ];
    if (path.startsWith("learners?school_id="))
      return [
        { user_id: id(12), name: "Chen Li", email: null, school_id: SCHOOL, college_id: null, program_id: null, school_class_id: id(30) },
      ];
    if (path.startsWith("programs?")) return [{ id: id(20), name: "BBA" }];
    if (path.startsWith("school_classes?")) return [{ id: id(30), name: "5A", academic_year: "2026-27" }];
    if (path.startsWith("college_lecturers?"))
      return [{ user_id: id(40), first_name: "Meera", last_name: "N", email: "meera@x.test" }];
    if (path.startsWith("school_educators?"))
      return [{ user_id: id(41), first_name: "Nikhil", last_name: null, email: "nikhil@x.test" }];
    throw new Error(`Unexpected query ${path}`);
  });
  const ctx = {
    userId: id(1),
    db: { query },
    env: {
      SSO_SERVICE: {
        getUserById: vi.fn().mockResolvedValue({ is_blocked: !!opts.blocked, is_email_verified: true }),
        getUserMemberships: vi.fn().mockResolvedValue({ memberships }),
      },
    },
  } as unknown as GatewayContext;
  return { ctx, query };
}
const both = [
  { org_id: COLLEGE, status: "active", role: "college_admin", roles: ["college_admin"] },
  { org_id: SCHOOL, status: "active", role: "school_admin", roles: ["school_admin"] },
];

describe("review:org-directory", () => {
  it("lists the learners and educators of every organization the caller administers", async () => {
    const { ctx } = fixture(both);
    const result = (await handleReviewOrgDirectory(ctx, {})) as { ok: true; data: any };
    expect(result.ok).toBe(true);
    expect(result.data.organizations).toEqual([
      { id: COLLEGE, name: "Soundarya College", orgType: "college" },
      { id: SCHOOL, name: "Soundarya School", orgType: "school" },
    ]);
    expect(result.data.learners).toEqual([
      { userId: id(10), name: "Asha Rao", email: "asha@x.test", organizationId: COLLEGE, scopeName: "BBA" },
      { userId: id(11), name: "bilal@x.test", email: "bilal@x.test", organizationId: COLLEGE, scopeName: null },
      { userId: id(12), name: "Chen Li", email: null, organizationId: SCHOOL, scopeName: "5A · 2026-27" },
    ]);
    expect(result.data.educators).toEqual([
      { userId: id(40), name: "Meera N", email: "meera@x.test", organizationId: COLLEGE },
      { userId: id(41), name: "Nikhil", email: "nikhil@x.test", organizationId: SCHOOL },
    ]);
    expect(result.data.truncated).toBe(false);
  });

  it("scopes every query to the caller's own organizations", async () => {
    const { ctx, query } = fixture([both[0]!]);
    await handleReviewOrgDirectory(ctx, {});
    const paths = query.mock.calls.map(([p]) => String(p)).join("\n");
    expect(paths).toContain(`learners?college_id=in.(${COLLEGE})`);
    expect(paths).not.toContain("learners?school_id=");
    expect(paths).not.toContain(SCHOOL);
  });

  it("ignores inactive memberships and non-administrator roles", async () => {
    const { ctx, query } = fixture([
      { org_id: COLLEGE, status: "suspended", role: "college_admin", roles: ["college_admin"] },
      { org_id: SCHOOL, status: "active", role: "educator", roles: ["educator"] },
    ]);
    expect(await handleReviewOrgDirectory(ctx, {})).toEqual({
      ok: true,
      data: { organizations: [], learners: [], educators: [], truncated: false },
    });
    expect(query).not.toHaveBeenCalled();
  });

  it("refuses a blocked or unverified account", async () => {
    const { ctx } = fixture(both, { blocked: true });
    expect(await handleReviewOrgDirectory(ctx, {})).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });

  it("rejects any caller-supplied organization or learner", async () => {
    const { ctx, query } = fixture(both);
    expect(await handleReviewOrgDirectory(ctx, { organizationId: id(99) })).toMatchObject({ ok: false });
    expect(query).not.toHaveBeenCalled();
  });

  it("flags a directory larger than the cap instead of silently dropping learners", async () => {
    const { ctx, query } = fixture([both[0]!]);
    const many = Array.from({ length: 5001 }, (_, i) => ({
      user_id: `10000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      name: `L${i}`, email: null, school_id: null, college_id: COLLEGE, program_id: null, school_class_id: null,
    }));
    const original = query.getMockImplementation()!;
    query.mockImplementation(async (path: string) => (path.startsWith("learners?college_id=") ? many : original(path)));
    const result = (await handleReviewOrgDirectory(ctx, {})) as { ok: true; data: any };
    expect(result.data.truncated).toBe(true);
    expect(result.data.learners).toHaveLength(5000);
  });

  it("de-duplicates a learner that appears in both queries", async () => {
    const { ctx, query } = fixture(both);
    const original = query.getMockImplementation()!;
    query.mockImplementation(async (path: string) =>
      path.startsWith("learners?school_id=")
        ? [{ user_id: id(10), name: "Asha Rao", email: "asha@x.test", school_id: SCHOOL, college_id: COLLEGE, program_id: null, school_class_id: null }]
        : original(path),
    );
    const result = (await handleReviewOrgDirectory(ctx, {})) as { ok: true; data: any };
    expect(result.data.learners.filter((l: any) => l.userId === id(10))).toHaveLength(1);
  });
});
