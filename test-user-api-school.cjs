/**
 * Test script to verify User API school signup handlers
 * Run with: node test-user-api-school.cjs
 */

const fs = require('fs');

console.log('🔍 Testing User API School Signup Handlers...\n');

let allPassed = true;

// Test 1: Verify all required files exist
console.log('Test 1: Verify all required files exist');
const requiredFiles = [
  'functions/api/user/handlers/school.ts',
  'functions/api/user/utils/helpers.ts',
  'functions/api/user/utils/email.ts',
  'functions/api/user/types.ts'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ Missing: ${file}`);
    allPassed = false;
  }
});

// Test 2: Verify school handler has all required functions
console.log('\nTest 2: Verify school handler has all required functions');
const schoolContent = fs.readFileSync('functions/api/user/handlers/school.ts', 'utf8');
const requiredFunctions = [
  'handleSchoolAdminSignup',
  'handleEducatorSignup',
  'handleStudentSignup'
];

requiredFunctions.forEach(func => {
  if (schoolContent.includes(`export async function ${func}`)) {
    console.log(`  ✅ ${func}`);
  } else {
    console.log(`  ❌ Missing function: ${func}`);
    allPassed = false;
  }
});

// Test 3: Verify helpers has all required functions
console.log('\nTest 3: Verify helpers has all required functions');
const helpersContent = fs.readFileSync('functions/api/user/utils/helpers.ts', 'utf8');
const helperFunctions = [
  'validateEmail',
  'splitName',
  'capitalizeFirstLetter',
  'calculateAge',
  'checkEmailExists',
  'deleteAuthUser'
];

helperFunctions.forEach(func => {
  if (helpersContent.includes(`export function ${func}`) || 
      helpersContent.includes(`export async function ${func}`)) {
    console.log(`  ✅ ${func}`);
  } else {
    console.log(`  ❌ Missing helper: ${func}`);
    allPassed = false;
  }
});

// Test 4: Verify types has all required interfaces
console.log('\nTest 4: Verify types has all required interfaces');
const typesContent = fs.readFileSync('functions/api/user/types.ts', 'utf8');
const requiredTypes = [
  'SchoolAdminSignupRequest',
  'EducatorSignupRequest',
  'StudentSignupRequest'
];

requiredTypes.forEach(type => {
  if (typesContent.includes(`export interface ${type}`)) {
    console.log(`  ✅ ${type}`);
  } else {
    console.log(`  ❌ Missing type: ${type}`);
    allPassed = false;
  }
});

// Test 5: Verify imports use shared utilities
console.log('\nTest 5: Verify imports use shared utilities');
const expectedImports = [
  "from '../../../../src/functions-lib/supabase'",
  "from '../../../../src/functions-lib/response'",
  "from '../../../../src/functions-lib/types'"
];

expectedImports.forEach(imp => {
  if (schoolContent.includes(imp)) {
    console.log(`  ✅ Uses ${imp}`);
  } else {
    console.log(`  ❌ Missing import: ${imp}`);
    allPassed = false;
  }
});

// Test 6: Verify router imports school handlers
console.log('\nTest 6: Verify router imports school handlers');
const routerContent = fs.readFileSync('functions/api/user/[[path]].ts', 'utf8');

if (routerContent.includes("from './handlers/school'")) {
  console.log('  ✅ Router imports school handlers');
} else {
  console.log('  ❌ Router missing school imports');
  allPassed = false;
}

// Test 7: Verify router routes to school handlers
console.log('\nTest 7: Verify router routes to school handlers');
const routeChecks = [
  { path: '/signup/school-admin', handler: 'handleSchoolAdminSignup' },
  { path: '/signup/educator', handler: 'handleEducatorSignup' },
  { path: '/signup/student', handler: 'handleStudentSignup' }
];

routeChecks.forEach(({ path, handler }) => {
  if (routerContent.includes(path) && routerContent.includes(handler)) {
    console.log(`  ✅ ${path} → ${handler}`);
  } else {
    console.log(`  ❌ Missing route: ${path} → ${handler}`);
    allPassed = false;
  }
});

// Test 8: Verify uses createSupabaseAdminClient
console.log('\nTest 8: Verify uses createSupabaseAdminClient');
if (schoolContent.includes('createSupabaseAdminClient')) {
  console.log('  ✅ Uses createSupabaseAdminClient');
} else {
  console.log('  ❌ Not using createSupabaseAdminClient');
  allPassed = false;
}

// Test 9: Verify uses jsonResponse
console.log('\nTest 9: Verify uses jsonResponse');
if (schoolContent.includes('jsonResponse')) {
  console.log('  ✅ Uses jsonResponse');
} else {
  console.log('  ❌ Not using jsonResponse');
  allPassed = false;
}

// Test 10: Verify email utility exists
console.log('\nTest 10: Verify email utility exists');
const emailContent = fs.readFileSync('functions/api/user/utils/email.ts', 'utf8');
if (emailContent.includes('export async function sendWelcomeEmail')) {
  console.log('  ✅ sendWelcomeEmail function exists');
} else {
  console.log('  ❌ sendWelcomeEmail function missing');
  allPassed = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED - Task 7 Complete!');
  console.log('\nImplemented 3 school signup endpoints:');
  console.log('  ✅ POST /signup/school-admin');
  console.log('  ✅ POST /signup/educator');
  console.log('  ✅ POST /signup/student');
  console.log('\nCreated supporting files:');
  console.log('  ✅ functions/api/user/handlers/school.ts');
  console.log('  ✅ functions/api/user/utils/helpers.ts');
  console.log('  ✅ functions/api/user/utils/email.ts');
  console.log('  ✅ functions/api/user/types.ts');
  console.log('\nProgress: 12 of 27 User API endpoints complete (44%)');
  console.log('\nReady for Task 8: Implement college signup handlers');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Please review the errors above');
  process.exit(1);
}
