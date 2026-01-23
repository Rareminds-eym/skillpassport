import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Use anon key to simulate student access
const supabaseAnon = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkMemberCount() {
    console.log('🔍 Checking club member counts\n');
    
    const studentEmail = 'litikesh@rareminds.in';
    
    // Get student's clubs
    const { data: membershipData } = await supabaseAnon
        .from('club_memberships_with_students')
        .select('club_id, club_name')
        .eq('student_email', studentEmail)
        .eq('status', 'active');
    
    console.log(`📋 Student is in ${membershipData?.length || 0} clubs\n`);
    
    if (membershipData && membershipData.length > 0) {
        for (const membership of membershipData) {
            console.log(`\n🏫 Club: ${membership.club_name} (ID: ${membership.club_id})`);
            
            // Try to count members using different methods
            
            // Method 1: Using count with anon key
            const { count: anonCount, error: anonError } = await supabaseAnon
                .from('club_memberships')
                .select('*', { count: 'exact', head: true })
                .eq('club_id', membership.club_id)
                .eq('status', 'active');
            
            console.log(`   Method 1 (anon count): ${anonCount} members`);
            if (anonError) console.log(`   Error:`, anonError.message);
            
            // Method 2: Select all and count
            const { data: members, error: selectError } = await supabaseAnon
                .from('club_memberships')
                .select('student_email')
                .eq('club_id', membership.club_id)
                .eq('status', 'active');
            
            console.log(`   Method 2 (select all): ${members?.length || 0} members`);
            if (selectError) console.log(`   Error:`, selectError.message);
            
            // Method 3: Count from the view itself
            const { count: viewCount, error: viewError } = await supabaseAnon
                .from('club_memberships_with_students')
                .select('*', { count: 'exact', head: true })
                .eq('club_id', membership.club_id)
                .eq('status', 'active');
            
            console.log(`   Method 3 (view count): ${viewCount} members`);
            if (viewError) console.log(`   Error:`, viewError.message);
        }
    }
}

checkMemberCount().catch(console.error);
