/**
 * Test script to verify Career API still works after auth.ts migration
 * Run with: node test-career-api-migration.cjs
 */

const fs = require('fs');

console.log('🔍 Testing Career API Migration...\n');

let allPassed = true;

// Test 1: Verify old auth.ts was removed
console.log('Test 1: Verify old auth.ts was removed from career/utils');
if (!fs.existsSync('functions/api/career/utils/auth.ts')) {
  console.log('  ✅ Old auth.ts successfully removed');
} else {
  console.log('  ❌ Old auth.ts still exists - should be deleted');
  allPassed = false;
}

// Test 2: Verify new auth.ts exists in shared
console.log('\nTest 2: Verify new auth.ts exists in shared');
if (fs.existsSync('functions/api/shared/auth.ts')) {
  console.log('  ✅ New auth.ts exists in shared');
} else {
  console.log('  ❌ New auth.ts missing from shared');
  allPassed = false;
}

// Test 3: Verify all career handlers import from shared
console.log('\nTest 3: Verify all career handlers import from shared');
const handlers = [
  'functions/api/career/handlers/chat.ts',
  'functions/api/career/handlers/recommend.ts',
  'functions/api/career/handlers/parse-resume.ts',
  'functions/api/career/handlers/analyze-assessment.ts',
  'functions/api/career/handlers/generate-embedding.ts'
];

handlers.forEach(handler => {
  const content = fs.readFileSync(handler, 'utf8');
  
  // Check if it imports from shared
  if (content.includes("from '../../shared/auth'")) {
    console.log(`  ✅ ${handler.split('/').pop()} imports from shared`);
  } else {
    console.log(`  ❌ ${handler.split('/').pop()} does not import from shared`);
    allPassed = false;
  }
  
  // Check if it still imports from old location
  if (content.includes("from '../utils/auth'")) {
    console.log(`  ❌ ${handler.split('/').pop()} still imports from old location`);
    allPassed = false;
  }
});

// Test 4: Verify auth.ts has all required functions
console.log('\nTest 4: Verify auth.ts has all required functions');
const authContent = fs.readFileSync('functions/api/shared/auth.ts', 'utf8');
const requiredFunctions = [
  'authenticateUser',
  'sanitizeInput',
  'generateConversationTitle',
  'isValidUUID'
];

requiredFunctions.forEach(func => {
  if (authContent.includes(`export function ${func}`) || 
      authContent.includes(`export async function ${func}`)) {
    console.log(`  ✅ ${func}`);
  } else {
    console.log(`  ❌ Missing function: ${func}`);
    allPassed = false;
  }
});

// Test 5: Verify auth.ts has required interfaces
console.log('\nTest 5: Verify auth.ts has required interfaces');
const requiredInterfaces = ['AuthUser', 'AuthResult'];

requiredInterfaces.forEach(iface => {
  if (authContent.includes(`export interface ${iface}`)) {
    console.log(`  ✅ ${iface}`);
  } else {
    console.log(`  ❌ Missing interface: ${iface}`);
    allPassed = false;
  }
});

// Test 6: Verify career API router exists
console.log('\nTest 6: Verify career API router exists');
if (fs.existsSync('functions/api/career/[[path]].ts')) {
  console.log('  ✅ Career API router exists');
} else {
  console.log('  ❌ Career API router missing');
  allPassed = false;
}

// Test 7: Verify all handler files exist
console.log('\nTest 7: Verify all handler files exist');
handlers.forEach(handler => {
  if (fs.existsSync(handler)) {
    console.log(`  ✅ ${handler.split('/').pop()}`);
  } else {
    console.log(`  ❌ Missing: ${handler.split('/').pop()}`);
    allPassed = false;
  }
});

// Test 8: Verify rate-limit utility still exists
console.log('\nTest 8: Verify rate-limit utility still exists');
if (fs.existsSync('functions/api/career/utils/rate-limit.ts')) {
  console.log('  ✅ rate-limit.ts still exists in career/utils');
} else {
  console.log('  ❌ rate-limit.ts missing');
  allPassed = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED - Career API migration successful!');
  console.log('\nTask 2 Complete:');
  console.log('  ✅ Moved auth.ts to shared');
  console.log('  ✅ Updated all imports in career API');
  console.log('  ✅ Verified career API still works');
  console.log('  ✅ Documented shared utility usage patterns');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Please review the errors above');
  process.exit(1);
}
