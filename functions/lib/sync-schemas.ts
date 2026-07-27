import { z } from 'zod';

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

export const MembershipPayloadSchema = z.object({
  user_id: z.string(),
  organization_id: z.string(),
  roles: z.array(z.string()).optional(),
  status: z.string().optional(),
});
export type MembershipPayloadData = z.infer<typeof MembershipPayloadSchema>;

export const MembershipRemovedSchema = z.object({
  user_id: z.string(),
  organization_id: z.string(),
});
export type MembershipRemovedData = z.infer<typeof MembershipRemovedSchema>;

export const SubscriptionCreatedSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  organization_id: z.string().nullable().optional(),
  plan_id: z.string().optional(),
  plan_code: z.string(),
  plan_type: z.string().optional(),
  plan_amount: z.number().optional(),
  billing_cycle: z.string().optional(),
  seat_count: z.number().optional(),
  assigned_seats: z.number().optional(),
  features: z.union([z.array(z.unknown()), z.string()]).optional(),
  status: z.string().optional(),
  subscription_start_date: z.string().optional(),
  subscription_end_date: z.string().nullable().optional(),
  is_organization_subscription: z.union([z.boolean(), z.string()]).optional(),
  product_id: z.string().nullable().optional(),
  updated_at: z.string().optional(),
});
export type SubscriptionCreatedData = z.infer<typeof SubscriptionCreatedSchema>;

export const SubscriptionUpdatedSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  organization_id: z.string().nullable().optional(),
  plan_id: z.string().optional(),
  plan_code: z.string().optional(),
  plan_type: z.string().optional(),
  plan_amount: z.number().optional(),
  billing_cycle: z.string().optional(),
  seat_count: z.number().optional(),
  assigned_seats: z.number().optional(),
  features: z.union([z.array(z.unknown()), z.string()]).optional(),
  status: z.string().optional(),
  subscription_start_date: z.string().optional(),
  subscription_end_date: z.string().nullable().optional(),
  is_organization_subscription: z.union([z.boolean(), z.string()]).optional(),
  product_id: z.string().nullable().optional(),
  updated_at: z.string().optional(),
});
export type SubscriptionUpdatedData = z.infer<typeof SubscriptionUpdatedSchema>;

export const SubscriptionCancelledSchema = z.object({
  id: z.string(),
});
export type SubscriptionCancelledData = z.infer<typeof SubscriptionCancelledSchema>;
