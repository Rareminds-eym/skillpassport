import { z } from "zod";
import type { GatewayAction } from "../types";

/**
 * How LTE must evaluate THIS learner's artifacts, decided only by the learner's
 * organisation (school or college): never by course, class or program, so it
 * holds even when the learner's class/program cannot be resolved.
 *
 * Conservative on ambiguity: a learner tied to several organisations, or to a
 * school and a college, is human-only if ANY of them chose human-only. No
 * learner row / no organisation / no setting means ai_first.
 */
interface LearnerOrgs {
  school_id: string | null;
  college_id: string | null;
}

export const handleReviewPolicy: GatewayAction = async (ctx, payload) => {
  if (!z.object({}).strict().safeParse(payload).success)
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Review policy is resolved from the signed subject.",
      },
    };
  const learners = await ctx.db.query<LearnerOrgs>(
    `learners?user_id=eq.${ctx.userId}&is_deleted=is.false&select=school_id,college_id&limit=5`,
  );
  const organizationIds = [
    ...new Set(
      learners.flatMap((row) => [row.school_id, row.college_id]).filter((id): id is string => !!id),
    ),
  ];
  if (!organizationIds.length)
    return { ok: true, data: { evaluationMode: "ai_first", organizationIds: [] } };
  const settings = await ctx.db.query<{ evaluation_mode: "ai_first" | "human_only" }>(
    `lte_review_org_settings?organization_id=in.(${organizationIds.join(",")})&select=evaluation_mode`,
  );
  return {
    ok: true,
    data: {
      evaluationMode: settings.some((row) => row.evaluation_mode === "human_only")
        ? "human_only"
        : "ai_first",
      organizationIds,
    },
  };
};
