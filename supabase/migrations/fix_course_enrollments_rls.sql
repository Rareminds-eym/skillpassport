-- Drop existing policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Students can create own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Students can update own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Educators can view course enrollments" ON course_enrollments;

-- Create new RLS policies with correct authentication checks

-- Students can view their own enrollments (check by email OR user id)
CREATE POLICY "Students can view own enrollments"
  ON course_enrollments
  FOR SELECT
  USING (
    student_email = (auth.jwt()->>'email') OR
    student_id::text = (auth.jwt()->>'sub')
  );

-- Students can insert their own enrollments (check by email OR user id)
CREATE POLICY "Students can create own enrollments"
  ON course_enrollments
  FOR INSERT
  WITH CHECK (
    student_email = (auth.jwt()->>'email') OR
    student_id::text = (auth.jwt()->>'sub')
  );

-- Students can update their own enrollments (check by email OR user id)
CREATE POLICY "Students can update own enrollments"
  ON course_enrollments
  FOR UPDATE
  USING (
    student_email = (auth.jwt()->>'email') OR
    student_id::text = (auth.jwt()->>'sub')
  );

-- Educators can view enrollments for their courses (check by educator_id)
CREATE POLICY "Educators can view course enrollments"
  ON course_enrollments
  FOR SELECT
  USING (
    educator_id::text = (auth.jwt()->>'sub')
  );
