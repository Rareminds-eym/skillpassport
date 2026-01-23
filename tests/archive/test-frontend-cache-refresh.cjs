const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testFrontendCacheRefresh() {
  console.log('🔍 Testing Frontend Cache Refresh Issue...\n');
  
  try {
    // Get the college ID for Aditya College
    const collegeId = 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d';
    console.log('College ID:', collegeId);
    
    // Simulate the exact query that the frontend uses
    console.log('\n📋 Simulating Frontend Query (Active Conversations)...');
    const { data: activeConversations, error: activeError } = await supabase
      .from('conversations')
      .select(`
        *,
        student:students(id, name, email, university, branch_field),
        college:colleges(id, name)
      `)
      .eq('college_id', collegeId)
      .eq('conversation_type', 'student_college_admin')
      .eq('deleted_by_college_admin', false)
      .order('last_message_at', { ascending: false, nullsFirst: false });
    
    if (activeError) throw activeError;
    
    console.log(`Found ${activeConversations?.length || 0} conversations`);
    
    if (activeConversations) {
      activeConversations.forEach((conv, index) => {
        console.log(`\n  ${index + 1}. ${conv.student?.name || 'Unknown'}`);
        console.log(`     ID: ${conv.id}`);
        console.log(`     Subject: ${conv.subject}`);
        console.log(`     College Admin Unread: ${conv.college_admin_unread_count}`);
        console.log(`     Student Unread: ${conv.student_unread_count}`);
        console.log(`     Last Message: ${conv.last_message_preview || 'None'}`);
        console.log(`     Updated At: ${conv.updated_at}`);
      });
    }
    
    // Check if there are any conversations with unread counts > 0
    const unreadConversations = activeConversations?.filter(c => c.college_admin_unread_count > 0) || [];
    console.log(`\n📊 Conversations with unread messages: ${unreadConversations.length}`);
    
    if (unreadConversations.length > 0) {
      console.log('\n🔄 These conversations still show unread counts:');
      unreadConversations.forEach((conv, index) => {
        console.log(`  ${index + 1}. ${conv.student?.name}: ${conv.college_admin_unread_count} unread`);
      });
      
      // Try to manually clear one of them
      const testConv = unreadConversations[0];
      console.log(`\n🧪 Manually clearing unread count for: ${testConv.id}`);
      
      const { data: clearResult, error: clearError } = await supabase
        .from('conversations')
        .update({ 
          college_admin_unread_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', testConv.id)
        .select();
      
      console.log('Clear result:', clearResult);
      if (clearError) console.log('Clear error:', clearError);
      
      // Wait a moment and check again
      console.log('\n⏳ Waiting 2 seconds and checking again...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: recheckConversations, error: recheckError } = await supabase
        .from('conversations')
        .select(`
          id,
          college_admin_unread_count,
          student_unread_count,
          updated_at,
          student:students(name)
        `)
        .eq('college_id', collegeId)
        .eq('conversation_type', 'student_college_admin')
        .eq('deleted_by_college_admin', false)
        .order('last_message_at', { ascending: false, nullsFirst: false });
      
      if (recheckError) throw recheckError;
      
      console.log('\n📋 After Manual Clear:');
      recheckConversations?.forEach((conv, index) => {
        console.log(`  ${index + 1}. ${conv.student?.name}: College Admin Unread = ${conv.college_admin_unread_count}, Student Unread = ${conv.student_unread_count}`);
        console.log(`      Updated: ${conv.updated_at}`);
      });
      
    } else {
      console.log('\n✅ All conversations show 0 unread count in database');
      console.log('The issue might be in frontend caching or real-time updates');
    }
    
    // Check if there are any messages that should be marked as read
    console.log('\n📨 Checking Individual Messages...');
    const { data: unreadMessages, error: msgError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_type,
        receiver_id,
        is_read,
        created_at,
        message_text
      `)
      .in('conversation_id', activeConversations?.map(c => c.id) || [])
      .eq('is_read', false)
      .eq('receiver_id', '91bf6be4-31a5-4d6a-853d-675596755cee'); // College admin ID
    
    if (msgError) throw msgError;
    
    console.log(`Found ${unreadMessages?.length || 0} unread messages for college admin`);
    
    if (unreadMessages && unreadMessages.length > 0) {
      console.log('\n📝 Unread Messages:');
      unreadMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. Conversation: ${msg.conversation_id}`);
        console.log(`     From: ${msg.sender_type}`);
        console.log(`     Message: ${msg.message_text}`);
        console.log(`     Created: ${msg.created_at}`);
      });
      
      // Mark all these messages as read
      console.log('\n🔄 Marking all unread messages as read...');
      const { data: markResult, error: markError } = await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('receiver_id', '91bf6be4-31a5-4d6a-853d-675596755cee')
        .eq('is_read', false)
        .select('id, conversation_id');
      
      console.log('Marked messages:', markResult?.length || 0);
      if (markError) console.log('Mark error:', markError);
      
      // Recalculate unread counts for all conversations
      console.log('\n🔢 Recalculating Unread Counts...');
      for (const conv of activeConversations || []) {
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('receiver_id', '91bf6be4-31a5-4d6a-853d-675596755cee')
          .eq('is_read', false);
        
        if (countError) {
          console.log(`Error counting for ${conv.id}:`, countError);
          continue;
        }
        
        const actualUnreadCount = count || 0;
        console.log(`${conv.student?.name}: DB shows ${conv.college_admin_unread_count}, actual unread messages: ${actualUnreadCount}`);
        
        if (actualUnreadCount !== conv.college_admin_unread_count) {
          console.log(`  🔄 Updating ${conv.id} from ${conv.college_admin_unread_count} to ${actualUnreadCount}`);
          await supabase
            .from('conversations')
            .update({ college_admin_unread_count: actualUnreadCount })
            .eq('id', conv.id);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Test Error:', error);
  }
}

testFrontendCacheRefresh();