/**
 * AI Credits Shared Service
 *
 * Used by all AI endpoints (ai-tutor, career, educator, question-generation).
 * Wraps the Supabase RPC functions from the credits migration.
 *
 * Key design decisions:
 * - check_ai_credits is ADVISORY ONLY (TOCTOU risk — see migration comment).
 *   It is used for early rejection (UX), not as an authorization gate.
 * - deduct_ai_credits is the ONLY safe gate — it uses FOR UPDATE row lock.
 * - All deductions require a requestId for idempotency.
 * - Token cost = ROUND(total_tokens / 1000 * creditRate, 2) — matches DB tokens_to_credits() formula.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default credit rate: 2 credits per 1000 tokens. Matches plan_ai_credit_config seed data. */
export const DEFAULT_CREDIT_RATE = 2.0;

/** Valid feature codes — used for analytics grouping in ai_credit_transactions and ai_usage_logs */
export const FEATURE_CODES = {
  AI_TUTOR: 'ai_tutor',
  CAREER_AI: 'career_ai',
  EDUCATOR_AI: 'educator_ai',
  QUESTION_GENERATION: 'question_generation',
} as const;

export type FeatureCode = (typeof FEATURE_CODES)[keyof typeof FEATURE_CODES];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreditBalance {
  user_id: string;
  credit_balance: number;
  last_transaction_at: string | null;
  total_credits_consumed: number;
  total_credits_purchased: number;
  total_credits_granted: number;
  total_credits_refunded: number;
}

export interface CreditCheckResult {
  has_sufficient: boolean;
  balance: number;
  required: number;
  reason: 'ok' | 'insufficient_balance' | 'no_account';
}

