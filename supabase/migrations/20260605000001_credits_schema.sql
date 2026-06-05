-- ============================================================================
-- AI CREDIT SYSTEM — Full Schema (New Creation)
--
-- Tables:
--   1. plan_ai_credit_config     — Per-plan credit configuration
--   2. ai_credit_accounts        — Per-user credit wallet
--   3. ai_credit_transactions    — Full audit ledger
--   4. ai_usage_logs             — Raw per-request token usage
--
-- Functions:
--   get_plan_credit_config                         — Read plan config
--   get_ai_credit_balance                          — Read user balance
--   check_ai_credits                               — Advisory balance check
--   deduct_ai_credits                              — Atomic credit deduction
--   add_ai_credits                                 — Add credits (all positive types)
--   reset_monthly_ai_credits                       — Monthly cron re-grant
--   expire_ai_credits                              — Expire promotional credits
--   tokens_to_credits                              — Token → credit conversion
--   log_ai_usage                                   — Record one LLM request
--   get_user_ai_usage_summary                      — Usage stats by feature
--   reset_credits_by_subscription_cycle            — Subscription cycle-based credit reset
--   expire_subscription_credits                    — Expire subscription credits on end
--   _set_updated_at                                — Shared updated_at trigger helper
--   _sync_credit_account_on_subscription_change    — Trigger: keep subscription_id current
--   _award_welcome_bonus_on_new_subscription       — Trigger: one-time welcome bonus
--
-- Triggers:
--   trg_plan_credit_config_updated_at  — BEFORE UPDATE on plan_ai_credit_config
--   trg_ai_credits_updated_at          — BEFORE UPDATE on ai_credit_accounts
--   trg_sync_credit_account            — AFTER INSERT OR UPDATE on subscription_cache
--   trg_welcome_bonus_on_subscription  — AFTER INSERT on subscription_cache
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. plan_ai_credit_config
--    Defines the credit behaviour for each billing plan.
-- ============================================================================
CREATE TABLE public.plan_ai_credit_config (
  plan_id                 uuid           NOT NULL,
  credit_grant            numeric(16, 6),
  welcome_bonus_credits   numeric(16, 6) NOT NULL DEFAULT 0,
  credits_per_1000_tokens numeric(10, 4) NOT NULL DEFAULT 1.0,
  is_active               boolean        NOT NULL DEFAULT true,
  created_at              timestamptz    NOT NULL DEFAULT now(),
  updated_at              timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT plan_ai_credit_config_pkey PRIMARY KEY (plan_id),
  -- Referential integrity: plan_id must exist in plans_cache
  CONSTRAINT fk_plan_credit_config_plan
    FOREIGN KEY (plan_id) REFERENCES public.plans_cache(id) ON DELETE CASCADE,
  CONSTRAINT plan_ai_credit_config_credit_grant_check
    CHECK (credit_grant IS NULL OR credit_grant > 0),
  CONSTRAINT plan_ai_credit_config_welcome_bonus_check
    CHECK (welcome_bonus_credits >= 0),
  CONSTRAINT plan_ai_credit_config_token_rate_check
    CHECK (credits_per_1000_tokens > 0)
);

COMMENT ON TABLE public.plan_ai_credit_config IS
  'Per-plan AI credit configuration. Defines how many credits a plan grants on each '
  'reset cycle, the welcome bonus on first activation, and the token-to-credit rate.';

COMMENT ON COLUMN public.plan_ai_credit_config.credit_grant IS
  'Credits added to the user wallet on each monthly reset cycle. NULL = no automatic grant for this plan.';
COMMENT ON COLUMN public.plan_ai_credit_config.welcome_bonus_credits IS
  'One-time credit bonus granted when a user first activates a subscription on this plan. 0 = no bonus.';
COMMENT ON COLUMN public.plan_ai_credit_config.credits_per_1000_tokens IS
  'Conversion rate: credits charged per 1 000 LLM tokens consumed (default 1.0 = 1 credit per 1 000 tokens).';
COMMENT ON COLUMN public.plan_ai_credit_config.is_active IS
  'When false, this plan config is ignored by all runtime lookups.';

-- Partial index: fast lookup of active plan configs (most common query path)
CREATE INDEX idx_plan_credit_config_active
  ON public.plan_ai_credit_config (is_active)
  WHERE is_active = true;

