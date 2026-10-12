import { z } from "zod";
import type { PagesEnv } from "../../../../../lib/types";
import { getServiceClient } from "../../../../../lib/supabase";

const deliverySchema = z.object({
  status: z.literal("sending"),
  eventId: z.string().uuid(),
  recipientId: z.string().uuid(),
  type: z.string(),
  decision: z.string().nullable(),
});

/** A provider timeout is ambiguous: retain it for reconciliation, never resend blindly. */
export async function deliverReviewEmail(env: PagesEnv, eventId: string) {
  const db = getServiceClient(env);
  const claimed = await db.rpc("claim_lte_review_email", {
    p_event_id: eventId,
  });
  if (claimed.error)
    throw new Error(`Review email claim failed: ${claimed.error.code}`);
  if (!claimed.data) return;
  if (claimed.data.status === "uncertain")
    throw new Error("Review email delivery requires provider reconciliation");
  const delivery = deliverySchema.parse(claimed.data);
  const finish = async (
    status: "pending" | "sent" | "uncertain" | "skipped",
    messageId?: string,
  ) => {
    const result = await db
      .from("lte_review_email_deliveries")
      .update({
        status,
        completed_at: ["sent", "skipped"].includes(status)
          ? new Date().toISOString()
          : null,
        provider_message_id: messageId ?? null,
      })
      .eq("event_id", eventId)
      .eq("status", "sending");
    if (result.error)
      throw new Error(
        `Review email acknowledgement failed: ${result.error.code}`,
      );
  };
  let email: string;
  try {
    if (!env.EMAIL_SERVICE || !env.SSO_SERVICE)
      throw new Error("Review email bindings unavailable");
    const recipient = await env.SSO_SERVICE.getUserById(delivery.recipientId);
    if (!recipient || recipient.is_blocked || !recipient.is_email_verified) {
      await finish("skipped");
      return;
    }
    email = recipient.email;
  } catch (error) {
    await finish("pending");
    throw error;
  }
  const completed = delivery.type === "lte.review_completed";
  const subject = completed
    ? delivery.decision === "pass"
      ? "Your artifact passed staff review"
      : "Revision requested for your artifact"
    : delivery.type === "lte.review_due_soon"
      ? "Your artifact review is due soon"
      : delivery.type === "lte.review_overdue"
        ? "Your artifact review is overdue"
        : "An artifact is ready for your review";
  const text = completed
    ? "Open LTE and view the artifact feedback for your review and next steps."
    : "Open SkillPassport and go to your educator artifact review queue to read the evidence and rubric.";
  try {
    const result = await env.EMAIL_SERVICE!.sendEmail({
      to: email,
      subject,
      text,
      html: `<p>${text}</p>`,
    });
    if (!result.success)
      throw new Error("Review email provider did not confirm delivery");
    await finish(
      "sent",
      typeof result.messageId === "string" ? result.messageId : undefined,
    );
  } catch (error) {
    await finish("uncertain");
    throw error;
  }
}
