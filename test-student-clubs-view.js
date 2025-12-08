import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testStudentClubsView() {
    console.log('🧪 Testing Student Clubs View\n');
    
    const studentEmail = 'litikesh@rareminds.in';
    
    console.log(`📧 Testing for student: ${studentEmail}\n`);
    
    // Test 1: Fetch from club_memberships_with_students view
    console.log('1️⃣ Fetching from club_memberships_with_students view...');
    const { data: membershipData, error: membershipError } = await supabase
        .from('club_memberships_with_students')
        .select('*')
        .eq('student_email', studentEmail)
        .eq('status', 'active');
    
    if (membershipError) {
        console.error('❌ Error:', membershipError);
    } else {
        console.log(`✅ Found ${membershipData?.length || 0} club memberships`);
        if (membershipData && membershipData.length > 0) {
            console.log('\n📋 Membership Details:');
            membershipData.forEach((membership, idx) => {
                console.log(`\n   Club ${idx + 1}:`);
                console.log(`   - Name: ${membership.club_name}`);
                console.log(`   - Category: ${membership.club_category}`);
                console.log(`   - Meeting: ${membership.meeting_day} at ${membership.meeting_time}`);
                console.log(`   - Location: ${membership.location}`);
                console.log(`   - Mentor: ${membership.mentor_name} (${membership.mentor_type})`);
                console.log(`   - Attendance: ${membership.attendance_percentage}%`);
                console.log(`   - Sessions: ${membership.total_sessions_attended}/${membership.total_sessions_held}`);
            });
        }
    }
    
    // Test 2: Check if student exists in students table
    console.log('\n\n2️⃣ Checking student record...');
    const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('email', studentEmail)
        .maybeSingle();
    
    if (studentError) {
        console.error('❌ Error:', studentError);
    } else if (!studentData) {
        console.log('⚠️  Student not found in students table');
    } else {
        console.log('✅ Student found:');
        console.log(`   - Name: ${studentData.name}`);
        console.log(`   - School ID: ${studentData.school_id}`);
        console.log(`   - Grade: ${studentData.grade}`);
        console.log(`   - Section: ${studentData.section}`);
    }
    
    // Test 3: Check club_memberships table directly
    console.log('\n\n3️⃣ Checking club_memberships table...');
    const { data: directMemberships, error: directError } = await supabase
        .from('club_memberships')
        .select('*')
        .eq('student_email', studentEmail);
    
    if (directError) {
        console.error('❌ Error:', directError);
    } else {
        console.log(`✅ Found ${directMemberships?.length || 0} memberships in club_memberships table`);
        if (directMemberships && directMemberships.length > 0) {
            directMemberships.forEach((m, idx) => {
                console.log(`   ${idx + 1}. Club ID: ${m.club_id}, Status: ${m.status}`);
            });
        }
    }
    
    // Test 4: Check clubs table for school
    if (studentData?.school_id) {
        console.log('\n\n4️⃣ Checking clubs in student\'s school...');
        const { data: schoolClubs, error: clubsError } = await supabase
            .from('clubs')
            .select('*')
            .eq('school_id', studentData.school_id)
            .eq('is_active', true);
        
        if (clubsError) {
            console.error('❌ Error:', clubsError);
        } else {
            console.log(`✅ Found ${schoolClubs?.length || 0} active clubs in school`);
            if (schoolClubs && schoolClubs.length > 0) {
                schoolClubs.forEach((club, idx) => {
                    console.log(`   ${idx + 1}. ${club.name} (${club.category})`);
                });
            }
        }
    }
    
    console.log('\n\n✨ Test complete!');
}

testStudentClubsView().catch(console.error);
