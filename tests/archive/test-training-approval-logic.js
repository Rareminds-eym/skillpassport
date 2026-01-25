// Test Training Approval Logic
import { supabase } from './src/lib/supabaseClient.js';

async function testTrainingApprovalLogic() {
  console.log('🧪 Testing Training Approval Logic...\n');

  try {
    // Test 1: Create a training with Rareminds provider for a school student
    console.log('Test 1: Rareminds training for school student');
    const schoolStudentTraining = {
      student_id: 'test-school-student-id', // Replace with actual school student ID
      title: 'Advanced JavaScript Course',
      organization: 'Rareminds',
      start_date: '2024-01-01',
      end_date: '2024-03-01',
      status: 'completed',
      source: 'manual',
      approval_status: 'pending'
    };

    console.log('Expected approval_authority: school_admin');
    
    // Test 2: Create a training with Rareminds provider for a college student
    console.log('\nTest 2: Rareminds training for college student');
    const collegeStudentTraining = {
      student_id: 'test-college-student-id', // Replace with actual college student ID
      title: 'React Development Bootcamp',
      organization: 'Rareminds',
      start_date: '2024-02-01',
      end_date: '2024-04-01',
      status: 'ongoing',
      source: 'manual',
      approval_status: 'pending'
    };

    console.log('Expected approval_authority: college_admin');

    // Test 3: Create a training with external provider
    console.log('\nTest 3: External provider training');
    const externalTraining = {
      student_id: 'test-student-id', // Any student
      title: 'Machine Learning Specialization',
      organization: 'Coursera',
      start_date: '2024-01-15',
      end_date: '2024-06-15',
      status: 'ongoing',
      source: 'manual',
      approval_status: 'pending'
    };

    console.log('Expected approval_authority: rareminds_admin');

    // Test the approval authority determination logic
    console.log('\n📋 Approval Authority Logic:');
    console.log('1. If provider === "Rareminds":');
    console.log('   - College student → college_admin');
    console.log('   - School student → school_admin');
    console.log('   - Other → rareminds_admin');
    console.log('2. If provider !== "Rareminds":');
    console.log('   - Always → rareminds_admin');

    // Test notification routing
    console.log('\n📬 Notification Routing:');
    console.log('- school_admin: Notifications go to school_id');
    console.log('- college_admin: Notifications go to college_id');
    console.log('- rareminds_admin: Global notifications');

    console.log('\n✅ Training approval logic test completed!');

  } catch (error) {
    console.error('❌ Error testing training approval logic:', error);
  }
}

// Function to determine approval authority (client-side logic for testing)
function determineApprovalAuthority(provider, studentType, hasSchoolId, hasCollegeId) {
  if (provider?.toLowerCase() === 'rareminds') {
    if (studentType === 'college_student' && hasCollegeId) {
      return 'college_admin';
    } else if (hasSchoolId) {
      return 'school_admin';
    } else {
      return 'rareminds_admin';
    }
  } else {
    return 'rareminds_admin';
  }
}

// Test the logic function
console.log('\n🧪 Testing approval authority determination:');
console.log('Rareminds + college student + has college:', determineApprovalAuthority('Rareminds', 'college_student', false, true));
console.log('Rareminds + school student + has school:', determineApprovalAuthority('Rareminds', 'school_student', true, false));
console.log('Coursera + any student:', determineApprovalAuthority('Coursera', 'college_student', true, true));
console.log('Udemy + any student:', determineApprovalAuthority('Udemy', 'school_student', true, false));

testTrainingApprovalLogic();