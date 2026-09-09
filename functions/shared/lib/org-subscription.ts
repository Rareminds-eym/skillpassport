import type { SupabaseClient } from '@supabase/supabase-js';

export interface EntitlementResult {
  id: string;
  user_id: string;
  plan_id?: string;
  plan_type?: string;
  plan_code?: string;
  status: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  auto_renew?: boolean;
  features?: string[];
  is_organization_license?: boolean;
  organization_wide?: boolean;
  organization_id?: string;
  organization_type?: string;
  organization_name?: string;
  organization_email?: string;
  organization_phone?: string;
  license_assignment_id?: string;
  subscription_plans?: {
    id?: string;
    name?: string;
    plan_code?: string;
  };
}

export interface OrganizationDetails {
  name?: string;
  email?: string;
  phone?: string;
  organization_type?: string;
}

export async function resolveUserEntitlement(
  supabase: SupabaseClient,
  userId: string
): Promise<EntitlementResult | null> {
  console.log('[resolveUserEntitlement] Starting entitlement check', { userId });

  try {
    if (!userId) return null;

    // STEP 1: Check active per-seat license_assignments
    const { data: activeSeat } = await supabase
      .from('license_assignments')
      .select('id, license_pool_id, organization_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (activeSeat) {
      const subId = activeSeat.organization_subscription_id;
      if (subId) {
        const { data: orgCache } = await supabase
          .from('subscription_cache')
          .select('*')
          .eq('id', subId)
          .maybeSingle();

        if (orgCache) {
          let orgDetails: OrganizationDetails | null = null;
          if (orgCache.organization_id) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('name, email, phone, organization_type')
              .eq('id', orgCache.organization_id)
              .maybeSingle();
            if (orgData) orgDetails = orgData;
          }

          return {
            id: orgCache.id,
            user_id: userId,
            plan_id: orgCache.plan_id,
            plan_type: orgCache.plan_name || 'Organization License',
            plan_code: orgCache.plan_code,
            status: orgCache.status,
            subscription_start_date: orgCache.subscription_start_date,
            subscription_end_date: orgCache.subscription_end_date,
            auto_renew: orgCache.auto_renew ?? false,
            features: orgCache.features || [],
            is_organization_license: true,
            organization_wide: false,
            organization_id: orgCache.organization_id,
            organization_type: orgDetails?.organization_type,
            organization_name: orgDetails?.name,
            organization_email: orgDetails?.email,
            organization_phone: orgDetails?.phone,
            license_assignment_id: activeSeat.id,
            subscription_plans: {
              id: orgCache.plan_id,
              name: orgCache.plan_name,
              plan_code: orgCache.plan_code,
            },
          };
        }
      }
    }

    // STEP 1.5: Check revoked per-seat license_assignments (explicit revocation overrides org fallback)
    const { data: revokedSeat } = await supabase
      .from('license_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'revoked')
      .maybeSingle();

    if (revokedSeat) {
      return null;
    }

    // STEP 1.7: Org-wide entitlement fallback via organization lookup
    // This covers:
    // - Learners via learners table (college_id, school_id)
    // - Invited recruiters via users.organizationId
    // - Organization owners via organizations.created_by
    // - Other organization members
    let orgId: string | null = null;

    // First check learners table for students
    const { data: learner } = await supabase
      .from('learners')
      .select('college_id, school_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    orgId = learner?.college_id || learner?.school_id || null;

    // If no org found via learners, check users table (for invited members)
    if (!orgId) {
      const { data: userData } = await supabase
        .from('users')
        .select('organizationId, role')
        .eq('id', userId)
        .maybeSingle();

      orgId = userData?.organizationId || null;
    }

    // If still no org found, check if user is an organization owner (created_by)
    // This covers recruiter_admin and other org creators who don't have organizationId set
    if (!orgId) {
      const { data: ownedOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', userId)
        .maybeSingle();

      orgId = ownedOrg?.id || null;

      if (orgId) {
        console.log('[resolveUserEntitlement] Found organization via created_by', { userId, orgId });
      }
    }

    if (orgId) {
      console.log('[resolveUserEntitlement] Checking organization subscription', { userId, orgId });
      const nowIso = new Date().toISOString();
      const { data: orgSub } = await supabase
        .from('subscription_cache')
        .select('*')
        .eq('organization_id', orgId)
        .in('status', ['active', 'paused'])
        .or(`subscription_end_date.gte.${nowIso},subscription_end_date.is.null`)
        .order('subscription_end_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('[resolveUserEntitlement] Organization subscription query result', {
        userId,
        orgId,
        found: !!orgSub,
        status: orgSub?.status,
        plan: orgSub?.plan_code
      });

      if (orgSub) {
        let orgDetails: OrganizationDetails | null = null;
        if (orgId) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name, email, phone, organization_type')
            .eq('id', orgId)
            .maybeSingle();
          if (orgData) orgDetails = orgData;
        }

        return {
          id: orgSub.id,
          user_id: userId,
          plan_id: orgSub.plan_id,
          plan_type: orgSub.plan_name || 'Organization Plan',
          plan_code: orgSub.plan_code,
          status: orgSub.status,
          subscription_start_date: orgSub.subscription_start_date,
          subscription_end_date: orgSub.subscription_end_date,
          auto_renew: orgSub.auto_renew ?? false,
          features: orgSub.features || [],
          is_organization_license: true,
          organization_wide: true,
          organization_id: orgId,
          organization_type: orgDetails?.organization_type,
          organization_name: orgDetails?.name,
          organization_email: orgDetails?.email,
          organization_phone: orgDetails?.phone,
          subscription_plans: {
            id: orgSub.plan_id,
            name: orgSub.plan_name,
            plan_code: orgSub.plan_code,
          },
        };
      }
    }

    // STEP 2: Individual subscription check
    console.log('[resolveUserEntitlement] Checking individual subscription', { userId });
    const { data: indSub } = await supabase
      .from('subscription_cache')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'grace_period', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('[resolveUserEntitlement] Individual subscription query result', {
      userId,
      found: !!indSub,
      status: indSub?.status,
      plan: indSub?.plan_code
    });

    if (indSub) {
      return {
        id: indSub.id,
        user_id: userId,
        plan_id: indSub.plan_id,
        plan_type: indSub.plan_name || 'Individual Plan',
        plan_code: indSub.plan_code,
        status: indSub.status,
        subscription_start_date: indSub.subscription_start_date,
        subscription_end_date: indSub.subscription_end_date,
        auto_renew: indSub.auto_renew ?? false,
        features: indSub.features || [],
        is_organization_license: false,
        organization_wide: false,
        subscription_plans: {
          id: indSub.plan_id,
          name: indSub.plan_name,
          plan_code: indSub.plan_code,
        },
      };
    }

    // STEP 3: Fallback null (fail closed)
    console.log('[resolveUserEntitlement] No subscription found, returning null', { userId });
    return null;
  } catch (err) {
    console.error('[resolveUserEntitlement] Error during resolution:', err);
    return null;
  }
}
