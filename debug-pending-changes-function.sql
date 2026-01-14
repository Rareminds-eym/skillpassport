-- Debug script to check if get_all_pending_changes_for_university function exists

-- 1. Check if function exists
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'get_all_pending_changes_for_university';

-- 2. Check if columns exist in college_curriculums
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'college_curriculums' 
AND column_name IN ('pending_changes', 'change_history', 'has_pending_changes');

-- 3. Test the function with a sample university_id
-- Replace 'your-university-id' with an actual UUID from your database
-- SELECT * FROM get_all_pending_changes_for_university('your-university-id'::uuid);

-- 4. Check if there are any pending changes in the database
SELECT 
    id,
    has_pending_changes,
    jsonb_array_length(pending_changes) as pending_count,
    pending_changes
FROM college_curriculums
WHERE has_pending_changes = TRUE
LIMIT 5;
