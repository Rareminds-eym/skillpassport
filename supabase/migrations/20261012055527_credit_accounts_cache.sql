-- Career AI 30-credit system: balance-only cache (Phase 4).
-- Read-only SSO balance projection for display. Never authorizes inference,
-- never computes debits. Usage, policies and ledger stay canonical in SSO.
-- product_id is an external canonical reference (no cross-DB FK).

CREATE TABLE IF NOT EXISTS public.user_ai_credit_accounts_cache (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  scope text NOT NULL DEFAULT 'career_ai',
  granted_credits numeric(24,12) NOT NULL CHECK (granted_credits >= 0),
  spent_credits numeric(24,12) NOT NULL DEFAULT 0 CHECK (spent_credits >= 0),
  revision bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_ai_credit_accounts_cache_user_product_scope_key
    UNIQUE (user_id, product_id, scope)
);
