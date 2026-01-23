/**
 * Demo: Console Logging for Fallback Layers
 * Shows which layer is being used for keyword generation
 */

import { getDomainKeywordsWithCache, clearKeywordCache } from './src/services/courseRecommendation/fieldDomainService.js';

console.log('='.repeat(80));
console.log('FALLBACK LAYER LOGGING DEMO');
console.log('='.repeat(80));
console.log();

async function testField(fieldName, description) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${fieldName} (${description})`);
  console.log('='.repeat(80));
  
  const keywords = await getDomainKeywordsWithCache(fieldName);
  
  console.log(`\nFinal Result: ${keywords}`);
  console.log('-'.repeat(80));
}

async function runDemo() {
  // Clear cache to see fresh logs
  clearKeywordCache();
  
  console.log('This demo shows the console logging for each fallback layer:\n');
  console.log('Legend:');
  console.log('  ✅ = Success');
  console.log('  ⚠️  = Warning/Fallback activated');
  console.log('  ❌ = Error');
  console.log('  🚀 = Cache hit');
  console.log('  💾 = Cache miss');
  console.log();
  
  // Test 1: B.COM (should use Layer 2 - Pattern Matching)
  await testField('B.COM', 'Commerce field - should match pattern');
  
  // Test 2: Animation (should use Layer 2 - Pattern Matching)
  await testField('Animation', 'Creative field - should match pattern');
  
  // Test 3: Unknown field (should use Layer 3 - Generic)
  await testField('Xyz Studies', 'Unknown field - should use generic keywords');
  
  // Test 4: B.COM again (should use Cache)
  await testField('B.COM', 'Same field again - should hit cache');
  
  console.log('\n' + '='.repeat(80));
  console.log('DEMO COMPLETE');
  console.log('='.repeat(80));
  console.log();
  console.log('Summary of what you saw:');
  console.log('  1. First B.COM call: LAYER 1 failed → LAYER 2 (Pattern Matching) succeeded');
  console.log('  2. Animation call: LAYER 1 failed → LAYER 2 (Pattern Matching) succeeded');
  console.log('  3. Unknown field: LAYER 1 failed → LAYER 2 no match → LAYER 3 (Generic)');
  console.log('  4. Second B.COM call: CACHE HIT (instant, no API call)');
  console.log();
  console.log('In production with working AI:');
  console.log('  - LAYER 1 (AI Service) would succeed for most calls');
  console.log('  - LAYER 2 (Pattern Matching) is the reliable fallback');
  console.log('  - LAYER 3 (Generic) ensures system never breaks');
  console.log('  - Cache makes subsequent calls instant');
  console.log('='.repeat(80));
}

runDemo().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
