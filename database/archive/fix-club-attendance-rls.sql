-- Fix RLS policies for club attendance tables
-- This script addresses the RLS policy violation error

-- First, check if RLS is enabled on club_attendance_records
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('club_attendance', 'club_attendance_records');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('club_attendance', 'club_attendance_records');

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "club_attendance_records_policy" ON public.club_attendance_records;
DROP POLICY IF EXISTS "club_attendance_policy" ON public.club_attendance;

-- Create permissive policies for club_attendance table
CREATE POLICY "Allow authenticated users to manage club attendance"
ON public.club_attendance
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create permissive policies for club_attendance_records table
CREATE POLICY "Allow authenticated users to manage attendance records"
ON public.club_attendance_records
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Alternative: More restrictive policies based on school_id
-- Uncomment these if you want school-specific access control

/*
-- For club_attendance: Allow access based on club's school_id
CREATE POLICY "School-based club attendance access"
ON public.club_attendance
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.clubs c 
        WHERE c.club_id = club_attendance.club_id 
        AND c.school_id IN (
            -- School admin access
            SELECT s.id FROM public.schools s WHERE s.principal_email = auth.email()
            UNION
            -- Educator access
            SELECT se.school_id FROM public.school_educators se WHERE se.email = auth.email()
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.clubs c 
        WHERE c.club_id = club_attendance.club_id 
        AND c.school_id IN (
            SELECT s.id FROM public.schools s WHERE s.principal_email = auth.email()
            UNION
            SELECT se.school_id FROM public.school_educators se WHERE se.email = auth.email()
        )
    )
);

-- For club_attendance_records: Allow access based on attendance session's school
CREATE POLICY "School-based attendance records access"
ON public.club_attendance_records
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.club_attendance ca
        JOIN public.clubs c ON c.club_id = ca.club_id
        WHERE ca.attendance_id = club_attendance_records.attendance_id
        AND c.school_id IN (
            SELECT s.id FROM public.schools s WHERE s.principal_email = auth.email()
            UNION
            SELECT se.school_id FROM public.school_educators se WHERE se.email = auth.email()
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.club_attendance ca
        JOIN public.clubs c ON c.club_id = ca.club_id
        WHERE ca.attendance_id = club_attendance_records.attendance_id
        AND c.school_id IN (
            SELECT s.id FROM public.schools s WHERE s.principal_email = auth.email()
            UNION
            SELECT se.school_id FROM public.school_educators se WHERE se.email = auth.email()
        )
    )
);
*/

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('club_attendance', 'club_attendance_records');