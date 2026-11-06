import { withAuth, getContextUser } from "../../lib/auth";
import { getServiceClient } from "../../lib/supabase";
import { apiSuccess, apiError, apiDbError } from "../../lib/response";
import {
  recruitmentScope,
  scopedRecruitmentQuery,
  RecruitmentAccessError,
} from "../../lib/recruitment-scope";
import { PERMISSIONS } from "../../lib/permissions";

export const onRequestPost = withAuth(async (context) => {
  const user = getContextUser(context);
  const db = getServiceClient(context.env as any);
  let body: Record<string, any>;
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
  const action = body.action;
  const allowed = [
    "get-kpis",
    "get-dashboard-data",
    "get-recent-activity",
    "get-alerts",
    "get-recent-shortlists",
    "get-saved-searches",
  ];
  if (!allowed.includes(action))
    return apiError(
      400,
      "INVALID_ACTION",
      "Unknown dashboard action",
      context.request,
    );
  const limit = Math.min(100, Math.max(1, Number(body.limit) || 15));
  try {
    const scope = await recruitmentScope(db, user, PERMISSIONS.VIEW_ANALYTICS);
    const query = (table: string, select = "*") =>
      scopedRecruitmentQuery(db, scope, table, select);
    const read = async (q: any): Promise<any[]> => {
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    };
    const searches = () =>
      read(
        db
          .from("recruiter_saved_searches")
          .select("id,name,search_criteria")
          .eq("recruiter_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(6),
      );
    const shortlists = async () =>
      (
        await read(
          query(
            "shortlists",
            "id,name,created_date,created_by,shared,shortlist_candidates(count)",
          )
            .order("created_date", { ascending: false })
            .limit(limit),
        )
      ).map((sl) => ({
        ...sl,
        candidate_count: sl.shortlist_candidates?.[0]?.count || 0,
      }));
    if (action === "get-saved-searches")
      return apiSuccess(await searches(), context.request);
    if (action === "get-recent-shortlists")
      return apiSuccess(await shortlists(), context.request);
    if (action === "get-alerts") return apiSuccess([], context.request);
    if (action === "get-recent-activity") {
      const [pipeline, offers, interviews, lists, reviews] = await Promise.all([
        read(
          query("pipeline_activities")
            .order("created_at", { ascending: false })
            .limit(limit),
        ),
        read(
          query("offers")
            .order("updated_at", { ascending: false })
            .limit(limit),
        ),
        read(
          query("interviews")
            .order("updated_at", { ascending: false })
            .limit(limit),
        ),
        read(
          query(
            "shortlist_candidates",
            "id,notes,added_at,added_by,shortlists(name),learners(name)",
          )
            .order("added_at", { ascending: false })
            .limit(limit),
        ),
        read(
          db
            .from("recruitment_application_events")
            .select("*")
            .eq("organization_id", scope.orgId)
            .order("created_at", { ascending: false })
            .limit(limit),
        ),
      ]);
      const activities = [
        ...pipeline.map((p) => ({
          id: `pipeline-${p.id}`,
          user: "Recruitment team",
          action: "moved candidate",
          candidate: p.activity_details?.candidate_name || "Candidate",
          details: `${p.from_stage || ""} → ${p.to_stage || ""}`,
          timestamp: p.created_at,
          type: "pipeline_activity",
          icon: "pipeline",
        })),
        ...offers.map((o) => ({
          id: `offer-${o.id}`,
          user: "Recruitment team",
          action: `updated offer (${o.status}) for`,
          candidate: o.candidate_name,
          details: o.job_title,
          timestamp: o.updated_at,
          type: "offer",
          icon: "document",
        })),
        ...interviews.map((i) => ({
          id: `interview-${i.id}`,
          user: i.interviewer,
          action: `${i.status} interview with`,
          candidate: i.candidate_name,
          details: i.job_title,
          timestamp: i.updated_at,
          type: "interview",
          icon: "calendar",
        })),
        ...lists.map((l) => ({
          id: `shortlist-${l.id}`,
          user: "Recruitment team",
          action: "shortlisted",
          candidate: l.learners?.name || "Candidate",
          details: l.shortlists?.name,
          notes: l.notes,
          timestamp: l.added_at,
          type: "shortlist",
          icon: "bookmark",
        })),
        ...reviews.map((r) => ({
          id: `review-${r.id}`,
          user: "Recruitment team",
          action: "reviewed application",
          candidate: "",
          details: `${r.from_status} → ${r.to_status}`,
          notes: r.note,
          timestamp: r.created_at,
          type: "application",
          icon: "document",
        })),
      ]
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .slice(0, limit);
      return apiSuccess(activities, context.request);
    }
    const [pipeline, listed, interviews, offers, recentLists, savedSearches] =
      await Promise.all([
        read(
          query(
            "pipeline_candidates",
            "id,learner_id,stage,status,added_at,stage_changed_at",
          ),
        ),
        read(query("shortlist_candidates", "learner_id")),
        read(query("interviews", "id,status,date")),
        read(query("offers", "id,status")),
        shortlists(),
        searches(),
      ]);
    const hired = pipeline.filter(
      (p) => p.stage === "hired" && p.status !== "rejected",
    );
    const durations = hired
      .map(
        (p) =>
          (Date.parse(p.stage_changed_at) - Date.parse(p.added_at)) / 86400000,
      )
      .filter((n) => Number.isFinite(n) && n >= 0);
    const kpis = {
      newProfiles: new Set(
        pipeline
          .filter((p) => Date.parse(p.added_at) >= Date.now() - 7 * 86400000)
          .map((p) => p.learner_id),
      ).size,
      shortlisted: new Set(listed.map((p) => p.learner_id)).size,
      interviewsScheduled: interviews.filter((i) =>
        ["scheduled", "confirmed"].includes(i.status),
      ).length,
      offersExtended: offers.length,
      timeToHire: durations.length
        ? Math.round(
            (durations.reduce((a, b) => a + b, 0) / durations.length) * 10,
          ) / 10
        : null,
    };
    if (action === "get-kpis") return apiSuccess(kpis, context.request);
    const expiring = interviews.filter(
      (i) =>
        ["scheduled", "confirmed"].includes(i.status) &&
        Date.parse(i.date) >= Date.now() &&
        Date.parse(i.date) < Date.now() + 86400000,
    );
    return apiSuccess(
      {
        kpis,
        alerts: expiring.map((i) => ({
          id: `interview-${i.id}`,
          source: "interviews",
          type: "info",
          title: "Upcoming interview",
          message: "An interview is scheduled in the next 24 hours.",
          urgent: true,
        })),
        shortlists: recentLists,
        savedSearches,
      },
      context.request,
    );
  } catch (error) {
    if (error instanceof RecruitmentAccessError)
      return apiError(403, "FORBIDDEN", error.message, context.request);
    return apiDbError(error, context.request);
  }
});
