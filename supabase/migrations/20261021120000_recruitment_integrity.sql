-- Persist ownership and decisions without reassigning ambiguous legacy records.
BEGIN;

ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES public.opportunities(id);
UPDATE public.interviews i SET organization_id = m.organization_id
FROM (SELECT user_id, (array_agg(organization_id))[1] organization_id
      FROM public.organization_members WHERE status = 'active' GROUP BY user_id HAVING count(DISTINCT organization_id) = 1) m
WHERE i.organization_id IS NULL AND i.created_by = m.user_id::text;
CREATE INDEX IF NOT EXISTS interviews_org_date_idx ON public.interviews(organization_id, date);

UPDATE public.pipeline_candidates p SET organization_id = o.organization_id
FROM public.opportunities o WHERE p.opportunity_id = o.id AND o.organization_id IS NOT NULL
AND p.organization_id IS DISTINCT FROM o.organization_id;
CREATE INDEX IF NOT EXISTS pipeline_candidates_org_opportunity_idx ON public.pipeline_candidates(organization_id, opportunity_id, stage);

-- The legacy activity identifier is integer, whereas candidates now use UUIDs.
ALTER TABLE public.pipeline_activities ADD COLUMN IF NOT EXISTS candidate_uuid uuid REFERENCES public.pipeline_candidates(id);
ALTER TABLE public.pipeline_activities ALTER COLUMN pipeline_candidate_id DROP NOT NULL;
UPDATE public.pipeline_activities a SET candidate_uuid = p.id FROM public.pipeline_candidates p
WHERE a.candidate_uuid IS NULL AND p.id_old = a.pipeline_candidate_id;
CREATE INDEX IF NOT EXISTS pipeline_activities_candidate_date_idx ON public.pipeline_activities(candidate_uuid, created_at DESC);

-- Review history must not share an editable free-form notes field.
CREATE TABLE IF NOT EXISTS public.recruitment_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applied_jobs(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  actor_id uuid REFERENCES public.users(id),
  from_status text NOT NULL, to_status text NOT NULL, note text NOT NULL DEFAULT '', previous_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recruitment_application_events_application_idx ON public.recruitment_application_events(application_id, created_at);
ALTER TABLE public.recruitment_application_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recruitment_application_events FROM anon, authenticated;
GRANT SELECT, INSERT ON public.recruitment_application_events TO service_role;

ALTER TABLE public.applied_jobs ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.users(id);
CREATE OR REPLACE FUNCTION public.record_recruitment_application_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE tenant_id uuid;
BEGIN
  IF OLD.application_status IS DISTINCT FROM NEW.application_status OR OLD.notes IS DISTINCT FROM NEW.notes THEN
    SELECT organization_id INTO tenant_id FROM public.opportunities WHERE id = NEW.opportunity_id;
    IF tenant_id IS NOT NULL THEN
      INSERT INTO public.recruitment_application_events(application_id, organization_id, actor_id, from_status, to_status, note, previous_notes)
      VALUES (NEW.id, tenant_id, NEW.updated_by, OLD.application_status, NEW.application_status, COALESCE(NEW.notes, ''), OLD.notes);
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.record_recruitment_application_change() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS recruitment_application_change ON public.applied_jobs;
CREATE TRIGGER recruitment_application_change AFTER UPDATE ON public.applied_jobs
FOR EACH ROW EXECUTE FUNCTION public.record_recruitment_application_change();

ALTER TABLE public.shortlists ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.shortlists ADD COLUMN IF NOT EXISTS include_pii boolean NOT NULL DEFAULT false;
ALTER TABLE public.shortlists ADD COLUMN IF NOT EXISTS notify_on_access boolean NOT NULL DEFAULT false;
ALTER TABLE public.shortlists ADD COLUMN IF NOT EXISTS share_token_hash text;
ALTER TABLE public.shortlists ADD COLUMN IF NOT EXISTS share_organization_id uuid REFERENCES public.organizations(id);
CREATE UNIQUE INDEX IF NOT EXISTS shortlists_share_token_hash_idx ON public.shortlists(share_token_hash) WHERE share_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS shortlists_creator_date_idx ON public.shortlists(created_by, created_date DESC);
CREATE INDEX IF NOT EXISTS shortlists_tags_idx ON public.shortlists USING gin(tags);

-- Recruiter verification is an organization's review of work, not a change to
-- the institution's approval of the learner's original project.
CREATE TABLE IF NOT EXISTS public.recruitment_work_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  note text NOT NULL DEFAULT '', reviewed_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, project_id)
);
ALTER TABLE public.recruitment_work_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recruitment_work_reviews FROM anon, authenticated;
GRANT ALL ON public.recruitment_work_reviews TO service_role;

CREATE TABLE IF NOT EXISTS public.recruitment_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  description text NOT NULL DEFAULT '', skills text[] NOT NULL DEFAULT '{}',
  budget_min numeric(14,2), budget_max numeric(14,2), currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','in_progress','completed','cancelled')),
  deadline date, created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (budget_min IS NULL OR budget_min >= 0),
  CHECK (budget_max IS NULL OR budget_max >= 0),
  CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min)
);
CREATE INDEX IF NOT EXISTS recruitment_projects_org_updated_idx ON public.recruitment_projects(organization_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS public.recruitment_project_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.recruitment_projects(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.learners(id), amount numeric(14,2) CHECK(amount >= 0),
  cover_letter text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','shortlisted','accepted','rejected','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id,learner_id)
);
CREATE INDEX IF NOT EXISTS recruitment_project_proposals_project_idx ON public.recruitment_project_proposals(project_id);
CREATE TABLE IF NOT EXISTS public.recruitment_project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.recruitment_projects(id) ON DELETE CASCADE,
  title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200), description text NOT NULL DEFAULT '',
  amount numeric(14,2) CHECK(amount >= 0), due_date date,
  status text NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','in_progress','submitted','approved')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recruitment_project_milestones_project_idx ON public.recruitment_project_milestones(project_id);
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['recruitment_projects','recruitment_project_proposals','recruitment_project_milestones'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
