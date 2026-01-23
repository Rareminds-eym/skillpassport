// Test script to debug admin-student messaging
import { supabase } from './src/lib/supabaseClient.ts';

async function testAdminStudentMessaging() {
  console.log('🔍 Testing Admin-Student Messaging Setup...');
  
  try {
    // 1. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    console.log('👤 Current user:', user?.email, user?.id);
    
    // 2. Check if user is a school admin
    const { data: adminData, error: adminError } = await supabase
      .from('school_educators')
      .select('id, school_id, role, schools(id, name)')
      .eq('user_id', user.id)
      .eq('role', 'school_admin');
    
    if (adminError) throw adminError;
    
    console.log('🏫 School admin data:', adminData);
    
    if (!adminData || adminData.length === 0) {
      console.log('❌ User is not a school admin');
      return;
    }
    
    const schoolId = adminData[0].school_id;
    console.log('🏫 School ID:', schoolId);
    
    // 3. Check for student-admin conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        student:students(id, name, email, school_id),
        school:schools(id, name)
      `)
      .eq('school_id', schoolId)
      .eq('conversation_type', 'student_admin');
    
    if (convError) throw convError;
    
    console.log('💬 Student-admin conversations:', conversations);
    
    // 4. Check students in the same school
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, email, school_id')
      .eq('school_id', schoolId)
      .limit(5);
    
    if (studentsError) throw studentsError;
    
    console.log('👥 Students in school:', students);
    
    // 5. Test creating a conversation
    if (students && students.length > 0) {
      const testStudent = students[0];
      console.log('🧪 Testing conversation creation with student:', testStudent.name);
      
      const { data: testConv, error: testError } = await supabase
        .rpc('get_or_create_student_admin_conversation', {
          p_student_id: testStudent.id,
          p_school_id: schoolId,
          p_subject: 'Test Message'
        });
      
      if (testError) {
        console.error('❌ Error creating test conversation:', testError);
      } else {
        console.log('✅ Test conversation created:', testConv);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAdminStudentMessaging();