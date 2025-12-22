const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCollegeAdminUnreadFix() {
  console.log('🧪 Testing College Admin Unread Count Fix...\n');
  
  try {
    // Get a conversation with unread messages
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('conversation_type', 'student_college_admin')
      .gt('college_admin_unread_count', 0)
      .limit(1);
    
    if (convError) throw convError;
    
    if (!conversations || conversations.length === 0) {
      console.log('ℹ️ No conversations with unread messages found');
      return;
    }
    
    const testConv = conversations[0];
    console.log('📨 Testing Conversation:', testConv.id);
    console.log('College ID:', testConv.college_id);
    console.log('Current Unread Count:', testConv.college_admin_unread_count);
    
    // Get the college owner (who should be able to mark as read)
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('created_by')
      .eq('id', testConv.college_id)
      .single();
    
    if (collegeError) throw collegeError;
    
    const userId = college.created_by;
    console.log('Testing with User ID:', userId);
    
    // Test the FIXED college admin lookup
    console.log('\n🔍 Testing FIXED College Admin Lookup...');
    const { data: collegeAdmin, error: collegeAdminError } = await supabase
      .from('college_lecturers')
      .select('user_id, userId')
      .or(`user_id.eq.${userId},userId.eq.${userId}`)
      .eq('collegeId', testConv.college_id)
      .single();
    
    console.log('College Admin Result:', collegeAdmin);
    if (collegeAdminError) console.log('College Admin Error:', collegeAdminError.message);
    
    // Test college owner lookup (fallback)
    const { data: collegeOwner, error: ownerError } = await supabase
      .from('colleges')
      .select('created_by')
      .eq('id', testConv.college_id)
      .eq('created_by', userId)
      .single();
    
    console.log('College Owner Result:', collegeOwner);
    if (ownerError) console.log('Owner Error:', ownerError.message);
    
    // Determine if user can mark as read
    const canMarkAsRead = collegeAdmin || collegeOwner;
    console.log(`\n✅ Can Mark as Read: ${!!canMarkAsRead}`);
    
    if (canMarkAsRead) {
      console.log('\n📝 Updating unread count...');
      
      // First, set it to a non-zero value to test
      await supabase
        .from('conversations')
        .update({ college_admin_unread_count: 5 })
        .eq('id', testConv.id);
      
      console.log('Set unread count to 5');
      
      // Now test marking as read
      const { data: updateResult, error: updateError } = await supabase
        .from('conversations')
        .update({ college_admin_unread_count: 0 })
        .eq('id', testConv.id)
        .select('college_admin_unread_count');
      
      console.log('Mark as read result:', updateResult);
      if (updateError) console.log('Update Error:', updateError);
      
      if (updateResult && updateResult[0].college_admin_unread_count === 0) {
        console.log('✅ SUCCESS: Unread count successfully updated to 0');
      } else {
        console.log('❌ FAILED: Unread count not updated properly');
      }
    } else {
      console.log('❌ User cannot mark as read');
    }
    
  } catch (error) {
    console.error('💥 Test Error:', error);
  }
}

testCollegeAdminUnreadFix();