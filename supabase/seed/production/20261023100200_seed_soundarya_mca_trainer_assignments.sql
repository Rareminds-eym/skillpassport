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
-- NOT ASSIGNED: MBA rows (2-44, this file is MCA only), Sandhya Mohan (her MCA rows 45-47 overlap her MBA rows 7, 11, 13,
-- so which program she taught is unknown), Koutham K A (his Details-tab MCA mapping clashes with his MBA attendance
-- row 40, waiting for the data providers), Rareminds-Clients (row 61, not a trainer).
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
  ('43d230ca-f809-5361-9d22-a803cd609409'::uuid, 'karthikeyan201219996@gmail.com'::text, '2026-09-11'::date, '2026-09-28'::date, 'Soundarya sheet MCA rows 48-51, 56-58'::text),
  ('fafbbbd2-3e35-58ac-a3fe-1f18be4d2155'::uuid, 'surajsp263@gmail.com'::text, '2026-09-21'::date, '2026-09-30'::date, 'Soundarya sheet MCA rows 52-55, 59-60'::text),
  ('c72e650f-4c44-5507-a884-0aa088ebf0dc'::uuid, 'raghu.astepahead@gmail.com'::text, '2026-10-16'::date, '2026-10-16'::date, 'Soundarya sheet MCA row 62'::text)
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

COMMIT;
