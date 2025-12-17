/**
 * Test script to verify experience fetching functionality
 * Run this to test if the SchoolAdminNotificationService.getPendingExperiences works
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (you'll need to replace with your actual values)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test the getPendingExperiences function
async function testGetPendingExperiences() {
  console.log('🧪 Testing getPendingExperiences function...');
  
  try {
    // Test with St. Joseph High School ID
    const schoolId = '69cf3489-0046-4414-8acc-409174ffbd2c';
    
    console.log(`📋 Fetching pending experiences for school: ${schoolId}`);
    
    const { data, error } = await supabase.rpc('get_pending_school_experiences', {
      input_school_id: schoolId
    });

    if (error) {
      console.error('❌ Error fetching experiences:', error);
      return;
    }

    console.log('✅ Successfully fetched experiences:');
    console.log(`📊 Found ${data?.length || 0} pending experiences`);
    
    if (data && data.length > 0) {
      data.forEach((experience, index) => {
        console.log(`\n📝 Experience ${index + 1}:`);
        console.log(`   Student: ${experience.student_name} (${experience.student_email})`);
        console.log(`   Role: ${experience.role}`);
        console.log(`   Organization: ${experience.organization}`);
        console.log(`   Duration: ${experience.duration}`);
        console.log(`   Status: ${experience.approval_status}`);
        console.log(`   Authority: ${experience.approval_authority}`);
        console.log(`   Created: ${new Date(experience.created_at).toLocaleDateString()}`);
      });
    } else {
      console.log('📭 No pending experiences found');
    }

    // Test with ABC School ID
    const abcSchoolId = '19442d7b-ff7f-4c7f-ad85-9e501f122b26';
    console.log(`\n📋 Fetching pending experiences for ABC School: ${abcSchoolId}`);
    
    const { data: abcData, error: abcError } = await supabase.rpc('get_pending_school_experiences', {
      input_school_id: abcSchoolId
    });

    if (abcError) {
      console.error('❌ Error fetching ABC School experiences:', abcError);
      return;
    }

    console.log(`📊 Found ${abcData?.length || 0} pending experiences for ABC School`);
    
    if (abcData && abcData.length > 0) {
      abcData.forEach((experience, index) => {
        console.log(`\n📝 ABC School Experience ${index + 1}:`);
        console.log(`   Student: ${experience.student_name} (${experience.student_email})`);
        console.log(`   Role: ${experience.role}`);
        console.log(`   Organization: ${experience.organization}`);
        console.log(`   Duration: ${experience.duration}`);
      });
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Test the service class method
async function testServiceMethod() {
  console.log('\n🔧 Testing SchoolAdminNotificationService.getPendingExperiences...');
  
  try {
    // Import the service (adjust path as needed)
    const { SchoolAdminNotificationService } = await import('./src/services/schoolAdminNotificationService.js');
    
    const schoolId = '69cf3489-0046-4414-8acc-409174ffbd2c';
    const experiences = await SchoolAdminNotificationService.getPendingExperiences(schoolId);
    
    console.log('✅ Service method works correctly');
    console.log(`📊 Service returned ${experiences?.length || 0} experiences`);
    
    if (experiences && experiences.length > 0) {
      console.log('📝 First experience from service:');
      console.log(`   Student: ${experiences[0].student_name}`);
      console.log(`   Role: ${experiences[0].role}`);
      console.log(`   Organization: ${experiences[0].organization}`);
    }
    
  } catch (error) {
    console.error('❌ Service method error:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Experience Fetching Tests\n');
  
  await testGetPendingExperiences();
  await testServiceMethod();
  
  console.log('\n✨ Tests completed!');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testGetPendingExperiences, testServiceMethod };