-- SkillPassport owns academic scope. LTE stores external scope IDs, not FKs.
CREATE TABLE public.lte_review_scope_settings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
 school_class_id uuid REFERENCES public.school_classes(id) ON DELETE CASCADE,
 enabled boolean NOT NULL DEFAULT false,
 email_enabled boolean NOT NULL DEFAULT false,
 sla_days integer NOT NULL DEFAULT 3 CHECK(sla_days BETWEEN 1 AND 30),
 time_zone text NOT NULL DEFAULT 'Asia/Kolkata',
 load_cap integer NOT NULL DEFAULT 10 CHECK(load_cap BETWEEN 1 AND 100),
 confidence_threshold numeric NOT NULL DEFAULT 60 CHECK(confidence_threshold BETWEEN 0 AND 100),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(num_nonnulls(college_program_id,school_class_id)=1),
 UNIQUE(college_program_id), UNIQUE(school_class_id)
);
ALTER TABLE public.lte_review_scope_settings DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lte_review_scope_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lte_review_scope_settings TO service_role;
COMMENT ON TABLE public.lte_review_scope_settings IS 'Operator-managed LTE human-review opt-in. Missing configuration means disabled. Calendar uses weekdays in the configured IANA zone.';
