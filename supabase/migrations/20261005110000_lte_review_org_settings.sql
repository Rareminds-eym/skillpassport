-- One holistic choice per organisation (school or college), made by its
-- administrator: how LTE artifact submissions of ALL its learners are evaluated,
-- regardless of course, class or program.
--   ai_first   : AI evaluates; uncertain/unreadable work goes to a human.
--   human_only : AI is never called; every submission goes to a human reviewer.
-- No row = ai_first.
CREATE TABLE public.lte_review_org_settings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
 evaluation_mode text NOT NULL DEFAULT 'ai_first' CHECK (evaluation_mode IN ('ai_first','human_only')),
 updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- Same access model as the other review tables: grants, not RLS.
ALTER TABLE public.lte_review_org_settings DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lte_review_org_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lte_review_org_settings TO service_role;
COMMENT ON TABLE public.lte_review_org_settings IS
 'Administrator-chosen LTE artifact evaluation mode per organisation (school/college). Missing row = ai_first.';