-- ============================================================================
-- 2. ai_credit_accounts
--    One row per user. Global credit pool shared across all AI features.
--    Lifetime counters are maintained for analytics; monthly consumption is
--    derivable from ai_credit_transactions.
-- ============================================================================
CREATE TABLE public.ai_credit_accounts (
  user_id                  uuid           NOT NULL,
  plan_id                  uuid,
  subscription_id          uuid,
  credit_balance           numeric(16, 6) NOT NULL DEFAULT 0,
  total_credits_purchased  numeric(16, 6) NOT NULL DEFAULT 0,
  total_credits_consumed   numeric(16, 6) NOT NULL DEFAULT 0,
  total_credits_refunded   numeric(16, 6) NOT NULL DEFAULT 0,
  total_credits_granted    numeric(16, 6) NOT NULL DEFAULT 0,
  last_transaction_at      timestamptz,
  created_at               timestamptz    NOT NULL DEFAULT now(),
  updated_at               timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT ai_credit_accounts_pkey PRIMARY KEY (user_id),
  -- Referential integrity
  CONSTRAINT fk_ai_credit_accounts_user
    FOREIGN KEY (user_id) REFERENCES public.users_shadow(id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_credit_accounts_plan
    FOREIGN KEY (plan_id) REFERENCES public.plans_cache(id) ON DELETE SET NULL,
  CONSTRAINT fk_ai_credit_accounts_subscription
    FOREIGN KEY (subscription_id) REFERENCES public.subscription_cache(id) ON DELETE SET NULL,
  -- Data integrity
  CONSTRAINT ai_credit_accounts_balance_check   CHECK (credit_balance          >= 0),
  CONSTRAINT ai_credit_accounts_purchased_check CHECK (total_credits_purchased  >= 0),
  CONSTRAINT ai_credit_accounts_consumed_check  CHECK (total_credits_consumed   >= 0),
  CONSTRAINT ai_credit_accounts_refunded_check  CHECK (total_credits_refunded   >= 0),
  CONSTRAINT ai_credit_accounts_granted_check   CHECK (total_credits_granted    >= 0)
);

COMMENT ON TABLE public.ai_credit_accounts IS
  'Per-user AI credit wallet. One global credit pool shared across all AI features. '
  'Lifetime totals (purchased, consumed, granted, refunded) are maintained for analytics; '
  'monthly consumption is derivable from ai_credit_transactions.';

COMMENT ON COLUMN public.ai_credit_accounts.credit_balance IS
  'Current spendable credit balance. Never goes below 0 (enforced by CHECK constraint).';
COMMENT ON COLUMN public.ai_credit_accounts.total_credits_purchased IS
  'Lifetime credits added via purchase or refill transactions.';
COMMENT ON COLUMN public.ai_credit_accounts.total_credits_consumed IS
  'Lifetime credits deducted via deduction transactions.';
COMMENT ON COLUMN public.ai_credit_accounts.total_credits_refunded IS
  'Lifetime credits returned via refund transactions.';
COMMENT ON COLUMN public.ai_credit_accounts.total_credits_granted IS
  'Lifetime credits added via subscription_grant or welcome_bonus transactions.';

-- FK support indexes (Postgres does not auto-create indexes for FK targets)
CREATE INDEX idx_ai_credits_plan
  ON public.ai_credit_accounts (plan_id)
  WHERE plan_id IS NOT NULL;

CREATE INDEX idx_ai_credits_subscription
  ON public.ai_credit_accounts (subscription_id)
  WHERE subscription_id IS NOT NULL;

-- Low-balance alert queries (e.g. "users with < 10 credits")
CREATE INDEX idx_ai_credits_balance
  ON public.ai_credit_accounts (credit_balance);

-- ============================================================================
-- 3. ai_credit_transactions
--    Immutable ledger — every credit movement is recorded here.
-- ============================================================================
CREATE TABLE public.ai_credit_transactions (
  id               uuid           NOT NULL DEFAULT gen_random_uuid(),
  user_id          uuid           NOT NULL,
  transaction_type text           NOT NULL,
  amount           numeric(16, 6) NOT NULL,
  balance_before   numeric(16, 6) NOT NULL,
  balance_after    numeric(16, 6) NOT NULL,
  feature          text,
  notes            text,
  metadata         jsonb          NOT NULL DEFAULT '{}',
  request_id       text,
  created_at       timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT ai_credit_transactions_pkey PRIMARY KEY (id),
  -- Referential integrity
  CONSTRAINT fk_ai_credit_transactions_user
    FOREIGN KEY (user_id) REFERENCES public.users_shadow(id) ON DELETE CASCADE,
  -- Data integrity
  CONSTRAINT ai_credit_transactions_type_check CHECK (
    transaction_type IN (
      'purchase', 'refill', 'subscription_grant', 'admin_adjustment',
      'refund', 'welcome_bonus', 'deduction', 'expiry'
    )
  ),
  CONSTRAINT ai_credit_transactions_balance_before_check CHECK (balance_before >= 0),
  CONSTRAINT ai_credit_transactions_balance_after_check  CHECK (balance_after  >= 0)
);

COMMENT ON TABLE public.ai_credit_transactions IS
  'Immutable audit ledger for every credit movement. '
  'Monthly consumption summaries are derived from this table by filtering on '
  'transaction_type = ''deduction'' and the desired date range.';

COMMENT ON COLUMN public.ai_credit_transactions.transaction_type IS
  'One of: purchase, refill, subscription_grant, admin_adjustment, refund, welcome_bonus, deduction, expiry.';
COMMENT ON COLUMN public.ai_credit_transactions.amount IS
  'Signed amount: positive for credits added, negative for credits removed.';
COMMENT ON COLUMN public.ai_credit_transactions.request_id IS
  'Optional idempotency key (e.g. pgmq msg_id). Prevents double-processing on redelivery.';

-- Idempotency: prevents double-deduction when pgmq redelivers the same message
CREATE UNIQUE INDEX idx_ai_tx_idempotency
  ON public.ai_credit_transactions (user_id, feature, request_id)
  WHERE request_id IS NOT NULL AND transaction_type = 'deduction';

-- Primary access pattern: all transactions for a user, newest first
CREATE INDEX idx_ai_tx_user_created
  ON public.ai_credit_transactions (user_id, created_at DESC);

-- Idempotency lookups by request_id
CREATE INDEX idx_ai_tx_request_id
  ON public.ai_credit_transactions (user_id, request_id)
  WHERE request_id IS NOT NULL;

-- Admin / analytics: filter by type + time range
CREATE INDEX idx_ai_tx_type_created
  ON public.ai_credit_transactions (transaction_type, created_at DESC);

-- Analytics: per-feature breakdown
CREATE INDEX idx_ai_tx_feature
  ON public.ai_credit_transactions (feature)
  WHERE feature IS NOT NULL;

-- Time-range scans (e.g. monthly billing reports)
CREATE INDEX idx_ai_tx_created
  ON public.ai_credit_transactions (created_at DESC);

-- ============================================================================
-- 4. ai_usage_logs
--    Raw per-request token and credit usage. One row per LLM call.
--    Idempotent via request_id (pgmq msg_id).
-- ============================================================================
CREATE TABLE public.ai_usage_logs (
  id                uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL,
  feature           text        NOT NULL,
  endpoint          text        NOT NULL,
  conversation_id   uuid,
  model_used        text        NOT NULL,
  prompt_tokens     integer     NOT NULL DEFAULT 0,
  completion_tokens integer     NOT NULL DEFAULT 0,
  total_tokens      integer     NOT NULL DEFAULT 0,
  cost_in_credits   numeric(16, 6) NOT NULL,
  credit_rate       numeric(10, 6),
  openrouter_cost_usd numeric(16, 8) DEFAULT NULL,
  request_id        text,
  request_metadata  jsonb       NOT NULL DEFAULT '{}',
  latency_ms        integer,
  status            text        NOT NULL DEFAULT 'success',
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_usage_logs_pkey PRIMARY KEY (id),
  -- Referential integrity
  CONSTRAINT fk_ai_usage_logs_user
    FOREIGN KEY (user_id) REFERENCES public.users_shadow(id) ON DELETE CASCADE,
  -- Data integrity
  CONSTRAINT ai_usage_logs_prompt_tokens_check     CHECK (prompt_tokens     >= 0),
  CONSTRAINT ai_usage_logs_completion_tokens_check CHECK (completion_tokens >= 0),
  CONSTRAINT ai_usage_logs_total_tokens_check      CHECK (total_tokens      >= 0),
  CONSTRAINT ai_usage_logs_cost_check              CHECK (cost_in_credits   >= 0),
  CONSTRAINT ai_usage_logs_status_check CHECK (
    status IN ('success', 'error', 'timeout', 'rate_limited', 'insufficient_credits')
  )
);

COMMENT ON TABLE public.ai_usage_logs IS
  'Raw LLM token usage per request. Tokens are internal; cost_in_credits is user-facing. '
  'One row per LLM call. Idempotent via request_id (pgmq msg_id).';

COMMENT ON COLUMN public.ai_usage_logs.cost_in_credits IS
  'Credits deducted = ROUND((total_tokens / 1000) * credit_rate, 2). Rounded to 2 decimal places. Computed by tokens_to_credits().';
COMMENT ON COLUMN public.ai_usage_logs.request_id IS
  'pgmq msg_id — ensures the same job never logs usage twice on redelivery.';
COMMENT ON COLUMN public.ai_usage_logs.feature IS
  'Which AI feature triggered this request: ai_tutor, career_ai, educator_ai, etc.';
COMMENT ON COLUMN public.ai_usage_logs.openrouter_cost_usd IS
  'Actual upstream cost in USD as reported by OpenRouter in the final SSE chunk (usage.cost). '
  'NULL if not available. Internal only — never exposed to users. '
  'Use for margin analysis: compare real provider cost vs credits charged.';

-- Idempotency: prevents duplicate usage logs on pgmq redelivery
CREATE UNIQUE INDEX idx_ai_usage_idempotency
  ON public.ai_usage_logs (user_id, feature, request_id)
  WHERE request_id IS NOT NULL;

-- Primary access pattern: all usage for a user, newest first
CREATE INDEX idx_ai_usage_user_created
  ON public.ai_usage_logs (user_id, created_at DESC);

-- FK support index
CREATE INDEX idx_ai_usage_user
  ON public.ai_usage_logs (user_id);

-- Analytics: per-feature aggregations
CREATE INDEX idx_ai_usage_feature
  ON public.ai_usage_logs (feature);

-- Time-range scans (billing, reporting)
CREATE INDEX idx_ai_usage_created
  ON public.ai_usage_logs (created_at DESC);

-- Conversation thread lookups
CREATE INDEX idx_ai_usage_conversation
  ON public.ai_usage_logs (conversation_id)
  WHERE conversation_id IS NOT NULL;

-- Status filtering (error monitoring, rate-limit analysis)
CREATE INDEX idx_ai_usage_status
  ON public.ai_usage_logs (status);

-- Model cost analysis
CREATE INDEX idx_ai_usage_model
  ON public.ai_usage_logs (model_used);

-- Idempotency lookups by request_id
CREATE INDEX idx_ai_usage_request
  ON public.ai_usage_logs (request_id)
  WHERE request_id IS NOT NULL;

-- Cost analysis: compare upstream USD cost vs internal credits (admin/internal only)
CREATE INDEX idx_ai_usage_openrouter_cost
  ON public.ai_usage_logs (openrouter_cost_usd)
  WHERE openrouter_cost_usd IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.plan_ai_credit_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs          ENABLE ROW LEVEL SECURITY;

-- plan_ai_credit_config
CREATE POLICY "users_view_plan_credit_configs"
  ON public.plan_ai_credit_config FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "service_manage_plan_credit_configs"
  ON public.plan_ai_credit_config FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "deny_anon_plan_credit_configs"
  ON public.plan_ai_credit_config TO anon
  USING (false) WITH CHECK (false);

-- ai_credit_accounts
CREATE POLICY "users_view_own_credits"
  ON public.ai_credit_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_manage_credits"
  ON public.ai_credit_accounts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "deny_anon_credits"
  ON public.ai_credit_accounts TO anon
  USING (false) WITH CHECK (false);

-- ai_credit_transactions
CREATE POLICY "users_view_own_transactions"
  ON public.ai_credit_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_manage_transactions"
  ON public.ai_credit_transactions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "deny_anon_transactions"
  ON public.ai_credit_transactions TO anon
  USING (false) WITH CHECK (false);

-- ai_usage_logs
CREATE POLICY "users_view_own_usage"
  ON public.ai_usage_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_manage_usage"
  ON public.ai_usage_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "deny_anon_usage"
  ON public.ai_usage_logs TO anon
  USING (false) WITH CHECK (false);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Shared updated_at auto-stamp helper
CREATE OR REPLACE FUNCTION public._set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_plan_credit_config_updated_at
  BEFORE UPDATE ON public.plan_ai_credit_config
  FOR EACH ROW EXECUTE FUNCTION public._set_updated_at();

CREATE TRIGGER trg_ai_credits_updated_at
  BEFORE UPDATE ON public.ai_credit_accounts
  FOR EACH ROW EXECUTE FUNCTION public._set_updated_at();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- ============================================================================
-- tokens_to_credits
-- ============================================================================
CREATE FUNCTION public.tokens_to_credits(
  p_total_tokens     integer,
  p_credits_per_1000 numeric DEFAULT 1.0
)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
  -- Returns cost rounded to 2 decimal places: ROUND((tokens / 1000) * rate, 2).
  -- Returns 0 for zero or negative tokens (failed requests before LLM responded).
  -- Example: 323.333 tokens-worth becomes 323.33 credits.
  SELECT CASE
    WHEN p_total_tokens <= 0 THEN 0::numeric
    ELSE ROUND((p_total_tokens::numeric / 1000.0) * p_credits_per_1000, 2)
  END;
$$;

COMMENT ON FUNCTION public.tokens_to_credits IS
  'Convert raw token count → credits rounded to 2 decimal places. '
  'Formula: ROUND((total_tokens / 1000) * credits_per_1000_tokens, 2). '
  'Returns 0 for zero tokens (failed requests). '
  'Example: 323.333 becomes 323.33.';

-- ============================================================================
-- get_plan_credit_config
-- ============================================================================
CREATE FUNCTION public.get_plan_credit_config(p_plan_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'plan_id',                 plan_id,
    'credit_grant',            credit_grant,
    'welcome_bonus_credits',   COALESCE(welcome_bonus_credits, 0),
    'credits_per_1000_tokens', credits_per_1000_tokens
  )
  FROM public.plan_ai_credit_config
  WHERE plan_id = p_plan_id AND is_active = true;
$$;

COMMENT ON FUNCTION public.get_plan_credit_config IS
  'Returns credit configuration for a given plan: credit_grant (recurring reset amount), '
  'welcome_bonus_credits (one-time on activation), and credits_per_1000_tokens (token rate). '
  'Returns NULL if the plan has no active config row.';

-- ============================================================================
-- get_ai_credit_balance
-- ============================================================================
CREATE FUNCTION public.get_ai_credit_balance(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'user_id',                 user_id,
      'credit_balance',          credit_balance,
      'last_transaction_at',     last_transaction_at,
      'total_credits_consumed',  total_credits_consumed,
      'total_credits_purchased', total_credits_purchased,
      'total_credits_granted',   total_credits_granted,
      'total_credits_refunded',  total_credits_refunded
    ),
    jsonb_build_object(
      'user_id',                 p_user_id,
      'credit_balance',          0,
      'last_transaction_at',     NULL,
      'total_credits_consumed',  0,
      'total_credits_purchased', 0,
      'total_credits_granted',   0,
      'total_credits_refunded',  0
    )
  )
  FROM public.ai_credit_accounts
  WHERE user_id = p_user_id;
