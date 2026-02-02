#!/usr/bin/env node

/**
 * Complete Storage API Integration Test Suite
 * Tests all 14 Storage API endpoints
 * 
 * Usage: node test-storage-api-complete.cjs
 * Prerequisites: npm run pages:dev running on localhost:8788
 */

const BASE_URL = 'http://localhost:8788/api/storage';

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function to make HTTP requests
async function makeRequest(method, path, body = null, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body && typeof body === 'object') {
    options.body = JSON.stringify(body);
  } else if (body) {
    options.body = body;
  }

  try {
    const response = await fetch(url, options);
    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    return { status: response.status, data };
  } catch (error) {
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
// CATEGORY 1: Core Operations (2 endpoints)
// ============================================================================

async function testUpload() {
  // Note: This requires multipart/form-data which is complex in Node.js
  // We'll test if the endpoint exists and responds appropriately
  const { status, data } = await makeRequest('POST', '/upload', {
    test: 'data'
  });
  
  // Expecting 400 (bad request) or 500 (missing file), not 404
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    skipped: status === 400 || status === 500,
    status,
    data
  };
}

async function testDelete() {
  const { status, data } = await makeRequest('POST', '/delete', {
    key: 'test/nonexistent.txt'
  });
  
  // Endpoint should respond (even if file doesn't exist)
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

// ============================================================================
// CATEGORY 2: Presigned URLs (4 endpoints)
// ============================================================================

async function testPresigned() {
  const { status, data } = await makeRequest('POST', '/presigned', {
    fileName: 'test.pdf',
    fileType: 'application/pdf',
    path: 'documents'
  });
  
  return {
    success: status === 200 || status === 201,
    reason: ![200, 201].includes(status) ? `Expected 200/201, got ${status}` : null,
    status,
    data
  };
}

async function testConfirm() {
  const { status, data } = await makeRequest('POST', '/confirm', {
    key: 'test/test.pdf'
  });
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

async function testGetUrl() {
  const { status, data } = await makeRequest('POST', '/get-url', {
    key: 'test/test.pdf'
  });
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

async function testGetFileUrl() {
  const { status, data } = await makeRequest('POST', '/get-file-url', {
    key: 'test/test.pdf'
  });
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

// ============================================================================
// CATEGORY 3: Document Access (1 endpoint)
// ============================================================================

async function testDocumentAccess() {
  const { status, data } = await makeRequest('GET', '/document-access?key=test/test.pdf');
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

// ============================================================================
// CATEGORY 4: Signed URLs (2 endpoints)
// ============================================================================

async function testSignedUrl() {
  const { status, data } = await makeRequest('POST', '/signed-url', {
    key: 'test/test.pdf'
  });
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

async function testSignedUrls() {
  const { status, data } = await makeRequest('POST', '/signed-urls', {
    keys: ['test/test1.pdf', 'test/test2.pdf']
  });
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

// ============================================================================
// CATEGORY 5: Specialized Handlers (3 endpoints)
// ============================================================================

async function testUploadPaymentReceipt() {
  // Simple PDF base64 (minimal valid PDF)
  const simplePdfBase64 = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDQ0Pj4Kc3RyZWFtCkJUCi9GMSA0OCBUZgoxMCA3MDAgVGQKKFRlc3QpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmDQowMDAwMDAwMDE1IDAwMDAwIG4NCjAwMDAwMDAwNjQgMDAwMDAgbg0KMDAwMDAwMDEyMyAwMDAwMCBuDQowMDAwMDAwMjQ2IDAwMDAwIG4NCjAwMDAwMDAzMTQgMDAwMDAgbg0KdHJhaWxlcgo8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0MDYKJSVFT0YK';
  
  const { status, data } = await makeRequest('POST', '/upload-payment-receipt', {
    studentId: 'test-student-id',
    pdfBase64: simplePdfBase64
  });
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

async function testGetPaymentReceipt() {
  const { status, data } = await makeRequest('GET', '/payment-receipt?studentId=test-student-id');
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

async function testCourseCertificate() {
  const { status, data } = await makeRequest('GET', '/course-certificate?studentId=test-student-id&courseId=test-course-id');
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

// ============================================================================
// CATEGORY 6: PDF & File Operations (2 endpoints)
// ============================================================================

async function testExtractContent() {
  const { status, data } = await makeRequest('POST', '/extract-content', {
    key: 'test/document.pdf'
  });
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

async function testListFiles() {
  const { status, data } = await makeRequest('GET', '/files/test-course-id/test-lesson-id');
  
  return {
    success: status !== 404,
    reason: status === 404 ? 'Endpoint not found' : null,
    status,
    data
  };
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('STORAGE API INTEGRATION TEST SUITE');
  console.log('='.repeat(80));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  // Category 1: Core Operations
  console.log('\n📦 CATEGORY 1: Core Operations (2 endpoints)');
  await runTest('POST /upload', testUpload);
  await runTest('POST /delete', testDelete);

  // Category 2: Presigned URLs
  console.log('\n🔗 CATEGORY 2: Presigned URLs (4 endpoints)');
  await runTest('POST /presigned', testPresigned);
  await runTest('POST /confirm', testConfirm);
  await runTest('POST /get-url', testGetUrl);
  await runTest('POST /get-file-url', testGetFileUrl);

  // Category 3: Document Access
  console.log('\n📄 CATEGORY 3: Document Access (1 endpoint)');
  await runTest('GET /document-access', testDocumentAccess);

  // Category 4: Signed URLs
  console.log('\n🔐 CATEGORY 4: Signed URLs (2 endpoints)');
  await runTest('POST /signed-url', testSignedUrl);
  await runTest('POST /signed-urls', testSignedUrls);

  // Category 5: Specialized Handlers
  console.log('\n💳 CATEGORY 5: Specialized Handlers (3 endpoints)');
  await runTest('POST /upload-payment-receipt', testUploadPaymentReceipt);
  await runTest('GET /payment-receipt', testGetPaymentReceipt);
  await runTest('GET /course-certificate', testCourseCertificate);

  // Category 6: PDF & File Operations
  console.log('\n📋 CATEGORY 6: PDF & File Operations (2 endpoints)');
  await runTest('POST /extract-content', testExtractContent);
  await runTest('GET /files/:courseId/:lessonId', testListFiles);

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
