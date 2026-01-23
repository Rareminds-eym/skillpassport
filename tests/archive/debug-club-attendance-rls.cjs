// Debug club attendance RLS policy issues
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dpooleduinyyzxgrcwko.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRLSIssue() {
    console.log('🔍 Debugging club attendance RLS policy issues...');
    
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
            console.error('❌ Error getting user:', userError);
            return;
        }
        
        if (!user) {
            console.log('❌ No authenticated user found');
            return;
        }
        
        console.log('👤 Current user:', user.email);
        console.log('🆔 User ID:', user.id);
        
        // Check if user exists as school admin
        console.log('\n🏫 Checking school admin access...');
        const { data: schoolAdmin, error: schoolError } = await supabase
            .from('schools')
            .select('id, name, principal_email')
            .eq('principal_email', user.email);
            
        if (schoolError) {
            console.error('❌ Error checking school admin:', schoolError);
        } else if (schoolAdmin && schoolAdmin.length > 0) {
            console.log('✅ User is school admin for:', schoolAdmin);
        } else {
            console.log('ℹ️ User is not a school admin');
        }
        
        // Check if user exists as educator
        console.log('\n👨‍🏫 Checking educator access...');
        const { data: educator, error: educatorError } = await supabase
            .from('school_educators')
            .select('id, school_id, email, name')
            .eq('email', user.email);
            
        if (educatorError) {
            console.error('❌ Error checking educator:', educatorError);
        } else if (educator && educator.length > 0) {
            console.log('✅ User is educator:', educator);
            
            // Get school details for this educator
            const { data: school, error: schoolDetailsError } = await supabase
                .from('schools')
                .select('id, name')
                .eq('id', educator[0].school_id)
                .single();
                
            if (schoolDetailsError) {
                console.error('❌ Error getting school details:', schoolDetailsError);
            } else {
                console.log('🏫 Educator\'s school:', school);
            }
        } else {
            console.log('ℹ️ User is not an educator');
        }
        
        // Test the RLS policy logic manually
        console.log('\n🧪 Testing RLS policy logic...');
        
        // Get clubs that should be accessible to this user
        const { data: accessibleClubs, error: clubsError } = await supabase
            .from('clubs')
            .select(`
                club_id, 
                name, 
                school_id,
                schools!inner(id, name, principal_email)
            `)
            .or(`schools.principal_email.eq.${user.email},school_id.in.(${educator?.map(e => e.school_id).join(',') || 'null'})`);
            
        if (clubsError) {
            console.error('❌ Error getting accessible clubs:', clubsError);
        } else {
            console.log('🎯 Clubs accessible to user:', accessibleClubs);
        }
        
        // Test attendance session access
        console.log('\n📅 Testing attendance session access...');
        const { data: attendanceSessions, error: attendanceError } = await supabase
            .from('club_attendance')
            .select(`
                attendance_id,
                session_date,
                session_topic,
                club_id,
                clubs!inner(
                    club_id,
                    name,
                    school_id
                )
            `)
            .limit(5);
            
        if (attendanceError) {
            console.error('❌ Error getting attendance sessions:', attendanceError);
        } else {
            console.log('📅 Sample attendance sessions:', attendanceSessions);
        }
        
        // Test the specific RLS policy query
        console.log('\n🔍 Testing RLS policy query directly...');
        const testQuery = `
            SELECT 
                ca.attendance_id,
                ca.session_date,
                c.name as club_name,
                c.school_id,
                s.name as school_name,
                s.principal_email,
                se.email as educator_email
            FROM club_attendance ca
            JOIN clubs c ON c.club_id = ca.club_id
            LEFT JOIN schools s ON s.id = c.school_id
            LEFT JOIN school_educators se ON se.school_id = c.school_id
            WHERE c.school_id IN (
                SELECT s2.id FROM schools s2 WHERE s2.principal_email = $1
                UNION
                SELECT se2.school_id FROM school_educators se2 WHERE se2.email = $1
            )
            LIMIT 5;
        `;
        
        const { data: rlsTest, error: rlsError } = await supabase
            .rpc('exec_sql', { 
                sql: testQuery,
                params: [user.email]
            });
            
        if (rlsError) {
            console.error('❌ Error testing RLS query:', rlsError);
        } else {
            console.log('🔍 RLS policy test results:', rlsTest);
        }
        
        console.log('\n📋 Summary:');
        console.log('- User email:', user.email);
        console.log('- Is school admin:', schoolAdmin && schoolAdmin.length > 0);
        console.log('- Is educator:', educator && educator.length > 0);
        console.log('- Should have access to clubs:', accessibleClubs?.length || 0);
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugRLSIssue();