// Test script to simulate student-educator conversation creation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConversationCreation() {
  console.log('🧪 Testing Student-Educator Conversation Creation...\n');

  try {
    // Get a sample student and educator
    const { data: students } = await supabase
      .from('students')
      .select('id, name, email, school_id')
      .limit(1);

    const { data: educators } = await supabase
      .from('school_educators')
      .select('id, first_name, last_name, email')
      .limit(1);

    if (!students || students.length === 0) {
      console.log('❌ No students found in database');
      return;
    }

    if (!educators || educators.length === 0) {
      console.log('❌ No educators found in database');
      return;
    }

    const student = students[0];
    const educator = educators[0];

    console.log('👨‍🎓 Using student:', student.name, `(${student.id})`);
    console.log('👩‍🏫 Using educator:', `${educator.first_name} ${educator.last_name}`, `(${educator.id})`);
    console.log('');

    // Test 1: Try to create a conversation using the database function
    console.log('1️⃣ Testing database function get_or_create_student_educator_conversation...');
    
    const { data: functionResult, error: functionError } = await supabase
      .rpc('get_or_create_student_educator_conversation', {
        p_student_id: student.id,
        p_educator_id: educator.id,
        p_class_id: null,
        p_subject: 'Test Subject'
      });

    if (functionError) {
      console.error('❌ Database function error:', functionError.message);
      console.log('   This might mean the function is not deployed or has issues');
    } else {
      console.log('✅ Database function worked!');
      console.log('   Conversation ID:', functionResult?.[0]?.conversation_id);
    }

    // Test 2: Try direct insert into conversations table
    console.log('\n2️⃣ Testing direct conversation creation...');
    
    const conversationId = `conv_se_test_${Date.now()}`;
    
    const { data: insertResult, error: insertError } = await supabase
      .from('conversations')
      .insert({
        id: conversationId,
        student_id: student.id,
        educator_id: educator.id,
        class_id: null,
        subject: 'Test Direct Insert',
        conversation_type: 'student_educator',
        status: 'active',
        student_unread_count: 0,
        educator_unread_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Direct insert error:', insertError.message);
      console.log('   This might be a permissions or RLS policy issue');
    } else {
      console.log('✅ Direct insert worked!');
      console.log('   Created conversation:', insertResult.id);
      
      // Test 3: Try to send a message
      console.log('\n3️⃣ Testing message sending...');
      
      const { data: messageResult, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: student.id,
          sender_type: 'student',
          receiver_id: educator.id,
          receiver_type: 'educator',
          message_text: 'Hello, this is a test message from student to educator!',
          class_id: null,
          subject: 'Test Direct Insert'
        })
        .select()
        .single();

      if (messageError) {
        console.error('❌ Message insert error:', messageError.message);
      } else {
        console.log('✅ Message sent successfully!');
        console.log('   Message ID:', messageResult.id);
      }
    }

    // Test 4: Check if educator can see the conversation
    console.log('\n4️⃣ Testing educator conversation visibility...');
    
    const { data: educatorConversations, error: educatorError } = await supabase
      .from('conversations')
      .select(`
        id,
        student_id,
        educator_id,
        subject,
        conversation_type,
        status,
        last_message_preview,
        educator_unread_count,
        students!inner (
          id,
          name,
          email
        )
      `)
      .eq('educator_id', educator.id)
      .eq('conversation_type', 'student_educator')
      .eq('deleted_by_educator', false);

    if (educatorError) {
      console.error('❌ Educator query error:', educatorError.message);
    } else {
      console.log(`✅ Educator can see ${educatorConversations?.length || 0} conversations`);
      
      if (educatorConversations && educatorConversations.length > 0) {
        educatorConversations.forEach((conv, idx) => {
          console.log(`   ${idx + 1}. ${conv.id} - ${conv.students.name} (${conv.subject})`);
        });
      }
    }

    // Test 5: Check if student can see the conversation
    console.log('\n5️⃣ Testing student conversation visibility...');
    
    const { data: studentConversations, error: studentError } = await supabase
      .from('conversations')
      .select(`
        id,
        student_id,
        educator_id,
        subject,
        conversation_type,
        status,
        last_message_preview,
        student_unread_count,
        school_educators!inner (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('student_id', student.id)
      .eq('conversation_type', 'student_educator')
      .eq('deleted_by_student', false);

    if (studentError) {
      console.error('❌ Student query error:', studentError.message);
    } else {
      console.log(`✅ Student can see ${studentConversations?.length || 0} conversations`);
      
      if (studentConversations && studentConversations.length > 0) {
        studentConversations.forEach((conv, idx) => {
          console.log(`   ${idx + 1}. ${conv.id} - ${conv.school_educators.first_name} ${conv.school_educators.last_name} (${conv.subject})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConversationCreation();