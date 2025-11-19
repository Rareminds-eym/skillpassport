-- ==================== CREATE SAMPLE DATA FOR recent_updates ====================
-- Run this in Supabase SQL Editor to create sample data for testing

-- First, check if we have any data
SELECT COUNT(*) as total_records FROM public.recent_updates;

-- Check if we have students with user_id (needed for foreign key)
SELECT email, user_id FROM public.students WHERE user_id IS NOT NULL LIMIT 5;

-- Create sample data for any student with a user_id
INSERT INTO public.recent_updates (user_id, student_id, updates)
SELECT 
  s.user_id,
  s.id as student_id,
  '{"updates": [
    {
      "id": "sample-1",
      "message": "You completed FSQM Module 4.",
      "timestamp": "2 hours ago",
      "type": "achievement"
    },
    {
      "id": "sample-2",
      "message": "3 recruiters viewed your profile.",
      "timestamp": "1 day ago",
      "type": "notification"
    },
    {
      "id": "sample-3",
      "message": "New opportunity match: Frontend Developer at Zomato",
      "timestamp": "2 days ago",
      "type": "opportunity"
    },
    {
      "id": "sample-4",
      "message": "Your profile score increased to 85%",
      "timestamp": "3 days ago",
      "type": "achievement"
    },
    {
      "id": "sample-5",
      "message": "Certificate verification completed",
      "timestamp": "1 week ago",
      "type": "verification"
    }
  ]}'::jsonb
FROM public.students s 
WHERE s.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.recent_updates ru 
  WHERE ru.user_id = s.user_id
)
LIMIT 5;

-- Verify the data was created
SELECT 
  ru.user_id,
  s.email,
  jsonb_array_length(ru.updates->'updates') as update_count,
  ru.updates->'updates'->0->>'message' as first_update
FROM public.recent_updates ru
JOIN public.students s ON s.user_id = ru.user_id
LIMIT 5;