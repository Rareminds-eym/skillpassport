/**
 * Audit Logging Utilities
 * 
 * Provides structured audit logging for security-sensitive operations.
 * Logs are stored in Supabase for compliance and forensic analysis.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Audit log entry
 */
export interface AuditLog {
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'denied';
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit actions
 */
export const AUDIT_ACTIONS = {
  SUBSCRIPTION_CREATE: 'subscription.create',
  SUBSCRIPTION_UPGRADE: 'subscription.upgrade',
  SUBSCRIPTION_CANCEL: 'subscription.cancel',
  SUBSCRIPTION_PAUSE: 'subscription.pause',
  SUBSCRIPTION_RESUME: 'subscription.resume',
  PAYMENT_BYPASS: 'payment.bypass',
  FEATURE_ACCESS_DENIED: 'feature.access_denied',
  FEATURE_ACCESS_GRANTED: 'feature.access_granted',
  RATE_LIMIT_EXCEEDED: 'rate_limit.exceeded',
  AUTHENTICATION_FAILED: 'auth.failed',
  VALIDATION_FAILED: 'validation.failed',
} as const;

/**
 * Log audit event to console (structured logging)
 */
export function logAuditEvent(log: AuditLog): void {
  console.log(JSON.stringify({
    type: 'AUDIT_LOG',
    ...log,
  }));
}

/**
 * Log audit event to database
 */
export async function logAuditEventToDb(
  supabase: SupabaseClient,
  log: AuditLog
): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        actorId: log.userId,
        action: log.action,
        target: log.resource,
        payload: log.metadata || {},
        ip: log.ipAddress,
        createdAt: log.timestamp,
      });

    if (error) {
      console.error('[AuditLog] Failed to write to database:', error);
      // Fall back to console logging
      logAuditEvent(log);
    }
  } catch (error) {
    console.error('[AuditLog] Unexpected error writing to database:', error);
    // Fall back to console logging
    logAuditEvent(log);
  }
}

/**
 * Create audit log from request context
 */
export function createAuditLog(
  userId: string,
  action: string,
  resource: string,
  result: 'success' | 'failure' | 'denied',
  metadata?: Record<string, any>,
  request?: Request
): AuditLog {
  return {
    timestamp: new Date().toISOString(),
    userId,
    action,
    resource,
    result,
    metadata,
    ipAddress: request?.headers.get('cf-connecting-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  };
}

/**
 * Log subscription creation
 */
export async function logSubscriptionCreation(
  supabase: SupabaseClient,
  userId: string,
  planCode: string,
  result: 'success' | 'failure',
  metadata?: Record<string, any>,
  request?: Request
): Promise<void> {
  const log = createAuditLog(
    userId,
    AUDIT_ACTIONS.SUBSCRIPTION_CREATE,
    `subscription:${planCode}`,
    result,
    { planCode, ...metadata },
    request
  );

  await logAuditEventToDb(supabase, log);
}

/**
 * Log subscription upgrade
 */
export async function logSubscriptionUpgrade(
  supabase: SupabaseClient,
  userId: string,
  fromPlan: string,
  toPlan: string,
  result: 'success' | 'failure',
  metadata?: Record<string, any>,
  request?: Request
): Promise<void> {
  const log = createAuditLog(
    userId,
    AUDIT_ACTIONS.SUBSCRIPTION_UPGRADE,
    `subscription:${toPlan}`,
    result,
    { fromPlan, toPlan, ...metadata },
    request
  );

  await logAuditEventToDb(supabase, log);
}

/**
 * Log payment bypass decision
 */
export async function logPaymentBypass(
  supabase: SupabaseClient,
  userId: string,
  planCode: string,
  reason: string,
  request?: Request
): Promise<void> {
  const log = createAuditLog(
    userId,
    AUDIT_ACTIONS.PAYMENT_BYPASS,
    `subscription:${planCode}`,
    'success',
    { planCode, reason },
    request
  );

  await logAuditEventToDb(supabase, log);
}

/**
 * Log feature access denial
 */
export async function logFeatureAccessDenial(
  supabase: SupabaseClient,
  userId: string,
  feature: string,
  planCode: string,
  reason: string,
  request?: Request
): Promise<void> {
  const log = createAuditLog(
    userId,
    AUDIT_ACTIONS.FEATURE_ACCESS_DENIED,
    `feature:${feature}`,
    'denied',
    { feature, planCode, reason },
    request
  );

  await logAuditEventToDb(supabase, log);
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  userId: string,
  endpoint: string,
  request?: Request
): Promise<void> {
  const log = createAuditLog(
    userId,
    AUDIT_ACTIONS.RATE_LIMIT_EXCEEDED,
    endpoint,
    'denied',
    { endpoint },
    request
  );

  // Only log to console for rate limits (don't spam database)
  logAuditEvent(log);
}

/**
 * Query audit logs for a user
 */
export async function getUserAuditLogs(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<AuditLog[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (options?.action) {
      query = query.eq('action', options.action);
    }

    if (options?.startDate) {
      query = query.gte('timestamp', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('timestamp', options.endDate);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AuditLog] Error querying audit logs:', error);
      return [];
    }

    return data.map(row => ({
      timestamp: row.timestamp,
      userId: row.user_id,
      action: row.action,
      resource: row.resource,
      result: row.result,
      metadata: row.metadata,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
    }));
  } catch (error) {
    console.error('[AuditLog] Unexpected error querying audit logs:', error);
    return [];
  }
}
