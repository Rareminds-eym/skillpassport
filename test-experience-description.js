/**
 * Test script to verify experience description field functionality
 * This script tests that the description field is properly stored and fetched
 */

import { updateExperienceByEmail, getStudentByEmail } from './src/services/studentServiceProfile.js';

const testExperienceDescription = async () => {
  console.log('🧪 Testing Experience Description Field...\n');

  // Test email (replace with actual test student email)
  const testEmail = 'test.student@example.com';

  // Test experience data with description
  const testExperienceData = [
    {
      id: 'test-exp-1',
      role: 'Software Developer Intern',
      organization: 'Tech Company Inc.',
      start_date: '2024-01-15',
      end_date: '2024-06-15',
      description: 'Worked on developing web applications using React and Node.js. Collaborated with senior developers on various projects and gained experience in agile development methodologies.',
      duration: '6 months',
      verified: false,
      approval_status: 'pending'
    },
    {
      id: 'test-exp-2',
      role: 'Marketing Assistant',
      organization: 'Digital Marketing Agency',
      start_date: '2023-06-01',
      end_date: '2023-12-31',
      description: 'Assisted in creating social media campaigns and analyzing marketing metrics. Helped increase client engagement by 25% through targeted content strategies.',
      duration: '7 months',
      verified: false,
      approval_status: 'pending'
    }
  ];

  try {
    console.log('📝 Step 1: Updating experience data with descriptions...');
    const updateResult = await updateExperienceByEmail(testEmail, testExperienceData);
    
    if (!updateResult.success) {
      console.error('❌ Failed to update experience:', updateResult.error);
      return;
    }
    
    console.log('✅ Experience data updated successfully');

    console.log('\n📖 Step 2: Fetching student data to verify description storage...');
    const fetchResult = await getStudentByEmail(testEmail);
    
    if (!fetchResult.success) {
      console.error('❌ Failed to fetch student data:', fetchResult.error);
      return;
    }

    const studentData = fetchResult.data;
    const experienceData = studentData.experience || [];

    console.log('\n🔍 Step 3: Verifying description fields...');
    
    if (experienceData.length === 0) {
      console.log('⚠️  No experience data found');
      return;
    }

    let allDescriptionsPresent = true;
    
    experienceData.forEach((exp, index) => {
      console.log(`\n📋 Experience ${index + 1}:`);
      console.log(`   Role: ${exp.role}`);
      console.log(`   Organization: ${exp.organization}`);
      console.log(`   Description: ${exp.description || 'NOT FOUND'}`);
      
      if (!exp.description) {
        allDescriptionsPresent = false;
        console.log('   ❌ Description field is missing or empty');
      } else {
        console.log('   ✅ Description field is present');
      }
    });

    console.log('\n📊 Test Results:');
    if (allDescriptionsPresent) {
      console.log('✅ All experience records have description fields');
      console.log('✅ Experience description functionality is working correctly');
    } else {
      console.log('❌ Some experience records are missing description fields');
      console.log('❌ Experience description functionality needs fixing');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
};

// Export for use in other scripts
export { testExperienceDescription };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testExperienceDescription();
}