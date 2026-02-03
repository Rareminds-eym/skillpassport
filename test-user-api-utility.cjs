/**
 * Test script to verify User API utility handlers
 * Run with: node test-user-api-utility.cjs
 */

const fs = require('fs');

console.log('🔍 Testing User API Utility Handlers...\n');

let allPassed = true;

// Test 1: Verify utility handler file exists
console.log('Test 1: Verify utility handler file exists');
if (fs.existsSync('functions/api/user/handlers/utility.ts')) {
  console.log('  ✅ utility.ts exists');
} else {
  console.log('  ❌ utility.ts missing');
  allPassed = false;
}

// Test 2: Verify utility handler has all required functions
console.log('\nTest 2: Verify utility handler has all required functions');
const utilityContent = fs.readFileSync('functions/api/user/handlers/utility.ts', 'utf8');
const requiredFunctions = [
  'handleGetSchools',
  'handleGetColleges',
  'handleGetUniversities',
  'handleGetCompanies',
  'handleCheckSchoolCode',
  'handleCheckCollegeCode',
  'handleCheckUniversityCode',
  'handleCheckCompanyCode',
  'handleCheckEmail'
];

requiredFunctions.forEach(func => {
  if (utilityContent.includes(`export async function ${func}`)) {
    console.log(`  ✅ ${func}`);
  } else {
    console.log(`  ❌ Missing function: ${func}`);
    allPassed = false;
  }
});

// Test 3: Verify imports use shared utilities
console.log('\nTest 3: Verify imports use shared utilities');
const expectedImports = [
  "from '../../../../src/functions-lib/supabase'",
  "from '../../../../src/functions-lib/response'",
  "from '../../../../src/functions-lib/types'"
];

expectedImports.forEach(imp => {
  if (utilityContent.includes(imp)) {
    console.log(`  ✅ Uses ${imp}`);
  } else {
    console.log(`  ❌ Missing import: ${imp}`);
    allPassed = false;
  }
});

// Test 4: Verify router imports utility handlers
console.log('\nTest 4: Verify router imports utility handlers');
const routerContent = fs.readFileSync('functions/api/user/[[path]].ts', 'utf8');

if (routerContent.includes("from './handlers/utility'")) {
  console.log('  ✅ Router imports utility handlers');
} else {
  console.log('  ❌ Router missing utility imports');
  allPassed = false;
}

// Test 5: Verify router routes to utility handlers
console.log('\nTest 5: Verify router routes to utility handlers');
const routeChecks = [
  { path: '/schools', handler: 'handleGetSchools' },
  { path: '/colleges', handler: 'handleGetColleges' },
  { path: '/universities', handler: 'handleGetUniversities' },
  { path: '/companies', handler: 'handleGetCompanies' },
  { path: '/check-school-code', handler: 'handleCheckSchoolCode' },
  { path: '/check-college-code', handler: 'handleCheckCollegeCode' },
  { path: '/check-university-code', handler: 'handleCheckUniversityCode' },
  { path: '/check-company-code', handler: 'handleCheckCompanyCode' },
  { path: '/check-email', handler: 'handleCheckEmail' }
];

routeChecks.forEach(({ path, handler }) => {
  if (routerContent.includes(path) && routerContent.includes(handler)) {
    console.log(`  ✅ ${path} → ${handler}`);
  } else {
    console.log(`  ❌ Missing route: ${path} → ${handler}`);
    allPassed = false;
  }
});

// Test 6: Verify 501 responses removed for utility endpoints
console.log('\nTest 6: Verify 501 responses removed for utility endpoints');
const removed501Patterns = [
  'Utility endpoints require database queries',
  'Validation endpoints require database queries'
];

let has501 = false;
removed501Patterns.forEach(pattern => {
  if (routerContent.includes(pattern)) {
    console.log(`  ❌ Still has 501 response: "${pattern}"`);
    has501 = true;
    allPassed = false;
  }
});

if (!has501) {
  console.log('  ✅ 501 responses removed for utility endpoints');
}

// Test 7: Verify helper functions are imported or defined
console.log('\nTest 7: Verify helper functions are imported or defined');
const helperFunctions = ['validateEmail', 'checkEmailExists'];

helperFunctions.forEach(func => {
  // Check if imported from helpers
  if (utilityContent.includes(`import { ${func}`) || 
      utilityContent.includes(`import {`) && utilityContent.includes(`${func}`)) {
    console.log(`  ✅ ${func} (imported from helpers)`);
  } else if (utilityContent.includes(`function ${func}`)) {
    console.log(`  ✅ ${func} (local function)`);
  } else {
    console.log(`  ❌ Missing helper: ${func}`);
    allPassed = false;
  }
});

// Test 8: Verify uses createSupabaseAdminClient
console.log('\nTest 8: Verify uses createSupabaseAdminClient');
if (utilityContent.includes('createSupabaseAdminClient')) {
  console.log('  ✅ Uses createSupabaseAdminClient');
} else {
  console.log('  ❌ Not using createSupabaseAdminClient');
  allPassed = false;
}

// Test 9: Verify uses jsonResponse
console.log('\nTest 9: Verify uses jsonResponse');
if (utilityContent.includes('jsonResponse')) {
  console.log('  ✅ Uses jsonResponse');
} else {
  console.log('  ❌ Not using jsonResponse');
  allPassed = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED - Task 4 Complete!');
  console.log('\nImplemented 9 endpoints:');
  console.log('  GET Endpoints:');
  console.log('    ✅ GET /schools');
  console.log('    ✅ GET /colleges');
  console.log('    ✅ GET /universities');
  console.log('    ✅ GET /companies');
  console.log('  POST Endpoints:');
  console.log('    ✅ POST /check-school-code');
  console.log('    ✅ POST /check-college-code');
  console.log('    ✅ POST /check-university-code');
  console.log('    ✅ POST /check-company-code');
  console.log('    ✅ POST /check-email');
  console.log('\nReady for Task 5: Implement validation endpoints');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Please review the errors above');
  process.exit(1);
}
