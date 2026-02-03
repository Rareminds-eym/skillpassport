/**
 * Performance Testing Script for All APIs
 * 
 * Tests all endpoints with load testing and measures:
 * - Response times (p50, p95, p99)
 * - Throughput
 * - Error rates
 * - Caching effectiveness
 * 
 * Usage: node test-performance-all-apis.cjs
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:8788',
  concurrentRequests: 10,
  requestsPerEndpoint: 50,
  warmupRequests: 5,
  
  // Test data
  testStudentId: '123e4567-e89b-12d3-a456-426614174000',
  testSchoolCode: 'TEST001',
  testCollegeCode: 'COLL001',
  testUniversityCode: 'UNIV001',
  testCompanyCode: 'COMP001',
  testEmail: 'test@example.com',
  testCourseId: '123e4567-e89b-12d3-a456-426614174001',
  testLessonId: '123e4567-e89b-12d3-a456-426614174002',
  testRole: 'Software Engineer',
  testGradeLevel: 'grade_10',
};

// Results storage
const results = {
  user: [],
  storage: [],
  roleOverview: [],
  questionGeneration: [],
  course: [],
  career: [],
  adaptiveSession: [],
};

// Utility functions
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.baseUrl);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const startTime = Date.now();
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data: data ? JSON.parse(data) : null,
          headers: res.headers,
        });
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      reject({
        error: error.message,
        responseTime: endTime - startTime,
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runConcurrentRequests(requestFn, count, concurrency) {
  const results = [];
  const batches = Math.ceil(count / concurrency);
  
  for (let i = 0; i < batches; i++) {
    const batchSize = Math.min(concurrency, count - i * concurrency);
    const promises = Array(batchSize).fill(null).map(() => requestFn());
    const batchResults = await Promise.allSettled(promises);
    results.push(...batchResults);
  }
  
  return results;
}

function calculateStats(responseTimes) {
  if (responseTimes.length === 0) return null;
  
  const sorted = responseTimes.sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / sorted.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

function printStats(name, stats, errors) {
  console.log(`\n${name}:`);
  if (!stats) {
    console.log('  No successful requests');
    return;
  }
  
  console.log(`  Requests: ${stats.count}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Min: ${stats.min}ms`);
  console.log(`  Mean: ${Math.round(stats.mean)}ms`);
  console.log(`  p50: ${stats.p50}ms`);
  console.log(`  p95: ${stats.p95}ms`);
  console.log(`  p99: ${stats.p99}ms`);
  console.log(`  Max: ${stats.max}ms`);
  
  // Flag slow endpoints
  if (stats.p95 > 1000) {
    console.log(`  ⚠️  SLOW: p95 > 1000ms`);
  } else if (stats.p95 > 500) {
    console.log(`  ⚠️  MODERATE: p95 > 500ms`);
  } else {
    console.log(`  ✅ FAST: p95 < 500ms`);
  }
}

// Test functions for each API

async function testUserAPI() {
  console.log('\n=== Testing User API ===');
  
  const tests = [
    {
      name: 'GET /api/user/schools',
      fn: () => makeRequest('GET', '/api/user/schools'),
    },
    {
      name: 'GET /api/user/colleges',
      fn: () => makeRequest('GET', '/api/user/colleges'),
    },
    {
      name: 'GET /api/user/universities',
      fn: () => makeRequest('GET', '/api/user/universities'),
    },
    {
      name: 'GET /api/user/companies',
      fn: () => makeRequest('GET', '/api/user/companies'),
    },
    {
      name: 'POST /api/user/check-school-code',
      fn: () => makeRequest('POST', '/api/user/check-school-code', { code: CONFIG.testSchoolCode }),
    },
    {
      name: 'POST /api/user/check-email',
      fn: () => makeRequest('POST', '/api/user/check-email', { email: CONFIG.testEmail }),
    },
  ];
  
  for (const test of tests) {
    console.log(`\nTesting ${test.name}...`);
    
    // Warmup
    for (let i = 0; i < CONFIG.warmupRequests; i++) {
      await test.fn().catch(() => {});
    }
    
    // Actual test
    const testResults = await runConcurrentRequests(
      test.fn,
      CONFIG.requestsPerEndpoint,
      CONFIG.concurrentRequests
    );
    
    const responseTimes = testResults
      .filter(r => r.status === 'fulfilled' && r.value.statusCode < 500)
      .map(r => r.value.responseTime);
    
    const errors = testResults.filter(r => r.status === 'rejected' || r.value?.statusCode >= 500).length;
    
    const stats = calculateStats(responseTimes);
    printStats(test.name, stats, errors);
    
    results.user.push({ name: test.name, stats, errors });
  }
}

async function testStorageAPI() {
  console.log('\n=== Testing Storage API ===');
  
  const tests = [
    {
      name: 'POST /api/storage/presigned',
      fn: () => makeRequest('POST', '/api/storage/presigned', {
        key: `test-${Date.now()}.pdf`,
        contentType: 'application/pdf',
      }),
    },
    {
      name: 'POST /api/storage/get-url',
      fn: () => makeRequest('POST', '/api/storage/get-url', {
        key: 'test-file.pdf',
      }),
    },
    {
      name: 'GET /api/storage/files/:courseId/:lessonId',
      fn: () => makeRequest('GET', `/api/storage/files/${CONFIG.testCourseId}/${CONFIG.testLessonId}`),
    },
  ];
  
  for (const test of tests) {
    console.log(`\nTesting ${test.name}...`);
    
    // Warmup
    for (let i = 0; i < CONFIG.warmupRequests; i++) {
      await test.fn().catch(() => {});
    }
    
    // Actual test
    const testResults = await runConcurrentRequests(
      test.fn,
      CONFIG.requestsPerEndpoint,
      CONFIG.concurrentRequests
    );
    
    const responseTimes = testResults
      .filter(r => r.status === 'fulfilled' && r.value.statusCode < 500)
      .map(r => r.value.responseTime);
    
    const errors = testResults.filter(r => r.status === 'rejected' || r.value?.statusCode >= 500).length;
    
    const stats = calculateStats(responseTimes);
    printStats(test.name, stats, errors);
    
    results.storage.push({ name: test.name, stats, errors });
  }
}

async function testRoleOverviewAPI() {
  console.log('\n=== Testing Role Overview API ===');
  
  const tests = [
    {
      name: 'POST /api/role-overview/generate',
      fn: () => makeRequest('POST', '/api/role-overview/generate', {
        roleTitle: CONFIG.testRole,
        gradeLevel: CONFIG.testGradeLevel,
      }),
    },
  ];
  
  for (const test of tests) {
    console.log(`\nTesting ${test.name}...`);
    
    // Warmup
    for (let i = 0; i < CONFIG.warmupRequests; i++) {
      await test.fn().catch(() => {});
    }
    
    // Actual test - fewer requests for AI endpoints
    const testResults = await runConcurrentRequests(
      test.fn,
      Math.min(CONFIG.requestsPerEndpoint, 20),
      Math.min(CONFIG.concurrentRequests, 3)
    );
    
    const responseTimes = testResults
      .filter(r => r.status === 'fulfilled' && r.value.statusCode < 500)
      .map(r => r.value.responseTime);
    
    const errors = testResults.filter(r => r.status === 'rejected' || r.value?.statusCode >= 500).length;
    
    const stats = calculateStats(responseTimes);
    printStats(test.name, stats, errors);
    
    results.roleOverview.push({ name: test.name, stats, errors });
  }
}

async function testQuestionGenerationAPI() {
  console.log('\n=== Testing Question Generation API ===');
  
  const tests = [
    {
      name: 'POST /api/question-generation/generate/career-aptitude',
      fn: () => makeRequest('POST', '/api/question-generation/generate/career-aptitude', {
        gradeLevel: CONFIG.testGradeLevel,
        count: 5,
      }),
    },
  ];
  
  for (const test of tests) {
    console.log(`\nTesting ${test.name}...`);
    
    // Warmup
    for (let i = 0; i < CONFIG.warmupRequests; i++) {
      await test.fn().catch(() => {});
    }
    
    // Actual test - fewer requests for AI endpoints
    const testResults = await runConcurrentRequests(
      test.fn,
      Math.min(CONFIG.requestsPerEndpoint, 20),
      Math.min(CONFIG.concurrentRequests, 3)
    );
    
    const responseTimes = testResults
      .filter(r => r.status === 'fulfilled' && r.value.statusCode < 500)
      .map(r => r.value.responseTime);
    
    const errors = testResults.filter(r => r.status === 'rejected' || r.value?.statusCode >= 500).length;
    
    const stats = calculateStats(responseTimes);
    printStats(test.name, stats, errors);
    
    results.questionGeneration.push({ name: test.name, stats, errors });
  }
}

async function testCourseAPI() {
  console.log('\n=== Testing Course API ===');
  
  const tests = [
    {
      name: 'POST /api/course/ai-tutor/suggestions',
      fn: () => makeRequest('POST', '/api/course/ai-tutor/suggestions', {
        courseId: CONFIG.testCourseId,
        lessonId: CONFIG.testLessonId,
        studentId: CONFIG.testStudentId,
      }),
    },
  ];
  
  for (const test of tests) {
    console.log(`\nTesting ${test.name}...`);
    
    // Warmup
    for (let i = 0; i < CONFIG.warmupRequests; i++) {
      await test.fn().catch(() => {});
    }
    
    // Actual test - fewer requests for AI endpoints
    const testResults = await runConcurrentRequests(
      test.fn,
      Math.min(CONFIG.requestsPerEndpoint, 20),
      Math.min(CONFIG.concurrentRequests, 3)
    );
    
    const responseTimes = testResults
      .filter(r => r.status === 'fulfilled' && r.value.statusCode < 500)
      .map(r => r.value.responseTime);
    
    const errors = testResults.filter(r => r.status === 'rejected' || r.value?.statusCode >= 500).length;
    
    const stats = calculateStats(responseTimes);
    printStats(test.name, stats, errors);
    
    results.course.push({ name: test.name, stats, errors });
  }
}

async function testCachingEffectiveness() {
  console.log('\n=== Testing Caching Effectiveness ===');
  
  // Test the same request multiple times to see if caching improves performance
  const testEndpoint = '/api/user/schools';
  
  console.log('\nFirst request (cold cache):');
  const firstRequest = await makeRequest('GET', testEndpoint);
  console.log(`  Response time: ${firstRequest.responseTime}ms`);
  console.log(`  Cache-Control: ${firstRequest.headers['cache-control'] || 'none'}`);
  console.log(`  X-Cache: ${firstRequest.headers['x-cache'] || 'none'}`);
  
  console.log('\nSecond request (should hit cache):');
  const secondRequest = await makeRequest('GET', testEndpoint);
  console.log(`  Response time: ${secondRequest.responseTime}ms`);
  console.log(`  Cache-Control: ${secondRequest.headers['cache-control'] || 'none'}`);
  console.log(`  X-Cache: ${secondRequest.headers['x-cache'] || 'none'}`);
  
  console.log('\nThird request (should hit cache):');
  const thirdRequest = await makeRequest('GET', testEndpoint);
  console.log(`  Response time: ${thirdRequest.responseTime}ms`);
  console.log(`  Cache-Control: ${thirdRequest.headers['cache-control'] || 'none'}`);
  console.log(`  X-Cache: ${thirdRequest.headers['x-cache'] || 'none'}`);
  
  // Check if caching is working
  const hasCacheHeaders = firstRequest.headers['cache-control'] && firstRequest.headers['cache-control'].includes('max-age');
  const hasXCacheHeader = secondRequest.headers['x-cache'] === 'HIT' || thirdRequest.headers['x-cache'] === 'HIT';
  
  if (hasCacheHeaders && hasXCacheHeader) {
    console.log('\n✅ Caching is implemented and working');
    console.log(`   Cache hit detected on subsequent requests`);
  } else if (hasCacheHeaders) {
    console.log('\n✅ Cache-Control headers present');
    console.log(`   Browser/CDN caching enabled`);
  } else {
    console.log('\n❌ Caching not implemented');
  }
  
  // Calculate average response time for cached requests
  const avgCachedTime = (secondRequest.responseTime + thirdRequest.responseTime) / 2;
  const improvement = ((firstRequest.responseTime - avgCachedTime) / firstRequest.responseTime * 100).toFixed(1);
  
  if (improvement > 0) {
    console.log(`   Performance improvement: ${improvement}% faster on cached requests`);
  }
}

function generateSummaryReport() {
  console.log('\n\n=== PERFORMANCE SUMMARY ===');
  
  const allResults = [
    ...results.user,
    ...results.storage,
    ...results.roleOverview,
    ...results.questionGeneration,
    ...results.course,
  ];
  
  // Find slowest endpoints
  const slowEndpoints = allResults
    .filter(r => r.stats && r.stats.p95 > 500)
    .sort((a, b) => b.stats.p95 - a.stats.p95);
  
  if (slowEndpoints.length > 0) {
    console.log('\n⚠️  Slow Endpoints (p95 > 500ms):');
    slowEndpoints.forEach(endpoint => {
      console.log(`  ${endpoint.name}: ${endpoint.stats.p95}ms (p95)`);
    });
  } else {
    console.log('\n✅ All endpoints are fast (p95 < 500ms)');
  }
  
  // Find endpoints with high error rates
  const errorEndpoints = allResults
    .filter(r => r.errors > 0)
    .sort((a, b) => b.errors - a.errors);
  
  if (errorEndpoints.length > 0) {
    console.log('\n⚠️  Endpoints with Errors:');
    errorEndpoints.forEach(endpoint => {
      const errorRate = (r.errors / (r.stats?.count + r.errors) * 100).toFixed(1);
      console.log(`  ${endpoint.name}: ${endpoint.errors} errors (${errorRate}%)`);
    });
  } else {
    console.log('\n✅ No errors detected');
  }
  
  // Calculate overall statistics
  const allResponseTimes = allResults
    .filter(r => r.stats)
    .flatMap(r => Array(r.stats.count).fill(r.stats.mean));
  
  if (allResponseTimes.length > 0) {
    const overallStats = calculateStats(allResponseTimes);
    console.log('\n📊 Overall Statistics:');
    console.log(`  Total requests: ${allResponseTimes.length}`);
    console.log(`  Mean response time: ${Math.round(overallStats.mean)}ms`);
    console.log(`  p50: ${overallStats.p50}ms`);
    console.log(`  p95: ${overallStats.p95}ms`);
    console.log(`  p99: ${overallStats.p99}ms`);
  }
  
  console.log('\n=== END OF PERFORMANCE TESTING ===\n');
}

// Main execution
async function main() {
  console.log('🚀 Starting Performance Testing');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Concurrent requests: ${CONFIG.concurrentRequests}`);
  console.log(`Requests per endpoint: ${CONFIG.requestsPerEndpoint}`);
  console.log(`Warmup requests: ${CONFIG.warmupRequests}`);
  
  try {
    // Test each API
    await testUserAPI();
    await testStorageAPI();
    await testRoleOverviewAPI();
    await testQuestionGenerationAPI();
    await testCourseAPI();
    
    // Test caching
    await testCachingEffectiveness();
    
    // Generate summary
    generateSummaryReport();
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run tests
main();
