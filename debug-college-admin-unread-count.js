import { supabase } from './src/lib/supabaseClient.js';

async function debugCollegeAdminUnreadCount() {
  console.log('🔍 Debugging College Admin Unread Count Issue...\n');
  
  try {
    // Get current user (assuming Aditya is logged in)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    console.log('👤 Current User:', user?.email, 'ID:', user?.id);
    
    // Check if user is a college admin
    console.log('\n🏫 Checking College Admin Status...');
    
    // Method 1: Check college_lecturers table
    const { data: lecturerData, error: lecturerError } = await supabase
      .from('college_lecturers')
      .select('*')
      .or(`user_id.eq.${user.id},userId.eq.${user.id}`);
    
    console.log('📚 College Lecturers Data:', lecturerData);
    if (lecturerError) console.log('❌ Lecturer Error:', lecturerError);
    
    // Method 2: Check if user is college owner
    const { data: collegeOwnerData, error: ownerError } = await supabase
      .from('colleges')
      .select('*')
      .eq('created_by', user.id);
    
    console.log('🏛️ College Owner Data:', collegeOwnerData);
    if (ownerError) console.log('❌ Owner Error:', ownerError);
    
    // Get college ID for this admin
    let collegeId = null;
    if (lecturerData && lecturerData.length > 0) {
      collegeId = lecturerData[0].collegeId || lecturerData[0].college_id;
    } else if (collegeOwnerData && collegeOwnerData.length > 0) {
      collegeId = collegeOwnerData[0].id;
    }
    
    console.log('\n🆔 College ID:', collegeId);
    
    if (!collegeId) {
      console.log('❌ No college found for this user!');
      return;
    }
    
    // Get conversations for this college
    console.log('\n💬 Getting Conversations...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        student:students(id, name, email)
      `)
      .eq('college_id', collegeId)
      .eq('conversation_type', 'student_college_admin')
      .eq('deleted_by_college_admin', false);
    
    console.log('📋 Conversations:', conversations?.length || 0);
    if (convError) console.log('❌ Conversation Error:', convError);
    
    // Show conversations with unread counts
    if (conversations) {
      conversations.forEach((conv, index) => {
        console.log(`\n📨 Conversation ${index + 1}:`);
        console.log('  ID:', conv.id);
        console.log('  Student:', conv.student?.name || 'Unknown');
        console.log('  Subject:', conv.subject);
        console.log('  College Admin Unread Count:', conv.college_admin_unread_count);
        console.log('  Student Unread Count:', conv.student_unread_count);
        console.log('  Last Message:', conv.last_message_preview);
      });
    }
    
    // Test marking a conversation as read
    if (conversations && conversations.length > 0) {
      const testConv = conversations.find(c => c.college_admin_unread_count > 0);
      if (testConv) {
        console.log(`\n🧪 Testing Mark as Read for Conversation: ${testConv.id}`);
        console.log('Before - Unread Count:', testConv.college_admin_unread_count);
        
        // Simulate the markConversationAsRead logic
        console.log('\n🔍 Testing College Admin Detection...');
        
        // Check college_lecturers table
        const { data: testLecturer, error: testLecturerError } = await supabase
          .from('college_lecturers')
          .select('user_id, userId')
          .or(`user_id.eq.${user.id},userId.eq.${user.id}`)
          .or(`collegeId.eq.${collegeId},college_id.eq.${collegeId}`)
          .single();
        
        console.log('🎓 Lecturer Check Result:', testLecturer);
        if (testLecturerError) console.log('❌ Lecturer Check Error:', testLecturerError);
        
        // Check college owner
        const { data: testOwner, error: testOwnerError } = await supabase
          .from('colleges')
          .select('created_by')
          .eq('id', collegeId)
          .eq('created_by', user.id)
          .single();
        
        console.log('👑 Owner Check Result:', testOwner);
        if (testOwnerError) console.log('❌ Owner Check Error:', testOwnerError);
        
        // Try to update the unread count
        if (testLecturer || testOwner) {
          console.log('\n✅ User is College Admin - Updating unread count...');
          const { data: updateResult, error: updateError } = await supabase
            .from('conversations')
            .update({ college_admin_unread_count: 0 })
            .eq('id', testConv.id)
            .select();
          
          console.log('📝 Update Result:', updateResult);
          if (updateError) console.log('❌ Update Error:', updateError);
        } else {
          console.log('❌ User is NOT detected as College Admin!');
        }
      } else {
        console.log('ℹ️ No conversations with unread messages found');
      }
    }
    
  } catch (error) {
    console.error('💥 Debug Error:', error);
  }
}

debugCollegeAdminUnreadCount();