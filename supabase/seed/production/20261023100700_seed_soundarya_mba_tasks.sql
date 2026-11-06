-- Seed for SkillPassport App DB (production)
-- Creates the MBA tasks of the Soundarya Educator Tasks sheet for the confirmed courses and assigned educators:
--   1. Pre-Counselling (PRE-COUNSEL-INTRO): Subashini (HR), Lalitha (Finance), Visakh (Marketing), Sandhya (Business Analytics) on 2026-08-31 & 2026-09-01
--   2. Video Resume (VIDEO-RESUME-INTRO-2026): Visakh (HR), Lalitha (Marketing), Krishnalatha (Business Analytics), Subashini (Finance) on 2026-09-02 & 2026-09-03; Sandhya (Finance) on 2026-09-02
--   3. Student Assessments & Registration (STUDENT-ASSESSMENT-INTRO-2026): Sandhya Mohan (2026-08-28) and Lalitha Srinivasan (2026-08-29) across all 4 streams
--   4. Power BI (POWERBI-CORE-FOUND-2026): Maheswari kumar across all 4 streams on 2026-09-22
--   5. Skill Ecosystem Orientation (SKILL-ECOSYSTEM-ORIENTATION-2026): Koutham K A (2026-09-28) and Subashini Ramaswamy (2026-09-28 & 2026-10-01) across all 4 streams
--   6. Presentations & Evaluations - Interview Screening (PRES-EVAL-INT-SCREEN-INTRO): Subashini Ramaswamy (2026-09-12) and Visakh Madhu (2026-09-29) across all 4 streams
--   7. VoltEdge (VoltEdge_V18): Sandhya Mohan (HR) on 2026-09-07, 09-08, 09-09, 09-15, 09-16; Subashini Ramaswamy across all 4 streams on 2026-09-10, 2026-09-11 & 2026-09-21
--   8. HR Level 1 / Onboarding (MBA-HR-L1-ONBOARDING): Poornima (HR) on 2026-09-24, 2026-09-25, 2026-09-26
--   9. Business Analytics L1 (MBA-BA-L1-SRILAKSHMI): Sadiq (Business Analytics) on 2026-09-30
--
-- Each task is attached to the educator and their stream class (MBA Semester 4, Section A: Finance, HR, Marketing, Business Analytics).
-- All students of that stream receive the task in public.college_learner_assignments (status 'todo', priority 'medium').
-- Safe to re-run: fixed task ids and ON CONFLICT DO NOTHING mean reruns insert nothing.
--
-- Runs after:
--   - 20261023100100_seed_soundarya_trainers_skillpassport.sql
--   - 20261023100500_seed_soundarya_mba_trainer_assignments.sql
--   - 20261023100800_seed_soundarya_mba_combine_class_groups.sql

BEGIN;

-- 1. Tasks (college_assignments)
INSERT INTO public.college_assignments
  (assignment_id, title, description, instructions, course_name, course_code, college_id, external_educator_id, program_section_id,
   department_id, program_id, educator_name, total_points, assignment_type, skill_outcomes, due_date, available_from)
SELECT v.id, v.title, v.description, v.instructions, co.title, co.code, c.id, s.user_id, ps.id,
  ps.department_id, ps.program_id, s.first_name || ' ' || s.last_name, 100, 'project', '{}', v.due_date, now()
