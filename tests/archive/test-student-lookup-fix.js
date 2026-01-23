/**
 * Test script to verify student lookup fix in ApplicationTracking
 * This script tests the improved student data fetching logic
 */

import { supabase } from './src/lib/supabaseClient.js';

async function testStudentLookup() {
  console.log('🔍 Testing Student Lookup Fix...\n');

  try {
    // 1. Get some applied jobs
    console.log('1. Fetching applied jobs...');
    const { data: appliedJobs, error: appliedJobsError } = await supabase
      .from('applied_jobs')
      .select('id, student_id, opportunity_id, application_status')
      .limit(5);

    if (appliedJobsError) {
      console.error('❌ Error fetching applied jobs:', appliedJobsError);
      return;
    }

    console.log(`✅ Found ${appliedJobs?.length || 0} applied jobs`);
    if (appliedJobs && appliedJobs.length > 0) {
      console.log('Sample applied job:', appliedJobs[0]);
    }

    // 2. Get unique student IDs
    const studentIds = [...new Set(appliedJobs?.map(job => job.student_id) || [])];
    console.log(`\n2. Looking up ${studentIds.length} unique student IDs:`, studentIds);

    // 3. Try lookup by user_id (primary method)
    console.log('\n3. Looking up students by user_id...');
    const { data: studentsByUserId, error: userIdError } = await supabase
      .from('students')
      .select('id, user_id, name, email, branch_field, course_name, profile')
      .in('user_id', studentIds);

    if (userIdError) {
      console.error('❌ Error fetching students by user_id:', userIdError);
    } else {
      console.log(`✅ Found ${studentsByUserId?.length || 0} students by user_id`);
      if (studentsByUserId && studentsByUserId.length > 0) {
        console.log('Sample student by user_id:', {
          id: studentsByUserId[0].id,
          user_id: studentsByUserId[0].user_id,
          name: studentsByUserId[0].name,
          email: studentsByUserId[0].email
        });
      }
    }

    // 4. Try lookup by id (fallback method)
    console.log('\n4. Looking up students by id (fallback)...');
    const { data: studentsById, error: idError } = await supabase
      .from('students')
      .select('id, user_id, name, email, branch_field, course_name, profile')
      .in('id', studentIds);

    if (idError) {
      console.error('❌ Error fetching students by id:', idError);
    } else {
      console.log(`✅ Found ${studentsById?.length || 0} students by id`);
      if (studentsById && studentsById.length > 0) {
        console.log('Sample student by id:', {
          id: studentsById[0].id,
          user_id: studentsById[0].user_id,
          name: studentsById[0].name,
          email: studentsById[0].email
        });
      }
    }

    // 5. Test the combined lookup logic
    console.log('\n5. Testing combined lookup logic...');
    const allStudents = [...(studentsByUserId || []), ...(studentsById || [])];
    const studentMap = allStudents.reduce((acc, student) => {
      // Map both user_id and id to handle different reference patterns
      acc[student.user_id] = student;
      if (student.id !== student.user_id) {
        acc[student.id] = student;
      }
      return acc;
    }, {});

    console.log('Student map keys:', Object.keys(studentMap));
    console.log('Applied jobs student_ids:', studentIds);

    // 6. Test the mapping
    console.log('\n6. Testing student mapping...');
    appliedJobs?.forEach(job => {
      const student = studentMap[job.student_id];
      if (student) {
        console.log(`✅ Found student for job ${job.id}: ${student.name || student.profile?.name || 'Unknown'}`);
      } else {
        console.log(`❌ No student found for job ${job.id} with student_id: ${job.student_id}`);
      }
    });

    // 7. Summary
    console.log('\n📊 Summary:');
    console.log(`- Applied jobs: ${appliedJobs?.length || 0}`);
    console.log(`- Unique student IDs: ${studentIds.length}`);
    console.log(`- Students found by user_id: ${studentsByUserId?.length || 0}`);
    console.log(`- Students found by id: ${studentsById?.length || 0}`);
    console.log(`- Total unique students in map: ${Object.keys(studentMap).length}`);

    const matchedJobs = appliedJobs?.filter(job => studentMap[job.student_id]).length || 0;
    const unmatchedJobs = (appliedJobs?.length || 0) - matchedJobs;
    
    console.log(`- Jobs with matched students: ${matchedJobs}`);
    console.log(`- Jobs with unmatched students: ${unmatchedJobs}`);

    if (unmatchedJobs === 0) {
      console.log('\n🎉 All applied jobs have matching student data!');
    } else {
      console.log('\n⚠️  Some applied jobs still have missing student data.');
      console.log('This might indicate data inconsistency in the database.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStudentLookup().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});