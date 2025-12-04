-- Auto-generate certificates when internal courses are completed
-- This ensures students get certificates automatically when they finish platform courses

-- Function to generate certificate when course is marked as completed
CREATE OR REPLACE FUNCTION generate_course_certificate()
RETURNS TRIGGER AS $$
DECLARE
  course_title TEXT;
  course_org TEXT;
  student_uuid UUID;
BEGIN
  -- Only generate certificate if:
  -- 1. Status changed to 'completed'
  -- 2. Source is 'internal_course'
  -- 3. Certificate doesn't already exist
  IF NEW.status = 'completed' 
     AND NEW.source = 'internal_course' 
     AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Check if certificate already exists
    IF NOT EXISTS (
      SELECT 1 FROM certificates 
      WHERE training_id = NEW.id
    ) THEN
      
      -- Get course details
      course_title := NEW.title;
      course_org := COALESCE(NEW.organization, 'Internal Platform');
      student_uuid := NEW.student_id;
      
      -- Generate certificate
      INSERT INTO certificates (
        student_id,
        training_id,
        title,
        issuer,
        level,
        issued_on,
        description,
        approval_status,
        enabled,
        status
      ) VALUES (
        student_uuid,
        NEW.id,
        course_title || ' - Certificate of Completion',
        course_org,
        'Intermediate', -- Default level, can be customized
        CURRENT_DATE,
        'Successfully completed ' || course_title || ' course',
        'approved',
        true,
        'active'
      );
      
      RAISE NOTICE 'Certificate generated for training_id: %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on trainings table
DROP TRIGGER IF EXISTS trigger_generate_course_certificate ON trainings;

CREATE TRIGGER trigger_generate_course_certificate
  AFTER INSERT OR UPDATE OF status
  ON trainings
  FOR EACH ROW
  EXECUTE FUNCTION generate_course_certificate();

-- Backfill: Generate certificates for already completed internal courses
INSERT INTO certificates (
  student_id,
  training_id,
  title,
  issuer,
  level,
  issued_on,
  description,
  approval_status,
  enabled,
  status
)
SELECT 
  t.student_id,
  t.id,
  t.title || ' - Certificate of Completion',
  COALESCE(t.organization, 'Internal Platform'),
  'Intermediate',
  COALESCE(t.end_date, CURRENT_DATE),
  'Successfully completed ' || t.title || ' course',
  'approved',
  true,
  'active'
FROM trainings t
WHERE t.status = 'completed'
  AND t.source = 'internal_course'
  AND NOT EXISTS (
    SELECT 1 FROM certificates c
    WHERE c.training_id = t.id
  );

-- Verify the setup
SELECT 
  'Completed Internal Courses' as type,
  COUNT(*) as count
FROM trainings
WHERE status = 'completed' AND source = 'internal_course'
UNION ALL
SELECT 
  'Certificates for Internal Courses' as type,
  COUNT(*) as count
FROM certificates c
JOIN trainings t ON c.training_id = t.id
WHERE t.source = 'internal_course';
