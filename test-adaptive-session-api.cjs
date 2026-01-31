#!/usr/bin/env node

/**
 * Adaptive Session API Test Suite
 * 
 * Tests all 9 endpoints of the adaptive session API:
 * 1. POST /initialize
 * 2. GET /next-question/:sessionId
 * 3. POST /submit-answer
 * 4. POST /complete/:sessionId
 * 5. GET /results/:sessionId
 * 6. GET /results/student/:studentId
 * 7. GET /resume/:sessionId
 * 8. GET /find-in-progress/:studentId
 * 9. POST /abandon/:sessionId
 * 
 * Usage:
 *   node test-adaptive-session-api.cjs
 * 
 * Prerequisites:
 *   - Local server running: npm run pages:dev
 *   - Valid student ID and auth token
 */

const BASE_URL = 'http://localhost:8788/api/adaptive-session';

// Test configuration
const TEST_CONFIG = {
  studentId: 'test-student-id', // Replace with real student ID
  gradeLevel: 'grade_9',
  authToken: 'test-auth-token', // Replace with real JWT token
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`TEST: ${testName}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test state
const testState = {
  sessionId: null,
  questionId: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
};

/**
 * Make HTTP request
 */
async function request(method, path, body = null, requireAuth = false) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    headers['Authorization'] = `Bearer ${TEST_CONFIG.authToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  logInfo(`${method} ${url}`);
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Test 1: Initialize Test
 */
async function testInitialize() {
  logTest('1. Initialize Test');
  testState.totalTests++;

  const response = await request('POST', '/initialize', {
    studentId: TEST_CONFIG.studentId,
    gradeLevel: TEST_CONFIG.gradeLevel,
  }, true);

  if (!response.ok) {
    logError(`Failed with status ${response.status}`);
    logError(JSON.stringify(response.data, null, 2));
    testState.failedTests++;
    return false;
  }

  // Validate response structure
  const { session, firstQuestion } = response.data;
  
  if (!session || !session.id) {
    logError('Response missing session or session.id');
    testState.failedTests++;
    return false;
  }

  if (!firstQuestion || !firstQuestion.id) {
    logError('Response missing firstQuestion or firstQuestion.id');
    testState.failedTests++;
    return false;
  }

  // Save for later tests
  testState.sessionId = session.id;
  testState.questionId = firstQuestion.id;

  logSuccess('Session initialized successfully');
  logInfo(`Session ID: ${testState.sessionId}`);
  logInfo(`First Question ID: ${testState.questionId}`);
  logInfo(`Phase: ${session.current_phase}`);
  testState.passedTests++;
  return true;
}

/**
 * Test 2: Get Next Question
 */
async function testGetNextQuestion() {
  logTest('2. Get Next Question');
  testState.totalTests++;

  if (!testState.sessionId) {
    logWarning('Skipping - no session ID from previous test');
    return false;
  }

  const response = await request('GET', `/next-question/${testState.sessionId}`);

  if (!response.ok) {
    logError(`Failed with status ${response.status}`);
    logError(JSON.stringify(response.data, null, 2));
    testState.failedTests++;
    return false;
  }

  const { question, isTestComplete, currentPhase, progress } = response.data;

  if (isTestComplete) {
    logInfo('Test is already complete');
  } else if (!question) {
    logError('Response missing question');
    testState.failedTests++;
    return false;
  }

  logSuccess('Next question retrieved successfully');
  logInfo(`Is Complete: ${isTestComplete}`);
  logInfo(`Current Phase: ${currentPhase}`);
  logInfo(`Progress: ${JSON.stringify(progress)}`);
  testState.passedTests++;
  return true;
}

/**
 * Test 3: Submit Answer
 */
async function testSubmitAnswer() {
  logTest('3. Submit Answer');
  testState.totalTests++;

  if (!testState.sessionId || !testState.questionId) {
    logWarning('Skipping - no session ID or question ID from previous tests');
    return false;
  }

  const response = await request('POST', '/submit-answer', {
    sessionId: testState.sessionId,
    questionId: testState.questionId,
    selectedAnswer: 'A',
    responseTimeMs: 5000,
  }, true);

  if (!response.ok) {
    logError(`Failed with status ${response.status}`);
    logError(JSON.stringify(response.data, null, 2));
    testState.failedTests++;
    return false;
  }

  const { isCorrect, difficultyChange, testComplete } = response.data;

  logSuccess('Answer submitted successfully');
  logInfo(`Is Correct: ${isCorrect}`);
  logInfo(`Difficulty Change: ${difficultyChange}`);
  logInfo(`Test Complete: ${testComplete}`);
  testState.passedTests++;
  return true;
}

/**
 * Test 4: Resume Test
 */
async function testResumeTest() {
  logTest('4. Resume Test');
  testState.totalTests++;

  if (!testState.sessionId) {
    logWarning('Skipping - no session ID from previous tests');
    return false;
  }

  const response = await request('GET', `/resume/${testState.sessionId}`);

  if (!response.ok) {
    logError(`Failed with status ${response.status}`);
    logError(JSON.stringify(response.data, null, 2));
    testState.failedTests++;
    return false;
  }

  const { session, currentQuestion, isTestComplete } = response.data;

  if (!session) {
    logError('Response missing session');
    testState.failedTests++;
    return false;
  }

  logSuccess('Test resumed successfully');
  logInfo(`Is Complete: ${isTestComplete}`);
  logInfo(`Current Phase: ${session.current_phase}`);
  testState.passedTests++;
  return true;
}

/**
 * Test 5: Find In-Progress Session
 */
async function testFindInProgress() {
  logTest('5. Find In-Progress Session');
  testState.totalTests++;

  const response = await request('GET', `/find-in-progress/${TEST_CONFIG.studentId}?gradeLevel=${TEST_CONFIG.gradeLevel}`);

  if (!response.ok) {
    logError(`Failed with status ${response.status}`);
    logError(JSON.stringify(response.data, null, 2));
    testState.failedTests++;
    return false;
  }

  const { session } = response.data;

  if (session) {
    logSuccess('Found in-progress session');
    logInfo(`Session ID: ${session.id}`);
    logInfo(`Phase: ${session.current_phase}`);
  } else {
    logSuccess('No in-progress session found (this is OK)');
  }

  testState.passedTests++;
  return true;
}

/**
 * Test 6: Abandon Session
 */
async function testAbandonSession() {
  logTest('6. Abandon Session');
  testState.totalTests++;

  if (!testState.sessionId) {
    logWarning('Skipping - no session ID from previous tests');
    return false;
  }

  const response = await request('POST', `/abandon/${testState.sessionId}`, null, true);

  if (!response.ok) {
    logError(`Failed with status ${response.status}`);
    logError(JSON.stringify(response.data, null, 2));
    testState.failedTests++;
    return false;
  }

  logSuccess('Session abandoned successfully');
  testState.passedTests++;
  return true;
}

/**
 * Test 7: Complete Test (requires full test flow)
 */
async function testCompleteTest() {
  logTest('7. Complete Test');
  testState.totalTests++;

  logWarning('This test requires a fully completed session');
  logInfo('Skipping automated test - requires manual testing');
  logInfo('To test manually:');
  logInfo('  1. Complete a full test session');
  logInfo('  2. Call POST /complete/:sessionId');
  logInfo('  3. Verify results are calculated correctly');
  
  return true;
}

/**
 * Test 8: Get Results
 */
async function testGetResults() {
  logTest('8. Get Results');
  testState.totalTests++;

  if (!testState.sessionId) {
    logWarning('Skipping - no session ID from previous tests');
    return false;
  }

  const response = await request('GET', `/results/${testState.sessionId}`, null, true);

  // May return 404 if test not completed yet
  if (response.status === 404) {
    logInfo('No results found (test not completed yet - this is OK)');
    testState.passedTests++;
    return true;
  }

  if (!response.ok) {
    logError(`Failed with status ${response.status}`);
    logError(JSON.stringify(response.data, null, 2));
    testState.failedTests++;
    return false;
  }

  logSuccess('Results retrieved successfully');
  testState.passedTests++;
  return true;
}

/**
 * Test 9: Get Student Results
 */
async function testGetStudentResults() {
  logTest('9. Get Student Results');
  testState.totalTests++;

  const response = await request('GET', `/results/student/${TEST_CONFIG.studentId}`, null, true);

  if (!response.ok) {
    logError(`Failed with status ${response.status}`);
    logError(JSON.stringify(response.data, null, 2));
    testState.failedTests++;
    return false;
  }

  const { results } = response.data;

  logSuccess('Student results retrieved successfully');
  logInfo(`Found ${results.length} completed test(s)`);
  testState.passedTests++;
  return true;
}

/**
 * Run all tests
 */
async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('ADAPTIVE SESSION API TEST SUITE', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Student ID: ${TEST_CONFIG.studentId}`, 'blue');
  log(`Grade Level: ${TEST_CONFIG.gradeLevel}`, 'blue');
  log('');

  // Check if server is running
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      logError('Server is not responding correctly');
      logError('Make sure the server is running: npm run pages:dev');
      process.exit(1);
    }
  } catch (error) {
    logError('Cannot connect to server');
    logError('Make sure the server is running: npm run pages:dev');
    process.exit(1);
  }

  // Run tests in sequence
  await testInitialize();
  await testGetNextQuestion();
  await testSubmitAnswer();
  await testResumeTest();
  await testFindInProgress();
  await testAbandonSession();
  await testCompleteTest();
  await testGetResults();
  await testGetStudentResults();

  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Total Tests: ${testState.totalTests}`, 'blue');
  log(`Passed: ${testState.passedTests}`, 'green');
  log(`Failed: ${testState.failedTests}`, 'red');
  log(`Success Rate: ${((testState.passedTests / testState.totalTests) * 100).toFixed(1)}%`, 'blue');
  log('');

  if (testState.failedTests === 0) {
    logSuccess('All tests passed! 🎉');
    process.exit(0);
  } else {
    logError('Some tests failed');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
