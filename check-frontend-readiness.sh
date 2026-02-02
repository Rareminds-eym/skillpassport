#!/bin/bash

# Frontend Integration Readiness Check
# Verifies that all components are in place for frontend testing

echo "=========================================="
echo "FRONTEND INTEGRATION READINESS CHECK"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

checks_passed=0
checks_failed=0
total_checks=0

check() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    total_checks=$((total_checks + 1))
    echo -n "Checking $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        checks_passed=$((checks_passed + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        checks_failed=$((checks_failed + 1))
        return 1
    fi
}

echo "=========================================="
echo "1. SERVER CHECKS"
echo "=========================================="
echo ""

# Check if server is running
if curl -s http://localhost:8788 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running on http://localhost:8788${NC}"
    checks_passed=$((checks_passed + 1))
else
    echo -e "${RED}❌ Server is NOT running${NC}"
    echo "   Please start: npm run pages:dev"
    checks_failed=$((checks_failed + 1))
fi
total_checks=$((total_checks + 1))
echo ""

# Check API is accessible
if curl -s http://localhost:8788/api/adaptive-session > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is accessible${NC}"
    checks_passed=$((checks_passed + 1))
else
    echo -e "${RED}❌ API is NOT accessible${NC}"
    checks_failed=$((checks_failed + 1))
fi
total_checks=$((total_checks + 1))
echo ""

echo "=========================================="
echo "2. FRONTEND SERVICE FILES"
echo "=========================================="
echo ""

# Check frontend service files exist
check "adaptiveAptitudeService.ts" "test -f src/services/adaptiveAptitudeService.ts"
check "adaptiveAptitudeApiService.ts" "test -f src/services/adaptiveAptitudeApiService.ts"
check "useAdaptiveAptitude hook" "test -f src/hooks/useAdaptiveAptitude.ts"
check "adaptiveAptitude types" "test -f src/types/adaptiveAptitude.ts"

echo ""

echo "=========================================="
echo "3. API HANDLER FILES"
echo "=========================================="
echo ""

# Check API handler files exist
check "initialize handler" "test -f functions/api/adaptive-session/handlers/initialize.ts"
check "next-question handler" "test -f functions/api/adaptive-session/handlers/next-question.ts"
check "submit-answer handler" "test -f functions/api/adaptive-session/handlers/submit-answer.ts"
check "complete handler" "test -f functions/api/adaptive-session/handlers/complete.ts"
check "results handler" "test -f functions/api/adaptive-session/handlers/results.ts"
check "resume handler" "test -f functions/api/adaptive-session/handlers/resume.ts"
check "abandon handler" "test -f functions/api/adaptive-session/handlers/abandon.ts"

echo ""

echo "=========================================="
echo "4. API ROUTER"
echo "=========================================="
echo ""

check "API router" "test -f functions/api/adaptive-session/[[path]].ts"

echo ""

echo "=========================================="
echo "5. MIDDLEWARE"
echo "=========================================="
echo ""

check "CORS middleware" "test -f functions/_middleware.ts"

echo ""

echo "=========================================="
echo "6. ENVIRONMENT VARIABLES"
echo "=========================================="
echo ""

# Check .env file exists
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    checks_passed=$((checks_passed + 1))
    
    # Check for required variables
    if grep -q "VITE_SUPABASE_URL" .env; then
        echo -e "${GREEN}✅ VITE_SUPABASE_URL configured${NC}"
        checks_passed=$((checks_passed + 1))
    else
        echo -e "${RED}❌ VITE_SUPABASE_URL missing${NC}"
        checks_failed=$((checks_failed + 1))
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✅ VITE_SUPABASE_ANON_KEY configured${NC}"
        checks_passed=$((checks_passed + 1))
    else
        echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY missing${NC}"
        checks_failed=$((checks_failed + 1))
    fi
else
    echo -e "${RED}❌ .env file missing${NC}"
    checks_failed=$((checks_failed + 1))
fi
total_checks=$((total_checks + 4))

echo ""

echo "=========================================="
echo "7. BUILD OUTPUT"
echo "=========================================="
echo ""

# Check dist folder exists
if [ -d dist ]; then
    echo -e "${GREEN}✅ dist folder exists${NC}"
    checks_passed=$((checks_passed + 1))
    
    # Check if index.html exists
    if [ -f dist/index.html ]; then
        echo -e "${GREEN}✅ dist/index.html exists${NC}"
        checks_passed=$((checks_passed + 1))
    else
        echo -e "${RED}❌ dist/index.html missing${NC}"
        echo "   Run: npm run build"
        checks_failed=$((checks_failed + 1))
    fi
else
    echo -e "${RED}❌ dist folder missing${NC}"
    echo "   Run: npm run build"
    checks_failed=$((checks_failed + 2))
fi
total_checks=$((total_checks + 2))

echo ""

echo "=========================================="
echo "8. DOCUMENTATION"
echo "=========================================="
echo ""

check "Testing guide" "test -f ADAPTIVE_SESSION_TESTING_GUIDE.md"
check "Frontend checklist" "test -f TASK_69_FRONTEND_TEST_CHECKLIST.md"
check "API documentation" "test -f functions/api/adaptive-session/README.md"
check "Service documentation" "test -f src/services/README_ADAPTIVE_APTITUDE.md"

echo ""

echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo ""
echo "Total Checks: $total_checks"
echo -e "${GREEN}Passed: $checks_passed${NC}"
echo -e "${RED}Failed: $checks_failed${NC}"

success_rate=$(awk "BEGIN {printf \"%.1f\", ($checks_passed/$total_checks)*100}")
echo "Success Rate: $success_rate%"
echo ""

if [ $checks_failed -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for frontend testing.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Login to http://localhost:8788 as a student"
    echo "  2. Follow TASK_69_FRONTEND_TEST_CHECKLIST.md"
    echo "  3. Test all user flows"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  Some checks failed. Fix issues before testing.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Start server: npm run pages:dev"
    echo "  - Build frontend: npm run build"
    echo "  - Check .env file has all required variables"
    echo ""
    exit 1
fi
