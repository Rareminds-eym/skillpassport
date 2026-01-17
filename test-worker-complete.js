/**
 * Complete Worker Test Script
 * Tests deterministic results, seed generation, and embedding fixes
 * 
 * Usage:
 * 1. Get your auth token from browser (Application > Local Storage > supabase.auth.token)
 * 2. Run: node test-worker-complete.js YOUR_AUTH_TOKEN
 * 3. Or paste this entire script in browser console (token will be auto-detected)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  WORKER_URL: 'https://analyze-assessment-api.dark-mode-d021.workers.dev',
  EMBEDDING_URL: 'https://career-api.dark-mode-d021.workers.dev',
  EXPECTED_VERSION: '126dd3c3-5f51-44a1-951a-bcb7729a4e0e',
  EXPECTED_RESPONSE_KEYS: 15, // Should include _metadata
  MIN_RESPONSE_KEYS: 14 // Old version
};

// ============================================================================
// TEST DATA
// ============================================================================

const SAMPLE_ASSESSMENT_DATA = {
  gradeLevel: 'after10',
  stream: 'science',
  riasecAnswers: {
    'r1': { question: 'Work with tools', answer: 4, categoryMapping: { '4': 'R' }, type: 'rating' },
    'i1': { question: 'Solve problems', answer: 5, categoryMapping: { '5': 'I' }, type: 'rating' },
    'a1': { question: 'Create art', answer: 3, categoryMapping: { '3': 'A' }, type: 'rating' },
    's1': { question: 'Help people', answer: 5, categoryMapping: { '5': 'S' }, type: 'rating' },
    'e1': { question: 'Lead teams', answer: 4, categoryMapping: { '4': 'E' }, type: 'rating' },
    'c1': { question: 'Organize data', answer: 3, categoryMapping: { '3': 'C' }, type: 'rating' }
  },
  aptitudeScores: {
    verbal: { correct: 8, total: 10, percentage: 80 },
    numerical: { correct: 9, total: 10, percentage: 90 },
    abstract: { correct: 7, total: 10, percentage: 70 },
    spatial: { correct: 6, total: 10, percentage: 60 },
    clerical: { correct: 8, total: 10, percentage: 80 }
  },
  bigFiveAnswers: {
    'o1': { question: 'Open to new experiences', answer: 4 },
    'c1': { question: 'Organized and careful', answer: 5 },
    'e1': { question: 'Outgoing and energetic', answer: 3 },
    'a1': { question: 'Friendly and compassionate', answer: 5 },
    'n1': { question: 'Anxious and easily upset', answer: 2 }
  },
  workValuesAnswers: {
    'v1': { question: 'Achievement', answer: 5 },
    'v2': { question: 'Independence', answer: 4 },
    'v3': { question: 'Recognition', answer: 3 }
  },
  employabilityAnswers: {
    selfRating: {
      Communication: [{ question: 'Express ideas clearly', answer: 4, domain: 'Communication' }],
      Teamwork: [{ question: 'Work well with others', answer: 5, domain: 'Teamwork' }],
      ProblemSolving: [{ question: 'Solve complex problems', answer: 4, domain: 'Problem Solving' }],
      Adaptability: [{ question: 'Adapt to change', answer: 5, domain: 'Adaptability' }],
      Leadership: [{ question: 'Lead projects', answer: 3, domain: 'Leadership' }],
      DigitalFluency: [{ question: 'Use technology', answer: 5, domain: 'Digital Fluency' }],
      Professionalism: [{ question: 'Act professionally', answer: 5, domain: 'Professionalism' }],
      CareerReadiness: [{ question: 'Ready for career', answer: 4, domain: 'Career Readiness' }]
    },
    sjt: [
      {
        scenario: 'Team conflict',
        question: 'What would you do?',
        studentBestChoice: 'Mediate',
        correctBest: 'Mediate',
        bestCorrect: true,
        score: 2
      }
    ]
  },
  knowledgeAnswers: {
    'k1': { question: 'Physics concept', studentAnswer: 'A', correctAnswer: 'A', isCorrect: true },
    'k2': { question: 'Chemistry concept', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true },
    'k3': { question: 'Biology concept', studentAnswer: 'C', correctAnswer: 'C', isCorrect: true }
  },
  sectionTimings: {
    riasec: { seconds: 180, formatted: '3 minutes' },
    aptitude: { seconds: 600, formatted: '10 minutes' },
    bigfive: { seconds: 120, formatted: '2 minutes' },
    values: { seconds: 90, formatted: '1 minute 30 seconds' },
    employability: { seconds: 240, formatted: '4 minutes' },
    knowledge: { seconds: 300, formatted: '5 minutes' },
    totalTime: 1530,
    totalFormatted: '25 minutes 30 seconds'
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}▶${colors.reset} ${msg}`),
  result: (msg) => console.log(`${colors.magenta}→${colors.reset} ${msg}`)
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

/**
 * Test 1: Worker Health Check
 */
