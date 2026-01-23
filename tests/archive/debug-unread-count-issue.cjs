const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugUnreadCountIssue() {
  console.log('🔍 Debugging Unread Count Issue...\n');
  
  try {
    // Find the conversation with Litikesh Vilvanathan
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('conversation_type', 'student_admin')
      .ilike('subject', '%Technical Support%');
    
    if (convError) {
      console.error('❌ Error fetching conversations:', convError);
      return;
    }
    
    console.log(`Found ${conversations.length} conversations with Technical Support`);
    
    if (conversations.length > 0) {
      const conv = conversations[0];
      console.log('\n📋 Conversation details:');
      console.log('   ID:', conv.id);
      console.log('   Subject:', conv.subject);
      console.log('   Student ID:', conv.student_id);
      console.log('   School ID:', conv.school_id);
      console.log('   Student unread count:', conv.student_unread_count);
      console.log('   Admin unread count:', conv.admin_unread_count);
      console.log('   Last message sender:', conv.last_message_sender);
      console.log('   Last message at:', conv.last_message_at);
      
      // Check messages in this conversation
      console.log('\n💬 Messages in conversation:');
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });
      
      if (msgError) {
        console.error('❌ Error fetching messages:', msgError);
        return;
      }
      
      console.log(`Found ${messages.length} messages:`);
      messages.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.sender_type} → ${msg.receiver_type}`);
        console.log(`      Text: ${msg.message_text.substring(0, 50)}...`);
        console.log(`      Read: ${msg.is_read}`);
        console.log(`      Created: ${msg.created_at}`);
        console.log('');
      });
      
      // Check if there are unread messages for the admin
      const unreadMessages = messages.filter(msg => 
        msg.receiver_type === 'school_admin' && !msg.is_read
      );
      
      console.log(`📊 Unread messages for admin: ${unreadMessages.length}`);
      console.log(`📊 Conversation admin_unread_count: ${conv.admin_unread_count}`);
      
      if (unreadMessages.length !== conv.admin_unread_count) {
        console.log('⚠️ MISMATCH: Unread count in conversation does not match actual unread messages!');
        console.log('   Fixing the conversation unread count...');
        
        const { error: updateError } = await supabase
          .from('conversations')
          .update({
            admin_unread_count: unreadMessages.length
          })
          .eq('id', conv.id);
        
        if (updateError) {
          console.error('❌ Error updating conversation:', updateError);
        } else {
          console.log('✅ Conversation unread count fixed');
        }
      }
      
      // If admin has read the messages, mark them as read
      if (unreadMessages.length > 0) {
        console.log('\n📖 Marking messages as read for admin...');
        
        const { error: markReadError } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conv.id)
          .eq('receiver_type', 'school_admin')
          .eq('is_read', false);
        
        if (markReadError) {
          console.error('❌ Error marking messages as read:', markReadError);
        } else {
          console.log('✅ Messages marked as read');
          
          // Update conversation unread count to 0
          const { error: updateConvError } = await supabase
            .from('conversations')
            .update({
              admin_unread_count: 0
            })
            .eq('id', conv.id);
          
          if (updateConvError) {
            console.error('❌ Error updating conversation unread count:', updateConvError);
          } else {
            console.log('✅ Conversation unread count set to 0');
          }
        }
      }
      
      // Check the student side as well
      const studentUnreadMessages = messages.filter(msg => 
        msg.receiver_type === 'student' && !msg.is_read
      );
      
      console.log(`\n📊 Student side analysis:`);
      console.log(`   Unread messages for student: ${studentUnreadMessages.length}`);
      console.log(`   Conversation student_unread_count: ${conv.student_unread_count}`);
      
      if (studentUnreadMessages.length !== conv.student_unread_count) {
        console.log('⚠️ MISMATCH: Student unread count also needs fixing!');
        
        const { error: updateStudentError } = await supabase
          .from('conversations')
          .update({
            student_unread_count: studentUnreadMessages.length
          })
          .eq('id', conv.id);
        
        if (updateStudentError) {
          console.error('❌ Error updating student unread count:', updateStudentError);
        } else {
          console.log('✅ Student unread count fixed');
        }
      }
      
    } else {
      console.log('No conversations found with Technical Support');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugUnreadCountIssue();