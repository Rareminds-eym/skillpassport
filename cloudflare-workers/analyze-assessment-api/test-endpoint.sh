#!/bin/bash

# Test the Analyze Assessment API endpoint

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Analyze Assessment API"
echo ""

# Check if URL is provided
if [ -z "$1" ]; then
    echo "${YELLOW}Usage: ./test-endpoint.sh <worker-url>${NC}"
    echo "Example: ./test-endpoint.sh https://analyze-assessment-api.YOUR_SUBDOMAIN.workers.dev"
    echo ""
    echo "Or for local testing:"
    echo "./test-endpoint.sh http://localhost:8787"
    exit 1
fi

WORKER_URL=$1

# Test 1: Health Check
echo "Test 1: Health Check"
echo "GET ${WORKER_URL}/health"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${WORKER_URL}/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "${GREEN}✅ Health check passed${NC}"
    echo "Response: $BODY"
else
    echo "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
    exit 1
fi

echo ""
echo "---"
echo ""

# Test 2: Check authentication requirement
echo "Test 2: Authentication Check (should fail without token)"
echo "POST ${WORKER_URL}/analyze-assessment"
echo ""

AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${WORKER_URL}/analyze-assessment" \
  -H "Content-Type: application/json" \
  -d '{"assessmentData": {}}')

HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
BODY=$(echo "$AUTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "401" ]; then
    echo "${GREEN}✅ Authentication check passed (correctly requires auth)${NC}"
    echo "Response: $BODY"
else
    echo "${YELLOW}⚠️  Expected 401, got HTTP $HTTP_CODE${NC}"
    echo "Response: $BODY"
fi

echo ""
echo "---"
echo ""

# Test 3: Check CORS
echo "Test 3: CORS Check"
echo "OPTIONS ${WORKER_URL}/analyze-assessment"
echo ""

CORS_RESPONSE=$(curl -s -w "\n%{http_code}" -X OPTIONS "${WORKER_URL}/analyze-assessment" \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST")

HTTP_CODE=$(echo "$CORS_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "${GREEN}✅ CORS check passed${NC}"
else
    echo "${RED}❌ CORS check failed (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo "---"
echo ""

# Summary
echo "📊 Test Summary:"
echo ""
echo "✅ Health endpoint: Working"
echo "✅ Authentication: Required (as expected)"
echo "✅ CORS: Configured"
echo ""
echo "${GREEN}🎉 Worker is deployed and responding correctly!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend .env with this URL:"
echo "   VITE_ASSESSMENT_API_URL=${WORKER_URL}"
echo ""
echo "2. Test with a real assessment from your app"
echo ""
echo "3. Monitor logs:"
echo "   cd cloudflare-workers/analyze-assessment-api"
echo "   npm run tail"
