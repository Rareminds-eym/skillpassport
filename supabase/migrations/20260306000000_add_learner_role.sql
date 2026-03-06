-- Migration: Add 'learner' role to users and students tables
-- Description: Adds support for learner user type (independent users without institution affiliation)
-- Date: 2026-03-06

-- Add 'learner' to users.role enum if not exists
DO $$ 
BEGIN
    -- Check if 'learner' value exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'learner' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        -- Add 'learner' to the enum
        ALTER TYPE user_role ADD VALUE 'learner';
    END IF;
END $$;

-- Add 'learner' to students.student_type if the column uses an enum
-- Note: If student_type is just a text column, this will be skipped
DO $$ 
BEGIN
    -- Check if student_type is an enum type
    IF EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_type t ON a.atttypid = t.oid
        WHERE c.relname = 'students' 
        AND a.attname = 'student_type'
        AND t.typtype = 'e'
    ) THEN
        -- Check if 'learner' value exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'learner' 
            AND enumtypid = (
                SELECT a.atttypid FROM pg_attribute a
                JOIN pg_class c ON a.attrelid = c.oid
                WHERE c.relname = 'students' AND a.attname = 'student_type'
            )
        ) THEN
            -- Get the enum type name
            DECLARE
                enum_type_name text;
            BEGIN
                SELECT t.typname INTO enum_type_name
                FROM pg_attribute a
                JOIN pg_class c ON a.attrelid = c.oid
                JOIN pg_type t ON a.atttypid = t.oid
                WHERE c.relname = 'students' AND a.attname = 'student_type';
                
                -- Add 'learner' to the enum
                EXECUTE format('ALTER TYPE %I ADD VALUE ''learner''', enum_type_name);
            END;
        END IF;
    END IF;
END $$;

-- Add comment explaining learner type
COMMENT ON TYPE user_role IS 'User roles: student, educator, admin, recruiter, learner (independent user without institution)';
