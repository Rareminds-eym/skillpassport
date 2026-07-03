-- ============================================================
-- School Admin Academic Status & Retention — test data
-- Org: fb866d79-19d9-4e31-ba19-38a5f1199423 ("GEE", school_id)
-- ============================================================

-- 1. Add 3 more test learners to the school (existing learner
--    e87de0db-0066-43d9-8549-ded2b5ba1ae8 / jjss@gmail.com stays as-is)
INSERT INTO learners (id, email, name, school_id)
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'test.active@example.com', 'Test Active Learner', 'fb866d79-19d9-4e31-ba19-38a5f1199423'),
  ('a1000000-0000-4000-8000-000000000002', 'test.notstarted@example.com', 'Test Not Started Learner', 'fb866d79-19d9-4e31-ba19-38a5f1199423'),
  ('a1000000-0000-4000-8000-000000000003', 'test.inactive@example.com', 'Test Inactive Learner', 'fb866d79-19d9-4e31-ba19-38a5f1199423');

-- 2. Enrollments covering all 4 Academic Status buckets, across 2 distinct
--    courses (so the course dropdown has more than one real option):
--      Course A = c09198f1-a8cb-4396-a4e6-3f28e804bf69 ("Academic Record Activation Intake & Readiness Checklist")
--      Course B = 7c721df8-dab6-40f2-9414-c1ab3f8d27a0 ("Academic Record Activation Exception Diagnosis, Routing & Escalation Log")

-- Existing learner -> Completed Curriculum (Course A)
INSERT INTO course_enrollments (learner_id, learner_email, course_id, status, progress, last_accessed, created_at)
VALUES ('e87de0db-0066-43d9-8549-ded2b5ba1ae8', 'jjss@gmail.com', 'c09198f1-a8cb-4396-a4e6-3f28e804bf69', 'completed', 100, now(), now())
ON CONFLICT (learner_id, course_id) DO UPDATE
  SET status = EXCLUDED.status, progress = EXCLUDED.progress, last_accessed = EXCLUDED.last_accessed;

-- Test Active Learner -> Actively Learning (Course A): in_progress, real progress, accessed recently
INSERT INTO course_enrollments (learner_id, learner_email, course_id, status, progress, last_accessed, created_at)
VALUES ('a1000000-0000-4000-8000-000000000001', 'test.active@example.com', 'c09198f1-a8cb-4396-a4e6-3f28e804bf69', 'in_progress', 45, now(), now())
ON CONFLICT (learner_id, course_id) DO UPDATE
  SET status = EXCLUDED.status, progress = EXCLUDED.progress, last_accessed = EXCLUDED.last_accessed;

-- Test Not Started Learner -> Registered / Not Started (Course A): progress = 0, accessed recently
INSERT INTO course_enrollments (learner_id, learner_email, course_id, status, progress, last_accessed, created_at)
VALUES ('a1000000-0000-4000-8000-000000000002', 'test.notstarted@example.com', 'c09198f1-a8cb-4396-a4e6-3f28e804bf69', 'active', 0, now(), now())
ON CONFLICT (learner_id, course_id) DO UPDATE
  SET status = EXCLUDED.status, progress = EXCLUDED.progress, last_accessed = EXCLUDED.last_accessed;

-- Test Inactive Learner -> Inactive / At Risk (Course A): last_accessed 40 days ago (>30-day threshold)
INSERT INTO course_enrollments (learner_id, learner_email, course_id, status, progress, last_accessed, created_at)
VALUES ('a1000000-0000-4000-8000-000000000003', 'test.inactive@example.com', 'c09198f1-a8cb-4396-a4e6-3f28e804bf69', 'in_progress', 60, now() - interval '40 days', now() - interval '40 days')
ON CONFLICT (learner_id, course_id) DO UPDATE
  SET status = EXCLUDED.status, progress = EXCLUDED.progress, last_accessed = EXCLUDED.last_accessed;

-- Also enroll the Active learner in Course B, so the dropdown shows a
-- second real course and switching it changes the donut.
INSERT INTO course_enrollments (learner_id, learner_email, course_id, status, progress, last_accessed, created_at)
VALUES ('a1000000-0000-4000-8000-000000000001', 'test.active@example.com', '7c721df8-dab6-40f2-9414-c1ab3f8d27a0', 'completed', 100, now(), now())
ON CONFLICT (learner_id, course_id) DO UPDATE
  SET status = EXCLUDED.status, progress = EXCLUDED.progress, last_accessed = EXCLUDED.last_accessed;

-- 3. Verify
SELECT ce.learner_email, c.title AS course, ce.status, ce.progress, ce.last_accessed
FROM course_enrollments ce
JOIN courses c ON c.course_id = ce.course_id
JOIN learners l ON l.id = ce.learner_id
WHERE l.school_id = 'fb866d79-19d9-4e31-ba19-38a5f1199423'
ORDER BY course, ce.learner_email;
