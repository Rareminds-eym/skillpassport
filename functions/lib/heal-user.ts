/**
 * Heal-user — self-heal app DB (skillpassport 54321) from SSO DB (54331) on cache-miss
 * Full parity: users/learners/organizations/organization_members/subscription_cache/users_shadow
 * Sources: role from membership_roles, org from organizations, subscription from SSO, user_metadata for names/program
 * Idempotent, fail-soft (never throws), respects FK order org→users→learners/organization_members→subscription_cache.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from './logger';
import { withResilience } from './resilience';
import { syncSubscriptionCache, syncUserShadow } from './sync-shadow';
import { isValidUUID } from './validation';

export interface HealEnv {
  SSO_SERVICE?: Record<string, (...args: any[]) => Promise<any>>;
  ENVIRONMENT?: string;
}

const log = createLogger('heal-user');

function pickNames(meta: Record<string, unknown> | null) {
  const m = meta || {};
  // Support full_name / name split (signup trigger parses full_name via SPLIT_PART)
  let first = (m.firstName as string) || (m.first_name as string) || (m.given_name as string) || '';
  let last = (m.lastName as string) || (m.last_name as string) || (m.family_name as string) || '';
  const full = (m.full_name as string) || (m.name as string) || (m.display_name as string) || '';
  if (!first && !last && full) {
    const parts = String(full).trim().split(/\s+/);
    first = parts[0] || '';
    last = parts.slice(1).join(' ') || '';
  }
  const phone =
    (m.phone as string) ||
    (m.contact_number as string) ||
    (m.phone_number as string) ||
    (m.mobile as string) ||
    (m.phoneNumber as string) ||
    null;
  const programId = (m.program_id as string) || (m.programId as string) || null;
  const enrollmentNumber = (m.enrollment_number as string) || (m.enrollmentNumber as string) || null;
  return { first, last, phone, programId, enrollmentNumber };
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function mapMembershipRoleToOrgMemberRole(roles: string[]): string {
  if (roles.includes('owner')) return 'owner';
  if (roles.includes('admin') || roles.includes('company_admin') || roles.includes('school_admin') || roles.includes('college_admin') || roles.includes('university_admin')) return 'admin';
  return 'member';
}

export async function ensureAppUserAndLearner(
  supabase: SupabaseClient,
  env: HealEnv,
  authUser: { sub: string; email?: string },
  requestId?: string,
): Promise<{ healed: boolean; reason: string }> {
  const start = Date.now();
  const rawUserId = authUser.sub;
  const rawEmail = authUser.email || '';
  // Defense-in-depth: validate UUID format
  if (!isValidUUID(rawUserId)) {
    log.warn('heal skipped: invalid userId', { userId: rawUserId, requestId });
    return { healed: false, reason: 'invalid_user_id' };
  }
  const userId = rawUserId;
  const email = normalizeEmail(rawEmail);

  try {
    if (!env.SSO_SERVICE) {
      log.warn('heal skipped: SSO_SERVICE not configured', { userId, requestId });
      return { healed: false, reason: 'no_binding' };
    }

    // Fetch SSO source-of-truth with resilience (timeout 5s, retry 2, breaker 5/30s) — before early-exit so blocked status propagates
    const ssoUser = await withResilience('heal:getUserById', () => env.SSO_SERVICE!.getUserById(userId));
    if (!ssoUser) {
      // Avoid PII in logs — log userId only, email is PII
      log.warn('heal: SSO user not found', { userId, requestId });
      return { healed: false, reason: 'sso_user_not_found' };
    }

    // Blocked user: still sync isActive=false but do not create approved learner — must run even if rows exist
    const isBlocked = !!(ssoUser as any).is_blocked;
    if (isBlocked) {
      const currentEmail = normalizeEmail((ssoUser as any).email || email);
      await supabase.from('users').upsert(
        {
          id: userId,
          email: currentEmail,
          isActive: false,
          metadata: ((ssoUser as any).user_metadata as Record<string, unknown>) || {},
        },
        { onConflict: 'id' },
      );
      await syncUserShadow(supabase, userId, currentEmail);
      log.warn('heal blocked user: isActive set false, learner not created', { userId, requestId });
      log.info('heal_metric', { requestId, metric: 'heal_cache_miss_total', status: 'blocked', userId, durationMs: Date.now() - start } as any);
      return { healed: false, reason: 'user_blocked' };
    }

    // Check existing — after blocked check so active→blocked transition heals
    const { data: existingLearner } = await supabase.from('learners').select('id').eq('user_id', userId).maybeSingle();
    const { data: existingUser } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    // Early-exit only if all core entities exist and subscription cache also exists (full parity, avoids stale)
    if (existingLearner && existingUser && existingMember) {
      const { data: subCache } = await supabase.from('subscription_cache').select('id').eq('user_id', userId).limit(1).maybeSingle();
      if (subCache) {
        return { healed: false, reason: 'already_exists' };
      }
    }

    const membershipRes = await withResilience('heal:getUserMemberships', () =>
      env.SSO_SERVICE!.getUserMemberships(userId),
    );
    const memberships: { id: string; org_id: string; role: string; status: string }[] =
      (membershipRes as any)?.memberships || [];
    const primary = memberships.find((m) => m.status === 'active') || memberships[0] || null;
    const role = primary?.role || 'learner';
    const orgId = primary?.org_id || null;
    // Collect all orgIds for multi-membership heal (up to 3 to keep bounded)
    const allOrgIds = [...new Set(memberships.map((m) => m.org_id).filter(Boolean))].slice(0, 3);
    const allRoles = [...new Set(memberships.map((m) => m.role).filter(Boolean))];

    let org: { id: string; name: string; slug?: string | null; metadata: Record<string, unknown> | null } | null = null;
    let orgs: typeof org[] = [];
    if (orgId && env.SSO_SERVICE.getOrganizationById) {
      try {
        org = await withResilience('heal:getOrganizationById', () => env.SSO_SERVICE!.getOrganizationById(orgId));
        // Fetch additional orgs for multi-membership
        for (const oid of allOrgIds) {
          if (oid === orgId) {
            orgs.push(org);
            continue;
          }
          try {
            const o = await withResilience('heal:getOrganizationById', () => env.SSO_SERVICE!.getOrganizationById(oid));
            if (o) orgs.push(o);
          } catch {}
        }
        if (orgs.length === 0 && org) orgs = [org];
      } catch {
        // org fetch fail-soft
      }
    } else if (allOrgIds.length > 0 && env.SSO_SERVICE.getOrganizationById) {
      for (const oid of allOrgIds) {
        try {
          const o = await withResilience('heal:getOrganizationById', () => env.SSO_SERVICE!.getOrganizationById(oid));
          if (o) orgs.push(o);
        } catch {}
      }
      org = orgs[0] || null;
    }

    const subRes = await withResilience('heal:syncSubscription', () =>
      (env.SSO_SERVICE!.syncSubscription || env.SSO_SERVICE!.getUserSubscription)(userId),
    ).catch(() => ({ subscription: null, plan: null }));
    const subscription = (subRes as any)?.subscription as Record<string, unknown> | null;
    const plan = (subRes as any)?.plan as Record<string, unknown> | null;

    const meta = (ssoUser as any).user_metadata as Record<string, unknown> | null;
    const { first, last, phone, programId, enrollmentNumber } = pickNames(meta);
    const ssoEmail = normalizeEmail((ssoUser as any).email || email);
    const fullName = `${first} ${last}`.trim() || ssoEmail || userId;
    const orgType = (org?.metadata as any)?.organization_type || (org?.metadata as any)?.org_type || null;

    // 1) organizations — always upsert (fix C2 slug bug, add full fields, update existing)
    for (const o of orgs.length > 0 ? orgs : org ? [org] : []) {
      if (!o?.id) continue;
      const oType = (o.metadata as any)?.organization_type || (o.metadata as any)?.org_type || orgType;
      const { data: orgExists } = await supabase.from('organizations').select('id').eq('id', o.id).maybeSingle();
      const orgPayload: any = {
        id: o.id,
        name: o.name || 'Organization',
        organization_type: oType,
        metadata: o.metadata || {},
      };
      // Preserve verification defaults if creating new (is_active true via DDL default)
      let error: any = null;
      if (!orgExists) {
        const res = await supabase.from('organizations').upsert(orgPayload, { onConflict: 'id' });
        error = (res as any).error;
      } else {
        const res = await supabase.from('organizations').update({ name: orgPayload.name, organization_type: orgPayload.organization_type, metadata: orgPayload.metadata }).eq('id', o.id);
        error = (res as any).error;
      }
      if (error) {
        log.warn('heal: organization upsert error', { requestId, error: error.message, orgId: o.id, userId });
      } else {
        log.info('heal: organization upserted', { requestId, orgId: o.id, userId });
      }
    }

    // 2) users — always upsert (fix C3 create-only, email normalize, isActive, metadata allow-list)
    {
      const upsertPayload: any = {
        id: userId,
        email: ssoEmail,
        firstName: first || null,
        lastName: last || null,
        role,
        phone,
        organizationId: orgId,
        isActive: true,
        metadata: meta || {},
        updatedAt: new Date().toISOString(),
      };
      // Only include optional fields that exist in schema to avoid PGRST204
      const { error: userErr } = await supabase.from('users').upsert(upsertPayload, { onConflict: 'id' });
      if (userErr) {
        log.warn('heal: users upsert error', { requestId, error: userErr.message, userId });
      } else {
        log.info('heal: users upserted', { requestId, userId, role });
      }
      await syncUserShadow(supabase, userId, ssoEmail);
    }

    // 3) organization_members — capped to 3 orgs (M3), per-org role (M4)
    for (const m of memberships.slice(0, 3)) {
      if (!m.org_id) continue;
      const memberRole = mapMembershipRoleToOrgMemberRole([m.role]);
      const { error: memberErr } = await supabase.from('organization_members').upsert(
        {
          user_id: userId,
          organization_id: m.org_id,
          role: memberRole,
          status: m.status || 'active',
        },
        { onConflict: 'user_id,organization_id' },
      );
      if (memberErr) {
        log.warn('heal: organization_members upsert error', { requestId, error: memberErr.message, userId, orgId: m.org_id });
      } else {
        log.info('heal: organization_members upserted', { requestId, userId, orgId: m.org_id, role: memberRole });
      }
    }

    // 4) learners — always upsert (fix C3, I1 university→universityId, I2 program_id validated)
    {
      const approvalStatus = primary?.status === 'active' ? 'approved' : primary?.status === 'inactive' ? 'pending' : 'approved';
      // Validate program_id as UUID before FK upsert (M5)
      const validProgramId = programId && isValidUUID(programId) ? programId : null;
      const learnerPayload: any = {
        user_id: userId,
        email: ssoEmail,
        name: fullName,
        approval_status: approvalStatus,
        enrollmentNumber: enrollmentNumber || null,
        contact_number: phone,
        // Only set program_id if valid UUID to avoid 23503
        ...(validProgramId ? { program_id: validProgramId } : {}),
        // org-type → FK mapping (university → universityId, not university_college_id FK mismatch M2)
        ...(orgType === 'school' ? { school_id: orgId } : {}),
        ...(orgType === 'college' ? { college_id: orgId } : {}),
        ...((orgType === 'university' || orgType === 'university_college') ? { universityId: orgId } : {}),
      };
      // Remove null/undefined keys to avoid overwriting with null on update
      Object.keys(learnerPayload).forEach((k) => learnerPayload[k] == null && delete learnerPayload[k]);
      const { error: learnerErr } = await supabase.from('learners').upsert(learnerPayload, { onConflict: 'user_id' });
      if (learnerErr) {
        log.warn('heal: learners upsert error', { requestId, error: learnerErr.message, userId });
      } else {
        log.info('heal: learners upserted', { requestId, userId, orgType, programId });
      }
    }

    // 5) subscription_cache — always sync if exists
    if (subscription) {
      await syncUserShadow(supabase, userId, ssoEmail);
      await syncSubscriptionCache(supabase, subscription as Record<string, unknown>, plan as Record<string, unknown> | null);
      log.info('heal: subscription_cache synced', { requestId, userId, plan_code: (subscription as any).plan_code });
    }

    const durationMs = Date.now() - start;
    log.info('heal_metric', { requestId, metric: 'heal_cache_miss_total', status: 'success', userId, role, orgType, durationMs } as any);
    log.info('heal succeeded', { requestId, userId, role, orgId, hasSubscription: !!subscription, durationMs });

    return { healed: true, reason: 'healed' };
  } catch (e) {
    const durationMs = Date.now() - start;
    const msg = e instanceof Error ? e.message : String(e);
    log.warn('heal failed (fail-soft)', { userId, requestId, error: msg, durationMs });
    log.info('heal_metric', { requestId, metric: 'heal_cache_miss_total', status: 'failure', userId, durationMs } as any);
    return { healed: false, reason: msg };
  }
}
