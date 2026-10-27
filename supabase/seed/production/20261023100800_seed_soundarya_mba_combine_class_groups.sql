-- Create the real Combine Class groups for the Soundarya MBA "Combine" rows that have an uploaded LMS course:
-- 5 groups (5 trainers), each teaching one existing LMS course to ALL FOUR MBA streams (semester 4, section A) at the same date and time.
-- Mappings start on the event date and have NO end date, so they stay active (an educator can still mark attendance after the event day, and the
-- group stays listed for later dates inside its time slot). Lalitha's mappings (from 29 Aug) overlap in dates with her Pre-Counseling and Video Resume
-- mappings in Finance and Marketing (31 Aug to 3 Sep), which is allowed because the courses differ (migration 20270118: two mappings of one trainer and
-- class clash only when they share a course). The sheet itself gives start and end dates only for Maheswari (23 Sep to 23 Sep) and Koutham
-- (28 Sep to 28 Sep), in the Educator Details tab; the open end is a requirement that was given for this seed, not a value taken from the sheet.
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
--   maheswarikumar27@gmail.com       POWERBI-CORE-FOUND-2026                                    2026-09-23               09:00-16:00  30          Marketing 15, Finance 12, HR 18, Business Analyst 13
--   koutham8505@gmail.com            SKILL-ECOSYSTEM-ORIENTATION-2026                           2026-09-28               09:00-16:00  40          the same four streams (58) and 16 MCA learners
--   lalitha@rareminds.in             STUDENT-ASSESSMENT-INTRO-2026                              2026-08-29               09:00-16:00  3           none for this date
--   subashini.r@rareminds.in         SKILL-ECOSYSTEM-ORIENTATION-2026                           2026-10-01               10:00-13:00  43          none for this date
-- The class of each mapping is the stream's own MBA program record (programs.specializations = {Finance}, {HR}, {Marketing}, {"Business Analytics"}),
-- never the code 'MBA' alone. The mapping specialization list stays empty. Lalitha and Subashini keep every mapping they already have
-- (Pre-Counseling and Video Resume); the new mappings sit beside them because they hold a different course.
--
-- NOT SEEDED (nothing is skipped silently):
--   Course not in the uploaded Course Management files: row 25 Subashini (12 Sep) and row 41 Visakh (29 Sep, sheet text "Virtual Interviews"), both mapped to
--   Presentations & Evaluations (PRES-EVAL-INT-SCREEN-INTRO). They are not seeded. The course itself stays in the catalog.
--   No uploaded course yet: row 2 Student Registration, rows 23 and 24 Business Formation to Performance, row 28 Business data interpretation,
--   row 29 Stakeholder Management (the rows are combined classes of all four streams but the LMS has no course for them).
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
--   2. Before the first run no mapping carries the Combine note; after it there are 20 (5 groups x 4 streams):
--      SELECT count(*) FROM public.organization_staff_assignments WHERE notes LIKE 'Soundarya sheet MBA Combine class%';
--   3. The three courses must be Active: expect 3 rows.
--      SELECT code, status FROM public.courses WHERE deleted_at IS NULL AND code IN ('STUDENT-ASSESSMENT-INTRO-2026', 'POWERBI-CORE-FOUND-2026', 'SKILL-ECOSYSTEM-ORIENTATION-2026');

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

-- 1. One mapping per trainer, event and stream class (20 rows), starting on the event date. A mapping is created only when every course is Active and the trainer
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
  ('ece58412-8c0c-50df-bdbf-84f61eaaa43c'::uuid, 'subashini.r@rareminds.in'::text, 'Business Analytics'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '2026-10-01'::date, NULL::date, 'Soundarya sheet MBA Combine class, Attendance row 43'::text)
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
    ('21840cac-e24c-5261-88ea-44c562e8b8bc'::uuid, 'sandhyamohan.sharath@gmail.com'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '10:00'::time, '13:00'::time),
    ('cb58d98d-214c-5821-97cb-b6b496b21202'::uuid, 'maheswarikumar27@gmail.com'::text, ARRAY['POWERBI-CORE-FOUND-2026']::text[], '09:00'::time, '16:00'::time),
    ('da4a2d1e-b34d-5ba7-9f6e-7da21103c053'::uuid, 'koutham8505@gmail.com'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '09:00'::time, '16:00'::time),
    ('19a422a3-29f8-5830-8f82-667ad9fa19a9'::uuid, 'lalitha@rareminds.in'::text, ARRAY['STUDENT-ASSESSMENT-INTRO-2026']::text[], '09:00'::time, '16:00'::time),
    ('c862f7dc-dfed-599a-b9f4-37a3cb8754bd'::uuid, 'subashini.r@rareminds.in'::text, ARRAY['SKILL-ECOSYSTEM-ORIENTATION-2026']::text[], '10:00'::time, '13:00'::time)
  ) AS t(gid, email, course_codes, slot_start, slot_end)
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
    WHERE a.is_active AND want IS NOT NULL AND jsonb_array_length(want) = cardinality(g.course_codes) AND a.assigned_courses = want;
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
