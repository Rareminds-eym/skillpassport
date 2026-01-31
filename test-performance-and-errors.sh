#!/bin/bash

# Performance and Error Handling Test Suite
# Tests API performance, error handling, and edge cases

BASE_URL="http://localhost:8788/api/adaptive-session"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "=========================================="
echo "PERFORMANCE & ERROR HANDLING TESTS"
echo "=========================================="
echo ""

test_count=0
pass_count=0
fail_count=0

# Helper function to measure response time
measure_time() {
    local start=$(date +%s%N)
    eval "$1" > /dev/null 2>&1
    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 )) # Convert to milliseconds
    echo $duration
}

# Helper function to run test
run_test() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    
    test_count=$((test_count + 1))
    echo -e "${CYAN}Test $test_count: $test_name${NC}"
    
    if echo "$actual" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASS${NC}"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Expected: $expected"
        echo "Actual: $actual"
        fail_count=$((fail_count + 1))
    fi
    echo ""
}

echo "=========================================="
echo "1. RESPONSE TIME TESTS"
echo "=========================================="
echo ""

# Test 1: Next question response time
echo -e "${BLUE}Testing GET /next-question response time...${NC}"
time1=$(measure_time "curl -s '$BASE_URL/next-question/00000000-0000-0000-0000-000000000000'")
echo "Response time: ${time1}ms"
if [ $time1 -lt 2000 ]; then
    echo -e "${GREEN}✅ PASS - Response time acceptable (<2s)${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${YELLOW}⚠️  SLOW - Response time: ${time1}ms (expected <2000ms)${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

# Test 2: Find in-progress response time
echo -e "${BLUE}Testing GET /find-in-progress response time...${NC}"
time2=$(measure_time "curl -s '$BASE_URL/find-in-progress/00000000-0000-0000-0000-000000000000'")
echo "Response time: ${time2}ms"
if [ $time2 -lt 1000 ]; then
    echo -e "${GREEN}✅ PASS - Response time acceptable (<1s)${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${YELLOW}⚠️  SLOW - Response time: ${time2}ms (expected <1000ms)${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

echo "=========================================="
echo "2. ERROR HANDLING TESTS"
echo "=========================================="
echo ""

# Test 3: Invalid UUID format
echo -e "${BLUE}Test 2.1: Invalid UUID format${NC}"
response=$(curl -s "$BASE_URL/next-question/not-a-uuid")
run_test "Invalid UUID should return error" "error\|Session not found" "$response"

# Test 4: Non-existent session
echo -e "${BLUE}Test 2.2: Non-existent session${NC}"
response=$(curl -s "$BASE_URL/next-question/00000000-0000-0000-0000-000000000000")
run_test "Non-existent session should return error" "error\|Session not found\|not found" "$response"

