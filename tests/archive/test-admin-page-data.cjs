const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAdminPageData() {
  console.log('🔍 Testing Admin Page Data Flow...\n');
  
  try {
    // Step 1: Get admin user and school
    console.log('1️⃣ Getting admin user and school...');
    const { data: adminData, error: adminError } = await supabase
      .from('school_educators')
      .select('user_id, school_id, schools(id, name)')
      .eq('role', 'school_admin')
      .eq('school_id', '19442d7b-ff7f-4c7f-ad85-9e501f122b26')
      .single();
    
    if (adminError) {
      console.error('❌ Admin error:', adminError);
      return;
    }
    
    console.log('✅ Admin found:', adminData);
    const schoolId = adminData.school_id;
    const adminUserId = adminData.user_id;
    
    // Step 2: Test the exact query the component uses
    console.log('\n2️⃣ Testing active conversations query...');
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
      .order('last_message_at', { ascending: false, nullsFirst: false });
    
    if (activeError) {
      console.error('❌ Active conversations error:', activeError);
      return;
    }
    
    console.log(`✅ Found ${activeConversations.length} active conversations`);
    
    if (activeConversations.length > 0) {
      console.log('\n📋 Conversation details:');
      activeConversations.forEach((conv, index) => {
        console.log(`\n${index + 1}. Conversation ID: ${conv.id}`);
        console.log(`   Student: ${conv.student?.name || 'N/A'} (${conv.student?.email || 'N/A'})`);
        console.log(`   Subject: ${conv.subject || 'N/A'}`);
        console.log(`   Last message: ${conv.last_message_at || 'Never'}`);
        console.log(`   Preview: ${conv.last_message_preview || 'N/A'}`);
        console.log(`   Admin unread: ${conv.admin_unread_count || 0}`);
        console.log(`   School ID: ${conv.school_id}`);
        console.log(`   Deleted by admin: ${conv.deleted_by_admin}`);
      });
      
      // Step 3: Test message fetching for first conversation
      const firstConv = activeConversations[0];
      console.log(`\n3️⃣ Testing messages for conversation: ${firstConv.id}`);
      
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', firstConv.id)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        console.error('❌ Messages error:', messagesError);
      } else {
        console.log(`✅ Found ${messages.length} messages`);
        messages.forEach((msg, index) => {
          console.log(`   ${index + 1}. ${msg.sender_type}: ${msg.message_text.substring(0, 50)}...`);
        });
      }
    } else {
      console.log('❌ No conversations found for this admin');
    }
    
    // Step 4: Check if there are conversations for other schools
    console.log('\n4️⃣ Checking conversations for other schools...');
    const { data: allStudentAdminConvs, error: allError } = await supabase
      .from('conversations')
      .select('school_id, count(*)')
      .eq('conversation_type', 'student_admin')
      .group('school_id');
    
    if (allError) {
      console.error('❌ All conversations error:', allError);
    } else {
      console.log('📊 Conversations by school:');
      allStudentAdminConvs.forEach(row => {
        console.log(`   School ${row.school_id}: ${row.count} conversations`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAdminPageData();