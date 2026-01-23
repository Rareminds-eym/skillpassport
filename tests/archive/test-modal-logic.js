// Test the exact logic used in NewStudentConversationModalEducator
// Run this in browser console while logged in as educator

async function testModalLogic() {
  console.log('🔍 Testing modal logic...');
  
  try {
    // Get current user
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    const educatorId = user.id;
    console.log('👤 Educator ID:', educatorId);
    
    // Replicate the exact modal logic
    let schoolId = null;
    let educatorData = null;
    let userData = null;
    
    console.log('\n🔍 Strategy 1: school_educators by user_id...');
    const { data: educatorResult } = await window.supabase
      .from('school_educators')
      .select('school_id, id')
      .eq('user_id', educatorId)
      .maybeSingle();

    educatorData = educatorResult;
    console.log('Result:', educatorData);

    if (educatorData?.school_id) {
      schoolId = educatorData.school_id;
      console.log('✅ Found school from school_educators (user_id):', schoolId);
    } else {
      console.log('⚠️ No school found by user_id, trying by id...');
      
      console.log('\n🔍 Strategy 2: school_educators by id...');
      const { data: educatorByIdResult } = await window.supabase
        .from('school_educators')
        .select('school_id, user_id')
        .eq('id', educatorId)
        .maybeSingle();
      
      console.log('Result:', educatorByIdResult);
      
      if (educatorByIdResult?.school_id) {
        schoolId = educatorByIdResult.school_id;
        console.log('✅ Found school from school_educators (id):', schoolId);
      } else {
        console.log('⚠️ No school found by id, trying users table...');
        
        console.log('\n🔍 Strategy 3: users table...');
        const { data: userResult } = await window.supabase
          .from('users')
          .select('school_id')
          .eq('id', educatorId)
          .maybeSingle();
        
        userData = userResult;
        console.log('Result:', userData);
        
        if (userData?.school_id) {
          schoolId = userData.school_id;
          console.log('✅ Found school from users table:', schoolId);
        }
      }
    }

    if (!schoolId) {
      console.log('❌ NO SCHOOL FOUND - This is the error the modal shows!');
      return;
    }
    
    console.log('\n👥 Fetching students for school:', schoolId);
    const { data: studentsData, error: studentsError } = await window.supabase
      .from('students')
      .select(`
        id,
        name,
        email,
        university,
        branch_field,
        school_id,
        grade,
        section,
        contact_number
      `)
      .eq('school_id', schoolId)
      .order('name');

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
    } else {
      console.log('✅ Found', studentsData?.length || 0, 'students');
      if (studentsData && studentsData.length > 0) {
        console.log('First few students:');
        studentsData.slice(0, 3).forEach((student, index) => {
          console.log(`${index + 1}. ${student.name} (${student.email})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testModalLogic();