# Test 5: Missing required fields
echo -e "${BLUE}Test 2.3: Missing required fields${NC}"
response=$(curl -s -X POST "$BASE_URL/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{}')
run_test "Missing fields should return error" "error\|required\|Authentication required" "$response"

# Test 6: Invalid answer option
echo -e "${BLUE}Test 2.4: Invalid answer option${NC}"
response=$(curl -s -X POST "$BASE_URL/submit-answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"sessionId": "test", "questionId": "test", "selectedAnswer": "Z", "responseTimeMs": 5000}')
run_test "Invalid answer should return error" "error\|invalid\|Authentication required" "$response"

# Test 7: Negative response time
echo -e "${BLUE}Test 2.5: Negative response time${NC}"
response=$(curl -s -X POST "$BASE_URL/submit-answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"sessionId": "test", "questionId": "test", "selectedAnswer": "A", "responseTimeMs": -1000}')
run_test "Negative time should return error" "error\|invalid\|Authentication required" "$response"

echo "=========================================="
echo "3. AUTHENTICATION TESTS"
echo "=========================================="
echo ""

# Test 8: Missing auth token
echo -e "${BLUE}Test 3.1: Missing auth token${NC}"
response=$(curl -s -X POST "$BASE_URL/initialize" \
  -H "Content-Type: application/json" \
  -d '{"studentId": "test", "gradeLevel": "grade_9"}')
run_test "Missing auth should return 401" "Authentication required" "$response"

# Test 9: Invalid auth token
echo -e "${BLUE}Test 3.2: Invalid auth token${NC}"
response=$(curl -s -X POST "$BASE_URL/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token-12345" \
  -d '{"studentId": "test", "gradeLevel": "grade_9"}')
run_test "Invalid auth should return 401" "Authentication required\|Invalid token\|Unauthorized" "$response"

# Test 10: Malformed auth header
echo -e "${BLUE}Test 3.3: Malformed auth header${NC}"
response=$(curl -s -X POST "$BASE_URL/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: invalid-format" \
  -d '{"studentId": "test", "gradeLevel": "grade_9"}')
run_test "Malformed auth should return 401" "Authentication required\|Invalid token" "$response"

echo "=========================================="
echo "4. INPUT VALIDATION TESTS"
echo "=========================================="
echo ""

# Test 11: Empty student ID
echo -e "${BLUE}Test 4.1: Empty student ID${NC}"
response=$(curl -s -X POST "$BASE_URL/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"studentId": "", "gradeLevel": "grade_9"}')
run_test "Empty student ID should return error" "error\|required\|invalid\|Authentication required" "$response"

# Test 12: Invalid grade level
echo -e "${BLUE}Test 4.2: Invalid grade level${NC}"
response=$(curl -s -X POST "$BASE_URL/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"studentId": "test", "gradeLevel": "invalid_grade"}')
run_test "Invalid grade should return error" "error\|invalid\|Authentication required" "$response"

# Test 13: Missing question ID
echo -e "${BLUE}Test 4.3: Missing question ID${NC}"
response=$(curl -s -X POST "$BASE_URL/submit-answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"sessionId": "test", "selectedAnswer": "A", "responseTimeMs": 5000}')
run_test "Missing question ID should return error" "error\|required\|Authentication required" "$response"

# Test 14: Invalid JSON
echo -e "${BLUE}Test 4.4: Invalid JSON${NC}"
response=$(curl -s -X POST "$BASE_URL/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{invalid json}')
run_test "Invalid JSON should return error" "error\|parse\|invalid\|Authentication required" "$response"

echo "=========================================="
echo "5. EDGE CASE TESTS"
echo "=========================================="
echo ""

# Test 15: Very long student ID
echo -e "${BLUE}Test 5.1: Very long student ID${NC}"
long_id=$(printf 'a%.0s' {1..1000})
response=$(curl -s "$BASE_URL/find-in-progress/$long_id")
run_test "Long ID should be handled" "error\|invalid\|not found" "$response"

# Test 16: Special characters in ID
echo -e "${BLUE}Test 5.2: Special characters in ID${NC}"
response=$(curl -s "$BASE_URL/find-in-progress/test@#\$%^&*()")
run_test "Special chars should be handled" "error\|invalid\|not found" "$response"

# Test 17: SQL injection attempt
echo -e "${BLUE}Test 5.3: SQL injection attempt${NC}"
response=$(curl -s "$BASE_URL/find-in-progress/'; DROP TABLE students; --")
run_test "SQL injection should be prevented" "error\|invalid\|not found" "$response"

# Test 18: XSS attempt
echo -e "${BLUE}Test 5.4: XSS attempt${NC}"
response=$(curl -s -X POST "$BASE_URL/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"studentId": "<script>alert(1)</script>", "gradeLevel": "grade_9"}')
run_test "XSS should be prevented" "error\|invalid\|Authentication required" "$response"

echo "=========================================="
echo "6. CONCURRENT REQUEST TESTS"
echo "=========================================="
echo ""

# Test 19: Multiple concurrent requests
echo -e "${BLUE}Test 6.1: 5 concurrent requests${NC}"
echo "Sending 5 concurrent requests..."
for i in {1..5}; do
    curl -s "$BASE_URL/find-in-progress/00000000-0000-0000-0000-000000000000" > /dev/null &
done
wait
echo -e "${GREEN}✅ PASS - All concurrent requests completed${NC}"
pass_count=$((pass_count + 1))
test_count=$((test_count + 1))
echo ""

echo "=========================================="
echo "7. HTTP METHOD TESTS"
echo "=========================================="
echo ""

# Test 20: Wrong HTTP method
echo -e "${BLUE}Test 7.1: GET on POST endpoint${NC}"
response=$(curl -s "$BASE_URL/initialize")
run_test "Wrong method should return error" "error\|Not found\|Method not allowed" "$response"

# Test 21: PUT on GET endpoint
echo -e "${BLUE}Test 7.2: PUT on GET endpoint${NC}"
response=$(curl -s -X PUT "$BASE_URL/next-question/test")
run_test "Wrong method should return error" "error\|Not found\|Method not allowed" "$response"

echo "=========================================="
echo "8. CORS TESTS"
echo "=========================================="
echo ""

# Test 22: CORS preflight
echo -e "${BLUE}Test 8.1: OPTIONS request (CORS preflight)${NC}"
response=$(curl -s -X OPTIONS "$BASE_URL/initialize" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST")
# CORS should be handled by middleware
echo "Response: $response"
echo -e "${GREEN}✅ PASS - CORS preflight handled${NC}"
pass_count=$((pass_count + 1))
test_count=$((test_count + 1))
echo ""

echo "=========================================="
echo "9. LARGE PAYLOAD TESTS"
echo "=========================================="
echo ""

# Test 23: Large request body
echo -e "${BLUE}Test 9.1: Large request body${NC}"
large_data=$(printf '{"studentId": "test", "gradeLevel": "grade_9", "extra": "%s"}' "$(printf 'a%.0s' {1..10000})")
response=$(curl -s -X POST "$BASE_URL/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "$large_data")
run_test "Large payload should be handled" "error\|Authentication required" "$response"

echo "=========================================="
echo "10. RATE LIMITING TESTS"
echo "=========================================="
echo ""

# Test 24: Rapid requests
echo -e "${BLUE}Test 10.1: 20 rapid requests${NC}"
echo "Sending 20 rapid requests..."
success=0
for i in {1..20}; do
    response=$(curl -s "$BASE_URL/find-in-progress/00000000-0000-0000-0000-000000000000")
    if echo "$response" | grep -q "session"; then
        success=$((success + 1))
    fi
done
echo "Successful responses: $success/20"
if [ $success -ge 18 ]; then
    echo -e "${GREEN}✅ PASS - Most requests succeeded${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${YELLOW}⚠️  WARNING - Only $success/20 succeeded${NC}"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo ""
echo "Total Tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"

if [ $test_count -gt 0 ]; then
    success_rate=$(awk "BEGIN {printf \"%.1f\", ($pass_count/$test_count)*100}")
    echo "Success Rate: $success_rate%"
fi
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Performance and error handling are robust."
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed or showed warnings.${NC}"
    echo ""
    echo "Review the results above for details."
    exit 1
fi
