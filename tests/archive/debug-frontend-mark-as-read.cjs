const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugFrontendMarkAsRead() {
  console.log('🔍 Debugging Frontend Mark as Read Behavior...\n');
  
  try {
    // Get current conversations with unread counts
    console.log('📋 Current Conversations with Unread Counts:');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        subject,
        college_admin_unread_count,
        student_unread_count,
        last_message_preview,
        student:students(name, email),
        college:colleges(name, created_by)
      `)
      .eq('conversation_type', 'student_college_admin')
      .eq('deleted_by_college_admin', false)
      .order('last_message_at', { ascending: false });
    
    if (convError) throw convError;
    
    if (conversations) {
      conversations.forEach((conv, index) => {
        console.log(`\n  ${index + 1}. ${conv.id}`);
        console.log(`     Student: ${conv.student?.name || 'Unknown'}`);
        console.log(`     Subject: ${conv.subject}`);
        console.log(`     College Admin Unread: ${conv.college_admin_unread_count}`);
        console.log(`     Student Unread: ${conv.student_unread_count}`);
        console.log(`     Last Message: ${conv.last_message_preview || 'None'}`);
        console.log(`     College Owner: ${conv.college?.created_by}`);
      });
    }
    
    // Find a conversation with unread messages
    const unreadConv = conversations?.find(c => c.college_admin_unread_count > 0);
    if (!unreadConv) {
      console.log('\n❌ No conversations with unread messages found');
      return;
    }
    
    console.log(`\n🧪 Testing Mark as Read for: ${unreadConv.id}`);
    console.log(`Current unread count: ${unreadConv.college_admin_unread_count}`);
    
    const collegeAdminId = unreadConv.college?.created_by;
    console.log(`College Admin ID: ${collegeAdminId}`);
    
    // Simulate the exact same logic as the frontend
    console.log('\n🔄 Simulating Frontend Mark as Read Logic...');
    
    // Step 1: Check if user is college admin (same as messageService.ts)
    console.log('\n1️⃣ Checking College Admin Status...');
    
    // Get conversation details first
    const { data: convDetails, error: convDetailsError } = await supabase
      .from('conversations')
      .select('student_id, recruiter_id, educator_id, school_id, college_id, conversation_type')
      .eq('id', unreadConv.id)
      .single();
    
    if (convDetailsError) throw convDetailsError;
    console.log('Conversation details:', convDetails);
    
    // Check college_lecturers table
    const { data: collegeAdmin, error: collegeAdminError } = await supabase
      .from('college_lecturers')
      .select('user_id, userId')
      .or(`user_id.eq.${collegeAdminId},userId.eq.${collegeAdminId}`)
      .eq('collegeId', convDetails.college_id)
      .single();
    
    console.log('College Admin Check:', collegeAdmin);
    if (collegeAdminError) console.log('College Admin Error:', collegeAdminError.message);
    
    // Check college owner
    const { data: collegeOwner, error: ownerError } = await supabase
      .from('colleges')
      .select('created_by')
      .eq('id', convDetails.college_id)
      .eq('created_by', collegeAdminId)
      .single();
    
    console.log('College Owner Check:', collegeOwner);
    if (ownerError) console.log('Owner Error:', ownerError.message);
    
    const isCollegeAdmin = collegeAdmin || collegeOwner;
    console.log(`Is College Admin: ${!!isCollegeAdmin}`);
    
    if (isCollegeAdmin) {
      console.log('\n2️⃣ Marking Messages as Read...');
      
      // First mark individual messages as read
      const { data: messageUpdate, error: messageError } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', unreadConv.id)
        .eq('receiver_id', collegeAdminId)
        .eq('is_read', false)
        .select('id');
      
      console.log('Messages marked as read:', messageUpdate?.length || 0);
      if (messageError) console.log('Message Error:', messageError);
      
      console.log('\n3️⃣ Updating Conversation Unread Count...');
      
      // Then update conversation unread count
      const { data: convUpdate, error: convUpdateError } = await supabase
        .from('conversations')
        .update({ college_admin_unread_count: 0 })
        .eq('id', unreadConv.id)
        .select('college_admin_unread_count');
      
      console.log('Conversation update result:', convUpdate);
      if (convUpdateError) console.log('Conversation Update Error:', convUpdateError);
      
      if (convUpdate && convUpdate[0].college_admin_unread_count === 0) {
        console.log('✅ SUCCESS: Unread count updated to 0');
      } else {
        console.log('❌ FAILED: Unread count not updated');
      }
      
      // Verify the change
      console.log('\n4️⃣ Verifying Update...');
      const { data: verifyConv, error: verifyError } = await supabase
        .from('conversations')
        .select('college_admin_unread_count')
        .eq('id', unreadConv.id)
        .single();
      
      console.log('Verified unread count:', verifyConv?.college_admin_unread_count);
      if (verifyError) console.log('Verify Error:', verifyError);
      
    } else {
      console.log('❌ User is not detected as college admin - cannot mark as read');
    }
    
  } catch (error) {
    console.error('💥 Debug Error:', error);
  }
}

debugFrontendMarkAsRead();