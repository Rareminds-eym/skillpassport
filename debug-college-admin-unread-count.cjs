const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugCollegeAdminUnreadCount() {
  console.log('🔍 Debugging College Admin Unread Count Issue...\n');
  
  try {
    // First, let's check what conversations exist
    console.log('💬 Getting All College Admin Conversations...');
    const { data: allConversations, error: allConvError } = await supabase
      .from('conversations')
      .select(`
        *,
        student:students(id, name, email),
        college:colleges(id, name, created_by)
      `)
      .eq('conversation_type', 'student_college_admin')
      .eq('deleted_by_college_admin', false);
    
    console.log('📋 Total Conversations:', allConversations?.length || 0);
    if (allConvError) console.log('❌ Conversation Error:', allConvError);
    
    if (allConversations && allConversations.length > 0) {
      console.log('\n📨 Conversation Details:');
      allConversations.forEach((conv, index) => {
        console.log(`\n  Conversation ${index + 1}:`);
        console.log('    ID:', conv.id);
        console.log('    Student:', conv.student?.name || 'Unknown');
        console.log('    College:', conv.college?.name || 'Unknown');
        console.log('    College ID:', conv.college_id);
        console.log('    College Owner:', conv.college?.created_by);
        console.log('    Subject:', conv.subject);
        console.log('    College Admin Unread Count:', conv.college_admin_unread_count);
        console.log('    Student Unread Count:', conv.student_unread_count);
        console.log('    Last Message:', conv.last_message_preview);
      });
      
      // Check college_lecturers table
      console.log('\n🎓 Checking College Lecturers Table...');
      const { data: allLecturers, error: lecturerError } = await supabase
        .from('college_lecturers')
        .select('*');
      
      console.log('👨‍🏫 Total Lecturers:', allLecturers?.length || 0);
      if (lecturerError) console.log('❌ Lecturer Error:', lecturerError);
      
      if (allLecturers) {
        allLecturers.forEach((lecturer, index) => {
          console.log(`\n  Lecturer ${index + 1}:`);
          console.log('    ID:', lecturer.id);
          console.log('    User ID:', lecturer.user_id || lecturer.userId);
          console.log('    College ID:', lecturer.collegeId || lecturer.college_id);
          console.log('    Name:', lecturer.name);
          console.log('    Email:', lecturer.email);
        });
      }
      
      // Test the markConversationAsRead logic for each conversation
      const testConv = allConversations.find(c => c.college_admin_unread_count > 0);
      if (testConv) {
        console.log(`\n🧪 Testing Mark as Read Logic for Conversation: ${testConv.id}`);
        console.log('College ID:', testConv.college_id);
        console.log('College Owner:', testConv.college?.created_by);
        
        // Test with the college owner ID
        const testUserId = testConv.college?.created_by;
        if (testUserId) {
          console.log(`\n🔍 Testing with User ID: ${testUserId}`);
          
          // Test college_lecturers lookup (this is the problematic part)
          console.log('\n1️⃣ Testing College Lecturers Lookup...');
          const { data: testLecturer, error: testLecturerError } = await supabase
            .from('college_lecturers')
            .select('user_id, userId')
            .or(`user_id.eq.${testUserId},userId.eq.${testUserId}`)
            .or(`collegeId.eq.${testConv.college_id},college_id.eq.${testConv.college_id}`)
            .single();
          
          console.log('   Result:', testLecturer);
          if (testLecturerError) console.log('   Error:', testLecturerError.message);
          
          // Test college owner lookup
          console.log('\n2️⃣ Testing College Owner Lookup...');
          const { data: testOwner, error: testOwnerError } = await supabase
            .from('colleges')
            .select('created_by')
            .eq('id', testConv.college_id)
            .eq('created_by', testUserId)
            .single();
          
          console.log('   Result:', testOwner);
          if (testOwnerError) console.log('   Error:', testOwnerError.message);
          
          // Determine if user should be able to mark as read
          const isCollegeAdmin = testLecturer || testOwner;
          console.log(`\n✅ Is College Admin: ${!!isCollegeAdmin}`);
          
          if (isCollegeAdmin) {
            console.log('\n📝 User should be able to mark as read');
            
            // Test the actual update
            console.log('\n🔄 Testing Unread Count Update...');
            const { data: updateResult, error: updateError } = await supabase
              .from('conversations')
              .update({ college_admin_unread_count: 0 })
              .eq('id', testConv.id)
              .select();
            
            console.log('   Update Result:', updateResult);
            if (updateError) console.log('   Update Error:', updateError);
          } else {
            console.log('\n❌ User cannot mark as read - not detected as college admin');
          }
        }
      } else {
        console.log('\nℹ️ No conversations with unread messages found for testing');
      }
    }
    
  } catch (error) {
    console.error('💥 Debug Error:', error);
  }
}

debugCollegeAdminUnreadCount();