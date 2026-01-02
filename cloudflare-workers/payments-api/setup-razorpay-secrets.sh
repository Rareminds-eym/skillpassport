#!/bin/bash
# ============================================================================
# Razorpay Secrets Setup Script for Cloudflare Worker
# ============================================================================
# This script sets up Razorpay credentials as Cloudflare Worker secrets
#
# USAGE:
#   chmod +x setup-razorpay-secrets.sh
#   ./setup-razorpay-secrets.sh
#
# CREDENTIALS:
#   PRODUCTION (skillpassport.rareminds.in):
#     Key ID: rzp_live_Rdz2GR0Pwi4XNQ
#     Secret: zUYP3rpWcSObKLIrVkPrm94p
#
#   TEST (localhost, netlify, dev):
#     Key ID: rzp_test_RNNqYdwXmbBzxz
#     Secret: 6qF4i00s5fSn0GoSFH220vYL
# ============================================================================

echo "🔐 Setting up Razorpay secrets for payments-api worker..."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler CLI not found. Install it with: npm install -g wrangler"
    exit 1
fi

echo "📝 Setting PRODUCTION credentials..."
echo ""

# Production Key ID
echo "Setting RAZORPAY_KEY_ID (production)..."
echo "rzp_live_Rdz2GR0Pwi4XNQ" | wrangler secret put RAZORPAY_KEY_ID

# Production Secret
echo ""
echo "Setting RAZORPAY_KEY_SECRET (production)..."
echo "zUYP3rpWcSObKLIrVkPrm94p" | wrangler secret put RAZORPAY_KEY_SECRET

echo ""
echo "📝 Setting TEST credentials..."
echo ""

# Test Key ID
echo "Setting TEST_RAZORPAY_KEY_ID..."
echo "rzp_test_RNNqYdwXmbBzxz" | wrangler secret put TEST_RAZORPAY_KEY_ID

# Test Secret
echo ""
echo "Setting TEST_RAZORPAY_KEY_SECRET..."
echo "6qF4i00s5fSn0GoSFH220vYL" | wrangler secret put TEST_RAZORPAY_KEY_SECRET

echo ""
echo "✅ All Razorpay secrets configured!"
echo ""
echo "🚀 Now deploy the worker with: npm run deploy"
echo ""
echo "📋 Summary:"
echo "   RAZORPAY_KEY_ID        = rzp_live_... (production)"
echo "   RAZORPAY_KEY_SECRET    = *** (production)"
echo "   TEST_RAZORPAY_KEY_ID   = rzp_test_... (development)"
echo "   TEST_RAZORPAY_KEY_SECRET = *** (development)"
