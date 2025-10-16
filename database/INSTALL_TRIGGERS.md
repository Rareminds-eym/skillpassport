# Install Recent Updates Triggers

## Quick Install Steps

### Option 1: Using Supabase SQL Editor (RECOMMENDED)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy and paste the contents of `auto_update_recent_updates_triggers.sql`
5. Click **Run** (or press F5)

### Option 2: Step-by-Step Manual Installation

If you need to install step by step, run these in order:

#### Step 1: Create Helper Function
```sql
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

  RAISE LOG 'Added recent update for student %: %', p_student_id, p_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Step 2: Create Profile Update Trigger Function
```sql
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
```

#### Step 3: Create the Trigger
```sql
DROP TRIGGER IF EXISTS auto_recent_update_on_profile_change ON students;
CREATE TRIGGER auto_recent_update_on_profile_change
  AFTER UPDATE OF profile ON students
  FOR EACH ROW
  WHEN (OLD.profile IS DISTINCT FROM NEW.profile)
  EXECUTE FUNCTION trigger_profile_update();
```

#### Step 4: Verify Installation
```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'students'
ORDER BY trigger_name;
```

## What Gets Installed

✅ **Helper Function**: `add_recent_update()` - Core function to add updates
✅ **Profile Trigger**: Tracks any profile changes
✅ **Training Trigger**: Tracks course completions
✅ **Skills Trigger**: Tracks skill additions
✅ **Profile Views Table**: Tracks who views your profile
✅ **Manual Functions**: Add custom updates

## Test After Installation

After installing, test by:

1. **Edit your profile** in the app
2. **Refresh the dashboard**
3. **Check Recent Updates** - should see "Profile updated"

Or run this SQL to manually test:
```sql
-- Get your student ID
SELECT id FROM students WHERE email = 'your-email@example.com';

-- Test adding an update (replace with your student ID)
SELECT add_recent_update(
  'your-student-id-here'::uuid,
  'Test update - triggers are working!',
  'test'
);

-- Check if it was added
SELECT * FROM recent_updates WHERE student_id = 'your-student-id-here'::uuid;
```

## Troubleshooting

### Error: "function does not exist"
- Make sure you're running the SQL in the **SQL Editor** in Supabase
- Run the entire `auto_update_recent_updates_triggers.sql` file at once

### Error: "permission denied"
- Make sure you're logged in as the database owner
- Check RLS policies aren't blocking the operation

### Updates not appearing
- Check if triggers are enabled: Run Step 4 verification query
- Check browser console for errors
- Verify `recent_updates` table exists
