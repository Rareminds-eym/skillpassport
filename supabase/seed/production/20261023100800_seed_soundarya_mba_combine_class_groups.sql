-- Create the real Combine Class groups for the Soundarya MBA "Combine" rows that have an uploaded LMS course:
-- 10 groups (6 trainers; Subashini has four and Sandhya two), each teaching its existing LMS course(s) to ALL FOUR MBA streams (semester 4, section A) at the same date and time.
-- Mappings start on the event date and have NO end date, so they stay active (an educator can still mark attendance after the event day, and the
-- group stays listed for later dates inside its time slot). Lalitha's mappings (from 29 Aug) overlap in dates with her Pre-Counseling and Video Resume
-- mappings in Finance and Marketing (31 Aug to 3 Sep), which is allowed because the courses differ (migration 20270118: two mappings of one trainer and
-- class clash only when they share a course). The sheet itself gives start and end dates only for Maheswari (23 Sep to 23 Sep) and Koutham
-- (28 Sep to 28 Sep), in the Educator Details tab; the open end is a requirement that was given for this seed, not a value taken from the sheet.
-- SUBASHINI, VoltEdge and Interview Screening (rows 23, 24, 25, 28, 29; workbook 8): three more groups of four mappings, one per date window, each with its own shared slot and its own course(s).
-- They are separate groups because the app's own checks (group_mappings and map; repeated in step 2 below) refuse two slotted mappings of one trainer whose date ranges AND slots overlap, whatever the
-- session dates. Row 25 (2026-09-12, 10:00-13:00) falls between her VoltEdge events (2026-09-10/11 and 2026-09-21/22), so it would clash with any single VoltEdge group spanning them. The windows do not overlap:
--   2026-09-10 to 2026-09-11  09:00-16:00  VoltEdge_V18  Business Formation to Performance - Functional Implementation (rows 23 and 24)
--   2026-09-12 to 2026-09-12  10:00-13:00  PRES-EVAL-INT-SCREEN-INTRO  Presentations & Evaluations - Interview Screening (row 25; the sheet writes 'Presentations & Evaluations / Interview Screening')
--   2026-09-21 to 2026-09-30  09:00-16:00  VoltEdge_V18 again, a second group on the same course (row 28 Business data interpretation and decision-making, row 29 Stakeholder Management & Communication; the sheet
--   writes 'Communciation'): all of her VoltEdge rows are taught under the one existing LMS course VoltEdge_V18, and each row's sheet text stays in the session remarks. The two V18 groups do not overlap in dates,
--   so the one-trainer, one-course overlap rule (migration 20270118) is satisfied; step 2 below tells them apart by their start date.
-- These (and Sandhya's one-day group below) are the only Combine mappings WITH an end date: an open-ended slot would overlap her open-ended Skill Ecosystem slot (10:00-13:00 from 2026-10-01), and 2026-09-30 is the last end date that does not.
-- An educator cannot open the roster of a session whose mapping ended before today; the College Admin bulk attendance import is not affected. Each group needs only its own course(s) to be Active, so a missing
-- course skips only that group.
-- SANDHYA MOHAN, Student Registration (row 2, 2026-08-28, 09:00-16:00; no new course: the sheet's 'Student Registration' is taught under the existing LMS course Student Assessment): a second group of four mappings
-- to the SAME course as her first group (from 2026-08-29, slot 10:00-13:00). Two groups of one trainer and one course are allowed because their date ranges do not overlap (migration 20270118 and the app's
-- slot check only compare overlapping ranges); the new group ends on 2026-08-28 because an open-ended 09:00-16:00 slot would overlap her 10:00-13:00 slot from 2026-08-29. An educator cannot open the roster
-- of a session whose mapping ended before today; the workbook has no marks for this session. Step 2 below matches a group's mappings by its start date (the 'gstart' column) so the two groups are not mixed up.
-- VISAKH MADHU, row 41 (sheet text 'Virtual Interviews', 2026-09-29, 13:30-16:00, MBA Combine; workbook 8): a group of four mappings to the existing LMS course Presentations & Evaluations - Interview Screening
-- (PRES-EVAL-INT-SCREEN-INTRO), the course of Subashini's row 25 group; the course title differs from the sheet text, so the sheet text is kept in the session remarks. The mappings start on 2026-09-29 and
-- have no end date: his only other mappings have no slot, so the 13:30-16:00 slot overlaps nothing and the educator can still mark.
-- For each trainer this seed (1) creates one mapping per stream class, (2) gives every mapping the same time slot, and (3) tags the four
-- mappings with one combined_class_group_id. That is what the app's SP Admin action group_mappings does, so the College Admin
-- "Combined Class" form (combined_groups / create_combined_session) lists the group. Nothing is written to the SSO database.
-- Mappings, groups and slots only: the Combine sessions and learner records are in 20261023100900_seed_soundarya_mba_combine_class_sessions.sql.
-- Runs after the production trainers seed (20261023100100_seed_soundarya_trainers_skillpassport.sql) and the MBA assignments seed
-- (20261023100500_seed_soundarya_mba_trainer_assignments.sql). Requires migration 20270117000000_combined_class_sessions.sql (group column and
-- guard triggers) and migration 20270118000000_allow_multiple_trainer_class_mappings.sql (several non-clashing mappings per trainer and class,
-- needed because Lalitha and Subashini already hold other mappings in some of these classes). The file stops with a clear message if either is missing.
--
-- GROUPS (Educator Attendance tab of the Soundarya workbook 8, plus the Learner Attendance tab for who attended):
--   Trainer                          Course (courses.code)                                      Mapping starts           Shared slot  Sheet rows  Learners seen in the Learner Attendance tab
--   sandhyamohan.sharath@gmail.com   STUDENT-ASSESSMENT-INTRO-2026                              2026-08-29               10:00-13:00  44          none for this date (classes come from the Combine label)
--   sandhyamohan.sharath@gmail.com   STUDENT-ASSESSMENT-INTRO-2026 (second group)           2026-08-28 to 2026-08-28  09:00-16:00  2           none (SES-MBA-001 has no learner rows); the four streams' class lists
--   maheswarikumar27@gmail.com       POWERBI-CORE-FOUND-2026                                    2026-09-23               09:00-16:00  30          Marketing 15, Finance 12, HR 18, Business Analyst 13
--   koutham8505@gmail.com            SKILL-ECOSYSTEM-ORIENTATION-2026                           2026-09-28               09:00-16:00  40          the same four streams (58) and 16 MCA learners
--   lalitha@rareminds.in             STUDENT-ASSESSMENT-INTRO-2026                              2026-08-29               09:00-16:00  3           none for this date
--   subashini.r@rareminds.in         SKILL-ECOSYSTEM-ORIENTATION-2026                           2026-10-01               10:00-13:00  43          none for this date
--   subashini.r@rareminds.in         VoltEdge_V18                                                2026-09-10 to 2026-09-11  09:00-16:00  23, 24  Business Formation to Performance: the four streams, 13/12/18/15 learners (SES-MBA-010, 011)
--   subashini.r@rareminds.in         PRES-EVAL-INT-SCREEN-INTRO                                  2026-09-12 to 2026-09-12  10:00-13:00  25      Interview Screening: the four streams, 13/12/18/15 learners (SES-MBA-012)
--   subashini.r@rareminds.in         VoltEdge_V18 (second group)                                 2026-09-21 to 2026-09-30  09:00-16:00  28, 29  Business data interpretation (28), Stakeholder Management (29), taught under V18: the four streams, 13/12/18/15 learners (SES-MBA-015, 016)
--   visakh2013@rediffmail.com        PRES-EVAL-INT-SCREEN-INTRO                                  2026-09-29 (no end)       13:30-16:00  41          the four streams: Marketing 15, Finance 12, HR 18, Business Analyst 13 (SES-MBA-022; all marked absent in the workbook, not imported here)
-- The class of each mapping is the stream's own MBA program record (programs.specializations = {Finance}, {HR}, {Marketing}, {"Business Analytics"}),
-- never the code 'MBA' alone. The mapping specialization list stays empty. Lalitha and Subashini keep every mapping they already have
-- (Pre-Counseling and Video Resume); the new mappings sit beside them because they hold a different course.
--
-- NOT SEEDED (nothing is skipped silently):
--   Unsupported by the design: Subashini teaching MBA HR and MCA together for Pre Counseling (rows 4/45 and 8/46); one mapping can belong to only one group.
--   Open question: the 28 Sep session also had 16 MCA learners and the sheet names Karthikeyan for MCA (row 58); Koutham's group here is the four MBA streams only.
--
-- A group is skipped with a NOTICE, never forced, when: a trainer, class or course is not found or a course is not Active; a trainer does not
-- have exactly the four stream mappings with exactly these courses; any of the four is already in another group or has different slots; or the slot
-- clashes with another slotted mapping of the same trainer. The group tagging sets rareminds.combined_group_mapping_op to the new group id, the
-- same setting group_mappings uses to pass the guard trigger guard_combined_group_mapping; the trigger is not disabled.
-- Safe to re-run: fixed mapping ids, fixed group ids, the overlap check on existing mappings, slots inserted only when a mapping has none, and the
-- group tag applied only where combined_class_group_id is NULL mean a second run changes nothing.
--
-- PRE-CHECK (read-only), run first:
--   1. Both migrations must be applied: expect 1 row for each.
--      SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organization_staff_assignments' AND column_name = 'combined_class_group_id';
--      SELECT 1 FROM pg_proc WHERE proname = 'trainer_class_mapping_clash';
--   2. Before the first run no mapping carries the Combine note; after it there are 40 (10 groups x 4 streams):
--      SELECT count(*) FROM public.organization_staff_assignments WHERE notes LIKE 'Soundarya sheet MBA Combine class%';
--   3. The five courses must be Active: expect 5 rows.
--      SELECT code, status FROM public.courses WHERE deleted_at IS NULL AND code IN ('STUDENT-ASSESSMENT-INTRO-2026', 'POWERBI-CORE-FOUND-2026', 'SKILL-ECOSYSTEM-ORIENTATION-2026', 'VoltEdge_V18', 'PRES-EVAL-INT-SCREEN-INTRO');

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organization_staff_assignments' AND column_name = 'combined_class_group_id')
     OR to_regprocedure('public.guard_combined_group_mapping()') IS NULL THEN
    RAISE EXCEPTION 'Apply migration 20270117000000_combined_class_sessions.sql before this seed';
  END IF;
  IF to_regprocedure('public.trainer_class_mapping_clash(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Apply migration 20270118000000_allow_multiple_trainer_class_mappings.sql before this seed';
  END IF;
END $$;

-- 1. One mapping per trainer, group and stream class (40 rows), starting on the event date. A mapping is created only when every course is Active and the trainer
--    has no other active mapping in that class that holds the same course during the same dates.
INSERT INTO public.organization_staff_assignments
  (id, staff_id, college_id, department_id, program_id, section_id, assigned_courses, start_date, end_date, is_active, notes, metadata)
SELECT v.id, s.id, c.id, ps.department_id, ps.program_id, ps.id,
  (SELECT jsonb_agg(co.course_id::text ORDER BY co.code) FROM public.courses co
     WHERE co.code = ANY(v.course_codes) AND co.deleted_at IS NULL AND co.status = 'Active'),
  v.start_date, v.end_date, true, v.notes,
  '{"specializations": []}'::jsonb
FROM (VALUES
  ('96c1301d-dc5b-5e5e-bde2-f7a9f9d31f95'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Finance'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 44'::text),
  ('e2ba9941-7dd0-5509-8899-4240806bf63a'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 44'::text),
  ('79efffa8-1b5e-529e-ae75-5a09a9a4dc2c'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Marketing'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 44'::text),
  ('fefa4145-f5d4-53e2-9cfa-dc09b3075957'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Business Analytics'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 44'::text),
  ('62edaee3-3f8a-5601-a079-7841219ed596'::uuid, 'maheswarikumar27@gmail.com'::text, 'Finance'::text, ARRAY['POWERBI-CORE-FOUND-2026']::text[], '2026-09-23'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 30'::text),
  ('05597dc3-a46c-5256-9747-48aa8fb1fb4b'::uuid, 'maheswarikumar27@gmail.com'::text, 'HR'::text, ARRAY['POWERBI-CORE-FOUND-2026']::text[], '2026-09-23'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 30'::text),
  ('16e787b1-1f11-5539-b5c2-156406ce7074'::uuid, 'maheswarikumar27@gmail.com'::text, 'Marketing'::text, ARRAY['POWERBI-CORE-FOUND-2026']::text[], '2026-09-23'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 30'::text),
  ('4f7a4805-e4c4-52dd-81f0-9d4d634d68d1'::uuid, 'maheswarikumar27@gmail.com'::text, 'Business Analytics'::text, ARRAY['POWERBI-CORE-FOUND-2026']::text[], '2026-09-23'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 30'::text),
  ('03a621a1-3415-5a1f-8ff3-5e0c03900705'::uuid, 'koutham8505@gmail.com'::text, 'Finance'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '2026-09-28'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 40'::text),
  ('4b334d11-e074-516d-b103-d1a2440e17c4'::uuid, 'koutham8505@gmail.com'::text, 'HR'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '2026-09-28'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 40'::text),
  ('d0085235-e9bf-57d1-80a0-1c70af1b4d12'::uuid, 'koutham8505@gmail.com'::text, 'Marketing'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '2026-09-28'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 40'::text),
  ('cc4bee67-e1cd-5f90-ab18-ecf827cafad5'::uuid, 'koutham8505@gmail.com'::text, 'Business Analytics'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '2026-09-28'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 40'::text),
  ('cf849dca-6619-5b1a-8c35-35cd9dee8e75'::uuid, 'lalitha@rareminds.in'::text, 'Finance'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 3'::text),
  ('ef531d26-aca8-5ef7-9130-919944461b6d'::uuid, 'lalitha@rareminds.in'::text, 'HR'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 3'::text),
  ('aa06bd46-e25e-5036-b0fc-b27cc2f0115c'::uuid, 'lalitha@rareminds.in'::text, 'Marketing'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 3'::text),
  ('d964759f-1fdf-5284-85cc-de81080d10e2'::uuid, 'lalitha@rareminds.in'::text, 'Business Analytics'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 3'::text),
  ('7c04ec29-650c-5a9b-8f66-bdce0c58413b'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '2026-10-01'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 43'::text),
  ('4e89b325-2253-599c-84d2-62cad54420e5'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '2026-10-01'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 43'::text),
  ('45b59b25-4ec3-59df-802d-62b417a38c1f'::uuid, 'subashini.r@rareminds.in'::text, 'Marketing'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '2026-10-01'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 43'::text),
  ('ece58412-8c0c-50df-bdbf-84f61eaaa43c'::uuid, 'subashini.r@rareminds.in'::text, 'Business Analytics'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '2026-10-01'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 43'::text),
  ('30b982cd-e525-554c-a016-6bf88beca1d2'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, ARRAY['VoltEdge_V18']::text[], '2026-09-10'::date, '2026-09-11'::date, 'Soundarya sheet MBA Combine class, Attendance rows 23, 24'::text),
  ('8aa97911-0a2b-5946-855a-ed34476a3b2b'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, ARRAY['VoltEdge_V18']::text[], '2026-09-10'::date, '2026-09-11'::date, 'Soundarya sheet MBA Combine class, Attendance rows 23, 24'::text),
  ('cd9188e5-a038-5277-9d8b-0ce2ba73d61a'::uuid, 'subashini.r@rareminds.in'::text, 'Marketing'::text, ARRAY['VoltEdge_V18']::text[], '2026-09-10'::date, '2026-09-11'::date, 'Soundarya sheet MBA Combine class, Attendance rows 23, 24'::text),
  ('896c70e3-205b-573f-9c37-3be8b524a1a4'::uuid, 'subashini.r@rareminds.in'::text, 'Business Analytics'::text, ARRAY['VoltEdge_V18']::text[], '2026-09-10'::date, '2026-09-11'::date, 'Soundarya sheet MBA Combine class, Attendance rows 23, 24'::text),
  ('9dd25a83-c3d1-5863-8544-1f5e74a760d3'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, ARRAY['PRES-EVAL-INT-SCREEN-INTRO']::text[], '2026-09-12'::date, '2026-09-12'::date, 'Soundarya sheet MBA Combine class, Attendance row 25'::text),
  ('204d07f3-8759-50c2-8d8e-e1a98adde3e6'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, ARRAY['PRES-EVAL-INT-SCREEN-INTRO']::text[], '2026-09-12'::date, '2026-09-12'::date, 'Soundarya sheet MBA Combine class, Attendance row 25'::text),
  ('82fbb7ea-0983-57bb-95cf-3551120f4a67'::uuid, 'subashini.r@rareminds.in'::text, 'Marketing'::text, ARRAY['PRES-EVAL-INT-SCREEN-INTRO']::text[], '2026-09-12'::date, '2026-09-12'::date, 'Soundarya sheet MBA Combine class, Attendance row 25'::text),
  ('3b08680a-37de-5e3a-896a-e812192b49a4'::uuid, 'subashini.r@rareminds.in'::text, 'Business Analytics'::text, ARRAY['PRES-EVAL-INT-SCREEN-INTRO']::text[], '2026-09-12'::date, '2026-09-12'::date, 'Soundarya sheet MBA Combine class, Attendance row 25'::text),
  ('fd0f99ce-57d9-52ff-8270-a50cea6c41ea'::uuid, 'subashini.r@rareminds.in'::text, 'Finance'::text, ARRAY['VoltEdge_V18']::text[], '2026-09-21'::date, '2026-09-30'::date, 'Soundarya sheet MBA Combine class, Attendance rows 28, 29'::text),
  ('6f212c19-7d3e-5aa1-b78e-4a53fbd4127d'::uuid, 'subashini.r@rareminds.in'::text, 'HR'::text, ARRAY['VoltEdge_V18']::text[], '2026-09-21'::date, '2026-09-30'::date, 'Soundarya sheet MBA Combine class, Attendance rows 28, 29'::text),
  ('b09bb640-b6f0-597f-b186-8090dc3633b2'::uuid, 'subashini.r@rareminds.in'::text, 'Marketing'::text, ARRAY['VoltEdge_V18']::text[], '2026-09-21'::date, '2026-09-30'::date, 'Soundarya sheet MBA Combine class, Attendance rows 28, 29'::text),
  ('18923559-87ef-5573-8b59-c36daf990425'::uuid, 'subashini.r@rareminds.in'::text, 'Business Analytics'::text, ARRAY['VoltEdge_V18']::text[], '2026-09-21'::date, '2026-09-30'::date, 'Soundarya sheet MBA Combine class, Attendance rows 28, 29'::text),
  ('5063b4f0-33c0-544a-8fc5-ddfa0befd88c'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Finance'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-28'::date, '2026-08-28'::date, 'Soundarya sheet MBA Combine class, Attendance row 2'::text),
  ('40873ef0-a29f-50d1-84c2-d32ff6e75563'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'HR'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-28'::date, '2026-08-28'::date, 'Soundarya sheet MBA Combine class, Attendance row 2'::text),
  ('c40238ed-d648-565c-8a44-4412f543abc6'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Marketing'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-28'::date, '2026-08-28'::date, 'Soundarya sheet MBA Combine class, Attendance row 2'::text),
  ('141ce959-b435-58e3-99c4-77557cfcf198'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'Business Analytics'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '2026-08-28'::date, '2026-08-28'::date, 'Soundarya sheet MBA Combine class, Attendance row 2'::text),
  ('c62b64d3-cd9d-5e04-94a1-95cb57b4a394'::uuid, 'visakh2013@rediffmail.com'::text, 'Finance'::text, ARRAY['PRES-EVAL-INT-SCREEN-INTRO']::text[], '2026-09-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 41'::text),
  ('f8e293d4-6fda-5f4e-850c-03f9baf20eb1'::uuid, 'visakh2013@rediffmail.com'::text, 'HR'::text, ARRAY['PRES-EVAL-INT-SCREEN-INTRO']::text[], '2026-09-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 41'::text),
  ('c13e6e81-f3d7-5b9f-8567-86030ed5622c'::uuid, 'visakh2013@rediffmail.com'::text, 'Marketing'::text, ARRAY['PRES-EVAL-INT-SCREEN-INTRO']::text[], '2026-09-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 41'::text),
  ('87b7723b-ad54-5629-b87f-0bc9fabbb951'::uuid, 'visakh2013@rediffmail.com'::text, 'Business Analytics'::text, ARRAY['PRES-EVAL-INT-SCREEN-INTRO']::text[], '2026-09-29'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 41'::text)
) AS v(id, email, stream, course_codes, start_date, end_date, notes)
JOIN public.organization_staff s ON lower(s.email) = v.email
  AND s.organization_id = '00000000-0000-0000-0000-000000000001' AND s.account_status = 'active'
JOIN public.organizations c ON c.name = 'Soundarya Institute of Management and Science' AND c.organization_type = 'college'
JOIN public.departments d ON d.college_id = c.id
JOIN public.programs p ON p.department_id = d.id AND p.code = 'MBA' AND p.specializations = ARRAY[v.stream]
JOIN public.program_sections ps ON ps.program_id = p.id AND ps.department_id = d.id
  AND ps.semester = 4 AND ps.section = 'A' AND ps.status = 'active'
WHERE (SELECT count(*) FROM public.courses co
         WHERE co.code = ANY(v.course_codes) AND co.deleted_at IS NULL AND co.status = 'Active') = cardinality(v.course_codes)
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_staff_assignments x
    WHERE x.staff_id = s.id AND x.section_id = ps.id AND x.is_active
      AND v.start_date <= coalesce(x.end_date, 'infinity'::date) AND x.start_date <= coalesce(v.end_date, 'infinity'::date)
      AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(x.assigned_courses) xc
                  WHERE xc IN (SELECT co2.course_id::text FROM public.courses co2 WHERE co2.code = ANY(v.course_codes))))
ON CONFLICT (id) DO NOTHING;

-- 2 and 3. Shared time slot and group tag, one group per trainer (the same steps and checks as group_mappings)
DO $$
DECLARE
  g record; want jsonb; mids uuid[]; n int; slots jsonb; clash text;
BEGIN
  FOR g IN SELECT * FROM (VALUES
    ('21840cac-e24c-5261-88ea-44c562e8b8bc'::uuid, 'sandhyamohan.sharath@gmail.com'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '10:00'::time, '13:00'::time, '2026-08-29'::date),
    ('cb58d98d-214c-5821-97cb-b6b496b21202'::uuid, 'maheswarikumar27@gmail.com'::text, ARRAY['POWERBI-CORE-FOUND-2026']::text[], '09:00'::time, '16:00'::time, '2026-09-23'::date),
    ('da4a2d1e-b34d-5ba7-9f6e-7da21103c053'::uuid, 'koutham8505@gmail.com'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '09:00'::time, '16:00'::time, '2026-09-28'::date),
    ('19a422a3-29f8-5830-8f82-667ad9fa19a9'::uuid, 'lalitha@rareminds.in'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '09:00'::time, '16:00'::time, '2026-08-29'::date),
    ('c862f7dc-dfed-599a-b9f4-37a3cb8754bd'::uuid, 'subashini.r@rareminds.in'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '10:00'::time, '13:00'::time, '2026-10-01'::date),
    ('066ec4ee-5c5d-5026-8773-75491f9b63da'::uuid, 'subashini.r@rareminds.in'::text, ARRAY['VoltEdge_V18']::text[], '09:00'::time, '16:00'::time, '2026-09-10'::date),
    ('5b63c2d1-cf2d-558a-8d49-c1c83992b360'::uuid, 'subashini.r@rareminds.in'::text, ARRAY['PRES-EVAL-INT-SCREEN-INTRO']::text[], '10:00'::time, '13:00'::time, '2026-09-12'::date),
    ('4d6dec34-147a-5876-87e2-a83202ec2eba'::uuid, 'subashini.r@rareminds.in'::text, ARRAY['VoltEdge_V18']::text[], '09:00'::time, '16:00'::time, '2026-09-21'::date),
    ('b9a61ad2-58d7-5409-8eda-4e1924b980c1'::uuid, 'sandhyamohan.sharath@gmail.com'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '09:00'::time, '16:00'::time, '2026-08-28'::date),
    ('49552c9e-a6bc-5565-88d2-1712e51e2298'::uuid, 'visakh2013@rediffmail.com'::text, ARRAY['PRES-EVAL-INT-SCREEN-INTRO']::text[], '13:30'::time, '16:00'::time, '2026-09-29'::date)
  ) AS t(gid, email, course_codes, slot_start, slot_end, gstart)
  LOOP
    SELECT jsonb_agg(co.course_id::text ORDER BY co.code) INTO want FROM public.courses co
      WHERE co.code = ANY(g.course_codes) AND co.deleted_at IS NULL AND co.status = 'Active';
    -- the trainer's four stream mappings that hold exactly these courses
    SELECT array_agg(a.id ORDER BY a.id) INTO mids
    FROM public.organization_staff_assignments a
    JOIN public.organization_staff s ON s.id = a.staff_id AND lower(s.email) = g.email
    JOIN public.program_sections ps ON ps.id = a.section_id AND ps.semester = 4 AND ps.section = 'A'
    JOIN public.programs p ON p.id = ps.program_id AND p.code = 'MBA'
      AND p.specializations IN (ARRAY['Finance'], ARRAY['HR'], ARRAY['Marketing'], ARRAY['Business Analytics'])
    WHERE a.is_active AND want IS NOT NULL AND jsonb_array_length(want) = cardinality(g.course_codes) AND a.assigned_courses = want
      AND a.start_date = g.gstart;  -- one trainer can hold two groups for the same course (different start dates)
    n := coalesce(array_length(mids, 1), 0);
    IF n <> 4 THEN
      RAISE NOTICE 'Combine group % skipped: expected 4 stream mappings with courses %, found %', g.email, g.course_codes, n;
      CONTINUE;
    END IF;
    IF (SELECT count(*) FROM public.organization_staff_assignments WHERE id = ANY(mids) AND combined_class_group_id = g.gid) = 4 THEN
      CONTINUE;  -- already created by an earlier run
    END IF;
    IF EXISTS (SELECT 1 FROM public.organization_staff_assignments WHERE id = ANY(mids) AND combined_class_group_id IS NOT NULL) THEN
      RAISE NOTICE 'Combine group % skipped: a mapping already belongs to another combined group', g.email;
      CONTINUE;
    END IF;
    slots := jsonb_build_array(jsonb_build_object('start_time', to_char(g.slot_start, 'HH24:MI'), 'end_time', to_char(g.slot_end, 'HH24:MI')));
    PERFORM public.external_teaching_validate_slots(mids[1], slots,
      (SELECT assigned_courses FROM public.organization_staff_assignments WHERE id = mids[1]),
      (SELECT section_id FROM public.organization_staff_assignments WHERE id = mids[1]),
      (SELECT college_id FROM public.organization_staff_assignments WHERE id = mids[1]));
    -- a mapping that already has slots may only be grouped when they are exactly the shared slot
    IF EXISTS (SELECT 1 FROM public.assignment_time_slots ts WHERE ts.assignment_id = ANY(mids)
               AND NOT (ts.start_time = g.slot_start AND ts.end_time = g.slot_end)) THEN
      RAISE NOTICE 'Combine group % skipped: a mapping already has different time slots', g.email;
      CONTINUE;
    END IF;
    -- the shared slot must not overlap another slotted mapping of the same trainer (the group's own mappings are ignored)
    SELECT 'overlaps ' || to_char(os.start_time, 'HH24:MI') || '-' || to_char(os.end_time, 'HH24:MI') INTO clash
    FROM public.organization_staff_assignments gm
    JOIN public.organization_staff_assignments oa ON oa.staff_id = gm.staff_id AND oa.is_active AND oa.id <> ALL(mids)
      AND coalesce(gm.end_date, 'infinity'::date) >= oa.start_date AND gm.start_date <= coalesce(oa.end_date, 'infinity'::date)
    JOIN public.assignment_time_slots os ON os.assignment_id = oa.id
    WHERE gm.id = ANY(mids) AND g.slot_start < os.end_time AND os.start_time < g.slot_end
    LIMIT 1;
    IF clash IS NOT NULL THEN
      RAISE NOTICE 'Combine group % skipped: the shared slot % another mapping of the trainer', g.email, clash;
      CONTINUE;
    END IF;
    INSERT INTO public.assignment_time_slots (assignment_id, start_time, end_time)
    SELECT m, g.slot_start, g.slot_end FROM unnest(mids) m
    WHERE NOT EXISTS (SELECT 1 FROM public.assignment_time_slots x WHERE x.assignment_id = m);
    PERFORM set_config('rareminds.combined_group_mapping_op', g.gid::text, true);
    UPDATE public.organization_staff_assignments
      SET combined_class_group_id = g.gid, assignment_version = assignment_version + 1
      WHERE id = ANY(mids) AND combined_class_group_id IS NULL;
    PERFORM set_config('rareminds.combined_group_mapping_op', '', true);
  END LOOP;
END $$;

COMMIT;
