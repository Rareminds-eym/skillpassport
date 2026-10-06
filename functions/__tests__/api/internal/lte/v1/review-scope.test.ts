import { describe, expect, it, vi } from "vitest";
import { handleReviewScope } from "../../../../../api/internal/lte/v1/actions/review-scope";
import type { GatewayContext } from "../../../../../api/internal/lte/v1/types";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function fixture(
  kind: "school" | "college",
  opts: { designated?: string[]; activeEducators?: string[]; teaching?: boolean } = {},
) {
  const learner = {
    user_id: id(1),
    program_id: kind === "college" ? id(2) : null,
    program_section_id: null,
    college_class_id: kind === "college" ? id(3) : null,
    college_id: kind === "college" ? id(4) : null,
    school_class_id: kind === "school" ? id(5) : null,
    school_id: kind === "school" ? id(6) : null,
  };
  const query = vi.fn(async (path: string) => {
    if (path.startsWith("learners?")) return [learner];
    if (path.startsWith("lte_review_scope_reviewers?"))
      return (opts.designated ?? []).map((reviewer_user_id) => ({ reviewer_user_id }));
    if (path.startsWith("school_educator_class_assignments?"))
      return opts.teaching === false ? [] : [{ educator_id: id(7) }];
    // Designation re-validation (narrowed by user_id) vs. the teaching lookup (by row id).
    if (path.startsWith("school_educators?") && path.includes("user_id=in.("))
      return (opts.activeEducators ?? []).map((user_id) => ({
        user_id,
        first_name: "Ed",
        last_name: user_id.slice(-2),
        email: null,
      }));
    if (path.startsWith("college_lecturers?") && path.includes("user_id=in.(") && !path.includes("or=("))
      return (opts.activeEducators ?? []).map((user_id) => ({
        user_id,
        first_name: "Ed",
        last_name: user_id.slice(-2),
        email: null,
      }));
    if (path.startsWith("school_educators?"))
      return [{ id: id(7), user_id: id(8) }];
    if (path.startsWith("program_sections?")) return [{ faculty_id: id(8) }];
    if (path.startsWith("college_faculty_class_assignments?"))
      return [{ faculty_id: id(9) }];
    if (path.startsWith("college_lecturers?"))
      return [{ id: id(9), user_id: id(8) }];
    throw new Error(`Unexpected query ${path}`);
  });
  const queryOne = vi.fn(async (path: string): Promise<Record<string, unknown> | null> => {
    if (path.startsWith("school_classes?"))
      return { id: id(5), academic_year: "2026-27" };
    if (path.startsWith("programs?"))
      return { id: id(2), department_id: id(10) };
    if (path.startsWith("departments?")) return { id: id(10) };
    if (path.startsWith("lte_review_scope_settings?"))
      return {
        sla_days: 3,
        time_zone: "Asia/Kolkata",
        load_cap: 10,
        confidence_threshold: 75,
      };
    throw new Error(`Unexpected query ${path}`);
  });
  const ctx = {
    userId: id(1),
    db: { query, queryOne },
    env: {},
    request: new Request("https://example.test"),
    requestId: "test",
  } as unknown as GatewayContext;
  return { ctx, query, queryOne, learner };
}
describe("review eligibility across school and college", () => {
  it("resolves school educator row IDs to SSO subjects in the current class and year", async () => {
    const { ctx, query } = fixture("school");
    expect(await handleReviewScope(ctx, {})).toMatchObject({
      ok: true,
      data: {
        scopeId: id(5),
        scopeType: "school_class",
        organizationId: id(6),
        reviewerIds: [id(8)],
        threshold: 75,
      },
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        `school_educators?id=in.(${id(7)})&school_id=eq.${id(6)}&account_status=eq.active`,
      ),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("academic_year=eq.2026-27"),
    );
  });
  it("distinguishes program-section SSO IDs from college lecturer row IDs", async () => {
    const { ctx, query, queryOne } = fixture("college");
    expect(await handleReviewScope(ctx, {})).toMatchObject({
      ok: true,
      data: {
        scopeId: id(2),
        scopeType: "college_program",
        reviewerIds: [id(8)],
      },
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(`or=(user_id.in.(${id(8)}),id.in.(${id(9)}))`),
    );
    expect(queryOne).toHaveBeenCalledWith(
      expect.stringContaining(
        `departments?id=eq.${id(10)}&college_id=eq.${id(4)}`,
      ),
    );
  });
  describe("administrator-designated reviewers", () => {
    it("makes a class with no teaching educators reviewable by a designated active educator", async () => {
      const { ctx } = fixture("school", {
        teaching: false,
        designated: [id(20)],
        activeEducators: [id(20)],
      });
      // No teaching assignment resolves no educator rows, so only the designee remains.
      const result = (await handleReviewScope(ctx, {})) as { data: { reviewerIds: string[] } };
      expect(result.data.reviewerIds).toEqual([id(20)]);
    });
    it("adds designees to the teaching educators without duplicating", async () => {
      const { ctx } = fixture("school", {
        designated: [id(8), id(20)],
        activeEducators: [id(8), id(20)],
      });
      const result = (await handleReviewScope(ctx, {})) as { data: { reviewerIds: string[] } };
      expect(result.data.reviewerIds.sort()).toEqual([id(8), id(20)].sort());
    });
    it("ignores a designee who is no longer an active educator of the organization", async () => {
      const { ctx } = fixture("school", {
        teaching: false,
        designated: [id(20)],
        activeEducators: [],
      });
      const result = (await handleReviewScope(ctx, {})) as { data: { reviewerIds: string[] } };
      expect(result.data.reviewerIds).toEqual([]);
    });
    it("re-validates designees against the learner's own organization", async () => {
      const { ctx, query } = fixture("school", {
        designated: [id(20)],
        activeEducators: [id(20)],
      });
      await handleReviewScope(ctx, {});
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`school_educators\\?school_id=eq\\.${id(6)}&account_status=eq\\.active&user_id=in\\.\\(${id(20)}\\)`),
        ),
      );
    });
    it("works for college programs and never lists the learner as their own reviewer", async () => {
      const { ctx } = fixture("college", {
        designated: [id(1), id(21)],
        activeEducators: [id(1), id(21)],
      });
      const result = (await handleReviewScope(ctx, {})) as { data: { reviewerIds: string[] } };
      expect(result.data.reviewerIds).toContain(id(21));
      expect(result.data.reviewerIds).not.toContain(id(1));
    });
  });
  it("uses defaults when the scope has no settings row", async () => {
    const { ctx, queryOne } = fixture("school");
    const original = queryOne.getMockImplementation()!;
    queryOne.mockImplementation(async (path) =>
      path.startsWith("lte_review_scope_settings?") ? null : original(path),
    );
    expect(await handleReviewScope(ctx, {})).toMatchObject({
      ok: true,
      data: { slaDays: 3, loadCap: 10, threshold: 60 },
    });
  });
  it("does not return or depend on an evaluation mode: that is organization-wide (review:policy)", async () => {
    const { ctx } = fixture("school");
    const result = (await handleReviewScope(ctx, {})) as { data: Record<string, unknown> };
    expect(result.data).not.toHaveProperty("evaluationMode");
  });
  it("does not guess between school and college enrolments", async () => {
    const { ctx, learner, queryOne } = fixture("school");
    learner.program_id = id(2);
    expect(await handleReviewScope(ctx, {})).toEqual({ ok: true, data: null });
    expect(queryOne).not.toHaveBeenCalled();
  });
  it("rejects caller-selected learners and scopes before querying", async () => {
    const { ctx, query } = fixture("school");
    expect(await handleReviewScope(ctx, { learnerId: id(99) })).toMatchObject({
      ok: false,
    });
    expect(query).not.toHaveBeenCalled();
  });
  it("fails closed when a college program belongs to another institution", async () => {
    const { ctx, queryOne } = fixture("college");
    queryOne.mockImplementation(async (path) =>
      path.startsWith("programs?")
        ? { id: id(2), department_id: id(10) }
        : null,
    );
    expect(await handleReviewScope(ctx, {})).toEqual({ ok: true, data: null });
  });
});
