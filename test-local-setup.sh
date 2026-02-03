#!/bin/bash

# Local Setup Test Script
# Tests that everything is ready for local development

echo "🧪 Testing Local Setup for Cloudflare Consolidation"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAILED++))
    fi
}

# Test 1: Check Node.js version
echo "1. Checking Node.js..."
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    test_result 0 "Node.js installed: $NODE_VERSION"
else
    test_result 1 "Node.js not found"
fi

# Test 2: Check npm
echo "2. Checking npm..."
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    test_result 0 "npm installed: $NPM_VERSION"
else
    test_result 1 "npm not found"
fi

# Test 3: Check Wrangler
echo "3. Checking Wrangler..."
WRANGLER_VERSION=$(wrangler --version 2>/dev/null)
if [ $? -eq 0 ]; then
    test_result 0 "Wrangler installed: $WRANGLER_VERSION"
else
    test_result 1 "Wrangler not found (run: npm install -g wrangler)"
fi

# Test 4: Check if node_modules exists
echo "4. Checking dependencies..."
if [ -d "node_modules" ]; then
    test_result 0 "Dependencies installed"
else
    test_result 1 "Dependencies not installed (run: npm install)"
fi

# Test 5: Check if dist folder exists
echo "5. Checking build..."
if [ -d "dist" ]; then
    test_result 0 "Build folder exists"
else
    echo -e "${YELLOW}⚠${NC} Build folder not found (run: npm run build)"
fi

# Test 6: Check if .dev.vars exists
echo "6. Checking environment variables..."
if [ -f ".dev.vars" ]; then
    test_result 0 ".dev.vars file exists"
else
    echo -e "${YELLOW}⚠${NC} .dev.vars not found (copy from .dev.vars.example)"
fi

# Test 7: Check if functions directory exists
echo "7. Checking Pages Functions..."
if [ -d "functions/api" ]; then
    API_COUNT=$(find functions/api -maxdepth 1 -type d | wc -l)
    test_result 0 "Pages Functions directory exists ($((API_COUNT-1)) APIs)"
else
    test_result 1 "Pages Functions directory not found"
fi

# Test 8: Check if shared utilities exist
echo "8. Checking shared utilities..."
if [ -d "src/functions-lib" ]; then
    test_result 0 "Shared utilities exist"
else
    test_result 1 "Shared utilities not found"
fi

# Test 9: Check if fallback utility exists
echo "9. Checking fallback utility..."
if [ -f "src/utils/apiFallback.ts" ]; then
    test_result 0 "Fallback utility exists"
else
    test_result 1 "Fallback utility not found"
fi

# Test 10: Check if property tests exist
echo "10. Checking property tests..."
if [ -d "src/__tests__/property" ]; then
    TEST_COUNT=$(find src/__tests__/property -name "*.test.ts" | wc -l)
    test_result 0 "Property tests exist ($TEST_COUNT files)"
else
    test_result 1 "Property tests not found"
fi

# Summary
echo ""
echo "=================================================="
echo "Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
fi
echo ""

# Recommendations
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Copy .dev.vars.example to .dev.vars and add your API keys"
    echo "  2. Run: npm run build"
    echo "  3. Run: npm run pages:dev"
    echo "  4. Test: curl http://localhost:8788/api/assessment/health"
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please fix the issues above before proceeding."
fi

echo ""
echo "For detailed instructions, see:"
echo "  - QUICK_START_LOCAL_TESTING.md"
echo "  - LOCAL_TESTING_GUIDE.md"
