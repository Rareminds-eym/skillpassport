// Test script to verify the educator communication fix
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testEducatorConversations() {
  try {
    console.log('🧪 Testing educator conversations query...');
    
    // Test the fixed query structure
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        student_id,
        educator_id,
        class_id,
        subject,
        status,
        conversation_type,
        last_message_at,
        last_message_preview,
        educator_unread_count,
        student:students(
          id,
          user_id,
          email,
          name,
          contact_number,
          university,
          branch_field
        ),
        educator:school_educators(id, first_name, last_name, email),
        school_class:school_classes(id, name, grade, section)
      `)
      .eq('conversation_type', 'student_educator')
      .limit(5);
    
    if (error) {
      console.error('❌ Query failed:', error);
      return;
    }
    
    console.log('✅ Query successful!');
    console.log(`📊 Found ${data.length} student-educator conversations`);
    
    if (data.length > 0) {
      console.log('\n📝 Sample conversation:');
      const sample = data[0];
      console.log({
        id: sample.id,
        student_name: sample.student?.name || 'No name',
        student_email: sample.student?.email || 'No email',
        student_university: sample.student?.university || 'No university',
        student_branch: sample.student?.branch_field || 'No branch',
        educator: sample.educator ? `${sample.educator.first_name} ${sample.educator.last_name}` : 'No educator',
        class: sample.school_class?.name || 'No class',
        subject: sample.subject || 'No subject',
        last_message: sample.last_message_preview || 'No messages',
        unread_count: sample.educator_unread_count || 0
      });
    }
    
    console.log('\n✅ All tests passed! The profile column issue is fixed.');
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testEducatorConversations();