-- Seed for SkillPassport App DB (production)
-- Assigns 3 Soundarya trainers to the MCA class (college assignment) with one course. No time slots.
-- Safe and idempotent: a trainer who already has an active mapping for this class is skipped; fixed ids make reruns a no-op.
-- Runs after the initial seed and the production trainers seed (20261023100100_seed_soundarya_trainers_skillpassport.sql). It only reads the trainers (lower(email), platform org, active) and never creates users, staff or organizations. Nothing is written to the SSO database.
--
-- ASSIGNED (all ids are looked up by name/code, so the same file works in any environment):
--   College Soundarya Institute of Management and Science | MCA, semester 4, section A | course 'Grama Resource Connect - Web Developer L1'
--   Trainer                          Dates                         Sheet rows (Educator Attendance tab)
--   karthikeyan201219996@gmail.com   2026-09-11 to 2026-09-28     48-51, 56-58
--   surajsp263@gmail.com             2026-09-21 to 2026-09-30     52-55, 59-60
--   raghu.astepahead@gmail.com       2026-10-16 to 2026-10-16     62
--
-- NOT ASSIGNED: MBA rows (2-44, this file is MCA only), Sandhya Mohan (workbook 8 names Subashini and Swaroop for
-- rows 45-47, so she has no MCA row), Koutham K A (his Details-tab MCA mapping clashes with his MBA attendance
-- row 40, waiting for the data providers), Rareminds-Clients (row 61, not a trainer).
--
-- ROW 58 (second INSERT below): Karthikeyan's row 58 topic, "Skill ecosystem - Orientation & Marketplace; ...", is the Skill Ecosystem Orientation course,
-- the same topic Koutham has on row 40, not Web Developer. He gets a separate one-day mapping to SKILL-ECOSYSTEM-ORIENTATION-2026 on 2026-09-28; the row 58
-- session is created from it by the MCA sessions seed. His Web Developer mapping above is left as it is (its end date and note still mention row 58).
-- The second INSERT needs migration 20270118000000_allow_multiple_trainer_class_mappings.sql: two mappings of one trainer and class may coexist when they
-- hold different courses. Without it the statement is skipped with a NOTICE, never forced. Safe to re-run: fixed id, and a mapping that already holds the course is skipped.
--
-- END DATES: the mappings have no end date, so they stay valid after the session dates: an educator can still open and mark a past session, and nothing
-- ends on its own. (Marking needs the mapping to be active and not ended before today; see 20270113000000_staff_attendance_split.sql.)
--
-- TIME SLOTS: none. An assignment with no slot rows means "no time restriction" (20270112_assignment_time_slots.sql), and
-- the mapping time-overlap check compares slots only (20270113), so nothing can conflict here. The real double-booking
-- check happens when a SESSION is created ("Trainer is already booked"). No sessions or attendance are created by this file.
--
-- PRE-CHECK (read-only), run first; the first two must return exactly 1 row, the third exactly 3 rows:
--   SELECT id FROM public.organizations WHERE name = 'Soundarya Institute of Management and Science' AND organization_type = 'college';
--   SELECT ps.id FROM public.program_sections ps JOIN public.programs p ON p.id = ps.program_id
--     JOIN public.departments d ON d.id = p.department_id JOIN public.organizations c ON c.id = d.college_id
--     WHERE c.name = 'Soundarya Institute of Management and Science' AND p.code = 'MCA' AND ps.semester = 4 AND ps.section = 'A';
--   SELECT course_id FROM public.courses WHERE title = 'Grama Resource Connect - Web Developer L1';
--   SELECT id, email FROM public.organization_staff WHERE lower(email) IN ('karthikeyan201219996@gmail.com', 'surajsp263@gmail.com', 'raghu.astepahead@gmail.com');

BEGIN;

INSERT INTO public.organization_staff_assignments
  (id, staff_id, college_id, department_id, program_id, section_id, assigned_courses, start_date, end_date, is_active, notes, metadata)
SELECT v.id, s.id, c.id, ps.department_id, ps.program_id, ps.id,
  jsonb_build_array(co.course_id::text), v.start_date, v.end_date, true, v.notes,
  '{"specializations": []}'::jsonb
FROM (VALUES
  ('43d230ca-f809-5361-9d22-a803cd609409'::uuid, 'karthikeyan201219996@gmail.com'::text, '2026-09-11'::date, NULL::date, 'Soundarya sheet MCA rows 48-51, 56-58'::text),
  ('fafbbbd2-3e35-58ac-a3fe-1f18be4d2155'::uuid, 'surajsp263@gmail.com'::text, '2026-09-21'::date, NULL::date, 'Soundarya sheet MCA rows 52-55, 59-60'::text),
  ('c72e650f-4c44-5507-a884-0aa088ebf0dc'::uuid, 'raghu.astepahead@gmail.com'::text, '2026-10-16'::date, NULL::date, 'Soundarya sheet MCA row 62'::text)
) AS v(id, email, start_date, end_date, notes)
JOIN public.organization_staff s ON lower(s.email) = v.email
  AND s.organization_id = '00000000-0000-0000-0000-000000000001' AND s.account_status = 'active'
JOIN public.organizations c ON c.name = 'Soundarya Institute of Management and Science' AND c.organization_type = 'college'
JOIN public.departments d ON d.college_id = c.id
JOIN public.programs p ON p.department_id = d.id AND p.code = 'MCA'
JOIN public.program_sections ps ON ps.program_id = p.id AND ps.department_id = d.id
  AND ps.semester = 4 AND ps.section = 'A' AND ps.status = 'active'
JOIN public.courses co ON co.title = 'Grama Resource Connect - Web Developer L1' AND co.deleted_at IS NULL AND co.status = 'Active'
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
  ('7cf83ddb-2af8-508f-afd4-65a6fa5d91e5'::uuid, 'karthikeyan201219996@gmail.com'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, '2026-09-28'::date, NULL::date, 'Soundarya sheet MCA row 58 (Skill Ecosystem Orientation)'::text)
) AS v(id, email, course_code, start_date, end_date, notes)
JOIN public.organization_staff s ON lower(s.email) = v.email
  AND s.organization_id = '00000000-0000-0000-0000-000000000001' AND s.account_status = 'active'
JOIN public.organizations c ON c.name = 'Soundarya Institute of Management and Science' AND c.organization_type = 'college'
JOIN public.departments d ON d.college_id = c.id
JOIN public.programs p ON p.department_id = d.id AND p.code = 'MCA'
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
WHERE id IN ('43d230ca-f809-5361-9d22-a803cd609409', 'fafbbbd2-3e35-58ac-a3fe-1f18be4d2155', 'c72e650f-4c44-5507-a884-0aa088ebf0dc', '7cf83ddb-2af8-508f-afd4-65a6fa5d91e5')
  AND is_active AND end_date IS NOT NULL;

COMMIT;
