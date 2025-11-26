-- Create course_enrollments table to track student enrollments and progress
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  student_name TEXT,
  student_email TEXT NOT NULL,
  course_id UUID NOT NULL,
  course_title TEXT,
  educator_id UUID,
  educator_name TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  completed_lessons TEXT[] DEFAULT '{}',
  total_lessons INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, completed, dropped
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_educator ON course_enrollments(educator_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);

-- Create function to increment course enrollment count
CREATE OR REPLACE FUNCTION increment_course_enrollment(course_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE courses
  SET enrollment_count = COALESCE(enrollment_count, 0) + 1
  WHERE course_id = course_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_course_enrollments_updated_at
  BEFORE UPDATE ON course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON course_enrollments
  FOR SELECT
  USING (
    student_email = auth.jwt()->>'email'
  );

-- Students can insert their own enrollments
CREATE POLICY "Students can create own enrollments"
  ON course_enrollments
  FOR INSERT
  WITH CHECK (
    student_email = auth.jwt()->>'email'
  );

-- Students can update their own enrollments
CREATE POLICY "Students can update own enrollments"
  ON course_enrollments
  FOR UPDATE
  USING (
    student_email = auth.jwt()->>'email'
  );

-- Educators can view enrollments for their courses
CREATE POLICY "Educators can view course enrollments"
  ON course_enrollments
  FOR SELECT
  USING (
    educator_id::text = (auth.jwt()->>'sub')
  );

-- Allow authenticated users to call the increment function
GRANT EXECUTE ON FUNCTION increment_course_enrollment(UUID) TO authenticated;
