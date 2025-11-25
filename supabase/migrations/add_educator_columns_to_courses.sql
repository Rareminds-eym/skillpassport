-- =====================================================
-- ADD EDUCATOR COLUMNS TO EXISTING COURSES TABLE
-- =====================================================

-- Add educator_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'courses' AND column_name = 'educator_id'
    ) THEN
        ALTER TABLE courses ADD COLUMN educator_id UUID;

        -- Add foreign key constraint
        ALTER TABLE courses ADD CONSTRAINT fk_educator
            FOREIGN KEY (educator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

        -- Add index for performance
        CREATE INDEX idx_courses_educator ON courses(educator_id);
    END IF;
END $$;

-- Add educator_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'courses' AND column_name = 'educator_name'
    ) THEN
        ALTER TABLE courses ADD COLUMN educator_name VARCHAR(255);
    END IF;
END $$;

-- Update existing courses to set educator_id if NULL
-- (You may need to manually set this for existing courses)
-- Example: UPDATE courses SET educator_id = 'your-educator-uuid' WHERE educator_id IS NULL;
