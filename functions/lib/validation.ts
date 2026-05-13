/**
 * Zod Validation Schemas — All Payment API Endpoints
 *
 * Every POST endpoint has a strict schema. Query params for GET endpoints
 * are validated inline (simpler, fewer fields).
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------
export const UuidSchema = z.string().uuid('Must be a valid UUID');
export const EmailSchema = z.string().email('Must be a valid email');
export const FeatureKeySchema = z.string().min(1, 'Feature key is required').max(100);
export const BillingPeriodSchema = z.enum(['monthly', 'annual'], {
  errorMap: () => ({ message: 'Must be "monthly" or "annual"' }),
});

// ---------------------------------------------------------------------------
// Payment handlers
// ---------------------------------------------------------------------------
export const CreateOrderSchema = z.object({
  plan_id: UuidSchema,
  billing_cycle: BillingPeriodSchema.optional(),
});

export const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Razorpay order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Razorpay payment ID is required'),
  razorpay_signature: z.string().min(1, 'Razorpay signature is required'),
});

export const CreateAddonOrderSchema = z.object({
  user_id: UuidSchema,
  feature_key: FeatureKeySchema,
  billing_period: BillingPeriodSchema,
});

export const VerifyAddonPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const CreateBundleOrderSchema = z.object({
  user_id: UuidSchema,
  bundle_id: UuidSchema,
  billing_period: BillingPeriodSchema,
});

export const VerifyBundlePaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  bundle_id: UuidSchema,
  billing_period: BillingPeriodSchema,
});

// ---------------------------------------------------------------------------
// Entitlement handlers
// ---------------------------------------------------------------------------
export const CancelAddonSchema = z.object({
  entitlementId: UuidSchema,
});

export const ToggleAutoRenewSchema = z.object({
  entitlementId: UuidSchema,
  autoRenew: z.boolean(),
});

// ---------------------------------------------------------------------------
// Subscription management
// ---------------------------------------------------------------------------
export const CancelSubscriptionSchema = z.object({
  subscription_id: UuidSchema,
});

export const PauseSubscriptionSchema = z.object({
  subscription_id: UuidSchema,
  pause_months: z.number().int().min(1).max(3).optional(),
});

export const ResumeSubscriptionSchema = z.object({
  subscription_id: UuidSchema,
});

export const DeactivateSubscriptionSchema = z.object({
  subscription_id: UuidSchema,
  reason: z.string().max(500).optional(),
});

// ---------------------------------------------------------------------------
// Migration / Analytics
// ---------------------------------------------------------------------------
export const MigrationActionSchema = z.object({
  action: z.enum(['getMigrationMapping', 'calculatePriceProtection', 'getMigrationStatus', 'optOutOfMigration']),
  planCode: z.string().optional(),
  userId: z.string().optional(),
});

export const AnalyticsActionSchema = z.object({
  action: z.enum(['trackEvent', 'getAddOnRevenue', 'getChurnRate', 'getCohortAnalysis', 'getFeatureUsage', 'getAdoptionMetrics']),
  eventType: z.string().optional(),
  featureKey: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  options: z.record(z.any()).optional(),
  cohortDate: z.string().optional(),
  userId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Helper: validate & return parsed data or error response
// ---------------------------------------------------------------------------
import { apiValidationError } from './response';

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown, request?: Request): 
  { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return { success: false, response: apiValidationError(issues, request) };
  }
  return { success: true, data: result.data };
}
