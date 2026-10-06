import { z } from "zod";
import { deliverReviewEmail } from "./review-email";
import type { GatewayAction } from "../types";
import { getServiceClient } from "../../../../../lib/supabase";
import { notifyRealtime } from "../../../../../lib/realtime";

const envelopeSchema = z
  .object({
    type: z.enum([
      "lte.review_assigned",
      "lte.review_completed",
      "lte.artifact_reviewed_pass",
      "lte.review_due_soon",
      "lte.review_overdue",
    ]),
    event: z
      .object({
        schemaVersion: z.literal(1),
        eventId: z.string().uuid(),
        occurredAt: z.string().datetime({ offset: true }),
        reviewId: z.string().uuid(),
        submissionId: z.string().uuid(),
        assignmentVersion: z.number().int().positive(),
        learnerId: z.string().uuid(),
        reviewerId: z.string().uuid(),
        scopeId: z.string().uuid().nullable(),
        scopeType: z.enum(["college_program", "school_class"]).nullable(),
        dueBy: z.string().datetime({ offset: true }).optional(),
        decision: z.enum(["pass", "revise_and_resubmit"]).optional(),
        score: z.number().int().min(0).max(100).optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if ((value.event.scopeId === null) !== (value.event.scopeType === null))
      ctx.addIssue({ code: "custom", message: "Scope ID and type must both be present or null" });
    if (
      [
        "lte.review_assigned",
        "lte.review_due_soon",
        "lte.review_overdue",
      ].includes(value.type) &&
      !value.event.dueBy
    )
      ctx.addIssue({ code: "custom", message: "Assignment deadline required" });
    if (value.type === "lte.review_completed" && !value.event.decision)
      ctx.addIssue({ code: "custom", message: "Decision required" });
    if (
      value.type === "lte.artifact_reviewed_pass" &&
      (value.event.decision !== "pass" || value.event.score === undefined)
    )
      ctx.addIssue({ code: "custom", message: "Passing evidence required" });
  });
export const handleReviewEvent: GatewayAction = async (ctx, payload) => {
  const parsed = envelopeSchema.safeParse(payload);
  if (!parsed.success || parsed.data.event.learnerId !== ctx.userId)
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid review event or signed subject",
      },
    };
  const { data, error } = await getServiceClient(ctx.env).rpc(
    "apply_lte_review_event",
    {
      p_actor: ctx.userId,
      p_type: parsed.data.type,
      p_payload: parsed.data.event,
    },
  );
  if (error) throw new Error(`Review event persistence failed: ${error.code}`);
  if (data?.notification)
    await notifyRealtime(ctx.env, "notifications", "INSERT", data.notification);
  await deliverReviewEmail(ctx.env, parsed.data.event.eventId);
  return { ok: true, data };
};
