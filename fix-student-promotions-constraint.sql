-- Fix student_promotions table to make promoted_by nullable
-- This allows college admins to promote students without requiring a school_educators record

-- First, check the current constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='student_promotions'
    AND kcu.column_name = 'promoted_by';

-- Option 1: Drop the foreign key constraint temporarily
-- ALTER TABLE student_promotions DROP CONSTRAINT IF EXISTS student_promotions_promoted_by_fkey;

-- Option 2: Make the promoted_by column nullable (if it's not already)
ALTER TABLE student_promotions ALTER COLUMN promoted_by DROP NOT NULL;

-- Option 3: Add a new constraint that allows NULL values
-- (This is automatically handled when we make the column nullable)

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'student_promotions' 
    AND column_name = 'promoted_by';

-- Test query to see if we can insert without promoted_by
-- INSERT INTO student_promotions (
--     student_id, 
--     academic_year, 
--     from_grade, 
--     to_grade, 
--     college_id,
--     is_passed, 
--     is_promoted, 
--     promotion_date,
--     remarks
-- ) VALUES (
--     'test-student-id',
--     '2024-25',
--     '1',
--     '2',
--     'test-college-id',
--     true,
--     true,
--     CURRENT_DATE,
--     'Test promotion without promoted_by'
-- );

-- Clean up test data (uncomment if you ran the test insert)
-- DELETE FROM student_promotions WHERE student_id = 'test-student-id';

COMMENT ON COLUMN student_promotions.promoted_by IS 'ID of the admin who promoted the student. Can be NULL for college admins or system promotions.';