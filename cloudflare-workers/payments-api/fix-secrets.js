// Run this with: node fix-secrets.js
const { execSync } = require('child_process');

const secrets = {
  'RAZORPAY_KEY_ID': 'rzp_test_RNNqYdwXmbBzxz',
  'RAZORPAY_KEY_SECRET': 'zUYP3rpWcSObKLIrVkPrm94p',
  'TEST_RAZORPAY_KEY_ID': 'rzp_test_RNNqYdwXmbBzxz',
  'TEST_RAZORPAY_KEY_SECRET': 'zUYP3rpWcSObKLIrVkPrm94p',
};

for (const [name, value] of Object.entries(secrets)) {
  console.log(`Setting ${name}...`);
  try {
    // Use stdin to pass the value without shell interpretation
    execSync(`wrangler secret put ${name}`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    console.log(`✅ ${name} set successfully`);
  } catch (error) {
    console.error(`❌ Failed to set ${name}:`, error.message);
  }
}

console.log('\nDone! Now redeploy the worker with: wrangler deploy');
