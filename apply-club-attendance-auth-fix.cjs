// Apply authentication fix for club attendance RLS policies
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dpooleduinyyzxgrcwko.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.log('💡 You can also run this SQL manually in your Supabase dashboard');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyAuthFix() {
    console.log('🔧 Applying authentication fix for club attendance RLS policies...');
    
    try {
        // The fix: Replace JWT claims extraction with auth.email()
        const fixSQL = `
        -- Drop existing policies that use JWT claims
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
        `;

        console.log('🔧 Applying RLS policy fix...');
        const { error: fixError } = await supabase.rpc('exec_sql', { sql: fixSQL });

        if (fixError) {
            console.error('❌ Error applying fix:', fixError);
            throw fixError;
        }

        console.log('✅ RLS policies updated successfully!');

        // Verify the fix
        console.log('🔍 Verifying new policies...');
        const verifySQL = `
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
        `;

        const { data: policies, error: verifyError } = await supabase.rpc('exec_sql', { sql: verifySQL });

        if (verifyError) {
            console.error('❌ Error verifying policies:', verifyError);
        } else {
            console.log('✅ Updated policies:', policies);
        }

        console.log('🎉 Authentication fix applied successfully!');
        console.log('💡 The policies now use auth.email() instead of JWT claims extraction');
        console.log('🧪 Try marking club attendance again - it should work now!');

    } catch (error) {
        console.error('❌ Failed to apply authentication fix:', error);
        
        console.log('\n📋 Manual Fix Instructions:');
        console.log('If the script failed, you can run this SQL manually in your Supabase dashboard:');
        console.log(`
-- Replace JWT claims with auth.email() in RLS policies
DROP POLICY IF EXISTS "club_attendance_school_access" ON public.club_attendance;
DROP POLICY IF EXISTS "club_attendance_records_school_access" ON public.club_attendance_records;

CREATE POLICY "club_attendance_school_access"
ON public.club_attendance FOR ALL TO authenticated
USING (
    club_id IN (
        SELECT c.club_id FROM clubs c
        WHERE c.school_id IN (
            SELECT s.id FROM schools s WHERE s.principal_email = auth.email()
            UNION
            SELECT se.school_id FROM school_educators se WHERE se.email = auth.email()
        )
    )
)
WITH CHECK (
    club_id IN (
        SELECT c.club_id FROM clubs c
        WHERE c.school_id IN (
            SELECT s.id FROM schools s WHERE s.principal_email = auth.email()
            UNION
            SELECT se.school_id FROM school_educators se WHERE se.email = auth.email()
        )
    )
);

CREATE POLICY "club_attendance_records_school_access"
ON public.club_attendance_records FOR ALL TO authenticated
USING (
    attendance_id IN (
        SELECT ca.attendance_id FROM club_attendance ca
        JOIN clubs c ON c.club_id = ca.club_id
        WHERE c.school_id IN (
            SELECT s.id FROM schools s WHERE s.principal_email = auth.email()
            UNION
            SELECT se.school_id FROM school_educators se WHERE se.email = auth.email()
        )
    )
)
WITH CHECK (
    attendance_id IN (
        SELECT ca.attendance_id FROM club_attendance ca
        JOIN clubs c ON c.club_id = ca.club_id
        WHERE c.school_id IN (
            SELECT s.id FROM schools s WHERE s.principal_email = auth.email()
            UNION
            SELECT se.school_id FROM school_educators se WHERE se.email = auth.email()
        )
    )
);
        `);
    }
}

applyAuthFix();