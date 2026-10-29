-- Create 31 historical MBA sessions (semester 4, section A) for 9 trainers, plus one blank attendance record per student of the trainer's stream.
-- Runs after the production trainers seed (20261023100100_seed_soundarya_trainers_skillpassport.sql) and the MBA assignments seed (20261023100500_seed_soundarya_mba_trainer_assignments.sql). Nothing is written to the SSO database.
-- Follows the app's create_session action (20270113_staff_attendance_split.sql) and the college-admin "Create Attendance Session" form:
-- Department / Course (the stream's MBA program) / Semester / Section come from the class, Subject is the trainer's mapped course,
-- Faculty is the trainer's assignment, Date and times come from the sheet, Room Number and Remarks are optional, Total Learners is automatic.
-- The assignment must be valid on the date, the trainer's time slot must cover it (no slots = any time) and the trainer must not already
-- have an overlapping session; a row that fails a check is skipped, never forced.
--
-- WHAT IS CREATED (Educator Attendance tab of the Soundarya workbook 4: dates and times are copied as they are):
--   row 31  Poornima    HR                 2026-09-24 09:00-16:00  MBA-HR-L1-ONBOARDING
--   row 32  Ajay        Finance            2026-09-24 09:00-16:00  MBA-FIN-L1-SRILAKSHMI
--   row 33  Vishwanath  Marketing          2026-09-24 09:00-16:00  MBA-MKT-L1-SWAADFIT
--   row 34  Poornima    HR                 2026-09-25 09:00-16:00  MBA-HR-L1-ONBOARDING
--   row 35  Ajay        Finance            2026-09-25 09:00-16:00  MBA-FIN-L1-SRILAKSHMI
--   row 36  Vishwanath  Marketing          2026-09-25 09:00-16:00  MBA-MKT-L1-SWAADFIT
--   row 37  Poornima    HR                 2026-09-26 09:00-16:00  MBA-HR-L1-ONBOARDING
--   row 38  Ajay        Finance            2026-09-26 09:00-16:00  MBA-FIN-L1-SRILAKSHMI
--   row 39  Vishwanath  Marketing          2026-09-26 09:00-16:00  MBA-MKT-L1-SWAADFIT
--   row 42  Sadiq       Business Analytics 2026-09-30 13:30-16:00  MBA-BA-L1-SRILAKSHMI
-- Added with the uploaded Pre-Counselling (PRE-COUNSEL-INTRO) and Video Resume (VIDEO-RESUME-INTRO-2026) courses; each session uses the trainer's own mapping from the assignments seed:
--   row  4  subashini.r  HR                 2026-08-31 09:00-16:00  PRE-COUNSEL-INTRO
--   row  5  lalitha      Finance            2026-08-31 09:00-16:00  PRE-COUNSEL-INTRO
--   row  6  visakh2013   Marketing          2026-08-31 09:00-16:00  PRE-COUNSEL-INTRO
--   row  8  subashini.r  HR                 2026-09-01 09:00-16:00  PRE-COUNSEL-INTRO
--   row  9  lalitha      Finance            2026-09-01 09:00-16:00  PRE-COUNSEL-INTRO
--   row 10  visakh2013   Marketing          2026-09-01 09:00-16:00  PRE-COUNSEL-INTRO
--   row 12  visakh2013   HR                 2026-09-02 09:00-16:00  VIDEO-RESUME-INTRO-2026
--   row 14  lalitha      Marketing          2026-09-02 09:00-16:00  VIDEO-RESUME-INTRO-2026
--   row 15  krishnalatha Business Analytics 2026-09-02 09:00-16:00  VIDEO-RESUME-INTRO-2026
--   row 16  visakh2013   HR                 2026-09-03 09:00-16:00  VIDEO-RESUME-INTRO-2026
--   row 17  subashini.r  Finance            2026-09-03 09:00-16:00  VIDEO-RESUME-INTRO-2026
--   row 18  lalitha      Marketing          2026-09-03 09:00-16:00  VIDEO-RESUME-INTRO-2026
--   row 19  krishnalatha Business Analytics 2026-09-03 09:00-16:00  VIDEO-RESUME-INTRO-2026
-- Sandhya Mohan (workbook 8: rows 45-47, which used to overlap hers, now name Subashini and Swaroop); her mappings are in the MBA assignments seed (second INSERT):
--   row  7  sandhyamohan Business Analytics 2026-08-31 09:00-16:00  PRE-COUNSEL-INTRO
--   row 11  sandhyamohan Business Analytics 2026-09-01 09:00-16:00  PRE-COUNSEL-INTRO
--   row 13  sandhyamohan Finance            2026-09-02 09:00-16:00  VIDEO-RESUME-INTRO-2026
-- Sandhya Mohan, MBA HR, VoltEdge courses (workbook 8 rows 20-22; mappings in the MBA assignments seed). The sheet's course text is kept in remarks. The workbook has no learner attendance for
-- these three sessions (SES-MBA-007 to 009), so their records stay blank (unmarked):
--   row 20  sandhyamohan HR                 2026-09-07 13:30-16:00  VoltEdge_V21
--   row 21  sandhyamohan HR                 2026-09-08 13:30-16:00  VoltEdge_V22
--   row 22  sandhyamohan HR                 2026-09-09 13:30-16:00  VoltEdge_V23
-- Sandhya Mohan, MBA HR only, VoltEdge_V24 Revisit Implementation Based on Learnings from Evaluations (workbook 8 rows 26 and 27, which the sheet labels 'MBA HR'; mapping in the MBA assignments seed):
--   row 26  sandhyamohan HR                 2026-09-15 13:30-16:00  VoltEdge_V24
--   row 27  sandhyamohan HR                 2026-09-16 13:30-16:00  VoltEdge_V24
-- Records are the HR class only (18 students) and stay blank. The Learner Attendance tab (SES-MBA-013 and 014) also lists Finance, Marketing and Business Analyst learners under these session ids, but the
-- sheet gives no trainer for those streams, so no session is created for them; only the HR marks can come in through the bulk attendance import.
-- Each session uses the trainer's own LMS course (courses.code above), found in the trainer's assignment. The sheet's topic is kept in
-- remarks ('Sheet row N: <topic> (<session id>)'). Room number is empty (not in the sheet); subject code and academic year come from
-- the course and the section. created_by and creation_request_id stay empty, as in the MCA sessions seed.
-- The class is the MBA program whose specialization list is exactly the stream, never the code 'MBA' alone (five MBA records share it).
-- Students of a session are the non-deleted learners of that stream program, semester 4, section A, status blank (unmarked).
-- Three trainers teach at the same time on 24 to 26 Sep: that is allowed, each has their own stream class.
--
-- NOT CREATED: rows 45-47 (MCA; workbook 8 names Subashini and Swaroop, no MBA class);
-- the Combine rows taught to all four streams at once (2, 3, 23, 24, 25, 28, 29, 30, 40, 41, 43, 44): they are in the Combine sessions seed (20261023100900);
-- rows with no uploaded course (none left among Sandhya's rows). MCA sessions are in the MCA sessions seed.
-- Skipped on purpose, never forced: a missing trainer, class, course or assignment, an overlapping session of the same trainer.
-- Safe to re-run: fixed session ids, unique (session, student) records and the overlap check mean a second run inserts nothing.
--
-- PRE-CHECK (read-only), run first:
--   1. The eight trainers must each have an active assignment for their stream class(es) that covers the dates: expect 11 rows (4 + 7 added).
--      SELECT s.email, p.specializations, a.start_date, a.end_date FROM public.organization_staff_assignments a
--        JOIN public.organization_staff s ON s.id = a.staff_id JOIN public.programs p ON p.id = a.program_id
--        WHERE a.is_active AND p.code = 'MBA' AND lower(s.email) IN ('cacsajay22@gmail.com', 'vishwanathgurlhosur@gmail.com', 'poornima.du@gmail.com', 'msadiq.india@gmail.com',
--        'subashini.r@rareminds.in', 'lalitha@rareminds.in', 'visakh2013@rediffmail.com', 'krishnalatha@rareminds.in');
--   2. The students must be linked to the stream program with section 'A' and semester 4: expect Finance 12, Marketing 15, HR 18, Business Analytics 13.
--      A student on the generic MBA program, or with another section text, gets NO record and the learner attendance import will find an empty class.
--      SELECT p.specializations, count(*) FROM public.learners l JOIN public.programs p ON p.id = l.program_id
--        WHERE p.code = 'MBA' AND l.semester = 4 AND l.section = 'A' AND NOT coalesce(l.is_deleted, false) GROUP BY 1;

BEGIN;

-- 1. Sessions
INSERT INTO public.college_attendance_sessions
  (id, college_id, department_id, program_id, program_section_id, department_name, program_name, semester, section, academic_year,
   date, start_time, end_time, subject_name, subject_code, faculty_name, remarks,
   instructor_source, lms_course_id, staff_assignment_id, organization_staff_id, original_organization_staff_id, assignment_version_at_creation)
SELECT v.id, c.id, ps.department_id, ps.program_id, ps.id, d.name, p.name, ps.semester, ps.section, ps.academic_year,
  v.date, v.start_time, v.end_time, co.title, co.code, s.first_name || ' ' || s.last_name, v.remarks,
  'platform_staff', co.course_id, a.id, s.id, s.id, a.assignment_version
FROM (VALUES
  ('d0e19023-a79b-5210-824f-18d2cd308e53'::uuid, 'poornima.du@gmail.com'::text, 'HR'::text, 'MBA-HR-L1-ONBOARDING'::text, '2026-09-24'::date, '09:00'::time, '16:00'::time, 'Sheet row 31: Domain foundation and stream-specific functional concepts (SES-MBA-018)'::text),
  ('ed04cfb3-467c-5d1b-a143-86306bf789da'::uuid, 'cacsajay22@gmail.com'::text, 'Finance'::text, 'MBA-FIN-L1-SRILAKSHMI'::text, '2026-09-24'::date, '09:00'::time, '16:00'::time, 'Sheet row 32: Domain foundation and stream-specific functional concepts (SES-MBA-018)'::text),
  ('6886c001-5167-5b70-bc5a-b0a3622e877e'::uuid, 'vishwanathgurlhosur@gmail.com'::text, 'Marketing'::text, 'MBA-MKT-L1-SWAADFIT'::text, '2026-09-24'::date, '09:00'::time, '16:00'::time, 'Sheet row 33: Domain foundation and stream-specific functional concepts (SES-MBA-018)'::text),
  ('d830d391-17a3-54bd-b56b-a48e6fbea390'::uuid, 'poornima.du@gmail.com'::text, 'HR'::text, 'MBA-HR-L1-ONBOARDING'::text, '2026-09-25'::date, '09:00'::time, '16:00'::time, 'Sheet row 34: Domain foundation and stream-specific functional concepts (SES-MBA-019)'::text),
  ('bf7ad410-e697-544f-b67d-943aa28c733e'::uuid, 'cacsajay22@gmail.com'::text, 'Finance'::text, 'MBA-FIN-L1-SRILAKSHMI'::text, '2026-09-25'::date, '09:00'::time, '16:00'::time, 'Sheet row 35: Domain foundation and stream-specific functional concepts (SES-MBA-019)'::text),
  ('550187b5-eed4-5b5f-94cd-4760947e3c07'::uuid, 'vishwanathgurlhosur@gmail.com'::text, 'Marketing'::text, 'MBA-MKT-L1-SWAADFIT'::text, '2026-09-25'::date, '09:00'::time, '16:00'::time, 'Sheet row 36: Domain foundation and stream-specific functional concepts (SES-MBA-019)'::text),
  ('d4a9c478-dd18-5cd9-af5c-aa3802f32af8'::uuid, 'poornima.du@gmail.com'::text, 'HR'::text, 'MBA-HR-L1-ONBOARDING'::text, '2026-09-26'::date, '09:00'::time, '16:00'::time, 'Sheet row 37: Interview communication and boot camp (SES-MBA-020)'::text),
  ('578b5ee3-8b2b-5b8f-9769-a78c35723914'::uuid, 'cacsajay22@gmail.com'::text, 'Finance'::text, 'MBA-FIN-L1-SRILAKSHMI'::text, '2026-09-26'::date, '09:00'::time, '16:00'::time, 'Sheet row 38: Interview communication and boot camp (SES-MBA-020)'::text),
  ('80e7fc05-4246-5048-b520-ce12768cbcc9'::uuid, 'vishwanathgurlhosur@gmail.com'::text, 'Marketing'::text, 'MBA-MKT-L1-SWAADFIT'::text, '2026-09-26'::date, '09:00'::time, '16:00'::time, 'Sheet row 39: Interview communication and boot camp (SES-MBA-020)'::text),
  ('768c6d53-1cc5-5971-abfc-9e4eee3f00a6'::uuid, 'msadiq.india@gmail.com'::text, 'Business Analytics'::text, 'MBA-BA-L1-SRILAKSHMI'::text, '2026-09-30'::date, '13:30'::time, '16:00'::time, 'Sheet row 42: Business Analytics (SES-MBA-023)'::text),
  ('101729f1-fbf9-52ac-98de-e37d44b0b3ee'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, 'PRE-COUNSEL-INTRO'::text, '2026-08-31'::date, '09:00'::time, '16:00'::time, 'Sheet row 4: Pre Counseling (SES-MBA-003)'::text),
  ('a8c7953a-d12c-538f-9347-20b929108812'::uuid, 'lalitha@rareminds.in'::text, 'Finance'::text, 'PRE-COUNSEL-INTRO'::text, '2026-08-31'::date, '09:00'::time, '16:00'::time, 'Sheet row 5: Pre Counseling (SES-MBA-003)'::text),
  ('f0ea25ab-ae3d-561f-911c-c93f22a1d0a3'::uuid, 'visakh2013@rediffmail.com'::text, 'Marketing'::text, 'PRE-COUNSEL-INTRO'::text, '2026-08-31'::date, '09:00'::time, '16:00'::time, 'Sheet row 6: Pre Counseling (SES-MBA-003)'::text),
  ('76d27e5b-e70d-561c-b710-72fe7ef8d628'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, 'PRE-COUNSEL-INTRO'::text, '2026-09-01'::date, '09:00'::time, '16:00'::time, 'Sheet row 8: Pre Counseling (SES-MBA-004)'::text),
  ('6cc4c35d-7327-5e85-89b5-5533e5d12b93'::uuid, 'lalitha@rareminds.in'::text, 'Finance'::text, 'PRE-COUNSEL-INTRO'::text, '2026-09-01'::date, '09:00'::time, '16:00'::time, 'Sheet row 9: Pre Counseling (SES-MBA-004)'::text),
  ('fb66672c-5c28-5827-9c1d-ba0028426c9a'::uuid, 'visakh2013@rediffmail.com'::text, 'Marketing'::text, 'PRE-COUNSEL-INTRO'::text, '2026-09-01'::date, '09:00'::time, '16:00'::time, 'Sheet row 10: Pre Counseling (SES-MBA-004)'::text),
  ('8da493bc-afd0-5e62-a169-611f4edb1c42'::uuid, 'visakh2013@rediffmail.com'::text, 'HR'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-02'::date, '09:00'::time, '16:00'::time, 'Sheet row 12: Direct Counseling, Professional Introduction, Video Resume (SES-MBA-005)'::text),
  ('3b5ed27b-81c6-5901-88c9-0e008fe4a258'::uuid, 'lalitha@rareminds.in'::text, 'Marketing'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-02'::date, '09:00'::time, '16:00'::time, 'Sheet row 14: Direct Counseling, Professional Introduction, Video Resume (SES-MBA-005)'::text),
  ('be188d8a-956e-5767-b6cf-cb21c68af965'::uuid, 'krishnalatha@rareminds.in'::text, 'Business Analytics'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-02'::date, '09:00'::time, '16:00'::time, 'Sheet row 15: Direct Counseling, Professional Introduction, Video Resume (SES-MBA-005)'::text),
  ('6564a227-a338-52d9-a350-a5dfacea4d92'::uuid, 'visakh2013@rediffmail.com'::text, 'HR'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-03'::date, '09:00'::time, '16:00'::time, 'Sheet row 16: Direct Counseling, Professional Introduction, Video Resume (SES-MBA-006)'::text),
  ('d5a40870-d3e1-5188-958b-483d7018c9ca'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-03'::date, '09:00'::time, '16:00'::time, 'Sheet row 17: Direct Counseling, Professional Introduction, Video Resume (SES-MBA-006)'::text),
  ('550f4236-3f29-59fc-8e63-c2d3e9a2faa4'::uuid, 'lalitha@rareminds.in'::text, 'Marketing'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-03'::date, '09:00'::time, '16:00'::time, 'Sheet row 18: Direct Counseling, Professional Introduction, Video Resume (SES-MBA-006)'::text),
  ('1ed37700-37da-52b1-8cde-28990eb3dce6'::uuid, 'krishnalatha@rareminds.in'::text, 'Business Analytics'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-03'::date, '09:00'::time, '16:00'::time, 'Sheet row 19: Direct Counseling, Professional Introduction, Video Resume (SES-MBA-006)'::text),
  ('4b193434-cb45-511f-9d6e-00f4cc1cda0b'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Business Analytics'::text, 'PRE-COUNSEL-INTRO'::text, '2026-08-31'::date, '09:00'::time, '16:00'::time, 'Sheet row 7: Pre Counseling (SES-MBA-003)'::text),
  ('24c4ba8b-c594-57db-98f6-6e8821bd001e'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Business Analytics'::text, 'PRE-COUNSEL-INTRO'::text, '2026-09-01'::date, '09:00'::time, '16:00'::time, 'Sheet row 11: Pre Counseling (SES-MBA-004)'::text),
  ('87754297-df9a-5215-80e0-a060e689585e'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Finance'::text, 'VIDEO-RESUME-INTRO-2026'::text, '2026-09-02'::date, '09:00'::time, '16:00'::time, 'Sheet row 13: Direct Counseling, Professional Introduction, Video Resume (SES-MBA-005)'::text),
  ('bfc9eff1-763d-531d-9ef3-71f6031dd754'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V21'::text, '2026-09-07'::date, '13:30'::time, '16:00'::time, 'Sheet row 20: Business Formation - Understanding Company & its Departments (SES-MBA-007)'::text),
  ('506bc694-b27a-5c6c-873a-15de193e035a'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V22'::text, '2026-09-08'::date, '13:30'::time, '16:00'::time, 'Sheet row 21: Business Strategy & Planning (SES-MBA-008)'::text),
  ('ec180281-779d-5fc1-8b23-474de6d660e6'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V23'::text, '2026-09-09'::date, '13:30'::time, '16:00'::time, 'Sheet row 22: Functional Strategy & Planning (SES-MBA-009)'::text),
  ('3159f7b7-cad5-5aeb-ab87-1c3012478680'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V24'::text, '2026-09-15'::date, '13:30'::time, '16:00'::time, 'Sheet row 26: Revist Implementation based on learnigns from evaluations (SES-MBA-013)'::text),
  ('cb8e6bab-8638-584b-8580-fc8fe606b18f'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, 'VoltEdge_V24'::text, '2026-09-16'::date, '13:30'::time, '16:00'::time, 'Sheet row 27: Revist Implementation based on learnigns from evaluations (SES-MBA-014)'::text)
) AS v(id, email, stream, course_code, date, start_time, end_time, remarks)
JOIN public.organization_staff s ON lower(s.email) = v.email
  AND s.organization_id = '00000000-0000-0000-0000-000000000001' AND s.account_status = 'active'
JOIN public.organizations c ON c.name = 'Soundarya Institute of Management and Science' AND c.organization_type = 'college'
JOIN public.departments d ON d.college_id = c.id
JOIN public.programs p ON p.department_id = d.id AND p.code = 'MBA' AND p.specializations = ARRAY[v.stream]
JOIN public.program_sections ps ON ps.program_id = p.id AND ps.department_id = d.id
  AND ps.semester = 4 AND ps.section = 'A' AND ps.status = 'active'
JOIN public.courses co ON co.code = v.course_code AND co.deleted_at IS NULL AND co.status = 'Active'
JOIN public.organization_staff_assignments a ON a.staff_id = s.id AND a.section_id = ps.id AND a.is_active
WHERE public.external_teaching_mapping_valid(a.id, s.id, c.id, ps.id, co.course_id, v.date)
  AND public.external_teaching_slot_covers(a.id, v.date, v.start_time, v.end_time, co.course_id, ps.id)
  AND NOT EXISTS (
    SELECT 1 FROM public.college_attendance_sessions x
    WHERE x.organization_staff_id = s.id AND x.date = v.date AND x.status <> 'cancelled'
      AND x.start_time < v.end_time AND x.end_time > v.start_time)
ON CONFLICT (id) DO NOTHING;

-- 2. One blank attendance record per student per session (same columns the app writes; status NULL = unmarked)
INSERT INTO public.college_attendance_records
  (session_id, learner_id, learner_name, roll_number, department_name, program_name, program_id, semester, section, date, status,
   subject_name, subject_code, faculty_name, college_id, organization_staff_id)
SELECT ss.id, l.id, l.name, coalesce(l.roll_number, ''), ss.department_name, ss.program_name, ss.program_id, ss.semester, ss.section, ss.date, NULL,
  ss.subject_name, ss.subject_code, ss.faculty_name, ss.college_id, ss.organization_staff_id
FROM public.college_attendance_sessions ss
JOIN public.learners l ON l.college_id = ss.college_id AND l.program_id = ss.program_id
  AND l.semester = ss.semester AND l.section = ss.section AND NOT coalesce(l.is_deleted, false)
WHERE ss.id IN ('d0e19023-a79b-5210-824f-18d2cd308e53', 'ed04cfb3-467c-5d1b-a143-86306bf789da', '6886c001-5167-5b70-bc5a-b0a3622e877e', 'd830d391-17a3-54bd-b56b-a48e6fbea390', 'bf7ad410-e697-544f-b67d-943aa28c733e', '550187b5-eed4-5b5f-94cd-4760947e3c07', 'd4a9c478-dd18-5cd9-af5c-aa3802f32af8', '578b5ee3-8b2b-5b8f-9769-a78c35723914', '80e7fc05-4246-5048-b520-ce12768cbcc9', '768c6d53-1cc5-5971-abfc-9e4eee3f00a6', '101729f1-fbf9-52ac-98de-e37d44b0b3ee', 'a8c7953a-d12c-538f-9347-20b929108812', 'f0ea25ab-ae3d-561f-911c-c93f22a1d0a3', '76d27e5b-e70d-561c-b710-72fe7ef8d628', '6cc4c35d-7327-5e85-89b5-5533e5d12b93', 'fb66672c-5c28-5827-9c1d-ba0028426c9a', '8da493bc-afd0-5e62-a169-611f4edb1c42', '3b5ed27b-81c6-5901-88c9-0e008fe4a258', 'be188d8a-956e-5767-b6cf-cb21c68af965', '6564a227-a338-52d9-a350-a5dfacea4d92', 'd5a40870-d3e1-5188-958b-483d7018c9ca', '550f4236-3f29-59fc-8e63-c2d3e9a2faa4', '1ed37700-37da-52b1-8cde-28990eb3dce6', '4b193434-cb45-511f-9d6e-00f4cc1cda0b', '24c4ba8b-c594-57db-98f6-6e8821bd001e', '87754297-df9a-5215-80e0-a060e689585e', 'bfc9eff1-763d-531d-9ef3-71f6031dd754', '506bc694-b27a-5c6c-873a-15de193e035a', 'ec180281-779d-5fc1-8b23-474de6d660e6', '3159f7b7-cad5-5aeb-ab87-1c3012478680', 'cb8e6bab-8638-584b-8580-fc8fe606b18f')
ON CONFLICT (session_id, learner_id) DO NOTHING;

-- 3. Student counts on the sessions (the app does this right after creating the records)
UPDATE public.college_attendance_sessions ss
SET total_learners = (SELECT count(*) FROM public.college_attendance_records r WHERE r.session_id = ss.id)
WHERE ss.id IN ('d0e19023-a79b-5210-824f-18d2cd308e53', 'ed04cfb3-467c-5d1b-a143-86306bf789da', '6886c001-5167-5b70-bc5a-b0a3622e877e', 'd830d391-17a3-54bd-b56b-a48e6fbea390', 'bf7ad410-e697-544f-b67d-943aa28c733e', '550187b5-eed4-5b5f-94cd-4760947e3c07', 'd4a9c478-dd18-5cd9-af5c-aa3802f32af8', '578b5ee3-8b2b-5b8f-9769-a78c35723914', '80e7fc05-4246-5048-b520-ce12768cbcc9', '768c6d53-1cc5-5971-abfc-9e4eee3f00a6', '101729f1-fbf9-52ac-98de-e37d44b0b3ee', 'a8c7953a-d12c-538f-9347-20b929108812', 'f0ea25ab-ae3d-561f-911c-c93f22a1d0a3', '76d27e5b-e70d-561c-b710-72fe7ef8d628', '6cc4c35d-7327-5e85-89b5-5533e5d12b93', 'fb66672c-5c28-5827-9c1d-ba0028426c9a', '8da493bc-afd0-5e62-a169-611f4edb1c42', '3b5ed27b-81c6-5901-88c9-0e008fe4a258', 'be188d8a-956e-5767-b6cf-cb21c68af965', '6564a227-a338-52d9-a350-a5dfacea4d92', 'd5a40870-d3e1-5188-958b-483d7018c9ca', '550f4236-3f29-59fc-8e63-c2d3e9a2faa4', '1ed37700-37da-52b1-8cde-28990eb3dce6', '4b193434-cb45-511f-9d6e-00f4cc1cda0b', '24c4ba8b-c594-57db-98f6-6e8821bd001e', '87754297-df9a-5215-80e0-a060e689585e', 'bfc9eff1-763d-531d-9ef3-71f6031dd754', '506bc694-b27a-5c6c-873a-15de193e035a', 'ec180281-779d-5fc1-8b23-474de6d660e6', '3159f7b7-cad5-5aeb-ab87-1c3012478680', 'cb8e6bab-8638-584b-8580-fc8fe606b18f')
  AND ss.total_learners IS DISTINCT FROM (SELECT count(*) FROM public.college_attendance_records r WHERE r.session_id = ss.id);

COMMIT;
