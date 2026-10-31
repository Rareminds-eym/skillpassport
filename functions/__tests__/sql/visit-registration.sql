-- Run against a seeded local database. All writes are rolled back.
BEGIN;
DO $$
DECLARE learner uuid; visit uuid; original_date timestamptz; original_id uuid;
BEGIN
  SELECT l.id,o.id INTO STRICT learner,visit
    FROM public.learners l CROSS JOIN public.opportunities o
    WHERE l.is_deleted=false AND o.employment_type='factory_visit' AND o.is_active
      AND NOT EXISTS (SELECT 1 FROM public.applied_jobs a WHERE a.learner_id=l.id AND a.opportunity_id=o.id)
    ORDER BY l.id,o.id LIMIT 1;
  INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status,applied_at)
    VALUES(learner,visit,'applied',clock_timestamp())
    ON CONFLICT(learner_id,opportunity_id) DO NOTHING
    RETURNING id,applied_at INTO original_id,original_date;
  INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status,applied_at)
    VALUES(learner,visit,'applied',clock_timestamp()+interval '1 day')
    ON CONFLICT(learner_id,opportunity_id) DO NOTHING;
  ASSERT (SELECT count(*)=1 FROM public.applied_jobs WHERE learner_id=learner AND opportunity_id=visit), 'Retry created duplicate registration';
  ASSERT (SELECT id=original_id AND applied_at=original_date AND application_status='applied'
    FROM public.applied_jobs WHERE learner_id=learner AND opportunity_id=visit), 'Retry overwrote the original registration';
END $$;
ROLLBACK;
