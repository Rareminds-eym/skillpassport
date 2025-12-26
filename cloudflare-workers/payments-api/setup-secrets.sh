#!/bin/bash
# Setup script for payments-api Cloudflare Worker secrets
# Run this script to configure all required secrets

echo "Setting up payments-api secrets..."
echo "You will be prompted to enter each secret value."
echo ""

# Required secrets
echo "=== Required Secrets ==="
echo ""

echo "1. SUPABASE_URL (e.g., https://your-project.supabase.co)"
wrangler secret put SUPABASE_URL

echo ""
echo "2. SUPABASE_ANON_KEY"
wrangler secret put SUPABASE_ANON_KEY

echo ""
echo "3. SUPABASE_SERVICE_ROLE_KEY"
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

echo ""
echo "4. RAZORPAY_KEY_ID (e.g., rzp_live_xxx or rzp_test_xxx)"
wrangler secret put RAZORPAY_KEY_ID

echo ""
echo "5. RAZORPAY_KEY_SECRET"
wrangler secret put RAZORPAY_KEY_SECRET

echo ""
echo "=== Optional Secrets ==="
read -p "Do you want to set optional secrets? (y/n): " set_optional

if [ "$set_optional" = "y" ] || [ "$set_optional" = "Y" ]; then
    echo ""
    echo "6. RAZORPAY_WEBHOOK_SECRET (for webhook signature verification)"
    wrangler secret put RAZORPAY_WEBHOOK_SECRET

    echo ""
    echo "7. TEST_RAZORPAY_KEY_ID (for test mode)"
    wrangler secret put TEST_RAZORPAY_KEY_ID

    echo ""
    echo "8. TEST_RAZORPAY_KEY_SECRET (for test mode)"
    wrangler secret put TEST_RAZORPAY_KEY_SECRET
fi

echo ""
echo "=== Setup Complete ==="
echo "Run 'npm run deploy' to deploy the worker."
echo "Then verify with: curl https://payments-api.your-subdomain.workers.dev/health"
