// Test Razorpay API directly
const keyId = 'rzp_test_RNNqYdwXmbBzxz';
const keySecret = 'zUYP3rpWcSObKLIrVkPrm94p';

async function testRazorpay() {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  
  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 100, // 1 rupee in paise
        currency: 'INR',
        receipt: 'test_receipt_123',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRazorpay();
