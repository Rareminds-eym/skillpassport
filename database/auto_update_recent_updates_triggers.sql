-- ===================================================================
-- AUTOMATIC RECENT UPDATES TRIGGERS
-- This file creates triggers to automatically populate recent_updates
-- when certain events occur (training completion, profile updates, etc.)
-- ===================================================================

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
  -- Create the new update object
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


-- ==================== TRIGGER 1: PROFILE UPDATES ====================
-- Trigger when student profile is updated
CREATE OR REPLACE FUNCTION trigger_profile_update()
RETURNS TRIGGER AS $$
DECLARE
  v_changes text;
BEGIN
  -- Check what changed
  v_changes := '';
  
  IF OLD.profile->>'name' != NEW.profile->>'name' THEN
    v_changes := 'Profile information updated';
  ELSIF OLD.profile->'education' != NEW.profile->'education' THEN
    v_changes := 'Education details updated';
  ELSIF OLD.profile->'experience' != NEW.profile->'experience' THEN
    v_changes := 'Experience information updated';
  ELSIF OLD.profile->'technicalSkills' != NEW.profile->'technicalSkills' THEN
    v_changes := 'Technical skills updated';
  ELSIF OLD.profile->'softSkills' != NEW.profile->'softSkills' THEN
    v_changes := 'Soft skills updated';
  ELSE
    v_changes := 'Profile updated';
  END IF;

  -- Add the update
  PERFORM add_recent_update(
    NEW.id,
    v_changes,
    'profile_update'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS auto_recent_update_on_profile_change ON students;
CREATE TRIGGER auto_recent_update_on_profile_change
  AFTER UPDATE OF profile ON students
  FOR EACH ROW
  WHEN (OLD.profile IS DISTINCT FROM NEW.profile)
  EXECUTE FUNCTION trigger_profile_update();


-- ==================== TRIGGER 2: TRAINING COMPLETION ====================
-- Trigger when training status changes to 'completed'
CREATE OR REPLACE FUNCTION trigger_training_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_old_training jsonb;
  v_new_training jsonb;
  v_training_item jsonb;
  v_course_name text;
BEGIN
  -- Get training arrays
  v_old_training := OLD.profile->'training';
  v_new_training := NEW.profile->'training';

  -- Check if any training changed to completed
  IF v_old_training IS NOT NULL AND v_new_training IS NOT NULL THEN
    FOR v_training_item IN SELECT * FROM jsonb_array_elements(v_new_training)
    LOOP
      v_course_name := v_training_item->>'course';
      
      -- Check if this training just changed to completed
      IF v_training_item->>'status' = 'completed' THEN
        -- Check if it wasn't completed before
        IF NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(v_old_training) old_item
          WHERE old_item->>'id' = v_training_item->>'id'
          AND old_item->>'status' = 'completed'
        ) THEN
          -- Add completion update
          PERFORM add_recent_update(
            NEW.id,
            'You completed ' || v_course_name || ' course',
            'course_completion'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

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


-- ==================== TRIGGER 3: SKILLS IMPROVEMENT ====================
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


-- ==================== TABLE FOR PROFILE VIEWS ====================
-- Create a table to track profile views (if it doesn't exist)
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
  v_view_count int;
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


-- ==================== VERIFICATION ====================
-- Query to verify triggers are created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'students'
ORDER BY trigger_name;

-- Example usage to test:
-- SELECT track_profile_view(
--   (SELECT id FROM students WHERE email = 'student@example.com'),
--   'recruiter',
--   (SELECT id FROM auth.users WHERE email = 'recruiter@example.com')
-- );

COMMENT ON FUNCTION add_recent_update IS 'Adds a new update to student recent_updates table';
COMMENT ON FUNCTION track_profile_view IS 'Tracks profile view and creates update notification';
COMMENT ON FUNCTION add_opportunity_match_update IS 'Manually adds opportunity match update';
COMMENT ON FUNCTION add_achievement_update IS 'Manually adds achievement update';
COMMENT ON TABLE profile_views IS 'Tracks profile views for analytics and notifications';