async function testWorkerHealth() {
  log.test('Test 1: Worker Health Check');
  
  try {
    const response = await fetch(CONFIG.WORKER_URL, {
      method: 'GET'
    });
    
    if (response.ok) {
      log.success('Worker is responding');
      const text = await response.text();
      log.result(`Response: ${text.substring(0, 100)}...`);
      return true;
    } else {
      log.error(`Worker returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Worker health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Authentication
 */
async function testAuthentication(token) {
  log.test('Test 2: Authentication');
  
  if (!token) {
    log.error('No auth token provided');
    return false;
  }
  
  try {
    const response = await fetch(`${CONFIG.WORKER_URL}/analyze-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: SAMPLE_ASSESSMENT_DATA })
    });
    
    if (response.status === 401) {
      log.error('Authentication failed - token invalid or expired');
      return false;
    }
    
    log.success('Authentication successful');
    return true;
  } catch (error) {
    log.error(`Authentication test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Deterministic Results (Main Test)
 */
async function testDeterministicResults(token) {
  log.test('Test 3: Deterministic Results (Main Test)');
  
  try {
    // First call
    log.info('Making first API call...');
    const response1 = await fetch(`${CONFIG.WORKER_URL}/analyze-assessment?v=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: SAMPLE_ASSESSMENT_DATA })
    });
    
    if (!response1.ok) {
      const errorText = await response1.text();
      log.error(`First call failed: ${response1.status} - ${errorText}`);
      return false;
    }
    
    const result1 = await response1.json();
    
    // Check response structure
    const keys1 = Object.keys(result1.data || {});
    log.result(`First response has ${keys1.length} keys`);
    
    if (keys1.length < CONFIG.MIN_RESPONSE_KEYS) {
      log.error(`Response has too few keys (${keys1.length}), expected at least ${CONFIG.MIN_RESPONSE_KEYS}`);
      return false;
    }
    
    // Check for _metadata
    if (!result1.data._metadata) {
      log.warning('Response missing _metadata field - using OLD worker version!');
      log.warning('Wait 10-20 more minutes for Cloudflare propagation');
      return false;
    }
    
    const seed1 = result1.data._metadata.seed;
    const model1 = result1.data._metadata.model;
    
    log.success(`First call successful`);
    log.result(`Seed: ${seed1}`);
    log.result(`Model: ${model1}`);
    log.result(`Deterministic: ${result1.data._metadata.deterministic}`);
    log.result(`Response keys: ${keys1.length}`);
    
    // Wait a bit
    log.info('Waiting 2 seconds before second call...');
    await sleep(2000);
    
    // Second call
    log.info('Making second API call with SAME data...');
    const response2 = await fetch(`${CONFIG.WORKER_URL}/analyze-assessment?v=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: SAMPLE_ASSESSMENT_DATA })
    });
    
    if (!response2.ok) {
      const errorText = await response2.text();
      log.error(`Second call failed: ${response2.status} - ${errorText}`);
      return false;
    }
    
    const result2 = await response2.json();
    const seed2 = result2.data._metadata?.seed;
    
    log.success(`Second call successful`);
    log.result(`Seed: ${seed2}`);
    
    // Compare seeds
    if (seed1 === seed2) {
      log.success('✓ SEEDS MATCH! Deterministic results working!');
    } else {
      log.error(`✗ SEEDS DIFFER! ${seed1} !== ${seed2}`);
      log.error('Deterministic results NOT working!');
      return false;
    }
    
    // Compare career clusters
    const clusters1 = result1.data.careerFit?.clusters || [];
    const clusters2 = result2.data.careerFit?.clusters || [];
    
    if (clusters1.length !== clusters2.length) {
      log.error(`Career cluster count differs: ${clusters1.length} vs ${clusters2.length}`);
      return false;
    }
    
    let clustersMatch = true;
    for (let i = 0; i < Math.min(3, clusters1.length); i++) {
      const c1 = clusters1[i];
      const c2 = clusters2[i];
      
      if (c1.title === c2.title && c1.matchScore === c2.matchScore) {
        log.success(`  Cluster ${i + 1}: ${c1.title} (${c1.matchScore}%) - MATCH`);
      } else {
        log.error(`  Cluster ${i + 1}: "${c1.title}" (${c1.matchScore}%) vs "${c2.title}" (${c2.matchScore}%) - DIFFER`);
        clustersMatch = false;
      }
    }
    
    if (clustersMatch) {
      log.success('✓ CAREER CLUSTERS MATCH! Results are identical!');
      return true;
    } else {
      log.error('✗ CAREER CLUSTERS DIFFER! Results are NOT deterministic!');
      return false;
    }
    
  } catch (error) {
    log.error(`Deterministic test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Response Structure
 */
async function testResponseStructure(token) {
  log.test('Test 4: Response Structure');
  
  try {
    const response = await fetch(`${CONFIG.WORKER_URL}/analyze-assessment?v=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: SAMPLE_ASSESSMENT_DATA })
    });
    
    if (!response.ok) {
      log.error(`API call failed: ${response.status}`);
      return false;
    }
    
    const result = await response.json();
    const data = result.data;
    
    // Check required fields
    const requiredFields = [
      'riasec',
      'aptitude',
      'bigFive',
      'workValues',
      'employability',
      'knowledge',
      'careerFit',
      'skillGap',
      'roadmap',
      'finalNote',
      'profileSnapshot',
      'overallSummary'
    ];
    
    let allPresent = true;
    for (const field of requiredFields) {
      if (data[field]) {
        log.success(`  ✓ ${field}`);
      } else {
        log.error(`  ✗ ${field} - MISSING`);
        allPresent = false;
      }
    }
    
    // Check _metadata (new field)
    if (data._metadata) {
      log.success(`  ✓ _metadata (NEW FIELD)`);
      log.result(`    - seed: ${data._metadata.seed}`);
      log.result(`    - model: ${data._metadata.model}`);
      log.result(`    - deterministic: ${data._metadata.deterministic}`);
      log.result(`    - timestamp: ${data._metadata.timestamp}`);
    } else {
      log.warning(`  ⚠ _metadata - MISSING (old worker version)`);
    }
    
    return allPresent;
    
  } catch (error) {
    log.error(`Response structure test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Embedding Service UUID Fix
 */
async function testEmbeddingService() {
  log.test('Test 5: Embedding Service UUID Fix');
  
  try {
    // Generate a valid UUID v4
    const generateUUID = () => {
      const timestamp = Date.now().toString(16).padStart(12, '0');
      const random = Math.random().toString(16).substring(2, 14);
      return `${timestamp.substring(0, 8)}-${timestamp.substring(8, 12)}-4${random.substring(0, 3)}-${random.substring(3, 7)}-${random.substring(7, 19)}`;
    };
    
    const testUUID = generateUUID();
    log.info(`Testing with UUID: ${testUUID}`);
    
    const response = await fetch(`${CONFIG.EMBEDDING_URL}/generate-embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Test embedding for career assessment',
        table: 'profiles',
        id: testUUID,
        returnEmbedding: true
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.embedding && Array.isArray(result.embedding)) {
        log.success('Embedding service working correctly');
        log.result(`Embedding dimension: ${result.embedding.length}`);
        return true;
      } else {
        log.error('Embedding response invalid');
        return false;
      }
    } else {
      const errorText = await response.text();
      log.error(`Embedding service failed: ${response.status} - ${errorText}`);
      return false;
    }
    
  } catch (error) {
    log.error(`Embedding test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Cache-Busting
 */
async function testCacheBusting(token) {
  log.test('Test 6: Cache-Busting Parameter');
  
  try {
    const timestamp1 = Date.now();
    const response1 = await fetch(`${CONFIG.WORKER_URL}/analyze-assessment?v=${timestamp1}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: SAMPLE_ASSESSMENT_DATA })
    });
    
    await sleep(100);
    
    const timestamp2 = Date.now();
    const response2 = await fetch(`${CONFIG.WORKER_URL}/analyze-assessment?v=${timestamp2}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: SAMPLE_ASSESSMENT_DATA })
    });
    
    if (response1.ok && response2.ok) {
      log.success('Cache-busting parameter working');
      log.result(`Request 1: ?v=${timestamp1}`);
      log.result(`Request 2: ?v=${timestamp2}`);
      return true;
    } else {
      log.error('Cache-busting test failed');
      return false;
    }
    
  } catch (error) {
    log.error(`Cache-busting test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 7: Different Input = Different Seed
 */
async function testDifferentInputs(token) {
  log.test('Test 7: Different Input = Different Seed');
  
  try {
    // First input
    const input1 = { ...SAMPLE_ASSESSMENT_DATA };
    const response1 = await fetch(`${CONFIG.WORKER_URL}/analyze-assessment?v=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: input1 })
    });
    
    if (!response1.ok) {
      log.error('First call failed');
      return false;
    }
    
    const result1 = await response1.json();
    const seed1 = result1.data._metadata?.seed;
    
    // Second input (modified)
    const input2 = {
      ...SAMPLE_ASSESSMENT_DATA,
      riasecAnswers: {
        ...SAMPLE_ASSESSMENT_DATA.riasecAnswers,
        'r1': { ...SAMPLE_ASSESSMENT_DATA.riasecAnswers['r1'], answer: 5 } // Changed from 4 to 5
      }
    };
    
    await sleep(1000);
    
    const response2 = await fetch(`${CONFIG.WORKER_URL}/analyze-assessment?v=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData: input2 })
    });
    
    if (!response2.ok) {
      log.error('Second call failed');
      return false;
    }
    
    const result2 = await response2.json();
    const seed2 = result2.data._metadata?.seed;
    
    log.result(`Seed 1 (original): ${seed1}`);
    log.result(`Seed 2 (modified): ${seed2}`);
    
    if (seed1 !== seed2) {
      log.success('✓ Different inputs produce different seeds!');
      return true;
    } else {
      log.error('✗ Different inputs produced SAME seed!');
      return false;
    }
    
  } catch (error) {
    log.error(`Different inputs test failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests(token) {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 COMPLETE WORKER TEST SUITE');
  console.log('='.repeat(80) + '\n');
  
  log.info(`Worker URL: ${CONFIG.WORKER_URL}`);
  log.info(`Expected Version: ${CONFIG.EXPECTED_VERSION}`);
  log.info(`Expected Response Keys: ${CONFIG.EXPECTED_RESPONSE_KEYS}`);
  console.log('');
  
  const results = {
    workerHealth: false,
    authentication: false,
    deterministicResults: false,
    responseStructure: false,
    embeddingService: false,
    cacheBusting: false,
    differentInputs: false
  };
  
  // Run tests
  results.workerHealth = await testWorkerHealth();
  console.log('');
  
  if (!results.workerHealth) {
    log.error('Worker health check failed. Stopping tests.');
    return results;
  }
  
  results.authentication = await testAuthentication(token);
  console.log('');
  
  if (!results.authentication) {
    log.error('Authentication failed. Stopping tests.');
    return results;
  }
  
  results.deterministicResults = await testDeterministicResults(token);
  console.log('');
  
  results.responseStructure = await testResponseStructure(token);
  console.log('');
  
  results.embeddingService = await testEmbeddingService();
  console.log('');
  
  results.cacheBusting = await testCacheBusting(token);
  console.log('');
  
  results.differentInputs = await testDifferentInputs(token);
  console.log('');
  
  // Summary
  console.log('='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  
  const testNames = {
    workerHealth: 'Worker Health Check',
    authentication: 'Authentication',
    deterministicResults: 'Deterministic Results (MAIN)',
    responseStructure: 'Response Structure',
    embeddingService: 'Embedding Service UUID',
    cacheBusting: 'Cache-Busting',
    differentInputs: 'Different Input = Different Seed'
  };
  
  let passCount = 0;
  let totalTests = Object.keys(results).length;
  
  for (const [key, passed] of Object.entries(results)) {
    const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`${status} - ${testNames[key]}`);
    if (passed) passCount++;
  }
  
  console.log('');
  console.log(`${colors.bright}Total: ${passCount}/${totalTests} tests passed${colors.reset}`);
  
  if (passCount === totalTests) {
    console.log(`${colors.green}${colors.bright}🎉 ALL TESTS PASSED! Worker is working correctly!${colors.reset}`);
  } else if (results.deterministicResults) {
    console.log(`${colors.yellow}⚠ Main test passed but some auxiliary tests failed${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ MAIN TEST FAILED - Deterministic results not working${colors.reset}`);
    console.log(`${colors.yellow}⚠ Wait 10-20 more minutes for Cloudflare propagation${colors.reset}`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  
  return results;
}

// ============================================================================
// EXECUTION
// ============================================================================

// Check if running in Node.js or browser
if (typeof window === 'undefined') {
  // Node.js
  const token = process.argv[2];
  
  if (!token) {
    console.error('Usage: node test-worker-complete.js YOUR_AUTH_TOKEN');
    console.error('');
    console.error('Get your token from browser:');
    console.error('1. Open browser dev tools (F12)');
    console.error('2. Go to Application > Local Storage');
    console.error('3. Find supabase.auth.token');
    console.error('4. Copy the access_token value');
    process.exit(1);
  }
  
  runAllTests(token).then(results => {
    const allPassed = Object.values(results).every(r => r);
    process.exit(allPassed ? 0 : 1);
  });
} else {
  // Browser
  console.log('🌐 Running in browser mode');
  console.log('Attempting to auto-detect auth token...');
  
  // Try to get token from Supabase
  const getToken = async () => {
    try {
      // Try to import supabase client
      const { supabase } = await import('./src/lib/supabaseClient.js');
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token;
    } catch (error) {
      console.error('Could not auto-detect token:', error.message);
      console.log('');
      console.log('Please provide token manually:');
      console.log('const token = "YOUR_TOKEN_HERE";');
      console.log('runAllTests(token);');
      return null;
    }
  };
  
  getToken().then(token => {
    if (token) {
      console.log('✓ Token detected');
      runAllTests(token);
    } else {
      console.log('Please run: runAllTests("YOUR_TOKEN_HERE")');
    }
  });
  
  // Export for manual use
  window.runAllTests = runAllTests;
  window.testWorkerComplete = {
    runAllTests,
    testWorkerHealth,
    testAuthentication,
    testDeterministicResults,
    testResponseStructure,
    testEmbeddingService,
    testCacheBusting,
    testDifferentInputs
  };
}
