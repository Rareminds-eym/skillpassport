import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getActiveOrgId,
  getOrgMemberUserIds,
  getOrgOwnedOpportunityIds,
  type AuthUserShape,
} from "./org-ownership";
import { verifyOrgAccess } from "./permissions";

export class RecruitmentAccessError extends Error {
  readonly status = 403;
}

export interface RecruitmentScope {
  orgId: string;
  memberIds: string[];
  opportunityIds: string[];
  candidateIds: string[];
  shortlistIds: string[];
  recruiterIds: string[];
}

/** The scope is built once per request, exclusively from authenticated membership. */
export async function recruitmentScope(
  db: SupabaseClient,
  user: AuthUserShape,
  permission?: string,
): Promise<RecruitmentScope> {
  const orgId = await getActiveOrgId(db, user);
  if (!orgId || !user.id)
    throw new RecruitmentAccessError(
      "An active recruitment organization is required",
    );
  const access = await verifyOrgAccess(db, user.id, orgId, permission);
  if (!access.allowed)
    throw new RecruitmentAccessError(
      "You do not have permission to perform this action",
    );
  const [memberIds, opportunityIds] = await Promise.all([
    getOrgMemberUserIds(db, orgId),
    getOrgOwnedOpportunityIds(db, orgId),
  ]);
  const [candidates, shortlists, recruiters] = await Promise.all([
    db
      .from("pipeline_candidates")
      .select("id")
      .in(
        "opportunity_id",
        opportunityIds.length ? opportunityIds : [EMPTY_UUID],
      ),
    db
      .from("shortlists")
      .select("id")
      .eq("organization_id",orgId),
    db
      .from("recruiters")
      .select("id")
      .in("user_id", memberIds.length ? memberIds : [EMPTY_UUID]),
  ]);
  for (const result of [candidates, shortlists, recruiters])
    if (result.error) throw result.error;
  return {
    orgId,
    memberIds,
    opportunityIds,
    candidateIds: (candidates.data || []).map((r) => String(r.id)),
    shortlistIds: (shortlists.data || []).map((r) => String(r.id)),
    recruiterIds: [
      ...memberIds,
      ...(recruiters.data || []).map((r) => String(r.id)),
    ],
  };
}

export const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";
const ids = (values: string[]) => (values.length ? values : [EMPTY_UUID]);

/** Restrict before ordering, limiting or aggregation. Never filter a global result in the browser. */
export function scopedRecruitmentQuery(
  db: SupabaseClient,
  scope: RecruitmentScope,
  table: string,
  select = "*",
  options?: { count?: "exact"; head?: boolean },
) {
  let query: any = db.from(table).select(select, options);
  switch (table) {
    case "opportunities":
      return query.in("id", ids(scope.opportunityIds));
    case "applied_jobs":
    case "pipeline_candidates":
      return query.in("opportunity_id", ids(scope.opportunityIds));
    case "pipeline_activities":
      return query.in("candidate_uuid", ids(scope.candidateIds));
    case "shortlists":
    case "shortlists_with_counts":
      return query.eq("organization_id",scope.orgId);
    case "shortlist_candidates":
      return query.in("shortlist_id", ids(scope.shortlistIds));
    case "offers":
      return query.in("job_id", ids(scope.opportunityIds));
    case "interviews":
      return query.eq("organization_id", scope.orgId);
    case "placements":
      return query.in("recruiterId", ids(scope.recruiterIds));
    case "recruiter_activities":
      return query.in("recruiterId", ids(scope.recruiterIds));
    default:
      throw new Error(`Unsupported recruitment scope: ${table}`);
  }
}
