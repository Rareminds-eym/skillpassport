-- TEMPORARY: Disable RLS on recent_updates for testing
-- This allows reading recent_updates without authentication
-- WARNING: This is ONLY for debugging. Re-enable RLS in production!

-- Disable RLS
ALTER TABLE public.recent_updates DISABLE ROW LEVEL SECURITY;

-- Test query: Check if you can now see the data
SELECT 
  ru.id,
  ru.student_id,
  ru.user_id,
  ru.updates,
  s.email as student_email
FROM public.recent_updates ru
LEFT JOIN public.students s ON s.id = ru.student_id
LIMIT 10;

-- To RE-ENABLE RLS later (DO THIS AFTER TESTING):
-- ALTER TABLE public.recent_updates ENABLE ROW LEVEL SECURITY;