export interface DeductResult {
  success: boolean;
  idempotent: boolean;
  transaction_id: string;
  balance_before: number;
  balance_after: number;
  credits_deducted: number;
  message?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface WithAICreditsInput<T> {
  userId: string;
  featureCode: FeatureCode;
  endpoint: string;
  /** Unique per-request ID for idempotency. Generate with crypto.randomUUID(). */
  requestId: string;
  estimatedTokens: number;
  model?: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
  execute: () => Promise<{
    data: T;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  }>;
}

export interface WithAICreditsResult<T> {
  data: T;
  creditsDeducted: number;
  balanceAfter: number;
  usage: TokenUsage;
}

// ─── Numeric coercion helper ──────────────────────────────────────────────────
//
// Supabase JS deserializes Postgres `numeric` columns as strings (e.g. "323.33")
// to preserve arbitrary precision. All credit/token fields must be coerced to
// JS number at the RPC boundary so callers can do arithmetic safely.

function n(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string') {
    const parsed = parseFloat(v);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// ─── Error helpers ────────────────────────────────────────────────────────────

export function creditsError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): { response: Response } {
  return {
    response: new Response(
      JSON.stringify({ success: false, error: { code, message, details: details ?? {} } }),
      { status, headers: { 'Content-Type': 'application/json' } }
    ),
  };
}

// ─── Token estimation ─────────────────────────────────────────────────────────

/**
 * Rough token estimate from text length.
 * Rule of thumb: 1 token ≈ 4 characters.
 * Adds a 20% buffer for safety.
 */
export function estimateTokens(text: string, bufferMultiplier = 1.2): number {
  const raw = Math.ceil(text.length / 4);
  return Math.ceil(raw * bufferMultiplier);
}

/**
 * Calculate credit cost from token usage.
 * Matches the DB formula: ROUND((total_tokens / 1000) * credit_rate, 2).
 * creditRate = credits per 1000 tokens (default 2.0 matches seed data).
 * Returns 0 for zero or negative tokens.
 * Example: 323.333 tokens-worth → 323.33 credits.
 */
export function calculateCreditCost(totalTokens: number, creditRate = DEFAULT_CREDIT_RATE): number {
  if (totalTokens <= 0) return 0;
  return Math.round((totalTokens / 1000) * creditRate * 100) / 100;
}

// ─── Core RPC wrappers ────────────────────────────────────────────────────────

/**
 * Get user's current credit balance.
 * Returns a zero-balance object if the account does not exist yet.
 */
export async function getCreditBalance(
  supabase: SupabaseClient,
  userId: string
): Promise<CreditBalance> {
  const { data, error } = await supabase.rpc('get_ai_credit_balance', {
    p_user_id: userId,
  });

  if (error) {
    console.error('[ai-credits] get_ai_credit_balance error:', error.message);
    // Return safe zero-balance rather than throwing — callers handle missing accounts
    return {
      user_id: userId,
      credit_balance: 0,
      last_transaction_at: null,
      total_credits_consumed: 0,
      total_credits_purchased: 0,
      total_credits_granted: 0,
      total_credits_refunded: 0,
    };
  }

  const raw = data as Record<string, unknown>;
  return {
    user_id:                  typeof raw.user_id === 'string' ? raw.user_id : userId,
    credit_balance:           n(raw.credit_balance),
    last_transaction_at:      typeof raw.last_transaction_at === 'string' ? raw.last_transaction_at : null,
    total_credits_consumed:   n(raw.total_credits_consumed),
    total_credits_purchased:  n(raw.total_credits_purchased),
    total_credits_granted:    n(raw.total_credits_granted),
    total_credits_refunded:   n(raw.total_credits_refunded),
  };
}

/**
 * Advisory credit check — TOCTOU risk, use for UX only.
 * The real enforcement gate is deductCredits().
 */
export async function checkCredits(
  supabase: SupabaseClient,
  userId: string,
  requiredCredits: number
): Promise<CreditCheckResult> {
  const { data, error } = await supabase.rpc('check_ai_credits', {
    p_user_id: userId,
    p_required_credits: requiredCredits,
  });

  if (error) {
    console.error('[ai-credits] check_ai_credits error:', error.message);
    return {
      has_sufficient: false,
      balance: 0,
      required: requiredCredits,
      reason: 'no_account',
    };
  }

  const raw = data as Record<string, unknown>;
  return {
    has_sufficient: raw.has_sufficient === true,
    balance:        n(raw.balance),
    required:       n(raw.required),
    reason:         (raw.reason as CreditCheckResult['reason']) ?? 'no_account',
  };
}

/**
 * Atomically deduct credits. This is the ONLY safe enforcement gate.
 * Throws if insufficient balance or monthly limit exceeded.
 * Idempotent: same userId + featureCode + requestId never deducts twice.
 */
export async function deductCredits(
  supabase: SupabaseClient,
  params: {
    userId: string;
    amount: number;
    featureCode: FeatureCode;
    requestId: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<DeductResult> {
  const { data, error } = await supabase.rpc('deduct_ai_credits', {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_feature: params.featureCode,
    p_metadata: params.metadata ?? {},
    p_notes: params.notes ?? null,
    p_request_id: params.requestId,
  });

  if (error) {
    // Parse the Postgres exception message to map to structured errors
    const msg = error.message ?? '';
    if (msg.includes('Insufficient credits')) {
      throw Object.assign(new Error(msg), { code: 'INSUFFICIENT_CREDITS', status: 402 });
    }
    if (msg.includes('not found') || msg.includes('No credit account')) {
      throw Object.assign(new Error(msg), { code: 'INSUFFICIENT_CREDITS', status: 402 });
    }
    throw Object.assign(new Error(msg), { code: 'CREDIT_DEDUCTION_FAILED', status: 500 });
  }

  const raw = data as Record<string, unknown>;
  return {
    success:          raw.success === true,
    idempotent:       raw.idempotent === true,
    transaction_id:   typeof raw.transaction_id === 'string' ? raw.transaction_id : '',
    balance_before:   n(raw.balance_before),
    balance_after:    n(raw.balance_after),
    credits_deducted: n(raw.credits_deducted),
    message:          typeof raw.message === 'string' ? raw.message : undefined,
  };
}

/**
 * Log AI usage to ai_usage_logs.
 * Idempotent: same userId + featureCode + requestId logs only once.
 * Non-throwing — logs errors but does not fail the request.
 */
export async function logAiUsage(
  supabase: SupabaseClient,
  params: {
    userId: string;
    featureCode: FeatureCode;
    endpoint: string;
    modelUsed: string;
    promptTokens: number;
    completionTokens: number;
    costInCredits: number;
    requestId: string;
    conversationId?: string;
    requestMetadata?: Record<string, unknown>;
    latencyMs?: number;
    status?: 'success' | 'error' | 'timeout' | 'rate_limited' | 'insufficient_credits';
    creditsPerThousand?: number;  // snapshot of rate used — stored in ai_usage_logs.credit_rate
    upstreamCostUsd?: number;     // real USD cost from OpenRouter usage.cost (internal only, never shown to users)
  }
): Promise<string | null> {
  const { data, error } = await supabase.rpc('log_ai_usage', {
    p_user_id:              params.userId,
    p_feature:              params.featureCode,
    p_endpoint:             params.endpoint,
    p_model_used:           params.modelUsed,
    p_prompt_tokens:        params.promptTokens,
    p_completion_tokens:    params.completionTokens,
    p_cost_in_credits:      params.costInCredits,
    p_conversation_id:      params.conversationId        ?? null,
    p_request_metadata:     params.requestMetadata       ?? {},
    p_latency_ms:           params.latencyMs             ?? null,
    p_status:               params.status                ?? 'success',
    p_credits_per_1000:     params.creditsPerThousand    ?? DEFAULT_CREDIT_RATE,
    p_request_id:           params.requestId,
    p_openrouter_cost_usd:  params.upstreamCostUsd       ?? null,
  });

  if (error) {
    // Non-fatal — log but don't throw
    console.error('[ai-credits] log_ai_usage error:', error.message);
    return null;
  }

  return data as string;
}

// ─── Streaming credit helpers ─────────────────────────────────────────────────

export interface StreamTokenCapture {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  upstreamCostUsd?: number;
  captured: boolean; // true = real OpenRouter counts, false = fallback estimate
}

/**
 * Parse a single OpenRouter SSE chunk and update the token capture state.
 * Call this for every parsed SSE chunk inside your stream loop.
 * Uses the LAST chunk with usage data (overwrites) — OpenRouter sends the
 * accurate final count in the last chunk with choices:[].
 *
 * Usage:
 *   const capture = createTokenCapture();
 *   // inside SSE loop:
 *   updateTokenCapture(capture, parsed);
 */
export function createTokenCapture(): StreamTokenCapture {
  return { promptTokens: 0, completionTokens: 0, totalTokens: 0, upstreamCostUsd: undefined, captured: false };
}

export function updateTokenCapture(capture: StreamTokenCapture, parsed: Record<string, unknown>): void {
  const usage = parsed.usage as Record<string, unknown> | undefined;
  if (usage?.total_tokens) {
    capture.promptTokens     = typeof usage.prompt_tokens     === 'number' ? usage.prompt_tokens     : 0;
    capture.completionTokens = typeof usage.completion_tokens === 'number' ? usage.completion_tokens : 0;
    capture.totalTokens      = typeof usage.total_tokens      === 'number' ? usage.total_tokens      : 0;
    capture.upstreamCostUsd  = typeof usage.cost              === 'number' ? usage.cost              : undefined;
    capture.captured         = true;
  }
}

export interface StreamCreditParams {
  supabase: SupabaseClient;
  userId: string;
  featureCode: FeatureCode;
  requestId: string;
  capture: StreamTokenCapture;
  /** Fallback text used to estimate prompt tokens when capture.captured = false */
  fallbackPromptText: string;
  /** Fallback text used to estimate completion tokens when capture.captured = false */
  fallbackCompletionText: string;
  endpoint: string;
  modelUsed: string;
  conversationId?: string;
  requestMetadata?: Record<string, unknown>;
  latencyMs: number;
  /** Optional logger — defaults to console */
  log?: (msg: string, data?: Record<string, unknown>) => void;
}

export interface StreamCreditResult {
  finalPromptTokens: number;
  finalCompletionTokens: number;
  finalTotalTokens: number;
  costInCredits: number;
  actualCostDeducted: number;
  balanceAfter: number | undefined;
}

/**
 * Post-stream credit settlement for streaming AI endpoints.
 *
 * Handles the full post-stream flow:
 * 1. Resolve final token counts (real OpenRouter counts or estimated fallback)
 * 2. Re-read fresh balance from DB
 * 3. Clamp deduction to available balance (drain to 0, never throw)
 * 4. Atomically deduct credits
 * 5. Log usage to ai_usage_logs
 *
 * Non-throwing — all errors are caught and logged internally.
 * Returns the resolved token counts and deduction result for the done event.
 */
export async function settleStreamCredits(params: StreamCreditParams): Promise<StreamCreditResult> {
  const {
    supabase, userId, featureCode, requestId, capture,
    fallbackPromptText, fallbackCompletionText,
    endpoint, modelUsed, conversationId, requestMetadata, latencyMs,
    log = (msg, data) => console.log(`[ai-credits] ${msg}`, data ?? ''),
  } = params;

  // 1. Resolve final token counts
  const finalPromptTokens     = capture.captured ? capture.promptTokens     : estimateTokens(fallbackPromptText);
  const finalCompletionTokens = capture.captured ? capture.completionTokens : estimateTokens(fallbackCompletionText);
  const finalTotalTokens      = capture.captured ? capture.totalTokens      : finalPromptTokens + finalCompletionTokens;
  const costInCredits         = calculateCreditCost(finalTotalTokens);

  log('Token accounting', {
    source: capture.captured ? 'openrouter_real' : 'estimated',
    prompt_tokens: finalPromptTokens,
    completion_tokens: finalCompletionTokens,
    total_tokens: finalTotalTokens,
    cost_credits: costInCredits,
  });

  // 2. Re-read fresh balance (post-stream — balance may have changed)
  const { data: freshBalanceData } = await supabase.rpc('get_ai_credit_balance', { p_user_id: userId });
  const currentBalance: number = freshBalanceData ? parseFloat((freshBalanceData as Record<string, unknown>).credit_balance as string ?? '0') : 0;

  // 3. Clamp to available balance — drain to 0 rather than throwing
  const actualCostDeducted = Math.min(costInCredits, currentBalance);

  let balanceAfter: number | undefined;

  // 4 + 5. Atomic deduction + usage log in a single DB transaction.
  //        chargeAndLogAiUsage() guarantees both writes succeed or neither does.
  if (actualCostDeducted > 0) {
    try {
      const result = await chargeAndLogAiUsage(supabase, {
        userId,
        amount: actualCostDeducted,
        featureCode,
        requestId,
        endpoint,
        modelUsed,
        promptTokens: finalPromptTokens,
        completionTokens: finalCompletionTokens,
        notes: `${featureCode} — ${finalTotalTokens} tokens`,
        deductMetadata: {
          ...(requestMetadata ?? {}),
          prompt_tokens: finalPromptTokens,
          completion_tokens: finalCompletionTokens,
          total_tokens: finalTotalTokens,
          usage_captured: capture.captured,
          actual_cost: costInCredits,
          balance_clamped: actualCostDeducted < costInCredits,
        },
        creditsPerThousand: DEFAULT_CREDIT_RATE,
        conversationId,
        requestMetadata,
        latencyMs,
        upstreamCostUsd: capture.upstreamCostUsd,
      });
      balanceAfter = result.balance_after;
      log('Credits charged and usage logged (atomic)', {
        actual_cost: costInCredits,
        deducted: actualCostDeducted,
        clamped: actualCostDeducted < costInCredits,
        balance_after: balanceAfter,
        idempotent: result.idempotent,
        transaction_id: result.transaction_id,
        usage_log_id: result.usage_log_id,
      });
    } catch (err) {
      console.error('[ai-credits] settleStreamCredits charge+log failed:', err instanceof Error ? err.message : err);
    }
  } else {
    log('Skipping deduction — balance already zero', { actual_cost: costInCredits });
  }

  return { finalPromptTokens, finalCompletionTokens, finalTotalTokens, costInCredits, actualCostDeducted, balanceAfter };
}

/**
 * Pre-flight credit gate for streaming endpoints.
 * Blocks only users with zero balance or no account.
 * Returns null if the user can proceed, or a 402 Response to return immediately.
 */
export async function streamCreditPreflight(
  supabase: SupabaseClient,
  userId: string,
): Promise<Response | null> {
  const check = await checkCredits(supabase, userId, 0.01);
  if (check.reason === 'no_account' || check.balance <= 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Insufficient AI credits. Please purchase more credits to continue.',
        code: 'INSUFFICIENT_CREDITS',
        balance: check.balance,
      }),
      { status: 402, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}

// ─── chargeAndLogAiUsage ──────────────────────────────────────────────────────

export interface ChargeAndLogResult {
  success: boolean;
  idempotent: boolean;
  transaction_id: string;
  usage_log_id: string | null;
  balance_before: number;
  balance_after: number;
  credits_deducted: number;
  message?: string;
}

/**
 * Atomic deduction + usage logging in a single DB transaction.
 *
 * Only for SUCCESSFUL AI calls. The DB function always writes status='success'
 * to ai_usage_logs. For error-path logging (no deduction), use logAiUsage().
 *
 * Replaces the two-step deductCredits() + logAiUsage() pattern.
 * If the deduction succeeds the usage log is guaranteed to exist —
 * there is no window where one write succeeds and the other fails.
 *
 * Idempotent: same requestId never deducts or logs twice on redelivery.
 * Throws on insufficient balance, missing account, empty requestId, or amount ≤ 0.
 */
export async function chargeAndLogAiUsage(
  supabase: SupabaseClient,
  params: {
    // ── Required ────────────────────────────────────────────────────────────
    userId: string;
    amount: number;           // must be > 0
    featureCode: FeatureCode;
    requestId: string;        // must be non-empty
    endpoint: string;
    modelUsed: string;
    promptTokens: number;
    completionTokens: number;
    // ── Optional ────────────────────────────────────────────────────────────
    notes?: string;
    deductMetadata?: Record<string, unknown>;
    creditsPerThousand?: number;
    conversationId?: string;
    requestMetadata?: Record<string, unknown>;
    latencyMs?: number;
    upstreamCostUsd?: number;
  }
): Promise<ChargeAndLogResult> {
  const { data, error } = await supabase.rpc('charge_and_log_ai_usage', {
    p_user_id:             params.userId,
    p_amount:              params.amount,
    p_feature:             params.featureCode,
    p_request_id:          params.requestId,
    p_endpoint:            params.endpoint,
    p_model_used:          params.modelUsed,
    p_prompt_tokens:       params.promptTokens,
    p_completion_tokens:   params.completionTokens,
    p_notes:               params.notes               ?? null,
    p_deduct_metadata:     params.deductMetadata       ?? {},
    p_credits_per_1000:    params.creditsPerThousand   ?? DEFAULT_CREDIT_RATE,
    p_conversation_id:     params.conversationId       ?? null,
    p_request_metadata:    params.requestMetadata      ?? {},
    p_latency_ms:          params.latencyMs            ?? null,
    p_openrouter_cost_usd: params.upstreamCostUsd      ?? null,
  });

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('Insufficient credits')) {
      throw Object.assign(new Error(msg), { code: 'INSUFFICIENT_CREDITS', status: 402 });
    }
    if (msg.includes('No credit account')) {
      throw Object.assign(new Error(msg), { code: 'INSUFFICIENT_CREDITS', status: 402 });
    }
    if (msg.includes('p_request_id') || msg.includes('p_amount')) {
      throw Object.assign(new Error(msg), { code: 'INVALID_REQUEST', status: 400 });
    }
    throw Object.assign(new Error(msg), { code: 'CREDIT_DEDUCTION_FAILED', status: 500 });
  }

  const raw = data as Record<string, unknown>;
  return {
    success:          raw.success === true,
    idempotent:       raw.idempotent === true,
    transaction_id:   typeof raw.transaction_id === 'string' ? raw.transaction_id : '',
    usage_log_id:     typeof raw.usage_log_id   === 'string' ? raw.usage_log_id   : null,
    balance_before:   n(raw.balance_before),
    balance_after:    n(raw.balance_after),
    credits_deducted: n(raw.credits_deducted),
    message:          typeof raw.message === 'string' ? raw.message : undefined,
  };
}

// ─── withAICredits ────────────────────────────────────────────────────────────

/**
 * High-level wrapper for non-streaming AI calls.
 *
 * Flow:
 * 1. Advisory pre-flight check (early rejection for UX)
 * 2. Execute AI provider call
 * 3. Deduct actual tokens (atomic, idempotent)
 * 4. Log usage
 * 5. Return data + updated balance
 *
 * For streaming, use the manual pattern in ai-tutor-chat.ts instead.
 */
export async function withAICredits<T>(
  supabase: SupabaseClient,
  input: WithAICreditsInput<T>
): Promise<WithAICreditsResult<T>> {
  const {
    userId,
    featureCode,
    endpoint,
    requestId,
    estimatedTokens,
    model = 'unknown',
    conversationId,
    metadata = {},
    execute,
  } = input;

  if (!requestId) {
    throw Object.assign(new Error('requestId is required for credit deduction'), {
      code: 'INVALID_REQUEST',
      status: 400,
    });
  }

  // 1. Advisory pre-flight check
  const check = await checkCredits(supabase, userId, estimatedTokens);
  if (!check.has_sufficient) {
    throw Object.assign(
      new Error(
        `Insufficient credits. Balance: ${check.balance}, Required: ${check.required}`
      ),
      { code: 'INSUFFICIENT_CREDITS', status: 402, balance: check.balance, required: check.required }
    );
  }

  // 2. Execute AI provider call
  const startTime = Date.now();
  let result: { data: T; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } };

