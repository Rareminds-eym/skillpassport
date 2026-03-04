@echo off
echo Setting Razorpay secrets for payments-api worker...

echo test| wrangler secret put RAZORPAY_MODE
echo rzp_live_xxxxx| wrangler secret put RAZORPAY_KEY_ID
echo your_live_secret| wrangler secret put RAZORPAY_KEY_SECRET
echo rzp_test_RNNqYdwXmbBzxz| wrangler secret put RAZORPAY_KEY_ID_TEST
echo zUYP3rpWcSObKLIrVkPrm94p| wrangler secret put RAZORPAY_KEY_SECRET_TEST

echo Done!
pause
