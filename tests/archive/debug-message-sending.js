// Debug script to test message sending and identify the 400 error
console.log('🔍 Debugging message sending error...');

// Test data structure that would be sent
const testMessageData = {
  conversation_id: 'conv_se_test_123',
  sender_id: 'student-uuid-123',
  sender_type: 'student',
  receiver_id: 'educator-uuid-456',
  receiver_type: 'educator',
  message_text: 'Hello, I have a question about homework.',
  application_id: undefined,
  opportunity_id: undefined,
  class_id: 'class-uuid-789', // This might be the issue - needs to be valid UUID
  subject: 'Math',
  attachments: undefined
};

console.log('📋 Test message data structure:');
console.log(JSON.stringify(testMessageData, null, 2));

console.log('\n🔍 Potential issues:');
console.log('1. class_id might not be a valid UUID format');
console.log('2. sender_id or receiver_id might not exist in database');
console.log('3. conversation_id might not exist');
console.log('4. Database constraints might be failing');

console.log('\n✅ Solutions to try:');
console.log('1. Ensure class_id is a valid UUID or null');
console.log('2. Add better error handling and logging');
console.log('3. Check if all referenced IDs exist in database');
console.log('4. Validate data before sending to database');

// Check what fields are being sent vs what's expected
console.log('\n📊 Expected vs Actual fields:');
console.log('Expected: conversation_id (string), sender_id (UUID), sender_type (string)');
console.log('Expected: receiver_id (UUID), receiver_type (string), message_text (string)');
console.log('Expected: class_id (UUID or null), subject (string or null)');

console.log('\n🚨 Most likely cause: class_id format mismatch');
console.log('Database expects UUID, but we might be sending string ID');