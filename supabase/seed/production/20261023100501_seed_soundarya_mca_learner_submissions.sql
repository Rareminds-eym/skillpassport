-- Seed for SkillPassport App DB (production)
-- Updates learner submissions for MCA students who have submitted their tasks
-- Updates existing college_learner_assignments rows from 'todo' to 'submitted'
-- Safe and idempotent: Only updates rows that exist and aren't already submitted
-- Submission dates are calculated as ~1 week after task due dates
--
-- TASKS AND THEIR DUE DATES (from 20261023100400_seed_soundarya_mca_tasks.sql):
--   Task 1: 'create a candidate hiring page, Apply the css to the candidate hiring page' - Due: 2026-09-15, Submit: 2026-09-22
--   Task 2: 'Task Management Assessment' - Due: 2026-09-16, Submit: 2026-09-23
--   Task 3: 'College / Student Management Project' - Due: 2026-09-21, Submit: 2026-09-28
--
-- SUBMISSIONS SEEDED:
--   Task 1 (HTML/CSS): 12 students (Daksh, Pradeep, Leo, Sanchay, Lavanya B, Lavanya P, Meghana, Hamsa, Akhila, Bhoomika, Nayana, Abhijith)
--   Task 2 (Task Management): 9 students (Sanchay, Harshil, Pradeep, Lavanya B, Lavanya P, Hamsa, Nayana, Meghana, Nalina)
--   Task 3 (College Management): 11 students (Bhoomika, Lavanya B, Lavanya P, Meghana, Leo, Nayana, Hamsa, Sanchay, Harshil, Abhijith, Daksh)
--   Total: 32 submissions
--
-- SUBMISSION TYPES: All are URL submissions (GitHub or Google Drive links)
--
-- PRE-CHECK (read-only): Verify tasks exist
--   SELECT assignment_id, title FROM public.college_assignments 
--   WHERE title IN ('create a candidate hiring page, Apply the css to the candidate hiring page', 
--                   'Task Management Assessment', 
--                   'College / Student Management Project')
--   AND is_deleted = false;

BEGIN;

-- Update learner submissions
UPDATE public.college_learner_assignments cla
SET 
  status = 'submitted',
  submission_type = 'url',
  submission_url = v.url,
  submission_date = v.submit_date,
  completed_date = v.submit_date,
  updated_date = now()
