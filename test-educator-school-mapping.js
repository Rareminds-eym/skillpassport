// Test educator school mapping in browser console
// Run this in the browser console while logged in as educator

async function testEducatorSchoolMapping() {
  console.log('🔍 Testing educator school mapping...');
  
  try {
    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ No authenticated user found');
      return;
    }
    
    const educatorId = user.id;
    console.log('👤 Current educator ID:', educatorId);
    console.log('📧 Email:', user.email);
    
    // Test 1: Check school_educators table by user_id
    console.log('\n🏫 Test 1: Checking school_educators by user_id...');
    const { data: educatorByUserId, error: error1 } = await window.supabase
      .from('school_educators')
      .select('*')
      .eq('user_id', educatorId);
    
    if (error1) {
      console.log('❌ Error:', error1.message);
    } else {
      console.log('✅ Found', educatorByUserId.length, 'records by user_id');
      educatorByUserId.forEach(record => {
        console.log('- School ID:', record.school_id);
        console.log('- Name:', record.first_name, record.last_name);
      });
    }
    
    // Test 2: Check school_educators table by id
    console.log('\n🏫 Test 2: Checking school_educators by id...');
    const { data: educatorById, error: error2 } = await window.supabase
      .from('school_educators')
      .select('*')
      .eq('id', educatorId);
    
    if (error2) {
      console.log('❌ Error:', error2.message);
    } else {
      console.log('✅ Found', educatorById.length, 'records by id');
      educatorById.forEach(record => {
        console.log('- School ID:', record.school_id);
        console.log('- User ID:', record.user_id);
        console.log('- Name:', record.first_name, record.last_name);
      });
    }
    
    // Test 3: Check users table
    console.log('\n👤 Test 3: Checking users table...');
    const { data: userData, error: error3 } = await window.supabase
      .from('users')
      .select('*')
      .eq('id', educatorId)
      .single();
    
    if (error3) {
      console.log('❌ Error:', error3.message);
    } else {
      console.log('✅ User data:');
      console.log('- School ID:', userData.school_id);
      console.log('- Role:', userData.role);
      console.log('- Name:', userData.name);
    }
    
    // Determine school ID
    let schoolId = null;
    if (userData?.school_id) {
      schoolId = userData.school_id;
      console.log('\n✅ Using school ID from users table:', schoolId);
    } else if (educatorByUserId.length > 0) {
      schoolId = educatorByUserId[0].school_id;
      console.log('\n✅ Using school ID from school_educators (user_id):', schoolId);
    } else if (educatorById.length > 0) {
      schoolId = educatorById[0].school_id;
      console.log('\n✅ Using school ID from school_educators (id):', schoolId);
    }
    
    if (!schoolId) {
      console.log('\n❌ NO SCHOOL ID FOUND!');
      return;
    }
    
    // Test 4: Check students in the school
    console.log('\n👥 Test 4: Checking students in school', schoolId, '...');
    const { data: students, error: error4 } = await window.supabase
      .from('students')
      .select('id, name, email, school_id')
      .eq('school_id', schoolId)
      .limit(5);
    
    if (error4) {
      console.log('❌ Error fetching students:', error4.message);
    } else {
      console.log('✅ Found', students.length, 'students:');
      students.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (${student.email})`);
      });
    }
    
    // Test 5: Check school details
    console.log('\n🏫 Test 5: Checking school details...');
    const { data: school, error: error5 } = await window.supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single();
    
    if (error5) {
      console.log('❌ Error fetching school:', error5.message);
    } else {
      console.log('✅ School details:');
      console.log('- Name:', school.name);
      console.log('- ID:', school.id);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testEducatorSchoolMapping();