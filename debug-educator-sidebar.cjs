// Debug script to check educator setup for sidebar issue
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpooleduinyyzxgrcwko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTQ2OTgsImV4cCI6MjA3NTU3MDY5OH0.LvId6Cq13yeASDt0RXbb0y83P2xAZw0L1Q4KJAXT4jk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEducatorSetup() {
  try {
    // Replace with your actual email
    const educatorEmail = 'susmitha@gmail.com'; // Update this with your email
    
    console.log('🔍 Checking educator setup for:', educatorEmail);
    console.log('=====================================');
    
    // Check school_educators table
    const { data: schoolEducator, error: schoolError } = await supabase
      .from('school_educators')
      .select('id, email, school_id, role')
      .eq('email', educatorEmail)
      .maybeSingle();
    
    console.log('📚 School Educator Check:');
    console.log('Data:', schoolEducator);
    console.log('Error:', schoolError);
    console.log('');
    
    // Check users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', educatorEmail)
      .maybeSingle();
    
    console.log('👤 User Check:');
    console.log('Data:', user);
    console.log('Error:', userError);
    console.log('');
    
    // Check college_lecturers table by user_id (like the hook does)
    const { data: collegeLecturerById, error: collegeByIdError } = await supabase
      .from('college_lecturers')
      .select('id, user_id, collegeId, email')
      .eq('user_id', user?.id)
      .maybeSingle();
    
    console.log('🎓 College Lecturer Check (by user_id):');
    console.log('Data:', collegeLecturerById);
    console.log('Error:', collegeByIdError);
    console.log('User ID from users table:', user?.id);
    console.log('');
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log('=====================================');
    if (schoolEducator) {
      console.log('✅ Found as School Educator');
      console.log('   Role:', schoolEducator.role);
    } else {
      console.log('❌ Not found in school_educators table');
    }
    
    if (collegeLecturerById) {
      console.log('✅ Found as College Lecturer (by user_id)');
      console.log('   College ID:', collegeLecturerById.collegeId);
      console.log('   User ID matches:', collegeLecturerById.user_id === user?.id);
    } else {
      console.log('❌ Not found in college_lecturers table (by user_id)');
    }
    
    if (!schoolEducator && !collegeLecturerById) {
      console.log('⚠️  This educator is considered "rareminds" (not associated with school/college)');
      console.log('   This is why only limited sidebar items are shown');
    } else {
      console.log('✅ Educator should see full sidebar - there might be an issue with the hook');
    }
    
  } catch (error) {
    console.error('❌ Error checking educator setup:', error);
  }
}

checkEducatorSetup();