/**
 * Shared Organization Resolution Helper
 *
 * Centralizes the cascading org-lookup pattern that was duplicated across
 * authenticated.ts (3×), faculty.ts, and settings.ts.
 *
 * Lookup cascade:
 *   1. users.organizationId (fast path — already stored on user)
 *   2. Domain-specific educator table (school_educators / college_lecturers)
 *   3. organizations.admin_id or organizations.email (admin fallback)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface ResolvedOrganization {
  organizationId: string;
  source: 'user' | 'educator' | 'admin' | 'provided';
}

interface ResolveOrgOptions {
  /** Pre-resolved org ID — skips lookup if provided */
  knownOrgId?: string | null;
  /** User ID for lookup */
  userId?: string | null;
  /** User email for fallback lookup */
  email?: string | null;
  /** Organization type to filter by: 'school' | 'college' */
  orgType: 'school' | 'college';
}

/**
 * Resolves the organization a user belongs to using a cascading lookup.
 *
 * @returns The resolved organization ID and source, or null if not found.
 */
export async function resolveUserOrganization(
  supabase: SupabaseClient,
  options: ResolveOrgOptions,
): Promise<ResolvedOrganization | null> {
  const { knownOrgId, userId, email, orgType } = options;

  // 0. Fast path: already provided
  if (knownOrgId) {
    return { organizationId: knownOrgId, source: 'provided' };
  }

  // 1. Check users.organizationId
  if (userId) {
    const { data: userData } = await supabase
      .from('users')
      .select('organizationId')
      .eq('id', userId)
      .maybeSingle();

    if (userData?.organizationId) {
      return { organizationId: userData.organizationId, source: 'user' };
    }
  }

  // 2. Check domain-specific educator table
  if (orgType === 'school') {
    if (userId) {
      const { data: educator } = await supabase
        .from('school_educators')
        .select('school_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (educator?.school_id) {
        return { organizationId: educator.school_id, source: 'educator' };
      }
    }

    if (email) {
      const { data: educatorByEmail } = await supabase
        .from('school_educators')
        .select('school_id')
        .eq('email', email)
        .maybeSingle();
      if (educatorByEmail?.school_id) {
        return { organizationId: educatorByEmail.school_id, source: 'educator' };
      }
    }
  } else if (orgType === 'college' && userId) {
    const { data: lecturer } = await supabase
      .from('college_lecturers')
      .select('collegeId')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (lecturer?.collegeId) {
      return { organizationId: lecturer.collegeId, source: 'educator' };
    }
  }

  // 3. Fallback: Check organizations by admin_id or email
  if (!userId && !email) return null;

  let query = supabase
    .from('organizations')
    .select('id')
    .eq('organization_type', orgType);

  if (email && userId) {
    query = query.or(`admin_id.eq.${userId},email.ilike.${email}`);
  } else if (email) {
    query = query.ilike('email', email);
  } else {
    query = query.eq('admin_id', userId);
  }

  const { data: org } = await query.maybeSingle();
  if (org?.id) {
    return { organizationId: org.id, source: 'admin' };
  }

  return null;
}
