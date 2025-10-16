-- Diagnostic script to check for duplicate emails before migration
-- Run this first to see what duplicates exist

-- Check current email duplicates
SELECT 
    COALESCE(email, profile->>'email') as email_value,
    COUNT(*) as duplicate_count,
    array_agg(id) as student_ids,
    array_agg(profile->>'name') as student_names
FROM public.students 
WHERE COALESCE(email, profile->>'email') IS NOT NULL
GROUP BY COALESCE(email, profile->>'email')
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Show details of duplicate records
WITH duplicates AS (
    SELECT 
        COALESCE(email, profile->>'email') as email_value,
        COUNT(*) as dup_count
    FROM public.students 
    WHERE COALESCE(email, profile->>'email') IS NOT NULL
    GROUP BY COALESCE(email, profile->>'email')
    HAVING COUNT(*) > 1
)
SELECT 
    s.id,
    s.email,
    s.profile->>'email' as profile_email,
    s.profile->>'name' as student_name,
    s."createdAt",
    s.profile->>'imported_at' as imported_at
FROM public.students s
JOIN duplicates d ON COALESCE(s.email, s.profile->>'email') = d.email_value
ORDER BY COALESCE(s.email, s.profile->>'email'), s."createdAt" DESC NULLS LAST, s.id DESC;

-- Check total records
SELECT 
    COUNT(*) as total_students,
    COUNT(DISTINCT COALESCE(email, profile->>'email')) as unique_emails,
    COUNT(*) - COUNT(DISTINCT COALESCE(email, profile->>'email')) as duplicate_count
FROM public.students 
WHERE COALESCE(email, profile->>'email') IS NOT NULL;