import { createDb, type DbClient } from './db';
import { mapRolesToOrgMemberRole, LEARNER_SSO_ROLES } from './role-mapper';
import type { PagesEnv } from './types';
import {
  UserCreatedSchema,
  UserDeletedSchema,
  UserEmailVerifiedSchema,
  OrganizationCreatedSchema,
  OrganizationUpdatedSchema,
  MembershipPayloadSchema,
  MembershipRemovedSchema,
  SubscriptionCreatedSchema,
  SubscriptionUpdatedSchema,
  SubscriptionCancelledSchema,
} from './sync-schemas';

export type SyncResult =
  | { success: true }
  | { success: false; error: string; retryable: boolean; errorCode?: string };

function ok(): SyncResult {
  return { success: true };
}

function fail(code: string, message: string, retryable: boolean): SyncResult {
  return { success: false, errorCode: code, error: message, retryable };
}

function safeParseJSON(value: string, fallback: unknown[]): unknown[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export class SyncService {
  private db: DbClient;

  constructor(env: PagesEnv) {
    this.db = createDb(env);
  }

  async syncUser(data: unknown): Promise<SyncResult> {
    const parsed = UserCreatedSchema.parse(data);
    const userMetadata = parsed.user_metadata ?? {};

    const updatePayload: Record<string, unknown> = { id: parsed.id };
    if (parsed.email !== undefined) updatePayload.email = parsed.email;

    if (userMetadata.firstName != null) {
      updatePayload.firstName = userMetadata.firstName;
    } else if (userMetadata.first_name != null) {
      updatePayload.firstName = userMetadata.first_name;
    }

    if (userMetadata.lastName != null) {
      updatePayload.lastName = userMetadata.lastName;
    } else if (userMetadata.last_name != null) {
      updatePayload.lastName = userMetadata.last_name;
    }

    if (userMetadata.role !== undefined) {
      updatePayload.role = userMetadata.role;
    }

    if (userMetadata.contact_number !== undefined) {
      updatePayload.phone = userMetadata.contact_number;
    } else if (userMetadata.phone !== undefined) {
      updatePayload.phone = userMetadata.phone;
    }

    const { error } = await this.db.from('users').upsert(updatePayload, { onConflict: 'id' });
    if (error) return fail('DB_ERROR', error.message, true);
    return ok();
  }

  async deleteUser(data: unknown): Promise<SyncResult> {
    const parsed = UserDeletedSchema.parse(data);
    const { error } = await this.db.from('users').delete().eq('id', parsed.user_id);
    if (error) return fail('DB_ERROR', error.message, true);
    return ok();
  }

  async verifyEmail(data: unknown): Promise<SyncResult> {
    const parsed = UserEmailVerifiedSchema.parse(data);
    const { data: existing } = await this.db.from('users')
      .select('metadata')
      .eq('id', parsed.user_id)
      .single();

    const existingMetadata = (existing?.metadata as Record<string, unknown>) ?? {};
    const { error } = await this.db.from('users')
      .update({ metadata: { ...existingMetadata, is_email_verified: true } })
      .eq('id', parsed.user_id);
    if (error) return fail('DB_ERROR', error.message, true);
    return ok();
  }

  async syncOrgCreated(data: unknown): Promise<SyncResult> {
    const parsed = OrganizationCreatedSchema.parse(data);
    const metadata = parsed.metadata ?? {};

    const orgPayload: Record<string, unknown> = {
      id: parsed.id,
      name: parsed.name,
    };

    if (parsed.slug) orgPayload.slug = parsed.slug;
    if (metadata.organization_type !== undefined) orgPayload.organization_type = metadata.organization_type;
    if (metadata.email !== undefined) orgPayload.email = metadata.email;
    if (metadata.phone !== undefined) orgPayload.phone = metadata.phone;
    if (metadata.address !== undefined) orgPayload.address = metadata.address;
    if (metadata.city !== undefined) orgPayload.city = metadata.city;
    if (metadata.state !== undefined) orgPayload.state = metadata.state;
    if (metadata.country !== undefined) orgPayload.country = metadata.country;
    if (metadata.pincode !== undefined) orgPayload.pincode = metadata.pincode;
    if (metadata.website !== undefined) orgPayload.website = metadata.website;
    if (metadata.established_year !== undefined) orgPayload.established_year = metadata.established_year;

    orgPayload.verification_status = 'approved';
    orgPayload.is_active = true;
    orgPayload.approval_status = 'approved';
    orgPayload.account_status = 'active';
    orgPayload.recruitment_enabled = metadata.recruitment_enabled ?? false;
    orgPayload.max_recruiters = metadata.max_recruiters ?? 10;

    if (parsed.created_by) {
      orgPayload.admin_id = parsed.created_by;
    }

    const { error } = await this.db.from('organizations').upsert(orgPayload, { onConflict: 'id' });
    if (error) return fail('DB_ERROR', error.message, true);
    return ok();
  }

  async syncOrgUpdated(data: unknown): Promise<SyncResult> {
    const parsed = OrganizationUpdatedSchema.parse(data);
    const metadata = parsed.metadata ?? {};

    const updatePayload: Record<string, unknown> = {};
    if (parsed.name !== undefined) updatePayload.name = parsed.name;
    else if (metadata.name !== undefined) updatePayload.name = metadata.name;
    if (metadata.organization_type !== undefined) updatePayload.organization_type = metadata.organization_type;
    if (metadata.email !== undefined) updatePayload.email = metadata.email;
    if (metadata.phone !== undefined) updatePayload.phone = metadata.phone;
    if (metadata.address !== undefined) updatePayload.address = metadata.address;
    if (metadata.city !== undefined) updatePayload.city = metadata.city;
    if (metadata.state !== undefined) updatePayload.state = metadata.state;
    if (metadata.country !== undefined) updatePayload.country = metadata.country;
    if (metadata.pincode !== undefined) updatePayload.pincode = metadata.pincode;
    if (metadata.website !== undefined) updatePayload.website = metadata.website;
    if (metadata.established_year !== undefined) updatePayload.established_year = metadata.established_year;
    if (metadata.recruitment_enabled !== undefined) updatePayload.recruitment_enabled = metadata.recruitment_enabled;
    if (metadata.max_recruiters !== undefined) updatePayload.max_recruiters = metadata.max_recruiters;

    updatePayload.updated_at = new Date().toISOString();

    const { error } = await this.db.from('organizations')
      .update(updatePayload)
      .eq('id', parsed.id);
    if (error) return fail('DB_ERROR', error.message, true);
    return ok();
  }

  async syncMembership(data: unknown): Promise<SyncResult> {
    const parsed = MembershipPayloadSchema.parse(data);
    const roles = parsed.roles ?? ['member'];

    try {
      const orgMemberRole = mapRolesToOrgMemberRole(roles);

      const { error: memberError } = await this.db.from('organization_members').upsert({
        user_id: parsed.user_id,
        organization_id: parsed.organization_id,
        role: orgMemberRole,
        status: parsed.status ?? 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,organization_id' });
      if (memberError) return fail('DB_ERROR', memberError.message, true);

      const { error: userError } = await this.db.from('users')
        .update({ organizationId: parsed.organization_id })
        .eq('id', parsed.user_id);
      if (userError) return fail('DB_ERROR', userError.message, true);

      if (roles.some(r => LEARNER_SSO_ROLES.has(r))) {
        return await this.handleLearnerOrgAssignment(parsed);
      }

      return ok();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('23503') || message.includes('foreign key constraint')) {
        if (message.includes('user_id')) {
          return fail('NOT_FOUND', `User ${parsed.user_id} not found`, true);
        }
        if (message.includes('organization_id')) {
          return fail('NOT_FOUND', `Organization ${parsed.organization_id} not found`, true);
        }
      }
      return fail('INTERNAL_ERROR', message, true);
    }
  }

  private async handleLearnerOrgAssignment(parsed: any): Promise<SyncResult> {
    const { data: users } = await this.db.from('users')
      .select('email, firstName, lastName')
      .eq('id', parsed.user_id);
    const user = users?.[0];

    if (user) {
      const learnerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
      const { error: learnerError } = await this.db.from('learners').upsert({
        user_id: parsed.user_id,
        name: learnerName,
        email: user.email,
        approval_status: 'approved',
      }, { onConflict: 'user_id' });
      if (learnerError) return fail('DB_ERROR', learnerError.message, true);
    }

    const { data: orgs } = await this.db.from('organizations')
      .select('organization_type')
      .eq('id', parsed.organization_id);
    const orgType = orgs?.[0]?.organization_type;

    const learnerUpdate: Record<string, unknown> = {};
    if (orgType === 'school') {
      learnerUpdate.school_id = parsed.organization_id;
    } else if (orgType === 'college') {
      learnerUpdate.college_id = parsed.organization_id;
    }

    if (Object.keys(learnerUpdate).length > 0) {
      const { error: updateError } = await this.db.from('learners')
        .update(learnerUpdate)
        .eq('user_id', parsed.user_id);
      if (updateError) return fail('DB_ERROR', updateError.message, true);
    }

    return ok();
  }

  async removeMembership(data: unknown): Promise<SyncResult> {
    const parsed = MembershipRemovedSchema.parse(data);

    const { error: deleteError } = await this.db.from('organization_members')
      .delete()
      .eq('user_id', parsed.user_id)
      .eq('organization_id', parsed.organization_id);
    if (deleteError) return fail('DB_ERROR', deleteError.message, true);

    const { data: remaining } = await this.db.from('organization_members')
      .select('organization_id')
      .eq('user_id', parsed.user_id);
    const { error: updateError } = await this.db.from('users')
      .update({ organizationId: remaining?.[0]?.organization_id ?? null })
      .eq('id', parsed.user_id);
    if (updateError) return fail('DB_ERROR', updateError.message, true);

    return ok();
  }

  async syncSubscriptionCreated(data: unknown): Promise<SyncResult> {
    const parsed = SubscriptionCreatedSchema.parse(data);
    const subPayload: Record<string, unknown> = {
      id: parsed.id,
      user_id: parsed.user_id,
      organization_id: parsed.organization_id ?? null,
      plan_id: parsed.plan_id ?? null,
      plan_code: parsed.plan_code,
      plan_name: parsed.plan_type ?? null,
      plan_type: parsed.plan_type ?? null,
      plan_amount: parsed.plan_amount ?? 0,
      billing_cycle: parsed.billing_cycle ?? null,
      status: parsed.status ?? 'pending',
      features: Array.isArray(parsed.features)
        ? parsed.features
        : typeof parsed.features === 'string'
          ? safeParseJSON(parsed.features, [])
          : [],
      subscription_start_date: parsed.subscription_start_date ?? null,
      subscription_end_date: parsed.subscription_end_date ?? null,
      is_organization_subscription:
        typeof parsed.is_organization_subscription === 'string'
          ? parsed.is_organization_subscription === 'true'
          : (parsed.is_organization_subscription ?? false),
      seat_count: parsed.seat_count ?? 1,
      assigned_seats: parsed.assigned_seats ?? 0,
      product_id: parsed.product_id ?? null,
      auth_updated_at: parsed.updated_at ?? new Date().toISOString(),
    };

    const { error } = await this.db.from('subscription_cache').upsert(subPayload, { onConflict: 'id' });
    if (error) return fail('DB_ERROR', error.message, true);
    return ok();
  }

  async syncSubscriptionUpdated(data: unknown): Promise<SyncResult> {
    const parsed = SubscriptionUpdatedSchema.parse(data);
    const subPayload: Record<string, unknown> = {};

    if (parsed.user_id !== undefined) subPayload.user_id = parsed.user_id;
    if (parsed.organization_id !== undefined) subPayload.organization_id = parsed.organization_id;
    if (parsed.plan_id !== undefined) subPayload.plan_id = parsed.plan_id;
    if (parsed.plan_code !== undefined) subPayload.plan_code = parsed.plan_code;
    if (parsed.plan_type !== undefined) {
      subPayload.plan_type = parsed.plan_type;
      subPayload.plan_name = parsed.plan_type;
    }
    if (parsed.plan_amount !== undefined) subPayload.plan_amount = parsed.plan_amount;
    if (parsed.billing_cycle !== undefined) subPayload.billing_cycle = parsed.billing_cycle;
    if (parsed.status !== undefined) subPayload.status = parsed.status;
    if (parsed.features !== undefined) {
      subPayload.features = Array.isArray(parsed.features)
        ? parsed.features
        : typeof parsed.features === 'string'
          ? safeParseJSON(parsed.features, [])
          : [];
    }
    if (parsed.subscription_start_date !== undefined) subPayload.subscription_start_date = parsed.subscription_start_date;
    if (parsed.subscription_end_date !== undefined) subPayload.subscription_end_date = parsed.subscription_end_date;
    if (parsed.is_organization_subscription !== undefined) {
      subPayload.is_organization_subscription =
        typeof parsed.is_organization_subscription === 'string'
          ? parsed.is_organization_subscription === 'true'
          : parsed.is_organization_subscription;
    }
    if (parsed.seat_count !== undefined) subPayload.seat_count = parsed.seat_count;
    if (parsed.assigned_seats !== undefined) subPayload.assigned_seats = parsed.assigned_seats;
    if (parsed.product_id !== undefined) subPayload.product_id = parsed.product_id;

    subPayload.auth_updated_at = parsed.updated_at ?? new Date().toISOString();

    const { error } = await this.db.from('subscription_cache')
      .update(subPayload)
      .eq('id', parsed.id);
    if (error) return fail('DB_ERROR', error.message, true);
    return ok();
  }

  async syncSubscriptionCancelledOrExpired(data: unknown, eventType: 'subscription.cancelled' | 'subscription.expired'): Promise<SyncResult> {
    const parsed = SubscriptionCancelledSchema.parse(data);
    const status = eventType === 'subscription.cancelled' ? 'cancelled' : 'expired';
    const { error } = await this.db.from('subscription_cache')
      .update({ status, auth_updated_at: new Date().toISOString() })
      .eq('id', parsed.id);
    if (error) return fail('DB_ERROR', error.message, true);
    return ok();
  }
}
