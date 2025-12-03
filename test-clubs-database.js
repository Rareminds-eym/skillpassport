import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testClubsDatabase() {
  console.log('🔍 Testing Clubs Database...\n');

  try {
    // Test 1: Check if clubs table exists and query all clubs
    console.log('📊 Test 1: Fetching all clubs from database...');
    const { data: allClubs, error: allClubsError } = await supabase
      .from('clubs')
      .select('*')
      .order('created_at', { ascending: false });

    if (allClubsError) {
      console.error('❌ Error fetching clubs:', allClubsError);
    } else {
      console.log(`✅ Found ${allClubs.length} total clubs in database`);
      if (allClubs.length > 0) {
        console.log('\n📋 Clubs in database:');
        allClubs.forEach((club, index) => {
          console.log(`\n${index + 1}. ${club.name}`);
          console.log(`   - ID: ${club.club_id}`);
          console.log(`   - School ID: ${club.school_id}`);
          console.log(`   - Category: ${club.category}`);
          console.log(`   - Capacity: ${club.capacity}`);
          console.log(`   - Active: ${club.is_active}`);
          console.log(`   - Created: ${club.created_at}`);
        });
      }
    }

    // Test 2: Check schools table to see what school_ids exist
    console.log('\n\n📊 Test 2: Fetching schools from database...');
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name, email, principal_email')
      .limit(10);

    if (schoolsError) {
      console.error('❌ Error fetching schools:', schoolsError);
    } else {
      console.log(`✅ Found ${schools.length} schools`);
      if (schools.length > 0) {
        console.log('\n📋 Schools in database:');
        schools.forEach((school, index) => {
          console.log(`\n${index + 1}. ${school.name || 'Unnamed School'}`);
          console.log(`   - ID: ${school.id}`);
          console.log(`   - Email: ${school.email || 'N/A'}`);
          console.log(`   - Principal Email: ${school.principal_email || 'N/A'}`);
        });
      }
    }

    // Test 3: Check school_educators table
    console.log('\n\n📊 Test 3: Fetching school educators...');
    const { data: educators, error: educatorsError } = await supabase
      .from('school_educators')
      .select('id, email, school_id, name')
      .limit(10);

    if (educatorsError) {
      console.error('❌ Error fetching educators:', educatorsError);
    } else {
      console.log(`✅ Found ${educators.length} educators`);
      if (educators.length > 0) {
        console.log('\n📋 Educators in database:');
        educators.forEach((educator, index) => {
          console.log(`\n${index + 1}. ${educator.name || educator.email}`);
          console.log(`   - ID: ${educator.id}`);
          console.log(`   - Email: ${educator.email}`);
          console.log(`   - School ID: ${educator.school_id}`);
        });
      }
    }

    // Test 4: Try to create a test club
    console.log('\n\n📊 Test 4: Attempting to create a test club...');
    
    // Get first school_id
    if (schools && schools.length > 0) {
      const testSchoolId = schools[0].id;
      console.log(`Using school_id: ${testSchoolId}`);

      const testClub = {
        school_id: testSchoolId,
        name: 'Test Club ' + Date.now(),
        category: 'arts',
        description: 'This is a test club created by diagnostic script',
        capacity: 25,
        is_active: true
      };

      const { data: newClub, error: createError } = await supabase
        .from('clubs')
        .insert([testClub])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test club:', createError);
      } else {
        console.log('✅ Test club created successfully!');
        console.log('   - Club ID:', newClub.club_id);
        console.log('   - Name:', newClub.name);
        console.log('   - School ID:', newClub.school_id);

        // Now try to fetch it back
        console.log('\n📊 Test 5: Fetching the newly created club...');
        const { data: fetchedClub, error: fetchError } = await supabase
          .from('clubs')
          .select('*')
          .eq('club_id', newClub.club_id)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching newly created club:', fetchError);
        } else {
          console.log('✅ Successfully fetched the newly created club!');
          console.log('   - Name:', fetchedClub.name);
        }

        // Clean up - delete the test club
        console.log('\n🧹 Cleaning up test club...');
        const { error: deleteError } = await supabase
          .from('clubs')
          .delete()
          .eq('club_id', newClub.club_id);

        if (deleteError) {
          console.error('❌ Error deleting test club:', deleteError);
        } else {
          console.log('✅ Test club deleted successfully');
        }
      }
    } else {
      console.log('⚠️ No schools found, cannot create test club');
    }

    // Test 6: Check club_memberships
    console.log('\n\n📊 Test 6: Checking club memberships...');
    const { data: memberships, error: membershipsError } = await supabase
      .from('club_memberships')
      .select('*')
      .limit(10);

    if (membershipsError) {
      console.error('❌ Error fetching memberships:', membershipsError);
    } else {
      console.log(`✅ Found ${memberships.length} club memberships`);
      if (memberships.length > 0) {
        console.log('\n📋 Sample memberships:');
        memberships.slice(0, 5).forEach((membership, index) => {
          console.log(`\n${index + 1}. Club ID: ${membership.club_id}`);
          console.log(`   - Student: ${membership.student_email}`);
          console.log(`   - Status: ${membership.status}`);
          console.log(`   - Enrolled: ${membership.enrolled_at}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n\n✅ Database test complete!');
}

testClubsDatabase();
