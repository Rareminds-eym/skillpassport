-- Rareminds recruitment application seed.
-- Applications from recruitment_seed_all_companies_simple_notes.xlsx.
-- Generated: 2026-11-17. 171 applications.
-- Email corrections applied inline (Excel not modified):
--   row 5: chethan.sims@gmail.com -> gowdachethu83@gmail.com
--   row 34: sumithasenthilkumar0225@gmail.com -> sumithasenthil0225@gmail.com
--   row 93: sumithasenthilkumar0225@gmail.com -> sumithasenthil0225@gmail.com
--   row 109: likhitha.b.sims@gmail.com -> likhib612@gmail.com
-- Recruiter: Krishna (578fec10-6725-4713-bc36-e4e213c258c8).
-- Learner lookup via email from public.learners — missing learners are silently skipped.
-- Idempotent: ON CONFLICT (opportunity_id, learner_id) DO NOTHING.

BEGIN;
SET LOCAL standard_conforming_strings = on;

DO $app_seed$
BEGIN
    -- Guard: Rareminds org and Krishna recruiter must exist
    IF NOT EXISTS (
        SELECT 1 FROM public.organizations o
        JOIN public.recruiters r ON r.id = '578fec10-6725-4713-bc36-e4e213c258c8'::uuid
        WHERE o.id = 'd0e361a8-c601-48b0-9ece-c8328f11e09d'::uuid
          AND public.is_org_member(r.user_id, o.id)
    ) THEN
        RAISE NOTICE 'Application seed: Rareminds prerequisites missing. Apply recruitment prerequisites first.';
        RETURN;
    END IF;

    -- EXP-MBA-DELL: ppavan50559@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '6c91fafe-879b-5670-8ae3-ac8b82e417f6'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('ppavan50559@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: ddeekshith920@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '7384d3c9-ff64-585a-8881-c055b0b6eb1a'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('ddeekshith920@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DIAGEO: jhenkaragowda212@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '69a0f879-65ee-50b7-b2a6-47e1bbc059c1'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '7f7f107c-3838-5c98-8d89-57b7fded034f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('jhenkaragowda212@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MKT-VCM: gowdachethu83@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '6e832aa4-f429-5f7c-85b6-b2ae403059df'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'hired',
        'active',
        'e4f41111-d0a5-5052-b315-8caf657c201e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Joined (CTC INR6 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('gowdachethu83@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RADIALL: jeevithadn47@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '154d4bea-b5a4-59b6-8241-d89de2d67b1a'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        '33c71661-ace7-59a7-9af3-99d7171e2de0'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('jeevithadn47@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DELL: abhisheknd267@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '83a2cfe0-ce64-55d4-9a8c-ab8d57b83f03'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('abhisheknd267@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-BRICK: mgagana69@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '953ec135-6d0b-552a-9076-16489de2227f'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        'd898e24a-6ff2-53f5-ac20-875008312fd1'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('mgagana69@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RADIALL: vinodvinu3123@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '50845657-d15d-518d-ad44-b23f9665a39a'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '33c71661-ace7-59a7-9af3-99d7171e2de0'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('vinodvinu3123@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-JMR: hemantahemanth79@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '3b2a98d9-23cd-5e13-802e-d61f0b64a115'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        'c0b588c8-c1d8-5880-a05c-e08d148c4ad8'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemantahemanth79@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DELL: abhikdabhi@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'c5dcc267-173e-5c87-9af4-efd1dea9b1a2'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('abhikdabhi@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-CITRINE: shivakumar07505@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '3df755e1-ef41-5db9-87bf-fa1a3f1ef4ef'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '8e2e2965-e8e9-5b1c-b2d6-3b95615542c8'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('shivakumar07505@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DELL: bhavyamt2907@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '128d70fe-589f-55dd-958f-5a6c738305d7'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('bhavyamt2907@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MKT-VCM: rakshithps4477@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '5083b5ab-66fe-5deb-97e1-41b9325bd23c'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'offer',
        'active',
        'e4f41111-d0a5-5052-b315-8caf657c201e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Offer accepted (CTC INR6 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('rakshithps4477@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RM: lohithks2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '70259372-6d34-59c4-9280-50a1e12b34ff'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        '85ecc83d-148d-5b19-aea3-321a94db6be2'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lohithks2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DIAGEO: sahanaanandaiah@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'c4a5912c-780d-5c02-b6b5-7ce9f5c281dd'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '7f7f107c-3838-5c98-8d89-57b7fded034f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('sahanaanandaiah@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DELL: hemu818hr@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '833c6fc6-9089-5391-ac9f-f6604d92f53f'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemu818hr@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: yamunanm8@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '2d6768e7-e39e-56f0-aac7-40a3ed2d19a4'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('yamunanm8@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RADIALL: thanukrishna.am@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '3a84531d-c219-5c26-acc2-f5c9e8c0f7b7'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '33c71661-ace7-59a7-9af3-99d7171e2de0'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('thanukrishna.am@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-SUTH: narayannarayan0726@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'f917e761-6f4f-5e91-8a82-468ae1ac1ad0'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        'ac80cce7-c79e-5215-bc24-774b0239e697'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('narayannarayan0726@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-CITRINE: santhoshsanthu00121@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '31fe3838-c8a5-54ca-93da-a1932f512e46'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '8e2e2965-e8e9-5b1c-b2d6-3b95615542c8'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('santhoshsanthu00121@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RADIALL: chaithanyatr24@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '8b18edd1-c1a6-5b7c-91d9-1d407a9cefec'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '33c71661-ace7-59a7-9af3-99d7171e2de0'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('chaithanyatr24@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DELL: smmamatha910@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'aea0b48d-2987-5f76-bd6d-e5d781678310'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('smmamatha910@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: rajeshwarihiremath521@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '5a4b7eeb-bb21-5561-81ff-0a0630c08c31'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('rajeshwarihiremath521@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-CITRINE: priyankaammu663@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '37a89e76-895b-5b9f-b731-6639b5a846a3'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '8e2e2965-e8e9-5b1c-b2d6-3b95615542c8'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('priyankaammu663@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: vaishnavigopinath03@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '3ca1a8de-f1f5-5d27-a35a-60032eef5366'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('vaishnavigopinath03@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DELL: sanjanamesthacareer@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '47f1daf7-2cad-5c5c-94db-d042ec2fb9f4'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('sanjanamesthacareer@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: m.jayashree352@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '1ac7bb44-cb2c-52d6-ac0c-b9e378fabe83'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('m.jayashree352@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DIAGEO: chandanaks547@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'cd04bb3d-0cda-57bb-affe-b3b4831423ef'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '7f7f107c-3838-5c98-8d89-57b7fded034f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('chandanaks547@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: sunanda.anusha@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'e08a3486-2bdd-5f50-8241-70b2947638a8'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('sunanda.anusha@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DELL: varshajaishankar06@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '21f48da1-f134-5cf3-b4e3-770355e4455f'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('varshajaishankar06@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-APOLLO: sumithasenthil0225@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'e0c440bc-666b-55d1-bcb8-bccb0f6d4488'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '47e6eed5-0f01-5aa5-bedc-85d4e0b421aa'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('sumithasenthil0225@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RM: jeevithav01@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '20ba7794-b084-5079-b617-93fffa179c69'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        '85ecc83d-148d-5b19-aea3-321a94db6be2'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('jeevithav01@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RM: varshithahs626@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '9f35ea77-fa84-55d2-9d52-777732a46819'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        '85ecc83d-148d-5b19-aea3-321a94db6be2'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('varshithahs626@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RADIALL: shobithar91@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '394e6c32-a2bc-56d0-abe6-e55b4a114401'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '33c71661-ace7-59a7-9af3-99d7171e2de0'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('shobithar91@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-JMR: bhumikabharath252@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '9174f88f-2c97-569c-a07c-f53a92325e07'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        'c0b588c8-c1d8-5880-a05c-e08d148c4ad8'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('bhumikabharath252@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-CITRINE: varungb04@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'f492ce61-5e25-5284-90dd-1485672c744b'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '8e2e2965-e8e9-5b1c-b2d6-3b95615542c8'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('varungb04@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RADIALL: simrithasuresh31@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'c41d22b8-53fb-5619-95e7-4a0d6a2b263c'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '33c71661-ace7-59a7-9af3-99d7171e2de0'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('simrithasuresh31@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-HR-RM: hariprasadnayak77280@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '1882fa6f-b7ca-5ba2-98d9-e5cc630fa1e4'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'hired',
        'active',
        '84a03a98-1647-5882-8767-4a49c3dca924'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Joined (CTC INR4.50 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hariprasadnayak77280@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: lokeshloki3497@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '5c41af88-e736-5478-bb21-50ba620c3aa3'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lokeshloki3497@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DIAGEO: ambujakhgowda@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '35b4197a-d6bf-5a47-bba5-fe613f0a2201'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '7f7f107c-3838-5c98-8d89-57b7fded034f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('ambujakhgowda@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-BRICK: shwethag395@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'aa5b16e9-7933-5c43-a83e-1397fa371496'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        'd898e24a-6ff2-53f5-ac20-875008312fd1'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('shwethag395@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DELL: hemanthgowdaa755@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '47a27c15-25d0-587e-9a53-dfcc1c79c654'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemanthgowdaa755@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-SUTH: priyankapriyanka54295@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'ee1838ad-4030-51d7-8be1-98c3687de59e'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        'ac80cce7-c79e-5215-bc24-774b0239e697'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('priyankapriyanka54295@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-CITRINE: kasarvidyashree@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '3a4e4837-ca86-5b69-8dbc-a0dffaad1d9e'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '8e2e2965-e8e9-5b1c-b2d6-3b95615542c8'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('kasarvidyashree@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: hcmanoj47@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '7823678a-0317-5b3f-9ae9-b4f24097e15c'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hcmanoj47@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: kantharajurn17@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '05483dce-b9d7-5b11-95a1-059d5222227a'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('kantharajurn17@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-BRICK: gaganaks029@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '51db72fb-e3f2-5b2b-8e82-acc33122917c'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        'd898e24a-6ff2-53f5-ac20-875008312fd1'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('gaganaks029@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-SUTH: sinchana2393@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'fc44e5f9-f70b-5049-b542-65c1f18fcb9d'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ac80cce7-c79e-5215-bc24-774b0239e697'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('sinchana2393@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DELL: cchaithran698@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '55693cf6-690c-53e3-9d6b-e1287f287300'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('cchaithran698@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DELL: tejababurajan@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '43f5dfcf-fb6d-5d6d-873b-f9beed636828'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('tejababurajan@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-JMR: yashaswinigowda601@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '4f31a23b-2fe6-5794-b51f-89310e234854'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        'c0b588c8-c1d8-5880-a05c-e08d148c4ad8'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('yashaswinigowda601@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: nageshwarik219@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '48e747ce-82dc-58ed-9d47-7872fa13fb7f'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('nageshwarik219@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DELL: varshinivarshanb@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '310a20cd-3507-5b3a-b7ce-29979e38d9d2'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        'f39b4bee-0d9a-57de-8a95-c745a8e31f98'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('varshinivarshanb@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-WEB-RM: chettyleo19@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '38fe4bac-addc-5d79-a8d6-ca92b673ea14'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        '4c5aa9f9-aa68-5421-838f-63c948749d7f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('chettyleo19@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-WEB-RM: dakshdograg15@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '0c25d574-c85e-5bc5-abfb-07d001229b5b'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'offer',
        'active',
        '4c5aa9f9-aa68-5421-838f-63c948749d7f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Offer accepted (CTC INR6 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('dakshdograg15@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-WEB-RM: bhoomika19503@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '116b325e-569e-53a9-978a-82b3eac469bd'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '4c5aa9f9-aa68-5421-838f-63c948749d7f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('bhoomika19503@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-WEB-RM: abhijith22abhi22@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '212dbadc-2031-5e0e-8c3d-d4791032de55'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        '4c5aa9f9-aa68-5421-838f-63c948749d7f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('abhijith22abhi22@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-WEB-RM: sanjay299sanju@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'ca2e7dbd-ecf7-5fac-90ef-ef44c3db5376'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'offer',
        'active',
        '4c5aa9f9-aa68-5421-838f-63c948749d7f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Offer accepted (CTC INR6 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('sanjay299sanju@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-WEB-RM: lavanya13142003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'd53654e4-3f1a-57ce-a7c5-12f462301d2f'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'offer',
        'active',
        '4c5aa9f9-aa68-5421-838f-63c948749d7f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Offer accepted (CTC INR4.50 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lavanya13142003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-WEB-RM: nalinagowda40@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'f502dee0-8640-5942-99bb-3439d76053df'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '4c5aa9f9-aa68-5421-838f-63c948749d7f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('nalinagowda40@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MKT-VCM: abhikdabhi@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '8a9af10a-90b4-59bb-9ec8-ff3936e82029'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'hired',
        'active',
        'e4f41111-d0a5-5052-b315-8caf657c201e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Joined (CTC INR5 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-10-15T00:00:00+00:00'::timestamptz,
        '2026-10-15T00:00:00+00:00'::timestamptz,
        '2026-10-15T00:00:00+00:00'::timestamptz,
        '2026-10-15T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('abhikdabhi@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-FIN-RM: gowdachethu83@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '73d03cd8-7d8d-58d9-bbbb-456bf7c9cd74'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'hired',
        'active',
        '51375608-69da-5b28-a44e-7e3797717c89'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Joined (CTC INR6 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-10-15T00:00:00+00:00'::timestamptz,
        '2026-10-15T00:00:00+00:00'::timestamptz,
        '2026-10-15T00:00:00+00:00'::timestamptz,
        '2026-10-15T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('gowdachethu83@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-WEB-RM: sevanthi752@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '02f3c232-b043-5e99-8185-9ede074cc682'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'offer',
        'active',
        '4c5aa9f9-aa68-5421-838f-63c948749d7f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Offer accepted (CTC INR4.50 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-10-15T00:00:00+00:00'::timestamptz,
        '2026-10-15T00:00:00+00:00'::timestamptz,
        '2026-10-15T00:00:00+00:00'::timestamptz,
        '2026-10-15T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('sevanthi752@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MKT-VCM: shivaganesh2046@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'cc4c7132-94c0-5a4c-b131-f61ea976d509'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        'e4f41111-d0a5-5052-b315-8caf657c201e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Withdrawn - Candidate dropped from drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('shivaganesh2046@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: ppavan50559@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '81470f9b-d740-5c36-8440-02910ab9aa91'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('ppavan50559@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-DIAGEO: ddeekshith920@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '5775d853-64fd-5ae9-8d2e-b86b99049955'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '7f7f107c-3838-5c98-8d89-57b7fded034f'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('ddeekshith920@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MKT-VCM: jhenkaragowda212@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'fefa7080-62cf-526a-bf83-475db22987c1'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        'e4f41111-d0a5-5052-b315-8caf657c201e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('jhenkaragowda212@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MKT-VCM: hemanthsj2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'bfc071a9-d1ab-5657-8ff2-12766b5fd874'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        'e4f41111-d0a5-5052-b315-8caf657c201e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'On hold',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemanthsj2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MKT-VCM: abhisheknd267@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '924c5df9-71c0-58d3-bc94-37284a29b46a'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'hired',
        'active',
        'e4f41111-d0a5-5052-b315-8caf657c201e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Joined (CTC INR4.50 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('abhisheknd267@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-LEGION: vinodvinu3123@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '26146172-e2e0-5b7d-83c4-54baa274e736'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        'e11a8317-bf1d-598d-9708-45859f20d483'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Withdrawn - Candidate dropped - location preference (Chintamani)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('vinodvinu3123@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: rajeshin2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '7c6fe3ac-045b-5257-8b47-efa81889d4cc'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'offer',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Offer extended (CTC INR3 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('rajeshin2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-046: rajeshin2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'a8f631b7-80f3-5287-9a4c-6610051f0f53'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'af913532-c91f-588a-b307-8a2398173bb4'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('rajeshin2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: hemantahemanth79@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '59e03da1-07bb-5d1f-b76e-97dc2b82d5e9'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemantahemanth79@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-046: gowdachethu83@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '816b9b2d-4a05-5db7-8c00-ba5fed2123ff'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'af913532-c91f-588a-b307-8a2398173bb4'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('gowdachethu83@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: shivakumar07505@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '3bbae2e3-41b4-50bc-b021-dc894015061e'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('shivakumar07505@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: lohithks2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '24fa9e76-9258-5ee6-9e84-4e386e69ec4f'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('lohithks2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: hemu818hr@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '22cf77d5-f30b-5677-97b8-542158e22df9'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('hemu818hr@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-046: yamunanm8@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'acc19da0-6a30-5510-9e9d-16eccd47fc7c'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'af913532-c91f-588a-b307-8a2398173bb4'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('yamunanm8@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: thanukrishna.am@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'f532aead-97c2-5079-8feb-584b3c45e287'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'On hold',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('thanukrishna.am@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-LEGION: thanukrishna.am@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '5e6475c7-5abb-5e6e-af30-ce0033feaaa8'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        'e11a8317-bf1d-598d-9708-45859f20d483'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Withdrawn - Candidate dropped - location preference (Chintamani)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('thanukrishna.am@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-HR-RM: thanukrishna.am@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '10094f84-7329-583a-90f3-9feb00f238c5'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '84a03a98-1647-5882-8767-4a49c3dca924'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'On hold',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('thanukrishna.am@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RADIALL: cchaithran698@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'ed81745c-8805-57fd-93a8-3b20d305ae21'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        '33c71661-ace7-59a7-9af3-99d7171e2de0'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('cchaithran698@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-046: rajeshwarihiremath521@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '89dc17de-6735-539b-9b9b-f5e55b132ea3'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'af913532-c91f-588a-b307-8a2398173bb4'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('rajeshwarihiremath521@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MKT-VCM: vaishnavigopinath03@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '0f949e27-57f9-511a-bc77-a3a44c1dca7e'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        'e4f41111-d0a5-5052-b315-8caf657c201e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('vaishnavigopinath03@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RADIALL: sanjanamesthacareer@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'e41ac7af-c83e-5a9f-99a1-889130131703'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        '33c71661-ace7-59a7-9af3-99d7171e2de0'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('sanjanamesthacareer@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-046: m.jayashree352@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '06f74188-9d58-5ffd-a2d0-98061f00c066'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'af913532-c91f-588a-b307-8a2398173bb4'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('m.jayashree352@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-046: sunanda.anusha@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '20c3e508-5d8a-5071-8f7f-b803d10a4a5d'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'af913532-c91f-588a-b307-8a2398173bb4'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('sunanda.anusha@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-LEGION: varshajaishankar06@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'b58a852a-ec1b-5ff9-9d18-dcf01f1e99f1'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        'e11a8317-bf1d-598d-9708-45859f20d483'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Withdrawn - Candidate dropped - location preference (Chintamani)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('varshajaishankar06@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-HR-RM: varshajaishankar06@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'd174aeb0-d6a0-528f-8010-122f4bc52b10'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        '84a03a98-1647-5882-8767-4a49c3dca924'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('varshajaishankar06@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RADIALL: sumithasenthil0225@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '69b2b6b6-6661-5192-8839-3ccc567b8620'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        '33c71661-ace7-59a7-9af3-99d7171e2de0'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('sumithasenthil0225@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-LEGION: shobithar91@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '8b03b1b1-f308-5481-a173-d20a78e720dd'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        'e11a8317-bf1d-598d-9708-45859f20d483'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Withdrawn - Candidate dropped - location preference (Chintamani)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('shobithar91@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: varungb04@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'b1da5f57-fefe-58c7-8259-e953caa4fa28'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('varungb04@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: lokeshloki3497@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '541e7fb8-6ffe-5bef-aec4-05841c32603a'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('lokeshloki3497@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-046: lokeshloki3497@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '3312614f-9b3d-5631-a9c3-053a0b89f160'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'af913532-c91f-588a-b307-8a2398173bb4'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lokeshloki3497@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: hemanthgowdaa755@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '6946a878-2534-5be9-933f-f659d2787bb8'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('hemanthgowdaa755@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-046: hcmanoj47@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '8d15d5ec-a5eb-5add-93a7-185a2e8f8920'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'af913532-c91f-588a-b307-8a2398173bb4'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hcmanoj47@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-046: kantharajurn17@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '6454c7c5-b4d4-597d-8a87-ed5c9c83d4d4'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'af913532-c91f-588a-b307-8a2398173bb4'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('kantharajurn17@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: cchaithran698@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'ab22e6c0-7c40-56b4-b94d-dc4a6d0c6f08'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Not selected',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('cchaithran698@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: tejababurajan@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'b8e70293-939b-54fb-a788-c42b8fd91afe'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'offer',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Offer extended (CTC INR3 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('tejababurajan@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-LEGION: tejababurajan@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '6cf9476e-67b6-5653-a064-c6e4c120d74a'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        'e11a8317-bf1d-598d-9708-45859f20d483'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Withdrawn - Candidate dropped - location preference (Chintamani)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('tejababurajan@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-046: nageshwarik219@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'e845a5a4-1f8d-576c-bb6d-075d18f6a92f'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'af913532-c91f-588a-b307-8a2398173bb4'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('nageshwarik219@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: varshinivarshanb@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '9b3d322e-9ae0-52bf-a341-9f85c053d3d0'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'On hold',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('varshinivarshanb@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-LEGION: varshinivarshanb@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '72e6aca8-06b2-57a6-b77f-cf22c11bb9a1'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'rejected',
        'active',
        'e11a8317-bf1d-598d-9708-45859f20d483'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Withdrawn - Candidate dropped - location preference (Chintamani)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz
    FROM public.learners l
    WHERE lower(l.email) = lower('varshinivarshanb@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-BRICK: harshaabhi56@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '71f9231e-1fd9-5776-bcf1-976e2ab9411e'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'd898e24a-6ff2-53f5-ac20-875008312fd1'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('harshaabhi56@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RM: roopeshgc2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '8884dcef-c6a4-5821-b852-6396fd519d09'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'offer',
        'active',
        '85ecc83d-148d-5b19-aea3-321a94db6be2'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Offer extended (CTC INR5 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('roopeshgc2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-SUTH: likhib612@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '7825e55d-5350-5086-90ee-ddd05e6e0b73'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ac80cce7-c79e-5215-bc24-774b0239e697'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('likhib612@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-PFC: chaithanyatr24@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '53b81ee8-7d48-59ba-a81a-fee23baf4c1d'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'offer',
        'active',
        '27427329-35d8-5282-a5fa-02f46ac0e206'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Offer extended (CTC INR3 LPA)',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('chaithanyatr24@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-RADIALL: narayannarayan0726@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '33b912d4-8665-5561-ae22-99f8f60938e7'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '33c71661-ace7-59a7-9af3-99d7171e2de0'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('narayannarayan0726@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-5C: shivaganesh2046@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '5c7fac85-39ff-5de1-9eb4-1c96c9c52c3e'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '59de0176-9d04-59d6-888f-95862ec77d21'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('shivaganesh2046@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-5C: ppavan50559@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'dfc38442-4196-5ff0-aa58-d4ff922966e3'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '59de0176-9d04-59d6-888f-95862ec77d21'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('ppavan50559@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-GAGAN: ppavan50559@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '4833e1cf-5390-538a-ad44-c9f7eb0e32a5'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '70e2c2d3-fdbf-5be0-b794-af589ee0295d'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('ppavan50559@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-ROLLWELL: ppavan50559@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'c8e2a86b-0319-5fac-8284-974fb1e6b128'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '3a4eb026-6d68-577d-95ea-452364b7494e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('ppavan50559@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-5C: hemanthsj2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '9d603a0a-e136-5f99-8b5a-e59eec2958f2'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '59de0176-9d04-59d6-888f-95862ec77d21'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemanthsj2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-GAGAN: hemanthsj2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '1a9c816f-0497-57d3-bfe8-536b2cb39ca0'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '70e2c2d3-fdbf-5be0-b794-af589ee0295d'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemanthsj2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POSHIUM: hemanthsj2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '5727bb30-9b52-5073-bfab-5136d77c4520'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '64631956-1f68-51cc-bd04-07ecfa742e85'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemanthsj2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-SECON: vinodvinu3123@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '0217aaf9-0ffa-56e2-94d0-bdcde70e3fe4'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'daca42d2-9b66-50b2-9596-1d16171d6d3d'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('vinodvinu3123@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-5C: rajeshin2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'bbb82785-01f2-591c-9baf-c26bd25050f3'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '59de0176-9d04-59d6-888f-95862ec77d21'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('rajeshin2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-ROLLWELL: rajeshin2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '9bb69e00-6c4a-59d8-9fa6-edff7dd5cadb'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '3a4eb026-6d68-577d-95ea-452364b7494e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('rajeshin2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-5C: hemantahemanth79@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '9bfa3f2f-8fa5-5535-9489-6c5f4b68f70e'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '59de0176-9d04-59d6-888f-95862ec77d21'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemantahemanth79@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-GAGAN: hemantahemanth79@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'e5310ccf-1be3-5343-b480-028451de63e5'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '70e2c2d3-fdbf-5be0-b794-af589ee0295d'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemantahemanth79@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-ROLLWELL: hemantahemanth79@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'eebbb17e-ff44-54c6-921c-93836a708e1e'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'screened',
        'active',
        '3a4eb026-6d68-577d-95ea-452364b7494e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Shortlisted for interview',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemantahemanth79@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-5C: shivakumar07505@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '97b67a09-5868-59c9-982e-7039a372b30d'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '59de0176-9d04-59d6-888f-95862ec77d21'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('shivakumar07505@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-GAGAN: shivakumar07505@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'ad09f668-3523-5e12-9959-93bedc7766ff'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '70e2c2d3-fdbf-5be0-b794-af589ee0295d'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('shivakumar07505@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POSHIUM: shivakumar07505@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '8c37b29c-2dfa-5bff-a66d-0d8a3b88c07a'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '64631956-1f68-51cc-bd04-07ecfa742e85'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('shivakumar07505@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-ROLLWELL: shivakumar07505@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '1766e51f-a0c0-5e4f-a013-5dc4e1dc3ed3'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '3a4eb026-6d68-577d-95ea-452364b7494e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('shivakumar07505@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-5C: lohithks2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'd8161176-8fd3-5309-b9a4-bf4cbd70fcfe'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '59de0176-9d04-59d6-888f-95862ec77d21'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lohithks2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-GAGAN: lohithks2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '568acf2c-3757-533f-bb4e-69a2db9477c2'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '70e2c2d3-fdbf-5be0-b794-af589ee0295d'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lohithks2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POSHIUM: lohithks2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '21a07956-79a2-502e-9f8b-59ca548d0a37'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '64631956-1f68-51cc-bd04-07ecfa742e85'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lohithks2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-ROLLWELL: lohithks2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'd049f765-690e-5018-9ce2-609a9996f29a'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '3a4eb026-6d68-577d-95ea-452364b7494e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lohithks2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-5C: hemu818hr@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '9b1fadcd-89f5-579f-b9c4-3a15c2efcf7d'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '59de0176-9d04-59d6-888f-95862ec77d21'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemu818hr@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-GAGAN: hemu818hr@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '22428bb1-a498-5741-93e0-2df1e3f6ae31'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '70e2c2d3-fdbf-5be0-b794-af589ee0295d'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemu818hr@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POSHIUM: hemu818hr@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '74b88f18-7a78-5c1a-8d86-6cde354e2d2f'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '64631956-1f68-51cc-bd04-07ecfa742e85'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemu818hr@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-5C: cchaithran698@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '0332601b-39e4-5d9d-a49e-71e9398bdd96'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '59de0176-9d04-59d6-888f-95862ec77d21'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('cchaithran698@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POSHIUM: cchaithran698@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '8ddc5132-45f1-52c8-bb73-4dd71913cd45'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '64631956-1f68-51cc-bd04-07ecfa742e85'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('cchaithran698@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-ROLLWELL: varshajaishankar06@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '759cd6ac-e49b-56fd-afdd-70e9b06a5ff6'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '3a4eb026-6d68-577d-95ea-452364b7494e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('varshajaishankar06@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-5C: varungb04@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '8fd13ded-0544-54b2-a0f2-e7636092794a'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '59de0176-9d04-59d6-888f-95862ec77d21'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('varungb04@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-GAGAN: varungb04@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '3c22b218-a81e-53b8-b985-1dc2df689b8b'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '70e2c2d3-fdbf-5be0-b794-af589ee0295d'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('varungb04@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-ROLLWELL: varungb04@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '2a630633-6275-5cce-8dcc-307585488cd4'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '3a4eb026-6d68-577d-95ea-452364b7494e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('varungb04@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-GAGAN: lokeshloki3497@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '7fdfb569-e77c-552f-bc44-9d0c39bc493a'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '70e2c2d3-fdbf-5be0-b794-af589ee0295d'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lokeshloki3497@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POSHIUM: lokeshloki3497@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '7a19a70e-b7e1-5cab-88a6-77511d8fd041'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '64631956-1f68-51cc-bd04-07ecfa742e85'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lokeshloki3497@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-5C: hemanthgowdaa755@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '6ac30378-8704-5bf0-b208-df4fd6de6d24'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '59de0176-9d04-59d6-888f-95862ec77d21'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemanthgowdaa755@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-GAGAN: hemanthgowdaa755@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '49e2784e-120d-5b9d-aa30-db61f6fac6d9'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '70e2c2d3-fdbf-5be0-b794-af589ee0295d'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemanthgowdaa755@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POSHIUM: hemanthgowdaa755@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '6bb703d3-530e-5f22-8606-b2cc2346cfc5'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '64631956-1f68-51cc-bd04-07ecfa742e85'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemanthgowdaa755@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-ROLLWELL: hemanthgowdaa755@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '165849fe-b6c6-55ff-a3ac-20bb0c39b881'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '3a4eb026-6d68-577d-95ea-452364b7494e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hemanthgowdaa755@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-GAGAN: cchaithran698@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '3696d724-7b23-5f61-8464-5ca4c89e9139'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        '70e2c2d3-fdbf-5be0-b794-af589ee0295d'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('cchaithran698@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MKT-VCM: varshinivarshanb@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'b125c99b-f77a-574f-a111-3964a8aee524'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'interview_1',
        'active',
        'e4f41111-d0a5-5052-b315-8caf657c201e'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Interview in progress',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('varshinivarshanb@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-JMR: lavlavanya6360@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'bdf25d5b-2461-59b8-b004-8c43385b0fff'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ea551b05-ac59-5933-841d-49930327aaed'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lavlavanya6360@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-ATOLL: lavlavanya6360@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '7ee0369d-fc14-52d5-91e9-b1bdc29482a7'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'b6c36fab-34ab-59a2-b5e3-02f93c3f95c6'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('lavlavanya6360@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-JMR: akhilapinky1012@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '103204e1-f2c3-511e-8329-00e42ddc98be'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ea551b05-ac59-5933-841d-49930327aaed'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('akhilapinky1012@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-ATOLL: akhilapinky1012@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'a69eed68-f24f-5a56-adc8-725f5a058a4b'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'b6c36fab-34ab-59a2-b5e3-02f93c3f95c6'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('akhilapinky1012@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-JMR: nalinagowda40@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '01fe951f-3353-5213-afc0-31c7d51ccd28'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ea551b05-ac59-5933-841d-49930327aaed'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('nalinagowda40@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-ATOLL: nalinagowda40@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'ccc6b6f1-0ce6-53b4-9e7f-f2074f25d950'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'b6c36fab-34ab-59a2-b5e3-02f93c3f95c6'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('nalinagowda40@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-JMR: chettyleo19@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'ecb346cc-dad4-54db-b795-3643236e12d3'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ea551b05-ac59-5933-841d-49930327aaed'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('chettyleo19@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-ATOLL: chettyleo19@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'ce7edc60-f992-50ff-bcfd-a278a8725a46'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'b6c36fab-34ab-59a2-b5e3-02f93c3f95c6'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('chettyleo19@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-JMR: nayanaks1233@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '151f6986-3f89-5ad8-a536-4154b31f8b52'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ea551b05-ac59-5933-841d-49930327aaed'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('nayanaks1233@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-ATOLL: nayanaks1233@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '2d4d6b79-094c-5478-98eb-3b9e8da014ff'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'b6c36fab-34ab-59a2-b5e3-02f93c3f95c6'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('nayanaks1233@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-JMR: bhoomika19503@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'e3ab226e-c1f6-510f-b5fb-502cdc7a766e'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ea551b05-ac59-5933-841d-49930327aaed'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('bhoomika19503@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-ATOLL: bhoomika19503@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '97322890-28e4-573d-a025-4e76e7d72cee'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'b6c36fab-34ab-59a2-b5e3-02f93c3f95c6'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('bhoomika19503@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-JMR: hamsangowda3@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'd125b726-4f5c-5f91-a523-f3bc4db9c876'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ea551b05-ac59-5933-841d-49930327aaed'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hamsangowda3@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-ATOLL: hamsangowda3@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '1f44f0f0-4acc-5cb8-8a7f-8f1e6a959ba1'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'b6c36fab-34ab-59a2-b5e3-02f93c3f95c6'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('hamsangowda3@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-JMR: meghanamv347@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '5cb1dab6-0bc6-5df6-ae63-f70de3c19fbe'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ea551b05-ac59-5933-841d-49930327aaed'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('meghanamv347@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-ATOLL: meghanamv347@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '8eb8072e-1977-50b7-af37-19d4d94be7c5'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'b6c36fab-34ab-59a2-b5e3-02f93c3f95c6'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('meghanamv347@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-JMR: pradeepgeetha09@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'da2dd374-e45e-5887-abaf-7c7e3b5581e8'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ea551b05-ac59-5933-841d-49930327aaed'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('pradeepgeetha09@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-ATOLL: pradeepgeetha09@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '9e861064-37ec-5e8b-b760-80aa63cc545e'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'b6c36fab-34ab-59a2-b5e3-02f93c3f95c6'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('pradeepgeetha09@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-JMR: harshil.connect.in@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '55e6edb9-3198-528b-ba83-6fa02393acc7'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ea551b05-ac59-5933-841d-49930327aaed'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('harshil.connect.in@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-ATOLL: harshil.connect.in@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '134997ce-7c87-5404-834c-7e0d2d403615'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'b6c36fab-34ab-59a2-b5e3-02f93c3f95c6'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('harshil.connect.in@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-JMR: abhijith22abhi22@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '3c9b199a-278c-57ac-b7ae-3bcafb4774e4'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'ea551b05-ac59-5933-841d-49930327aaed'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('abhijith22abhi22@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MCA-ATOLL: abhijith22abhi22@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        'f815c98f-61a7-59dc-b774-16c9f52ac62c'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'b6c36fab-34ab-59a2-b5e3-02f93c3f95c6'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('abhijith22abhi22@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: gowdachethu83@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '48140329-faa0-53e8-842d-e79f89d9f0ce'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('gowdachethu83@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    -- EXP-MBA-POOL: rajeshin2003@gmail.com
    INSERT INTO public.pipeline_candidates (
        id, learner_id, candidate_name, candidate_email,
        stage, status, opportunity_id, requisition_id,
        recruiter_notes, source, added_by,
        stage_changed_at, added_at, created_at, updated_at,
        rejection_date
    )
    SELECT
        '25b340c9-286a-573b-835b-f5ca3aa6dad2'::uuid,
        l.id,
        COALESCE(l.name, l.email),
        l.email,
        'sourced',
        'active',
        'a4cb4ae1-0ea0-51f2-901d-b3aa9f697188'::uuid,
        '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
        'Applied via campus drive',
        'campus_drive',
        '578fec10-6725-4713-bc36-e4e213c258c8',
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        '2026-09-21T00:00:00+00:00'::timestamptz,
        NULL
    FROM public.learners l
    WHERE lower(l.email) = lower('rajeshin2003@gmail.com')
    ON CONFLICT (opportunity_id, learner_id) DO NOTHING;

    RAISE NOTICE 'Application seed complete.';
END;
$app_seed$;

COMMIT;