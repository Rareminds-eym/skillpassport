-- DO NOT PUSH. Manual development/local database seed only.
-- Development database only: Soundarya learner needed for attendance imports.
-- Creates the learner profile only; does not provision SSO/login accounts.
DO $gagana_dev_seed$
DECLARE
  target_program uuid;
  target_section uuid;
BEGIN
  SELECT p.id, s.id INTO STRICT target_program, target_section
  FROM public.programs p
  JOIN public.departments d ON d.id = p.department_id
  JOIN public.program_sections s ON s.program_id = p.id
  WHERE d.college_id = '284c9ed9-cd13-584d-b5bc-e198866b917b'
    AND p.code = 'MBA' AND p.specializations = ARRAY['HR']
    AND s.semester = 4 AND s.section = 'A' AND s.status = 'active';

  IF EXISTS (
    SELECT 1 FROM public.learners l
    WHERE (lower(trim(l.email)) = 'gaganaks029@gmail.com'
      OR l.roll_number = 'P03KU24M016083'
      OR l.id = 'b997e96a-ef84-5f4b-8d02-ffb798c40898')
    AND (lower(trim(l.email)) IS DISTINCT FROM 'gaganaks029@gmail.com'
      OR l.roll_number IS DISTINCT FROM 'P03KU24M016083'
      OR l.college_id IS DISTINCT FROM '284c9ed9-cd13-584d-b5bc-e198866b917b'::uuid
      OR l.program_id IS DISTINCT FROM target_program
      OR l.program_section_id IS DISTINCT FROM target_section
      OR l.semester IS DISTINCT FROM 4 OR l.section IS DISTINCT FROM 'A'
      OR l.specialization IS DISTINCT FROM 'HR' OR l.is_deleted IS TRUE)
  ) THEN
    RAISE EXCEPTION 'Conflicting Gagana learner identity or class; reconcile before seeding';
  END IF;

  INSERT INTO public.learners
    (id, name, email, roll_number, college_id, program_id, program_section_id,
     semester, section, specialization, course_name, is_deleted)
  SELECT 'b997e96a-ef84-5f4b-8d02-ffb798c40898', 'Gagana K S',
    'gaganaks029@gmail.com', 'P03KU24M016083',
    '284c9ed9-cd13-584d-b5bc-e198866b917b', target_program, target_section,
    4, 'A', 'HR', 'Master of Business Administration', false
  WHERE NOT EXISTS (
    SELECT 1 FROM public.learners WHERE lower(trim(email)) = 'gaganaks029@gmail.com'
  );
END;
$gagana_dev_seed$;
