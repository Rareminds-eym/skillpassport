-- Migration: Safely migrate legacy recruiter subscriptions to v2 plan codes
-- Context:
--   1. Old 'recruiter_starter' was Free (INR 0) -> Remap to 'recruiter_free'
--   2. Old 'recruiter_pro' (INR 49,990) -> Retain / remap to new 'recruiter_pro'
--   3. Old 'recruiter_premium' (INR 99,990) -> Remap to new 'recruiter_pro'
--   4. Backfill initial credit_ledger balances for active recruiter organizations
--
-- Idempotent: Can be run multiple times safely.

BEGIN;

-- 1. Migrate legacy free recruiter_starter to recruiter_free in subscription_cache (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_cache') THEN
        UPDATE public.subscription_cache
        SET
            plan_code = 'recruiter_free',
            plan_id = 'b0000000-0000-4000-8000-000000000010'
        WHERE plan_code = 'recruiter_starter'
          AND (plan_id = 'b0000000-0000-4000-8000-000000000001' OR plan_id IS NULL);

        UPDATE public.subscription_cache
        SET
            plan_code = 'recruiter_pro',
            plan_id = 'b0000000-0000-4000-8000-000000000050'
        WHERE plan_code = 'recruiter_premium';

        UPDATE public.subscription_cache
        SET
            plan_id = 'b0000000-0000-4000-8000-000000000050'
        WHERE plan_code = 'recruiter_pro'
          AND plan_id = 'b0000000-0000-4000-8000-000000000002';
    END IF;
END $$;

-- 2. Backfill credit_ledger balances for any active recruiter organizations that have not yet been seeded
DO $$
DECLARE
    r RECORD;
    v_tenant_id UUID;
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credit_ledger') THEN
        -- Loop over all distinct recruiter organizations from organizations or recruiter members
        FOR r IN 
            SELECT 
                o.id as organization_id,
                COALESCE(
                    (SELECT sc.plan_code 
                     FROM public.subscription_cache sc 
                     WHERE (sc.organization_id = o.id OR sc.user_id IN (
                         SELECT m.user_id FROM public.organization_members m WHERE m.organization_id = o.id
                     ))
                       AND sc.plan_code LIKE 'recruiter_%'
                       AND sc.status IN ('active', 'trialing')
                     ORDER BY sc.created_at DESC
                     LIMIT 1
                    ),
                    'recruiter_free'
                ) as current_plan
            FROM public.organizations o
            WHERE o.organization_type = 'company'
               OR EXISTS (
                   SELECT 1 FROM public.organization_members m 
                   JOIN public.users u ON u.id = m.user_id
                   WHERE m.organization_id = o.id 
                     AND (u.role ILIKE '%recruiter%' OR u.role ILIKE '%company%')
               )
        LOOP
            v_tenant_id := r.organization_id;
            
            -- Only seed if the tenant has no credit ledger rows
            IF NOT EXISTS (SELECT 1 FROM public.credit_ledger WHERE tenant_id = v_tenant_id) THEN
                IF r.current_plan = 'recruiter_free' THEN
                    INSERT INTO public.credit_ledger (tenant_id, feature_key, transaction_type, amount, notes)
                    VALUES 
                        (v_tenant_id, 'contact_unlocks', 'plan_allocation', 0, 'Migration initial allocation'),
                        (v_tenant_id, 'candidate_invites', 'plan_allocation', 25, 'Migration initial allocation');
                ELSIF r.current_plan = 'recruiter_lite' THEN
                    INSERT INTO public.credit_ledger (tenant_id, feature_key, transaction_type, amount, notes)
                    VALUES 
                        (v_tenant_id, 'contact_unlocks', 'plan_allocation', 25, 'Migration initial allocation'),
                        (v_tenant_id, 'candidate_invites', 'plan_allocation', 100, 'Migration initial allocation');
                ELSIF r.current_plan = 'recruiter_starter' THEN
                    INSERT INTO public.credit_ledger (tenant_id, feature_key, transaction_type, amount, notes)
                    VALUES 
                        (v_tenant_id, 'contact_unlocks', 'plan_allocation', 75, 'Migration initial allocation'),
                        (v_tenant_id, 'candidate_invites', 'plan_allocation', 300, 'Migration initial allocation'),
                        (v_tenant_id, 'job_boost_credits', 'plan_allocation', 5, 'Migration initial allocation');
                ELSIF r.current_plan = 'recruiter_growth' THEN
                    INSERT INTO public.credit_ledger (tenant_id, feature_key, transaction_type, amount, notes)
                    VALUES 
                        (v_tenant_id, 'contact_unlocks', 'plan_allocation', 200, 'Migration initial allocation'),
                        (v_tenant_id, 'candidate_invites', 'plan_allocation', 1000, 'Migration initial allocation'),
                        (v_tenant_id, 'job_boost_credits', 'plan_allocation', 20, 'Migration initial allocation');
                ELSIF r.current_plan = 'recruiter_pro' THEN
                    INSERT INTO public.credit_ledger (tenant_id, feature_key, transaction_type, amount, notes)
                    VALUES 
                        (v_tenant_id, 'contact_unlocks', 'plan_allocation', 500, 'Migration initial allocation'),
                        (v_tenant_id, 'candidate_invites', 'plan_allocation', 3000, 'Migration initial allocation'),
                        (v_tenant_id, 'job_boost_credits', 'plan_allocation', 75, 'Migration initial allocation');
                END IF;
            END IF;
        END LOOP;
    END IF;
END $$;

COMMIT;
