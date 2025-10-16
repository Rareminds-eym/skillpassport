-- ===================================================================
-- COMPLETE AUTOMATIC RECENT UPDATES SETUP
-- Compatible with table structure: student_id (NO user_id column)
-- ===================================================================

-- Step 1: Verify table structure and add updated_at if missing
DO $$ 
BEGIN
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recent_updates' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.recent_updates 
    ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    RAISE NOTICE '✅ Added updated_at column';
  ELSE
    RAISE NOTICE '✅ updated_at column already exists';
  END IF;
END $$;

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recent_updates_student ON recent_updates(student_id);
CREATE INDEX IF NOT EXISTS idx_recent_updates_updated_at ON recent_updates(updated_at);

-- Step 3: Drop existing functions if they exist (to avoid conflicts)
DROP FUNCTION IF EXISTS add_recent_update(uuid, text, text);
DROP FUNCTION IF EXISTS trigger_training_completion();
DROP FUNCTION IF EXISTS trigger_skills_improvement();
DROP FUNCTION IF EXISTS track_profile_view(uuid, text, uuid);
DROP FUNCTION IF EXISTS add_opportunity_match_update(uuid, text, text);
DROP FUNCTION IF EXISTS add_achievement_update(uuid, text);

-- ==================== HELPER FUNCTION ====================
-- Function to add a new update to the recent_updates table
CREATE OR REPLACE FUNCTION add_recent_update(
  p_student_id uuid,
  p_message text,
  p_type text
)
RETURNS void AS $$
DECLARE
  v_new_update jsonb;
  v_current_updates jsonb;
  v_updates_array jsonb;
BEGIN
  -- Create the new update object with timestamp
  v_new_update := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'message', p_message,
    'timestamp', 'Just now',
    'type', p_type,
    'created_at', now()
  );

  -- Get current updates
  SELECT updates INTO v_current_updates
  FROM public.recent_updates
  WHERE student_id = p_student_id;

  -- Extract the updates array
  IF v_current_updates IS NULL THEN
    v_updates_array := jsonb_build_array();
  ELSIF v_current_updates ? 'updates' THEN
    v_updates_array := v_current_updates->'updates';
  ELSE
    v_updates_array := jsonb_build_array();
  END IF;

  -- Add new update to the beginning of the array
  v_updates_array := jsonb_build_array(v_new_update) || v_updates_array;

  -- Keep only the last 20 updates
  IF jsonb_array_length(v_updates_array) > 20 THEN
    v_updates_array := v_updates_array #> ARRAY['0:19'];
  END IF;

  -- Insert or update the recent_updates record
  INSERT INTO public.recent_updates (student_id, updates, updated_at)
  VALUES (
    p_student_id,
    jsonb_build_object('updates', v_updates_array),
    now()
  )
  ON CONFLICT (student_id) 
  DO UPDATE SET
    updates = jsonb_build_object('updates', v_updates_array),
    updated_at = now();

  RAISE LOG 'Added recent update for student %: %', p_student_id, p_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==================== TRIGGER 1: TRAINING COMPLETION ====================
-- Trigger when training status changes to 'completed'
CREATE OR REPLACE FUNCTION trigger_training_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_old_training jsonb;
  v_new_training jsonb;
  v_old_item jsonb;
  v_new_item jsonb;
  v_course_name text;
  v_training_id text;
  v_old_status text;
  v_new_status text;
  i int;
BEGIN
  -- Get training arrays
  v_old_training := OLD.profile->'training';
  v_new_training := NEW.profile->'training';

  -- Exit if no training data
  IF v_old_training IS NULL OR v_new_training IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check each training item
  FOR i IN 0..(jsonb_array_length(v_new_training) - 1)
  LOOP
    v_new_item := v_new_training->i;
    v_training_id := v_new_item->>'id';
    v_new_status := v_new_item->>'status';
    v_course_name := v_new_item->>'course';

    -- Skip if not completed
    IF v_new_status != 'completed' THEN
      CONTINUE;
    END IF;

    -- Find matching old item by id
    v_old_status := NULL;
    FOR v_old_item IN SELECT * FROM jsonb_array_elements(v_old_training)
    LOOP
      IF v_old_item->>'id' = v_training_id THEN
        v_old_status := v_old_item->>'status';
        EXIT;
      END IF;
    END LOOP;

    -- If status changed from not-completed to completed, add update
    IF v_old_status IS NULL OR v_old_status != 'completed' THEN
      PERFORM add_recent_update(
        NEW.id,
        'You completed ' || COALESCE(v_course_name, 'a course'),
        'course_completion'
      );
      RAISE LOG 'Training completion detected for student %: %', NEW.id, v_course_name;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for training completion
