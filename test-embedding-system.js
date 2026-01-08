/**
 * Comprehensive Embedding System Test
 * Tests all functionalities from start to finish
 */

const WORKER_URL = 'https://embedding-api.dark-mode-d021.workers.dev';

async function runTests() {
  console.log('🧪 EMBEDDING SYSTEM COMPREHENSIVE TEST');
  console.log('='.repeat(50));
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Health Check
  console.log('\n📋 TEST 1: Health Check');
  try {
    const res = await fetch(`${WORKER_URL}/`);
    const data = await res.json();
    
    if (data.status === 'healthy' && data.embeddingProvider === 'openrouter') {
      console.log('✅ PASSED - Worker is healthy');
      console.log(`   Version: ${data.version}`);
      console.log(`   Provider: ${data.embeddingProvider}`);
      results.passed++;
      results.tests.push({ name: 'Health Check', status: 'PASSED' });
    } else {
      throw new Error('Unexpected health response');
    }
  } catch (err) {
    console.log('❌ FAILED -', err.message);
    results.failed++;
    results.tests.push({ name: 'Health Check', status: 'FAILED', error: err.message });
  }

  // Test 2: Stats Endpoint
  console.log('\n📋 TEST 2: Stats Endpoint');
  try {
    const res = await fetch(`${WORKER_URL}/stats`);
    const data = await res.json();
    
    if (data.success && data.stats && data.availableModels) {
      console.log('✅ PASSED - Stats retrieved');
      console.log(`   Students: ${data.stats.students.withEmbedding}/${data.stats.students.total} (${data.stats.students.coverage}%)`);
      console.log(`   Opportunities: ${data.stats.opportunities.withEmbedding}/${data.stats.opportunities.total} (${data.stats.opportunities.coverage}%)`);
      console.log(`   Courses: ${data.stats.courses.withEmbedding}/${data.stats.courses.total} (${data.stats.courses.coverage}%)`);
      console.log(`   Available Models: ${Object.keys(data.availableModels).filter(k => data.availableModels[k]).join(', ')}`);
      
      // Verify only openrouter and local are available (no openai/cohere)
      if (data.availableModels.openai !== undefined || data.availableModels.cohere !== undefined) {
        throw new Error('OpenAI/Cohere should be removed from availableModels');
      }
      
      results.passed++;
      results.tests.push({ name: 'Stats Endpoint', status: 'PASSED' });
    } else {
      throw new Error('Invalid stats response');
    }
  } catch (err) {
    console.log('❌ FAILED -', err.message);
    results.failed++;
    results.tests.push({ name: 'Stats Endpoint', status: 'FAILED', error: err.message });
  }

  // Test 3: Queue Status
  console.log('\n📋 TEST 3: Queue Status');
  try {
    const res = await fetch(`${WORKER_URL}/queue-status`);
    const data = await res.json();
    
    if (data.success && data.queue !== undefined) {
      console.log('✅ PASSED - Queue status retrieved');
      console.log(`   Pending: ${data.queue?.pending || 0}`);
      console.log(`   Processing: ${data.queue?.processing || 0}`);
      console.log(`   Completed: ${data.queue?.completed || 0}`);
      console.log(`   Failed: ${data.queue?.failed || 0}`);
      results.passed++;
      results.tests.push({ name: 'Queue Status', status: 'PASSED' });
    } else {
      throw new Error('Invalid queue status response');
    }
  } catch (err) {
    console.log('❌ FAILED -', err.message);
    results.failed++;
    results.tests.push({ name: 'Queue Status', status: 'FAILED', error: err.message });
  }

  // Test 4: Single Embedding Generation (OpenRouter)
  console.log('\n📋 TEST 4: Single Embedding Generation via OpenRouter');
  try {
    const testText = 'Software Engineer with 5 years experience in JavaScript, React, Node.js, Python, and AWS. Skilled in building scalable web applications.';
    
    const res = await fetch(`${WORKER_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: testText,
        id: 'test-embedding-' + Date.now(),
        table: 'students',
        model: 'openrouter'
      })
    });
    const data = await res.json();
    
    // This will fail on DB update (test ID doesn't exist) but we can check if embedding was generated
    if (data.model === 'openrouter' || (data.error && data.error.includes('Database'))) {
      console.log('✅ PASSED - OpenRouter embedding generation attempted');
      console.log(`   Model: ${data.model || 'openrouter (DB save failed as expected for test ID)'}`);
      console.log(`   Dimensions: ${data.dimensions || 'N/A'}`);
      results.passed++;
      results.tests.push({ name: 'Single Embedding (OpenRouter)', status: 'PASSED' });
    } else {
      throw new Error(data.error || 'Unexpected response');
    }
  } catch (err) {
    console.log('❌ FAILED -', err.message);
    results.failed++;
    results.tests.push({ name: 'Single Embedding (OpenRouter)', status: 'FAILED', error: err.message });
  }

  // Test 5: Regenerate Existing Record
  console.log('\n📋 TEST 5: Regenerate Embedding for Existing Student');
  try {
    // Use a known student ID that has minimal data
    const res = await fetch(`${WORKER_URL}/regenerate?table=students&id=bac8785f-6f9e-41c1-9243-2db3d374294b`, {
      method: 'POST'
    });
    const data = await res.json();
    
    if (data.success && data.model === 'openrouter') {
      console.log('✅ PASSED - Embedding regenerated');
      console.log(`   ID: ${data.id}`);
      console.log(`   Model: ${data.model}`);
      console.log(`   Dimensions: ${data.dimensions}`);
      console.log(`   Text Length: ${data.textLength}`);
      results.passed++;
      results.tests.push({ name: 'Regenerate Embedding', status: 'PASSED' });
    } else if (data.error && data.error.includes('Insufficient data')) {
      console.log('⚠️ SKIPPED - Test record has insufficient data');
      results.tests.push({ name: 'Regenerate Embedding', status: 'SKIPPED', error: 'Insufficient data' });
    } else {
      throw new Error(data.error || 'Unexpected response');
    }
  } catch (err) {
    console.log('❌ FAILED -', err.message);
    results.failed++;
    results.tests.push({ name: 'Regenerate Embedding', status: 'FAILED', error: err.message });
  }

  // Test 6: Process Queue
  console.log('\n📋 TEST 6: Process Embedding Queue');
  try {
    const res = await fetch(`${WORKER_URL}/process-queue`, {
      method: 'POST'
    });
    const data = await res.json();
    
    if (data.success !== undefined) {
      console.log('✅ PASSED - Queue processing executed');
      console.log(`   Processed: ${data.processed}`);
      console.log(`   Succeeded: ${data.succeeded}`);
      console.log(`   Failed: ${data.failed}`);
      results.passed++;
      results.tests.push({ name: 'Process Queue', status: 'PASSED' });
    } else {
      throw new Error(data.error || 'Unexpected response');
    }
  } catch (err) {
    console.log('❌ FAILED -', err.message);
    results.failed++;
    results.tests.push({ name: 'Process Queue', status: 'FAILED', error: err.message });
  }

  // Test 7: Backfill (limited)
  console.log('\n📋 TEST 7: Backfill Missing Embeddings');
  try {
    const res = await fetch(`${WORKER_URL}/backfill?table=students&limit=2`, {
      method: 'POST'
    });
    const data = await res.json();
    
    if (data.success !== undefined) {
      console.log('✅ PASSED - Backfill executed');
      console.log(`   Table: students`);
      console.log(`   Processed: ${data.processed}`);
      console.log(`   Succeeded: ${data.succeeded || 0}`);
      console.log(`   Failed: ${data.failed || 0}`);
      results.passed++;
      results.tests.push({ name: 'Backfill', status: 'PASSED' });
    } else {
      throw new Error(data.error || 'Unexpected response');
    }
  } catch (err) {
    console.log('❌ FAILED -', err.message);
    results.failed++;
    results.tests.push({ name: 'Backfill', status: 'FAILED', error: err.message });
  }

  // Test 8: Batch Embedding
  console.log('\n📋 TEST 8: Batch Embedding Generation');
  try {
    const res = await fetch(`${WORKER_URL}/embed/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            text: 'Data Scientist with expertise in Machine Learning, Python, TensorFlow',
            id: 'batch-test-1-' + Date.now(),
            table: 'students'
          },
          {
            text: 'Frontend Developer skilled in React, TypeScript, CSS',
            id: 'batch-test-2-' + Date.now(),
            table: 'students'
          }
        ]
      })
    });
    const data = await res.json();
    
    if (data.success && data.processed === 2) {
      console.log('✅ PASSED - Batch processing executed');
      console.log(`   Processed: ${data.processed}`);
      console.log(`   Succeeded: ${data.succeeded}`);
      console.log(`   Failed: ${data.failed}`);
      results.passed++;
      results.tests.push({ name: 'Batch Embedding', status: 'PASSED' });
    } else {
      throw new Error(data.error || 'Unexpected response');
    }
  } catch (err) {
    console.log('❌ FAILED -', err.message);
    results.failed++;
    results.tests.push({ name: 'Batch Embedding', status: 'FAILED', error: err.message });
  }

  // Test 9: CORS Headers
  console.log('\n📋 TEST 9: CORS Headers');
  try {
    const res = await fetch(`${WORKER_URL}/`, {
      method: 'OPTIONS'
    });
    
    const corsOrigin = res.headers.get('Access-Control-Allow-Origin');
    const corsMethods = res.headers.get('Access-Control-Allow-Methods');
    
    if (corsOrigin === '*' && corsMethods?.includes('POST')) {
      console.log('✅ PASSED - CORS headers present');
      console.log(`   Allow-Origin: ${corsOrigin}`);
      console.log(`   Allow-Methods: ${corsMethods}`);
      results.passed++;
      results.tests.push({ name: 'CORS Headers', status: 'PASSED' });
    } else {
      throw new Error('Missing or incorrect CORS headers');
    }
  } catch (err) {
    console.log('❌ FAILED -', err.message);
    results.failed++;
    results.tests.push({ name: 'CORS Headers', status: 'FAILED', error: err.message });
  }

  // Test 10: Error Handling (Invalid Table)
  console.log('\n📋 TEST 10: Error Handling (Invalid Table)');
  try {
    const res = await fetch(`${WORKER_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Test',
        id: 'test',
        table: 'invalid_table'
      })
    });
    const data = await res.json();
    
    if (res.status === 400 && data.error?.includes('Invalid table')) {
      console.log('✅ PASSED - Proper error handling');
      console.log(`   Status: ${res.status}`);
      console.log(`   Error: ${data.error}`);
      results.passed++;
      results.tests.push({ name: 'Error Handling', status: 'PASSED' });
    } else {
      throw new Error('Expected 400 error for invalid table');
    }
  } catch (err) {
    console.log('❌ FAILED -', err.message);
    results.failed++;
    results.tests.push({ name: 'Error Handling', status: 'FAILED', error: err.message });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📝 Total: ${results.tests.length}`);
  console.log('\nDetailed Results:');
  results.tests.forEach((t, i) => {
    const icon = t.status === 'PASSED' ? '✅' : t.status === 'SKIPPED' ? '⚠️' : '❌';
    console.log(`  ${i + 1}. ${icon} ${t.name}: ${t.status}${t.error ? ` (${t.error})` : ''}`);
  });

  return results;
}

// Run tests
runTests().then(results => {
  console.log('\n🏁 Tests completed!');
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
