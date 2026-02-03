#!/bin/bash

# Full Adaptive Session API Test Runner
# This script helps you run the complete test suite with real credentials

echo "=========================================="
echo "ADAPTIVE SESSION API - FULL TEST SUITE"
echo "=========================================="
echo ""

# Check if server is running
echo "Checking if server is running..."
if curl -s http://localhost:8788/api/adaptive-session > /dev/null 2>&1; then
    echo "✅ Server is running on http://localhost:8788"
else
    echo "❌ Server is not running!"
    echo ""
    echo "Please start the server first:"
    echo "  npm run pages:dev"
    echo ""
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 1: Get Test Credentials"
echo "=========================================="
echo ""
echo "You need:"
echo "  1. A valid student ID (UUID format)"
echo "  2. A valid JWT authentication token"
echo ""
echo "To get these:"
echo ""
echo "Option A - From Database:"
echo "  Run this SQL query in Supabase:"
echo "  SELECT id, email FROM students LIMIT 1;"
echo ""
echo "Option B - From Browser Console:"
echo "  1. Login to the application as a student"
echo "  2. Open browser console (F12)"
echo "  3. Run:"
echo "     const { data: { session } } = await supabase.auth.getSession();"
echo "     console.log('Student ID:', session.user.id);"
echo "     console.log('JWT Token:', session.access_token);"
echo ""
echo "=========================================="
echo "STEP 2: Update Test Configuration"
echo "=========================================="
echo ""
echo "Edit the file: test-adaptive-session-api.cjs"
echo ""
echo "Update these lines:"
echo "  studentId: 'YOUR_REAL_STUDENT_ID',"
echo "  authToken: 'YOUR_REAL_JWT_TOKEN',"
echo ""
read -p "Have you updated the test configuration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please update test-adaptive-session-api.cjs first, then run this script again."
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 3: Running Tests"
echo "=========================================="
echo ""

# Run the test suite
node test-adaptive-session-api.cjs

exit_code=$?

echo ""
echo "=========================================="
echo "STEP 4: Next Steps"
echo "=========================================="
echo ""

if [ $exit_code -eq 0 ]; then
    echo "✅ All tests passed!"
    echo ""
    echo "Next steps:"
    echo "  1. Mark task 68 as complete in tasks.md"
    echo "  2. Proceed to Task 69 (Frontend Integration Testing)"
    echo "  3. See ADAPTIVE_SESSION_TESTING_GUIDE.md for details"
else
    echo "❌ Some tests failed"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check that student ID is valid UUID"
    echo "  2. Check that JWT token is not expired"
    echo "  3. Check that server is running"
    echo "  4. Check server logs for errors"
    echo "  5. See ADAPTIVE_SESSION_TESTING_GUIDE.md for help"
fi

echo ""
exit $exit_code
