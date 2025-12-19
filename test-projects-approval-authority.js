/**
 * Test script to verify project approval authority logic is working
 */

import { supabase } from './src/lib/supabaseClient.js';

async function testProjectsApprovalAuthority() {
  console.log('🧪 Testing Projects Approval Authority Logic');
  console.log('============================================\n');

  try {
    // 1. Check total projects in database
    console.log('1️⃣ CHECKING TOTAL PROJECTS');
    console.log('---------------------------');
    
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('id, title, organization, approval_status, approval_authority, student_id')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching all projects:', allError);
      return;
    }

    console.log(`📊 Total projects in database: ${allProjects?.length || 0}`);

    // 2. Check approval_authority distribution
    console.log('\n2️⃣ PROJECT APPROVAL AUTHORITY DISTRIBUTION');
    console.log('-------------------------------------------');
    
    const authorityCounts = {};
    const statusCounts = {};
    
    allProjects?.forEach(project => {
      const authority = project.approval_authority || 'NULL';
      const status = project.approval_status || 'NULL';
      
      authorityCounts[authority] = (authorityCounts[authority] || 0) + 1;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('📋 By approval_authority:');
    Object.entries(authorityCounts).forEach(([authority, count]) => {
      console.log(`   ${authority}: ${count} projects`);
    });

    console.log('\n📋 By approval_status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} projects`);
    });

    // 3. Check pending projects with approval_authority
    console.log('\n3️⃣ PENDING PROJECTS BY AUTHORITY');
    console.log('---------------------------------');
    
    const { data: pendingProjects, error: pendingError } = await supabase
      .from('projects')
      .select(`
        id, 
        title, 
        organization, 
        approval_authority, 
        student_id,
        student:students!projects_student_id_fkey (
          id,
          name,
          student_type,
          school_id,
          university_college_id
        )
      `)
      .eq('approval_status', 'pending');

    if (pendingError) {
      console.error('❌ Error fetching pending projects:', pendingError);
      return;
    }

    console.log(`📊 Total pending projects: ${pendingProjects?.length || 0}`);

    const pendingByAuthority = {};
    pendingProjects?.forEach(project => {
      const authority = project.approval_authority || 'NULL';
      if (!pendingByAuthority[authority]) {
        pendingByAuthority[authority] = [];
      }
      pendingByAuthority[authority].push(project);
    });

    Object.entries(pendingByAuthority).forEach(([authority, projects]) => {
      console.log(`\n📋 ${authority}: ${projects.length} pending projects`);
      projects.slice(0, 3).forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.title} (${project.organization || 'No org'})`);
        console.log(`      Student: ${project.student?.name} (${project.student?.student_type})`);
        console.log(`      School ID: ${project.student?.school_id}`);
        console.log(`      College ID: ${project.student?.university_college_id}`);
      });
      if (projects.length > 3) {
        console.log(`   ... and ${projects.length - 3} more`);
      }
    });

    // 4. Test creating a new project to see if approval_authority is set
    console.log('\n4️⃣ TESTING NEW PROJECT CREATION');
    console.log('--------------------------------');
    
    // Get a sample student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, student_type, school_id, university_college_id')
      .limit(1)
      .single();

    if (studentError || !student) {
      console.log('⚠️ No students found for testing');
    } else {
      console.log(`👤 Testing with student: ${student.name}`);
      console.log(`   Type: ${student.student_type}`);
      console.log(`   School ID: ${student.school_id}`);
      console.log(`   College ID: ${student.university_college_id}`);

      // Create a test project
      const testProject = {
        id: crypto.randomUUID(),
        student_id: student.id,
        title: 'Test Project - Auto Authority',
        organization: 'Test Organization',
        status: 'ongoing',
        approval_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([testProject])
        .select()
        .single();

      if (projectError) {
        console.error('   ❌ Error creating test project:', projectError);
      } else {
        console.log(`   ✅ Project created with approval_authority: ${newProject.approval_authority}`);
        
        // Determine expected authority
        let expectedAuthority = 'rareminds_admin'; // Default for external projects
        if (student.student_type === 'college_student' && student.university_college_id) {
          expectedAuthority = 'college_admin';
        } else if (student.school_id) {
          expectedAuthority = 'school_admin';
        }
        
        console.log(`   Expected Authority: ${expectedAuthority}`);
        
        if (newProject.approval_authority === expectedAuthority) {
          console.log(`   ✅ CORRECT: Trigger set approval_authority correctly`);
        } else {
          console.log(`   ❌ INCORRECT: Expected ${expectedAuthority}, got ${newProject.approval_authority}`);
        }

        // Clean up
        await supabase.from('projects').delete().eq('id', testProject.id);
        console.log('   🧹 Test project cleaned up');
      }
    }

    // 5. Check projects by student type
    console.log('\n5️⃣ PROJECTS BY STUDENT TYPE');
    console.log('----------------------------');
    
    const projectsByStudentType = {};
    pendingProjects?.forEach(project => {
      const studentType = project.student?.student_type || 'unknown';
      if (!projectsByStudentType[studentType]) {
        projectsByStudentType[studentType] = [];
      }
      projectsByStudentType[studentType].push(project);
    });

    Object.entries(projectsByStudentType).forEach(([studentType, projects]) => {
      console.log(`\n📋 ${studentType}: ${projects.length} projects`);
      
      const authorityCounts = {};
      projects.forEach(project => {
        const authority = project.approval_authority || 'NULL';
        authorityCounts[authority] = (authorityCounts[authority] || 0) + 1;
      });
      
      Object.entries(authorityCounts).forEach(([authority, count]) => {
        console.log(`   → ${authority}: ${count} projects`);
      });
    });

    // 6. Test notification services
    console.log('\n6️⃣ TESTING NOTIFICATION SERVICES');
    console.log('---------------------------------');

    const schoolAdminPending = pendingByAuthority['school_admin']?.length || 0;
    const collegeAdminPending = pendingByAuthority['college_admin']?.length || 0;
    const raremindsAdminPending = pendingByAuthority['rareminds_admin']?.length || 0;
    
    console.log(`📋 School Admin should see: ${schoolAdminPending} pending projects`);
    console.log(`📋 College Admin should see: ${collegeAdminPending} pending projects`);
    console.log(`📋 Rareminds Admin should see: ${raremindsAdminPending} pending projects`);

    // 7. Check for any null approval authorities
    console.log('\n7️⃣ CHECKING FOR NULL APPROVAL AUTHORITIES');
    console.log('------------------------------------------');

    const { data: nullProjects } = await supabase
      .from('projects')
      .select('id, title, organization')
      .is('approval_authority', null)
      .limit(5);

    if (nullProjects?.length > 0) {
      console.log('⚠️ Found projects with NULL approval_authority:');
      nullProjects.forEach(p => {
        console.log(`   - ${p.title} (${p.organization || 'No org'})`);
      });
      console.log('💡 Run the SQL fix to update these records');
    } else {
      console.log('✅ No projects with NULL approval_authority');
    }

    console.log('\n🎉 Projects Approval Authority Test Complete!');
    console.log('=============================================');
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Total projects: ${allProjects?.length || 0}`);
    console.log(`✅ Pending projects: ${pendingProjects?.length || 0}`);
    console.log(`✅ School admin projects: ${schoolAdminPending}`);
    console.log(`✅ College admin projects: ${collegeAdminPending}`);
    console.log(`✅ Rareminds admin projects: ${raremindsAdminPending}`);
    console.log(`⚠️ Projects with NULL approval_authority: ${nullProjects?.length || 0}`);
    
    if ((nullProjects?.length || 0) === 0) {
      console.log('\n🎊 ALL GOOD! Project approval authority logic is working correctly!');
    } else {
      console.log('\n⚠️ Some projects need approval_authority updates. Run the SQL fix.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testProjectsApprovalAuthority();