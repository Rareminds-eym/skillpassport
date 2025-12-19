// Test authentication context for student-educator messaging
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthContext() {
  console.log('🔐 Testing Authentication Context for Student-Educator Messaging...\n');

  try {
    // Get sample student and educator
    const { data: students } = await supabase
      .from('students')
      .select('id, name, email')
      .limit(1);

    const { data: educators } = await supabase
      .from('school_educators')
      .select('id, first_name, last_name, email')
      .limit(1);

    if (!students?.[0] || !educators?.[0]) {
      console.log('❌ Missing test data');
      return;
    }

    const student = students[0];
    const educator = educators[0];

    console.log('👨‍🎓 Student:', student.name, `(${student.id})`);
    console.log('👩‍🏫 Educator:', `${educator.first_name} ${educator.last_name}`, `(${educator.id})`);
    console.log('');

    // Test 1: Check current auth state
    console.log('1️⃣ Current auth state:');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else if (user) {
      console.log('✅ Authenticated as:', user.email, `(${user.id})`);
    } else {
      console.log('⚠️ No authenticated user (using anonymous access)');
    }

    // Test 2: Try to create conversation with student context
    console.log('\n2️⃣ Testing conversation creation with student context...');
    
    // Simulate student authentication by setting the auth context
    // Note: This is a simulation - in real app, the user would be properly authenticated
    
    const conversationId = `conv_se_auth_test_${Date.now()}`;
    
    // Try using the database function (which should work regardless of RLS)
    const { data: functionResult, error: functionError } = await supabase
      .rpc('get_or_create_student_educator_conversation', {
        p_student_id: student.id,
        p_educator_id: educator.id,
        p_class_id: null,
        p_subject: 'Auth Test'
      });

    if (functionError) {
      console.error('❌ Function error:', functionError.message);
    } else {
      console.log('✅ Function created conversation:', functionResult?.[0]?.conversation_id);
      
      const createdConvId = functionResult?.[0]?.conversation_id;
      
      if (createdConvId) {
        // Test 3: Try to query the conversation back
        console.log('\n3️⃣ Testing conversation query...');
        
        const { data: convQuery, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', createdConvId);

        if (convError) {
          console.error('❌ Query error:', convError.message);
          console.log('   This suggests RLS policies are blocking access');
        } else {
          console.log('✅ Query successful:', convQuery?.length || 0, 'conversations found');
          
          if (convQuery && convQuery.length > 0) {
            const conv = convQuery[0];
            console.log('   Conversation details:');
            console.log('   - ID:', conv.id);
            console.log('   - Student ID:', conv.student_id);
            console.log('   - Educator ID:', conv.educator_id);
            console.log('   - Type:', conv.conversation_type);
            console.log('   - Status:', conv.status);
          }
        }

        // Test 4: Try to send a message
        console.log('\n4️⃣ Testing message creation...');
        
        const { data: msgResult, error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: createdConvId,
            sender_id: student.id,
            sender_type: 'student',
            receiver_id: educator.id,
            receiver_type: 'educator',
            message_text: 'Test message for auth context'
          })
          .select();

        if (msgError) {
          console.error('❌ Message error:', msgError.message);
          console.log('   This suggests RLS policies are blocking message creation');
        } else {
          console.log('✅ Message created successfully');
        }
      }
    }

    // Test 5: Check what the MessageService would see
    console.log('\n5️⃣ Testing MessageService-style queries...');
    
    // This mimics what MessageService.getUserConversations does for educators
    const { data: educatorConvs, error: eduError } = await supabase
      .from('conversations')
      .select(`
        id,
        student_id,
        educator_id,
        class_id,
        subject,
        conversation_type,
        status,
        last_message_at,
        last_message_preview,
        educator_unread_count,
        deleted_by_educator,
        students!inner (
          id,
          name,
          email
        )
      `)
      .eq('educator_id', educator.id)
      .eq('conversation_type', 'student_educator')
      .or('deleted_by_educator.is.null,deleted_by_educator.eq.false');

    if (eduError) {
      console.error('❌ Educator conversations query error:', eduError.message);
    } else {
      console.log(`✅ Educator would see ${educatorConvs?.length || 0} conversations`);
    }

    // This mimics what MessageService.getUserConversations does for students
    const { data: studentConvs, error: stuError } = await supabase
      .from('conversations')
      .select(`
        id,
        student_id,
        educator_id,
        class_id,
        subject,
        conversation_type,
        status,
        last_message_at,
        last_message_preview,
        student_unread_count,
        deleted_by_student,
        school_educators!inner (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('student_id', student.id)
      .eq('conversation_type', 'student_educator')
      .or('deleted_by_student.is.null,deleted_by_student.eq.false');

    if (stuError) {
      console.error('❌ Student conversations query error:', stuError.message);
    } else {
      console.log(`✅ Student would see ${studentConvs?.length || 0} conversations`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAuthContext();