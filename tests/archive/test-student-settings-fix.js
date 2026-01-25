/**
 * Test script to verify the student settings numeric field fix
 * Run this in browser console on the student settings page
 */

console.log('🧪 Testing Student Settings Numeric Field Fix...\n');

// Test the updateStudentSettings function with empty numeric fields
async function testStudentSettingsFix() {
  try {
    // Import the service
    const { updateStudentSettings } = await import('./src/services/studentSettingsService.js');
    
    // Get current user email (assuming you're logged in)
    const userEmail = 'test@example.com'; // Replace with actual email
    
    // Test data with empty numeric fields
    const testUpdates = {
      name: 'Test User',
      age: '', // Empty string - should become null
      pincode: '', // Empty string - should become null
      currentCgpa: '', // Empty string - should become null
      phone: '', // Empty string - should become null
      alternatePhone: '', // Empty string - should become null
      guardianPhone: '', // Empty string - should become null
      location: 'Test City',
      state: 'Test State'
    };
    
    console.log('📤 Sending update with empty numeric fields:', testUpdates);
    
    const result = await updateStudentSettings(userEmail, testUpdates);
    
    if (result.success) {
      console.log('✅ Update successful! No numeric field errors.');
      console.log('📥 Updated data:', result.data);
    } else {
      console.log('❌ Update failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Alternative test using the hook (if available)
async function testWithHook() {
  try {
    console.log('🔄 Testing with useStudentSettings hook...');
    
    // This would be used in a React component context
    // const { updateProfile } = useStudentSettings(userEmail);
    
    console.log('💡 To test with hook, use this in your Settings component:');
    console.log(`
    const testEmptyFields = async () => {
      try {
        await updateProfile({
          age: '',
          pincode: '',
          currentCgpa: '',
          phone: '',
          alternatePhone: '',
          guardianPhone: ''
        });
        console.log('✅ Hook test successful!');
      } catch (error) {
        console.error('❌ Hook test failed:', error);
      }
    };
    `);
    
  } catch (error) {
    console.error('❌ Hook test setup failed:', error);
  }
}

// Run the tests
console.log('🚀 Starting tests...\n');
testStudentSettingsFix();
testWithHook();

console.log('\n📋 Fix Summary:');
console.log('- Empty strings for numeric fields (age, pincode, currentCgpa) are now converted to null');
console.log('- Empty strings for phone fields are also converted to null');
console.log('- This prevents PostgreSQL "invalid input syntax for type numeric" errors');
console.log('\n💡 The fix is in src/services/studentSettingsService.js');