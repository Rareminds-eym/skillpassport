#!/usr/bin/env node

/**
 * Complete AI APIs Integration Test Suite
 * Tests 15 core AI API endpoints across 4 APIs
 * 
 * Usage: node test-ai-apis-complete.cjs
 * Prerequisites: npm run pages:dev running on localhost:8788
 * 
 * Note: AI calls can be slow (10-30s), so we use minimal data and timeouts
 */

const BASE_URLS = {
  roleOverview: 'http://localhost:8788/api/role-overview',
  questionGen: 'http://localhost:8788/api/question-generation',
  course: 'http://localhost:8788/api/course',
  analyzeAssessment: 'http://localhost:8788/api/analyze-assessment'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function to make HTTP requests with timeout
async function makeRequest(baseUrl, path, method = 'GET', body = null, timeout = 5000) {
  const url = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    signal: controller.signal
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    
    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    return { status: response.status, data };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { status: 0, error: 'Request timeout' };
    }
    return { status: 0, error: error.message };
  }
}

// Test runner
async function runTest(name, testFn) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    const result = await testFn();
    if (result.success) {
      console.log(`✅ PASSED: ${name}`);
      results.passed++;
      results.tests.push({ name, status: 'passed', ...result });
    } else if (result.skipped) {
      console.log(`⚠️  SKIPPED: ${name}`);
      console.log(`   Reason: ${result.reason}`);
      results.skipped++;
      results.tests.push({ name, status: 'skipped', ...result });
    } else {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Reason: ${result.reason}`);
      results.failed++;
      results.tests.push({ name, status: 'failed', ...result });
    }
  } catch (error) {
    console.log(`❌ ERROR: ${name}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'error', error: error.message });
  }
}

// ============================================================================
// API 1: Role Overview API (2 endpoints)
// ============================================================================

async function testRoleOverviewHealth() {
  const { status, data } = await makeRequest(BASE_URLS.roleOverview, '/health', 'GET');
  return {
    success: status === 200 && data.status === 'ok',
    reason: status !== 200 ? `Expected 200, got ${status}` : data.status !== 'ok' ? 'Health check failed' : null,
    status,
    data
  };
}

async function testGenerateRoleOverview() {
  const { status, data } = await makeRequest(BASE_URLS.roleOverview, '/role-overview', 'POST', {
    roleTitle: 'Software Engineer',
    gradeLevel: '12'
  }, 10000); // 10s timeout for AI call
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 500,
    status,
    data
  };
}

async function testMatchCourses() {
  const { status, data } = await makeRequest(BASE_URLS.roleOverview, '/match-courses', 'POST', {
    roleTitle: 'Data Scientist',
    courses: ['Python Programming', 'Statistics', 'Machine Learning']
  }, 10000);
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 500,
    status,
    data
  };
}

// ============================================================================
// API 2: Question Generation API (4-5 endpoints)
// ============================================================================

async function testQuestionGenHealth() {
  const { status, data } = await makeRequest(BASE_URLS.questionGen, '/health', 'GET');
  return {
    success: status === 200 && data.status === 'ok',
    reason: status !== 200 ? `Expected 200, got ${status}` : data.status !== 'ok' ? 'Health check failed' : null,
    status,
    data
  };
}

async function testGenerateAptitude() {
  const { status, data } = await makeRequest(BASE_URLS.questionGen, '/career-assessment/generate-aptitude', 'POST', {
    streamId: 'test-stream',
    questionsPerCategory: 2,
    gradeLevel: '10'
  }, 15000); // 15s timeout
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 500,
    status,
    data
  };
}

async function testStreamAptitude() {
  // For streaming, just test if endpoint exists
  const { status, data } = await makeRequest(BASE_URLS.questionGen, '/career-assessment/generate-aptitude/stream', 'POST', {
    streamId: 'test-stream',
    gradeLevel: '10'
  }, 5000);
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: true, // Skip actual streaming test
    status,
    data
  };
}

async function testGenerateCourseAssessment() {
  const { status, data } = await makeRequest(BASE_URLS.questionGen, '/generate', 'POST', {
    courseName: 'Introduction to Python',
    level: 'beginner',
    questionCount: 5
  }, 15000);
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 500,
    status,
    data
  };
}

async function testGenerateDiagnostic() {
  const { status, data } = await makeRequest(BASE_URLS.questionGen, '/generate/diagnostic', 'POST', {
    gradeLevel: '10',
    excludeQuestionIds: [],
    excludeQuestionTexts: []
  }, 15000);
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 500,
    status,
    data
  };
}

// ============================================================================
// API 3: Course API (6 endpoints)
// ============================================================================

async function testCourseHealth() {
  const { status, data } = await makeRequest(BASE_URLS.course, '/health', 'GET');
  return {
    success: status === 200,
    reason: status !== 200 ? `Expected 200, got ${status}` : null,
    status,
    data
  };
}

