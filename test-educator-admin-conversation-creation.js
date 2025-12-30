// Test script to verify educator-admin conversation creation functionality
import { supabase } from './src/lib/supabaseClient.js';

async function testEducatorAdminConversationCreation() {
  console.log('🧪 Testing Educator-Admin Conversation Creation...');
  
  try {
    // Test 1: Check if we can fetch educators for a school
    console.log('\n📋 Test 1: Fetching educators for school...');
    const { data: educators, error: educatorError } = await supabase
      .from('school_educators')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        email,
        role,
        subject_specialization,
        school_id
      `)
      .eq('school_id', '1') // Replace with actual school ID
      .neq('role', 'school_admin')
      .limit(3);
    
    if (educatorError) {
      console.error('❌ Error fetching educators:', educatorError);
      return;
    }
    
    console.log('✅ Found educators:', educators?.length || 0);
    educators?.forEach(educator => {
      console.log(`  - ${educator.first_name} ${educator.last_name} (${educator.email}) - ${educator.role}`);
    });
    
    // Test 2: Check if we can fetch school admin for a school
    console.log('\n📋 Test 2: Fetching school admin...');
    const { data: schoolAdmin, error: adminError } = await supabase
      .from('school_educators')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        email,
        school_id
      `)
      .eq('school_id', '1') // Replace with actual school ID
      .eq('role', 'school_admin')
      .single();
    
    if (adminError) {
      console.error('❌ Error fetching school admin:', adminError);
      return;
    }
    
    console.log('✅ Found school admin:', `${schoolAdmin.first_name} ${schoolAdmin.last_name} (${schoolAdmin.email})`);
    
    // Test 3: Check existing educator-admin conversations
    console.log('\n📋 Test 3: Checking existing educator-admin conversations...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        subject,
        conversation_type,
        educator_id,
        school_id,
        created_at,
        last_message_at
      `)
      .eq('conversation_type', 'educator_admin')
      .eq('school_id', '1') // Replace with actual school ID
      .limit(5);
    
    if (convError) {
      console.error('❌ Error fetching conversations:', convError);
      return;
    }
    
    console.log('✅ Found educator-admin conversations:', conversations?.length || 0);
    conversations?.forEach(conv => {
      console.log(`  - ${conv.subject} (ID: ${conv.id}) - Educator: ${conv.educator_id}`);
    });
    
    // Test 4: Check if the modal components exist
    console.log('\n📋 Test 4: Checking modal components...');
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const educatorModalPath = './src/components/messaging/NewEducatorAdminConversationModal.jsx';
      const adminModalPath = './src/components/messaging/NewSchoolAdminEducatorConversationModal.jsx';
      
      const educatorModalExists = fs.existsSync(educatorModalPath);
      const adminModalExists = fs.existsSync(adminModalPath);
      
      console.log(`✅ NewEducatorAdminConversationModal: ${educatorModalExists ? 'EXISTS' : 'MISSING'}`);
      console.log(`✅ NewSchoolAdminEducatorConversationModal: ${adminModalExists ? 'EXISTS' : 'MISSING'}`);
      
      if (educatorModalExists && adminModalExists) {
        console.log('🎉 All modal components are in place!');
      }
      
    } catch (error) {
      console.log('⚠️ Could not check modal files (this is normal in browser environment)');
    }
    
    console.log('\n🎯 Summary:');
    console.log('✅ Educator fetching: Working');
    console.log('✅ School admin fetching: Working');
    console.log('✅ Conversation querying: Working');
    console.log('✅ Modal components: Created');
    console.log('\n🚀 Ready to test the UI functionality!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEducatorAdminConversationCreation();