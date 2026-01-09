-- =====================================================
-- CLASS SWAP REQUEST FEATURE - DATABASE SCHEMA
-- =====================================================
-- This migration creates the complete database structure
-- for the Class Swap Request feature
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: class_swap_requests
-- =====================================================
-- Stores all class swap requests between educators
-- =====================================================

CREATE TABLE IF NOT EXISTS class_swap_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Requester Information
  requester_faculty_id UUID NOT NULL,
  requester_slot_id UUID NOT NULL,
  
  -- Target Information
  target_faculty_id UUID NOT NULL,
  target_slot_id UUID NOT NULL,
  
  -- Request Details
  reason TEXT NOT NULL,
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('one_time', 'permanent')),
  swap_date DATE, -- For one_time swaps, which specific date
  
  -- Status & Approval
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  target_response TEXT, -- Target faculty's response message
  target_responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin Approval (if required by institution policy)
  requires_admin_approval BOOLEAN DEFAULT true,
  admin_approval_status VARCHAR(20) 
    CHECK (admin_approval_status IN ('pending', 'approved', 'rejected')),
  admin_id UUID,
  admin_response TEXT,
  admin_responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT different_faculty CHECK (requester_faculty_id != target_faculty_id),
  CONSTRAINT different_slots CHECK (requester_slot_id != target_slot_id),
  CONSTRAINT swap_date_required_for_one_time CHECK (
    (request_type = 'permanent' AND swap_date IS NULL) OR
    (request_type = 'one_time' AND swap_date IS NOT NULL)
  )
);

-- =====================================================
-- INDEXES for performance optimization
-- =====================================================

CREATE INDEX idx_swap_requests_requester ON class_swap_requests(requester_faculty_id, status);
CREATE INDEX idx_swap_requests_target ON class_swap_requests(target_faculty_id, status);
CREATE INDEX idx_swap_requests_status ON class_swap_requests(status);
CREATE INDEX idx_swap_requests_date ON class_swap_requests(swap_date) WHERE swap_date IS NOT NULL;
CREATE INDEX idx_swap_requests_created_at ON class_swap_requests(created_at DESC);

-- =====================================================
-- TABLE: class_swap_history
-- =====================================================
-- Audit trail for all swap request actions
-- =====================================================

CREATE TABLE IF NOT EXISTS class_swap_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swap_request_id UUID NOT NULL REFERENCES class_swap_requests(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'accepted', 'rejected', 'cancelled', 'admin_approved', 'admin_rejected', 'completed'
  actor_id UUID NOT NULL,
  actor_role VARCHAR(20) NOT NULL, -- 'requester', 'target', 'admin'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_swap_history_request ON class_swap_history(swap_request_id);
CREATE INDEX idx_swap_history_created_at ON class_swap_history(created_at DESC);

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_swap_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_swap_request_timestamp
  BEFORE UPDATE ON class_swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_swap_request_timestamp();

-- =====================================================
-- TRIGGER: Auto-create history entry
-- =====================================================

CREATE OR REPLACE FUNCTION create_swap_history_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT, create 'created' history entry
  IF TG_OP = 'INSERT' THEN
    INSERT INTO class_swap_history (swap_request_id, action, actor_id, actor_role, notes)
    VALUES (NEW.id, 'created', NEW.requester_faculty_id, 'requester', NEW.reason);
    RETURN NEW;
  END IF;
  
  -- On UPDATE, detect what changed and create appropriate history entry
  IF TG_OP = 'UPDATE' THEN
    -- Status changed to accepted
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
      INSERT INTO class_swap_history (swap_request_id, action, actor_id, actor_role, notes)
      VALUES (NEW.id, 'accepted', NEW.target_faculty_id, 'target', NEW.target_response);
    END IF;
    
    -- Status changed to rejected
    IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
      INSERT INTO class_swap_history (swap_request_id, action, actor_id, actor_role, notes)
      VALUES (NEW.id, 'rejected', NEW.target_faculty_id, 'target', NEW.target_response);
    END IF;
    
    -- Status changed to cancelled
    IF NEW.status = 'cancelled' THEN
      INSERT INTO class_swap_history (swap_request_id, action, actor_id, actor_role, notes)
      VALUES (NEW.id, 'cancelled', NEW.requester_faculty_id, 'requester', 'Request cancelled by requester');
    END IF;
    
    -- Admin approval status changed
    IF OLD.admin_approval_status IS DISTINCT FROM NEW.admin_approval_status THEN
      IF NEW.admin_approval_status = 'approved' THEN
        INSERT INTO class_swap_history (swap_request_id, action, actor_id, actor_role, notes)
        VALUES (NEW.id, 'admin_approved', NEW.admin_id, 'admin', NEW.admin_response);
      ELSIF NEW.admin_approval_status = 'rejected' THEN
        INSERT INTO class_swap_history (swap_request_id, action, actor_id, actor_role, notes)
        VALUES (NEW.id, 'admin_rejected', NEW.admin_id, 'admin', NEW.admin_response);
      END IF;
    END IF;
    
    -- Status changed to completed
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      INSERT INTO class_swap_history (swap_request_id, action, actor_id, actor_role, notes)
      VALUES (NEW.id, 'completed', COALESCE(NEW.admin_id, NEW.requester_faculty_id), 'admin', 'Swap completed successfully');
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_swap_history
  AFTER INSERT OR UPDATE ON class_swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_swap_history_entry();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE class_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_swap_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: class_swap_requests
-- =====================================================

-- Faculty can view their own requests (as requester or target)
CREATE POLICY "Faculty can view own swap requests" ON class_swap_requests
  FOR SELECT USING (
    requester_faculty_id IN (
      SELECT id FROM school_educators WHERE user_id = auth.uid()
      UNION
      SELECT id FROM college_lecturers WHERE user_id = auth.uid()
    )
    OR target_faculty_id IN (
      SELECT id FROM school_educators WHERE user_id = auth.uid()
      UNION
      SELECT id FROM college_lecturers WHERE user_id = auth.uid()
    )
  );

-- Faculty can create swap requests
CREATE POLICY "Faculty can create swap requests" ON class_swap_requests
  FOR INSERT WITH CHECK (
    requester_faculty_id IN (
      SELECT id FROM school_educators WHERE user_id = auth.uid()
      UNION
      SELECT id FROM college_lecturers WHERE user_id = auth.uid()
    )
  );

-- Faculty can update their own requests (cancel) or respond to requests targeting them
CREATE POLICY "Faculty can update swap requests" ON class_swap_requests
  FOR UPDATE USING (
    requester_faculty_id IN (
      SELECT id FROM school_educators WHERE user_id = auth.uid()
      UNION
      SELECT id FROM college_lecturers WHERE user_id = auth.uid()
    )
    OR target_faculty_id IN (
      SELECT id FROM school_educators WHERE user_id = auth.uid()
      UNION
      SELECT id FROM college_lecturers WHERE user_id = auth.uid()
    )
  );

-- Admins can view and manage all requests
CREATE POLICY "Admins can manage all swap requests" ON class_swap_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'school_admin', 'college_admin')
    )
  );

