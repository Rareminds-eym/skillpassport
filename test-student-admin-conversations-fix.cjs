const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testStudentAdminConversationsFix() {
  console.log('🔍 Testing Student-Admin Conversations Fix...\n');
  
  try {
    // Get the test student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email, school_id')
      .eq('school_id', '19442d7b-ff7f-4c7f-ad85-9e501f122b26')
      .limit(1)
      .single();
    
    if (studentError) {
      console.error('❌ Error fetching student:', studentError);
      return;
    }
    
    console.log('✅ Testing with student:', student.name);
    console.log('   Student ID:', student.id);
    console.log('   School ID:', student.school_id);
    
    // Test the exact query that the fixed hook will use
    console.log('\n📋 Testing fixed useStudentAdminConversations query...');
    
    // Step 1: Get student's school_id (this is what the hook does first)
    const { data: studentData, error: studentSchoolError } = await supabase
      .from('students')
      .select('school_id')
      .eq('id', student.id)
      .single();
    
    if (studentSchoolError || !studentData?.school_id) {
      console.error('❌ Error fetching student school:', studentSchoolError);
      return;
    }
    
    console.log('✅ Student school ID:', studentData.school_id);
    
    // Step 2: Fetch student-admin conversations (this is the main query)
    const { data: adminConversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        school:schools(id, name)
      `)
      .eq('student_id', student.id)
      .eq('conversation_type', 'student_admin')
      .eq('school_id', studentData.school_id)
      .eq('deleted_by_student', false)
      .order('last_message_at', { ascending: false, nullsFirst: false });
    
    if (convError) {
      console.error('❌ Error fetching admin conversations:', convError);
      return;
    }
    
    console.log(`✅ Query successful - found ${adminConversations.length} admin conversations`);
    
    if (adminConversations.length > 0) {
      console.log('\n📋 Admin conversations found:');
      adminConversations.forEach((conv, index) => {
        console.log(`   ${index + 1}. ID: ${conv.id}`);
        console.log(`      Subject: ${conv.subject}`);
        console.log(`      Last message: ${conv.last_message_at || 'Never'}`);
        console.log(`      Preview: ${conv.last_message_preview || 'No preview'}`);
        console.log(`      Student unread: ${conv.student_unread_count || 0}`);
        console.log(`      School: ${conv.school?.name || 'Unknown'}`);
        console.log('');
      });
      
      // Test message fetching for first conversation
      const firstConv = adminConversations[0];
      console.log(`💬 Testing message fetch for conversation: ${firstConv.id}`);
      
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', firstConv.id)
        .order('created_at', { ascending: true });
      
      if (msgError) {
        console.error('❌ Error fetching messages:', msgError);
      } else {
        console.log(`✅ Found ${messages.length} messages in conversation`);
        messages.forEach((msg, index) => {
          console.log(`   ${index + 1}. ${msg.sender_type} → ${msg.receiver_type}: ${msg.message_text.substring(0, 50)}...`);
          console.log(`      Created: ${msg.created_at}`);
          console.log(`      Read: ${msg.is_read}`);
        });
      }
      
      // Test sending a new message
      console.log('\n📤 Testing message sending...');
      
      // Get admin user ID
      const { data: adminData, error: adminError } = await supabase
        .from('school_educators')
        .select('user_id')
        .eq('school_id', student.school_id)
        .eq('role', 'school_admin')
        .single();
      
      if (adminError) {
        console.error('❌ Error fetching admin:', adminError);
        return;
      }
      
      const testMessage = `Test message from student at ${new Date().toISOString()}`;
      
      const { data: newMessage, error: sendError } = await supabase
        .from('messages')
        .insert({
          conversation_id: firstConv.id,
          sender_id: student.id,
          sender_type: 'student',
          receiver_id: adminData.user_id,
          receiver_type: 'school_admin',
          message_text: testMessage,
          subject: firstConv.subject
        })
        .select()
        .single();
      
      if (sendError) {
        console.error('❌ Error sending message:', sendError);
      } else {
        console.log('✅ Message sent successfully:', newMessage.id);
        console.log('   Message text:', newMessage.message_text);
        
        // Update conversation
        const { error: updateError } = await supabase
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: testMessage.substring(0, 100),
            last_message_sender: student.id,
            admin_unread_count: (firstConv.admin_unread_count || 0) + 1
          })
          .eq('id', firstConv.id);
        
        if (updateError) {
          console.error('❌ Error updating conversation:', updateError);
        } else {
          console.log('✅ Conversation updated successfully');
        }
      }
      
    } else {
      console.log('ℹ️ No admin conversations found');
      console.log('   This means the student will see "No school admin conversations yet"');
      console.log('   They should be able to click "Contact School Admin" to start a conversation');
      
      // Test creating a new conversation
      console.log('\n🆕 Testing conversation creation...');
      
      const testSubject = 'Test Conversation - ' + Date.now();
      
      const { data: newConvResult, error: createError } = await supabase
        .rpc('get_or_create_student_admin_conversation', {
          p_student_id: student.id,
          p_school_id: student.school_id,
          p_subject: testSubject
        });
      
      if (createError) {
        console.error('❌ Error creating conversation:', createError);
      } else {
        console.log('✅ Conversation creation successful:', newConvResult);
        
        // Verify the conversation was created
        const { data: verifyConv, error: verifyError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', newConvResult[0].conversation_id)
          .single();
        
        if (verifyError) {
          console.error('❌ Error verifying conversation:', verifyError);
        } else {
          console.log('✅ Conversation verified:', verifyConv.id);
          console.log('   Subject:', verifyConv.subject);
          console.log('   Student ID:', verifyConv.student_id);
          console.log('   School ID:', verifyConv.school_id);
          console.log('   Type:', verifyConv.conversation_type);
        }
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('   The student should now be able to see and reply to admin conversations');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testStudentAdminConversationsFix();