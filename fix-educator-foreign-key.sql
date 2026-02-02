-- FIX: Remove the restrictive foreign key constraint for educator_id
-- This allows both school educators and college lecturers to be referenced

-- Step 1: Drop the restrictive foreign key constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_educator_id_fkey;

-- Step 2: Check what tables exist for educators
-- Run this to see what educator tables you have:
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%educator%' OR table_name LIKE '%lecturer%'
ORDER BY table_name;

-- Step 3: For now, we'll remove the constraint entirely to allow flexibility
-- The educator_id can reference either school_educators or college_educators
-- We'll rely on application logic to ensure data integrity

-- Optional: Add a more flexible constraint later if needed
-- But for now, removing it will allow college lecturer conversations to work