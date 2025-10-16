-- ===================================================================
-- QUICK FIX: Install Recent Updates Triggers
-- Run this entire file in Supabase SQL Editor
-- ===================================================================

-- Step 1: Ensure recent_updates table has updated_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recent_updates' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.recent_updates 
    ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- Step 2: Create helper function to add updates
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
  v_new_update := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'message', p_message,
    'timestamp', 'Just now',
    'type', p_type,
    'created_at', now()
  );

  SELECT updates INTO v_current_updates
  FROM public.recent_updates
  WHERE student_id = p_student_id;

  IF v_current_updates IS NULL THEN
    v_updates_array := jsonb_build_array();
  ELSIF v_current_updates ? 'updates' THEN
    v_updates_array := v_current_updates->'updates';
  ELSE
    v_updates_array := jsonb_build_array();
  END IF;

  v_updates_array := jsonb_build_array(v_new_update) || v_updates_array;

  IF jsonb_array_length(v_updates_array) > 20 THEN
    v_updates_array := v_updates_array #> ARRAY['0:19'];
  END IF;

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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create profile update trigger function
CREATE OR REPLACE FUNCTION trigger_profile_update()
RETURNS TRIGGER AS $$
DECLARE
  v_changes text;
BEGIN
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

  PERFORM add_recent_update(
    NEW.id,
    v_changes,
    'profile_update'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create training completion trigger function
CREATE OR REPLACE FUNCTION trigger_training_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_old_training jsonb;
  v_new_training jsonb;
  v_training_item jsonb;
  v_course_name text;
BEGIN
  v_old_training := OLD.profile->'training';
  v_new_training := NEW.profile->'training';

  IF v_old_training IS NOT NULL AND v_new_training IS NOT NULL THEN
    FOR v_training_item IN SELECT * FROM jsonb_array_elements(v_new_training)
    LOOP
      v_course_name := v_training_item->>'course';
      
      IF v_training_item->>'status' = 'completed' THEN
        IF NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(v_old_training) old_item
          WHERE old_item->>'id' = v_training_item->>'id'
          AND old_item->>'status' = 'completed'
        ) THEN
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

-- Step 5: Create skills improvement trigger function
CREATE OR REPLACE FUNCTION trigger_skills_improvement()
RETURNS TRIGGER AS $$
DECLARE
  v_old_tech_skills jsonb;
  v_new_tech_skills jsonb;
  v_skill_count_old int;
  v_skill_count_new int;
BEGIN
  v_old_tech_skills := OLD.profile->'technicalSkills';
  v_new_tech_skills := NEW.profile->'technicalSkills';

  v_skill_count_old := COALESCE(jsonb_array_length(v_old_tech_skills), 0);
  v_skill_count_new := COALESCE(jsonb_array_length(v_new_tech_skills), 0);

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

-- Step 6: Create triggers
DROP TRIGGER IF EXISTS auto_recent_update_on_profile_change ON students;
CREATE TRIGGER auto_recent_update_on_profile_change
  AFTER UPDATE OF profile ON students
  FOR EACH ROW
  WHEN (OLD.profile IS DISTINCT FROM NEW.profile)
  EXECUTE FUNCTION trigger_profile_update();

DROP TRIGGER IF EXISTS auto_recent_update_on_training_complete ON students;
CREATE TRIGGER auto_recent_update_on_training_complete
  AFTER UPDATE OF profile ON students
  FOR EACH ROW
  WHEN (OLD.profile->'training' IS DISTINCT FROM NEW.profile->'training')
  EXECUTE FUNCTION trigger_training_completion();

DROP TRIGGER IF EXISTS auto_recent_update_on_skills_change ON students;
CREATE TRIGGER auto_recent_update_on_skills_change
  AFTER UPDATE OF profile ON students
  FOR EACH ROW
  WHEN (OLD.profile->'technicalSkills' IS DISTINCT FROM NEW.profile->'technicalSkills')
  EXECUTE FUNCTION trigger_skills_improvement();

-- Step 7: Verify installation
SELECT 
  '✅ Trigger installed: ' || trigger_name as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'students'
AND trigger_name LIKE 'auto_recent_update%'
ORDER BY trigger_name;

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ All triggers installed successfully!';
  RAISE NOTICE '📝 Test by editing your profile in the app';
  RAISE NOTICE '🔄 Recent Updates should appear automatically';
END $$;
