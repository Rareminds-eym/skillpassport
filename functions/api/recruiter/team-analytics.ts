import { withAuth, getContextUser } from "../../lib/auth";
import { getServiceClient } from "../../lib/supabase";
import {
  recruitmentScope,
  scopedRecruitmentQuery,
  RecruitmentAccessError,
} from "../../lib/recruitment-scope";
import { PERMISSIONS } from "../../lib/permissions";
import {
  apiSuccess,
  apiError,
  apiDbError,
  apiMethodNotAllowed,
} from "../../lib/response";
export const onRequest = (context: any) =>
  context.request.method === "GET" ? handle(context) : apiMethodNotAllowed();
const handle = withAuth(async (context) => {
  try {
    const db = getServiceClient(context.env as any),
      scope = await recruitmentScope(
        db,
        getContextUser(context),
        PERMISSIONS.MANAGE_TEAM,
      );
    const [members, candidates] = await Promise.all([
      db
        .from("users")
        .select("id,firstName,lastName,email")
        .in("id", scope.memberIds),
      scopedRecruitmentQuery(
        db,
        scope,
        "pipeline_candidates",
        "id,added_by,added_by_uuid,stage,status,added_at,stage_changed_at",
      ),
    ]);
    if (members.error || candidates.error)
      return apiDbError(members.error || candidates.error, context.request);
    const rows = members.data.map((member) => {
      const sourced = candidates.data.filter(
        (candidate: any) =>
          (candidate.added_by_uuid || candidate.added_by) === member.id,
      );
      const hired = sourced.filter(
        (candidate: any) =>
          candidate.stage === "hired" || candidate.status === "hired",
      );
      const durations = hired
        .map(
          (candidate: any) =>
            (Date.parse(candidate.stage_changed_at) -
              Date.parse(candidate.added_at)) /
            86400000,
        )
        .filter((days: number) => Number.isFinite(days) && days >= 0);
      return {
        id: member.id,
        name:
          [member.firstName, member.lastName].filter(Boolean).join(" ") ||
          member.email,
        email: member.email,
        sourced: sourced.length,
        hired: hired.length,
        averageDays: durations.length
          ? Math.round(
              durations.reduce((sum: number, n: number) => sum + n, 0) /
                durations.length,
            )
          : null,
      };
    });
    return apiSuccess(
      {
        members: rows,
        unattributedCandidates: candidates.data.filter(
          (candidate: any) =>
            !scope.memberIds.includes(
              candidate.added_by_uuid || candidate.added_by,
            ),
        ).length,
      },
      context.request,
    );
  } catch (error) {
    if (error instanceof RecruitmentAccessError)
      return apiError(403, "FORBIDDEN", error.message, context.request);
    return apiDbError(error, context.request);
  }
});
