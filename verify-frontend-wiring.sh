#!/bin/bash

# Frontend Wiring Verification Script
# Verifies that all services are using Pages Functions only

echo "🔍 Verifying Frontend Wiring to Pages Functions..."
echo ""

# Colors
GREEN='\033[0.32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0

# Check 1: No references to apiFallback utility
echo "📋 Check 1: Verifying no apiFallback imports..."
if grep -r "from.*apiFallback" src/services/*.ts 2>/dev/null; then
    echo -e "${RED}❌ FAIL: Found apiFallback imports${NC}"
    FAIL=$((FAIL + 1))
else
    echo -e "${GREEN}✅ PASS: No apiFallback imports found${NC}"
    PASS=$((PASS + 1))
fi
echo ""

# Check 2: All services use getPagesApiUrl
echo "📋 Check 2: Verifying getPagesApiUrl usage..."
SERVICES=(
    "assessmentApiService.ts"
    "careerApiService.ts"
    "courseApiService.ts"
    "otpService.ts"
    "streakApiService.ts"
    "storageApiService.ts"
    "userApiService.ts"
    "tutorService.ts"
    "videoSummarizerService.ts"
    "questionGeneratorService.ts"
    "programCareerPathsService.ts"
)

for service in "${SERVICES[@]}"; do
    if grep -q "getPagesApiUrl" "src/services/$service" 2>/dev/null; then
        echo -e "${GREEN}  ✅ $service${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}  ❌ $service${NC}"
        FAIL=$((FAIL + 1))
    fi
done
echo ""

# Check 3: No old worker URL environment variables
echo "📋 Check 3: Checking for old environment variable usage..."
OLD_VARS=(
    "VITE_ASSESSMENT_API_URL"
    "VITE_CAREER_API_URL"
    "VITE_COURSE_API_URL"
    "VITE_OTP_API_URL"
    "VITE_STORAGE_API_URL"
    "VITE_STREAK_API_URL"
    "VITE_USER_API_URL"
    "VITE_QUESTION_GENERATION_API_URL"
    "VITE_ANALYZE_ASSESSMENT_API_URL"
)

for var in "${OLD_VARS[@]}"; do
    if grep -r "$var" src/services/*.ts 2>/dev/null | grep -v "^Binary" | grep -v ".test.ts"; then
        echo -e "${RED}  ❌ Found reference to $var${NC}"
        FAIL=$((FAIL + 1))
    else
        echo -e "${GREEN}  ✅ No references to $var${NC}"
        PASS=$((PASS + 1))
    fi
done
echo ""

# Check 4: pagesUrl utility exists
echo "📋 Check 4: Verifying pagesUrl utility exists..."
if [ -f "src/utils/pagesUrl.ts" ]; then
    echo -e "${GREEN}✅ PASS: pagesUrl.ts exists${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL: pagesUrl.ts not found${NC}"
    FAIL=$((FAIL + 1))
fi
echo ""

# Check 5: TypeScript compilation
echo "📋 Check 5: Checking TypeScript compilation..."
if command -v tsc &> /dev/null; then
    if tsc --noEmit 2>&1 | grep -q "error TS"; then
        echo -e "${RED}❌ FAIL: TypeScript errors found${NC}"
        FAIL=$((FAIL + 1))
    else
        echo -e "${GREEN}✅ PASS: No TypeScript errors${NC}"
        PASS=$((PASS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP: TypeScript not available${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Frontend is completely wired to Pages Functions.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please review the output above.${NC}"
    exit 1
fi
