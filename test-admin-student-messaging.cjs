// Test script to debug admin-student messaging
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAdminStudentMessaging() {
  console.log('🔍 Testing Admin-Student Messaging Setup...');
  
  try {
    // 1. Check if conversations table has the new columns
    console.log('📋 Checking conversations table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing conversations table:', tableError);
      return;
    }
    
    console.log('✅ Conversations table accessible');
    
    // 2. Check if school_id column exists
    const { data: testConv, error: testError } = await supabase
      .from('conversations')
      .select('school_id, admin_unread_count, conversation_type')
      .limit(1);
    
    if (testError) {
      console.error('❌ New columns not found:', testError);
      console.log('💡 You need to run the migration: supabase/migrations/student_admin_messaging.sql');
      return;
    }
    
    console.log('✅ New columns exist in conversations table');
    
    // 3. Check if school_educators table exists and has admins
    const { data: admins, error: adminError } = await supabase
      .from('school_educators')
      .select('id, user_id, school_id, role, schools(id, name)')
      .eq('role', 'school_admin')
      .limit(5);
    
    if (adminError) {
      console.error('❌ Error accessing school_educators:', adminError);
      return;
    }
    
    console.log('👨‍💼 School admins found:', admins?.length || 0);
    if (admins && admins.length > 0) {
      console.log('📋 Sample admin:', admins[0]);
    }
    
    // 4. Check if students table exists
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, email, school_id')
      .limit(5);
    
    if (studentsError) {
      console.error('❌ Error accessing students:', studentsError);
      return;
    }
    
    console.log('👥 Students found:', students?.length || 0);
    if (students && students.length > 0) {
      console.log('📋 Sample student:', students[0]);
    }
    
    // 5. Check if the helper function exists
    const { data: funcTest, error: funcError } = await supabase
      .rpc('get_or_create_student_admin_conversation', {
        p_student_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        p_school_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        p_subject: 'Test'
      });
    
    if (funcError && !funcError.message.includes('violates foreign key constraint')) {
      console.error('❌ Helper function not found:', funcError);
      console.log('💡 You need to run the migration: supabase/migrations/student_admin_messaging.sql');
      return;
    }
    
    console.log('✅ Helper function exists');
    
    // 6. Check messages table constraints
    const { data: msgTest, error: msgError } = await supabase
      .from('messages')
      .select('sender_type, receiver_type')
      .limit(1);
    
    if (msgError) {
      console.error('❌ Error accessing messages table:', msgError);
      return;
    }
    
    console.log('✅ Messages table accessible');
    
    console.log('\n🎉 All checks passed! The system should work.');
    console.log('\n📋 Summary:');
    console.log('- Conversations table: ✅');
    console.log('- New columns: ✅');
    console.log('- School admins: ✅');
    console.log('- Students: ✅');
    console.log('- Helper function: ✅');
    console.log('- Messages table: ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAdminStudentMessaging();