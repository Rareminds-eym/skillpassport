/**
 * Test script to verify student activity service
 * Run with: node --loader ./node_modules/@esbuild-kit/esm-loader test-student-activities.js
 * Or just paste this in browser console after importing the service
 */

import { getStudentRecentActivity } from './src/services/studentActivityService.js';

// Test with a student email
const testEmail = 'student@example.com'; // Replace with actual student email

console.log('🧪 Testing Student Activity Service...');
console.log('📧 Testing with email:', testEmail);

getStudentRecentActivity(testEmail, 10)
  .then(result => {
    console.log('\n✅ Test Results:');
    console.log('================');
    console.log('Success:', !result.error);
    console.log('Activities found:', result.data.length);
    console.log('\n📋 Activities:');
    result.data.forEach((activity, i) => {
      console.log(`\n${i + 1}. ${activity.user} ${activity.action} ${activity.candidate}`);
      console.log(`   Type: ${activity.type}`);
      console.log(`   Time: ${activity.timestamp}`);
      console.log(`   Details: ${activity.details || 'N/A'}`);
    });
    
    if (result.data.length === 0) {
      console.log('\n⚠️ No activities found. This could mean:');
      console.log('   1. Student has no recruitment activities yet');
      console.log('   2. Student email not found in database');
      console.log('   3. No data in recruitment tables (shortlists, offers, etc.)');
    }
  })
  .catch(error => {
    console.error('\n❌ Test Failed:');
    console.error(error);
  });