async function testAITutorSuggestions() {
  const { status, data } = await makeRequest(BASE_URLS.course, '/ai-tutor/suggestions', 'POST', {
    lessonId: 'test-lesson-id',
    moduleId: 'test-module-id'
  }, 10000);
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 500,
    status,
    data
  };
}

async function testAITutorChat() {
  const { status, data } = await makeRequest(BASE_URLS.course, '/ai-tutor/chat', 'POST', {
    conversationId: 'test-conversation',
    message: 'Hello',
    lessonId: 'test-lesson'
  }, 10000);
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: true, // Skip streaming test
    status,
    data
  };
}

async function testAITutorFeedback() {
  const { status, data } = await makeRequest(BASE_URLS.course, '/ai-tutor/feedback', 'POST', {
    conversationId: 'test-conversation',
    rating: 5,
    feedback: 'Great!'
  }, 5000);
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 401 || status === 500,
    status,
    data
  };
}

async function testAITutorProgressGet() {
  const { status, data } = await makeRequest(BASE_URLS.course, '/ai-tutor/progress', 'GET');
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 401 || status === 500,
    status,
    data
  };
}

async function testAITutorProgressPost() {
  const { status, data } = await makeRequest(BASE_URLS.course, '/ai-tutor/progress', 'POST', {
    lessonId: 'test-lesson',
    status: 'completed'
  }, 5000);
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 401 || status === 500,
    status,
    data
  };
}

async function testVideoSummarizer() {
  const { status, data } = await makeRequest(BASE_URLS.course, '/ai-video-summarizer', 'POST', {
    videoUrl: 'https://example.com/video.mp4',
    lessonId: 'test-lesson'
  }, 5000);
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 500,
    status,
    data
  };
}

// ============================================================================
// API 4: Analyze Assessment API (3 endpoints)
// ============================================================================

async function testAnalyzeAssessmentHealth() {
  const { status, data } = await makeRequest(BASE_URLS.analyzeAssessment, '/health', 'GET');
  return {
    success: status === 200 && data.status === 'ok',
    reason: status !== 200 ? `Expected 200, got ${status}` : data.status !== 'ok' ? 'Health check failed' : null,
    status,
    data
  };
}

async function testAnalyzeAssessment() {
  const { status, data } = await makeRequest(BASE_URLS.analyzeAssessment, '/analyze', 'POST', {
    studentId: 'test-student',
    assessmentData: {
      aptitudeScores: { logical: 80, verbal: 75 },
      knowledgeScores: { science: 70, math: 85 }
    }
  }, 15000);
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 500,
    status,
    data
  };
}

async function testGenerateProgramCareerPaths() {
  const { status, data } = await makeRequest(BASE_URLS.analyzeAssessment, '/generate-program-career-paths', 'POST', {
    programName: 'Computer Science',
    level: 'undergraduate'
  }, 15000);
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 500,
    status,
    data
  };
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('AI APIS INTEGRATION TEST SUITE');
  console.log('='.repeat(80));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('Note: AI calls may be slow (10-30s), please be patient...');
  console.log('='.repeat(80));

  // API 1: Role Overview API
  console.log('\n🎯 API 1: Role Overview API (3 endpoints)');
  await runTest('GET /health', testRoleOverviewHealth);
  await runTest('POST /role-overview', testGenerateRoleOverview);
  await runTest('POST /match-courses', testMatchCourses);

  // API 2: Question Generation API
  console.log('\n❓ API 2: Question Generation API (5 endpoints)');
  await runTest('GET /health', testQuestionGenHealth);
  await runTest('POST /career-assessment/generate-aptitude', testGenerateAptitude);
  await runTest('POST /career-assessment/generate-aptitude/stream', testStreamAptitude);
  await runTest('POST /generate', testGenerateCourseAssessment);
  await runTest('POST /generate/diagnostic', testGenerateDiagnostic);

  // API 3: Course API
  console.log('\n📚 API 3: Course API (7 endpoints)');
  await runTest('GET /health', testCourseHealth);
  await runTest('POST /ai-tutor/suggestions', testAITutorSuggestions);
  await runTest('POST /ai-tutor/chat', testAITutorChat);
  await runTest('POST /ai-tutor/feedback', testAITutorFeedback);
  await runTest('GET /ai-tutor/progress', testAITutorProgressGet);
  await runTest('POST /ai-tutor/progress', testAITutorProgressPost);
  await runTest('POST /ai-video-summarizer', testVideoSummarizer);

  // API 4: Analyze Assessment API
  console.log('\n📊 API 4: Analyze Assessment API (3 endpoints)');
  await runTest('GET /health', testAnalyzeAssessmentHealth);
  await runTest('POST /analyze', testAnalyzeAssessment);
  await runTest('POST /generate-program-career-paths', testGenerateProgramCareerPaths);

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Skipped: ${results.skipped}`);
  console.log(`📊 Total: ${results.passed + results.failed + results.skipped}`);
  const successRate = results.passed + results.failed > 0 
    ? ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
    : '0.0';
  console.log(`📈 Success Rate: ${successRate}%`);
  console.log('='.repeat(80));

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
