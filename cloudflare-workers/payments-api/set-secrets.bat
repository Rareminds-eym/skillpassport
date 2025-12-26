@echo off
echo Setting Razorpay secrets for payments-api worker...

echo rzp_test_RNNqYdwXmbBzxz| wrangler secret put RAZORPAY_KEY_ID
echo zUYP3rpWcSObKLIrVkPrm94p| wrangler secret put RAZORPAY_KEY_SECRET
echo rzp_test_RNNqYdwXmbBzxz| wrangler secret put TEST_RAZORPAY_KEY_ID
echo zUYP3rpWcSObKLIrVkPrm94p| wrangler secret put TEST_RAZORPAY_KEY_SECRET

echo Done!
pause
