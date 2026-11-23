import { z } from "zod";
import { withAuth, getContextUser } from "../../lib/auth";
import { getServiceClient } from "../../lib/supabase";
import {
  recruitmentScope,
  RecruitmentAccessError,
} from "../../lib/recruitment-scope";
import { PERMISSIONS } from "../../lib/permissions";
import {
  apiSuccess,
  apiError,
  apiDbError,
  apiMethodNotAllowed,
} from "../../lib/response";
import { sendEmail } from "../../lib/emailService";
import { requireSubscriptionAccess, readRecruiterContactPermissions } from "../../shared/lib/subscription-access";

const operation = z.object({
  action: z.enum(["assign", "reject", "email"]),
  ids: z
    .array(z.string().uuid())
    .min(1)
    .max(100)
    .transform((ids) => [...new Set(ids)]),
  assignee: z.string().uuid().optional(),
  reason: z.string().trim().min(1).max(2000).optional(),
  subject: z.string().trim().min(1).max(200).optional(),
  message: z.string().trim().min(1).max(10000).optional(),
  requestKey: z.string().uuid().optional(),
});
const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const onRequest = (context: any) =>
  context.request.method === "POST" ? handle(context) : apiMethodNotAllowed();
const handle = withAuth(async (context) => {
  const db = getServiceClient(context.env as any),
    user = getContextUser(context);
  try {
    const scope = await recruitmentScope(
      db,
      user,
      PERMISSIONS.MANAGE_CANDIDATES,
    );
    let body: any;
    try {
      body = await context.request.json();
    } catch {
      return apiError(400, "VALIDATION_ERROR", "Invalid JSON", context.request);
    }
    const access = await requireSubscriptionAccess({
      env: context.env, request: context.request, actorId: user.id,
      subject: { kind: "organization", id: scope.orgId },
      mode: body?.action === "members" ? "read" : "write",
    });
    if (access instanceof Response) return access;
    if (body.action === "members") {
      const { data, error } = await db
        .from("users")
        .select("id,firstName,lastName")
        .in("id", scope.memberIds);
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }
    const parsed = operation.safeParse(body);
    if (!parsed.success)
      return apiError(
        400,
        "VALIDATION_ERROR",
        "Select up to 100 candidates and complete the action fields",
        context.request,
      );
    const input = parsed.data;
    const { data: rows, error } = await db
      .from("pipeline_candidates")
      .select("id,learner_id,candidate_name")
      .eq("organization_id", scope.orgId)
      .in("id", input.ids);
    if (error) return apiDbError(error, context.request);
    if (rows?.length !== input.ids.length)
      return apiError(
        403,
        "FORBIDDEN",
        "One or more candidates are unavailable in this organization",
        context.request,
      );
    if (input.action !== "email") {
      const { data, error } = await db.rpc("recruitment_pipeline_operation", {
        p_org: scope.orgId,
        p_actor: user.id,
        p_ids: input.ids,
        p_action: input.action,
        p_assignee: input.assignee || null,
        p_reason: input.reason || null,
      });
      if (error) return apiDbError(error, context.request);
      if (data?.error)
        return apiError(409, "CONFLICT", data.error, context.request);
      return apiSuccess(data, context.request);
    }
    if (
      !input.subject ||
      !input.message ||
      !input.requestKey ||
      input.ids.length > 20
    )
      return apiError(
        400,
        "VALIDATION_ERROR",
        "Email requires a subject, message and request key; maximum 20 recipients",
        context.request,
      );
    if (!(context.env as any).EMAIL_SERVICE)
      return apiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Email sending is not configured. No messages were sent.",
        context.request,
      );
    // Pipeline learner references may use either learners.id or users.id.
    // Resolve the canonical projection before checking purchased contact and
    // use its current email rather than the pipeline's historical copy.
    const references = z.array(z.string().uuid()).safeParse(rows.map(row => row.learner_id));
    if (!references.success) return apiError(403, "FORBIDDEN", "Candidate contact identity is unavailable", context.request);
    const ids = [...new Set(references.data)].join(",");
    const { data: candidates, error: candidateError } = await db.from("zoho_recruiter_learners")
      .select("id,user_id,email").or(`id.in.(${ids}),user_id.in.(${ids})`);
    if (candidateError) return apiDbError(candidateError, context.request);
    const parsedCandidates = z.array(z.object({ id: z.string().uuid(), user_id: z.string().uuid(), email: z.string().email().nullable() }).strict())
      .safeParse(candidates);
    if (!parsedCandidates.success) return apiError(503, "SERVICE_UNAVAILABLE", "Candidate contact authority is unavailable", context.request);
    const contacts = new Map<string, string>();
    const permissions = await readRecruiterContactPermissions({ env: context.env, request: context.request, actorId: user.id,
      organizationId: scope.orgId, database: db }, parsedCandidates.data, "profile");
    if (permissions instanceof Response) return permissions;
    for (const row of rows) {
      const matches = parsedCandidates.data.filter(candidate => candidate.id === row.learner_id || candidate.user_id === row.learner_id);
      if (matches.length !== 1 || !matches[0].email || !permissions.get(matches[0].id)?.email) {
        return apiError(403, "FORBIDDEN", "Every selected candidate must permit recruiter email contact with a purchased unlock", context.request);
      }
      contacts.set(row.id, matches[0].email);
    }
    const results = [];
    for (const row of rows) {
      const email = contacts.get(row.id);
      if (!email) return apiError(503, "SERVICE_UNAVAILABLE", "Candidate contact confirmation is unavailable", context.request);
      const { data: claim, error: claimError } = await db
        .from("recruitment_email_submissions")
        .insert({
          organization_id: scope.orgId,
          actor_id: user.id,
          candidate_id: row.id,
          request_key: input.requestKey,
          state: "processing",
        })
        .select("id")
        .single();
      if (claimError) {
        if (claimError.code !== "23505")
          return apiDbError(claimError, context.request);
        const existing = await db
          .from("recruitment_email_submissions")
          .select("state")
          .eq("actor_id", user.id)
          .eq("candidate_id", row.id)
          .eq("request_key", input.requestKey)
          .single();
        if (existing.error) return apiDbError(existing.error, context.request);
        results.push({
          id: row.id,
          name: row.candidate_name,
          state: existing.data.state,
        });
        continue;
      }
      let state = "unknown",
        messageId: string | null = null;
      try {
        const sent = await sendEmail(
          {
            to: email,
            subject: input.subject,
            text: input.message,
            html: `<div style="white-space:pre-wrap">${escapeHtml(input.message)}</div>`,
            metadata: { type: "recruitment_candidate", submissionId: claim.id },
          },
          context.env as any,
        );
        state = "submitted";
        messageId = sent.messageId || null;
      } catch {
        /* The provider may have accepted the request before failing. Never retry automatically. */
      }
      const saved = await db
        .from("recruitment_email_submissions")
        .update({ state, provider_message_id: messageId })
        .eq("id", claim.id);
      results.push({
        id: row.id,
        name: row.candidate_name,
        state: saved.error ? "unknown" : state,
      });
    }
    return apiSuccess({ results }, context.request);
  } catch (error) {
    if (error instanceof RecruitmentAccessError)
      return apiError(403, "FORBIDDEN", error.message, context.request);
    return apiDbError(error, context.request);
  }
});
