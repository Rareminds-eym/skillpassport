-- Quick fix for opportunities not showing
-- Run this in your Supabase SQL Editor to temporarily disable RLS

-- Option 1: Disable RLS temporarily (for testing)
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;

-- Option 2: Or create a more permissive policy
DROP POLICY IF EXISTS "Public can view all opportunities" ON opportunities;
CREATE POLICY "Public can view all opportunities" 
    ON opportunities FOR SELECT 
    USING (true);

-- Check your data
SELECT 
    id,
    title,
    company_name,
    employment_type,
    location,
    mode,
    deadline,
    is_active,
    created_at
FROM opportunities 
ORDER BY created_at DESC;

-- If you want to re-enable RLS later with proper policies:
-- ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;