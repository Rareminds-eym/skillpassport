-- Database Performance Optimization Indexes
-- Run these in your Supabase SQL editor to improve query performance

-- Index for certificates queries (student_id + enabled + approval_status)
CREATE INDEX IF NOT EXISTS idx_certificates_student_lookup 
ON certificates(student_id, enabled, approval_status) 
WHERE enabled = true AND approval_status IN ('approved', 'verified');

-- Index for projects queries (student_id + enabled + approval_status)
CREATE INDEX IF NOT EXISTS idx_projects_student_lookup 
ON projects(student_id, enabled, approval_status) 
WHERE enabled = true AND approval_status IN ('approved', 'verified');

-- Index for skills queries (student_id + enabled)
CREATE INDEX IF NOT EXISTS idx_skills_student_lookup 
ON skills(student_id, enabled) 
WHERE enabled = true;

-- Index for experience queries (student_id)
CREATE INDEX IF NOT EXISTS idx_experience_student 
ON experience(student_id);

-- Index for trainings queries (student_id)
CREATE INDEX IF NOT EXISTS idx_trainings_student 
ON trainings(student_id);

-- Index for student_assignments queries (student_id + is_deleted)
CREATE INDEX IF NOT EXISTS idx_student_assignments_lookup 
ON student_assignments(student_id, is_deleted) 
WHERE is_deleted = false;

-- Composite index for certificates ordering
CREATE INDEX IF NOT EXISTS idx_certificates_issued_on 
ON certificates(student_id, issued_on DESC) 
WHERE enabled = true;

-- Composite index for projects ordering
CREATE INDEX IF NOT EXISTS idx_projects_created_at 
ON projects(student_id, created_at DESC) 
WHERE enabled = true;

-- Index on students.user_id for faster joins (if not already existing)
CREATE INDEX IF NOT EXISTS idx_students_user_id 
ON students(user_id) 
WHERE user_id IS NOT NULL;

-- ANALYZE tables to update query planner statistics
ANALYZE certificates;
ANALYZE projects;
ANALYZE skills;
ANALYZE experience;
ANALYZE trainings;
ANALYZE students;
ANALYZE student_assignments;
