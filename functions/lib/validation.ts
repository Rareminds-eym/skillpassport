/**
 * Shared validation utilities for API endpoints
 */

import { z } from 'zod';
import { apiValidationError } from './response';

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

// ══════════════════════════════════════════════════════════════
// Sanitization and general validation utilities
// ══════════════════════════════════════════════════════════════

/**
 * Validate email format using a permissive regex that balances
 * security with usability. Avoids rejecting valid but uncommon email formats.
 * 
 * @param email - Email address to validate
 * @returns true if email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Permissive regex that focuses on basic structure
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate that a string field is present and not empty/whitespace
 * 
 * @param value - Value to validate
 * @returns true if valid, false if missing or empty/whitespace
 */
export function isValidStringField(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate required fields in an object before type assertion
 * 
 * @param obj - Object to validate
 * @param fields - Array of required field names
 * @returns true if all fields are present and valid strings
 */
export function validateRequiredStringFields(obj: unknown, fields: string[]): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const typedObj = obj as Record<string, unknown>;
  return fields.every(field => isValidStringField(typedObj[field]));
}

/**
 * Sanitize user input to prevent XSS, injection attacks, and limit length
 */
export function sanitizeInput(input: string, maxLength: number = 2000): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .normalize('NFKC')
    .replace(/\0/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Generate a conversation title from the first message
 */
export function generateConversationTitle(message: string): string {
  const cleaned = message.replace(/[^\w\s]/g, '').trim();
  return cleaned.length > 50 ? cleaned.slice(0, 47) + '...' : cleaned;
}

/**
 * Validate UUID format (v4)
 */
export function isValidUUID(uuid: string): boolean {
  if (typeof uuid !== 'string') return false;
  if (uuid.length !== 36) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

/**
 * Validate request body size to prevent memory exhaustion
 */
export async function validateRequestSize(
  request: Request,
  maxSizeBytes: number = 1048576
): Promise<{ valid: boolean; error?: string }> {
  const contentLength = request.headers.get('content-length');

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSizeBytes) {
      return {
        valid: false,
        error: `Request body too large. Maximum size: ${maxSizeBytes} bytes`
      };
    }
  }

  return { valid: true };
}
