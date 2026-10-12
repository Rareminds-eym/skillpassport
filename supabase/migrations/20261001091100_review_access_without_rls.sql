-- User-selected access model: explicit table/RPC grants and backend authorization.
-- Applies the same configuration to databases that ran the earlier migrations.
ALTER TABLE public.lte_review_scope_settings DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lte_review_scope_settings FROM PUBLIC,anon,authenticated;
ALTER TABLE public.lte_review_events DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lte_review_events FROM PUBLIC,anon,authenticated;
ALTER TABLE public.lte_review_evidence DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lte_review_evidence FROM PUBLIC,anon,authenticated;
ALTER TABLE public.lte_review_email_deliveries DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lte_review_email_deliveries FROM PUBLIC,anon,authenticated;
