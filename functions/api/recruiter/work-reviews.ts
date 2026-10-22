import { z } from "zod";
import { withAuth, getContextUser } from "../../lib/auth";
import { getServiceClient } from "../../lib/supabase";
import {
  recruitmentScope,
  RecruitmentAccessError,
  EMPTY_UUID,
} from "../../lib/recruitment-scope";
import { PERMISSIONS, getUserRecruitmentRoles } from "../../lib/permissions";
import {
  apiSuccess,
  apiError,
  apiDbError,
  apiMethodNotAllowed,
} from "../../lib/response";
export const onRequest = (context: any) =>
  context.request.method === "POST" ? handle(context) : apiMethodNotAllowed();
const handle = withAuth(async (context) => {
  const user = getContextUser(context),
    db = getServiceClient(context.env as any);
  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Invalid JSON body",
      context.request,
    );
  }
  try {
    const scope = await recruitmentScope(
      db,
      user,
      body.action === "review"
        ? PERMISSIONS.MANAGE_CANDIDATES
        : PERMISSIONS.VIEW_CANDIDATES,
    );
    const [applications, candidates] = await Promise.all([
      db
        .from("applied_jobs")
        .select("learner_id")
        .in(
          "opportunity_id",
          scope.opportunityIds.length ? scope.opportunityIds : [EMPTY_UUID],
        ),
      db
        .from("pipeline_candidates")
        .select("learner_id")
        .in(
          "opportunity_id",
          scope.opportunityIds.length ? scope.opportunityIds : [EMPTY_UUID],
        ),
    ]);
    if (applications.error) throw applications.error;
    if (candidates.error) throw candidates.error;
    const learnerIds = [
      ...new Set(
        [...(applications.data || []), ...(candidates.data || [])].map(
          (r) => r.learner_id,
        ),
      ),
    ];
    const { data: learners, error: learnerError } = await db
      .from("learners")
      .select("id,user_id,name")
      .in("id", learnerIds.length ? learnerIds : [EMPTY_UUID]);
    if (learnerError) throw learnerError;
    const aliases = (learners || [])
      .flatMap((l) => [l.id, l.user_id])
      .filter(Boolean);
    const { data: projects, error: projectError } = await db
      .from("projects")
      .select(
        "id,learner_id,title,description,demo_link,github_link,created_at,updated_at",
      )
      .in("learner_id", aliases.length ? aliases : [EMPTY_UUID])
      .eq("enabled", true)
      .order("created_at", { ascending: false });
    if (projectError) throw projectError;
    if (body.action === "list") {
      const { data: reviews, error } = await db
        .from("recruitment_work_reviews")
        .select("*")
        .eq("organization_id", scope.orgId);
      if (error) throw error;
      const roles = (
        await getUserRecruitmentRoles(db, user.id, scope.orgId)
      )[0];
      return apiSuccess(
        {
          canReview: !!roles?.can_manage_candidates,
          work: (projects || []).map((p) => ({
            ...p,
            learnerName:
              learners?.find(
                (l) => l.id === p.learner_id || l.user_id === p.learner_id,
              )?.name || "Candidate",
            review: reviews?.find((r) => r.project_id === p.id) || null,
          })),
        },
        context.request,
      );
    }
    if (body.action === "review") {
      const parsed = z
        .object({
          projectId: z.string().uuid(),
          status: z.enum(["pending", "verified", "rejected"]),
          note: z
            .string()
            .trim()
            .min(1, "Add a reason for this review")
            .max(2000),
          expectedUpdatedAt: z.string().nullable(),
        })
        .safeParse(body);
      if (!parsed.success)
        return apiError(
          400,
          "VALIDATION_ERROR",
          parsed.error.issues.map((x) => x.message).join("; "),
          context.request,
        );
      if (!projects?.some((p) => p.id === parsed.data.projectId))
        return apiError(
          404,
          "NOT_FOUND",
          "Work not found in this organization’s candidate pool",
          context.request,
        );
      const { data: existing, error: lookup } = await db
        .from("recruitment_work_reviews")
        .select("id,updated_at")
        .eq("organization_id", scope.orgId)
        .eq("project_id", parsed.data.projectId)
        .maybeSingle();
      if (lookup) throw lookup;
      if ((existing?.updated_at || null) !== parsed.data.expectedUpdatedAt)
        return apiError(
          409,
          "REVIEW_CHANGED",
          "This review changed; refresh and retry",
          context.request,
        );
      const values = {
        status: parsed.data.status,
        note: parsed.data.note,
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      };
      const q = existing
        ? db
            .from("recruitment_work_reviews")
            .update(values)
            .eq("id", existing.id)
            .eq("updated_at", existing.updated_at)
        : db
            .from("recruitment_work_reviews")
            .insert({
              ...values,
              organization_id: scope.orgId,
              project_id: parsed.data.projectId,
            });
      const { data, error } = await q.select().maybeSingle();
      if (error?.code === "23505")
        return apiError(
          409,
          "REVIEW_CHANGED",
          "This review changed; refresh and retry",
          context.request,
        );
      if (error) throw error;
      if (!data)
        return apiError(
          409,
          "REVIEW_CHANGED",
          "This review changed; refresh and retry",
          context.request,
        );
      return apiSuccess({ review: data }, context.request);
    }
    return apiError(
      400,
      "BAD_REQUEST",
      "Unknown work review action",
      context.request,
    );
  } catch (error) {
    if (error instanceof RecruitmentAccessError)
      return apiError(403, "FORBIDDEN", error.message, context.request);
    return apiDbError(error, context.request);
  }
});
