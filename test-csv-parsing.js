/**
 * Test CSV Parsing - Run this in browser console to debug CSV upload
 * 
 * Instructions:
 * 1. Open the AddLearnerModal
 * 2. Open browser DevTools Console
 * 3. Paste this entire file into the console
 * 4. Upload your CSV
 * 5. Check the console for detailed logs
 */

// This will intercept the Papa.parse to log what's happening
const originalParse = window.Papa?.parse;
if (originalParse) {
  window.Papa.parse = function(...args) {
    console.log('[TEST] Papa.parse called with:', args[0]?.name || 'data');
    
    // Call original with custom complete callback
    const originalConfig = args[1] || {};
    const originalComplete = originalConfig.complete;
    
    originalConfig.complete = function(results) {
      console.log('[TEST] CSV Parsing Complete:');
      console.log('[TEST] Total rows:', results.data?.length || 0);
      console.log('[TEST] First row sample:', results.data?.[0]);
      console.log('[TEST] Headers detected:', Object.keys(results.data?.[0] || {}));
      
      // Check skill columns specifically
      const firstRow = results.data?.[0] || {};
      const skillColumns = Object.keys(firstRow).filter(k => k.includes('skill'));
      console.log('[TEST] Skill-related columns found:', skillColumns);
      
      // Log first row's skill data
      console.log('[TEST] First row skill data:');
      for (let i = 1; i <= 5; i++) {
        const skillName = firstRow[`skill${i}name`];
        if (skillName) {
          console.log(`[TEST] Skill ${i}:`, {
            name: skillName,
            type: firstRow[`skill${i}type`],
            level: firstRow[`skill${i}level`],
            proficiency: firstRow[`skill${i}proficiencylevel`]
          });
        }
      }
      
      // Call original complete
      if (originalComplete) {
        originalComplete(results);
      }
    };
    
    args[1] = originalConfig;
    return originalParse.apply(this, args);
  };
  
  console.log('[TEST] CSV parsing interceptor installed. Upload your CSV now.');
} else {
  console.error('[TEST] Papa Parse not found. Make sure you\'re on the AddLearnerModal page.');
}
