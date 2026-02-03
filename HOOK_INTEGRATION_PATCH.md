# useAssessmentResults Hook Integration Patch

## File: `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`

### Change 1: Import Transformer (Already Done ✅)

The import is already added at line 13:
```javascript
import { transformAssessmentResults } from '../../../../services/assessmentResultTransformer';
```

### Change 2: Update setResults Wrapper (Already Done ✅)

Lines 245-280 already have the transformation wrapper:
```javascript
const setResults = useCallback((resultsData) => {
    if (!resultsData) {
        setResultsInternal(null);
        return;
    }

    // Check if data is already transformed
    if (resultsData._transformed) {
        console.log('✅ Results already transformed, using as-is');
        setResultsInternal(resultsData);
        return;
    }

    // Check if this looks like database format
    const isDatabaseFormat = resultsData.gemini_analysis || 
                            resultsData.aptitude_scores || 
                            resultsData.riasec_scores;

    if (isDatabaseFormat) {
        console.log('🔄 Transforming database results to PDF format...');
        try {
            const transformed = transformAssessmentResults(resultsData);
            setResultsInternal(transformed);
        } catch (error) {
            console.error('❌ Transformation failed, using original:', error);
            setResultsInternal(resultsData);
        }
    } else {
        console.log('✅ Results already in correct format');
        setResultsInternal(resultsData);
    }
}, []);
```

### Change 3: Transform Database Results When Loaded

**Location:** Around line 920-970 (in the `loadResults` function)

**Current Code:**
```javascript
if (directResult) {
    console.log('✅ Found result directly by attempt_id');
    
    if (directResult.gemini_results && typeof directResult.gemini_results === 'object' && Object.keys(directResult.gemini_results).length > 0) {
        const geminiResults = directResult.gemini_results;
        
        // ... validation code ...
        
        const validatedResults = await applyValidation(geminiResults, {});
        setResults(validatedResults);  // ✅ This already uses our wrapper!
        
        // ... rest of code ...
    }
}
```

**Status:** ✅ Already working! The `setResults` wrapper will automatically transform database format.

### Change 4: Add Validation Warnings Display

**Location:** After line 280 (after setResults definition)

**Add this code:**
```javascript
// ✅ NEW: Add validation state for transformation warnings
const [transformationWarnings, setTransformationWarnings] = useState([]);

// ✅ NEW: Enhanced setResults with validation
const setResultsWithValidation = useCallback((resultsData) => {
    if (!resultsData) {
        setResultsInternal(null);
        setTransformationWarnings([]);
        return;
    }

    // Check if data is already transformed
    if (resultsData._transformed) {
        console.log('✅ Results already transformed, using as-is');
        setResultsInternal(resultsData);
        return;
    }

    // Check if this looks like database format
    const isDatabaseFormat = resultsData.gemini_analysis || 
                            resultsData.aptitude_scores || 
                            resultsData.riasec_scores;

    if (isDatabaseFormat) {
        console.log('🔄 Transforming database results to PDF format...');
        try {
            const transformed = transformAssessmentResults(resultsData);
            
            // ✅ NEW: Validate transformed results
            const { validateTransformedResults } = require('../../../../services/assessmentResultTransformer');
            const validation = validateTransformedResults(transformed);
            
            if (!validation.isValid) {
                console.error('❌ Transformation validation errors:', validation.errors);
                setTransformationWarnings([...validation.warnings, ...validation.errors]);
            } else if (validation.warnings.length > 0) {
                console.warn('⚠️ Transformation warnings:', validation.warnings);
                setTransformationWarnings(validation.warnings);
            }
            
            console.log('✅ Transformation complete:', {
                completeness: validation.completeness + '%',
                hasAptitude: !!transformed.aptitude,
                hasCareerFit: !!transformed.careerFit,
                hasSkillGap: !!transformed.skillGap,
                hasLearningStyles: !!transformed.learningStyles
            });
            
            setResultsInternal(transformed);
        } catch (error) {
            console.error('❌ Transformation failed, using original:', error);
            setTransformationWarnings(['Transformation failed: ' + error.message]);
            setResultsInternal(resultsData);
        }
    } else {
        console.log('✅ Results already in correct format');
        setResultsInternal(resultsData);
    }
}, []);
```

### Change 5: Export Transformation Warnings

**Location:** At the end of the hook (around line 1750+)

**Current return statement:**
```javascript
return {
    results,
    loading,
    error,
    retrying,
    gradeLevel,
    monthsInGrade,
    studentInfo,
    studentAcademicData,
    validationWarnings,
    handleRetry,
    validateResults,
    navigate
};
```

**Updated return statement:**
```javascript
return {
    results,
    loading,
    error,
    retrying,
    gradeLevel,
    monthsInGrade,
    studentInfo,
    studentAcademicData,
    validationWarnings,
    transformationWarnings,  // ✅ NEW: Add transformation warnings
    handleRetry,
    validateResults,
    navigate
};
```

---

## Summary of Changes

### ✅ Already Implemented
1. Import transformer service
2. Create setResults wrapper with transformation
3. Automatic transformation when loading from database

### 🔄 Need to Add
1. Validation warnings state
2. Enhanced validation in setResults
3. Export transformationWarnings in return statement

### 📝 Optional Enhancements
1. Add transformation metrics logging
2. Add retry logic for failed transformations
3. Cache transformed results

---

## Testing the Integration

### Test 1: Load Existing Result
```javascript
// Navigate to result page with attemptId
// URL: /student/assessment/result?attemptId=xxx

// Expected console output:
// 🔄 Transforming database results to PDF format...
// ✅ Transformation complete: {completeness: 85%, hasAptitude: true, ...}
```

### Test 2: Check Transformation
```javascript
// In browser console after result loads:
console.log('Results:', results);
console.log('Has _transformed flag:', results._transformed);
console.log('Has aptitude:', results.aptitude);
console.log('Has careerFit:', results.careerFit);
console.log('Transformation warnings:', transformationWarnings);
```

### Test 3: Verify PDF Data
```javascript
// Click "Download PDF" button
// Check that all sections render:
// - RIASEC scores ✓
// - Strengths ✓
// - Aptitude with overall score ✓
// - Career recommendations with roles/skills/salary ✓
// - Learning styles ✓
// - Work preferences ✓
```

---

## Rollback Instructions

If issues occur, comment out the transformation:

```javascript
// In setResults function, comment out transformation:
const setResults = useCallback((resultsData) => {
    // TEMPORARY: Bypass transformation
    setResultsInternal(resultsData);
    return;
    
    // ... rest of transformation code ...
}, []);
```

---

## Next Steps

1. ✅ Verify transformer service is working
2. 🔄 Add validation warnings state
3. 🔄 Update return statement
4. 🔄 Test with sample data
5. 🔄 Update PDF components
6. 🔄 Deploy to staging

