const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestConversation() {
  console.log('🆕 Creating test conversation for admin...\n');
  
  try {
    // Get the admin and their school
    const { data: adminData, error: adminError } = await supabase
      .from('school_educators')
      .select('user_id, school_id, schools(id, name)')
      .eq('role', 'school_admin')
      .eq('school_id', '19442d7b-ff7f-4c7f-ad85-9e501f122b26') // The admin's school
      .limit(1)
      .single();
    
    if (adminError) {
      console.error('❌ Error fetching admin:', adminError);
      return;
    }
    
    console.log('👨‍💼 Admin:', adminData);
    const schoolId = adminData.school_id;
    
    // Get a student from the same school
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email')
      .eq('school_id', schoolId)
      .limit(1)
      .single();
    
    if (studentError) {
      console.log('❌ No students found in admin school, creating one...');
      
      // Create a test student in the admin's school
      const { data: newStudent, error: createStudentError } = await supabase
        .from('students')
        .insert({
          name: 'Test Student for Admin',
          email: 'test.student.admin@school.edu',
          school_id: schoolId,
          grade: '10',
          section: 'A'
        })
        .select()
        .single();
      
      if (createStudentError) {
        console.error('❌ Error creating student:', createStudentError);
        return;
      }
      
      console.log('✅ Created test student:', newStudent);
      student = newStudent;
    } else {
      console.log('👨‍🎓 Found student:', student);
    }
    
    // Create conversation using the helper function
    console.log('\n🆕 Creating conversation...');
    const { data: newConv, error: createError } = await supabase
      .rpc('get_or_create_student_admin_conversation', {
        p_student_id: student.id,
        p_school_id: schoolId,
        p_subject: 'General Discussion - Test'
      });
    
    if (createError) {
      console.error('❌ Error creating conversation:', createError);
      return;
    }
    
    console.log('✅ Test conversation created:', newConv);
    
    // Add a test message
    console.log('\n💬 Adding test message...');
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: newConv,
        sender_id: student.id,
        sender_type: 'student',
        receiver_id: adminData.user_id,
        receiver_type: 'school_admin',
        message_text: 'Hello! This is a test message from a student to the school admin.',
        subject: 'General Discussion - Test'
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('❌ Error creating message:', messageError);
    } else {
      console.log('✅ Test message created:', message);
    }
    
    // Test the query again
    console.log('\n🔄 Testing query after creation...');
    const { data: activeConversations, error: activeError } = await supabase
      .from('conversations')
      .select(`
        *,
        student:students(id, name, email, school_id),
        school:schools(id, name)
      `)
      .eq('school_id', schoolId)
      .eq('conversation_type', 'student_admin')
      .eq('deleted_by_admin', false)
      .order('last_message_at', { ascending: false, nullsLast: true });
    
    if (activeError) {
      console.error('❌ Error with query:', activeError);
    } else {
      console.log(`✅ Active conversations found: ${activeConversations.length}`);
      activeConversations.forEach(conv => {
        console.log(`- ID: ${conv.id}`);
        console.log(`  Student: ${conv.student?.name || 'N/A'} (${conv.student?.email || 'N/A'})`);
        console.log(`  Subject: ${conv.subject || 'N/A'}`);
        console.log(`  Last message: ${conv.last_message_at || 'Never'}`);
        console.log(`  Unread count: ${conv.admin_unread_count || 0}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestConversation();