#!/usr/bin/env node
/**
 * Test SSO Login Functionality
 * 
 * This script runs comprehensive login tests against the SSO worker
 * Tests both success and failure scenarios using the seed data
 * 
 * Usage: npm run test:login
 *    or: node scripts/test-sso-login.mjs
 */

import bcrypt from 'bcryptjs';
import pg from 'pg';
const { Client } = pg;

// SSO Database connection
const SSO_DB_URL = process.env.SSO_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54332/postgres';
const SSO_API_URL = process.env.SSO_API_URL || 'http://127.0.0.1:8787';

// Test accounts from seed data
const TEST_ACCOUNTS = [
  {
    email: 'seainfo@seaedu.ac.in',
    password: 'seainfo@seaedu.ac.in',
    name: 'SEA College Admin',
  },
  {
    email: 'seaeduinfo@seaedu.ac.in',
    password: 'seaeduinfo@seaedu.ac.in',
    name: 'SEA College Admin 2',
  },
  {
    email: 'admin@freshtest1780937941574.edu',
    password: 'admin@freshtest1780937941574.edu',
    name: 'Test University Admin',
  },
];

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function checkDatabase() {
  const client = new Client({ connectionString: SSO_DB_URL });
  
  try {
    await client.connect();
    const result = await client.query('SELECT COUNT(*) as count FROM users');
    const count = result.rows[0].count;
    
    log(`✅ Database connected (${count} users found)`, 'green');
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return false;
  } finally {
    await client.end();
  }
}

async function checkSSOWorker() {
  try {
    const response = await fetch(`${SSO_API_URL}/health`, {
      method: 'GET',
    });
    
    if (response.ok) {
      log(`✅ SSO Worker is running at ${SSO_API_URL}`, 'green');
      return true;
    } else {
      log(`⚠️  SSO Worker responded with status ${response.status}`, 'yellow');
      return true; // Still consider it running
    }
  } catch (error) {
    log(`❌ SSO Worker not reachable at ${SSO_API_URL}`, 'red');
    log(`   Make sure to run: npm run workers:sso`, 'gray');
    return false;
  }
}

async function testLogin(email, password, shouldSucceed = true) {
  try {
    const response = await fetch(`${SSO_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (shouldSucceed) {
      if (response.ok && data.access_token) {
        log(`  ✅ Login successful for ${email}`, 'green');
        return { success: true, data };
      } else {
        log(`  ❌ Login failed for ${email}: ${data.error || 'Unknown error'}`, 'red');
        return { success: false, error: data.error };
      }
    } else {
      if (!response.ok) {
        log(`  ✅ Login correctly rejected for ${email}`, 'green');
        return { success: true, data };
      } else {
        log(`  ❌ Login should have failed but succeeded for ${email}`, 'red');
        return { success: false, error: 'Should have failed' };
      }
    }
  } catch (error) {
    log(`  ❌ Error testing login for ${email}: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🔐 SSO Login Test Suite', 'cyan');
  log('='.repeat(60), 'gray');
  
  // Check prerequisites
  log('\n📋 Checking Prerequisites:', 'cyan');
  const dbOk = await checkDatabase();
  const ssoOk = await checkSSOWorker();
  
  if (!dbOk || !ssoOk) {
    log('\n❌ Prerequisites not met. Please fix the issues above and try again.', 'red');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  // Test successful logins
  log('\n✅ Testing Successful Logins:', 'cyan');
  for (const account of TEST_ACCOUNTS) {
    log(`\n  Testing: ${account.name}`, 'cyan');
    log(`  Email: ${account.email}`, 'gray');
    
    const result = await testLogin(account.email, account.password, true);
    if (result.success) {
      passed++;
      if (result.data.access_token) {
        log(`  Token received: ${result.data.access_token.substring(0, 20)}...`, 'gray');
      }
      if (result.data.user) {
        log(`  User ID: ${result.data.user.id}`, 'gray');
      }
    } else {
      failed++;
    }
  }

  // Test failed login scenarios
  log('\n❌ Testing Failed Login Scenarios:', 'cyan');
  
  // Wrong password
  log(`\n  Testing: Wrong Password`, 'cyan');
  const wrongPasswordResult = await testLogin(TEST_ACCOUNTS[0].email, 'wrongpassword', false);
  wrongPasswordResult.success ? passed++ : failed++;

  // Non-existent user
  log(`\n  Testing: Non-existent User`, 'cyan');
  const nonExistentResult = await testLogin('nonexistent@test.com', 'password', false);
  nonExistentResult.success ? passed++ : failed++;

  // Invalid email format
  log(`\n  Testing: Invalid Email Format`, 'cyan');
  const invalidEmailResult = await testLogin('not-an-email', 'password', false);
  invalidEmailResult.success ? passed++ : failed++;

  // Missing password
  log(`\n  Testing: Missing Password`, 'cyan');
  try {
    const response = await fetch(`${SSO_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_ACCOUNTS[0].email }),
    });
    
    if (!response.ok) {
      log(`  ✅ Correctly rejected login without password`, 'green');
      passed++;
    } else {
      log(`  ❌ Should have rejected login without password`, 'red');
      failed++;
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    failed++;
  }

  // Print summary
  log('\n' + '='.repeat(60), 'gray');
  log('📊 Test Summary:', 'cyan');
  log(`  Total Tests: ${passed + failed}`, 'gray');
  log(`  ✅ Passed: ${passed}`, 'green');
  log(`  ❌ Failed: ${failed}`, 'red');
  log('='.repeat(60), 'gray');

  if (failed === 0) {
    log('\n🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

// Run tests
log('🚀 Starting SSO Login Tests...\n');
runTests();
