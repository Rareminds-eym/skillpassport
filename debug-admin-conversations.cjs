const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugAdminConversations() {
  console.log('🔍 Debugging Admin Conversations...\n');
  
  try {
    // Get a school admin
    const { data: adminData, error: adminError } = await supabase
      .from('school_educators')
      .select('user_id, school_id, schools(id, name)')
      .eq('role', 'school_admin')
      .limit(1)
      .single();
    
    if (adminError) {
      console.error('❌ Error fetching admin:', adminError);
      return;
    }
    
    console.log('👨‍💼 Testing with admin:', adminData);
    const schoolId = adminData.school_id;
    const adminUserId = adminData.user_id;
    
    // Check all conversations
    console.log('\n📋 All conversations:');
    const { data: allConversations, error: allError } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Error fetching all conversations:', allError);
    } else {
      console.log(`Found ${allConversations.length} total conversations`);
      allConversations.forEach(conv => {
        console.log(`- ID: ${conv.id}, Type: ${conv.conversation_type}, School: ${conv.school_id}, Student: ${conv.student_id}`);
      });
    }
    
    // Test the exact query from the component
    console.log('\n🎯 Testing exact component query for active conversations:');
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
      console.error('❌ Error with active query:', activeError);
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
    
    // Check if there are any student_admin conversations at all
    console.log('\n🔍 All student_admin conversations:');
    const { data: studentAdminConvs, error: studentAdminError } = await supabase
      .from('conversations')
      .select('*')
      .eq('conversation_type', 'student_admin');
    
    if (studentAdminError) {
      console.error('❌ Error fetching student_admin conversations:', studentAdminError);
    } else {
      console.log(`Found ${studentAdminConvs.length} student_admin conversations total`);
      studentAdminConvs.forEach(conv => {
        console.log(`- ID: ${conv.id}, School: ${conv.school_id}, Student: ${conv.student_id}, Deleted: ${conv.deleted_by_admin}`);
      });
    }
    
    // Create a test conversation if none exist
    if (studentAdminConvs.length === 0) {
      console.log('\n🆕 Creating test conversation...');
      
      // Get a student from the same school
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name, email')
        .eq('school_id', schoolId)
        .limit(1)
        .single();
      
      if (studentError) {
        console.error('❌ No students found in school:', studentError);
        return;
      }
      
      console.log('👨‍🎓 Creating conversation with student:', student);
      
      // Create conversation using the helper function
      const { data: newConv, error: createError } = await supabase
        .rpc('get_or_create_student_admin_conversation', {
          p_student_id: student.id,
          p_school_id: schoolId,
          p_subject: 'Test Conversation'
        });
      
      if (createError) {
        console.error('❌ Error creating conversation:', createError);
      } else {
        console.log('✅ Test conversation created:', newConv);
        
        // Test the query again
        console.log('\n🔄 Re-testing query after creation...');
        const { data: newActiveConversations, error: newActiveError } = await supabase
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
        
        if (newActiveError) {
          console.error('❌ Error with new active query:', newActiveError);
        } else {
          console.log(`✅ Active conversations after creation: ${newActiveConversations.length}`);
          newActiveConversations.forEach(conv => {
            console.log(`- ID: ${conv.id}`);
            console.log(`  Student: ${conv.student?.name || 'N/A'}`);
            console.log(`  Subject: ${conv.subject || 'N/A'}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugAdminConversations();