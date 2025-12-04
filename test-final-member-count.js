import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testFinalMemberCount() {
    console.log('🧪 Testing Final Member Count Logic\n');
    
    const studentEmail = 'litikesh@rareminds.in';
    
    // Step 1: Get student's clubs from view
    const { data: membershipData } = await supabase
        .from('club_memberships_with_students')
        .select('*')
        .eq('student_email', studentEmail)
        .eq('status', 'active');
    
    console.log(`✅ Student is member of ${membershipData?.length || 0} clubs\n`);
    
    // Step 2: Transform and enrich data (simulating the component logic)
    const clubsData = (membershipData || []).map(membership => ({
        club_id: membership.club_id,
        name: membership.club_name,
        category: membership.club_category,
        meeting_day: membership.meeting_day,
        meeting_time: membership.meeting_time,
        location: membership.location,
        attendance_percentage: membership.attendance_percentage,
    }));
    
    // Step 3: Fetch full details for each club
    for (const club of clubsData) {
        console.log(`\n📊 Processing club: ${club.name}`);
        
        // Get club details
        const { data: clubDetails } = await supabase
            .from('clubs')
            .select('capacity, description')
            .eq('club_id', club.club_id)
            .single();
        
        // Get member count from view
        const { count: memberCount } = await supabase
            .from('club_memberships_with_students')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.club_id)
            .eq('status', 'active');
        
        console.log(`   - Capacity: ${clubDetails?.capacity || 30}`);
        console.log(`   - Member Count: ${memberCount || 0}`);
        console.log(`   - Display: ${memberCount || 0}/${clubDetails?.capacity || 30} members`);
        console.log(`   - Attendance: ${club.attendance_percentage}%`);
    }
    
    console.log('\n\n✨ Test complete! The dashboard should now show correct member counts.');
}

testFinalMemberCount().catch(console.error);
