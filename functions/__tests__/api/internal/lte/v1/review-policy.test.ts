import { describe, expect, it, vi } from "vitest";
import { handleReviewPolicy } from "../../../../../api/internal/lte/v1/actions/review-policy";
import type { GatewayContext } from "../../../../../api/internal/lte/v1/types";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function fixture(
  learners: Array<{ school_id: string | null; college_id: string | null }>,
  settings: Array<{ organization_id?: string; evaluation_mode: "ai_first" | "human_only" }> = [],
) {
  const query = vi.fn(async (path: string) => {
    if (path.startsWith("learners?")) return learners;
    if (path.startsWith("lte_review_org_settings?")) return settings;
    throw new Error(`Unexpected query ${path}`);
  });
  const ctx = { userId: id(1), db: { query } } as unknown as GatewayContext;
  return { ctx, query };
}

describe("review:policy (organization-wide, independent of course/class/program)", () => {
  it("is human-only when the learner's school chose it, with no class or program involved", async () => {
    const { ctx, query } = fixture([{ school_id: id(6), college_id: null }], [
      { organization_id: id(6), evaluation_mode: "human_only" },
    ]);
    expect(await handleReviewPolicy(ctx, {})).toEqual({
      ok: true,
      data: { evaluationMode: "human_only", organizationIds: [id(6)] },
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining(`organization_id=in.(${id(6)})`));
    // Nothing about classes, programs or courses is consulted.
    expect(query.mock.calls.map(([p]) => String(p)).join("|")).not.toMatch(/class|program|course/);
  });

  it("works for a college learner the same way", async () => {
    const { ctx } = fixture([{ school_id: null, college_id: id(4) }], [{ organization_id: id(4), evaluation_mode: "human_only" }]);
    expect(await handleReviewPolicy(ctx, {})).toMatchObject({
      ok: true,
      data: { evaluationMode: "human_only" },
    });
  });

  it("is human review by default: an organization that has not chosen is human-only", async () => {
    const { ctx } = fixture([{ school_id: id(6), college_id: null }], []);
    expect(await handleReviewPolicy(ctx, {})).toMatchObject({
      ok: true,
      data: { evaluationMode: "human_only", organizationIds: [id(6)] },
    });
  });

  it("is AI-first only when the administrator explicitly chose it", async () => {
    const { ctx } = fixture([{ school_id: id(6), college_id: null }], [
      { organization_id: id(6), evaluation_mode: "ai_first" },
    ]);
    expect(await handleReviewPolicy(ctx, {})).toMatchObject({ data: { evaluationMode: "ai_first" } });
  });

  it("a college with a saved human-only choice is still human-only", async () => {
    const { ctx } = fixture([{ school_id: null, college_id: id(4) }], [
      { organization_id: id(4), evaluation_mode: "human_only" },
    ]);
    expect(await handleReviewPolicy(ctx, {})).toMatchObject({ data: { evaluationMode: "human_only" } });
  });

  it("stays AI-first for a learner with no school or college, because nobody could review their work", async () => {
    const { ctx, query } = fixture([{ school_id: null, college_id: null }]);
    expect(await handleReviewPolicy(ctx, {})).toEqual({
      ok: true,
      data: { evaluationMode: "ai_first", organizationIds: [] },
    });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("is human-only if ANY of the learner's organizations is human-only, explicit or by default (conservative)", async () => {
    const both = [
      { school_id: id(6), college_id: null },
      { school_id: null, college_id: id(4) },
    ];
    // school explicitly AI-first, college has not chosen (default human) -> human-only
    expect(
      await handleReviewPolicy(fixture(both, [{ organization_id: id(6), evaluation_mode: "ai_first" }]).ctx, {}),
    ).toMatchObject({ data: { evaluationMode: "human_only" } });
    // both explicitly AI-first -> AI
    expect(
      await handleReviewPolicy(
        fixture(both, [
          { organization_id: id(6), evaluation_mode: "ai_first" },
          { organization_id: id(4), evaluation_mode: "ai_first" },
        ]).ctx,
        {},
      ),
    ).toMatchObject({ data: { evaluationMode: "ai_first" } });
  });

  it("rejects caller-selected learners or organizations before querying", async () => {
    const { ctx, query } = fixture([]);
    expect(await handleReviewPolicy(ctx, { organizationId: id(9) })).toMatchObject({ ok: false });
    expect(query).not.toHaveBeenCalled();
  });
});
