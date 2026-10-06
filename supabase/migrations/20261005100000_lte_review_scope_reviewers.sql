-- Educators an institution administrator has explicitly designated as artifact
-- reviewers for a class/program, in addition to the educators assigned to teach
-- it. Lets administrators cover classes/programs that have no teaching
-- educators. Eligibility is re-validated (active educator of the same
-- organisation) every time a scope is resolved, so removing or deactivating an
-- educator takes effect without touching this table.
CREATE TABLE public.lte_review_scope_reviewers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
 school_class_id uuid REFERENCES public.school_classes(id) ON DELETE CASCADE,
 reviewer_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(num_nonnulls(college_program_id,school_class_id)=1),
 UNIQUE(college_program_id,reviewer_user_id),
 UNIQUE(school_class_id,reviewer_user_id)
);
-- Same access model as the other review tables: grants, not RLS.
ALTER TABLE public.lte_review_scope_reviewers DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lte_review_scope_reviewers FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lte_review_scope_reviewers TO service_role;
COMMENT ON TABLE public.lte_review_scope_reviewers IS
 'Administrator-designated LTE artifact reviewers per program/class. Union with teaching educators; re-validated against the organisation on every scope resolution.';
