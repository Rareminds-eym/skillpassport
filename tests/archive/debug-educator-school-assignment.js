// Debug educator school assignment issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEducatorSchoolAssignment() {
  try {
    console.log('🔍 Debugging educator school assignment...\n');
    
    // Get current user (assuming you're logged in as educator)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ No authenticated user found');
      console.log('Please make sure you are logged in as an educator');
      return;
    }
    
    const educatorId = user.id;
    console.log('👤 Current user ID:', educatorId);
    console.log('📧 Email:', user.email);
    
    // Check users table
    console.log('\n📋 Checking users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', educatorId)
      .single();
    
    if (userError) {
      console.log('❌ Error fetching user data:', userError.message);
    } else {
      console.log('✅ User data found:');
      console.log('- Name:', userData.name);
      console.log('- Role:', userData.role);
      console.log('- School ID:', userData.school_id || 'NOT SET');
    }
    
    // Check school_educators table by user_id
    console.log('\n🏫 Checking school_educators table (by user_id)...');
    const { data: educatorByUserId, error: educatorUserIdError } = await supabase
      .from('school_educators')
      .select('*')
      .eq('user_id', educatorId);
    
    if (educatorUserIdError) {
      console.log('❌ Error fetching educator by user_id:', educatorUserIdError.message);
    } else if (educatorByUserId.length === 0) {
      console.log('⚠️ No records found in school_educators with user_id:', educatorId);
    } else {
      console.log('✅ Found', educatorByUserId.length, 'educator record(s) by user_id:');
      educatorByUserId.forEach((record, index) => {
        console.log(`  Record ${index + 1}:`);
        console.log('  - ID:', record.id);
        console.log('  - School ID:', record.school_id);
        console.log('  - Name:', record.first_name, record.last_name);
        console.log('  - Email:', record.email);
      });
    }
    
    // Check school_educators table by id (in case user_id is not set correctly)
    console.log('\n🏫 Checking school_educators table (by id)...');
    const { data: educatorById, error: educatorIdError } = await supabase
      .from('school_educators')
      .select('*')
      .eq('id', educatorId);
    
    if (educatorIdError) {
      console.log('❌ Error fetching educator by id:', educatorIdError.message);
    } else if (educatorById.length === 0) {
      console.log('⚠️ No records found in school_educators with id:', educatorId);
    } else {
      console.log('✅ Found educator record by id:');
      const record = educatorById[0];
      console.log('- ID:', record.id);
      console.log('- User ID:', record.user_id || 'NOT SET');
      console.log('- School ID:', record.school_id);
      console.log('- Name:', record.first_name, record.last_name);
      console.log('- Email:', record.email);
    }
    
    // Check if there are any students in the school
    let schoolId = null;
    if (userData?.school_id) {
      schoolId = userData.school_id;
    } else if (educatorByUserId.length > 0) {
      schoolId = educatorByUserId[0].school_id;
    } else if (educatorById.length > 0) {
      schoolId = educatorById[0].school_id;
    }
    
    if (schoolId) {
      console.log('\n👥 Checking students in school:', schoolId);
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, email')
        .eq('school_id', schoolId)
        .limit(5);
      
      if (studentsError) {
        console.log('❌ Error fetching students:', studentsError.message);
      } else {
        console.log('✅ Found', students.length, 'students (showing first 5):');
        students.forEach((student, index) => {
          console.log(`  ${index + 1}. ${student.name} (${student.email})`);
        });
      }
    }
    
    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (!userData?.school_id && educatorByUserId.length === 0 && educatorById.length === 0) {
      console.log('❌ CRITICAL: No school assignment found anywhere!');
      console.log('   Solution: Contact your school administrator to:');
      console.log('   1. Add you to the school_educators table with proper school_id');
      console.log('   2. Set your user_id field in school_educators to:', educatorId);
    } else if (educatorByUserId.length === 0 && educatorById.length > 0) {
      console.log('⚠️ Found educator record but user_id is not set correctly');
      console.log('   Solution: Update school_educators table to set user_id =', educatorId, 'for educator id:', educatorById[0].id);
      console.log('   SQL: UPDATE school_educators SET user_id = \'' + educatorId + '\' WHERE id = \'' + educatorById[0].id + '\';');
    } else if (educatorByUserId.length > 0) {
      console.log('✅ Educator setup looks correct!');
      console.log('   If you\'re still getting errors, try refreshing the page or logging out and back in.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug function
debugEducatorSchoolAssignment();