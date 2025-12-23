import { isJwtExpiryError } from './src/utils/authErrorHandler.js';

console.log('Testing isJwtExpiryError...');

const tests = [
  { error: { code: 'PGRST303', message: 'JWT expired' }, expected: true, name: 'Standard JWT expired' },
  { error: { message: 'JWT expired' }, expected: true, name: 'Message only' },
  { error: { message: 'Invalid token' }, expected: true, name: 'Invalid token' },
  { error: { code: 'PGRST116', message: 'No rows' }, expected: false, name: 'Not Found error' },
  { error: null, expected: false, name: 'Null error' },
  { error: { message: 'Network error' }, expected: false, name: 'Other error' }
];

let passed = 0;
tests.forEach(test => {
  const result = isJwtExpiryError(test.error);
  if (result === test.expected) {
    console.log(`✅ ${test.name}: Passed`);
    passed++;
  } else {
    console.error(`❌ ${test.name}: Failed (Expected ${test.expected}, got ${result})`);
  }
});

console.log(`\nResults: ${passed}/${tests.length} passed`);

if (passed === tests.length) {
  console.log('All tests passed!');
  process.exit(0);
} else {
  console.log('Some tests failed.');
  process.exit(1);
}
