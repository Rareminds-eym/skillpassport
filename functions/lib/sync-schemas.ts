import { z } from 'zod';
import { subscriptionStateSchema } from './subscriptions/current-subscription';

const revisionBinding = {
  plan_revision_id: z.string().uuid().nullish(),
  lifecycle_state: subscriptionStateSchema.nullish(),
  lifecycle_policy: z.record(z.unknown()).nullish(),
  lifecycle_activated_at: z.string().datetime({ offset: true }).nullish(),
};
function validateRevisionBinding(value: { id: string; plan_id?: string; product_id?: string | null; status?: string;
  plan_revision_id?: string | null; lifecycle_state?: z.infer<typeof subscriptionStateSchema> | null;
  lifecycle_policy?: Record<string, unknown> | null; lifecycle_activated_at?: string | null }, context: z.RefinementCtx) {
  const parts = [value.plan_revision_id, value.lifecycle_state, value.lifecycle_policy, value.lifecycle_activated_at];
  if (parts.every(part => part == null)) return;
  const state = value.lifecycle_state;
  if (parts.some(part => part == null) || !state || state.id !== value.id || state.planId !== value.plan_id
    || state.revisionId !== value.plan_revision_id || state.productId !== value.product_id || state.status !== value.status) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Complete matching subscription revision binding required' });
  }
}

export const UserCreatedSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  user_metadata: z.record(z.string(), z.unknown()).optional(),
});
export type UserCreatedData = z.infer<typeof UserCreatedSchema>;

export const UserDeletedSchema = z.object({
  user_id: z.string(),
});
export type UserDeletedData = z.infer<typeof UserDeletedSchema>;

export const UserEmailVerifiedSchema = z.object({
  user_id: z.string(),
});
export type UserEmailVerifiedData = z.infer<typeof UserEmailVerifiedSchema>;

export const OrganizationCreatedSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_by: z.string().optional(),
});
export type OrganizationCreatedData = z.infer<typeof OrganizationCreatedSchema>;

export const OrganizationUpdatedSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type OrganizationUpdatedData = z.infer<typeof OrganizationUpdatedSchema>;

export const OrganizationDeletedSchema = z.object({
  id: z.string(),
  hard: z.boolean().optional(),
  deleted_by: z.string().optional(),
});
export type OrganizationDeletedData = z.infer<typeof OrganizationDeletedSchema>;

export const MembershipPayloadSchema = z.object({
  user_id: z.string(),
  organization_id: z.string(),
  roles: z.array(z.string()).optional(),
  status: z.string().optional(),
  // Producer marker. Only SSO acceptInvite sends 'invite'; it is compared to that
  // literal and otherwise ignored, so a plain string keeps unknown values parseable.
  source: z.string().max(32).optional(),
  // Learner profile keyed by `learners` column names, sent by SSO bulk
  // import so the shadow learners row carries every Settings-displayed field.
  learner_profile: z.record(z.string(), z.unknown()).optional(),
});
export type MembershipPayloadData = z.infer<typeof MembershipPayloadSchema>;

export const MembershipRemovedSchema = z.object({
  user_id: z.string(),
  organization_id: z.string(),
});
export type MembershipRemovedData = z.infer<typeof MembershipRemovedSchema>;

export const SubscriptionCreatedSchema = z.object({
  ...revisionBinding,
  id: z.string(),
  user_id: z.string(),
  organization_id: z.string().nullable().optional(),
  plan_id: z.string().optional(),
  plan_code: z.string(),
  plan_type: z.string().optional(),
  plan_amount: z.coerce.number().optional(),
  billing_cycle: z.string().optional(),
  seat_count: z.coerce.number().optional(),
  assigned_seats: z.coerce.number().optional(),
  features: z.union([z.array(z.unknown()), z.string()]).optional(),
  status: z.string().optional(),
  subscription_start_date: z.string().optional(),
  subscription_end_date: z.string().nullable().optional(),
  is_organization_subscription: z.union([z.boolean(), z.string()]).optional(),
  product_id: z.string().nullable().optional(),
  updated_at: z.string().optional(),
}).superRefine(validateRevisionBinding);
export type SubscriptionCreatedData = z.infer<typeof SubscriptionCreatedSchema>;

export const SubscriptionUpdatedSchema = z.object({
  ...revisionBinding,
  id: z.string(),
  user_id: z.string().optional(),
  organization_id: z.string().nullable().optional(),
  plan_id: z.string().optional(),
  plan_code: z.string().optional(),
  plan_type: z.string().optional(),
  plan_amount: z.coerce.number().optional(),
  billing_cycle: z.string().optional(),
  seat_count: z.coerce.number().optional(),
  assigned_seats: z.coerce.number().optional(),
  features: z.union([z.array(z.unknown()), z.string()]).optional(),
  status: z.string().optional(),
  subscription_start_date: z.string().optional(),
  subscription_end_date: z.string().nullable().optional(),
  is_organization_subscription: z.union([z.boolean(), z.string()]).optional(),
  product_id: z.string().nullable().optional(),
  updated_at: z.string().optional(),
}).superRefine(validateRevisionBinding);
export type SubscriptionUpdatedData = z.infer<typeof SubscriptionUpdatedSchema>;

export const SubscriptionCancelledSchema = z.object({
  id: z.string(),
});
export type SubscriptionCancelledData = z.infer<typeof SubscriptionCancelledSchema>;

export const FacultyCreatedSchema = z.object({
  user_id: z.string(),
  email: z.string(),
  college_id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().nullable().optional(),
  employee_id: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
  qualification: z.string().nullable().optional(),
  experience_years: z.number().nullable().optional(),
  role: z.string().nullable().optional(),
  temp_password: z.string().optional(),
});
export type FacultyCreatedData = z.infer<typeof FacultyCreatedSchema>;
