-- Add student_course column to adaptive_aptitude_sessions table
-- This allows storing the student's course/program for college students
-- to generate course-specific adaptive aptitude questions

ALTER TABLE public.adaptive_aptitude_sessions
ADD COLUMN IF NOT EXISTS student_course TEXT;

COMMENT ON COLUMN public.adaptive_aptitude_sessions.student_course IS 'Student''s course/program (e.g., B.COM, B.Tech CSE) for college students - used to contextualize adaptive questions';
