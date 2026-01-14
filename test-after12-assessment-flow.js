/**
 * Test After12 Assessment Flow
 * Run this in browser console during assessment to debug
 */

// Test 1: Check if answers are being stored in flow state
console.log('=== TEST 1: Flow State ===');
// You'll need to access this from React DevTools or add a window reference
// window.__assessmentFlow = flow; // Add this in AssessmentTestPage.tsx temporarily

// Test 2: Simulate what should be saved
const mockAfter12Answers = {
  // RIASEC (48 questions)
  'riasec_r1': 4,
  'riasec_r2': 5,
  'riasec_r3': 3,
  'riasec_i1': 5,
  'riasec_i2': 4,
  'riasec_a1': 2,
  'riasec_a2': 3,
  'riasec_s1': 4,
  'riasec_s2': 5,
  'riasec_e1': 3,
  'riasec_e2': 2,
  'riasec_c1': 4,
  'riasec_c2': 3,
  
  // BigFive (50 questions)
  'bigfive_o1': 4,
  'bigfive_o2': 5,
  'bigfive_c1': 3,
  'bigfive_c2': 4,
  'bigfive_e1': 5,
  'bigfive_e2': 4,
  'bigfive_a1': 3,
  'bigfive_a2': 4,
  'bigfive_n1': 2,
  'bigfive_n2': 3,
  
  // Work Values (20 questions)
  'values_sec1': 5,
  'values_sec2': 4,
  'values_aut1': 4,
  'values_aut2': 5,
  
  // Employability (30 questions)
  'employability_e1': 4,
  'employability_e2': 5,
  'employability_sjt1': { best: 'A', worst: 'D' },
  
  // Aptitude (varies)
  'aptitude_verbal1': 'B',
  'aptitude_numerical1': 'C',
  
  // Knowledge (varies by stream)
  'knowledge_cs1': 'A',
  'knowledge_cs2': 'B'
};

console.log('Mock answers count:', Object.keys(mockAfter12Answers).length);
console.log('Mock answer keys:', Object.keys(mockAfter12Answers));

// Test 3: Check extraction logic
const testExtraction = (answers, gradeLevel = 'after12') => {
  console.log('\n=== TEST 3: Extraction Logic ===');
  console.log('Grade level:', gradeLevel);
  
  // Simulate getSectionPrefix
  const getSectionPrefix = (baseSection, gradeLevel) => {
    if (gradeLevel === 'middle') {
      const middleSchoolMap = {
        'riasec': 'middle_interest_explorer',
        'bigfive': 'middle_strengths_character',
        'knowledge': 'middle_learning_preferences'
      };
      return middleSchoolMap[baseSection] || baseSection;
    } else if (gradeLevel === 'highschool' || gradeLevel === 'higher_secondary') {
      const highSchoolMap = {
        'riasec': 'hs_interest_explorer',
        'bigfive': 'hs_strengths_character',
        'aptitude': 'hs_aptitude_sampling',
        'knowledge': 'hs_learning_preferences'
      };
      return highSchoolMap[baseSection] || baseSection;
    }
    return baseSection;
  };
  
  const riasecPrefix = getSectionPrefix('riasec', gradeLevel);
  console.log('RIASEC prefix:', riasecPrefix);
  console.log('Looking for keys starting with:', `${riasecPrefix}_`);
  
  const riasecKeys = Object.keys(answers).filter(k => k.startsWith(`${riasecPrefix}_`));
  console.log('RIASEC keys found:', riasecKeys.length);
  console.log('Sample RIASEC keys:', riasecKeys.slice(0, 5));
  
  const bigFivePrefix = getSectionPrefix('bigfive', gradeLevel);
  const bigFiveKeys = Object.keys(answers).filter(k => k.startsWith(`${bigFivePrefix}_`));
  console.log('\nBigFive prefix:', bigFivePrefix);
  console.log('BigFive keys found:', bigFiveKeys.length);
  
  const valuesKeys = Object.keys(answers).filter(k => k.startsWith('values_'));
  console.log('\nWork Values keys found:', valuesKeys.length);
  
  const employabilityKeys = Object.keys(answers).filter(k => k.startsWith('employability_'));
  console.log('Employability keys found:', employabilityKeys.length);
  
  return {
    riasecCount: riasecKeys.length,
    bigFiveCount: bigFiveKeys.length,
    valuesCount: valuesKeys.length,
    employabilityCount: employabilityKeys.length
  };
};

const extractionResults = testExtraction(mockAfter12Answers, 'after12');
console.log('\n=== Extraction Results ===');
console.log('Expected: RIASEC=48, BigFive=50, Values=20, Employability=30');
console.log('Actual:', extractionResults);

if (extractionResults.riasecCount === 0) {
  console.error('❌ PROBLEM: No RIASEC answers extracted!');
  console.error('   This will cause zero scores.');
} else {
  console.log('✅ RIASEC extraction working correctly');
}

// Test 4: Check database query
console.log('\n=== TEST 4: Database Check ===');
console.log('Run this SQL in Supabase:');
console.log(`
SELECT 
  id,
  grade_level,
  status,
  (SELECT COUNT(*) FROM jsonb_object_keys(all_responses)) as response_count,
  (SELECT array_agg(key) FROM jsonb_object_keys(all_responses) AS key LIMIT 5) as sample_keys
FROM personal_assessment_attempts
WHERE grade_level = 'after12'
  AND status = 'completed'
ORDER BY completed_at DESC
LIMIT 1;
`);

// Test 5: Check if section IDs are correct
console.log('\n=== TEST 5: Section ID Check ===');
console.log('Expected section IDs for after12:');
console.log('  - riasec (Career Interests)');
console.log('  - bigfive (Big Five Personality)');
console.log('  - values (Work Values)');
console.log('  - employability (Employability Skills)');
console.log('  - aptitude (Aptitude Assessment)');
console.log('  - knowledge (Knowledge Test)');
console.log('\nIf sections have different IDs, answers will be saved with wrong keys!');

export { testExtraction, mockAfter12Answers };
