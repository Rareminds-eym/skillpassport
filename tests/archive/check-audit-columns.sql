-- Check which entity tables are missing audit columns
-- Run this to identify similar issues in other tables

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
    SELECT DISTINCT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'colleges',
        'schools', 
        'universities',
        'students',
        'educators',
        'opportunities',
        'applications',
        'pipeline'
    )
) t
ORDER BY table_name;

-- Show detailed column info for colleges table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'colleges'
AND column_name IN ('created_by', 'updated_by', 'createdAt', 'updatedAt')
ORDER BY column_name;
