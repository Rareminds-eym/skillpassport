/**
 * AI Credits API hooks
 *
 * Calls the /api/credits/* endpoints built in functions/api/credits/[[path]].ts
 *
 * Uses ssoClient.fetch() — the same pattern as paymentsApiService and all other
 * authenticated API calls in this codebase. ssoClient automatically injects the
 * Bearer token from memory, which is what withAuth() on the server side requires.
 *
 * Plain fetch() with credentials:'include' only sends cookies — it does NOT send
 * the Bearer token, which is why it returns "Unauthorized: no valid token".
 */

import { useState, useEffect, useCallback } from 'react';
import { ssoClient } from '@/shared/api/ssoClient';

// ─── Types matching the API response shapes ───────────────────────────────────

export interface CreditBalance {
  user_id: string;
  // Balance fields (from get_ai_credit_balance RPC)
  credit_balance: number;
  last_transaction_at: string | null;
  total_credits_consumed: number;
  total_credits_purchased: number;
  total_credits_granted: number;
  total_credits_refunded: number;
  // Enriched by get-balance.ts
  subscription_id: string | null;
  plan_id: string | null;
  next_monthly_reset_at: string | null;
  account_created_at: string | null;
}

export interface CreditTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  feature: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TransactionsPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UsageSummary {
  total_requests: number;
  total_tokens: number;
  total_credits: number;
  by_feature: Record<string, { requests: number; tokens: number; credits: number }>;
  period_start: string;
  period_end: string;
}

export interface PlanConfig {
  plan_id: string;
  plan_code: string | null;
  plan_name: string | null;
  credit_grant: number | null;
  welcome_bonus_credits: number | null;
  credits_per_1000_tokens: number | null;
}

// ─── Internal response shape ──────────────────────────────────────────────────

interface ApiResponse {
  success: boolean;
  data?: unknown;
  pagination?: TransactionsPagination;
  error?: { message?: string } | string;
  [key: string]: unknown;
}

// ─── Numeric coercion helper ──────────────────────────────────────────────────
// Supabase serializes Postgres `numeric` columns as strings in JSON (e.g. "323.33").
// Coerce to JS number at the API boundary so all arithmetic in components is safe.
function n(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string') {
    const parsed = parseFloat(v);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function coerceBalance(raw: unknown): CreditBalance {
  const r = raw as Record<string, unknown>;
  return {
    user_id:                  typeof r.user_id === 'string' ? r.user_id : '',
    credit_balance:           n(r.credit_balance),
    last_transaction_at:      typeof r.last_transaction_at === 'string' ? r.last_transaction_at : null,
    total_credits_consumed:   n(r.total_credits_consumed),
    total_credits_purchased:  n(r.total_credits_purchased),
    total_credits_granted:    n(r.total_credits_granted),
    total_credits_refunded:   n(r.total_credits_refunded),
    subscription_id:          typeof r.subscription_id === 'string' ? r.subscription_id : null,
    plan_id:                  typeof r.plan_id === 'string' ? r.plan_id : null,
    next_monthly_reset_at:    typeof r.next_monthly_reset_at === 'string' ? r.next_monthly_reset_at : null,
    account_created_at:       typeof r.account_created_at === 'string' ? r.account_created_at : null,
  };
}

function coerceTransaction(raw: unknown): CreditTransaction {
  const r = raw as Record<string, unknown>;
  return {
    id:               typeof r.id === 'string' ? r.id : '',
    transaction_type: typeof r.transaction_type === 'string' ? r.transaction_type : '',
    amount:           n(r.amount),
    balance_before:   n(r.balance_before),
    balance_after:    n(r.balance_after),
    feature:          typeof r.feature === 'string' ? r.feature : null,
    notes:            typeof r.notes === 'string' ? r.notes : null,
    metadata:         (r.metadata != null && typeof r.metadata === 'object') ? r.metadata as Record<string, unknown> : {},
    created_at:       typeof r.created_at === 'string' ? r.created_at : '',
  };
}

function coercePlanConfig(raw: unknown): PlanConfig {
  const r = raw as Record<string, unknown>;
  return {
    plan_id:                 typeof r.plan_id === 'string' ? r.plan_id : '',
    plan_code:               typeof r.plan_code === 'string' ? r.plan_code : null,
    plan_name:               typeof r.plan_name === 'string' ? r.plan_name : null,
    credit_grant:            r.credit_grant != null ? n(r.credit_grant) : null,
    welcome_bonus_credits:   r.welcome_bonus_credits != null ? n(r.welcome_bonus_credits) : null,
    credits_per_1000_tokens: r.credits_per_1000_tokens != null ? n(r.credits_per_1000_tokens) : null,
  };
}

function coerceUsageSummary(raw: unknown): UsageSummary {
  const r = raw as Record<string, unknown>;
  const byFeatureRaw = (r.by_feature != null && typeof r.by_feature === 'object')
    ? r.by_feature as Record<string, Record<string, unknown>>
    : {};
  const by_feature: UsageSummary['by_feature'] = {};
  for (const [k, v] of Object.entries(byFeatureRaw)) {
    by_feature[k] = { requests: n(v.requests), tokens: n(v.tokens), credits: n(v.credits) };
  }
  return {
    total_requests: n(r.total_requests),
    total_tokens:   n(r.total_tokens),
    total_credits:  n(r.total_credits),
    by_feature,
    period_start:   typeof r.period_start === 'string' ? r.period_start : '',
    period_end:     typeof r.period_end === 'string' ? r.period_end : '',
  };
}

// ─── Module-level cache & in-flight deduplication ────────────────────────────
//
// cache    — stores { data, ts } keyed by full URL string.
//            Entries are served without a network call for TTL ms.
// inFlight — stores the in-progress Promise keyed by full URL string.
//            A second caller for the same URL waits on the same Promise
//            instead of firing a duplicate request.

const cache    = new Map<string, { data: ApiResponse; ts: number }>();
const TTL      = 30_000; // 30 seconds
const inFlight = new Map<string, Promise<ApiResponse>>();

/** Bust all cached entries (e.g. after a mutation). */
export function invalidateCreditsCache(): void {
  cache.clear();
}

// ─── Base fetch helper using ssoClient ───────────────────────────────────────

const BASE = `${window.location.origin}/api/credits`;

async function creditsGet(path: string): Promise<ApiResponse> {
  const url = `${BASE}${path}`;

  // 1. Cache hit — return immediately, no network call
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < TTL) {
    return cached.data;
  }

  // 2. In-flight deduplication — second caller waits on the same Promise
  const existing = inFlight.get(url);
  if (existing) return existing;

  // 3. New request
  const promise = (async (): Promise<ApiResponse> => {
    const res = await ssoClient.fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const json = (await res.json()) as ApiResponse;

    if (!res.ok || !json.success) {
      const msg =
        typeof json.error === 'object'
          ? (json.error?.message ?? 'Request failed')
          : (json.error ?? `HTTP ${res.status}`);
      throw new Error(msg);
    }

    // Store in cache on success
    cache.set(url, { data: json, ts: Date.now() });
    return json;
  })();

  inFlight.set(url, promise);
  promise.finally(() => inFlight.delete(url));

  return promise;
}

