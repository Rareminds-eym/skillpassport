-- ===================================================================
-- OPPORTUNITY NOTIFICATIONS SETUP
-- Automatically notify students when new opportunities are posted
-- Compatible with table structure:
--   - id: serial (primary key)
--   - title: text
--   - company_name: text
--   - is_active: boolean (default true)
--   - created_at, updated_at: timestamptz
-- ===================================================================

-- Step 1: Create function to notify students about new opportunities
CREATE OR REPLACE FUNCTION notify_students_new_opportunity()
RETURNS TRIGGER AS $$
DECLARE
  v_student_record RECORD;
  v_opportunity_title text;
  v_company_name text;
  v_employment_type text;
  v_message text;
BEGIN
  -- Get opportunity details from NEW record
  v_opportunity_title := COALESCE(NEW.title, 'Untitled Opportunity');
  v_company_name := COALESCE(NEW.company_name, 'Company');
  v_employment_type := COALESCE(NEW.employment_type, 'Position');

  -- Build notification message
  v_message := 'New ' || v_employment_type || ' opportunity: ' || v_opportunity_title || ' at ' || v_company_name;

  -- Loop through all students and add a recent update for each
  FOR v_student_record IN 
    SELECT id FROM public.students WHERE id IS NOT NULL
  LOOP
    -- Add recent update for this student
    PERFORM add_recent_update(
      v_student_record.id,
      v_message,
      'new_opportunity'
    );
  END LOOP;

  -- Log the notification
  RAISE NOTICE 'Notified all students about new opportunity: %', v_opportunity_title;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Error notifying students about opportunity: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger for new opportunities
DROP TRIGGER IF EXISTS trigger_new_opportunity_notification ON opportunities;
CREATE TRIGGER trigger_new_opportunity_notification
  AFTER INSERT ON public.opportunities
  FOR EACH ROW
  WHEN (NEW.is_active IS TRUE)
  EXECUTE FUNCTION notify_students_new_opportunity();

-- Step 3: Create function for opportunity updates (reactivation)
CREATE OR REPLACE FUNCTION notify_students_opportunity_update()
RETURNS TRIGGER AS $$
DECLARE
  v_student_record RECORD;
  v_opportunity_title text;
  v_company_name text;
  v_message text;
BEGIN
  -- Only notify if opportunity status changed from inactive to active
  IF (OLD.is_active IS FALSE OR OLD.is_active IS NULL) AND NEW.is_active IS TRUE THEN
    v_opportunity_title := COALESCE(NEW.title, 'Opportunity');
    v_company_name := COALESCE(NEW.company_name, 'Company');
    v_message := 'Opportunity reopened: ' || v_opportunity_title || ' at ' || v_company_name;

    -- Loop through all students
    FOR v_student_record IN 
      SELECT id FROM public.students WHERE id IS NOT NULL
    LOOP
      PERFORM add_recent_update(
        v_student_record.id,
        v_message,
        'opportunity_update'
      );
    END LOOP;

    RAISE NOTICE 'Notified all students about reopened opportunity: %', v_opportunity_title;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error notifying students about opportunity update: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger for opportunity updates
DROP TRIGGER IF EXISTS trigger_opportunity_update_notification ON opportunities;
CREATE TRIGGER trigger_opportunity_update_notification
  AFTER UPDATE ON public.opportunities
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION notify_students_opportunity_update();

-- Step 5: Verify installation
SELECT 
  '✅ Trigger installed: ' || trigger_name as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'opportunities'
AND trigger_name LIKE '%notification%'
ORDER BY trigger_name;

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Opportunity notification triggers installed successfully!';
  RAISE NOTICE '📢 Students will now receive updates when:';
  RAISE NOTICE '   - New opportunities are posted';
  RAISE NOTICE '   - Opportunities are reopened';
END $$;
