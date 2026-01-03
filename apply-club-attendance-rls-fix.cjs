// Apply RLS fix for club attendance tables
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dpooleduinyyzxgrcwko.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFix() {
    console.log('🔧 Applying RLS fix for club attendance tables...');
    
    try {
        // Check current RLS status
        console.log('📋 Checking current RLS policies...');
        const { data: policies, error: policiesError } = await supabase
            .rpc('exec_sql', {
                sql: `
                SELECT schemaname, tablename, policyname, permissive, roles, cmd
                FROM pg_policies 
                WHERE tablename IN ('club_attendance', 'club_attendance_records');
                `
            });

        if (policiesError) {
            console.error('❌ Error checking policies:', policiesError);
        } else {
            console.log('📋 Current policies:', policies);
        }

        // Apply the fix
        console.log('🔧 Creating permissive RLS policies...');
        
        const fixSQL = `
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
        `;

        const { error: fixError } = await supabase.rpc('exec_sql', { sql: fixSQL });

        if (fixError) {
            console.error('❌ Error applying RLS fix:', fixError);
            throw fixError;
        }

        console.log('✅ RLS policies updated successfully!');

        // Verify the fix
        console.log('🔍 Verifying new policies...');
        const { data: newPolicies, error: verifyError } = await supabase
            .rpc('exec_sql', {
                sql: `
                SELECT schemaname, tablename, policyname, permissive, roles, cmd
                FROM pg_policies 
                WHERE tablename IN ('club_attendance', 'club_attendance_records');
                `
            });

        if (verifyError) {
            console.error('❌ Error verifying policies:', verifyError);
        } else {
            console.log('✅ New policies:', newPolicies);
        }

        console.log('🎉 RLS fix applied successfully! You can now mark club attendance.');

    } catch (error) {
        console.error('❌ Failed to apply RLS fix:', error);
        process.exit(1);
    }
}

applyRLSFix();