import type { SupabaseClient } from '@supabase/supabase-js';

export type SubscriptionScope = 'learner' | 'educator' | 'recruiter' | 'school_admin' | 'college_admin' | 'university_admin';
const SCOPE_ROLES: Record<SubscriptionScope, readonly string[]> = {
  learner: ['learner'], educator: ['educator', 'school_educator', 'college_educator'],
  recruiter: ['recruiter', 'company_admin', 'hr', 'owner', 'admin'],
  school_admin: ['school_admin'], college_admin: ['college_admin'], university_admin: ['university_admin'],
};
export interface SubscriptionIdentity { roles?: readonly string[]; org_id?: string; scope?: SubscriptionScope }
export function subscriptionScope(identity: SubscriptionIdentity, requested?: string | null): SubscriptionScope {
  const roles = identity.roles ?? [];
  if (requested) {
    if (!Object.hasOwn(SCOPE_ROLES, requested) || !SCOPE_ROLES[requested as SubscriptionScope].some(role => roles.includes(role))) throw new Error('SUBSCRIPTION_SCOPE_FORBIDDEN');
    return requested as SubscriptionScope;
  }
  const scope = (['university_admin', 'college_admin', 'school_admin', 'learner', 'educator', 'recruiter'] as const)
    .find(value => SCOPE_ROLES[value].some(role => roles.includes(role)));
  if (!scope) throw new Error('SUBSCRIPTION_SCOPE_FORBIDDEN');
  return scope;
}

export interface EntitlementResult {
  id: string; user_id: string; plan_id?: string; plan_type?: string; plan_code?: string; status: string;
  subscription_start_date?: string; subscription_end_date?: string | null; billing_cycle?: string;
  auto_renew?: boolean; features?: string[]; is_organization_license?: boolean; organization_wide?: boolean;
  organization_id?: string; organization_type?: string; organization_name?: string;
  organization_email?: string; organization_phone?: string; license_assignment_id?: string;
  subscription_plans?: { id?: string; name?: string; plan_code?: string };
  [key: string]: unknown;
}
interface Plan { id: string; name: string; plan_code: string; business_type: string; applicable_entities: string[]; product_id?: string; is_active: boolean }
interface Subscription extends EntitlementResult { plan_id: string; is_organization_subscription?: boolean; product_id?: string }
interface Organization { id: string; organization_type?: string; name?: string; email?: string; phone?: string }
interface Profile { metadata?: Record<string, unknown> }
interface LearnerOrganization { school_id?: string; college_id?: string; is_deleted?: boolean | null; deleted_at?: string | null }