-- =====================================================
-- RLS POLICIES: class_swap_history
-- =====================================================

-- Faculty can view history of their own requests
CREATE POLICY "Faculty can view own swap history" ON class_swap_history
  FOR SELECT USING (
    swap_request_id IN (
      SELECT id FROM class_swap_requests
      WHERE requester_faculty_id IN (
        SELECT id FROM school_educators WHERE user_id = auth.uid()
        UNION
        SELECT id FROM college_lecturers WHERE user_id = auth.uid()
      )
      OR target_faculty_id IN (
        SELECT id FROM school_educators WHERE user_id = auth.uid()
        UNION
        SELECT id FROM college_lecturers WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all history
CREATE POLICY "Admins can view all swap history" ON class_swap_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'rm_admin', 'school_admin', 'college_admin', 'university_admin')
    )
  );

-- Allow system (triggers) to insert history entries automatically
CREATE POLICY "Allow system to insert history entries" ON class_swap_history
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check for scheduling conflicts
CREATE OR REPLACE FUNCTION check_swap_conflicts(
  p_requester_slot_id UUID,
  p_target_slot_id UUID,
  p_swap_date DATE DEFAULT NULL
)
RETURNS TABLE(
  has_conflict BOOLEAN,
  conflict_reason TEXT
) AS $$
DECLARE
  v_requester_slot RECORD;
  v_target_slot RECORD;
BEGIN
  -- Get slot details (works for both school and college timetables)
  SELECT * INTO v_requester_slot FROM timetable_slots WHERE id = p_requester_slot_id
  UNION ALL
  SELECT * FROM college_timetable_slots WHERE id = p_requester_slot_id
  LIMIT 1;
  
  SELECT * INTO v_target_slot FROM timetable_slots WHERE id = p_target_slot_id
  UNION ALL
  SELECT * FROM college_timetable_slots WHERE id = p_target_slot_id
  LIMIT 1;
  
  -- Check if slots exist
  IF v_requester_slot IS NULL OR v_target_slot IS NULL THEN
    RETURN QUERY SELECT true, 'One or both slots not found';
    RETURN;
  END IF;
  
  -- Check if slots are from the same timetable
  IF v_requester_slot.timetable_id != v_target_slot.timetable_id THEN
    RETURN QUERY SELECT true, 'Slots must be from the same timetable';
    RETURN;
  END IF;
  
  -- Check if time slots overlap (for permanent swaps)
  IF p_swap_date IS NULL THEN
    IF v_requester_slot.day_of_week = v_target_slot.day_of_week AND
       v_requester_slot.period_number = v_target_slot.period_number THEN
      RETURN QUERY SELECT true, 'Cannot swap slots at the same time';
      RETURN;
    END IF;
  END IF;
  
  -- No conflicts found
  RETURN QUERY SELECT false, 'No conflicts detected'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending swap requests count for a faculty
CREATE OR REPLACE FUNCTION get_pending_swap_count(p_faculty_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM class_swap_requests
    WHERE target_faculty_id = p_faculty_id
    AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS for documentation
-- =====================================================

COMMENT ON TABLE class_swap_requests IS 'Stores class swap requests between educators';
COMMENT ON TABLE class_swap_history IS 'Audit trail for all swap request actions';
COMMENT ON FUNCTION check_swap_conflicts IS 'Validates swap requests for scheduling conflicts';
COMMENT ON FUNCTION get_pending_swap_count IS 'Returns count of pending swap requests for a faculty member';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
