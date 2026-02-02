/**
 * Test email formatting fix
 */

const BASE_URL = 'http://localhost:8788/api/user';

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset Email Fix\n');
  
  try {
    // Test password reset - send OTP
    console.log('📧 Testing POST /reset-password (send OTP)...');
    const response = await fetch(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        email: 'test@example.com'
      })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('\n✅ SUCCESS! Email formatting issue is FIXED');
      console.log('   Password reset email sent successfully');
    } else if (response.status === 500) {
      console.log('\n❌ FAILED! Still getting 500 error');
      console.log('   Email formatting issue persists');
    } else {
      console.log(`\n⚠️  Got ${response.status} - Check if this is expected`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testPasswordReset();
