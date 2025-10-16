-- Complete Fix for Recent Updates Empty Issue
-- Root Cause: Row Level Security (RLS) is blocking queries when user is not authenticated

-- OPTION 1: Quick Fix - Disable RLS temporarily (for testing only)
ALTER TABLE public.recent_updates DISABLE ROW LEVEL SECURITY;

-- OPTION 2: Permanent Fix - Update RLS policies to allow public read

-- Step 1: Drop old policies
DROP POLICY IF EXISTS "Users can view own recent updates" ON public.recent_updates;
DROP POLICY IF EXISTS "Users can update own recent updates" ON public.recent_updates;
DROP POLICY IF EXISTS "Allow insert recent updates" ON public.recent_updates;
DROP POLICY IF EXISTS "Allow public read access to recent_updates" ON public.recent_updates;
DROP POLICY IF EXISTS "Allow users to update own recent_updates" ON public.recent_updates;
DROP POLICY IF EXISTS "Allow users to insert own recent_updates" ON public.recent_updates;

-- Step 2: Create new policies that work with your setup
CREATE POLICY "Allow public read access to recent_updates"
ON public.recent_updates
FOR SELECT
USING (true);

CREATE POLICY "Allow users to update own recent_updates"  
ON public.recent_updates
FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Allow users to insert own recent_updates"
ON public.recent_updates
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Step 3: Ensure sample data exists
-- Replace 'harrishhari2006@gmail.com' with YOUR email
INSERT INTO public.recent_updates (student_id, updates) 
VALUES (
  (SELECT id FROM public.students WHERE email = 'durkadevidurkadevi43@gmail.com' LIMIT 1),
  '{"updates": [
    {
      "id": "1",
      "message": "Your profile has been viewed 12 times this week",
      "timestamp": "2 hours ago",
      "type": "profile_view"
    },
    {
      "id": "2",
      "message": "New internship opportunity matches your skills",
      "timestamp": "1 day ago",
      "type": "opportunity_match"
    },
    {
      "id": "3",
      "message": "You completed JavaScript Fundamentals course",
      "timestamp": "3 days ago",
      "type": "course_completion"
    }
  ]}'::jsonb
)
ON CONFLICT (student_id) 
DO UPDATE SET 
  updates = EXCLUDED.updates,
  updated_at = now();

-- Step 4: Verify the data
SELECT 
  ru.id,
  ru.student_id,
  s.email,
  ru.updates,
  ru.created_at
FROM public.recent_updates ru
LEFT JOIN public.students s ON s.id = ru.student_id
WHERE s.email = 'durkadevidurkadevi43@gmail.com';

-- Expected output: Should show your recent updates with the correct email
