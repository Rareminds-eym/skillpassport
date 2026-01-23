/**
 * Debug script to check program recommendation data flow
 * Run this in browser console on the assessment results page
 */

// Check what data is available
console.log('=== PROGRAM RECOMMENDATIONS DEBUG ===');

// 1. Check if results exist
const resultsElement = document.querySelector('[data-results]');
if (resultsElement) {
  console.log('✅ Results element found');
} else {
  console.log('❌ Results element not found');
}

// 2. Check RIASEC scores structure
console.log('\n📊 RIASEC Scores Check:');
// This will be available in React DevTools or you can add it to the component

// 3. Check what the course matching engine receives
console.log('\n🎯 Course Matching Engine Input:');
console.log('Look for these logs in console:');
console.log('  - "🧠 AI Course Matching Engine v2.0"');
console.log('  - "├─ Interest DNA: ..."');
console.log('  - "✅ Using assessment results as data source"');

// 4. Expected RIASEC structure
console.log('\n📋 Expected RIASEC Structure:');
console.log({
  riasec: {
    scores: {
      R: 15,  // Realistic
      I: 12,  // Investigative
      A: 8,   // Artistic
      S: 10,  // Social
      E: 6,   // Enterprising
      C: 9    // Conventional
    },
    topThree: ['R', 'I', 'S'],
    interpretation: '...'
  }
});

// 5. Check if scores are being passed correctly
console.log('\n🔍 To debug further:');
console.log('1. Open React DevTools');
console.log('2. Find AssessmentResult component');
console.log('3. Check props: results.riasec.scores');
console.log('4. Check: enhancedCourseRecommendations');
console.log('5. Look for "📊 Course Match Results:" in console');

console.log('\n=== END DEBUG ===');
