// Test Razorpay credentials
const keyId = 'rzp_test_RNNqYdwXmbBzxz';
const keySecret = 'zUYP3rpWcSObKLIrVkPrm94p';

const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

fetch('https://api.razorpay.com/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 25000,
    currency: 'INR',
    receipt: 'test_receipt_123',
  }),
})
  .then(res => {
    console.log('Status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Response:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Error:', err.message);
  });
