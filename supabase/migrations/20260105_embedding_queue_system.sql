-- ============================================================================
-- EMBEDDING QUEUE SYSTEM
-- Fully backend-driven embedding generation with database triggers
-- ============================================================================

-- 1. Create embedding_queue table if not exists
CREATE TABLE IF NOT EXISTS embedding_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL,
  table_name TEXT NOT NULL CHECK (table_name IN ('students', 'opportunities', 'courses')),
  operation TEXT NOT NULL DEFAULT 'update' CHECK (operation IN ('insert', 'update', 'regenerate')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  CONSTRAINT embedding_queue_record_status_unique UNIQUE(record_id, table_name, status)
);

-- 2. Create indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_embedding_queue_status ON embedding_queue(status);
CREATE INDEX IF NOT EXISTS idx_embedding_queue_pending ON embedding_queue(status, priority, created_at ASC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_embedding_queue_record ON embedding_queue(record_id, table_name);

-- 3. Function to queue embedding generation (with deduplication)
CREATE OR REPLACE FUNCTION queue_embedding_generation(
  p_record_id UUID,
  p_table_name TEXT,
  p_operation TEXT DEFAULT 'update',
  p_priority TEXT DEFAULT 'normal'
) RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
  v_priority_order INTEGER;
BEGIN
  -- Map priority to numeric for comparison
  v_priority_order := CASE p_priority 
    WHEN 'high' THEN 3 
    WHEN 'normal' THEN 2 
    WHEN 'low' THEN 1 
    ELSE 2 
  END;

  -- Check if there's already a pending item for this record
  SELECT id INTO v_queue_id
  FROM embedding_queue
  WHERE record_id = p_record_id
    AND table_name = p_table_name
    AND status = 'pending';
  
  IF v_queue_id IS NOT NULL THEN
    -- Update priority if higher
    UPDATE embedding_queue
    SET priority = CASE 
          WHEN (CASE priority WHEN 'high' THEN 3 WHEN 'normal' THEN 2 ELSE 1 END) < v_priority_order 
          THEN p_priority 
          ELSE priority 
        END,
        operation = p_operation
    WHERE id = v_queue_id;
    RETURN v_queue_id;
  END IF;
  
  -- Insert new queue item
  INSERT INTO embedding_queue (record_id, table_name, operation, priority, status)
  VALUES (p_record_id, p_table_name, p_operation, p_priority, 'pending')
  ON CONFLICT (record_id, table_name, status) DO UPDATE
  SET priority = CASE 
        WHEN (CASE embedding_queue.priority WHEN 'high' THEN 3 WHEN 'normal' THEN 2 ELSE 1 END) < v_priority_order 
        THEN EXCLUDED.priority 
        ELSE embedding_queue.priority 
      END,
      operation = EXCLUDED.operation
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger function for students table
CREATE OR REPLACE FUNCTION trigger_student_embedding_queue()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM queue_embedding_generation(
    NEW.id,
    'students',
    CASE WHEN TG_OP = 'INSERT' THEN 'insert' ELSE 'update' END,
    CASE WHEN TG_OP = 'INSERT' THEN 'high' ELSE 'normal' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger function for opportunities table
CREATE OR REPLACE FUNCTION trigger_opportunity_embedding_queue()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM queue_embedding_generation(
    NEW.id,
    'opportunities',
    CASE WHEN TG_OP = 'INSERT' THEN 'insert' ELSE 'update' END,
    'high'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger function for courses table
CREATE OR REPLACE FUNCTION trigger_course_embedding_queue()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM queue_embedding_generation(
    NEW.id,
    'courses',
    CASE WHEN TG_OP = 'INSERT' THEN 'insert' ELSE 'update' END,
    CASE WHEN TG_OP = 'INSERT' THEN 'high' ELSE 'normal' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_student_embedding_queue ON students;
DROP TRIGGER IF EXISTS trg_opportunity_embedding_queue ON opportunities;
DROP TRIGGER IF EXISTS trg_course_embedding_queue ON courses;

-- 8. Create triggers on tables
CREATE TRIGGER trg_student_embedding_queue
  AFTER INSERT OR UPDATE OF name, email, bio, skill_summary, branch_field, course_name, university, hobbies, interests
  ON students
  FOR EACH ROW
  EXECUTE FUNCTION trigger_student_embedding_queue();

CREATE TRIGGER trg_opportunity_embedding_queue
  AFTER INSERT OR UPDATE OF job_title, title, description, company_name, department, employment_type, experience_level, location, skills_required, requirements, responsibilities
  ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION trigger_opportunity_embedding_queue();

-- Only create course trigger if courses table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    CREATE TRIGGER trg_course_embedding_queue
      AFTER INSERT OR UPDATE OF title, description, category, level, skills_taught
      ON courses
      FOR EACH ROW
      EXECUTE FUNCTION trigger_course_embedding_queue();
  END IF;
END $$;


-- 9. Trigger for related tables (skills, experience, certificates, etc.)
CREATE OR REPLACE FUNCTION trigger_related_student_embedding()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_student_id := OLD.student_id;
  ELSE
    v_student_id := NEW.student_id;
  END IF;
  
  IF v_student_id IS NOT NULL THEN
    PERFORM queue_embedding_generation(v_student_id, 'students', 'update', 'normal');
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing related triggers
DROP TRIGGER IF EXISTS trg_skills_embedding ON skills;
DROP TRIGGER IF EXISTS trg_experience_embedding ON experience;
DROP TRIGGER IF EXISTS trg_certificates_embedding ON certificates;
DROP TRIGGER IF EXISTS trg_projects_embedding ON projects;
DROP TRIGGER IF EXISTS trg_trainings_embedding ON trainings;

-- Create triggers on related tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'skills') THEN
    CREATE TRIGGER trg_skills_embedding
      AFTER INSERT OR UPDATE OR DELETE ON skills
      FOR EACH ROW EXECUTE FUNCTION trigger_related_student_embedding();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'experience') THEN
    CREATE TRIGGER trg_experience_embedding
      AFTER INSERT OR UPDATE OR DELETE ON experience
      FOR EACH ROW EXECUTE FUNCTION trigger_related_student_embedding();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
    CREATE TRIGGER trg_certificates_embedding
      AFTER INSERT OR UPDATE OR DELETE ON certificates
      FOR EACH ROW EXECUTE FUNCTION trigger_related_student_embedding();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    CREATE TRIGGER trg_projects_embedding
      AFTER INSERT OR UPDATE OR DELETE ON projects
      FOR EACH ROW EXECUTE FUNCTION trigger_related_student_embedding();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainings') THEN
    CREATE TRIGGER trg_trainings_embedding
      AFTER INSERT OR UPDATE OR DELETE ON trainings
      FOR EACH ROW EXECUTE FUNCTION trigger_related_student_embedding();
  END IF;
END $$;

-- 10. Trigger for course enrollments (when student completes a course)
CREATE OR REPLACE FUNCTION trigger_enrollment_completion_embedding()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.progress >= 100 OR NEW.status = 'completed') AND 
     (OLD.progress < 100 AND OLD.status != 'completed') THEN
    PERFORM queue_embedding_generation(NEW.student_id, 'students', 'update', 'high');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enrollment_completion_embedding ON course_enrollments;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_enrollments') THEN
    CREATE TRIGGER trg_enrollment_completion_embedding
      AFTER UPDATE OF progress, status ON course_enrollments
      FOR EACH ROW EXECUTE FUNCTION trigger_enrollment_completion_embedding();
  END IF;
END $$;

-- 11. Function to get queue batch for processing
CREATE OR REPLACE FUNCTION get_embedding_queue_batch(batch_size INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  record_id UUID,
  table_name TEXT,
  operation TEXT,
  priority TEXT,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eq.id,
    eq.record_id,
    eq.table_name,
    eq.operation,
    eq.priority,
    eq.retry_count
  FROM embedding_queue eq
  WHERE eq.status = 'pending'
    AND (eq.next_retry_at IS NULL OR eq.next_retry_at <= NOW())
  ORDER BY 
    CASE eq.priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
    eq.created_at ASC
  LIMIT batch_size
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- 12. Function to get queue statistics
CREATE OR REPLACE FUNCTION get_embedding_queue_stats()
RETURNS TABLE (
  status TEXT,
  count BIGINT,
  oldest TIMESTAMPTZ,
  newest TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eq.status,
    COUNT(*)::BIGINT,
    MIN(eq.created_at),
    MAX(eq.created_at)
  FROM embedding_queue eq
  GROUP BY eq.status;
END;
$$ LANGUAGE plpgsql;

-- 13. Function to clean up old completed/failed items
CREATE OR REPLACE FUNCTION cleanup_embedding_queue(days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM embedding_queue
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 14. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON embedding_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON embedding_queue TO service_role;
GRANT EXECUTE ON FUNCTION queue_embedding_generation TO authenticated;
GRANT EXECUTE ON FUNCTION queue_embedding_generation TO service_role;
GRANT EXECUTE ON FUNCTION get_embedding_queue_batch TO service_role;
GRANT EXECUTE ON FUNCTION get_embedding_queue_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_embedding_queue TO service_role;

-- 15. Add comment
COMMENT ON TABLE embedding_queue IS 'Queue for async embedding generation. Processed by Cloudflare Worker cron job every 5 minutes.';
