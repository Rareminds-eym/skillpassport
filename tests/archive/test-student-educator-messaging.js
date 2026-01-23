// Test script to verify student-educator messaging functionality
import { supabase } from './src/lib/supabaseClient.ts';

async function testStudentEducatorMessaging() {
  console.log('🧪 Testing Student-Educator Messaging...');
  
  try {
    // Test 1: Check if conversations table exists and has required columns
    console.log('\n1. Checking conversations table structure...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, student_id, educator_id, class_id, subject, conversation_type')
      .limit(1);
    
    if (convError) {
      console.error('❌ Conversations table error:', convError.message);
      return;
    }
    console.log('✅ Conversations table accessible');
    
    // Test 2: Check if messages table exists and has required columns
    console.log('\n2. Checking messages table structure...');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, sender_type, receiver_id, receiver_type, message_text')
      .limit(1);
    
    if (msgError) {
      console.error('❌ Messages table error:', msgError.message);
      return;
    }
    console.log('✅ Messages table accessible');
    
    // Test 3: Check if school_educator_class_assignments table exists
    console.log('\n3. Checking school educator assignments...');
    const { data: assignments, error: assignError } = await supabase
      .from('school_educator_class_assignments')
      .select(`
        id,
        subject,
        class_id,
        school_classes!inner (
          id,
          name,
          grade,
          section,
          school_id
        ),
        school_educators!inner (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .limit(1);
    
    if (assignError) {
      console.error('❌ School educator assignments error:', assignError.message);
      return;
    }
    console.log('✅ School educator assignments accessible');
    
    // Test 4: Check if students table exists
    console.log('\n4. Checking students table...');
    const { data: students, error: studError } = await supabase
      .from('students')
      .select('id, school_id')
      .limit(1);
    
    if (studError) {
      console.error('❌ Students table error:', studError.message);
      return;
    }
    console.log('✅ Students table accessible');
    
    console.log('\n🎉 All database tables are accessible for student-educator messaging!');
    console.log('\n📝 Next steps:');
    console.log('1. Student opens Messages page');
    console.log('2. Clicks "Start New Conversation" button');
    console.log('3. Selects an educator and subject');
    console.log('4. Types initial message in the text area');
    console.log('5. Clicks "Start Conversation" to create conversation and send message');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStudentEducatorMessaging();