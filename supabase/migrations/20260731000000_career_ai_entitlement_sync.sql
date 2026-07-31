-- Career AI: Plan-granted entitlements for paid subscribers
--
-- Learners with an active paid subscription (basic, premium, professional)
-- get a plan-granted 'career_ai' row in user_entitlements, kept in sync by a
-- trigger on subscription_cache. Freemium learners get nothing.
--
-- Plan-granted rows: razorpay_subscription_id IS NULL AND granted_by_organization IS NOT TRUE.
-- Purchased add-on rows (razorpay_subscription_id set) and org-granted rows
-- (granted_by_organization = true) are never touched.
--
-- NOTE: the legacy admin migration tool (functions/api/payments/handlers/
-- migration-operations.ts) inserts rows with razorpay_subscription_id NULL and
-- granted_by_organization unset — they match the plan-granted pattern and are
-- intentionally deduped/deactivated by this migration (they are plan-derived).
--
-- The trigger fires on EVERY subscription_cache write (including synced_at-only
-- refreshes and receipt_url re-syncs). This amplification is intentional:
-- every write re-validates the entitlement (self-healing), and the sync is
-- idempotent. Statement order is load-bearing: dedupe -> unique index ->
-- backfill (ON CONFLICT) -> deactivate -> functions -> trigger.

-- 1. Dedupe: collapse legacy plan-derived duplicates (keeps the unique index
--    from failing). Keep ACTIVE rows over cancelled ones, then the newest id,
--    so a rollback + re-apply can never delete the active row of a
--    resubscribed user and keep a stale cancelled one.
DELETE FROM user_entitlements ue
USING user_entitlements ue2
WHERE ue.feature_key = 'career_ai'
  AND ue.razorpay_subscription_id IS NULL
  AND COALESCE(ue.granted_by_organization, false) = false
  AND ue2.feature_key = 'career_ai'
  AND ue2.razorpay_subscription_id IS NULL
  AND COALESCE(ue2.granted_by_organization, false) = false
  AND ue.user_id = ue2.user_id
  AND (
    (ue2.status = 'active' AND ue.status <> 'active')
    OR (ue.status = ue2.status AND ue.id < ue2.id)
  );

-- 2. Uniqueness backbone: at most one plan-granted row per (user, feature).
--    Partial index (per Supabase best practice): only plan-granted rows are
--    covered, so purchased and org-granted rows stay free of the constraint.
CREATE UNIQUE INDEX IF NOT EXISTS user_entitlements_plan_granted_user_feature_uniq
  ON public.user_entitlements (user_id, feature_key)
  WHERE razorpay_subscription_id IS NULL
    AND COALESCE(granted_by_organization, false) = false;

-- 3. Backfill: grant rows for existing paid subscribers. Runs AFTER the index
--    so ON CONFLICT inference works; DO NOTHING keeps re-applies idempotent.
--    The NOT EXISTS guard matches only plan-granted rows (purchased/org rows
--    are excluded, mirroring the trigger's behavior).
INSERT INTO user_entitlements (user_id, feature_key, status, billing_period,
                               price_at_purchase, start_date, end_date, auto_renew,
                               granted_by_organization)
SELECT sc.user_id,
       'career_ai',
       'active',
       CASE WHEN sc.billing_cycle IN ('yearly', 'annual') THEN 'annual' ELSE 'monthly' END,
       0,
       COALESCE(sc.subscription_start_date, now()),
       COALESCE(sc.subscription_end_date,
                now() + CASE WHEN sc.billing_cycle IN ('yearly', 'annual')
                             THEN interval '1 year' ELSE interval '1 month' END),
       true,
       false
FROM subscription_cache sc
WHERE sc.plan_code IN ('basic', 'premium', 'professional')
  AND sc.status IN ('active', 'grace_period')
  AND COALESCE(sc.is_organization_subscription, false) = false
  AND NOT EXISTS (
    SELECT 1 FROM user_entitlements ue
    WHERE ue.user_id = sc.user_id
      AND ue.feature_key = 'career_ai'
      AND ue.status = 'active'
      AND ue.razorpay_subscription_id IS NULL
      AND COALESCE(ue.granted_by_organization, false) = false
  )
ON CONFLICT (user_id, feature_key)
  WHERE razorpay_subscription_id IS NULL
    AND COALESCE(granted_by_organization, false) = false
DO NOTHING;

-- 4. Deactivate plan-granted rows whose subscription is no longer paid
UPDATE user_entitlements ue
SET status = 'cancelled',
    cancelled_at = now()
WHERE ue.feature_key = 'career_ai'
  AND ue.razorpay_subscription_id IS NULL
  AND COALESCE(ue.granted_by_organization, false) = false
  AND ue.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM subscription_cache sc
    WHERE sc.user_id = ue.user_id
      AND sc.plan_code IN ('basic', 'premium', 'professional')
      AND sc.status IN ('active', 'grace_period')
      AND COALESCE(sc.is_organization_subscription, false) = false
  );

