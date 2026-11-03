import { describe, expect, it, vi } from "vitest";
import { handleReviewerCheck } from "../../../../../api/internal/lte/v1/actions/review-reviewer-check";
import type { GatewayContext } from "../../../../../api/internal/lte/v1/types";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const LEARNER = id(1);
const EDUCATOR = id(9);
const SCHOOL = id(3);
const COLLEGE = id(2);

interface Opts {
  learners?: unknown[];
  schoolEducators?: string[];
  collegeLecturers?: string[];
}
function fixture(o: Opts = {}) {
  const query = vi.fn(async (path: string) => {
    if (path.startsWith("learners?"))
      return (
        o.learners ?? [{ school_id: SCHOOL, college_id: null, program_id: null, school_class_id: id(30) }]
      );
    if (path.startsWith("school_educators?"))
      return (o.schoolEducators ?? []).map((user_id) => ({ user_id, first_name: "E", last_name: null, email: null }));
    if (path.startsWith("college_lecturers?"))
      return (o.collegeLecturers ?? []).map((user_id) => ({ user_id, first_name: "E", last_name: null, email: null }));
    throw new Error(`Unexpected query ${path}`);
  });
  return { ctx: { userId: LEARNER, db: { query } } as unknown as GatewayContext, query };
}
const check = (ctx: GatewayContext, reviewerId = EDUCATOR) => handleReviewerCheck(ctx, { reviewerId });

describe("review:reviewer-check (organization-based reviewer eligibility)", () => {
  it("accepts any active educator of the learner's school and returns the learner's class", async () => {
    const { ctx, query } = fixture({ schoolEducators: [EDUCATOR] });
    expect(await check(ctx)).toEqual({
      ok: true,
      data: { organizationId: SCHOOL, scopeId: id(30), scopeType: "school_class" },
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(`school_educators?school_id=eq.${SCHOOL}&account_status=eq.active&user_id=in.(${EDUCATOR})`),
    );
  });

  it("does not require the educator to teach that class", async () => {
    // Only the organization-wide active-educator lookup is made; no class assignments are read.
    const { ctx, query } = fixture({ schoolEducators: [EDUCATOR] });
    await check(ctx);
    expect(query.mock.calls.map(([p]) => String(p)).join("|")).not.toMatch(/assignments|program_sections/);
  });

  it("accepts an active lecturer of the learner's college", async () => {
    const { ctx } = fixture({
      learners: [{ school_id: null, college_id: COLLEGE, program_id: id(20), school_class_id: null }],
      collegeLecturers: [EDUCATOR],
    });
    expect(await check(ctx)).toEqual({
      ok: true,
      data: { organizationId: COLLEGE, scopeId: id(20), scopeType: "college_program" },
    });
  });

  it("works for a learner with no class or program (scope is null)", async () => {
    const { ctx } = fixture({
      learners: [{ school_id: null, college_id: COLLEGE, program_id: null, school_class_id: null }],
      collegeLecturers: [EDUCATOR],
    });
    expect(await check(ctx)).toEqual({
      ok: true,
      data: { organizationId: COLLEGE, scopeId: null, scopeType: null },
    });
  });

  it("is not eligible when the person is not an active educator of that organization", async () => {
    const { ctx } = fixture({ schoolEducators: [] });
    expect(await check(ctx)).toEqual({ ok: true, data: null });
  });

  it("never lets a learner review their own work", async () => {
    const { ctx, query } = fixture({ schoolEducators: [LEARNER] });
    expect(await check(ctx, LEARNER)).toEqual({ ok: true, data: null });
    expect(query).not.toHaveBeenCalled();
  });

  it("returns no scope for a learner tied to both a school and a college, but accepts either organization's educators", async () => {
    const { ctx } = fixture({
      learners: [{ school_id: SCHOOL, college_id: COLLEGE, program_id: id(20), school_class_id: id(30) }],
      collegeLecturers: [EDUCATOR],
    });
    expect(await check(ctx)).toEqual({
      ok: true,
      data: { organizationId: COLLEGE, scopeId: null, scopeType: null },
    });
  });

  it("is not eligible when the learner is unknown or ambiguous", async () => {
    expect(await check(fixture({ learners: [] }).ctx)).toEqual({ ok: true, data: null });
    expect(
      await check(fixture({ learners: [{}, {}] }).ctx),
    ).toEqual({ ok: true, data: null });
  });

  it("rejects a missing or non-UUID reviewer and unknown fields before querying", async () => {
    const { ctx, query } = fixture();
    expect(await handleReviewerCheck(ctx, {})).toMatchObject({ ok: false });
    expect(await handleReviewerCheck(ctx, { reviewerId: "nope" })).toMatchObject({ ok: false });
    expect(await handleReviewerCheck(ctx, { reviewerId: EDUCATOR, learnerId: id(5) })).toMatchObject({ ok: false });
    expect(query).not.toHaveBeenCalled();
  });
});
