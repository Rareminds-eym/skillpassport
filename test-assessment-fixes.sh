#!/bin/bash

# Test Assessment Duplicate Questions Fix
# This script tests the fixes applied to the adaptive aptitude assessment

echo "🧪 Testing Assessment Duplicate Questions Fix"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if stability endpoint is implemented
echo "Test 1: Checking stability endpoint implementation..."
if grep -q "return jsonResponse(result);" functions/api/question-generation/\[\[path\]\].ts; then
    echo -e "${GREEN}✓ Stability endpoint is properly implemented${NC}"
else
    echo -e "${RED}✗ Stability endpoint still returns 501${NC}"
    exit 1
fi

# Test 2: Check if similarity function exists
echo ""
echo "Test 2: Checking similarity detection..."
if grep -q "function calculateSimilarity" functions/api/question-generation/handlers/adaptive.ts; then
    echo -e "${GREEN}✓ Similarity detection function exists${NC}"
else
    echo -e "${RED}✗ Similarity detection function not found${NC}"
    exit 1
fi

# Test 3: Check if retry count increased
echo ""
echo "Test 3: Checking retry count..."
if grep -q "const maxRetries = 3" src/services/adaptiveAptitudeService.ts; then
    echo -e "${GREEN}✓ Retry count increased to 3${NC}"
else
    echo -e "${RED}✗ Retry count not increased${NC}"
    exit 1
fi

# Test 4: Check if improved prompt exists
echo ""
echo "Test 4: Checking improved AI prompt..."
if grep -q "CRITICAL: Each question MUST have completely different text" functions/api/question-generation/handlers/adaptive.ts; then
    echo -e "${GREEN}✓ Improved AI prompt with CRITICAL markers${NC}"
else
    echo -e "${RED}✗ Improved AI prompt not found${NC}"
    exit 1
fi

# Test 5: Check if filtering logic exists
echo ""
echo "Test 5: Checking duplicate filtering logic..."
if grep -q "const filteredQuestions = aiQuestionsRaw.filter" functions/api/question-generation/handlers/adaptive.ts; then
    echo -e "${GREEN}✓ Duplicate filtering logic exists${NC}"
else
    echo -e "${RED}✗ Duplicate filtering logic not found${NC}"
    exit 1
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✓ All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Rebuild the project: npm run build"
echo "2. Deploy to Cloudflare Pages"
echo "3. Test the assessment at http://localhost:8788/student/assessment/test"
echo "4. Monitor console logs for duplicate warnings"
echo ""
echo "Expected improvements:"
echo "- No more 501 errors on stability phase"
echo "- Fewer duplicate questions (similarity detection)"
echo "- Up to 3 retry attempts before allowing duplicates"
echo "- Better logging of duplicate detection"
