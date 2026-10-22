CREATE TABLE IF NOT EXISTS public.recruitment_configuration (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
 default_hiring_workflow jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(default_hiring_workflow)='array'),
 interview_stages jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(interview_stages)='array'),
 offer_letter_template_id text,default_email_template_id text,career_page_url text NOT NULL DEFAULT '',career_page_enabled boolean NOT NULL DEFAULT false,
 job_posting_preferences jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(job_posting_preferences)='object'),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recruitment_configuration ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recruitment_configuration FROM anon,authenticated;
GRANT ALL ON public.recruitment_configuration TO service_role;
NOTIFY pgrst,'reload schema';
