/**
 * Debug script to check why school admin is getting 0 trainings
 */

import { supabase } from './src/lib/supabaseClient.js';

async function debugSchoolAdminTrainings() {
  console.log('🔍 Debugging School Admin Training Fetch');
  console.log('========================================\n');

  try {
    const schoolId = '69cf3489-0046-4414-8acc-409174ffbd2c'; // From your log

    // 1. Check total trainings in database
    console.log('1️⃣ CHECKING TOTAL TRAININGS');
    console.log('---------------------------');
    
    const { data: allTrainings, error: allError } = await supabase
      .from('trainings')
      .select('id, title, organization, approval_status, approval_authority, student_id')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching all trainings:', allError);
      return;
    }

    console.log(`📊 Total trainings in database: ${allTrainings?.length || 0}`);

    // 2. Check approval_authority distribution
    console.log('\n2️⃣ APPROVAL AUTHORITY DISTRIBUTION');
    console.log('-----------------------------------');
    
    const authorityCounts = {};
    const statusCounts = {};
    
    allTrainings?.forEach(training => {
      const authority = training.approval_authority || 'NULL';
      const status = training.approval_status || 'NULL';
      
      authorityCounts[authority] = (authorityCounts[authority] || 0) + 1;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('📋 By approval_authority:');
    Object.entries(authorityCounts).forEach(([authority, count]) => {
      console.log(`   ${authority}: ${count} trainings`);
    });

    console.log('\n📋 By approval_status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} trainings`);
    });

    // 3. Check pending trainings with approval_authority
    console.log('\n3️⃣ PENDING TRAININGS BY AUTHORITY');
    console.log('----------------------------------');
    
    const { data: pendingTrainings, error: pendingError } = await supabase
      .from('trainings')
      .select(`
        id, 
        title, 
        organization, 
        approval_authority, 
        student_id,
        student:students!trainings_student_id_fkey (
          id,
          name,
          student_type,
          school_id,
          university_college_id
        )
      `)
      .eq('approval_status', 'pending');

    if (pendingError) {
      console.error('❌ Error fetching pending trainings:', pendingError);
      return;
    }

    console.log(`📊 Total pending trainings: ${pendingTrainings?.length || 0}`);

    const pendingByAuthority = {};
    pendingTrainings?.forEach(training => {
      const authority = training.approval_authority || 'NULL';
      if (!pendingByAuthority[authority]) {
        pendingByAuthority[authority] = [];
      }
      pendingByAuthority[authority].push(training);
    });

    Object.entries(pendingByAuthority).forEach(([authority, trainings]) => {
      console.log(`\n📋 ${authority}: ${trainings.length} pending trainings`);
      trainings.slice(0, 3).forEach((training, index) => {
        console.log(`   ${index + 1}. ${training.title} (${training.organization})`);
        console.log(`      Student: ${training.student?.name} (${training.student?.student_type})`);
        console.log(`      School ID: ${training.student?.school_id}`);
        console.log(`      College ID: ${training.student?.university_college_id}`);
      });
      if (trainings.length > 3) {
        console.log(`   ... and ${trainings.length - 3} more`);
      }
    });

    // 4. Check specifically for school_admin trainings for this school
    console.log('\n4️⃣ SCHOOL_ADMIN TRAININGS FOR THIS SCHOOL');
    console.log('------------------------------------------');
    
    const schoolAdminTrainings = pendingTrainings?.filter(training => 
      training.approval_authority === 'school_admin' && 
      training.student?.school_id === schoolId
    );

    console.log(`📊 School admin trainings for school ${schoolId}: ${schoolAdminTrainings?.length || 0}`);
    
    if (schoolAdminTrainings?.length > 0) {
      schoolAdminTrainings.forEach((training, index) => {
        console.log(`   ${index + 1}. ${training.title} (${training.organization})`);
        console.log(`      Student: ${training.student?.name}`);
        console.log(`      Authority: ${training.approval_authority}`);
      });
    } else {
      console.log('   ❌ No trainings found for this school admin');
    }

    // 5. Check for Rareminds trainings that should be school_admin
    console.log('\n5️⃣ RAREMINDS TRAININGS ANALYSIS');
    console.log('--------------------------------');
    
    const raremindsTrainings = pendingTrainings?.filter(training => 
      (training.organization || '').toLowerCase() === 'rareminds'
    );

    console.log(`📊 Total Rareminds trainings: ${raremindsTrainings?.length || 0}`);
    
    if (raremindsTrainings?.length > 0) {
      console.log('\n📋 Rareminds trainings breakdown:');
      raremindsTrainings.forEach((training, index) => {
        const studentType = training.student?.student_type;
        const schoolId = training.student?.school_id;
        const collegeId = training.student?.university_college_id;
        
        console.log(`   ${index + 1}. ${training.title}`);
        console.log(`      Student: ${training.student?.name} (${studentType})`);
        console.log(`      School ID: ${schoolId}`);
        console.log(`      College ID: ${collegeId}`);
        console.log(`      Current Authority: ${training.approval_authority}`);
        
        // Determine expected authority
        let expectedAuthority = 'rareminds_admin';
        if (studentType === 'college_student' && collegeId) {
          expectedAuthority = 'college_admin';
        } else if (schoolId) {
          expectedAuthority = 'school_admin';
        }
        
        console.log(`      Expected Authority: ${expectedAuthority}`);
        
        if (training.approval_authority !== expectedAuthority) {
          console.log(`      ⚠️ MISMATCH! Should be ${expectedAuthority}`);
        } else {
          console.log(`      ✅ Correct authority`);
        }
      });
    }

    // 6. Check students in this school
    console.log('\n6️⃣ STUDENTS IN THIS SCHOOL');
    console.log('--------------------------');
    
    const { data: schoolStudents, error: studentsError } = await supabase
      .from('students')
      .select('id, name, student_type, school_id, university_college_id')
      .eq('school_id', schoolId)
      .limit(5);

    if (studentsError) {
      console.error('❌ Error fetching school students:', studentsError);
    } else {
      console.log(`📊 Students in school ${schoolId}: ${schoolStudents?.length || 0}`);
      schoolStudents?.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (${student.student_type})`);
      });
    }

    // 7. Check database triggers
    console.log('\n7️⃣ CHECKING DATABASE TRIGGERS');
    console.log('------------------------------');
    
    const { data: triggers, error: triggerError } = await supabase
      .rpc('check_triggers_exist');

    if (triggerError) {
      console.log('⚠️ Could not check triggers (RPC function might not exist)');
      console.log('💡 This is normal - triggers should still work');
    } else {
      console.log('✅ Trigger check completed');
    }

    // 8. Recommendations
    console.log('\n8️⃣ RECOMMENDATIONS');
    console.log('------------------');
    
    if ((schoolAdminTrainings?.length || 0) === 0) {
      console.log('🔧 POSSIBLE FIXES:');
      
      if ((raremindsTrainings?.length || 0) === 0) {
        console.log('   1. No Rareminds trainings found - create some test data');
        console.log('   2. Students might not have school_id set correctly');
      } else {
        const mismatched = raremindsTrainings?.filter(t => {
          const studentType = t.student?.student_type;
          const schoolId = t.student?.school_id;
          const collegeId = t.student?.university_college_id;
          
          let expectedAuthority = 'rareminds_admin';
          if (studentType === 'college_student' && collegeId) {
            expectedAuthority = 'college_admin';
          } else if (schoolId) {
            expectedAuthority = 'school_admin';
          }
          
          return t.approval_authority !== expectedAuthority;
        });
        
        if (mismatched?.length > 0) {
          console.log('   1. Run SQL fix to update approval_authority for existing records');
          console.log('   2. Database triggers might not be working on existing data');
        } else {
          console.log('   1. All Rareminds trainings are correctly routed to college_admin');
          console.log('   2. This school might not have any school students with Rareminds trainings');
        }
      }
      
      console.log('   3. Check if students have correct student_type (not college_student)');
      console.log('   4. Verify school_id is set correctly for students');
    } else {
      console.log('✅ School admin should see trainings - check frontend filtering');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugSchoolAdminTrainings();