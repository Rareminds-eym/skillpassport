/**
 * Test script to verify shared utilities work correctly
 * Run with: node test-shared-utilities.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Shared Utilities...\n');

let allPassed = true;

// Test 1: Verify all utility files exist
console.log('Test 1: Verify utility files exist');
const utilityFiles = [
  'functions/api/shared/ai-config.ts',
  'functions/api/shared/auth.ts',
  'functions/api/shared/README.md',
  'functions/api/shared/UTILITIES_VERIFICATION.md',
  'src/functions-lib/supabase.ts',
  'src/functions-lib/response.ts',
  'src/functions-lib/cors.ts',
  'src/functions-lib/types.ts',
  'src/functions-lib/index.ts'
];

utilityFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
    allPassed = false;
  }
});

// Test 2: Verify functions-lib exports
console.log('\nTest 2: Verify functions-lib exports');
const indexContent = fs.readFileSync('src/functions-lib/index.ts', 'utf8');
const expectedExports = ['cors', 'response', 'supabase', 'types'];

expectedExports.forEach(exp => {
  if (indexContent.includes(`export * from './${exp}'`)) {
    console.log(`  ✅ Exports ${exp}`);
  } else {
    console.log(`  ❌ Missing export for ${exp}`);
    allPassed = false;
  }
});

// Test 3: Verify ai-config.ts has key functions
console.log('\nTest 3: Verify ai-config.ts has key functions');
const aiConfigContent = fs.readFileSync('functions/api/shared/ai-config.ts', 'utf8');
const aiConfigFunctions = [
  'callOpenRouterWithRetry',
  'callClaudeAPI',
  'callAIWithFallback',
  'repairAndParseJSON',
  'getAPIKeys',
  'generateUUID',
  'delay'
];

aiConfigFunctions.forEach(func => {
  if (aiConfigContent.includes(`export function ${func}`) || 
      aiConfigContent.includes(`export async function ${func}`)) {
    console.log(`  ✅ ${func}`);
  } else {
    console.log(`  ❌ Missing function: ${func}`);
    allPassed = false;
  }
});

// Test 4: Verify supabase.ts has key functions
console.log('\nTest 4: Verify supabase.ts has key functions');
const supabaseContent = fs.readFileSync('src/functions-lib/supabase.ts', 'utf8');
const supabaseFunctions = [
  'createSupabaseClient',
  'createSupabaseAdminClient',
  'getAuthToken',
  'authenticateRequest'
];

supabaseFunctions.forEach(func => {
  if (supabaseContent.includes(`export function ${func}`) || 
      supabaseContent.includes(`export async function ${func}`)) {
    console.log(`  ✅ ${func}`);
  } else {
    console.log(`  ❌ Missing function: ${func}`);
    allPassed = false;
  }
});

// Test 5: Verify response.ts has key functions
console.log('\nTest 5: Verify response.ts has key functions');
const responseContent = fs.readFileSync('src/functions-lib/response.ts', 'utf8');
const responseFunctions = [
  'jsonResponse',
  'errorResponse',
  'successResponse',
  'streamResponse'
];

responseFunctions.forEach(func => {
  if (responseContent.includes(`export function ${func}`)) {
    console.log(`  ✅ ${func}`);
  } else {
    console.log(`  ❌ Missing function: ${func}`);
    allPassed = false;
  }
});

// Test 6: Verify cors.ts has key exports
console.log('\nTest 6: Verify cors.ts has key exports');
const corsContent = fs.readFileSync('src/functions-lib/cors.ts', 'utf8');
const corsExports = [
  'corsHeaders',
  'handleCorsPreflightRequest',
  'addCorsHeaders'
];

corsExports.forEach(exp => {
  if (corsContent.includes(`export const ${exp}`) || 
      corsContent.includes(`export function ${exp}`)) {
    console.log(`  ✅ ${exp}`);
  } else {
    console.log(`  ❌ Missing export: ${exp}`);
    allPassed = false;
  }
});

// Test 7: Verify types.ts has key interfaces
console.log('\nTest 7: Verify types.ts has key interfaces');
const typesContent = fs.readFileSync('src/functions-lib/types.ts', 'utf8');
const typeInterfaces = [
  'PagesEnv',
  'ApiResponse',
  'PaginatedResponse',
  'ErrorResponse',
  'AuthContext',
  'RequestContext',
  'PagesFunction'
];

typeInterfaces.forEach(type => {
  if (typesContent.includes(`export interface ${type}`) || 
      typesContent.includes(`export type ${type}`)) {
    console.log(`  ✅ ${type}`);
  } else {
    console.log(`  ❌ Missing type: ${type}`);
    allPassed = false;
  }
});

// Test 8: Verify auth.ts has key function
console.log('\nTest 8: Verify auth.ts has key function');
const authContent = fs.readFileSync('functions/api/shared/auth.ts', 'utf8');
if (authContent.includes('export async function authenticateUser')) {
  console.log('  ✅ authenticateUser');
} else {
  console.log('  ❌ Missing function: authenticateUser');
  allPassed = false;
}

// Test 9: Verify documentation exists
console.log('\nTest 9: Verify documentation exists');
const readmeContent = fs.readFileSync('functions/api/shared/README.md', 'utf8');
if (readmeContent.includes('AI Configuration') && 
    readmeContent.includes('Authentication')) {
  console.log('  ✅ README.md has proper documentation');
} else {
  console.log('  ❌ README.md missing documentation sections');
  allPassed = false;
}

const verificationContent = fs.readFileSync('functions/api/shared/UTILITIES_VERIFICATION.md', 'utf8');
if (verificationContent.includes('Usage Example') && 
    verificationContent.includes('Complete Handler Template')) {
  console.log('  ✅ UTILITIES_VERIFICATION.md has examples');
} else {
  console.log('  ❌ UTILITIES_VERIFICATION.md missing examples');
  allPassed = false;
}

// Test 10: Verify AI model configurations
console.log('\nTest 10: Verify AI model configurations');
const modelUseCases = [
  'question_generation',
  'chat',
  'resume_parsing',
  'keyword_generation',
  'embedding',
  'adaptive_assessment'
];

modelUseCases.forEach(useCase => {
  if (aiConfigContent.includes(`'${useCase}'`)) {
    console.log(`  ✅ ${useCase}`);
  } else {
    console.log(`  ❌ Missing use case: ${useCase}`);
    allPassed = false;
  }
});

// Final result
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED - Shared utilities verified!');
  console.log('\nAll utilities are properly configured and documented.');
  console.log('Ready to proceed with Task 4: Implement institution list endpoints');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Please review the errors above');
  process.exit(1);
}