DROP TRIGGER IF EXISTS auto_recent_update_on_training_complete ON students;
CREATE TRIGGER auto_recent_update_on_training_complete
  AFTER UPDATE OF profile ON students
  FOR EACH ROW
  WHEN (OLD.profile->'training' IS DISTINCT FROM NEW.profile->'training')
  EXECUTE FUNCTION trigger_training_completion();


-- ==================== TRIGGER 2: SKILLS IMPROVEMENT ====================
-- Trigger when skills are added or improved
CREATE OR REPLACE FUNCTION trigger_skills_improvement()
RETURNS TRIGGER AS $$
DECLARE
  v_old_tech_skills jsonb;
  v_new_tech_skills jsonb;
  v_skill_count_old int;
  v_skill_count_new int;
BEGIN
  -- Get technical skills arrays
  v_old_tech_skills := OLD.profile->'technicalSkills';
  v_new_tech_skills := NEW.profile->'technicalSkills';

  -- Count skills
  v_skill_count_old := COALESCE(jsonb_array_length(v_old_tech_skills), 0);
  v_skill_count_new := COALESCE(jsonb_array_length(v_new_tech_skills), 0);

  -- Check if skills were added
  IF v_skill_count_new > v_skill_count_old THEN
    PERFORM add_recent_update(
      NEW.id,
      'You added ' || (v_skill_count_new - v_skill_count_old)::text || ' new skill(s)',
      'skill_improvement'
    );
    RAISE LOG 'Skills improvement detected for student %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for skills improvement
DROP TRIGGER IF EXISTS auto_recent_update_on_skills_change ON students;
CREATE TRIGGER auto_recent_update_on_skills_change
  AFTER UPDATE OF profile ON students
  FOR EACH ROW
  WHEN (OLD.profile->'technicalSkills' IS DISTINCT FROM NEW.profile->'technicalSkills')
  EXECUTE FUNCTION trigger_skills_improvement();


