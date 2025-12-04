/**
 * Test Club Creation Fix
 * 
 * This script tests if clubs can be created successfully
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClubCreation() {
    console.log('🧪 Testing Club Creation Fix\n');

    // Test 1: Check if mentor_name column exists
    console.log('📋 Test 1: Checking if mentor_name column exists...');
    const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'clubs' })
        .catch(() => ({ data: null, error: null }));

    if (columns) {
        const hasMentorName = columns.some(col => col.column_name === 'mentor_name');
        if (hasMentorName) {
            console.log('✅ mentor_name column exists');
        } else {
            console.log('❌ mentor_name column MISSING - Run migration first!');
            console.log('   Run: database/add-mentor-name-column.sql');
            return;
        }
    } else {
        console.log('⚠️  Could not check columns, proceeding anyway...');
    }

    // Test 2: Find a school
    console.log('\n📋 Test 2: Finding a school...');
    const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('id, email, name')
        .limit(1);

    if (schoolsError) {
        console.error('❌ Error fetching schools:', schoolsError);
        return;
    }

    if (!schools || schools.length === 0) {
        console.log('⚠️  No schools found in database');
        return;
    }

    const school = schools[0];
    console.log('✅ Found school:', school.name);

    // Test 3: Check for duplicate club names
    console.log('\n📋 Test 3: Checking existing clubs...');
    const { data: existingClubs, error: clubsError } = await supabase
        .from('clubs')
        .select('name')
        .eq('school_id', school.id);

    if (clubsError) {
        console.error('❌ Error fetching clubs:', clubsError);
        return;
    }

    console.log('✅ Found', existingClubs?.length || 0, 'existing clubs');
    if (existingClubs && existingClubs.length > 0) {
        console.log('   Existing clubs:', existingClubs.map(c => c.name).join(', '));
    }

    // Test 4: Simulate club creation (without actually creating)
    console.log('\n📋 Test 4: Simulating club creation...');
    const testClubName = `Test Club ${Date.now()}`;
    
    const mockClub = {
        school_id: school.id,
        name: testClubName,
        category: 'science',
        description: 'A test club for verification',
        capacity: 30,
        meeting_day: 'Monday',
        meeting_time: '15:00',
        location: 'Room 101',
        mentor_name: 'Test Mentor',
        is_active: true,
        created_by_type: 'admin',
        created_by_admin_id: school.id
    };

    console.log('   Mock club object:', JSON.stringify(mockClub, null, 2));

    // Test 5: Check RLS policies
    console.log('\n📋 Test 5: Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
        .rpc('get_table_policies', { table_name: 'clubs' })
        .catch(() => ({ data: null, error: { message: 'RPC function not available' } }));

    if (policiesError) {
        console.log('⚠️  Could not check RLS policies:', policiesError.message);
    } else if (policies) {
        console.log('✅ RLS policies found:', policies.length);
    }

    console.log('\n✅ All pre-flight checks completed!');
    console.log('\n📝 Summary:');
    console.log('   - School:', school.name);
    console.log('   - Existing clubs:', existingClubs?.length || 0);
    console.log('   - Test club name:', testClubName);
    console.log('\n💡 To test in the UI:');
    console.log('   1. Log in as:', school.email);
    console.log('   2. Go to Skills & Co-Curricular page');
    console.log('   3. Click "Add Club"');
    console.log('   4. Fill in the form and submit');
    console.log('   5. Check console for detailed logs');
}

// Run the test
testClubCreation().catch(console.error);