FROM (VALUES
  -- -------------------------------------------------------------------------
  -- Course: PRE-COUNSEL-INTRO (Pre-Counselling)
  -- -------------------------------------------------------------------------
  ('3ebc2f1b-5e21-59b3-8a69-bfd1c68476fd'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, 'PRE-COUNSEL-INTRO'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, '2026-08-31 00:00:00+00'::timestamptz),
  ('c6755e63-dec4-5bb0-96e6-ae71c92bc96f'::uuid, 'lalitha@rareminds.in'::text, 'Finance'::text, 'PRE-COUNSEL-INTRO'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, '2026-08-31 00:00:00+00'::timestamptz),
  ('0d945880-d238-5dc2-82ca-e4728c0b1279'::uuid, 'visakh2013@rediffmail.com'::text, 'Marketing'::text, 'PRE-COUNSEL-INTRO'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, '2026-08-31 00:00:00+00'::timestamptz),
  ('5a3f1240-bc78-5e91-81df-9d0a1b2c3d4e'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Business Analytics'::text, 'PRE-COUNSEL-INTRO'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, '2026-08-31 00:00:00+00'::timestamptz),

  ('52d264bf-afc7-5e75-8286-3aa53438c1ac'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, 'PRE-COUNSEL-INTRO'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, '2026-09-01 00:00:00+00'::timestamptz),
  ('bc735640-2cf2-530f-9971-d8f1d6b42048'::uuid, 'lalitha@rareminds.in'::text, 'Finance'::text, 'PRE-COUNSEL-INTRO'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, '2026-09-01 00:00:00+00'::timestamptz),
  ('3b0298e5-fb1a-51ea-881c-0454aab6dafa'::uuid, 'visakh2013@rediffmail.com'::text, 'Marketing'::text, 'PRE-COUNSEL-INTRO'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, '2026-09-01 00:00:00+00'::timestamptz),
  ('6b4a2351-cd89-5fa2-92e0-ae1b2c3d4e5f'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Business Analytics'::text, 'PRE-COUNSEL-INTRO'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, 'Career Interest Mapping: Roles, Location , Salary'::text, '2026-09-01 00:00:00+00'::timestamptz),

  -- -------------------------------------------------------------------------
  -- Course: VIDEO-RESUME-INTRO-2026 (Video Resume)
  -- -------------------------------------------------------------------------
  ('369b06f2-b0c0-5d55-8e59-a410da122471'::uuid, 'visakh2013@rediffmail.com'::text, 'HR'::text, 'VIDEO-RESUME-INTRO-2026'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, '2026-09-02 00:00:00+00'::timestamptz),
  ('b3bc9d49-a37b-5b47-ad3f-6975f270b176'::uuid, 'lalitha@rareminds.in'::text, 'Marketing'::text, 'VIDEO-RESUME-INTRO-2026'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, '2026-09-02 00:00:00+00'::timestamptz),
  ('65dda50a-bc7f-5e0f-9fb5-9e1db60cd5a5'::uuid, 'krishnalatha@rareminds.in'::text, 'Business Analytics'::text, 'VIDEO-RESUME-INTRO-2026'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, '2026-09-02 00:00:00+00'::timestamptz),
  ('49a1bc2d-5310-53b3-82a1-e471d8a183b1'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, 'VIDEO-RESUME-INTRO-2026'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, '2026-09-02 00:00:00+00'::timestamptz),
  ('7c5e3462-de9a-5f03-a3d1-bf0c2e4f6a87'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Finance'::text, 'VIDEO-RESUME-INTRO-2026'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, '2026-09-02 00:00:00+00'::timestamptz),

  ('36199a3a-2fa3-5ecf-816c-2064aeb59da4'::uuid, 'visakh2013@rediffmail.com'::text, 'HR'::text, 'VIDEO-RESUME-INTRO-2026'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, '2026-09-03 00:00:00+00'::timestamptz),
  ('3c5cdc2c-abd7-5393-be41-a4607d08d40f'::uuid, 'lalitha@rareminds.in'::text, 'Marketing'::text, 'VIDEO-RESUME-INTRO-2026'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, '2026-09-03 00:00:00+00'::timestamptz),
  ('a4557e25-5657-53be-8ebb-4dd899d86df4'::uuid, 'krishnalatha@rareminds.in'::text, 'Business Analytics'::text, 'VIDEO-RESUME-INTRO-2026'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, '2026-09-03 00:00:00+00'::timestamptz),
  ('be600b8d-cfc9-5089-b618-6a65b9d5eb80'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, 'VIDEO-RESUME-INTRO-2026'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, 'Self Introduction, Digital Resume, Career Alignment'::text, '2026-09-03 00:00:00+00'::timestamptz),

  -- -------------------------------------------------------------------------
  -- Course: STUDENT-ASSESSMENT-INTRO-2026 (Student Assessments & Registration)
  -- Educators: Lalitha Srinivasan & Sandhya Mohan across all 4 streams
  -- -------------------------------------------------------------------------
  ('1de3f88a-8e66-5650-9d80-60942910698e'::uuid, 'lalitha@rareminds.in'::text, 'Finance'::text, 'STUDENT-ASSESSMENT-INTRO-2026'::text, 'Canddiate Assessment and profiling'::text, 'Canddiate Assessment and profiling'::text, 'Canddiate Assessment and profiling'::text, '2026-08-29 00:00:00+00'::timestamptz),
  ('13f22870-8155-5815-80e6-815260d35471'::uuid, 'lalitha@rareminds.in'::text, 'HR'::text, 'STUDENT-ASSESSMENT-INTRO-2026'::text, 'Canddiate Assessment and profiling'::text, 'Canddiate Assessment and profiling'::text, 'Canddiate Assessment and profiling'::text, '2026-08-29 00:00:00+00'::timestamptz),
  ('6018c640-db7f-506f-9f44-492c86c0b1b7'::uuid, 'lalitha@rareminds.in'::text, 'Marketing'::text, 'STUDENT-ASSESSMENT-INTRO-2026'::text, 'Canddiate Assessment and profiling'::text, 'Canddiate Assessment and profiling'::text, 'Canddiate Assessment and profiling'::text, '2026-08-29 00:00:00+00'::timestamptz),
  ('be802d17-5b2a-54b1-8462-3650a76011db'::uuid, 'lalitha@rareminds.in'::text, 'Business Analytics'::text, 'STUDENT-ASSESSMENT-INTRO-2026'::text, 'Canddiate Assessment and profiling'::text, 'Canddiate Assessment and profiling'::text, 'Canddiate Assessment and profiling'::text, '2026-08-29 00:00:00+00'::timestamptz),

  -- Sandhya Mohan (Aug 28: Student Registration, all 4 streams)
  ('a2d9c401-1b2c-5f3a-89a1-7c5d0e4b8190'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Finance'::text, 'STUDENT-ASSESSMENT-INTRO-2026'::text, 'Candidate Participation'::text, 'Candidate Participation'::text, 'Candidate Participation'::text, '2026-08-28 00:00:00+00'::timestamptz),
  ('b3e0d512-2c3d-5a4b-90b2-8d6e1f5c9201'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'STUDENT-ASSESSMENT-INTRO-2026'::text, 'Candidate Participation'::text, 'Candidate Participation'::text, 'Candidate Participation'::text, '2026-08-28 00:00:00+00'::timestamptz),
  ('c4f1e623-3d4e-5b5c-a1c3-9e7f2a6d0312'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Marketing'::text, 'STUDENT-ASSESSMENT-INTRO-2026'::text, 'Candidate Participation'::text, 'Candidate Participation'::text, 'Candidate Participation'::text, '2026-08-28 00:00:00+00'::timestamptz),
  ('d5a2f734-4e5f-5c6d-b2d4-af8a3b7e1423'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Business Analytics'::text, 'STUDENT-ASSESSMENT-INTRO-2026'::text, 'Candidate Participation'::text, 'Candidate Participation'::text, 'Candidate Participation'::text, '2026-08-28 00:00:00+00'::timestamptz),

  -- -------------------------------------------------------------------------
  -- Course: POWERBI-CORE-FOUND-2026 (Power BI)
  -- Educator: Maheswari kumar across all 4 streams
  -- -------------------------------------------------------------------------
  ('549da7fc-1df2-5eb8-94e6-9102f54b3d16'::uuid, 'maheswarikumar27@gmail.com'::text, 'Finance'::text, 'POWERBI-CORE-FOUND-2026'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, '2026-09-22 00:00:00+00'::timestamptz),
  ('cc42570a-f046-5294-a641-c1603b22ef05'::uuid, 'maheswarikumar27@gmail.com'::text, 'HR'::text, 'POWERBI-CORE-FOUND-2026'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, '2026-09-22 00:00:00+00'::timestamptz),
  ('1466c8c1-2ad6-5aa9-80b3-ebfc1cd1a35e'::uuid, 'maheswarikumar27@gmail.com'::text, 'Marketing'::text, 'POWERBI-CORE-FOUND-2026'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, '2026-09-22 00:00:00+00'::timestamptz),
  ('8a827d01-5810-5f56-b3f7-fd9e17a66163'::uuid, 'maheswarikumar27@gmail.com'::text, 'Business Analytics'::text, 'POWERBI-CORE-FOUND-2026'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, '2026-09-22 00:00:00+00'::timestamptz),

  -- -------------------------------------------------------------------------
  -- Course: SKILL-ECOSYSTEM-ORIENTATION-2026 (Skill Ecosystem Orientation)
  -- Educators: Koutham K A & Subashini Ramaswamy across all 4 streams
  -- -------------------------------------------------------------------------
  ('84da2e6b-0f0d-57fd-b858-a9fe2dfdee59'::uuid, 'koutham8505@gmail.com'::text, 'Finance'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, '2026-09-28 00:00:00+00'::timestamptz),
  ('d4bc8456-6fd0-593b-a447-456d1cab739d'::uuid, 'koutham8505@gmail.com'::text, 'HR'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, '2026-09-28 00:00:00+00'::timestamptz),
  ('df0b124f-b234-5c4d-a5d4-d4a0a202cb7e'::uuid, 'koutham8505@gmail.com'::text, 'Marketing'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, '2026-09-28 00:00:00+00'::timestamptz),
  ('d9d96ec9-e6e4-5916-ace0-bb0f4b931804'::uuid, 'koutham8505@gmail.com'::text, 'Business Analytics'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, '2026-09-28 00:00:00+00'::timestamptz),

  ('e1b8c290-7d4e-5a1b-83c9-0a2b4c6e8f10'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, '2026-09-28 00:00:00+00'::timestamptz),
  ('f2c9d301-8e5f-5b2c-94da-1b3c5d7f9a21'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, '2026-09-28 00:00:00+00'::timestamptz),
  ('03dae412-9f60-5c3d-a5eb-2c4d6e80ab32'::uuid, 'subashini.r@rareminds.in'::text, 'Marketing'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, '2026-09-28 00:00:00+00'::timestamptz),
  ('14ebf523-a071-5d4e-b6fc-3d5e7f91bc43'::uuid, 'subashini.r@rareminds.in'::text, 'Business Analytics'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, 'Updated SkillPassport'::text, '2026-09-28 00:00:00+00'::timestamptz),

  ('c7d8e9f0-a1b2-5c3d-4e5f-6a7b8c9d0e1f'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Tool-based functional output'::text, 'Tool-based functional output'::text, 'Tool-based functional output'::text, '2026-10-01 00:00:00+00'::timestamptz),
  ('d8e9f0a1-b2c3-5d4e-6f7a-8b9c0d1e2f3a'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Tool-based functional output'::text, 'Tool-based functional output'::text, 'Tool-based functional output'::text, '2026-10-01 00:00:00+00'::timestamptz),
  ('e9f0a1b2-c3d4-5e5f-7a8b-9c0d1e2f3a4b'::uuid, 'subashini.r@rareminds.in'::text, 'Marketing'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Tool-based functional output'::text, 'Tool-based functional output'::text, 'Tool-based functional output'::text, '2026-10-01 00:00:00+00'::timestamptz),
  ('f0a1b2c3-d4e5-5f6a-8b9c-0d1e2f3a4b5c'::uuid, 'subashini.r@rareminds.in'::text, 'Business Analytics'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, 'Tool-based functional output'::text, 'Tool-based functional output'::text, 'Tool-based functional output'::text, '2026-10-01 00:00:00+00'::timestamptz),

  -- -------------------------------------------------------------------------
  -- Course: PRES-EVAL-INT-SCREEN-INTRO (Presentations & Evaluations - Interview Screening)
  -- Educators: Subashini Ramaswamy (2026-09-12) & Visakh Madhu (2026-09-29) across all 4 streams
  -- -------------------------------------------------------------------------
  ('a1b2c3d4-e5f6-5a7b-8c9d-0e1f2a3b4c5d'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, 'PRES-EVAL-INT-SCREEN-INTRO'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-12 00:00:00+00'::timestamptz),
  ('b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, 'PRES-EVAL-INT-SCREEN-INTRO'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-12 00:00:00+00'::timestamptz),
  ('c3d4e5f6-a7b8-5c9d-0e1f-2a3b4c5d6e7f'::uuid, 'subashini.r@rareminds.in'::text, 'Marketing'::text, 'PRES-EVAL-INT-SCREEN-INTRO'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-12 00:00:00+00'::timestamptz),
  ('d4e5f6a7-b8c9-5d0e-1f2a-3b4c5d6e7f8a'::uuid, 'subashini.r@rareminds.in'::text, 'Business Analytics'::text, 'PRES-EVAL-INT-SCREEN-INTRO'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-12 00:00:00+00'::timestamptz),

  ('a3b4c5d6-e7f8-5a9b-0c1d-2e3f4a5b6c7d'::uuid, 'visakh2013@rediffmail.com'::text, 'Finance'::text, 'PRES-EVAL-INT-SCREEN-INTRO'::text, 'list will be shared'::text, 'list will be shared'::text, 'list will be shared'::text, '2026-09-29 00:00:00+00'::timestamptz),
  ('b4c5d6e7-f8a9-5b0c-1d2e-3f4a5b6c7d8e'::uuid, 'visakh2013@rediffmail.com'::text, 'HR'::text, 'PRES-EVAL-INT-SCREEN-INTRO'::text, 'list will be shared'::text, 'list will be shared'::text, 'list will be shared'::text, '2026-09-29 00:00:00+00'::timestamptz),
  ('c5d6e7f8-a9b0-5c1d-2e3f-4a5b6c7d8e9f'::uuid, 'visakh2013@rediffmail.com'::text, 'Marketing'::text, 'PRES-EVAL-INT-SCREEN-INTRO'::text, 'list will be shared'::text, 'list will be shared'::text, 'list will be shared'::text, '2026-09-29 00:00:00+00'::timestamptz),
  ('d6e7f8a9-b0c1-5d2e-3f4a-5b6c7d8e9f0a'::uuid, 'visakh2013@rediffmail.com'::text, 'Business Analytics'::text, 'PRES-EVAL-INT-SCREEN-INTRO'::text, 'list will be shared'::text, 'list will be shared'::text, 'list will be shared'::text, '2026-09-29 00:00:00+00'::timestamptz),

  -- -------------------------------------------------------------------------
  -- Course: VoltEdge_V18 (VoltEdge)
  -- Educator: Sandhya Mohan (HR only) on 2026-09-07, 09-08, 09-09, 09-15, 09-16
  -- -------------------------------------------------------------------------
  ('e5f6a7b8-c9d0-5e1f-2a3b-4c5d6e7f8a9b'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V18'::text, 'Business Formation - Understanding Company & its Departments'::text, 'Functional, Business vocabulary, Decision Making'::text, 'Functional, Business vocabulary, Decision Making'::text, '2026-09-07 00:00:00+00'::timestamptz),
  ('f6a7b8c9-d0e1-5f2a-3b4c-5d6e7f8a9b0c'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V18'::text, 'Business Strategy & Planning'::text, 'Functional, Business vocabulary, Decision Making'::text, 'Functional, Business vocabulary, Decision Making'::text, '2026-09-08 00:00:00+00'::timestamptz),
  ('a7b8c9d0-e1f2-5a3b-4c5d-6e7f8a9b0c1d'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V18'::text, 'Functional Strategy & Planning'::text, 'Functional, Business vocabulary, Decision Making'::text, 'Functional, Business vocabulary, Decision Making'::text, '2026-09-09 00:00:00+00'::timestamptz),
  ('b8c9d0e1-f2a3-5b4c-5d6e-7f8a9b0c1d2e'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V18'::text, 'Revisit Implementation based on learnings from evaluations'::text, 'Functional, Business vocabulary, Decision Making, Group Discussion'::text, 'Functional, Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-15 00:00:00+00'::timestamptz),
  ('c9d0e1f2-a3b4-5c5d-6e7f-8a9b0c1d2e3f'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V18'::text, 'Revisit Implementation based on learnings from evaluations'::text, 'Functional, Business vocabulary, Decision Making, Group Discussion'::text, 'Functional, Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-16 00:00:00+00'::timestamptz),

  -- Educator: Subashini Ramaswamy across all 4 streams on 2026-09-10, 2026-09-11 & 2026-09-21
  ('a2b3c4d5-e6f7-5a8b-9c0d-1e2f3a4b5c6d'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, 'VoltEdge_V18'::text, 'Company Formation & Performance'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-10 00:00:00+00'::timestamptz),
  ('b3c4d5e6-f7a8-5b9c-0d1e-2f3a4b5c6d7e'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, 'VoltEdge_V18'::text, 'Company Formation & Performance'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-10 00:00:00+00'::timestamptz),
  ('c4d5e6f7-a8b9-5c0d-1e2f-3a4b5c6d7e8f'::uuid, 'subashini.r@rareminds.in'::text, 'Marketing'::text, 'VoltEdge_V18'::text, 'Company Formation & Performance'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-10 00:00:00+00'::timestamptz),
  ('d5e6f7a8-b9c0-5d1e-2f3a-4b5c6d7e8f9a'::uuid, 'subashini.r@rareminds.in'::text, 'Business Analytics'::text, 'VoltEdge_V18'::text, 'Company Formation & Performance'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-10 00:00:00+00'::timestamptz),

  ('e6f7a8b9-c0d1-5e2f-3a4b-5c6d7e8f9a0b'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, 'VoltEdge_V18'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-11 00:00:00+00'::timestamptz),
  ('f7a8b9c0-d1e2-5f3a-4b5c-6d7e8f9a0b1c'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, 'VoltEdge_V18'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-11 00:00:00+00'::timestamptz),
  ('a8b9c0d1-e2f3-5a4b-5c6d-7e8f9a0b1c2d'::uuid, 'subashini.r@rareminds.in'::text, 'Marketing'::text, 'VoltEdge_V18'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-11 00:00:00+00'::timestamptz),
  ('b9c0d1e2-f3a4-5b5c-6d7e-8f9a0b1c2d3e'::uuid, 'subashini.r@rareminds.in'::text, 'Business Analytics'::text, 'VoltEdge_V18'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, 'Business vocabulary, Decision Making, Group Discussion'::text, '2026-09-11 00:00:00+00'::timestamptz),

  ('ca01b2c3-d4e5-5f6a-7b8c-9d0e1f2a3b4c'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, 'VoltEdge_V18'::text, 'COmmunication & Decision Making'::text, 'COmmunication & Decision Making'::text, 'COmmunication & Decision Making'::text, '2026-09-21 00:00:00+00'::timestamptz),
  ('db12c3d4-e5f6-5a7b-8c9d-0e1f2a3b4c5d'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, 'VoltEdge_V18'::text, 'COmmunication & Decision Making'::text, 'COmmunication & Decision Making'::text, 'COmmunication & Decision Making'::text, '2026-09-21 00:00:00+00'::timestamptz),
  ('ec23d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e'::uuid, 'subashini.r@rareminds.in'::text, 'Marketing'::text, 'VoltEdge_V18'::text, 'COmmunication & Decision Making'::text, 'COmmunication & Decision Making'::text, 'COmmunication & Decision Making'::text, '2026-09-21 00:00:00+00'::timestamptz),
  ('fd34e5f6-a7b8-5c9d-0e1f-2a3b4c5d6e7f'::uuid, 'subashini.r@rareminds.in'::text, 'Business Analytics'::text, 'VoltEdge_V18'::text, 'COmmunication & Decision Making'::text, 'COmmunication & Decision Making'::text, 'COmmunication & Decision Making'::text, '2026-09-21 00:00:00+00'::timestamptz),

  -- -------------------------------------------------------------------------
  -- Course: MBA-HR-L1-ONBOARDING (HR Level 1 / Onboarding)
  -- Educator: Poornima (HR only) on 2026-09-24, 2026-09-25, 2026-09-26
  -- -------------------------------------------------------------------------
  ('72bf99ff-518f-512b-b56c-f472bf1e8637'::uuid, 'poornima.du@gmail.com'::text, 'HR'::text, 'MBA-HR-L1-ONBOARDING'::text, 'Functional worksheet and practical output'::text, 'Functional worksheet and practical output'::text, 'Functional worksheet and practical output'::text, '2026-09-24 00:00:00+00'::timestamptz),
  ('83ca00aa-629a-523c-c67d-0583ca2f9748'::uuid, 'poornima.du@gmail.com'::text, 'HR'::text, 'MBA-HR-L1-ONBOARDING'::text, 'Human resourse placement Bootcamp'::text, 'Stream activity and trainer evidence'::text, 'Stream activity and trainer evidence'::text, '2026-09-25 00:00:00+00'::timestamptz),
  ('94db11bb-73ab-534d-d78e-1694db3a0859'::uuid, 'poornima.du@gmail.com'::text, 'HR'::text, 'MBA-HR-L1-ONBOARDING'::text, 'Evaluated practical exercise'::text, 'Evaluated practical exercise'::text, 'Evaluated practical exercise'::text, '2026-09-26 00:00:00+00'::timestamptz),

  -- -------------------------------------------------------------------------
  -- Course: MBA-BA-L1-SRILAKSHMI (MBA Business Analysis L1)
  -- Educator: Sadiq (Business Analytics only) on 2026-09-30
  -- -------------------------------------------------------------------------
  ('9e8f7a6b-5c4d-5e3f-2a1b-0f9e8d7c6b5a'::uuid, 'msadiq.india@gmail.com'::text, 'Business Analytics'::text, 'MBA-BA-L1-SRILAKSHMI'::text, 'list will be shared'::text, 'list will be shared'::text, 'list will be shared'::text, '2026-09-30 00:00:00+00'::timestamptz)
) AS v(id, email, stream, course_code, title, description, instructions, due_date)
JOIN public.organization_staff s ON lower(s.email) = v.email
  AND s.organization_id = '00000000-0000-0000-0000-000000000001' AND s.account_status = 'active'
JOIN public.organizations c ON c.name = 'Soundarya Institute of Management and Science' AND c.organization_type = 'college'
JOIN public.departments d ON d.college_id = c.id
JOIN public.programs p ON p.department_id = d.id AND p.code = 'MBA' AND p.specializations = ARRAY[v.stream]
JOIN public.program_sections ps ON ps.program_id = p.id AND ps.department_id = d.id
  AND ps.semester = 4 AND ps.section = 'A' AND ps.status = 'active'
JOIN public.courses co ON co.code = v.course_code AND co.deleted_at IS NULL AND co.status = 'Active'
WHERE EXISTS (SELECT 1 FROM public.organization_staff_assignments a WHERE a.staff_id = s.id AND a.section_id = ps.id AND a.is_active)
ON CONFLICT (assignment_id) DO NOTHING;

-- 2. Student-task rows: assign every created task to ALL students of that stream
INSERT INTO public.college_learner_assignments (assignment_id, learner_id, status, priority)
SELECT t.assignment_id, l.user_id, 'todo', 'medium'
FROM public.college_assignments t
JOIN public.program_sections ps ON ps.id = t.program_section_id
JOIN public.learners l ON l.college_id = t.college_id AND l.program_id = t.program_id
  AND l.semester = ps.semester AND l.section = ps.section AND NOT coalesce(l.is_deleted, false) AND l.user_id IS NOT NULL
WHERE t.assignment_id IN (
  -- PRE-COUNSEL-INTRO
  '3ebc2f1b-5e21-59b3-8a69-bfd1c68476fd', 'c6755e63-dec4-5bb0-96e6-ae71c92bc96f', '0d945880-d238-5dc2-82ca-e4728c0b1279', '5a3f1240-bc78-5e91-81df-9d0a1b2c3d4e',
  '52d264bf-afc7-5e75-8286-3aa53438c1ac', 'bc735640-2cf2-530f-9971-d8f1d6b42048', '3b0298e5-fb1a-51ea-881c-0454aab6dafa', '6b4a2351-cd89-5fa2-92e0-ae1b2c3d4e5f',
  -- VIDEO-RESUME-INTRO-2026
  '369b06f2-b0c0-5d55-8e59-a410da122471', 'b3bc9d49-a37b-5b47-ad3f-6975f270b176', '65dda50a-bc7f-5e0f-9fb5-9e1db60cd5a5',
  -- STUDENT-ASSESSMENT-INTRO-2026
  '49a1bc2d-5310-53b3-82a1-e471d8a183b1', '7c5e3462-de9a-5f03-a3d1-bf0c2e4f6a87', '36199a3a-2fa3-5ecf-816c-2064aeb59da4', '3c5cdc2c-abd7-5393-be41-a4607d08d40f',
  'a4557e25-5657-53be-8ebb-4dd899d86df4', 'be600b8d-cfc9-5089-b618-6a65b9d5eb80',
  -- STUDENT-ASSESSMENT-INTRO-2026
  '1de3f88a-8e66-5650-9d80-60942910698e', '13f22870-8155-5815-80e6-815260d35471', '6018c640-db7f-506f-9f44-492c86c0b1b7',
  'be802d17-5b2a-54b1-8462-3650a76011db',
  'a2d9c401-1b2c-5f3a-89a1-7c5d0e4b8190', 'b3e0d512-2c3d-5a4b-90b2-8d6e1f5c9201', 'c4f1e623-3d4e-5b5c-a1c3-9e7f2a6d0312',
  'd5a2f734-4e5f-5c6d-b2d4-af8a3b7e1423',
  -- POWERBI-CORE-FOUND-2026
  '549da7fc-1df2-5eb8-94e6-9102f54b3d16', 'cc42570a-f046-5294-a641-c1603b22ef05', '1466c8c1-2ad6-5aa9-80b3-ebfc1cd1a35e',
  '8a827d01-5810-5f56-b3f7-fd9e17a66163',
  -- SKILL-ECOSYSTEM-ORIENTATION-2026
  '84da2e6b-0f0d-57fd-b858-a9fe2dfdee59', 'd4bc8456-6fd0-593b-a447-456d1cab739d', 'df0b124f-b234-5c4d-a5d4-d4a0a202cb7e',
  'd9d96ec9-e6e4-5916-ace0-bb0f4b931804',
  -- SKILL-ECOSYSTEM-ORIENTATION-2026 (Subashini, Sep 28)
  'e1b8c290-7d4e-5a1b-83c9-0a2b4c6e8f10', 'f2c9d301-8e5f-5b2c-94da-1b3c5d7f9a21',
  '03dae412-9f60-5c3d-a5eb-2c4d6e80ab32', '14ebf523-a071-5d4e-b6fc-3d5e7f91bc43',
  -- SKILL-ECOSYSTEM-ORIENTATION-2026 (Subashini, Oct 01)
  'c7d8e9f0-a1b2-5c3d-4e5f-6a7b8c9d0e1f', 'd8e9f0a1-b2c3-5d4e-6f7a-8b9c0d1e2f3a',
  'e9f0a1b2-c3d4-5e5f-7a8b-9c0d1e2f3a4b', 'f0a1b2c3-d4e5-5f6a-8b9c-0d1e2f3a4b5c',
  -- PRES-EVAL-INT-SCREEN-INTRO (Subashini, Sep 12 & Visakh, Sep 29, all 4 streams)
  'a1b2c3d4-e5f6-5a7b-8c9d-0e1f2a3b4c5d', 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e', 'c3d4e5f6-a7b8-5c9d-0e1f-2a3b4c5d6e7f',
  'd4e5f6a7-b8c9-5d0e-1f2a-3b4c5d6e7f8a',
  'a3b4c5d6-e7f8-5a9b-0c1d-2e3f4a5b6c7d', 'b4c5d6e7-f8a9-5b0c-1d2e-3f4a5b6c7d8e',
  'c5d6e7f8-a9b0-5c1d-2e3f-4a5b6c7d8e9f', 'd6e7f8a9-b0c1-5d2e-3f4a-5b6c7d8e9f0a',
  -- VoltEdge_V18 (Sandhya, HR, Sep 07/08/09/15/16)
  'e5f6a7b8-c9d0-5e1f-2a3b-4c5d6e7f8a9b', 'f6a7b8c9-d0e1-5f2a-3b4c-5d6e7f8a9b0c', 'a7b8c9d0-e1f2-5a3b-4c5d-6e7f8a9b0c1d',
  'b8c9d0e1-f2a3-5b4c-5d6e-7f8a9b0c1d2e', 'c9d0e1f2-a3b4-5c5d-6e7f-8a9b0c1d2e3f',
  -- VoltEdge_V18 (Subashini, all 4 streams, Sep 10 & 11)
  'a2b3c4d5-e6f7-5a8b-9c0d-1e2f3a4b5c6d', 'b3c4d5e6-f7a8-5b9c-0d1e-2f3a4b5c6d7e',
  'c4d5e6f7-a8b9-5c0d-1e2f-3a4b5c6d7e8f', 'd5e6f7a8-b9c0-5d1e-2f3a-4b5c6d7e8f9a',
  'e6f7a8b9-c0d1-5e2f-3a4b-5c6d7e8f9a0b', 'f7a8b9c0-d1e2-5f3a-4b5c-6d7e8f9a0b1c',
  'a8b9c0d1-e2f3-5a4b-5c6d-7e8f9a0b1c2d', 'b9c0d1e2-f3a4-5b5c-6d7e-8f9a0b1c2d3e',
  -- VoltEdge_V18 (Subashini, all 4 streams, Sep 21)
  'ca01b2c3-d4e5-5f6a-7b8c-9d0e1f2a3b4c', 'db12c3d4-e5f6-5a7b-8c9d-0e1f2a3b4c5d',
  'ec23d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e', 'fd34e5f6-a7b8-5c9d-0e1f-2a3b4c5d6e7f',
  -- MBA-HR-L1-ONBOARDING (Poornima, HR, Sep 24, 25, 26)
  '72bf99ff-518f-512b-b56c-f472bf1e8637', '83ca00aa-629a-523c-c67d-0583ca2f9748',
  '94db11bb-73ab-534d-d78e-1694db3a0859',
  -- MBA-BA-L1-SRILAKSHMI (Sadiq, Business Analytics, Sep 30)
  '9e8f7a6b-5c4d-5e3f-2a1b-0f9e8d7c6b5a'
)
ON CONFLICT (assignment_id, learner_id) DO NOTHING;

COMMIT;
