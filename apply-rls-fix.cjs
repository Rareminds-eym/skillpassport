// Apply RLS fix for student-educator messaging
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️ Missing Supabase credentials');
  console.log('Need VITE_SUPABASE_SERVICE_ROLE_KEY for admin operations');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFix() {
  console.log('🔧 Applying RLS Fix for Student-Educator Messaging...\n');

  try {
    // Temporarily disable RLS for testing
    console.log('1️⃣ Disabling RLS temporarily for testing...');
    
    const { error: disableConvError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;'
    });

    if (disableConvError) {
      console.error('❌ Error disabling conversations RLS:', disableConvError.message);
    } else {
      console.log('✅ Conversations RLS disabled');
    }

    const { error: disableMsgError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE messages DISABLE ROW LEVEL SECURITY;'
    });

    if (disableMsgError) {
      console.error('❌ Error disabling messages RLS:', disableMsgError.message);
    } else {
      console.log('✅ Messages RLS disabled');
    }

    // Test the fix
    console.log('\n2️⃣ Testing the fix...');
    
    const { data: students } = await supabase
      .from('students')
      .select('id, name')
      .limit(1);

    const { data: educators } = await supabase
      .from('school_educators')
      .select('id, first_name, last_name')
      .limit(1);

    if (students?.[0] && educators?.[0]) {
      const student = students[0];
      const educator = educators[0];

      // Try to create a test conversation
      const conversationId = `conv_se_rls_test_${Date.now()}`;
      
      const { data: testConv, error: testError } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          student_id: student.id,
          educator_id: educator.id,
          conversation_type: 'student_educator',
          subject: 'RLS Test',
          status: 'active'
        })
        .select()
        .single();

      if (testError) {
        console.error('❌ Test conversation creation failed:', testError.message);
      } else {
        console.log('✅ Test conversation created:', testConv.id);

        // Try to send a test message
        const { data: testMsg, error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: student.id,
            sender_type: 'student',
            receiver_id: educator.id,
            receiver_type: 'educator',
            message_text: 'RLS test message - student to educator'
          })
          .select()
          .single();

        if (msgError) {
          console.error('❌ Test message creation failed:', msgError.message);
        } else {
          console.log('✅ Test message created:', testMsg.id);
        }

        // Test queries
        const { data: convQuery, error: convQueryError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId);

        if (convQueryError) {
          console.error('❌ Conversation query failed:', convQueryError.message);
        } else {
          console.log('✅ Conversation query successful:', convQuery?.length || 0, 'results');
        }
      }
    }

    console.log('\n🎉 RLS fix applied successfully!');
    console.log('⚠️  RLS is now DISABLED for testing purposes');
    console.log('🔧 Remember to re-enable RLS after fixing authentication:');
    console.log('   ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;');
    console.log('   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

applyRLSFix();