-- 5. Sync functions

-- Deactivate plan-granted career_ai rows for a user (never purchased/org rows)
CREATE OR REPLACE FUNCTION public.deactivate_plan_granted_career_ai(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE user_entitlements
  SET status = 'cancelled',
      cancelled_at = now()
  WHERE user_id = p_user_id
    AND feature_key = 'career_ai'
    AND razorpay_subscription_id IS NULL
    AND COALESCE(granted_by_organization, false) = false
    AND status = 'active';
END;
$$;

-- Grant/refresh/deactivate plan-granted career_ai row from the user's subscription state
-- Grant condition includes an end_date bound: a row whose subscription_end_date
-- has passed is treated as inactive (bounds fail-open staleness on the read
-- side, since hasActiveAddonEntitlement checks status only).
CREATE OR REPLACE FUNCTION public.sync_career_ai_entitlement_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub subscription_cache%ROWTYPE;
BEGIN
  SELECT * INTO v_sub FROM subscription_cache
  WHERE user_id = p_user_id
    AND COALESCE(is_organization_subscription, false) = false
  ORDER BY status = 'active' DESC, synced_at DESC
  LIMIT 1;

  IF v_sub.user_id IS NULL THEN
    PERFORM public.deactivate_plan_granted_career_ai(p_user_id);
    RETURN;
  END IF;

  IF v_sub.plan_code IN ('basic', 'premium', 'professional')
     AND v_sub.status IN ('active', 'grace_period')
     AND (v_sub.subscription_end_date IS NULL OR v_sub.subscription_end_date > now()) THEN
    INSERT INTO user_entitlements
      (user_id, feature_key, status, billing_period, price_at_purchase,
       start_date, end_date, auto_renew, granted_by_organization)
    VALUES
      (v_sub.user_id, 'career_ai', 'active',
       CASE WHEN v_sub.billing_cycle IN ('yearly', 'annual') THEN 'annual' ELSE 'monthly' END,
       0,
       COALESCE(v_sub.subscription_start_date, now()),
       COALESCE(v_sub.subscription_end_date,
                now() + CASE WHEN v_sub.billing_cycle IN ('yearly', 'annual')
                             THEN interval '1 year' ELSE interval '1 month' END),
       true,
       false)
    ON CONFLICT (user_id, feature_key)
      WHERE razorpay_subscription_id IS NULL
        AND COALESCE(granted_by_organization, false) = false
    DO UPDATE SET
      status         = 'active',
      billing_period = EXCLUDED.billing_period,
      start_date     = EXCLUDED.start_date,
      end_date       = EXCLUDED.end_date,
      auto_renew     = true,
      cancelled_at   = NULL;
  ELSE
    PERFORM public.deactivate_plan_granted_career_ai(p_user_id);
  END IF;
END;
$$;

-- 6. Trigger on subscription_cache (fires for every shadow-sync write).
--    FAIL-OPEN: any sync error is logged and swallowed — an entitlement sync
--    failure must never abort a payment write. The next write or the optional
--    cron job re-syncs and self-heals.
CREATE OR REPLACE FUNCTION public.trg_sync_career_ai_entitlement()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF COALESCE(NEW.is_organization_subscription, false) THEN
    RETURN NEW;
  END IF;
  BEGIN
    PERFORM public.sync_career_ai_entitlement_for_user(NEW.user_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'career_ai entitlement sync failed for user %: %', NEW.user_id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_career_ai_entitlement ON public.subscription_cache;
CREATE TRIGGER trg_sync_career_ai_entitlement
  AFTER INSERT OR UPDATE ON public.subscription_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_career_ai_entitlement();

-- 7. Least privilege: these functions are internal (trigger/admin/cron) —
--    no client may call them directly. Trigger invocation is unaffected
--    (privilege checks apply to direct user calls only).
REVOKE EXECUTE ON FUNCTION public.sync_career_ai_entitlement_for_user(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deactivate_plan_granted_career_ai(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_sync_career_ai_entitlement() FROM PUBLIC;
