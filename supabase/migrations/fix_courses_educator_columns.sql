-- =====================================================
-- FIX COURSES TABLE - ADD EDUCATOR COLUMNS
-- =====================================================

-- Add educator_id column (allow NULL for now)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'courses' AND column_name = 'educator_id'
    ) THEN
        ALTER TABLE courses ADD COLUMN educator_id UUID;
    END IF;
END $$;

-- Add educator_name column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'courses' AND column_name = 'educator_name'
    ) THEN
        ALTER TABLE courses ADD COLUMN educator_name VARCHAR(255);
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_educator' AND table_name = 'courses'
    ) THEN
        ALTER TABLE courses ADD CONSTRAINT fk_educator
            FOREIGN KEY (educator_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add index if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'courses' AND indexname = 'idx_courses_educator'
    ) THEN
        CREATE INDEX idx_courses_educator ON courses(educator_id);
    END IF;
END $$;

-- Update existing courses with the currently logged-in educator
-- This will set educator_id to the first educator found in school_educators
UPDATE courses
SET
    educator_id = COALESCE(
        educator_id,
        (SELECT user_id FROM school_educators ORDER BY created_at LIMIT 1)
    ),
    educator_name = COALESCE(
        educator_name,
        (SELECT CONCAT(first_name, ' ', last_name) FROM school_educators ORDER BY created_at LIMIT 1)
    )
WHERE educator_id IS NULL;

-- Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'courses'
    AND column_name IN ('educator_id', 'educator_name')
ORDER BY column_name;