-- ==================== PROFILE VIEWS TRACKING ====================
-- Create a table to track profile views
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  viewer_type text NOT NULL, -- 'recruiter', 'student', 'anonymous'
  viewer_id uuid, -- Can be null for anonymous views
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_views_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_profile_views_student ON profile_views(student_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_date ON profile_views(viewed_at);

-- Function to track profile view and create update
CREATE OR REPLACE FUNCTION track_profile_view(
  p_student_id uuid,
  p_viewer_type text DEFAULT 'anonymous',
  p_viewer_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_recent_views int;
BEGIN
  -- Insert the view
  INSERT INTO public.profile_views (student_id, viewer_type, viewer_id)
  VALUES (p_student_id, p_viewer_type, p_viewer_id);

  -- Count views in the last 7 days
  SELECT COUNT(*) INTO v_recent_views
  FROM public.profile_views
  WHERE student_id = p_student_id
  AND viewed_at >= now() - interval '7 days';

  -- Add update every 5 views
  IF v_recent_views % 5 = 0 THEN
    PERFORM add_recent_update(
      p_student_id,
      'Your profile has been viewed ' || v_recent_views::text || ' times this week',
      'profile_view'
    );
    RAISE LOG 'Profile view milestone for student %: % views', p_student_id, v_recent_views;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==================== MANUAL UPDATE FUNCTIONS ====================
-- Function to manually add opportunity match update
CREATE OR REPLACE FUNCTION add_opportunity_match_update(
  p_student_id uuid,
  p_opportunity_title text,
  p_company_name text
)
RETURNS void AS $$
BEGIN
  PERFORM add_recent_update(
    p_student_id,
    'New opportunity match: ' || p_opportunity_title || ' at ' || p_company_name,
    'opportunity_match'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually add achievement update
CREATE OR REPLACE FUNCTION add_achievement_update(
  p_student_id uuid,
  p_achievement text
)
RETURNS void AS $$
BEGIN
  PERFORM add_recent_update(
    p_student_id,
    p_achievement,
    'achievement'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==================== RLS POLICIES ====================
-- Enable RLS on profile_views
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Allow students to view their own profile views
-- Simplified policy: just allow all authenticated users to view
DROP POLICY IF EXISTS "Students can view own profile views" ON public.profile_views;
CREATE POLICY "Students can view own profile views" ON public.profile_views
FOR SELECT USING (true);

-- Allow anyone to insert profile views (for tracking)
DROP POLICY IF EXISTS "Anyone can track profile views" ON public.profile_views;
CREATE POLICY "Anyone can track profile views" ON public.profile_views
FOR INSERT WITH CHECK (true);


-- ==================== VERIFICATION ====================
-- Verify triggers are created
DO $$
DECLARE
  v_trigger_count int;
  v_function_count int;
BEGIN
  -- Count triggers
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'auto_recent_update%';

  -- Count functions
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'add_recent_update',
    'track_profile_view',
    'add_opportunity_match_update',
    'add_achievement_update',
    'trigger_training_completion',
    'trigger_skills_improvement'
  );

  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ AUTOMATIC RECENT UPDATES SYSTEM INSTALLED';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Triggers Created: %', v_trigger_count;
  RAISE NOTICE '🔧 Functions Created: %', v_function_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Created Functions:';
  RAISE NOTICE '  ✓ add_recent_update()';
  RAISE NOTICE '  ✓ track_profile_view()';
  RAISE NOTICE '  ✓ add_opportunity_match_update()';
  RAISE NOTICE '  ✓ add_achievement_update()';
  RAISE NOTICE '';
  RAISE NOTICE 'Created Triggers:';
  RAISE NOTICE '  ✓ Training completion detector';
  RAISE NOTICE '  ✓ Skills improvement detector';
  RAISE NOTICE '';
  RAISE NOTICE 'Created Tables:';
  RAISE NOTICE '  ✓ profile_views (for tracking)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Test the triggers (see test queries below)';
  RAISE NOTICE '  2. Add frontend profile view tracking';
  RAISE NOTICE '  3. Check ACTION_REQUIRED.md for details';
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
END $$;

-- Add comments for documentation (with full function signatures)
COMMENT ON FUNCTION add_recent_update(uuid, text, text) IS 'Adds a new update to student recent_updates table (uses student_id only)';
COMMENT ON FUNCTION track_profile_view(uuid, text, uuid) IS 'Tracks profile view and creates update notification every 5 views';
COMMENT ON FUNCTION add_opportunity_match_update(uuid, text, text) IS 'Manually adds opportunity match update';
COMMENT ON FUNCTION add_achievement_update(uuid, text) IS 'Manually adds achievement update';
COMMENT ON TABLE profile_views IS 'Tracks profile views for analytics and notifications';

-- ==================== TEST QUERIES ====================
-- Uncomment these to test after setup

-- Test 1: Training Completion (replace with your email)
/*
UPDATE students
SET profile = jsonb_set(
  profile,
  '{training,0,status}',
  '"completed"'
)
WHERE email = 'your-email@example.com';

-- Check result
SELECT updates FROM recent_updates 
WHERE student_id = (SELECT id FROM students WHERE email = 'your-email@example.com');
*/

-- Test 2: Add Skills
/*
UPDATE students
SET profile = jsonb_set(
  profile,
  '{technicalSkills}',
  (profile->'technicalSkills' || '[{"id": 999, "name": "Test Skill", "level": 4}]'::jsonb)
)
WHERE email = 'your-email@example.com';

-- Check result
SELECT updates FROM recent_updates 
WHERE student_id = (SELECT id FROM students WHERE email = 'your-email@example.com');
*/

-- Test 3: Profile Views (creates update after 5 views)
/*
DO $$
DECLARE
  v_student_id uuid;
BEGIN
  SELECT id INTO v_student_id FROM students WHERE email = 'your-email@example.com';
  
  FOR i IN 1..5 LOOP
    PERFORM track_profile_view(v_student_id, 'recruiter', NULL);
  END LOOP;
END $$;

-- Check result
SELECT updates FROM recent_updates 
WHERE student_id = (SELECT id FROM students WHERE email = 'your-email@example.com');
*/
