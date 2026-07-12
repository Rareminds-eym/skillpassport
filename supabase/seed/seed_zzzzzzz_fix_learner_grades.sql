-- Fix learner grades for opportunity display
-- Set grade='UG' for principal.hit and ramya03 learners so opportunities show on dashboard

UPDATE public.learners
SET grade = 'UG'
WHERE email IN (
  'principal.hit@harshainstitute.edu.in',
  'ramya03@acharya.ac.in'
);
