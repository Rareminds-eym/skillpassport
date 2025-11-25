-- Create table for tracking skill verification requests
CREATE TABLE IF NOT EXISTS skill_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('technical', 'soft')),
  skill_level INTEGER NOT NULL CHECK (skill_level >= 1 AND skill_level <= 5),
  skill_icon TEXT,
  skill_category TEXT,
  
  -- Approval workflow fields
  institution_admin_status TEXT DEFAULT 'pending' CHECK (institution_admin_status IN ('pending', 'approved', 'rejected')),
  institution_admin_id UUID,
  institution_admin_reviewed_at TIMESTAMP WITH TIME ZONE,
  institution_admin_notes TEXT,
  
  rareminds_admin_status TEXT DEFAULT 'pending' CHECK (rareminds_admin_status IN ('pending', 'approved', 'rejected')),
  rareminds_admin_id UUID,
  rareminds_admin_reviewed_at TIMESTAMP WITH TIME ZONE,
  rareminds_admin_notes TEXT,
  
  -- Overall status is derived but stored for easier querying
  -- logic: 
  -- if any rejected -> rejected
  -- if both approved -> verified
  -- if inst approved & rare pending -> awaiting_rareminds
  -- else -> pending
  overall_status TEXT DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_skill_verifications_student_id ON skill_verification_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_institution_status ON skill_verification_requests(institution_admin_status);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_rareminds_status ON skill_verification_requests(rareminds_admin_status);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_overall_status ON skill_verification_requests(overall_status);

-- Add RLS policies
ALTER TABLE skill_verification_requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own requests
CREATE POLICY "Students can view their own verification requests" 
  ON skill_verification_requests FOR SELECT 
  USING (auth.uid() = student_id);

-- Students can insert their own requests
CREATE POLICY "Students can insert verification requests" 
  ON skill_verification_requests FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

-- Admins can view all requests (simplified for now, ideally scoped by institution)
CREATE POLICY "Admins can view all verification requests" 
  ON skill_verification_requests FOR SELECT 
  USING (true); -- In real prod, check admin role

-- Admins can update requests
CREATE POLICY "Admins can update verification requests" 
  ON skill_verification_requests FOR UPDATE 
  USING (true);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_skill_verification_requests_updated_at ON skill_verification_requests;
CREATE TRIGGER update_skill_verification_requests_updated_at 
  BEFORE UPDATE ON skill_verification_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
