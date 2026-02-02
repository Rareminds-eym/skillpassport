#!/bin/bash

# Adaptive Session API Test Script
# Tests all endpoints that don't require authentication or can be tested with invalid data

BASE_URL="http://localhost:8788/api/adaptive-session"

echo "=========================================="
echo "ADAPTIVE SESSION API TESTS"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

run_test() {
    local test_name="$1"
    local expected_status="$2"
    local actual_response="$3"
    
    test_count=$((test_count + 1))
    echo "Test $test_count: $test_name"
    
    # Extract status code from response
    local status=$(echo "$actual_response" | grep -o '"error"' | wc -l)
    
    if echo "$actual_response" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ PASS${NC}"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        fail_count=$((fail_count + 1))
    fi
    echo "Response: $actual_response"
    echo ""
}

echo "=========================================="
echo "1. AUTHENTICATION TESTS"
echo "=========================================="
echo ""

# Test 1: Initialize without auth
echo "Test 1.1: POST /initialize without authentication"
response=$(curl -s -X POST "$BASE_URL/initialize" \
  -H "Content-Type: application/json" \
  -d '{"studentId": "test", "gradeLevel": "grade_9"}')
run_test "Initialize without auth should return 401" "Authentication required" "$response"

# Test 2: Initialize with invalid token
echo "Test 1.2: POST /initialize with invalid token"
response=$(curl -s -X POST "$BASE_URL/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"studentId": "test", "gradeLevel": "grade_9"}')
run_test "Initialize with invalid token should return 401" "Authentication required\|Invalid token\|Unauthorized" "$response"

# Test 3: Submit answer without auth
echo "Test 1.3: POST /submit-answer without authentication"
response=$(curl -s -X POST "$BASE_URL/submit-answer" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test", "questionId": "test", "selectedAnswer": "A", "responseTimeMs": 5000}')
run_test "Submit answer without auth should return 401" "Authentication required" "$response"

# Test 4: Abandon without auth
echo "Test 1.4: POST /abandon without authentication"
response=$(curl -s -X POST "$BASE_URL/abandon/test-session-id" \
  -H "Content-Type: application/json")
run_test "Abandon without auth should return 401" "Authentication required" "$response"

echo "=========================================="
echo "2. VALIDATION TESTS"
echo "=========================================="
echo ""

# Test 5: Get next question with invalid session ID
echo "Test 2.1: GET /next-question with invalid session ID"
response=$(curl -s "$BASE_URL/next-question/invalid-session-id")
run_test "Invalid session ID should return error" "not found\|Session not found\|error" "$response"

# Test 6: Resume with invalid session ID
echo "Test 2.2: GET /resume with invalid session ID"
response=$(curl -s "$BASE_URL/resume/invalid-session-id")
run_test "Invalid session ID should return error" "not found\|Session not found\|error" "$response"

# Test 7: Find in-progress with invalid student ID
echo "Test 2.3: GET /find-in-progress with invalid student ID"
response=$(curl -s "$BASE_URL/find-in-progress/invalid-student-id")
run_test "Invalid student ID should return null or empty" "null\|session.*null\|\[\]" "$response"

echo "=========================================="
echo "3. ENDPOINT AVAILABILITY TESTS"
echo "=========================================="
echo ""

# Test 8: Check all endpoints respond (not 404)
echo "Test 3.1: POST /initialize endpoint exists"
response=$(curl -s -X POST "$BASE_URL/initialize" -H "Content-Type: application/json")
if echo "$response" | grep -q "Authentication required"; then
    echo -e "${GREEN}✅ PASS - Endpoint exists${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}❌ FAIL - Endpoint not found${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

echo "Test 3.2: GET /next-question endpoint exists"
response=$(curl -s "$BASE_URL/next-question/test")
if ! echo "$response" | grep -q "Not found.*method"; then
    echo -e "${GREEN}✅ PASS - Endpoint exists${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}❌ FAIL - Endpoint not found${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

echo "Test 3.3: POST /submit-answer endpoint exists"
response=$(curl -s -X POST "$BASE_URL/submit-answer" -H "Content-Type: application/json")
if echo "$response" | grep -q "Authentication required"; then
    echo -e "${GREEN}✅ PASS - Endpoint exists${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}❌ FAIL - Endpoint not found${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

echo "Test 3.4: POST /complete endpoint exists"
response=$(curl -s -X POST "$BASE_URL/complete/test" -H "Content-Type: application/json")
if echo "$response" | grep -q "Authentication required"; then
    echo -e "${GREEN}✅ PASS - Endpoint exists${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}❌ FAIL - Endpoint not found${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

echo "Test 3.5: GET /results endpoint exists"
response=$(curl -s "$BASE_URL/results/test")
if echo "$response" | grep -q "Authentication required"; then
    echo -e "${GREEN}✅ PASS - Endpoint exists${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}❌ FAIL - Endpoint not found${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

echo "Test 3.6: GET /results/student endpoint exists"
response=$(curl -s "$BASE_URL/results/student/test")
if echo "$response" | grep -q "Authentication required"; then
    echo -e "${GREEN}✅ PASS - Endpoint exists${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}❌ FAIL - Endpoint not found${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

echo "Test 3.7: GET /resume endpoint exists"
response=$(curl -s "$BASE_URL/resume/test")
if ! echo "$response" | grep -q "Not found.*method"; then
    echo -e "${GREEN}✅ PASS - Endpoint exists${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}❌ FAIL - Endpoint not found${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

echo "Test 3.8: GET /find-in-progress endpoint exists"
response=$(curl -s "$BASE_URL/find-in-progress/test")
if ! echo "$response" | grep -q "Not found.*method"; then
    echo -e "${GREEN}✅ PASS - Endpoint exists${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}❌ FAIL - Endpoint not found${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

echo "Test 3.9: POST /abandon endpoint exists"
response=$(curl -s -X POST "$BASE_URL/abandon/test")
if echo "$response" | grep -q "Authentication required"; then
    echo -e "${GREEN}✅ PASS - Endpoint exists${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}❌ FAIL - Endpoint not found${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "Total Tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
success_rate=$(awk "BEGIN {printf \"%.1f\", ($pass_count/$test_count)*100}")
echo "Success Rate: $success_rate%"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Review results above.${NC}"
    exit 1
fi
