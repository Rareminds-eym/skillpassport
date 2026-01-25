/**
 * Final test for admin project verification
 * This tests both school and college admin project fetching
 */

import { supabase } from './src/lib/supabaseClient.js';

async function testAdminProjectVerification() {
  console.log('🚀 Testing Admin Project Verification...\n');

  try {
    // Test 1: Check pending projects
    console.log('📊 1. Checking pending projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        approval_authority,
        approval_status,
        student:students!projects_student_id_fkey (
          name,
          student_type,
          school_id,
          college_id,
          university_college_id
        )
      `)
      .eq('approval_status', 'pending');

    if (projectsError) throw projectsError;
    
    console.log(`Found ${projects?.length || 0} pending projects:`);
    projects?.forEach(p => {
      console.log(`  - ${p.title} by ${p.student?.name} (${p.approval_authority})`);
    });

    // Test 2: Test school admin RPC
    console.log('\n🏫 2. Testing school admin RPC...');
    const { data: schoolProjects, error: schoolError } = await supabase.rpc('get_pending_school_projects', {
      input_school_id: '19442d7b-ff7f-4c7f-ad85-9e501f122b26'
    });

    if (schoolError) throw schoolError;
    console.log(`School admin should see ${schoolProjects?.length || 0} projects:`);
    schoolProjects?.forEach(p => {
      console.log(`  - ${p.title} by ${p.student_name}`);
    });

    // Test 3: Test college admin RPC
    console.log('\n🎓 3. Testing college admin RPC...');
    const { data: collegeProjects, error: collegeError } = await supabase.rpc('get_pending_college_projects', {
      input_college_id: 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
    });

    if (collegeError) throw collegeError;
    console.log(`College admin should see ${collegeProjects?.length || 0} projects:`);
    collegeProjects?.forEach(p => {
      console.log(`  - ${p.title} by ${p.student_name}`);
    });

    // Test 4: Check admin mappings
    console.log('\n👥 4. Checking admin user mappings...');
    
    // School admin mapping
    const { data: schoolAdmins, error: schoolAdminError } = await supabase
      .from('school_educators')
      .select(`
        user_id,
        role,
        schools:school_id (name)
      `)
      .eq('school_id', '19442d7b-ff7f-4c7f-ad85-9e501f122b26')
      .eq('role', 'school_admin');

    if (!schoolAdminError) {
      console.log(`School admins for ABC School: ${schoolAdmins?.length || 0}`);
      schoolAdmins?.forEach(admin => {
        console.log(`  - User ID: ${admin.user_id} (${admin.schools?.name})`);
      });
    }

    // College admin mapping
    const { data: collegeAdmins, error: collegeAdminError } = await supabase
      .from('college_lecturers')
      .select(`
        user_id,
        colleges:collegeId (name)
      `)
      .eq('collegeId', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d');

    if (!collegeAdminError) {
      console.log(`College admins for Aditya College: ${collegeAdmins?.length || 0}`);
      collegeAdmins?.forEach(admin => {
        console.log(`  - User ID: ${admin.user_id} (${admin.colleges?.name})`);
      });
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Total pending projects: ${projects?.length || 0}`);
    console.log(`- School admin projects: ${schoolProjects?.length || 0}`);
    console.log(`- College admin projects: ${collegeProjects?.length || 0}`);
    console.log(`- School admins configured: ${schoolAdmins?.length || 0}`);
    console.log(`- College admins configured: ${collegeAdmins?.length || 0}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAdminProjectVerification();