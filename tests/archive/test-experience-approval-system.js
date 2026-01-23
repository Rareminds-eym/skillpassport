/**
 * Test Experience Approval System
 * Verify the complete experience approval workflow
 */

import { supabase } from './src/lib/supabaseClient.js';

const testExperienceApprovalSystem = async () => {
  console.log('🧪 Testing Experience Approval System...');
  
  const testSchoolId = '69cf3489-0046-4414-8acc-409174ffbd2c'; // St. Joseph High School
  const testStudentId = 'ab46b2ac-9922-4569-adc6-73eb6b645202'; // Meera Krishnan
  
  try {
    // Test 1: Check current pending experiences
    console.log('\n📋 Test 1: Getting pending school experiences...');
    const { data: pendingExperiences, error: pendingError } = await supabase.rpc('get_pending_school_experiences', {
      input_school_id: testSchoolId
    });
    
    if (pendingError) {
      console.error('❌ Error getting pending experiences:', pendingError);
    } else {
      console.log(`✅ Found ${pendingExperiences.length} pending experiences`);
      pendingExperiences.forEach((exp, i) => {
        console.log(`   ${i + 1}. ${exp.student_name}: "${exp.role}" at ${exp.organization} (${exp.approval_authority})`);
      });
    }
    
    // Test 2: Create a new school experience
    console.log('\n🏫 Test 2: Creating school experience...');
    const { data: schoolExp, error: schoolExpError } = await supabase
      .from('experience')
      .insert({
        student_id: testStudentId,
        organization: 'St. Joseph High School',
        role: 'Student Council President',
        start_date: '2024-09-01',
        end_date: '2025-06-01',
        duration: '9 months',
        approval_status: 'pending'
      })
      .select('id, organization, approval_authority')
      .single();
    
    if (schoolExpError) {
      console.error('❌ Error creating school experience:', schoolExpError);
    } else {
      console.log(`✅ School experience created: ${schoolExp.organization} → ${schoolExp.approval_authority}`);
    }
    
    // Test 3: Create a new external experience
    console.log('\n🌐 Test 3: Creating external experience...');
    const { data: externalExp, error: externalExpError } = await supabase
      .from('experience')
      .insert({
        student_id: testStudentId,
        organization: 'Microsoft Corporation',
        role: 'Software Development Intern',
        start_date: '2024-06-01',
        end_date: '2024-08-01',
        duration: '2 months',
        approval_status: 'pending'
      })
      .select('id, organization, approval_authority')
      .single();
    
    if (externalExpError) {
      console.error('❌ Error creating external experience:', externalExpError);
    } else {
      console.log(`✅ External experience created: ${externalExp.organization} → ${externalExp.approval_authority}`);
    }
    
    // Test 4: Check notifications created
    console.log('\n🔔 Test 4: Checking experience notifications...');
    const { data: notifications, error: notifError } = await supabase
      .from('training_notifications')
      .select('*')
      .not('experience_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (notifError) {
      console.error('❌ Error getting notifications:', notifError);
    } else {
      console.log(`✅ Found ${notifications.length} experience notifications`);
      notifications.forEach((notif, i) => {
        console.log(`   ${i + 1}. ${notif.recipient_type}: ${notif.message}`);
      });
    }
    
    // Test 5: Check database functions exist
    console.log('\n🔧 Test 5: Checking experience functions...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .in('routine_name', [
        'get_pending_school_experiences',
        'approve_experience',
        'reject_experience',
        'set_experience_approval_authority',
        'notify_experience_submission'
      ]);
    
    if (funcError) {
      console.error('❌ Error checking functions:', funcError);
    } else {
      console.log(`✅ Found ${functions.length}/5 required functions`);
      functions.forEach(func => {
        console.log(`   ✓ ${func.routine_name}`);
      });
    }
    
    console.log('\n🎉 Experience Approval System Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`   • Pending School Experiences: ${pendingExperiences?.length || 0}`);
    console.log(`   • Experience Notifications: ${notifications?.length || 0}`);
    console.log(`   • Database Functions: ${functions?.length || 0}/5`);
    console.log(`   • School Experience Routing: ${schoolExp?.approval_authority || 'N/A'}`);
    console.log(`   • External Experience Routing: ${externalExp?.approval_authority || 'N/A'}`);
    
    if (functions?.length === 5 && schoolExp?.approval_authority === 'school_admin' && externalExp?.approval_authority === 'rareminds_admin') {
      console.log('\n✅ Experience Approval System is FULLY FUNCTIONAL!');
    } else {
      console.log('\n⚠️  System needs attention - check the issues above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testExperienceApprovalSystem();