// ─── useAiCreditBalance ───────────────────────────────────────────────────────

export function useAiCreditBalance() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Mount effect — fires exactly once; no useCallback in the dep array
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    creditsGet('/balance')
      .then((json) => { if (!cancelled) setBalance(json.data ? coerceBalance(json.data) : null); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load balance'); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // empty — fires exactly once on mount

  // Manual refresh: bust cache entry first so the next call hits the network
  const refetch = useCallback(async () => {
    cache.delete(`${BASE}/balance`);
    setLoading(true);
    setError(null);
    try {
      const json = await creditsGet('/balance');
      setBalance(json.data ? coerceBalance(json.data) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balance');
    } finally {
      setLoading(false);
    }
  }, []);

  return { balance, loading, error, refetch };
}

// ─── useAiCreditTransactions ──────────────────────────────────────────────────

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  feature?: string;
  from?: string;
  to?: string;
}

/** Pure helper — builds a stable query string from filter primitives. */
function buildQS(f: Required<TransactionFilters>): string {
  const params = new URLSearchParams();
  params.set('page',  String(f.page));
  params.set('limit', String(f.limit));
  if (f.type)    params.set('type',    f.type);
  if (f.feature) params.set('feature', f.feature);
  if (f.from)    params.set('from',    f.from);
  if (f.to)      params.set('to',      f.to);
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function useAiCreditTransactions(filters: TransactionFilters = {}) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [pagination, setPagination]     = useState<TransactionsPagination | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Destructure to primitives so the dep array is stable and predictable
  const { page = 1, limit = 10, type, feature, from, to } = filters;

  // Single stable string dep — no more 6-field array, no undefined→value double-fire
  const qs = buildQS({ page, limit, type: type ?? '', feature: feature ?? '', from: from ?? '', to: to ?? '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    creditsGet(`/transactions${qs}`)
      .then((json) => {
        if (!cancelled) {
          setTransactions(Array.isArray(json.data) ? json.data.map(coerceTransaction) : []);
          setPagination(json.pagination ?? null);
        }
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load transactions'); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [qs]); // single stable string dep

  return { transactions, pagination, loading, error };
}

// ─── useAiCreditUsage ─────────────────────────────────────────────────────────

export function useAiCreditUsage(days = 30) {
  const [usage, setUsage]     = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // dep is [days] — a stable number primitive passed from the call site
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    creditsGet(`/usage?days=${days}`)
      .then((json) => { if (!cancelled) setUsage(json.data ? coerceUsageSummary(json.data) : null); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load usage'); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  // Manual refresh: bust cache entry first
  const refetch = useCallback(async (d = days) => {
    cache.delete(`${BASE}/usage?days=${d}`);
    setLoading(true);
    setError(null);
    try {
      const json = await creditsGet(`/usage?days=${d}`);
      setUsage(json.data ? coerceUsageSummary(json.data) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage');
    } finally {
      setLoading(false);
    }
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  return { usage, loading, error, refetch };
}

// ─── useAiPlanConfig ──────────────────────────────────────────────────────────

export function useAiPlanConfig() {
  const [planConfig, setPlanConfig] = useState<PlanConfig | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Mount effect — fires exactly once
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    creditsGet('/plan-config')
      .then((json) => { if (!cancelled) setPlanConfig(json.data ? coercePlanConfig(json.data) : null); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load plan config'); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // empty — fires exactly once on mount

  // Manual refresh: bust cache entry first
  const refetch = useCallback(async () => {
    cache.delete(`${BASE}/plan-config`);
    setLoading(true);
    setError(null);
    try {
      const json = await creditsGet('/plan-config');
      setPlanConfig(json.data ? coercePlanConfig(json.data) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan config');
    } finally {
      setLoading(false);
    }
  }, []);

  return { planConfig, loading, error, refetch };
}
