/**
 * Shared object-level authorization helpers (OWASP API1:2023 BOLA mitigation).
 *
 * Every endpoint that accepts an object id from the client MUST verify, on the
 * server, that the object belongs to the caller's active organization (or, for
 * learner resources, to the caller themselves) before reading or mutating it.
 * This module is the single source of that logic for the recruiter surface.
 *
 * Rules implemented here:
 *  1. Tenant resolution: JWT org claim first, else the user's ACTIVE
 *     organization_memberships row (limit(1) — .maybeSingle() without .limit(1)
 *     synthesizes PGRST116 when a user holds more than one membership).
 *  2. Org-owned resources are derived from the DB (never from client input).
 *  3. Learner-scoped resources must be bound to learners.user_id = caller id.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthUserShape {
  /** Deliberately loose: callers pass auth-core's AuthUser whose id may be
   * typed string|undefined; helpers coerce internally. */
  id?: string | null;
  org_id?: string | null;
  email?: string;
  roles?: unknown;
}

/** Cached per-request org scopes to avoid re-querying within one request. */
export interface OrgScope {
  orgId: string | null;
  memberUserIds: string[] | null;
  opportunityIds: string[] | null;
}

/**
 * Resolve the caller's active tenant: JWT org claim first, else the ACTIVE
 * membership row. Uses .limit(1) so multiple memberships can never yield the
 * postgrest-js client-side PGRST116 synthesis (supabase-js searches for the
 * object shape only after it limits).
 */
export async function getActiveOrgId(
  supabase: SupabaseClient,
  user: AuthUserShape
): Promise<string | null> {
  if (user?.org_id) return user.org_id;
  const uid = String(user?.id ?? '');
  if (!uid) return null;
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', uid)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[org-ownership] membership lookup failed:', {
      userId: uid,
      code: error.code,
      message: error.message,
    });
    return null;
  }
  return data?.organization_id ?? null;
}

/** All user ids that hold an active membership in the org (for created_by scoping). */
export async function getOrgMemberUserIds(
  supabase: SupabaseClient,
  orgId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('status', 'active');
  if (error) {
    console.error('[org-ownership] member listing failed:', {
      orgId,
      code: error.code,
    });
    return [];
  }
  return (data ?? []).map((r: { user_id: string }) => r.user_id);
}

/** All opportunity ids owned by the org (single authoritative scope source). */
export async function getOrgOwnedOpportunityIds(
  supabase: SupabaseClient,
  orgId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('id')
    .eq('organization_id', orgId);
  if (error) {
    console.error('[org-ownership] opportunity scope query failed:', {
      orgId,
      code: error.code,
    });
    return [];
  }
  return (data ?? []).map((r: { id: string }) => r.id);
}

/**
 * The one gate for interview rows, keyed on the interviews table's real shape
 * (no organization_id column — ownership is derived):
 *   allowed ⇔ (interview's learner is one of the learners who applied to one
 *              of THIS org's opportunities) OR (created_by = caller id)
 *
 * ⚠ DB id-space note (psql-verified): interviews.learner_id FK →
 * learners(user_id) (USER id-space) while applied_jobs.learner_id matches
 * learners.id (learner-PK id-space). The applied learner set is therefore
 * remapped through learners.id → learners.user_id before comparing.
 */
export async function assertInterviewAccess(
  supabase: SupabaseClient,
  user: AuthUserShape,
  orgId: string | null,
  interview: { learner_id?: string | null; created_by?: string | null } | null,
  scope?: OrgScope
): Promise<boolean> {
  if (!interview) return false;
  if (interview.created_by && interview.created_by === String(user?.id ?? '')) return true;
  if (!orgId || !interview.learner_id) return false;

  const opportunityIds = scope?.opportunityIds ?? (await getOrgOwnedOpportunityIds(supabase, orgId));
  if (opportunityIds.length === 0) return false;

  const { data: apps, error } = await supabase
    .from('applied_jobs')
    .select('learner_id')
    .in('opportunity_id', opportunityIds);
  if (error) {
    console.error('[org-ownership] applied_jobs scope query failed:', { code: error.code });
    return false;
  }
  const appliedLearnerIds = [...new Set((apps ?? []).map((r: { learner_id: string }) => r.learner_id))].filter(Boolean);
  if (appliedLearnerIds.length === 0) return false;

  // Remap applied_jobs learner-PK ids → interviews' user-space ids.
  const { data: learnerRows, error: learnerErr } = await supabase
    .from('learners')
    .select('user_id')
    .in('id', appliedLearnerIds);
  if (learnerErr) {
    console.error('[org-ownership] learner id-space remap failed:', { code: learnerErr.code });
    return false;
  }
  return (learnerRows ?? []).some((r: { user_id: string | null }) => r.user_id === interview.learner_id);
}

/** Fetch an interview row by id (canonical read used by all gating decisions). */
export async function getInterviewRow(
  supabase: SupabaseClient,
  interviewId: string
): Promise<{ learner_id: string | null; created_by: string | null } | null> {
  const { data, error } = await supabase
    .from('interviews')
    .select('learner_id, created_by')
    .eq('id', interviewId)
    .maybeSingle();
  if (error) {
    console.error('[org-ownership] interview lookup failed:', { code: error.code });
    return null;
  }
  return data ?? null;
}

/**
 * Verify the caller's learner identity owns an applied_jobs row.
 * Used by learner-side mutations (withdraw / delete application).
 */
export async function assertLearnerOwnership(
  supabase: SupabaseClient,
  user: AuthUserShape,
  learnerId: string
): Promise<boolean> {
  if (!learnerId) return false;
  const { data, error } = await supabase
    .from('learners')
    .select('id')
    .eq('id', learnerId)
    .eq('user_id', String(user?.id ?? ''))
    .maybeSingle();
  return !error && !!data;
}

/** Requisition statuses accepted by the server (superset of the live DB enum). */
export const ALLOWED_REQUISITION_STATUSES = ['draft', 'open', 'closed', 'on_hold'] as const;
