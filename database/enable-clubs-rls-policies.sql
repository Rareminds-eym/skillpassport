-- ========================================
-- RLS POLICIES FOR CLUBS & CO-CURRICULAR TABLES
-- This enables proper access control for school admins and educators
-- ========================================

-- ========================================
-- 1. CLUBS TABLE RLS
-- ========================================

-- Enable RLS on clubs table
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Policy: School admins and educators can view clubs from their school
CREATE POLICY "Users can view clubs from their school"
ON public.clubs
FOR SELECT
USING (
    school_id IN (
        -- School admin access
        SELECT id FROM public.schools 
        WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
        
        UNION
        
        -- Educator access
        SELECT school_id FROM public.school_educators 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
);

-- Policy: School admins and educators can create clubs for their school
CREATE POLICY "Users can create clubs for their school"
ON public.clubs
FOR INSERT
WITH CHECK (
    school_id IN (
        -- School admin access
        SELECT id FROM public.schools 
        WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
        
        UNION
        
        -- Educator access
        SELECT school_id FROM public.school_educators 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
);

-- Policy: School admins and educators can update clubs from their school
CREATE POLICY "Users can update clubs from their school"
ON public.clubs
FOR UPDATE
USING (
    school_id IN (
        -- School admin access
        SELECT id FROM public.schools 
        WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
        
        UNION
        
        -- Educator access
        SELECT school_id FROM public.school_educators 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
);

-- Policy: School admins and educators can delete clubs from their school
CREATE POLICY "Users can delete clubs from their school"
ON public.clubs
FOR DELETE
USING (
    school_id IN (
        -- School admin access
        SELECT id FROM public.schools 
        WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
        
        UNION
        
        -- Educator access
        SELECT school_id FROM public.school_educators 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
);

-- ========================================
-- 2. CLUB MEMBERSHIPS TABLE RLS
-- ========================================

ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;

-- Policy: View memberships for clubs in user's school
CREATE POLICY "Users can view memberships from their school"
ON public.club_memberships
FOR SELECT
USING (
    club_id IN (
        SELECT club_id FROM public.clubs
        WHERE school_id IN (
            SELECT id FROM public.schools 
            WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
            
            UNION
            
            SELECT school_id FROM public.school_educators 
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    )
);

-- Policy: Create memberships for clubs in user's school
CREATE POLICY "Users can create memberships for their school clubs"
ON public.club_memberships
FOR INSERT
WITH CHECK (
    club_id IN (
        SELECT club_id FROM public.clubs
        WHERE school_id IN (
            SELECT id FROM public.schools 
            WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
            
            UNION
            
            SELECT school_id FROM public.school_educators 
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    )
);

-- Policy: Update memberships for clubs in user's school
CREATE POLICY "Users can update memberships for their school clubs"
ON public.club_memberships
FOR UPDATE
USING (
    club_id IN (
        SELECT club_id FROM public.clubs
        WHERE school_id IN (
            SELECT id FROM public.schools 
            WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
            
            UNION
            
            SELECT school_id FROM public.school_educators 
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    )
);

-- ========================================
-- 3. CLUB ATTENDANCE TABLE RLS
-- ========================================

ALTER TABLE public.club_attendance ENABLE ROW LEVEL SECURITY;

-- Policy: View attendance for clubs in user's school
CREATE POLICY "Users can view attendance from their school"
ON public.club_attendance
FOR SELECT
USING (
    club_id IN (
        SELECT club_id FROM public.clubs
        WHERE school_id IN (
            SELECT id FROM public.schools 
            WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
            
            UNION
            
            SELECT school_id FROM public.school_educators 
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    )
);

-- Policy: Create attendance for clubs in user's school
CREATE POLICY "Users can create attendance for their school clubs"
ON public.club_attendance
FOR INSERT
WITH CHECK (
    club_id IN (
        SELECT club_id FROM public.clubs
        WHERE school_id IN (
            SELECT id FROM public.schools 
            WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
            
            UNION
            
            SELECT school_id FROM public.school_educators 
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    )
);

-- ========================================
-- 4. CLUB ATTENDANCE RECORDS TABLE RLS
-- ========================================

ALTER TABLE public.club_attendance_records ENABLE ROW LEVEL SECURITY;

-- Policy: View attendance records for user's school
CREATE POLICY "Users can view attendance records from their school"
ON public.club_attendance_records
FOR SELECT
USING (
    attendance_id IN (
        SELECT attendance_id FROM public.club_attendance
        WHERE club_id IN (
            SELECT club_id FROM public.clubs
            WHERE school_id IN (
                SELECT id FROM public.schools 
                WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
                
                UNION
                
                SELECT school_id FROM public.school_educators 
                WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
            )
        )
    )
);

-- Policy: Create attendance records for user's school
CREATE POLICY "Users can create attendance records for their school"
ON public.club_attendance_records
FOR INSERT
WITH CHECK (
    attendance_id IN (
        SELECT attendance_id FROM public.club_attendance
        WHERE club_id IN (
            SELECT club_id FROM public.clubs
            WHERE school_id IN (
                SELECT id FROM public.schools 
                WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
                
                UNION
                
                SELECT school_id FROM public.school_educators 
                WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
            )
        )
    )
);

-- ========================================
-- 5. COMPETITIONS TABLE RLS
-- ========================================

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- Policy: View competitions from user's school
CREATE POLICY "Users can view competitions from their school"
ON public.competitions
FOR SELECT
USING (
    school_id IN (
        SELECT id FROM public.schools 
        WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
        
        UNION
        
        SELECT school_id FROM public.school_educators 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
);

-- Policy: Create competitions for user's school
CREATE POLICY "Users can create competitions for their school"
ON public.competitions
FOR INSERT
WITH CHECK (
    school_id IN (
        SELECT id FROM public.schools 
        WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
        
        UNION
        
        SELECT school_id FROM public.school_educators 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
);

-- Policy: Update competitions from user's school
CREATE POLICY "Users can update competitions from their school"
ON public.competitions
FOR UPDATE
USING (
    school_id IN (
        SELECT id FROM public.schools 
        WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
        
        UNION
        
        SELECT school_id FROM public.school_educators 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
);

-- ========================================
-- 6. COMPETITION REGISTRATIONS TABLE RLS
-- ========================================

ALTER TABLE public.competition_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: View registrations for competitions in user's school
CREATE POLICY "Users can view registrations from their school"
ON public.competition_registrations
FOR SELECT
USING (
    comp_id IN (
        SELECT comp_id FROM public.competitions
        WHERE school_id IN (
            SELECT id FROM public.schools 
            WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
            
            UNION
            
            SELECT school_id FROM public.school_educators 
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    )
);

-- Policy: Create registrations for competitions in user's school
CREATE POLICY "Users can create registrations for their school"
ON public.competition_registrations
FOR INSERT
WITH CHECK (
    comp_id IN (
        SELECT comp_id FROM public.competitions
        WHERE school_id IN (
            SELECT id FROM public.schools 
            WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
            
            UNION
            
            SELECT school_id FROM public.school_educators 
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    )
);

-- ========================================
-- 7. COMPETITION RESULTS TABLE RLS
-- ========================================

ALTER TABLE public.competition_results ENABLE ROW LEVEL SECURITY;

-- Policy: View results for competitions in user's school
CREATE POLICY "Users can view results from their school"
ON public.competition_results
FOR SELECT
USING (
    comp_id IN (
        SELECT comp_id FROM public.competitions
        WHERE school_id IN (
            SELECT id FROM public.schools 
            WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
            
            UNION
            
            SELECT school_id FROM public.school_educators 
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    )
);

-- Policy: Create results for competitions in user's school
CREATE POLICY "Users can create results for their school"
ON public.competition_results
FOR INSERT
WITH CHECK (
    comp_id IN (
        SELECT comp_id FROM public.competitions
        WHERE school_id IN (
            SELECT id FROM public.schools 
            WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
            
            UNION
            
            SELECT school_id FROM public.school_educators 
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    )
);

-- ========================================
-- 8. COMPETITION CLUBS TABLE RLS
-- ========================================

ALTER TABLE public.competition_clubs ENABLE ROW LEVEL SECURITY;

-- Policy: View competition clubs from user's school
CREATE POLICY "Users can view competition clubs from their school"
ON public.competition_clubs
FOR SELECT
USING (
    comp_id IN (
        SELECT comp_id FROM public.competitions
        WHERE school_id IN (
            SELECT id FROM public.schools 
            WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
            
            UNION
            
            SELECT school_id FROM public.school_educators 
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    )
);

-- Policy: Create competition clubs for user's school
CREATE POLICY "Users can create competition clubs for their school"
ON public.competition_clubs
FOR INSERT
WITH CHECK (
    comp_id IN (
        SELECT comp_id FROM public.competitions
        WHERE school_id IN (
            SELECT id FROM public.schools 
            WHERE principal_email = current_setting('request.jwt.claims', true)::json->>'email'
            
            UNION
            
            SELECT school_id FROM public.school_educators 
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    )
);

-- ========================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ========================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.club_attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.club_attendance_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.competition_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.competition_results TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.competition_clubs TO authenticated;

-- Grant permissions on views
GRANT SELECT ON public.club_memberships_with_students TO authenticated;
GRANT SELECT ON public.competition_results_with_students TO authenticated;
GRANT SELECT ON public.clubs_with_mentors TO authenticated;
GRANT SELECT ON public.club_participation_report TO authenticated;
GRANT SELECT ON public.competition_performance_report TO authenticated;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check RLS status
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'club%' OR tablename LIKE 'competition%';

-- Check policies
-- SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'club%' OR tablename LIKE 'competition%';
