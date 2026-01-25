#!/bin/bash
# Verify Live Credentials Update

echo "=========================================="
echo "Verifying Razorpay Live Credentials"
echo "=========================================="
echo ""

# Health check
echo "1. Checking worker health..."
curl -s https://payments-api.dark-mode-d021.workers.dev/health | jq '.'
echo ""

# Test with production origin
echo "2. Testing with production origin (should use LIVE credentials)..."
curl -X POST https://payments-api.dark-mode-d021.workers.dev/create-event-order \
  -H "Content-Type: application/json" \
  -H "Origin: https://skillpassport.rareminds.in" \
  -d '{
    "amount": 100,
    "currency": "INR",
    "planName": "Test - Live Credentials",
    "userEmail": "test@example.com",
    "userName": "Test User",
    "userPhone": "9876543210",
    "campaign": "test-live",
    "origin": "https://skillpassport.rareminds.in"
  }' | jq '.'
echo ""

echo "3. Testing with development origin (should use TEST credentials)..."
curl -X POST https://payments-api.dark-mode-d021.workers.dev/create-event-order \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "amount": 100,
    "currency": "INR",
    "planName": "Test - Test Credentials",
    "userEmail": "test@example.com",
    "userName": "Test User",
    "userPhone": "9876543210",
    "campaign": "test-dev",
    "origin": "http://localhost:3000"
  }' | jq '.'
echo ""

echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""
echo "Check the logs above:"
echo "- Health check should show all secrets configured"
echo "- Production origin should create order with live credentials"
echo "- Development origin should create order with test credentials"
echo ""
echo "Look for these in worker logs:"
echo "  [CREATE-EVENT] Using PRODUCTION credentials"
echo "  [CREATE-EVENT] Using TEST credentials"
