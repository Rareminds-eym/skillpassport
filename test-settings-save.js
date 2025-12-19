/**
 * Test Settings Save
 * Paste this in browser console while logged in to test settings save
 */

// Test notification settings save
async function testNotificationSave() {
  console.log('🧪 Testing notification settings save...');
  
  // Get current user email
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) {
    console.error('❌ No user email found in localStorage');
    return;
  }
  
  console.log('📧 User email:', userEmail);
  
  // Import the service
  const { updateStudentSettings } = await import('./src/services/studentSettingsService.js');
  
  // Test data - turn OFF recruiting messages
  const testSettings = {
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: true,
      applicationUpdates: true,
      newOpportunities: true,
      recruitingMessages: false, // ← Turn this OFF
      weeklyDigest: false,
      monthlyReport: false,
    }
  };
  
  console.log('💾 Saving test settings:', testSettings);
  
  // Save
  const result = await updateStudentSettings(userEmail, testSettings);
  
  console.log('📊 Save result:', result);
  
  if (result.success) {
    console.log('✅ Settings saved successfully!');
    console.log('📋 Returned data:', result.data);
    console.log('🔍 Notification settings:', result.data?.notificationSettings);
    console.log('🔍 recruitingMessages value:', result.data?.notificationSettings?.recruitingMessages);
  } else {
    console.error('❌ Save failed:', result.error);
  }
}

// Test privacy settings save
async function testPrivacySave() {
  console.log('🧪 Testing privacy settings save...');
  
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) {
    console.error('❌ No user email found in localStorage');
    return;
  }
  
  console.log('📧 User email:', userEmail);
  
  const { updateStudentSettings } = await import('./src/services/studentSettingsService.js');
  
  // Test data - turn OFF show email
  const testSettings = {
    privacySettings: {
      profileVisibility: 'public',
      showEmail: false, // ← Turn this OFF
      showPhone: false,
      showLocation: true,
      allowRecruiterContact: true,
      showInTalentPool: true,
    }
  };
  
  console.log('💾 Saving test settings:', testSettings);
  
  const result = await updateStudentSettings(userEmail, testSettings);
  
  console.log('📊 Save result:', result);
  
  if (result.success) {
    console.log('✅ Settings saved successfully!');
    console.log('📋 Returned data:', result.data);
    console.log('🔍 Privacy settings:', result.data?.privacySettings);
    console.log('🔍 showEmail value:', result.data?.privacySettings?.showEmail);
  } else {
    console.error('❌ Save failed:', result.error);
  }
}

// Run tests
console.log('🎯 Settings Save Test Functions Loaded');
console.log('Run: testNotificationSave() or testPrivacySave()');
