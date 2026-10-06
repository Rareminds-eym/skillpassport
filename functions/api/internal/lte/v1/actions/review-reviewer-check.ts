import { z } from "zod";
import { listOrgEducators } from "../review-educators";
import type { GatewayAction } from "../types";

/**
 * May this educator review THIS learner's work? Signed as the learner (like
 * review:scope). An educator is eligible when they are an ACTIVE educator or
 * lecturer of the learner's own organisation. The class or program is not
 * required: an administrator assigns educators from the whole organisation, and
 * the learner may not have a class/program yet.
 *
 * The learner's current class/program (when unambiguous) is returned so the
 * caller can revoke access if the learner moved after the assignment.
 */
const payloadSchema = z.object({ reviewerId: z.string().uuid() }).strict();

interface Learner {
  school_id: string | null;
  college_id: string | null;
  program_id: string | null;
  school_class_id: string | null;
}

export const handleReviewerCheck: GatewayAction = async (ctx, payload) => {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success)
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "A reviewer is required." } };
  // Nobody reviews their own work.
  if (parsed.data.reviewerId === ctx.userId) return { ok: true, data: null };
  const learners = await ctx.db.query<Learner>(
    `learners?user_id=eq.${ctx.userId}&is_deleted=is.false&select=school_id,college_id,program_id,school_class_id&limit=2`,
  );
  if (learners.length !== 1) return { ok: true, data: null };
  const learner = learners[0]!;
  // A learner tied to both a school and a college is ambiguous: no scope, and
  // eligibility in either of their organisations.
  const candidates = [
    learner.school_id ? ({ type: "school_class", organizationId: learner.school_id } as const) : null,
    learner.college_id ? ({ type: "college_program", organizationId: learner.college_id } as const) : null,
  ].filter((c): c is NonNullable<typeof c> => !!c);
  for (const candidate of candidates) {
    const match = await listOrgEducators(ctx.db, candidate.type, candidate.organizationId, [
      parsed.data.reviewerId,
    ]);
    if (match.length) {
      const unambiguous = candidates.length === 1 && !(learner.program_id && learner.school_class_id);
      const isSchool = candidate.type === "school_class";
      return {
        ok: true,
        data: {
          organizationId: candidate.organizationId,
          scopeId: unambiguous ? ((isSchool ? learner.school_class_id : learner.program_id) ?? null) : null,
          scopeType: unambiguous
            ? (isSchool ? (learner.school_class_id ? "school_class" : null) : learner.program_id ? "college_program" : null)
            : null,
        },
      };
    }
  }
  return { ok: true, data: null };
};
