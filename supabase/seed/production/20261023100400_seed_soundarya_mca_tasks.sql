-- Seed for SkillPassport App DB (production)
-- Creates 14 Soundarya MCA tasks (college_assignments) and gives each one to all 16 students of MCA semester 4, section A
-- (college_learner_assignments, status 'todo'), the same two steps the app performs (create-assignment, then assign-task-to-learners).
-- Safe and idempotent: fixed task ids and unique (task, learner) rows, so a rerun creates nothing new. Existing tasks are never touched.
-- Runs after the MCA assignments seed (20261023100200_seed_soundarya_mca_trainer_assignments.sql) and the MCA sessions seed. It also needs the production trainers seed (20261023100100_seed_soundarya_trainers_skillpassport.sql); it only reads the trainers (lower(email), platform org, active) and never creates users, staff or organizations. Nothing is written to the SSO database.
--
-- EDUCATOR OF EACH TASK = the educator of the Educator Attendance row with the same course text, the same date as the task's
-- due date and program MCA (exactly one match each). Row 42 (Software Testing / QA Fundamentals) has no identical course text;
-- it is Raghu's on the confirmed basis that his session on the same date and class is attendance row 62 ("Testing").
--   Excel Educator Tasks row / trainer / due date / Excel course name (used ONLY for this matching)
--   row 29  Karthik Keyan  2026-09-11  HTML Fundamentals                            (attendance row 48)
--   row 30  Karthik Keyan  2026-09-12  HTML Fundamentals                            (attendance row 49)
--   row 31  Karthik Keyan  2026-09-15  CSS Fundamentals                             (attendance row 50)
--   row 32  Karthik Keyan  2026-09-16  CSS Fundamentals                             (attendance row 51)
--   row 33  Suraj S P      2026-09-21  Front-end / React implementation             (attendance row 52)
--   row 34  Suraj S P      2026-09-22  Backend / APIs / Node                        (attendance row 53)
--   row 35  Suraj S P      2026-09-23  Database / SQL /Authentication / RBAC / secu (attendance row 54)
--   row 36  Suraj S P      2026-09-24  Debugging / integration /Deployment / enviro (attendance row 55)
--   row 37  Karthik Keyan  2026-09-25  Project orientation & SDLC /Requirement unde (attendance row 56)
--   row 38  Karthik Keyan  2026-09-26  Documentation / README / technical presentat (attendance row 57)
--   row 39  Karthik Keyan  2026-09-28  Skill ecosystem - Orientation & Marketplace; (attendance row 58)
--   row 40  Suraj S P      2026-09-29  Agile/Scrum/project execution/Git workflow & (attendance row 59)
--   row 41  Suraj S P      2026-09-30  Resume / GitHub / interview articulation /Mo (attendance row 60)
--   row 42  Raghu B.N      2026-10-16  Software Testing / QA Fundamentals           (attendance row 62)
--   Totals: Karthik Keyan 7, Suraj S P 6, Raghu B.N 1 = 14 tasks x 16 students = 224 student-task rows.
--
-- NOT CREATED: MBA tasks (rows 2-24) and Sandhya Mohan's rows 25-28.
-- COURSE: every task uses the existing course 'Grama Resource Connect - Web Developer L1'; course_name and course_code are read from
-- the courses table (the sheet's own course names do not exist in the database). The course must be Active and not deleted.
-- Values: title, description, instructions and due date are copied from the sheet as they are (a date without a time is stored as
-- 00:00 UTC). Total points 100 and type 'project' (lowercase, as the table requires). Skill outcomes, attachments and 'allow late
-- submission' are empty in the sheet, so skill_outcomes is empty, attachments [] and late submission keeps its default (true).
-- The sheet's Specialization ('developer') does not exist in the database and the app
-- does not filter students by it, so every task goes to the whole class, as the app's "Select All" does.
--
-- PRE-CHECK (read-only), run first; the course query must return exactly 1 row, the mapping query exactly 3 rows (trainers with an
-- active mapping for the class), and the student count must be 16:
--   SELECT course_id FROM public.courses WHERE title = 'Grama Resource Connect - Web Developer L1' AND deleted_at IS NULL AND status = 'Active';
--   SELECT s.email FROM public.organization_staff_assignments a JOIN public.organization_staff s ON s.id = a.staff_id
--     JOIN public.program_sections ps ON ps.id = a.section_id JOIN public.programs p ON p.id = ps.program_id
--     WHERE a.is_active AND p.code = 'MCA' AND ps.semester = 4 AND ps.section = 'A'
--     AND lower(s.email) IN ('karthikeyan201219996@gmail.com', 'surajsp263@gmail.com', 'raghu.astepahead@gmail.com');
--   SELECT count(*) FROM public.learners l JOIN public.programs p ON p.id = l.program_id JOIN public.organizations c ON c.id = l.college_id
--     WHERE c.name = 'Soundarya Institute of Management and Science' AND p.code = 'MCA' AND l.semester = 4 AND l.section = 'A'
--     AND NOT coalesce(l.is_deleted, false);

BEGIN;

-- 1. Tasks
INSERT INTO public.college_assignments
  (assignment_id, title, description, instructions, course_name, course_code, college_id, external_educator_id, program_section_id,
   department_id, program_id, educator_name, total_points, assignment_type, skill_outcomes, due_date, available_from)
SELECT v.id, v.title, v.description, v.instructions, co.title, co.code, c.id, s.user_id, ps.id,
  ps.department_id, ps.program_id, s.first_name || ' ' || s.last_name, 100, 'project', '{}', v.due_date, now()
FROM (VALUES
  ('78fd6c8c-1c18-5c03-8ed3-8fa395b8f4ff'::uuid, 'karthikeyan201219996@gmail.com'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-11 00:00:00+00'::timestamptz),
  ('93c4b630-5583-56f9-8cd5-9fee1bec26e8'::uuid, 'karthikeyan201219996@gmail.com'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-12 00:00:00+00'::timestamptz),
  ('8ccda30f-6fd8-5857-90df-a9ffe7aedaa4'::uuid, 'karthikeyan201219996@gmail.com'::text, 'Functional, Business vocabulary, Decision Making, Group Discussion'::text, 'Functional, Business vocabulary, Decision Making, Group Discussion'::text, 'Functional, Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-15 00:00:00+00'::timestamptz),
  ('b0e5bb1a-550c-58f2-a9d1-96be2b7d4a7b'::uuid, 'karthikeyan201219996@gmail.com'::text, 'Functional, Business vocabulary, Decision Making, Group Discussion'::text, 'Functional, Business vocabulary, Decision Making, Group Discussion'::text, 'Functional, Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-16 00:00:00+00'::timestamptz),
  ('b1312750-6b1e-5fb6-87a2-066d4a6542f3'::uuid, 'surajsp263@gmail.com'::text, 'Stream activity and trainer evidence'::text, 'Stream activity and trainer evidence'::text, 'Stream activity and trainer evidence'::text, '2026-09-21 00:00:00+00'::timestamptz),
  ('3d67675b-eb09-5c87-9324-71740896a8f2'::uuid, 'surajsp263@gmail.com'::text, 'COmmunication & Decision Making'::text, 'COmmunication & Decision Making'::text, 'COmmunication & Decision Making'::text, '2026-09-22 00:00:00+00'::timestamptz),
  ('ab284b0d-363f-548d-b71c-f7e02cfbb0bd'::uuid, 'surajsp263@gmail.com'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, '2026-09-23 00:00:00+00'::timestamptz),
  ('fc8f955f-e7ae-5679-88ca-46b68d04c59c'::uuid, 'surajsp263@gmail.com'::text, 'Stream activity and trainer evidence'::text, 'Stream activity and trainer evidence'::text, 'Stream activity and trainer evidence'::text, '2026-09-24 00:00:00+00'::timestamptz),
  ('dbf28577-6c26-5cd0-b711-b65c79afe526'::uuid, 'karthikeyan201219996@gmail.com'::text, 'Functional worksheet and practical output'::text, 'Functional worksheet and practical output'::text, 'Functional worksheet and practical output'::text, '2026-09-25 00:00:00+00'::timestamptz),
  ('7695e58e-c424-5e43-848f-d327ac90e595'::uuid, 'karthikeyan201219996@gmail.com'::text, 'Evaluated practical exercise'::text, 'Evaluated practical exercise'::text, 'Evaluated practical exercise'::text, '2026-09-26 00:00:00+00'::timestamptz),
  ('d519b791-7dd7-55c4-8ea9-55aa8ce30647'::uuid, 'karthikeyan201219996@gmail.com'::text, 'Stream activity and trainer evidence'::text, 'Stream activity and trainer evidence'::text, 'Stream activity and trainer evidence'::text, '2026-09-28 00:00:00+00'::timestamptz),
  ('3d427b05-de70-5cef-b25d-fa43b4c97ed4'::uuid, 'surajsp263@gmail.com'::text, 'Stream activity and trainer evidence'::text, 'Stream activity and trainer evidence'::text, 'Stream activity and trainer evidence'::text, '2026-09-29 00:00:00+00'::timestamptz),
  ('8f278b88-f62d-542b-8c02-9f3ebe3c4e86'::uuid, 'surajsp263@gmail.com'::text, 'list will be shared'::text, 'list will be shared'::text, 'list will be shared'::text, '2026-09-30 00:00:00+00'::timestamptz),
  ('678195ac-a309-5250-81bc-54884b0a06b4'::uuid, 'raghu.astepahead@gmail.com'::text, 'Software Testing Fundamentals – Comprehensive Practical Assignment (7 Topics)'::text, 'Integrated practical covering SDLC/STLC, requirements, test design, defects, API testing, SQL and debugging.'::text, 'Complete all 7 QA activities; submit test cases, bug reports, API/SQL results and debugging evidence. Rubric: accuracy 40, completeness 30, clarity 20, evidence 10.'::text, '2026-10-16 00:00:00+00'::timestamptz)
) AS v(id, email, title, description, instructions, due_date)
JOIN public.organization_staff s ON lower(s.email) = v.email
  AND s.organization_id = '00000000-0000-0000-0000-000000000001' AND s.account_status = 'active'
JOIN public.organizations c ON c.name = 'Soundarya Institute of Management and Science' AND c.organization_type = 'college'
JOIN public.departments d ON d.college_id = c.id
JOIN public.programs p ON p.department_id = d.id AND p.code = 'MCA'
JOIN public.program_sections ps ON ps.program_id = p.id AND ps.department_id = d.id
  AND ps.semester = 4 AND ps.section = 'A' AND ps.status = 'active'
JOIN public.courses co ON co.title = 'Grama Resource Connect - Web Developer L1' AND co.deleted_at IS NULL AND co.status = 'Active'
WHERE EXISTS (SELECT 1 FROM public.organization_staff_assignments a WHERE a.staff_id = s.id AND a.section_id = ps.id AND a.is_active)
ON CONFLICT (assignment_id) DO NOTHING;

-- 2. One student-task row per student of the class (same values the app's assign-task-to-learners action writes)
INSERT INTO public.college_learner_assignments (assignment_id, learner_id, status, priority)
SELECT t.assignment_id, l.user_id, 'todo', 'medium'
FROM public.college_assignments t
JOIN public.program_sections ps ON ps.id = t.program_section_id
JOIN public.learners l ON l.college_id = t.college_id AND l.program_id = t.program_id
  AND l.semester = ps.semester AND l.section = ps.section AND NOT coalesce(l.is_deleted, false) AND l.user_id IS NOT NULL
WHERE t.assignment_id IN ('78fd6c8c-1c18-5c03-8ed3-8fa395b8f4ff', '93c4b630-5583-56f9-8cd5-9fee1bec26e8', '8ccda30f-6fd8-5857-90df-a9ffe7aedaa4', 'b0e5bb1a-550c-58f2-a9d1-96be2b7d4a7b', 'b1312750-6b1e-5fb6-87a2-066d4a6542f3', '3d67675b-eb09-5c87-9324-71740896a8f2', 'ab284b0d-363f-548d-b71c-f7e02cfbb0bd', 'fc8f955f-e7ae-5679-88ca-46b68d04c59c', 'dbf28577-6c26-5cd0-b711-b65c79afe526', '7695e58e-c424-5e43-848f-d327ac90e595', 'd519b791-7dd7-55c4-8ea9-55aa8ce30647', '3d427b05-de70-5cef-b25d-fa43b4c97ed4', '8f278b88-f62d-542b-8c02-9f3ebe3c4e86', '678195ac-a309-5250-81bc-54884b0a06b4')
ON CONFLICT (assignment_id, learner_id) DO NOTHING;

COMMIT;
