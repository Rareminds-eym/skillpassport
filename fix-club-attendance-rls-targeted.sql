-- Targeted fix for club attendance RLS policies
-- This works with the existing school-based access control

-- First, let's see what policies currently exist
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('club_attendance', 'club_attendance_records')
ORDER BY tablename, policyname;

-- Check if the policies are using the correct JWT claims extraction
-- The issue might be with how the email is extracted from JWT

-- Let's create a function to help debug the JWT claims
CREATE OR REPLACE FUNCTION debug_jwt_claims()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT (current_setting('request.jwt.claims', true))::json;
$$;

-- Test the JWT claims extraction
SELECT debug_jwt_claims();

-- Check if the email extraction is working correctly
SELECT 
    (current_setting('request.jwt.claims', true))::json ->> 'email' as extracted_email,
    auth.email() as auth_email,
    auth.uid() as auth_uid;

-- Alternative approach: Create policies that use auth.email() instead of JWT claims
-- This is more reliable for Supabase Auth

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "club_attendance_school_access" ON public.club_attendance;
DROP POLICY IF EXISTS "club_attendance_records_school_access" ON public.club_attendance_records;

-- Create new policies using auth.email() which is more reliable
CREATE POLICY "club_attendance_school_access"
ON public.club_attendance
FOR ALL
TO authenticated
USING (
    club_id IN (
        SELECT c.club_id 
        FROM clubs c
        WHERE c.school_id IN (
            -- School admin access
            SELECT s.id 
            FROM schools s 
            WHERE s.principal_email = auth.email()
            UNION
            -- Educator access  
            SELECT se.school_id 
            FROM school_educators se 
            WHERE se.email = auth.email()
        )
    )
)
WITH CHECK (
    club_id IN (
        SELECT c.club_id 
        FROM clubs c
        WHERE c.school_id IN (
            SELECT s.id 
            FROM schools s 
            WHERE s.principal_email = auth.email()
            UNION
            SELECT se.school_id 
            FROM school_educators se 
            WHERE se.email = auth.email()
        )
    )
);

CREATE POLICY "club_attendance_records_school_access"
ON public.club_attendance_records
FOR ALL
TO authenticated
USING (
    attendance_id IN (
        SELECT ca.attendance_id 
        FROM club_attendance ca
        JOIN clubs c ON c.club_id = ca.club_id
        WHERE c.school_id IN (
            SELECT s.id 
            FROM schools s 
            WHERE s.principal_email = auth.email()
            UNION
            SELECT se.school_id 
            FROM school_educators se 
            WHERE se.email = auth.email()
        )
    )
)
WITH CHECK (
    attendance_id IN (
        SELECT ca.attendance_id 
        FROM club_attendance ca
        JOIN clubs c ON c.club_id = ca.club_id
        WHERE c.school_id IN (
            SELECT s.id 
            FROM schools s 
            WHERE s.principal_email = auth.email()
            UNION
            SELECT se.school_id 
            FROM school_educators se 
            WHERE se.email = auth.email()
        )
    )
);

-- Verify the new policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename IN ('club_attendance', 'club_attendance_records')
ORDER BY tablename, policyname;

-- Test query to verify access
SELECT 
    'Testing access for current user' as test,
    auth.email() as current_user_email,
    COUNT(*) as accessible_clubs
FROM clubs c
WHERE c.school_id IN (
    SELECT s.id FROM schools s WHERE s.principal_email = auth.email()
    UNION
    SELECT se.school_id FROM school_educators se WHERE se.email = auth.email()
);