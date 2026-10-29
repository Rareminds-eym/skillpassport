-- Assign 8 Soundarya MBA trainers to their own stream's MBA class (semester 4, section A) with their own course. No time slots.
-- Runs after the initial seed and after the production trainers seed (20261023100100_seed_soundarya_trainers_skillpassport.sql). Nothing is written to the SSO database.
--
-- Each stream is its own MBA program record (programs.specializations = {Finance}, {HR}, {Marketing}, {"Business Analytics"}),
-- found by that list and never by the code 'MBA' alone (five MBA records share it). The mapping specialization list stays empty.
--   Trainer                          Stream              Course (courses.code)        Dates                   Sheet rows (Soundarya workbook 4)
--   cacsajay22@gmail.com             Finance             MBA-FIN-L1-SRILAKSHMI        2026-09-24 to 2026-09-26   Trainer-course 3, Details 4, Attendance 32, 35, 38
--   vishwanathgurlhosur@gmail.com    Marketing           MBA-MKT-L1-SWAADFIT          2026-09-24 to 2026-09-26   Trainer-course 7, Details 6, Attendance 33, 36, 39
--   poornima.du@gmail.com            HR                  MBA-HR-L1-ONBOARDING         2026-09-24 to 2026-09-26   Trainer-course 9, Details 7, Attendance 31, 34, 37
--   msadiq.india@gmail.com           Business Analytics  MBA-BA-L1-SRILAKSHMI         2026-09-30 to 2026-09-30   Trainer-course 5, Details 2, Attendance 42
-- Added with the uploaded Pre-Counselling and Video Resume courses (one mapping per trainer and class; the course is looked up by code and must be Active):
--   subashini.r@rareminds.in         HR                  PRE-COUNSEL-INTRO          2026-08-31 to 2026-09-01   Attendance rows 4, 8
--   lalitha@rareminds.in             Finance             PRE-COUNSEL-INTRO          2026-08-31 to 2026-09-01   Attendance rows 5, 9
--   visakh2013@rediffmail.com        Marketing           PRE-COUNSEL-INTRO          2026-08-31 to 2026-09-01   Attendance rows 6, 10
--   visakh2013@rediffmail.com        HR                  VIDEO-RESUME-INTRO-2026    2026-09-02 to 2026-09-03   Attendance rows 12, 16
--   lalitha@rareminds.in             Marketing           VIDEO-RESUME-INTRO-2026    2026-09-02 to 2026-09-03   Attendance rows 14, 18
--   krishnalatha@rareminds.in        Business Analytics  VIDEO-RESUME-INTRO-2026    2026-09-02 to 2026-09-03   Attendance rows 15, 19
--   subashini.r@rareminds.in         Finance             VIDEO-RESUME-INTRO-2026    2026-09-03 to 2026-09-03   Attendance rows 17
-- NOT ASSIGNED HERE: the Combine rows (Maheswari kumar, Koutham K A, Lalitha, Subashini's Combine groups, Visakh's row 41 and Sandhya's rows 2 and 44): their group mappings are in the Combine groups seed
-- (20261023100800), and trainers of rows with no valid class.
-- MCA trainers are in the MCA assignments seed.
--
-- SANDHYA MOHAN (second INSERT below), from workbook 8: rows 7 and 11 (Business Analytics, Pre Counseling, 2026-08-31 and 2026-09-01) and row 13 (Finance,
-- "Direct Counseling, Professional Introduction, Video Resume", 2026-09-02). Rows 45-47, which used to overlap them, now name Subashini and Swaroop, so the
-- overlap that blocked her is gone. The courses follow the other trainers' rows: Pre Counseling -> PRE-COUNSEL-INTRO, the Direct Counseling row -> VIDEO-RESUME-INTRO-2026.
-- SANDHYA MOHAN, VoltEdge (rows 20, 21, 22: MBA HR, 13:30-16:00, workbook 8 Educator Attendance; the course names are the sheet's course texts): one HR mapping per LMS course,
-- each starting on its session date, with no end date and no slot, like her other mappings here: Business Formation - Understanding Company & its Departments -> VoltEdge_V21 (2026-09-07),
-- Business Strategy & Planning -> VoltEdge_V22 (2026-09-08), Functional Strategy & Planning -> VoltEdge_V23 (2026-09-09). The courses differ from her Student Assessment group mapping in HR, so they sit beside it.
-- SANDHYA MOHAN, rows 26 and 27 (MBA HR only, 13:30-16:00, 2026-09-15 and 2026-09-16; the sheet writes 'Revist Implementation based on learnigns from evaluations'): one HR mapping to the LMS course
-- VoltEdge_V24 (Revisit Implementation Based on Learnings from Evaluations), starting on the first session date, with no end date and no slot, so it covers both days and the educator can still mark. She is
-- not mapped to Finance, Marketing or Business Analytics for this course.
-- Mappings only: her sessions and tasks for these rows are not created here. The second INSERT needs migration 20270118000000_allow_multiple_trainer_class_mappings.sql
-- (the Combine groups seed later gives her more mappings in the same classes, with another course) and is skipped with a NOTICE without it. Safe to re-run: fixed ids.
--
-- END DATES: the mappings have no end date, so they stay valid after the session dates (an educator can still open and mark a past session). The sheet
-- gives dates only for some trainers, and the session dates stay exactly as in the sheet.
--
-- A trainer is skipped, never forced, when: the trainer, the class or the course is not found, or the trainer already has an
-- active mapping for that class (it is left unchanged). The MBA courses come from the LMS course upload, not from a seed.
-- Safe to re-run: fixed ids and the active-mapping check mean a second run inserts nothing.
--
-- PRE-CHECK (read-only), run first. Expect 4 stream classes (one section each), 6 Active courses, 8 active trainers:
--   SELECT p.specializations, ps.id FROM public.program_sections ps JOIN public.programs p ON p.id = ps.program_id
--     JOIN public.departments d ON d.id = p.department_id AND d.id = ps.department_id JOIN public.organizations c ON c.id = d.college_id
--     WHERE c.name = 'Soundarya Institute of Management and Science' AND p.code = 'MBA' AND ps.semester = 4 AND ps.section = 'A' AND ps.status = 'active';
--   SELECT code, status FROM public.courses WHERE deleted_at IS NULL AND code IN ('MBA-FIN-L1-SRILAKSHMI', 'MBA-MKT-L1-SWAADFIT', 'MBA-HR-L1-ONBOARDING', 'MBA-BA-L1-SRILAKSHMI', 'PRE-COUNSEL-INTRO', 'VIDEO-RESUME-INTRO-2026');
--   SELECT email, account_status FROM public.organization_staff WHERE lower(email) IN ('cacsajay22@gmail.com', 'vishwanathgurlhosur@gmail.com', 'poornima.du@gmail.com', 'msadiq.india@gmail.com',
--     'subashini.r@rareminds.in', 'lalitha@rareminds.in', 'visakh2013@rediffmail.com', 'krishnalatha@rareminds.in');

BEGIN;

INSERT INTO public.organization_staff_assignments
  (id, staff_id, college_id, department_id, program_id, section_id, assigned_courses, start_date, end_date, is_active, notes, metadata)
SELECT v.id, s.id, c.id, ps.department_id, ps.program_id, ps.id,
  jsonb_build_array(co.course_id::text), v.start_date, v.end_date, true, v.notes,
  '{"specializations": []}'::jsonb
FROM (VALUES
  ('b0ffe1fe-0a3d-539c-a817-d9fe8dc98196'::uuid, 'cacsajay22@gmail.com'::text, 'Finance'::text, 'MBA-FIN-L1-SRILAKSHMI'::text, '2026-09-24'::date, NULL::date, 'Soundarya sheet MBA Finance, Attendance rows 32, 35, 38'::text),
  ('cc6c7728-c442-54d0-842b-4afc1b793ae8'::uuid, 'vishwanathgurlhosur@gmail.com'::text, 'Marketing'::text, 'MBA-MKT-L1-SWAADFIT'::text, '2026-09-24'::date, NULL::date, 'Soundarya sheet MBA Marketing, Attendance rows 33, 36, 39'::text),
  ('71ae88fe-407e-5410-b45b-e361aedf7526'::uuid, 'poornima.du@gmail.com'::text, 'HR'::text, 'MBA-HR-L1-ONBOARDING'::text, '2026-09-24'::date, NULL::date, 'Soundarya sheet MBA HR, Attendance rows 31, 34, 37'::text),
  ('bf2e3c9a-724c-5abc-a538-a1574cb53ab3'::uuid, 'msadiq.india@gmail.com'::text, 'Business Analytics'::text, 'MBA-BA-L1-SRILAKSHMI'::text, '2026-09-30'::date, NULL::date, 'Soundarya sheet MBA Business Analytics, Attendance row 42'::text),
  ('23e7f0b9-e9a1-56e2-9c2e-3d50c1ece8dc'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, 'PRE-COUNSEL-INTRO'::text, '2026-08-31'::date, NULL::date, 'Soundarya sheet MBA HR, Attendance rows 4, 8'::text),
  ('3fe011f5-c743-558f-91d8-9e7ace264fc7'::uuid, 'lalitha@rareminds.in'::text, 'Finance'::text, 'PRE-COUNSEL-INTRO'::text, '2026-08-31'::date, NULL::date, 'Soundarya sheet MBA Finance, Attendance rows 5, 9'::text),
  ('a09f8fd1-64be-5d75-ba31-615733ac791c'::uuid, 'visakh2013@rediffmail.com'::text, 'Marketing'::text, 'PRE-COUNSEL-INTRO'::text, '2026-08-31'::date, NULL::date, 'Soundarya sheet MBA Marketing, Attendance rows 6, 10'::text),
  ('6a2bc271-5e42-5735-93a8-8a5ba33e9421'::uuid, 'visakh2013@rediffmail.com'::text, 'HR'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-02'::date, NULL::date, 'Soundarya sheet MBA HR, Attendance rows 12, 16'::text),
  ('03157256-d2a7-5f30-b3c2-8df95d60cb7c'::uuid, 'lalitha@rareminds.in'::text, 'Marketing'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-02'::date, NULL::date, 'Soundarya sheet MBA Marketing, Attendance rows 14, 18'::text),
  ('a88e1b9f-753a-5ca2-aa7b-d3cfda16f6d4'::uuid, 'krishnalatha@rareminds.in'::text, 'Business Analytics'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-02'::date, NULL::date, 'Soundarya sheet MBA Business Analytics, Attendance rows 15, 19'::text),
  ('996f429e-1491-519a-925c-d65e2a686c5d'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-03'::date, NULL::date, 'Soundarya sheet MBA Finance, Attendance rows 17'::text)
) AS v(id, email, stream, course_code, start_date, end_date, notes)
JOIN public.organization_staff s ON lower(s.email) = v.email
  AND s.organization_id = '00000000-0000-0000-0000-000000000001' AND s.account_status = 'active'
JOIN public.organizations c ON c.name = 'Soundarya Institute of Management and Science' AND c.organization_type = 'college'
JOIN public.departments d ON d.college_id = c.id
JOIN public.programs p ON p.department_id = d.id AND p.code = 'MBA' AND p.specializations = ARRAY[v.stream]
JOIN public.program_sections ps ON ps.program_id = p.id AND ps.department_id = d.id
  AND ps.semester = 4 AND ps.section = 'A' AND ps.status = 'active'
JOIN public.courses co ON co.code = v.course_code AND co.deleted_at IS NULL AND co.status = 'Active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_staff_assignments x
  WHERE x.staff_id = s.id AND x.section_id = ps.id AND x.is_active)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF to_regprocedure('public.trainer_class_mapping_clash(uuid)') IS NULL THEN
    RAISE NOTICE '%', 'Skipped: apply migration 20270118000000_allow_multiple_trainer_class_mappings.sql first (one trainer can then hold several mappings in a class)';
  END IF;
END $$;

INSERT INTO public.organization_staff_assignments
  (id, staff_id, college_id, department_id, program_id, section_id, assigned_courses, start_date, end_date, is_active, notes, metadata)
SELECT v.id, s.id, c.id, ps.department_id, ps.program_id, ps.id,
  jsonb_build_array(co.course_id::text), v.start_date, v.end_date, true, v.notes,
  '{"specializations": []}'::jsonb
FROM (VALUES
  ('8a595b85-8194-5787-b574-c5d460a10dac'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Business Analytics'::text, 'PRE-COUNSEL-INTRO'::text, '2026-08-31'::date, NULL::date, 'Soundarya sheet MBA Business Analytics, Attendance rows 7, 11'::text),
  ('03f4508e-f748-5df5-a075-e14c89c56d20'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Finance'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-02'::date, NULL::date, 'Soundarya sheet MBA Finance, Attendance row 13'::text),
  ('f9849885-0e3b-5980-99c3-3f3ff1adf8fb'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V21'::text, '2026-09-07'::date, NULL::date, 'Soundarya sheet MBA HR, Attendance row 20'::text),
  ('538c31cd-8453-577a-9c14-44990b0980f0'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V22'::text, '2026-09-08'::date, NULL::date, 'Soundarya sheet MBA HR, Attendance row 21'::text),
  ('5304455f-4323-559a-8457-5c9c6d4c6a49'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V23'::text, '2026-09-09'::date, NULL::date, 'Soundarya sheet MBA HR, Attendance row 22'::text),
  ('7f0e3f35-6a73-503e-88e0-5a76b7d2e6ac'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V24'::text, '2026-09-15'::date, NULL::date, 'Soundarya sheet MBA HR, Attendance rows 26, 27'::text)
) AS v(id, email, stream, course_code, start_date, end_date, notes)
JOIN public.organization_staff s ON lower(s.email) = v.email
  AND s.organization_id = '00000000-0000-0000-0000-000000000001' AND s.account_status = 'active'
JOIN public.organizations c ON c.name = 'Soundarya Institute of Management and Science' AND c.organization_type = 'college'
JOIN public.departments d ON d.college_id = c.id
JOIN public.programs p ON p.department_id = d.id AND p.code = 'MBA' AND p.specializations = ARRAY[v.stream]
JOIN public.program_sections ps ON ps.program_id = p.id AND ps.department_id = d.id
  AND ps.semester = 4 AND ps.section = 'A' AND ps.status = 'active'
JOIN public.courses co ON co.code = v.course_code AND co.deleted_at IS NULL AND co.status = 'Active'
WHERE to_regprocedure('public.trainer_class_mapping_clash(uuid)') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_staff_assignments x
    WHERE x.staff_id = s.id AND x.section_id = ps.id AND x.is_active
      AND v.start_date <= coalesce(x.end_date, 'infinity'::date) AND x.start_date <= coalesce(v.end_date, 'infinity'::date)
      AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(x.assigned_courses) xc WHERE xc = co.course_id::text))
ON CONFLICT (id) DO NOTHING;

-- EXISTING DATABASES: the INSERTs above skip rows that already exist (ON CONFLICT DO NOTHING), so a mapping created by an earlier run of this file keeps
-- its old end date. This UPDATE reopens exactly the mappings this file creates (fixed ids), only while they are still active (a mapping that was ended on
-- purpose stays ended) and only if they still carry an end date. It does not touch any other mapping. assignment_version is raised, as an edit in the app does.
-- A mapping without an end date stays valid for every later date; the educator can open and mark its past sessions.
UPDATE public.organization_staff_assignments
SET end_date = NULL, assignment_version = assignment_version + 1
WHERE id IN ('7f0e3f35-6a73-503e-88e0-5a76b7d2e6ac', 'f9849885-0e3b-5980-99c3-3f3ff1adf8fb', '538c31cd-8453-577a-9c14-44990b0980f0', '5304455f-4323-559a-8457-5c9c6d4c6a49', 'b0ffe1fe-0a3d-539c-a817-d9fe8dc98196', 'cc6c7728-c442-54d0-842b-4afc1b793ae8', '71ae88fe-407e-5410-b45b-e361aedf7526', 'bf2e3c9a-724c-5abc-a538-a1574cb53ab3', '23e7f0b9-e9a1-56e2-9c2e-3d50c1ece8dc', '3fe011f5-c743-558f-91d8-9e7ace264fc7', 'a09f8fd1-64be-5d75-ba31-615733ac791c', '6a2bc271-5e42-5735-93a8-8a5ba33e9421', '03157256-d2a7-5f30-b3c2-8df95d60cb7c', 'a88e1b9f-753a-5ca2-aa7b-d3cfda16f6d4', '996f429e-1491-519a-925c-d65e2a686c5d', '8a595b85-8194-5787-b574-c5d460a10dac', '03f4508e-f748-5df5-a075-e14c89c56d20')
  AND is_active AND end_date IS NOT NULL;

COMMIT;
