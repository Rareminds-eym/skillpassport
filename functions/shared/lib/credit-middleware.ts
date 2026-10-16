/**
 * Credit Middleware — Enforces metered capability consumption
 * 
 * Pattern: Atomic balance check + optimistic decrement on handler success
 * @module functions/shared/lib/credit-middleware
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { apiError } from '../../lib/response';
import { consumeTenantCredits } from './entitlement-service';

export interface CreditCheckResult {
  allowed: boolean;
  remaining: number;
  reason?: string;
}

export interface CreditEnforceResult {
  allowed: boolean;
  success: boolean;
  remaining: number;
  errorResponse?: Response;
  response?: Response;
}

/**
 * Pre-checks and atomically consumes credits for metered operations
 * (e.g., unlocking a candidate's contact info, sending an outreach invite).
 */
export async function enforceAndConsumeCredits(
  supabase: SupabaseClient,
  tenantId: string,
  featureKey: string,
  cost: number,
  referenceId?: string,
  notes?: string
): Promise<CreditEnforceResult> {
  // 1. Query current balance
  const { data: balanceData, error: balanceError } = await supabase
    .rpc('get_credit_balance', {
      p_tenant_id: tenantId,
      p_feature_key: featureKey,
    });

  if (balanceError) {
    console.error(`[CreditMiddleware] Failed to retrieve credit balance for tenant ${tenantId}, feature ${featureKey}:`, balanceError);
    const errRes = apiError(500, 'LEDGER_ERROR', `Failed to retrieve credit balance: ${balanceError.message}`);
    return {
      allowed: false,
      success: false,
      remaining: 0,
      errorResponse: errRes,
      response: errRes,
    };
  }

  const currentBalance = balanceData?.[0]?.remaining ?? 0;

  if (currentBalance < cost) {
    const errRes = apiError(
      402,
      'INSUFFICIENT_CREDITS',
      `Insufficient '${featureKey}' credits. Required: ${cost}, Remaining: ${currentBalance}. Please upgrade your plan or purchase a credit top-up.`
    );
    return {
      allowed: false,
      success: false,
      remaining: currentBalance,
      errorResponse: errRes,
      response: errRes,
    };
  }

  // 2. Consume credits atomically via double-entry ledger
  const consumptionResult = await consumeTenantCredits(
    supabase,
    tenantId,
    featureKey,
    cost,
    referenceId,
    notes
  );

  if (!consumptionResult.success) {
    console.error(`[CreditMiddleware] Failed to consume credits for tenant ${tenantId}, feature ${featureKey}:`, consumptionResult.error);
    const errRes = apiError(
      402,
      'CREDIT_DEDUCTION_FAILED',
      consumptionResult.error || 'Failed to deduce credits from ledger'
    );
    return {
      allowed: false,
      success: false,
      remaining: currentBalance,
      errorResponse: errRes,
      response: errRes,
    };
  }

  const remaining = consumptionResult.remaining ?? (currentBalance - cost);
  return {
    allowed: true,
    success: true,
    remaining,
  };
}
