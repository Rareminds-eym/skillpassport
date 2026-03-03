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
#
# USAGE:
#   Set RAZORPAY_MODE to 'test' to use test credentials, or 'live' for production
# ============================================================================

echo "🔐 Setting up Razorpay secrets for payments-api worker..."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler CLI not found. Install it with: npm install -g wrangler"
    exit 1
fi

# Set RAZORPAY_MODE first
echo "📝 Setting RAZORPAY_MODE (set to 'test' for test mode)..."
echo "test" | wrangler secret put RAZORPAY_MODE

echo ""
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
echo "📝 Setting TEST credentials (used when RAZORPAY_MODE=test)..."
echo ""

# Test Key ID
echo "Setting RAZORPAY_KEY_ID_TEST..."
echo "rzp_test_RNNqYdwXmbBzxz" | wrangler secret put RAZORPAY_KEY_ID_TEST

# Test Secret
echo ""
echo "Setting RAZORPAY_KEY_SECRET_TEST..."
echo "6qF4i00s5fSn0GoSFH220vYL" | wrangler secret put RAZORPAY_KEY_SECRET_TEST

echo ""
echo "✅ All Razorpay secrets configured!"
echo ""
echo "🚀 Now deploy the worker with: npm run deploy"
echo ""
echo "📋 Summary:"
echo "   RAZORPAY_MODE           = test (or live for production)"
echo "   RAZORPAY_KEY_ID         = rzp_live_... (production)"
echo "   RAZORPAY_KEY_SECRET     = *** (production)"
echo "   RAZORPAY_KEY_ID_TEST    = rzp_test_... (test)"
echo "   RAZORPAY_KEY_SECRET_TEST = *** (test)"