FROM (VALUES
  -- Task 1: 'create a candidate hiring page, Apply the css to the candidate hiring page' (Due: 2026-09-15, Submit: 2026-09-22)
  ('dakshdograg15@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://github.com/DakshDogra25/candidate-hiring-fullstack-app'::text, '2026-09-22 14:00:00+00'::timestamptz),
  ('pradeepgeetha09@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://github.com/pradeepgeetha09-boop/rear-minds-project'::text, '2026-09-22 14:30:00+00'::timestamptz),
  ('chettyleo19@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://github.com/chettyleo19-ctrl/rareminds-project'::text, '2026-09-22 15:00:00+00'::timestamptz),
  ('sanjay299sanju@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://github.com/sanchayk-git/candidate-hiring-system'::text, '2026-09-22 15:30:00+00'::timestamptz),
  ('lavlavanya6360@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://github.com/lavlavanya6360-lgtm/candidate-hiring-system'::text, '2026-09-22 16:00:00+00'::timestamptz),
  ('lavanya13142003@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://drive.google.com/file/d/1ZSPSiIMHY71jPRUX9_h1HpRrTFhM1LiD/view?usp=drive_link'::text, '2026-09-22 16:30:00+00'::timestamptz),
  ('meghanamv347@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://drive.google.com/file/d/1a0tOno7UirZbzY6k8hNysgRT4TF4ek70/view?usp=drive_link'::text, '2026-09-22 17:00:00+00'::timestamptz),
  ('hamsangowda3@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://drive.google.com/file/d/1IRv-UXrBy4F4WXWWTSX84Mmruhjpe9VJ/view?usp=drive_link'::text, '2026-09-22 17:30:00+00'::timestamptz),
  ('akhilapinky1012@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://drive.google.com/file/d/15wkImvi7QDHvyP1ZB238sbzZwIS0Z46l/view?usp=drive_link'::text, '2026-09-22 18:00:00+00'::timestamptz),
  ('bhoomika19503@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://github.com/BhoomikaBhoomi16/candidate-hiring-pipeline'::text, '2026-09-22 14:15:00+00'::timestamptz),
  ('nayanaks1233@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://drive.google.com/file/d/1iAWynnPYyIkgES15nuERGYDP_HeR-0Ke/view?usp=drive_link'::text, '2026-09-22 15:15:00+00'::timestamptz),
  ('abhijith22abhi22@gmail.com'::text, 'create a candidate hiring page, Apply the css to the candidate hiring page'::text, 'https://github.com/Abhijithabz/candidate-hiring-pipeline'::text, '2026-09-22 16:15:00+00'::timestamptz),
  
  -- Task 3: 'College / Student Management Project' (Due: 2026-09-21, Submit: 2026-09-28)
  ('bhoomika19503@gmail.com'::text, 'College / Student Management Project'::text, 'https://github.com/BhoomikaBhoomi16/college-management-system'::text, '2026-09-28 14:00:00+00'::timestamptz),
  ('lavlavanya6360@gmail.com'::text, 'College / Student Management Project'::text, 'https://github.com/lavlavanya6360-lgtm/student-management'::text, '2026-09-28 14:30:00+00'::timestamptz),
  ('lavanya13142003@gmail.com'::text, 'College / Student Management Project'::text, 'https://github.com/lavulavanya1413-rgb/college_student_app_crud'::text, '2026-09-28 15:00:00+00'::timestamptz),
  ('meghanamv347@gmail.com'::text, 'College / Student Management Project'::text, 'https://github.com/meghanamv347-lab/college_management_crud_app'::text, '2026-09-28 15:30:00+00'::timestamptz),
  ('chettyleo19@gmail.com'::text, 'College / Student Management Project'::text, 'https://github.com/chettyleo19-ctrl/React-MCA-Projects'::text, '2026-09-28 16:00:00+00'::timestamptz),
  ('nayanaks1233@gmail.com'::text, 'College / Student Management Project'::text, 'https://github.com/Nayana123-del/college_management_system'::text, '2026-09-28 16:30:00+00'::timestamptz),
  ('hamsangowda3@gmail.com'::text, 'College / Student Management Project'::text, 'https://github.com/hamsangowda3-max/college-management'::text, '2026-09-28 17:00:00+00'::timestamptz),
  ('sanjay299sanju@gmail.com'::text, 'College / Student Management Project'::text, 'https://github.com/sanchayk-git/student-management-system'::text, '2026-09-28 17:30:00+00'::timestamptz),
  ('harshilachu1@gmail.com'::text, 'College / Student Management Project'::text, 'https://github.com/Harshil-MCA/College_management'::text, '2026-09-28 18:00:00+00'::timestamptz),
  ('abhijith22abhi22@gmail.com'::text, 'College / Student Management Project'::text, 'https://github.com/Abhijithabz/College_management'::text, '2026-09-28 14:15:00+00'::timestamptz),
  ('dakshdograg15@gmail.com'::text, 'College / Student Management Project'::text, 'https://github.com/DakshDogra25/studentmanagementsystem'::text, '2026-09-28 15:15:00+00'::timestamptz),
  
  -- Task 2: 'Task Management Assessment' (Due: 2026-09-16, Submit: 2026-09-23)
  ('sanjay299sanju@gmail.com'::text, 'Task Management Assessment'::text, 'https://github.com/sanchayk-git/collaborative-task-manager'::text, '2026-09-23 14:00:00+00'::timestamptz),
  ('harshilachu1@gmail.com'::text, 'Task Management Assessment'::text, 'https://github.com/Harshil-MCA/collaborative-task-manager'::text, '2026-09-23 14:30:00+00'::timestamptz),
  ('pradeepgeetha09@gmail.com'::text, 'Task Management Assessment'::text, 'http://github.com/pradeepgeetha09-boop/pradeep.rearminds'::text, '2026-09-23 15:00:00+00'::timestamptz),
  ('lavlavanya6360@gmail.com'::text, 'Task Management Assessment'::text, 'https://github.com/lavlavanya6360-lgtm/task-manager'::text, '2026-09-23 15:30:00+00'::timestamptz),
  ('lavanya13142003@gmail.com'::text, 'Task Management Assessment'::text, 'https://github.com/lavulavanya1413-rgb/collaborative-task-managerr'::text, '2026-09-23 16:00:00+00'::timestamptz),
  ('hamsangowda3@gmail.com'::text, 'Task Management Assessment'::text, 'https://github.com/hamsangowda3-max/collaborative-task-manager1'::text, '2026-09-23 16:30:00+00'::timestamptz),
  ('nayanaks1233@gmail.com'::text, 'Task Management Assessment'::text, 'https://github.com/Nayana123-del/collaborative_task_manager'::text, '2026-09-23 17:00:00+00'::timestamptz),
  ('meghanamv347@gmail.com'::text, 'Task Management Assessment'::text, 'https://github.com/meghanamv347-lab/collaborative-task-manager'::text, '2026-09-23 17:30:00+00'::timestamptz),
  ('nalinagowda40@gmail.com'::text, 'Task Management Assessment'::text, 'https://github.com/nalinagowda40-crypto/colleborative_task_maneger'::text, '2026-09-23 18:00:00+00'::timestamptz)
) AS v(email, task_title, url, submit_date)
JOIN public.users u ON lower(u.email) = lower(v.email) AND u.role = 'learner' AND u."isActive" = true
JOIN public.college_assignments ca ON ca.title = v.task_title AND ca.is_deleted = false
WHERE cla.learner_id = u.id 
  AND cla.assignment_id = ca.assignment_id
  AND cla.status IN ('todo', 'in-progress');  -- Only update if not already submitted

COMMIT;