  try {
    result = await execute();
  } catch (err) {
    // Log failed attempt (no deduction)
    await logAiUsage(supabase, {
      userId,
      featureCode,
      endpoint,
      modelUsed: model,
      promptTokens: 0,
      completionTokens: 0,
      costInCredits: 0,
      requestId,
      conversationId,
      requestMetadata: metadata,
      latencyMs: Date.now() - startTime,
      status: 'error',
    });
    throw Object.assign(err instanceof Error ? err : new Error(String(err)), {
      code: 'AI_PROVIDER_FAILED',
      status: 502,
    });
  }

  const latencyMs = Date.now() - startTime;

  // 3. Calculate actual cost
  const usage = result.usage ?? {};
  const promptTokens = usage.promptTokens ?? 0;
  const completionTokens = usage.completionTokens ?? 0;
  const totalTokens =
    usage.totalTokens ?? (promptTokens + completionTokens || estimatedTokens);
  const costInCredits = calculateCreditCost(totalTokens);

  // 4 + 5. Atomic deduction + usage log in a single DB transaction.
  const chargeResult = await chargeAndLogAiUsage(supabase, {
    userId,
    amount: costInCredits,
    featureCode,
    requestId,
    endpoint,
    modelUsed: model,
    promptTokens,
    completionTokens,
    notes: `${featureCode} usage via ${endpoint}`,
    deductMetadata: {
      ...metadata,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      endpoint,
    },
    creditsPerThousand: DEFAULT_CREDIT_RATE,
    conversationId,
    requestMetadata: metadata,
    latencyMs,
  });

  return {
    data: result.data,
    creditsDeducted: costInCredits,
    balanceAfter: chargeResult.balance_after,
    usage: { promptTokens, completionTokens, totalTokens },
  };
}