export async function checked<T>(query: PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> {
  const { data, error } = await query;
  if (error) throw new Error('Unable to verify subscription data');
  return data;
}

/** Explicit grace status is honoured; an expired active row cannot invent a grace period. */
export function isSubscriptionCurrent(sub: Pick<Subscription, 'status' | 'subscription_start_date' | 'subscription_end_date' | 'billing_cycle'>, now = Date.now()): boolean {
  if (!['active', 'paused', 'cancelled', 'grace_period'].includes(sub.status)) return false;
  if (sub.subscription_start_date && !(Date.parse(sub.subscription_start_date) <= now)) return false;
  if (!sub.subscription_end_date) return sub.billing_cycle === 'lifetime' && sub.status !== 'cancelled';
  const end = Date.parse(sub.subscription_end_date);
  return Number.isFinite(end) && (end > now || (sub.status === 'grace_period' && end + 7 * 86400000 > now));
}

/** One policy for the existing individual, bulk-seat and organization-wide coverage paths. */
export async function resolveUserEntitlement(supabase: SupabaseClient, userId: string, identity: SubscriptionIdentity): Promise<EntitlementResult | null> {
  if (!userId) return null;
  const scope = subscriptionScope(identity, identity.scope);
  const organizationDashboard = scope.endsWith('_admin') || scope === 'recruiter';
  const expectedEntity = scope.endsWith('_admin') ? scope.replace('_admin', '') : scope === 'recruiter' ? 'recruitment' : null;
  const [profile, memberships, seats, learner, owned] = await Promise.all([
    checked<Profile>(supabase.from('users').select('metadata').eq('id', userId).maybeSingle()),
    checked(supabase.from('organization_members').select('organization_id, role, status').eq('user_id', userId).eq('status', 'active')),
    checked(supabase.from('license_assignments').select('id, organization_subscription_id, status, expires_at').eq('user_id', userId)),
    checked<LearnerOrganization>(supabase.from('learners').select('school_id, college_id, is_deleted, deleted_at').eq('user_id', userId).maybeSingle()),
    checked(supabase.from('organizations').select('id, organization_type, name, email, phone').eq('admin_id', userId)),
  ]);
  if (!profile) throw new Error('Application profile is still being synchronized');
  const seatSubscriptionIds = !organizationDashboard
    ? (seats ?? []).filter(seat => seat.status === 'active' && (!seat.expires_at || Date.parse(seat.expires_at) > Date.now())).map(seat => seat.organization_subscription_id).filter(Boolean)
    : [];
  const assignedSubscriptions: Subscription[] = seatSubscriptionIds.length
    ? await checked(supabase.from('subscription_cache').select('*').in('id', seatSubscriptionIds)) ?? [] : [];
  const orgIds = new Set<string>((memberships ?? []).map(member => member.organization_id));
  for (const org of owned ?? []) orgIds.add(org.id);
  if (!organizationDashboard && learner && learner.is_deleted !== true && !learner.deleted_at) {
    if (learner.college_id) orgIds.add(learner.college_id);
    if (learner.school_id) orgIds.add(learner.school_id);
  }
  if (!organizationDashboard) {
    for (const sub of assignedSubscriptions) if (sub.organization_id) orgIds.add(sub.organization_id);
  }
  if (identity.org_id) orgIds.add(identity.org_id);
  const scopedOrgIds = organizationDashboard && identity.org_id ? [identity.org_id] : [...orgIds];
  const organizations: Organization[] = scopedOrgIds.length
    ? await checked(supabase.from('organizations').select('id, organization_type, name, email, phone').in('id', scopedOrgIds)) ?? [] : [];
  // Retiring a plan from sale does not cancel an already purchased contract.
  const plans: Plan[] = await checked(supabase.from('plans_cache').select('id, name, plan_code, business_type, applicable_entities, product_id, is_active')) ?? [];
  const own: Subscription[] = await checked(supabase.from('subscription_cache').select('*').eq('user_id', userId).order('subscription_start_date', { ascending: false })) ?? [];
  const orgSubscriptions: Subscription[] = scopedOrgIds.length
    ? await checked(supabase.from('subscription_cache').select('*').in('organization_id', scopedOrgIds).eq('is_organization_subscription', true).order('subscription_start_date', { ascending: false })) ?? [] : [];
  const candidates = [...new Map([...assignedSubscriptions, ...orgSubscriptions, ...own].map(sub => [sub.id, sub])).values()];
  const format = (sub: Subscription, plan: Plan, org?: Organization, seat?: { id: string; expires_at?: string | null }): EntitlementResult => ({
    ...sub, user_id: userId, plan_code: plan.plan_code, plan_name: plan.name, plan_type: plan.name,
    subscription_end_date: seat?.expires_at && (!sub.subscription_end_date || Date.parse(seat.expires_at) < Date.parse(sub.subscription_end_date)) ? seat.expires_at : sub.subscription_end_date,
    is_organization_license: Boolean(org) && !organizationDashboard, organization_wide: Boolean(org) && !seat,
    organization_type: org?.organization_type || sub.organization_type,
    license_assignment_id: seat?.id, organization_name: org?.name, organization_email: org?.email, organization_phone: org?.phone,
    subscription_plans: { id: plan.id, name: plan.name, plan_code: plan.plan_code },
  });
  for (const sub of candidates) {
    const plan = plans.find(plan => plan.id === sub.plan_id);
    if (!plan || !isSubscriptionCurrent(sub) || (sub.product_id && plan.product_id && sub.product_id !== plan.product_id)) continue;
    const org = organizations.find(org => org.id === sub.organization_id);
    if (!sub.is_organization_subscription || !org) continue;
    const entity = org.organization_type === 'company' ? 'recruitment' : org.organization_type || expectedEntity;
    if (!entity || (expectedEntity && entity !== expectedEntity) || !plan.applicable_entities.some(value => value === entity || value === 'all')) continue;
    if (organizationDashboard) {
      if (plan.business_type === 'b2b') return format(sub, plan, org);
      continue; // Bulk learner seats do not unlock the purchaser's admin dashboard.
    }
    const seat = seats?.find(seat => seat.organization_subscription_id === sub.id && seat.status === 'active' && (!seat.expires_at || Date.parse(seat.expires_at) > Date.now()));
    if (seat) return format(sub, plan, org, seat);
    const explicitSeat = seats?.some(seat => seat.organization_subscription_id === sub.id);
    if (!explicitSeat && plan.business_type === 'b2b') return format(sub, plan, org);
  }
  if (organizationDashboard || profile?.metadata?.subscription_selection_required === true) return null;
  for (const sub of own) {
    const plan = plans.find(plan => plan.id === sub.plan_id);
    const applicable = plan?.applicable_entities.some(entity => entity === 'all' || organizations.some(org => org.organization_type === entity));
    if (plan?.business_type === 'b2c' && applicable && !sub.is_organization_subscription && isSubscriptionCurrent(sub) && (!sub.product_id || !plan.product_id || sub.product_id === plan.product_id)) return format(sub, plan);
  }
  return null;
}

/** App-owned onboarding state; finishing signup does not select a subscription. */
export async function completePlanSelection(supabase: SupabaseClient, userId: string, planId?: string): Promise<void> {
  if (planId) {
    const activated = await checked(supabase.from('subscription_cache').select('id').eq('user_id', userId)
      .eq('plan_id', planId).eq('status', 'active').limit(1).maybeSingle());
    if (!activated) throw new Error('Subscription activation is still being synchronized');
  }
  const profile = await checked<Profile>(supabase.from('users').select('metadata').eq('id', userId).maybeSingle());
  if (!profile) throw new Error('Application profile is not ready');
  if (profile.metadata?.subscription_selection_required !== true) return;
  await checked(supabase.from('users').update({ metadata: { ...profile.metadata, subscription_selection_required: false } }).eq('id', userId).select('id').single());
}
