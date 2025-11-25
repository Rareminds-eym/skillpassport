-- Fix all entity tables (schools, universities) with same pattern as colleges
-- Run this to ensure consistency across all entity types

-- ============================================================================
-- SCHOOLS TABLE
-- ============================================================================

-- Add missing columns to schools table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schools') THEN
        -- Add columns
        ALTER TABLE public.schools 
        ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
        ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_schools_created_by ON public.schools(created_by);
        CREATE INDEX IF NOT EXISTS idx_schools_updated_by ON public.schools(updated_by);

        -- Enable RLS
        ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Allow school admins to insert their own school" ON public.schools;
        DROP POLICY IF EXISTS "Allow school admins to view their own school" ON public.schools;
        DROP POLICY IF EXISTS "Allow school admins to update their own school" ON public.schools;

        -- Create policies
        CREATE POLICY "Allow school admins to insert their own school"
        ON public.schools FOR INSERT
        WITH CHECK (auth.uid() = created_by);

        CREATE POLICY "Allow school admins to view their own school"
        ON public.schools FOR SELECT
        USING (auth.uid() = created_by);

        CREATE POLICY "Allow school admins to update their own school"
        ON public.schools FOR UPDATE
        USING (auth.uid() = created_by)
        WITH CHECK (auth.uid() = created_by);

        RAISE NOTICE '✅ Schools table updated successfully';
    ELSE
        RAISE NOTICE 'ℹ️ Schools table does not exist, skipping';
    END IF;
END $$;

-- ============================================================================
-- UNIVERSITIES TABLE
-- ============================================================================

-- Add missing columns to universities table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'universities') THEN
        -- Add columns
        ALTER TABLE public.universities 
        ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
        ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_universities_created_by ON public.universities(created_by);
        CREATE INDEX IF NOT EXISTS idx_universities_updated_by ON public.universities(updated_by);

        -- Enable RLS
        ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Allow university admins to insert their own university" ON public.universities;
        DROP POLICY IF EXISTS "Allow university admins to view their own university" ON public.universities;
        DROP POLICY IF EXISTS "Allow university admins to update their own university" ON public.universities;

        -- Create policies
        CREATE POLICY "Allow university admins to insert their own university"
        ON public.universities FOR INSERT
        WITH CHECK (auth.uid() = created_by);

        CREATE POLICY "Allow university admins to view their own university"
        ON public.universities FOR SELECT
        USING (auth.uid() = created_by);

        CREATE POLICY "Allow university admins to update their own university"
        ON public.universities FOR UPDATE
        USING (auth.uid() = created_by)
        WITH CHECK (auth.uid() = created_by);

        RAISE NOTICE '✅ Universities table updated successfully';
    ELSE
        RAISE NOTICE 'ℹ️ Universities table does not exist, skipping';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show summary of all entity tables
SELECT 
    'Summary of Entity Tables' as info;

SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = t.table_name 
            AND column_name = 'created_by'
        ) THEN '✅' 
        ELSE '❌' 
    END as has_created_by,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = t.table_name 
            AND column_name = 'updated_by'
        ) THEN '✅' 
        ELSE '❌' 
    END as has_updated_by,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = t.table_name 
            AND rowsecurity = true
        ) THEN '✅' 
        ELSE '❌' 
    END as has_rls
FROM (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('colleges', 'schools', 'universities')
) t
ORDER BY table_name;

-- Done
SELECT '✨ All entity tables have been updated with audit columns and RLS policies!' as status;
