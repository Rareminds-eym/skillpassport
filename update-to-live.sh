#!/bin/bash
# Quick script to update Razorpay credentials to LIVE

echo "=========================================="
echo "Update Razorpay Credentials to LIVE"
echo "=========================================="
echo ""
echo "This script will guide you through updating your"
echo "Cloudflare worker to use LIVE Razorpay credentials."
echo ""
echo "Prerequisites:"
echo "  1. You have your LIVE Razorpay credentials ready"
echo "  2. You are logged in to wrangler (wrangler login)"
echo "  3. You are in the project root directory"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Navigate to worker directory
cd cloudflare-workers/payments-api || {
  echo "Error: Could not find cloudflare-workers/payments-api directory"
  exit 1
}

echo "=========================================="
echo "Step 1: Update LIVE Credentials"
echo "=========================================="
echo ""
echo "Setting RAZORPAY_KEY_ID (LIVE)..."
echo "Paste your LIVE Key ID (starts with rzp_live_):"
wrangler secret put RAZORPAY_KEY_ID

echo ""
echo "Setting RAZORPAY_KEY_SECRET (LIVE)..."
echo "Paste your LIVE Key Secret:"
wrangler secret put RAZORPAY_KEY_SECRET

echo ""
echo "=========================================="
echo "Step 2: Keep TEST Credentials (Optional)"
echo "=========================================="
echo ""
read -p "Do you want to set TEST credentials for development? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "Setting TEST_RAZORPAY_KEY_ID..."
  echo "Paste your TEST Key ID (starts with rzp_test_):"
  wrangler secret put TEST_RAZORPAY_KEY_ID

  echo ""
  echo "Setting TEST_RAZORPAY_KEY_SECRET..."
  echo "Paste your TEST Key Secret:"
  wrangler secret put TEST_RAZORPAY_KEY_SECRET
fi

echo ""
echo "=========================================="
echo "Step 3: Verify Update"
echo "=========================================="
echo ""
echo "Checking worker health..."
curl -s https://payments-api.dark-mode-d021.workers.dev/health | jq '.'

echo ""
echo "=========================================="
echo "Update Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Run: ./verify-live-credentials.sh"
echo "  2. Test payment flow on production site"
echo "  3. Monitor worker logs: wrangler tail payments-api"
echo "  4. Check Razorpay dashboard for payments"
echo ""
echo "Documentation: LIVE_CREDENTIALS_UPDATE_GUIDE.md"
echo ""
