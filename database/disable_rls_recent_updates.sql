-- ==================== DISABLE RLS FOR recent_updates TABLE ====================
-- Run this in Supabase SQL Editor to temporarily disable RLS for testing
-- 
-- ⚠️ WARNING: This makes the recent_updates table publicly accessible!
-- Only use for demo/development. Re-enable RLS for production.

-- Disable RLS on recent_updates table
ALTER TABLE public.recent_updates DISABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'recent_updates';
-- Expected result: rowsecurity = false

-- Test data fetch (should now work without authentication)
SELECT * FROM public.recent_updates LIMIT 5;

-- ==================== TO RE-ENABLE RLS LATER ====================
-- When you want to re-enable RLS for production:
-- ALTER TABLE public.recent_updates ENABLE ROW LEVEL SECURITY;