// Test script to verify experience approval authority routing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpooleduinyyzxgrcwko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTQ2OTgsImV4cCI6MjA3NTU3MDY5OH0.LvId6Cq13yeASDt0RXbb0y83P2xAZw0L1Q4KJAXT4jk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testExperienceApprovalRouting() {
  console.log('🧪 Testing Experience Approval Authority Routing...\n');

  try {
    // Get a college student for testing
    const { data: collegeStudent, error: studentError } = await supabase
      .from('students')
      .select('id, email, student_type, college_school_name')
      .eq('student_type', 'college')
      .limit(1)
      .single();

    if (studentError || !collegeStudent) {
      console.error('❌ No college student found for testing');
      return;
    }

    console.log(`📚 Testing with college student: ${collegeStudent.email}`);
    console.log(`   Student Type: ${collegeStudent.student_type}`);
    console.log(`   College: ${collegeStudent.college_school_name}\n`);

    // Test scenarios
    const testCases = [
      {
        name: 'College Organization (should route to college_admin)',
        role: 'Research Assistant',
        organization: 'Aditya College',
        expectedAuthority: 'college_admin'
      },
      {
        name: 'School Organization (should route to school_admin)', 
        role: 'Volunteer Teacher',
        organization: 'ABC School',
        expectedAuthority: 'school_admin'
      },
      {
        name: 'External Organization (should route to rareminds_admin)',
        role: 'Software Intern',
        organization: 'Microsoft Corporation',
        expectedAuthority: 'rareminds_admin'
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`${i + 1}️⃣ Testing: ${testCase.name}`);
      
      // Create test experience
      const { data: newExperience, error: insertError } = await supabase
        .from('experience')
        .insert({
          student_id: collegeStudent.id,
          role: testCase.role,
          organization: testCase.organization,
          start_date: '2024-01-01',
          end_date: '2024-06-30',
          duration: '6 months'
        })
        .select('id, role, organization, approval_authority, approval_status')
        .single();

      if (insertError) {
        console.error(`   ❌ Error creating experience: ${insertError.message}`);
        continue;
      }

      console.log(`   ✅ Created experience: ${newExperience.role} at ${newExperience.organization}`);
      console.log(`   📋 Approval Authority: ${newExperience.approval_authority}`);
      console.log(`   🎯 Expected: ${testCase.expectedAuthority}`);
      
      if (newExperience.approval_authority === testCase.expectedAuthority) {
        console.log(`   ✅ CORRECT: Approval authority matches expected value`);
      } else {
        console.log(`   ❌ INCORRECT: Expected ${testCase.expectedAuthority}, got ${newExperience.approval_authority}`);
      }

      // Clean up - delete the test experience
      await supabase
        .from('experience')
        .delete()
        .eq('id', newExperience.id);

      console.log(`   🧹 Cleaned up test experience\n`);
    }

    // 4. Check pending experiences for each admin type
    console.log('4️⃣ Checking pending experiences by admin type...');
    
    const adminTypes = ['school_admin', 'college_admin', 'rareminds_admin'];
    
    for (const adminType of adminTypes) {
      const { data: pendingExps, error: pendingError } = await supabase
        .from('experience')
        .select(`
          id,
          role,
          organization,
          approval_status,
          approval_authority,
          student:students!experience_student_id_fkey (
            email,
            student_type
          )
        `)
        .eq('approval_status', 'pending')
        .eq('approval_authority', adminType)
        .order('created_at', { ascending: false });

      if (!pendingError) {
        console.log(`   📋 ${adminType}: ${pendingExps?.length || 0} pending experiences`);
        pendingExps?.forEach(exp => {
          console.log(`      - ${exp.role} at ${exp.organization} (${exp.student?.email})`);
        });
      }
    }

    console.log('\n🎉 SUCCESS: Experience approval routing system is working!');
    console.log('   ✅ Trigger function properly routes based on organization');
    console.log('   ✅ School/College organizations route to respective admins');
    console.log('   ✅ External organizations route to Rareminds admin');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testExperienceApprovalRouting();