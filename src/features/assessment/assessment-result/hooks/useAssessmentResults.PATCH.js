/**
 * PATCH FILE: Add RIASEC Score Normalization to useAssessmentResults Hook
 * 
 * This patch adds data normalization to fix the issue where RIASEC scores
 * are stored as zeros in the top-level but correct values exist in gemini_results._originalScores
 * 
 * INSTRUCTIONS:
 * 1. Add this import at the top of useAssessmentResults.js (around line 17):
 */

import { normalizeAssessmentResults } from '../../../../utils/assessmentDataNormalizer';

/**
 * 2. Find the line where validatedResults is set (around line 1050):
 *    const validatedResults = await applyValidation(geminiResults, attempt.all_responses || {});
 * 
 * 3. Add this normalization step RIGHT AFTER that line:
 */

// Normalize assessment results to fix data inconsistencies
const normalizedResults = normalizeAssessmentResults(validatedResults);

// Use normalized results instead of validated results
setResults(normalizedResults);

/**
 * 4. Find ALL other places where setResults(validatedResults) is called
 *    and replace with:
 */

const normalizedResults = normalizeAssessmentResults(validatedResults);
setResults(normalizedResults);

/**
 * COMPLETE EXAMPLE OF THE MODIFIED SECTION:
 */

// OLD CODE (around line 1048-1050):
/*
const validatedResults = await applyValidation(geminiResults, attempt.all_responses || {});
setResults(validatedResults);
*/

// NEW CODE:
/*
const validatedResults = await applyValidation(geminiResults, attempt.all_responses || {});

// Normalize assessment results to fix data inconsistencies
const normalizedResults = normalizeAssessmentResults(validatedResults);

setResults(normalizedResults);
*/

/**
 * LOCATIONS TO UPDATE (search for "setResults(validatedResults)" or "setResults(geminiResults)"):
 * 
 * 1. Line ~920: After direct result lookup
 * 2. Line ~1050: After attempt lookup with validation
 * 3. Line ~1300: After retry/regeneration
 * 4. Any other places where results are set from database
 * 
 * TESTING:
 * After applying this patch, verify:
 * 1. RIASEC scores display correctly (not all zeros)
 * 2. Percentages are calculated correctly
 * 3. Color coding works (green/yellow/red)
 * 4. PDF export shows correct scores
 */
