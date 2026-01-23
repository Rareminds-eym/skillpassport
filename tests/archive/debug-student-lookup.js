/**
 * Debug script to check student lookup issue
 */

import { supabase } from './src/lib/supabaseClient.ts';

async function debugStudentLookup() {
  console.log('🔍 Debugging Student Lookup Issue...\n');

  try {
    // 1. Get a few applied jobs
    console.log('1. Fetching applied jobs...');
    const { data: appliedJobs, error: appliedJobsError } = await supabase
      .from('applied_jobs')
      .select('id, student_id, opportunity_id, application_status')
      .limit(3);

    if (appliedJobsError) {
      console.error('❌ Error fetching applied jobs:', appliedJobsError);
      return;
    }

    console.log(`✅ Found ${appliedJobs?.length || 0} applied jobs`);
    appliedJobs?.forEach(job => {
      console.log(`  - Job ID: ${job.id}, Student ID: ${job.student_id}`);
    });

    if (!appliedJobs || appliedJobs.length === 0) {
      console.log('No applied jobs found');
      return;
    }

    // 2. Get the student IDs
    const studentIds = appliedJobs.map(job => job.student_id);
    console.log(`\n2. Looking up students with IDs:`, studentIds);

    // 3. Try to find students by ID
    console.log('\n3. Searching students table by ID...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, user_id, name, email, branch_field, course_name, profile')
      .in('id', studentIds);

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
    } else {
      console.log(`✅ Found ${students?.length || 0} students by ID`);
      students?.forEach(student => {
        console.log(`  - Student ID: ${student.id}, Name: ${student.name || 'No name'}, Email: ${student.email || 'No email'}`);
      });
    }

    // 4. Check if there are any students in the table at all
    console.log('\n4. Checking total students in table...');
    const { data: allStudents, error: allStudentsError } = await supabase
      .from('students')
      .select('id, user_id, name, email')
      .limit(5);

    if (allStudentsError) {
      console.error('❌ Error fetching all students:', allStudentsError);
    } else {
      console.log(`✅ Total students sample (first 5):`, allStudents?.length || 0);
      allStudents?.forEach(student => {
        console.log(`  - ID: ${student.id}, User ID: ${student.user_id}, Name: ${student.name || 'No name'}`);
      });
    }

    // 5. Check if the student IDs from applied_jobs exist anywhere in students table
    console.log('\n5. Checking if student IDs exist in any field...');
    for (const studentId of studentIds) {
      // Check by id
      const { data: byId } = await supabase
        .from('students')
        .select('id, user_id, name, email')
        .eq('id', studentId)
        .single();

      // Check by user_id
      const { data: byUserId } = await supabase
        .from('students')
        .select('id, user_id, name, email')
        .eq('user_id', studentId)
        .single();

      console.log(`  Student ID ${studentId}:`);
      console.log(`    - Found by id: ${byId ? 'YES' : 'NO'}`);
      console.log(`    - Found by user_id: ${byUserId ? 'YES' : 'NO'}`);
      
      if (byId) {
        console.log(`    - Data: ${byId.name || 'No name'}, ${byId.email || 'No email'}`);
      } else if (byUserId) {
        console.log(`    - Data: ${byUserId.name || 'No name'}, ${byUserId.email || 'No email'}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugStudentLookup().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});