$$;

COMMENT ON FUNCTION public.get_ai_credit_balance IS
  'Returns the current credit balance and lifetime totals for a user. '
  'If no account exists yet, returns a zeroed object (never raises). '
  'For monthly consumption breakdown, query ai_credit_transactions directly.';

-- ============================================================================
-- check_ai_credits  (advisory — TOCTOU warning)
-- ============================================================================
CREATE FUNCTION public.check_ai_credits(
  p_user_id          uuid,
  p_required_credits numeric
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path TO 'public'
AS $$
DECLARE
  v_account        RECORD;
  v_has_sufficient boolean;
BEGIN
  /*
   * ⚠️ ADVISORY ONLY — never use as an auth gate. TOCTOU risk.
   * Always call deduct_ai_credits() and handle its exceptions.
   */
  SELECT * INTO v_account
  FROM public.ai_credit_accounts
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_sufficient', false,
      'balance',        0,
      'required',       p_required_credits,
      'reason',         'no_account'
    );
  END IF;

  v_has_sufficient := v_account.credit_balance >= p_required_credits;

  RETURN jsonb_build_object(
    'has_sufficient', v_has_sufficient,
    'balance',        v_account.credit_balance,
    'required',       p_required_credits,
    'reason',         CASE WHEN v_has_sufficient THEN 'ok' ELSE 'insufficient_balance' END
  );
END;
$$;

COMMENT ON FUNCTION public.check_ai_credits IS
  '⚠️ Advisory only — subject to TOCTOU race conditions. Use for UI hints (e.g. disabling a button), '
  'never as an enforcement gate. Always call deduct_ai_credits() and handle its exceptions for actual enforcement. '
  'Returns: { has_sufficient, balance, required, reason: "ok" | "insufficient_balance" | "no_account" }';

-- ============================================================================
-- deduct_ai_credits  (atomic, with row lock + pgmq idempotency)
-- ============================================================================
CREATE FUNCTION public.deduct_ai_credits(
  p_user_id    uuid,
  p_amount     numeric,
  p_feature    text,
  p_metadata   jsonb DEFAULT '{}',
  p_notes      text  DEFAULT NULL,
  p_request_id text  DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_before      numeric;
  v_after       numeric;
  v_tx_id       uuid;
  v_existing_id uuid;
BEGIN
  -- Idempotency check: if same pgmq msg_id already deducted, return early
  IF p_request_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM   public.ai_credit_transactions
    WHERE  user_id          = p_user_id
      AND  feature          = p_feature
      AND  request_id       = p_request_id
      AND  transaction_type = 'deduction'
    LIMIT 1;

    IF FOUND THEN
      SELECT credit_balance INTO v_after
      FROM   public.ai_credit_accounts
      WHERE  user_id = p_user_id;

      RETURN jsonb_build_object(
        'success',          true,
        'idempotent',       true,
        'transaction_id',   v_existing_id,
        'balance_after',    COALESCE(v_after, 0),
        'credits_deducted', p_amount,
        'message',          'Duplicate pgmq msg_id — returning existing transaction'
      );
    END IF;
  END IF;

  -- Lock account row and deduct
  SELECT credit_balance
  INTO   v_before
  FROM   public.ai_credit_accounts
  WHERE  user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No credit account for user %', p_user_id
      USING ERRCODE = 'P0001', HINT = 'Create account first';
  END IF;

  IF v_before < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Need %, have %', p_amount, v_before
      USING ERRCODE = 'P0001', HINT = 'Purchase more credits';
  END IF;

  v_after := v_before - p_amount;

  UPDATE public.ai_credit_accounts SET
    credit_balance         = v_after,
    total_credits_consumed = total_credits_consumed + p_amount,
    last_transaction_at    = now(),
    updated_at             = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.ai_credit_transactions
    (user_id, transaction_type, amount, balance_before, balance_after,
     feature, notes, metadata, request_id)
  VALUES
    (p_user_id, 'deduction', -p_amount, v_before, v_after,
     p_feature, p_notes, p_metadata, p_request_id)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success',          true,
    'idempotent',       false,
    'transaction_id',   v_tx_id,
    'balance_before',   v_before,
    'balance_after',    v_after,
    'credits_deducted', p_amount
  );
END;
$$;

COMMENT ON FUNCTION public.deduct_ai_credits IS
  'Atomically deducts credits from a user account using a row-level lock. '
  'Raises P0001 if the account does not exist or balance is insufficient. '
  'Pass the pgmq msg_id as p_request_id for idempotency — the same message will never '
  'deduct credits twice on redelivery. Returns { success, idempotent, transaction_id, '
  'balance_before, balance_after, credits_deducted }.';

-- ============================================================================
-- add_ai_credits  (purchase / grant / refund)
-- ============================================================================
CREATE FUNCTION public.add_ai_credits(
  p_user_id          uuid,
  p_amount           numeric,
  p_transaction_type text,
  p_metadata         jsonb DEFAULT '{}',
  p_notes            text  DEFAULT NULL,
  p_plan_id          uuid  DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_before numeric;
  v_after  numeric;
  v_tx_id  uuid;
BEGIN
  IF p_transaction_type NOT IN (
    'purchase', 'refill', 'subscription_grant', 'admin_adjustment', 'refund', 'welcome_bonus'
  ) THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type
      USING ERRCODE = 'P0001';
  END IF;

  SELECT credit_balance INTO v_before
  FROM   public.ai_credit_accounts
  WHERE  user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    -- Auto-create account on first credit addition
    INSERT INTO public.ai_credit_accounts
      (user_id, credit_balance, total_credits_purchased, total_credits_granted, plan_id)
    VALUES (
      p_user_id,
      p_amount,
      CASE WHEN p_transaction_type = 'purchase'                               THEN p_amount ELSE 0 END,
      CASE WHEN p_transaction_type IN ('subscription_grant', 'welcome_bonus') THEN p_amount ELSE 0 END,
      p_plan_id
    )
    RETURNING credit_balance INTO v_after;
    v_before := 0;
  ELSE
    v_after := v_before + p_amount;

    UPDATE public.ai_credit_accounts SET
      credit_balance          = v_after,
      total_credits_purchased = CASE WHEN p_transaction_type = 'purchase'
                                  THEN total_credits_purchased + p_amount
                                  ELSE total_credits_purchased END,
      total_credits_granted   = CASE WHEN p_transaction_type IN ('subscription_grant', 'welcome_bonus')
                                  THEN total_credits_granted + p_amount
                                  ELSE total_credits_granted END,
      total_credits_refunded  = CASE WHEN p_transaction_type = 'refund'
                                  THEN total_credits_refunded + p_amount
                                  ELSE total_credits_refunded END,
      last_transaction_at     = now(),
      updated_at              = now()
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.ai_credit_transactions
    (user_id, transaction_type, amount, balance_before, balance_after, notes, metadata)
  VALUES
    (p_user_id, p_transaction_type, p_amount, v_before, v_after, p_notes, p_metadata)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success',        true,
    'transaction_id', v_tx_id,
    'balance_before', v_before,
    'balance_after',  v_after,
    'credits_added',  p_amount
  );
END;
$$;

COMMENT ON FUNCTION public.add_ai_credits IS
  'Adds credits to a user account for any positive transaction type: '
  'purchase, refill, subscription_grant, admin_adjustment, refund, welcome_bonus. '
  'Auto-creates the account row if it does not exist yet (safe for first-time grants). '
  'Updates the appropriate lifetime total counter based on transaction type. '
  'Returns { success, transaction_id, balance_before, balance_after, credits_added }.';

-- ============================================================================
-- reset_monthly_ai_credits  (cron: run on 1st of each month)
-- ============================================================================
CREATE FUNCTION public.reset_monthly_ai_credits()
RETURNS TABLE(regrant_count integer)
LANGUAGE plpgsql SET search_path TO 'public'
AS $$
DECLARE
  v_regrant integer := 0;
  v_row     RECORD;
BEGIN
  FOR v_row IN
    SELECT acc.user_id, acc.plan_id, cfg.credit_grant
    FROM   public.ai_credit_accounts acc
    JOIN   public.plan_ai_credit_config cfg
             ON cfg.plan_id = acc.plan_id AND cfg.is_active = true
    WHERE  cfg.credit_grant IS NOT NULL
  LOOP
    PERFORM public.add_ai_credits(
      p_user_id          := v_row.user_id,
      p_amount           := v_row.credit_grant,
      p_transaction_type := 'subscription_grant',
      p_metadata         := jsonb_build_object(
        'reset_date',   date_trunc('month', now()),
        'credit_grant', v_row.credit_grant,
        'plan_id',      v_row.plan_id
      ),
      p_plan_id := v_row.plan_id
    );
    v_regrant := v_regrant + 1;
  END LOOP;

  RETURN QUERY SELECT v_regrant;
END;
$$;

COMMENT ON FUNCTION public.reset_monthly_ai_credits IS
  'Monthly cron job (run on the 1st of each month): re-grants subscription credits to all '
  'active accounts whose plan has a non-null credit_grant. Records a subscription_grant '
  'transaction per user. No consumption counters are reset — monthly usage is derivable '
  'from ai_credit_transactions. Returns regrant_count (number of accounts credited).';

-- ============================================================================
-- expire_ai_credits
-- ============================================================================
CREATE FUNCTION public.expire_ai_credits(
  p_user_id  uuid,
  p_amount   numeric,
  p_notes    text  DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_before numeric;
  v_expire numeric;
  v_after  numeric;
  v_tx_id  uuid;
BEGIN
  SELECT credit_balance
  INTO   v_before
  FROM   public.ai_credit_accounts
  WHERE  user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No credit account for user %', p_user_id
      USING ERRCODE = 'P0001';
  END IF;

  -- Expire only what is available — never go below zero
  v_expire := LEAST(p_amount, v_before);

  IF v_expire <= 0 THEN
    RETURN jsonb_build_object(
      'success',         true,
      'credits_expired', 0,
      'balance_before',  v_before,
      'balance_after',   v_before,
      'message',         'No credits to expire'
    );
  END IF;

  v_after := v_before - v_expire;

  UPDATE public.ai_credit_accounts SET
    credit_balance      = v_after,
    last_transaction_at = now(),
    updated_at          = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.ai_credit_transactions
    (user_id, transaction_type, amount, balance_before, balance_after, notes, metadata)
  VALUES
    (p_user_id, 'expiry', -v_expire, v_before, v_after,
     COALESCE(p_notes, 'Credit expiry'), p_metadata)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success',         true,
    'transaction_id',  v_tx_id,
    'credits_expired', v_expire,
    'balance_before',  v_before,
    'balance_after',   v_after
  );
END;
$$;

COMMENT ON FUNCTION public.expire_ai_credits IS
  'Expires up to p_amount credits from a user account. Caps at the current balance — '
  'never drives the account below zero. Records an ''expiry'' transaction in '
  'ai_credit_transactions for a full audit trail. Raises P0001 if no account exists. '
  'Returns { success, transaction_id, credits_expired, balance_before, balance_after }. '
  'If balance is already 0, returns success with credits_expired = 0 and no transaction.';

-- ============================================================================
-- log_ai_usage  (with pgmq idempotency)
-- ============================================================================
CREATE FUNCTION public.log_ai_usage(
  p_user_id           uuid,
  p_feature           text,
  p_endpoint          text,
  p_model_used        text,
  p_prompt_tokens     integer,
  p_completion_tokens integer,
  p_cost_in_credits   numeric,
  p_conversation_id   uuid    DEFAULT NULL,
  p_request_metadata  jsonb   DEFAULT '{}',
  p_latency_ms        integer DEFAULT NULL,
  p_status            text    DEFAULT 'success',
  p_credits_per_1000  numeric DEFAULT 1.0,
  p_request_id        text    DEFAULT NULL,
  p_openrouter_cost_usd numeric DEFAULT NULL  -- upstream USD cost from OpenRouter usage.cost (internal only)
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_id          uuid;
  v_existing_id uuid;
BEGIN
  -- Idempotency check: same pgmq msg_id never logs twice
  IF p_request_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM   public.ai_usage_logs
    WHERE  user_id    = p_user_id
      AND  feature    = p_feature
      AND  request_id = p_request_id
    LIMIT 1;

    IF FOUND THEN
      RETURN v_existing_id;
    END IF;
  END IF;

  INSERT INTO public.ai_usage_logs (
    user_id, feature, endpoint, conversation_id, model_used,
    prompt_tokens, completion_tokens, total_tokens,
    cost_in_credits, credit_rate, openrouter_cost_usd,
    request_metadata, latency_ms, status, request_id
  ) VALUES (
    p_user_id, p_feature, p_endpoint, p_conversation_id, p_model_used,
    p_prompt_tokens, p_completion_tokens, p_prompt_tokens + p_completion_tokens,
    p_cost_in_credits, p_credits_per_1000, p_openrouter_cost_usd,
    p_request_metadata, p_latency_ms, p_status, p_request_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.log_ai_usage IS
  'Log one AI request to ai_usage_logs. Pass pgmq msg_id as p_request_id — '
  'same message never logs twice on redelivery. Pass p_openrouter_cost_usd from '
  'the OpenRouter SSE final chunk usage.cost for internal cost tracking. '
  'Returns the log row id.';

-- ============================================================================
-- get_user_ai_usage_summary
-- ============================================================================
CREATE FUNCTION public.get_user_ai_usage_summary(
  p_user_id uuid,
  p_days    integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH feature_stats AS (
    SELECT
      feature,
      COUNT(*)             AS requests,
      SUM(total_tokens)    AS tokens,
      SUM(cost_in_credits) AS credits
    FROM   public.ai_usage_logs
    WHERE  user_id    = p_user_id
      AND  created_at >= now() - (p_days || ' days')::interval
    GROUP BY feature
  ),
  totals AS (
    SELECT
      COALESCE(SUM(requests), 0) AS total_requests,
      COALESCE(SUM(tokens),   0) AS total_tokens,
      COALESCE(SUM(credits),  0) AS total_credits
    FROM feature_stats
  ),
  by_feature AS (
    SELECT COALESCE(
      jsonb_object_agg(
        feature,
        jsonb_build_object('requests', requests, 'tokens', tokens, 'credits', credits)
      ),
      '{}'::jsonb
    ) AS features
    FROM feature_stats
  )
  SELECT jsonb_build_object(
    'total_requests', t.total_requests,
    'total_tokens',   t.total_tokens,
    'total_credits',  t.total_credits,
    'by_feature',     bf.features,
    'period_start',   now() - (p_days || ' days')::interval,
    'period_end',     now()
  )
  INTO v_result
  FROM totals t, by_feature bf;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_user_ai_usage_summary IS
  'Usage summary by feature for a user over the last p_days days (default 30). '
  'Returns both tokens (internal) and credits (user-facing) per feature and as totals.';

-- ============================================================================
-- _sync_credit_account_on_subscription_change
--    Keeps subscription_id on ai_credit_accounts in sync.
--    Only fires when an account already exists with a matching plan_id.
--    Never modifies credit_balance or any credit totals.
-- ============================================================================
CREATE FUNCTION public._sync_credit_account_on_subscription_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'pending') THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ai_credit_accounts
    WHERE user_id = NEW.user_id AND plan_id = NEW.plan_id
  ) THEN
    RETURN NEW;
  END IF;

  UPDATE public.ai_credit_accounts SET
    subscription_id = NEW.id,
    updated_at      = now()
  WHERE user_id = NEW.user_id
    AND plan_id  = NEW.plan_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public._sync_credit_account_on_subscription_change IS
  'Trigger function: keeps subscription_id on ai_credit_accounts in sync when '
  'subscription_cache is inserted or updated. Only fires when an account already '
  'exists with a matching plan_id — account creation and plan changes are handled '
  'by provision.ts. Never modifies plan_id, credit_balance, or any credit totals.';

-- ============================================================================
-- _award_welcome_bonus_on_new_subscription
--    Grants a one-time welcome bonus on new subscription insert.
--    Idempotent — skips silently if a welcome_bonus transaction already exists.
-- ============================================================================
CREATE FUNCTION public._award_welcome_bonus_on_new_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_bonus numeric;
BEGIN
  IF NEW.status NOT IN ('active', 'pending') THEN
    RETURN NEW;
  END IF;

  SELECT welcome_bonus_credits
  INTO   v_bonus
  FROM   public.plan_ai_credit_config
  WHERE  plan_id = NEW.plan_id AND is_active = true;

  IF v_bonus IS NULL OR v_bonus <= 0 THEN
    RETURN NEW;
  END IF;

  -- Guard: only grant once per user
  IF EXISTS (
    SELECT 1 FROM public.ai_credit_transactions
    WHERE  user_id          = NEW.user_id
      AND  transaction_type = 'welcome_bonus'
    LIMIT 1
  ) THEN
    RETURN NEW;
  END IF;

  PERFORM public.add_ai_credits(
    p_user_id          := NEW.user_id,
    p_amount           := v_bonus,
    p_transaction_type := 'welcome_bonus',
    p_metadata         := jsonb_build_object(
      'subscription_id', NEW.id,
      'plan_id',         NEW.plan_id,
      'bonus_credits',   v_bonus
    ),
    p_notes   := 'Welcome bonus on new subscription',
    p_plan_id := NEW.plan_id
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public._award_welcome_bonus_on_new_subscription IS
  'Trigger function: grants a one-time welcome bonus when a new subscription row is '
  'inserted with status active or pending. Reads welcome_bonus_credits from '
  'plan_ai_credit_config. Idempotent — skips silently if a welcome_bonus transaction '
  'already exists for the user (safe against duplicate inserts or trigger re-runs). '
  'Calls add_ai_credits() which auto-creates the account if provision.ts has not run yet.';

-- ============================================================================
-- Subscription triggers
-- ============================================================================
CREATE TRIGGER trg_sync_credit_account
  AFTER INSERT OR UPDATE ON public.subscription_cache
  FOR EACH ROW EXECUTE FUNCTION public._sync_credit_account_on_subscription_change();

CREATE TRIGGER trg_welcome_bonus_on_subscription
  AFTER INSERT ON public.subscription_cache
  FOR EACH ROW EXECUTE FUNCTION public._award_welcome_bonus_on_new_subscription();

-- ============================================================================
-- charge_and_log_ai_usage
--
-- Atomic replacement for the two-step deduct_ai_credits() + log_ai_usage()
-- pattern. Both writes happen inside a single transaction so there is no
-- window where a credit is deducted but the usage log is missing (or vice
-- versa).
--
-- Only for SUCCESSFUL AI calls. Error-path logging (zero-cost, status≠success)
-- must use log_ai_usage() directly — this function always writes status='success'.
--
-- Steps (all-or-nothing):
--   0. Input validation   — p_request_id non-empty, p_amount > 0.
--   1. Pre-lock idempotency check  — fast path: return early if already done.
--   2. FOR UPDATE lock    — serialises concurrent requests for the same user.
--   3. Post-lock idempotency re-check — closes the TOCTOU gap between steps 1
--                           and 2. If a concurrent call committed between those
--                           two points, return its result without writing.
--                           If the transaction exists but the usage log is
--                           missing (partial failure), insert the log now.
--   4. Balance check      — raises P0001 if insufficient.
--   5. Deduct balance     — updates ai_credit_accounts.
--   6. Insert transaction — immutable ledger row in ai_credit_transactions.
--   7. Insert usage log   — raw token/model row in ai_usage_logs.
--   8. Return             — { success, idempotent, transaction_id, usage_log_id,
--                             balance_before, balance_after, credits_deducted }
--
-- Parameter order: all required params first, then optional params with defaults.
-- ============================================================================
CREATE FUNCTION public.charge_and_log_ai_usage(
  -- ── Required ──────────────────────────────────────────────────────────────
  p_user_id             uuid,
  p_amount              numeric,        -- must be > 0
  p_feature             text,
  p_request_id          text,           -- must be non-empty; pgmq msg_id or crypto.randomUUID()
  p_endpoint            text,
  p_model_used          text,
  p_prompt_tokens       integer,
  p_completion_tokens   integer,
  -- ── Optional ──────────────────────────────────────────────────────────────
  p_notes               text    DEFAULT NULL,
  p_deduct_metadata     jsonb   DEFAULT '{}',
  p_credits_per_1000    numeric DEFAULT 1.0,
  p_conversation_id     uuid    DEFAULT NULL,
  p_request_metadata    jsonb   DEFAULT '{}',
  p_latency_ms          integer DEFAULT NULL,
  p_openrouter_cost_usd numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_before           numeric;
  v_after            numeric;
  v_tx_id            uuid;
  v_usage_id         uuid;
  v_existing_tx_id   uuid;
  v_existing_amount  numeric;
  v_existing_after   numeric;
  v_existing_log_id  uuid;
  v_total_tokens     integer;
BEGIN
  -- ── 0. Input validation ───────────────────────────────────────────────────

  IF p_request_id IS NULL OR trim(p_request_id) = '' THEN
    RAISE EXCEPTION 'p_request_id must be a non-empty string'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be greater than 0, got %', p_amount
      USING ERRCODE = 'P0002';
  END IF;

  -- ── 1. Pre-lock idempotency check ─────────────────────────────────────────
  --
  -- Fast path: if this request_id was already committed, return immediately
  -- without acquiring the row lock. Covers the common redelivery case cheaply.
  SELECT id, -amount, balance_after   -- amount is stored negative for deductions
  INTO   v_existing_tx_id, v_existing_amount, v_existing_after
  FROM   public.ai_credit_transactions
  WHERE  user_id          = p_user_id
    AND  feature          = p_feature
    AND  request_id       = p_request_id
    AND  transaction_type = 'deduction'
  LIMIT 1;

  IF FOUND THEN
    SELECT id INTO v_existing_log_id
    FROM   public.ai_usage_logs
    WHERE  user_id     = p_user_id
      AND  feature     = p_feature
      AND  request_id  = p_request_id
    LIMIT 1;

    RETURN jsonb_build_object(
      'success',          true,
      'idempotent',       true,
      'transaction_id',   v_existing_tx_id,
      'usage_log_id',     v_existing_log_id,
      'balance_after',    v_existing_after,
      'credits_deducted', v_existing_amount,
      'message',          'Duplicate request_id — returning existing result'
    );
  END IF;

  -- ── 2. Lock account row ───────────────────────────────────────────────────
  SELECT credit_balance
  INTO   v_before
  FROM   public.ai_credit_accounts
  WHERE  user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No credit account for user %', p_user_id
      USING ERRCODE = 'P0001', HINT = 'Create account first via add_ai_credits()';
  END IF;

  -- ── 3. Post-lock idempotency re-check ─────────────────────────────────────
  --
  -- A concurrent call may have committed between steps 1 and 2. Re-check now
  -- that we hold the row lock so no further concurrent write can interleave.
  SELECT id, -amount, balance_after
  INTO   v_existing_tx_id, v_existing_amount, v_existing_after
  FROM   public.ai_credit_transactions
  WHERE  user_id          = p_user_id
    AND  feature          = p_feature
    AND  request_id       = p_request_id
    AND  transaction_type = 'deduction'
  LIMIT 1;

  IF FOUND THEN
    -- Transaction exists. Check whether the usage log also exists.
    SELECT id INTO v_existing_log_id
    FROM   public.ai_usage_logs
    WHERE  user_id     = p_user_id
      AND  feature     = p_feature
      AND  request_id  = p_request_id
    LIMIT 1;

    IF NOT FOUND THEN
      -- Partial failure from a previous run: transaction committed but usage
      -- log did not. Insert the log now to make the record complete.
      v_total_tokens := p_prompt_tokens + p_completion_tokens;

      INSERT INTO public.ai_usage_logs (
        user_id, feature, endpoint, conversation_id, model_used,
        prompt_tokens, completion_tokens, total_tokens,
        cost_in_credits, credit_rate, openrouter_cost_usd,
        request_metadata, latency_ms, status, request_id
      ) VALUES (
        p_user_id, p_feature, p_endpoint, p_conversation_id, p_model_used,
        p_prompt_tokens, p_completion_tokens, v_total_tokens,
        v_existing_amount, p_credits_per_1000, p_openrouter_cost_usd,
        p_request_metadata, p_latency_ms, 'success', p_request_id
      )
      RETURNING id INTO v_existing_log_id;
    END IF;

    RETURN jsonb_build_object(
      'success',          true,
      'idempotent',       true,
      'transaction_id',   v_existing_tx_id,
      'usage_log_id',     v_existing_log_id,
      'balance_after',    v_existing_after,
      'credits_deducted', v_existing_amount,
      'message',          'Duplicate request_id — returning existing result'
    );
  END IF;

  -- ── 4. Balance check ──────────────────────────────────────────────────────
  IF v_before < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Need %, have %', p_amount, v_before
      USING ERRCODE = 'P0001', HINT = 'Purchase more credits';
  END IF;

  v_after        := v_before - p_amount;
  v_total_tokens := p_prompt_tokens + p_completion_tokens;

  -- ── 5. Deduct balance ─────────────────────────────────────────────────────
  UPDATE public.ai_credit_accounts SET
    credit_balance         = v_after,
    total_credits_consumed = total_credits_consumed + p_amount,
    last_transaction_at    = now(),
    updated_at             = now()
  WHERE user_id = p_user_id;

  -- ── 6. Insert transaction (immutable ledger) ──────────────────────────────
  INSERT INTO public.ai_credit_transactions
    (user_id, transaction_type, amount, balance_before, balance_after,
     feature, notes, metadata, request_id)
  VALUES
    (p_user_id, 'deduction', -p_amount, v_before, v_after,
     p_feature, p_notes, p_deduct_metadata, p_request_id)
  RETURNING id INTO v_tx_id;

  -- ── 7. Insert usage log ───────────────────────────────────────────────────
  --
  -- status is always 'success' — this function is only called for successful
  -- AI requests. Error-path logging uses log_ai_usage() directly.
  INSERT INTO public.ai_usage_logs (
    user_id, feature, endpoint, conversation_id, model_used,
    prompt_tokens, completion_tokens, total_tokens,
    cost_in_credits, credit_rate, openrouter_cost_usd,
    request_metadata, latency_ms, status, request_id
  ) VALUES (
    p_user_id, p_feature, p_endpoint, p_conversation_id, p_model_used,
    p_prompt_tokens, p_completion_tokens, v_total_tokens,
    p_amount, p_credits_per_1000, p_openrouter_cost_usd,
    p_request_metadata, p_latency_ms, 'success', p_request_id
  )
  RETURNING id INTO v_usage_id;

  -- ── 8. Return ─────────────────────────────────────────────────────────────
  RETURN jsonb_build_object(
    'success',          true,
    'idempotent',       false,
    'transaction_id',   v_tx_id,
    'usage_log_id',     v_usage_id,
    'balance_before',   v_before,
    'balance_after',    v_after,
    'credits_deducted', p_amount
  );
END;
$$;

-- Restrict execution to service_role only.
-- SECURITY DEFINER already runs as the owner, but without this any
-- authenticated or anon role could invoke the function directly.
REVOKE EXECUTE ON FUNCTION public.charge_and_log_ai_usage FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.charge_and_log_ai_usage TO   service_role;

COMMENT ON FUNCTION public.charge_and_log_ai_usage IS
  'Atomic deduction + usage logging in a single transaction. '
  'Only for successful AI calls — always writes status=''success'' to ai_usage_logs. '
  'For error-path logging (no deduction), use log_ai_usage() directly. '
  'Replaces the two-step deduct_ai_credits() + log_ai_usage() pattern. '
  'If deduction succeeds, the usage log is guaranteed to exist — there is no '
  'window where one write succeeds and the other fails. '
  'Validates p_request_id (non-empty) and p_amount (> 0) before any DB access. '
  'Idempotent: same request_id never deducts or logs twice on pgmq redelivery. '
  'Post-lock re-check closes the TOCTOU gap between the pre-lock check and the '
  'FOR UPDATE acquisition. If a transaction exists but the usage log is missing '
  '(partial failure), the log is inserted during the idempotent return path. '
  'Callable by service_role only (REVOKE from PUBLIC). '
  'Raises P0001 if the account does not exist or balance is insufficient. '
  'Raises P0002 if p_request_id is empty or p_amount is not positive. '
  'Returns { success, idempotent, transaction_id, usage_log_id, '
  'balance_before, balance_after, credits_deducted }.';

-- ============================================================================
-- reset_credits_by_subscription_cycle
--
-- Replaces the calendar-month reset (1st of month for everyone) with a
-- per-user cycle reset driven by subscription_end_date.
--
-- Logic:
--   A user's credit grant is due when their subscription has renewed —
--   i.e. the NEW subscription_end_date is in the future but the PREVIOUS
--   cycle's grant has not yet been issued for this period.
--
--   We detect this by checking ai_credit_transactions:
--   "Has this user received a subscription_grant AFTER their current
--    subscription_start_date?"
--   If not → grant is due.
--
-- This means:
--   - Yearly plan user renews on May 29 → gets grant on May 29
--   - Monthly plan user renews on the 15th → gets grant on the 15th
--   - NOT everyone on the 1st of the month
--
-- Idempotent: running hourly is safe — already-granted accounts are skipped.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reset_credits_by_subscription_cycle()
RETURNS TABLE(regrant_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_regrant integer := 0;
  v_row     RECORD;
BEGIN
  FOR v_row IN
    SELECT
      acc.user_id,
      acc.plan_id,
      cfg.credit_grant,
      sub.subscription_start_date,
      sub.subscription_end_date,
      sub.billing_cycle,
      sub.plan_code
    FROM public.ai_credit_accounts acc
    -- Join to subscription_cache for current subscription dates
    INNER JOIN public.subscription_cache sub
      ON sub.id = acc.subscription_id
    -- Join to plan config for credit_grant amount
    INNER JOIN public.plan_ai_credit_config cfg
      ON cfg.plan_id = acc.plan_id AND cfg.is_active = true
    WHERE
      -- Plan has a credit grant configured
      cfg.credit_grant IS NOT NULL
      AND cfg.credit_grant > 0
      -- Subscription is active
      AND sub.status IN ('active', 'pending')
      -- Not a lifetime plan (lifetime never resets)
      AND sub.billing_cycle != 'lifetime'
      -- Subscription has a valid start date
      AND sub.subscription_start_date IS NOT NULL
      -- The subscription_start_date is in the past (renewal has occurred)
      AND sub.subscription_start_date <= now()
      -- No subscription_grant has been issued AFTER the current cycle start date.
      -- This is the idempotency check — if a grant already exists for this
      -- cycle, skip this user.
      AND NOT EXISTS (
        SELECT 1
        FROM public.ai_credit_transactions tx
        WHERE tx.user_id          = acc.user_id
          AND tx.transaction_type = 'subscription_grant'
          AND tx.created_at       >= sub.subscription_start_date
      )
  LOOP
    -- Grant the subscription credits for this cycle
    PERFORM public.add_ai_credits(
      p_user_id          := v_row.user_id,
      p_amount           := v_row.credit_grant,
      p_transaction_type := 'subscription_grant',
      p_metadata         := jsonb_build_object(
        'cycle_start',   v_row.subscription_start_date,
        'cycle_end',     v_row.subscription_end_date,
        'credit_grant',  v_row.credit_grant,
        'plan_id',       v_row.plan_id,
        'plan_code',     v_row.plan_code,
        'billing_cycle', v_row.billing_cycle,
        'trigger',       'subscription_cycle_reset'
      ),
      p_notes   := format(
        'Subscription cycle grant — %s plan, cycle started %s',
        v_row.plan_code,
        to_char(v_row.subscription_start_date, 'YYYY-MM-DD')
      ),
      p_plan_id := v_row.plan_id
    );

    v_regrant := v_regrant + 1;
  END LOOP;

  RETURN QUERY SELECT v_regrant;
END;
$$;

COMMENT ON FUNCTION public.reset_credits_by_subscription_cycle IS
  'Re-grants subscription credits based on each user''s own billing cycle, '
  'not a fixed calendar date. Detects renewal by checking if a subscription_grant '
  'transaction exists after the current subscription_start_date. '
  'Idempotent — safe to run hourly. Skips lifetime plans and already-granted accounts. '
  'Replaces reset_monthly_ai_credits() which incorrectly reset everyone on the 1st. '
  'Called by POST /api/credits/reset-monthly (hourly cron). '
  'Returns regrant_count.';

-- Restrict to service_role only
REVOKE EXECUTE ON FUNCTION public.reset_credits_by_subscription_cycle FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.reset_credits_by_subscription_cycle TO   service_role;

-- ============================================================================
-- expire_subscription_credits
--
-- Logic:
--   When a user's subscription_end_date has passed, expire only the credits
--   that came from subscription grants (subscription_grant + welcome_bonus).
--   Purchased credits are NEVER expired.
--
-- How expiry amount is calculated:
--   granted_credits = total_credits_granted (lifetime grants on this account)
--   purchased_credits = total_credits_purchased
--   consumed_credits  = total_credits_consumed
--   current_balance   = credit_balance
--
--   The "safe to expire" amount is:
--     MIN(current_balance, MAX(0, current_balance - purchased_credits + consumed_credits))
--   i.e. we protect purchased credits from expiry — only subscription-granted
--   credits that are still sitting unused get expired.
--
-- Idempotent: accounts already expired (credit_balance = 0 or subscription
--   still active) are skipped silently.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.expire_subscription_credits()
RETURNS TABLE(expired_count integer, total_credits_expired numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expired_count   integer := 0;
  v_total_expired   numeric := 0;
  v_row             RECORD;
  v_expire_amount   numeric;
  v_result          jsonb;
BEGIN
  -- Find all accounts whose subscription has ended and still have a balance
  FOR v_row IN
    SELECT
      acc.user_id,
      acc.credit_balance,
      acc.total_credits_purchased,
      acc.total_credits_consumed,
      acc.total_credits_granted,
      sub.subscription_end_date,
      sub.plan_code,
      sub.id AS subscription_id
    FROM public.ai_credit_accounts acc
    -- Join to subscription_cache via subscription_id (kept in sync by trigger)
    INNER JOIN public.subscription_cache sub
      ON sub.id = acc.subscription_id
    WHERE
      -- Subscription has ended
      sub.subscription_end_date IS NOT NULL
      AND sub.subscription_end_date < now()
      -- Still has a balance worth expiring
      AND acc.credit_balance > 0
      -- Skip lifetime / freemium plans (no end date means no expiry)
      AND sub.billing_cycle != 'lifetime'
  LOOP
    -- Calculate how many credits are safe to expire.
    -- We protect purchased credits: only expire the portion of the balance
    -- that came from subscription grants (not from purchases).
    --
    -- Formula:
    --   subscription_credits_remaining = granted - consumed (floored at 0)
    --   expire = MIN(current_balance, subscription_credits_remaining)
    --
    -- This ensures purchased credits are never touched.
    v_expire_amount := LEAST(
      v_row.credit_balance,
      GREATEST(
        0,
        v_row.total_credits_granted
          - GREATEST(0, v_row.total_credits_consumed - v_row.total_credits_purchased)
      )
    );

    -- Skip if nothing to expire
    CONTINUE WHEN v_expire_amount <= 0;

    -- Call the existing expire_ai_credits function (handles lock + ledger entry)
    SELECT public.expire_ai_credits(
      p_user_id  := v_row.user_id,
      p_amount   := v_expire_amount,
      p_notes    := format(
        'Subscription expired on %s (plan: %s). Expiring unused subscription-granted credits.',
        to_char(v_row.subscription_end_date, 'YYYY-MM-DD'),
        v_row.plan_code
      ),
      p_metadata := jsonb_build_object(
        'reason',               'subscription_ended',
        'subscription_id',      v_row.subscription_id,
        'subscription_end_date', v_row.subscription_end_date,
        'plan_code',            v_row.plan_code,
        'balance_before',       v_row.credit_balance,
        'purchased_protected',  v_row.total_credits_purchased
      )
    ) INTO v_result;

    -- Only count if credits were actually expired
    IF (v_result->>'credits_expired')::numeric > 0 THEN
      v_expired_count := v_expired_count + 1;
      v_total_expired := v_total_expired + (v_result->>'credits_expired')::numeric;
    END IF;

  END LOOP;

  RETURN QUERY SELECT v_expired_count, v_total_expired;
END;
$$;

COMMENT ON FUNCTION public.expire_subscription_credits IS
  'Expires unused subscription-granted credits for users whose subscription_end_date '
  'has passed. Purchased credits are never expired — only the portion of the balance '
  'attributable to subscription_grant and welcome_bonus transactions is removed. '
  'Joins ai_credit_accounts → subscription_cache via subscription_id. '
  'Skips lifetime/freemium plans (no end date). Idempotent — safe to run multiple times. '
  'Called by POST /api/credits/expire-subscription (daily cron). '
  'Returns { expired_count, total_credits_expired }.';

-- Restrict to service_role only
REVOKE EXECUTE ON FUNCTION public.expire_subscription_credits FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.expire_subscription_credits TO   service_role;

-- ============================================================================
-- NOTE: Seed data for plan_ai_credit_config lives in supabase/seed/seed.sql
--       because plans_cache is populated by the seed file, not migrations.
-- ============================================================================

COMMIT;
