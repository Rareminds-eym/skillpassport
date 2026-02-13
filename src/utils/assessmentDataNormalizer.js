/**
 * Assessment Data Normalizer
 * 
 * Fixes data inconsistencies in assessment results where scores may be stored
 * in different locations due to backend processing variations.
 * 
 * Primary Issue: RIASEC scores stored as zeros in top-level but correct values
 * exist in gemini_results._originalScores
 */

/**
 * Normalize RIASEC scores from assessment results
 * 
 * @param {Object} results - Raw assessment results from database
 * @returns {Object} - Normalized results with correct RIASEC scores
 */
export const normalizeAssessmentResults = (results) => {
    if (!results) {
        console.log('⚠️ Normalizer: No results provided');
        return null;
    }

    // Create a deep copy to avoid mutating original
    const normalized = JSON.parse(JSON.stringify(results));

    console.log('🔍 Normalizer input:', {
        hasRiasec: !!normalized.riasec,
        riasecScores: normalized.riasec?.scores,
        riasecOriginal: normalized.riasec?._originalScores,
        hasGeminiResults: !!normalized.gemini_results,
        geminiRiasec: normalized.gemini_results?.riasec,
        geminiOriginal: normalized.gemini_results?.riasec?._originalScores
    });

    // Fix RIASEC scores if they're all zeros but we have data in gemini_results
    if (normalized.riasec && normalized.gemini_results?.riasec) {
        const topLevelScores = normalized.riasec.scores || {};
        const originalScores = normalized.gemini_results.riasec._originalScores || {};
        const percentages = normalized.gemini_results.riasec.percentages || {};

        // Check if top-level scores are all zeros
        const allZeros = Object.values(topLevelScores).every(score => score === 0);

        // Check if we have valid original scores
        const hasOriginalScores = Object.keys(originalScores).length > 0 &&
            Object.values(originalScores).some(score => score > 0);

        console.log('🔍 Normalization check:', {
            allZeros,
            hasOriginalScores,
            topLevelScores,
            originalScores
        });

        if (allZeros && hasOriginalScores) {
            console.log('🔧 Normalizing RIASEC scores from gemini_results._originalScores');
            console.log('   Before:', topLevelScores);
            console.log('   After:', originalScores);
            
            // Use original scores
            normalized.riasec.scores = { ...originalScores };
            
            // CRITICAL: Preserve _originalScores at riasec level for PDF components
            normalized.riasec._originalScores = { ...originalScores };

            // Calculate percentages if not present
            const maxScore = normalized.gemini_results.riasec.maxScore || 24;
            if (Object.keys(percentages).length === 0) {
                normalized.riasec.percentages = {};
                Object.entries(originalScores).forEach(([code, score]) => {
                    normalized.riasec.percentages[code] = Math.round((score / maxScore) * 100);
                });
            } else {
                normalized.riasec.percentages = { ...percentages };
            }

            // Ensure maxScore is set
            if (!normalized.riasec.maxScore) {
                normalized.riasec.maxScore = maxScore;
            }

            console.log('✅ RIASEC scores normalized:', normalized.riasec.scores);
            console.log('✅ Preserved _originalScores:', normalized.riasec._originalScores);
        } else {
            console.log('ℹ️ No normalization needed or no data available', {
                reason: !allZeros ? 'Scores not all zeros' : 'No original scores found'
            });
        }
    } else {
        console.log('⚠️ Missing riasec or gemini_results structure', {
            hasRiasec: !!normalized.riasec,
            hasGeminiResults: !!normalized.gemini_results,
            hasGeminiRiasec: !!normalized.gemini_results?.riasec
        });
    }

    // 🔧 CRITICAL FIX: Lift adaptiveAptitudeResults to top level for PDF components
    if (normalized.gemini_results?.adaptiveAptitudeResults && !normalized.adaptiveAptitudeResults) {
        console.log('🔧 Lifting adaptiveAptitudeResults from gemini_results to top level');
        normalized.adaptiveAptitudeResults = normalized.gemini_results.adaptiveAptitudeResults;
        console.log('✅ adaptiveAptitudeResults now available at top level');
    }

    // 🔧 CRITICAL FIX: Lift characterStrengths to top level for PDF components
    if (normalized.gemini_results?.characterStrengths && !normalized.characterStrengths) {
        console.log('🔧 Lifting characterStrengths from gemini_results to top level');
        normalized.characterStrengths = normalized.gemini_results.characterStrengths;
    }

    // 🔧 CRITICAL FIX: Lift learningStyle to top level for PDF components
    if (normalized.gemini_results?.learningStyle && !normalized.learningStyle) {
        console.log('🔧 Lifting learningStyle from gemini_results to top level');
        normalized.learningStyle = normalized.gemini_results.learningStyle;
    }

    // 🔧 CRITICAL FIX: Lift careerFit to top level for PDF components
    if (normalized.gemini_results?.careerFit && !normalized.careerFit) {
        console.log('🔧 Lifting careerFit from gemini_results to top level');
        normalized.careerFit = normalized.gemini_results.careerFit;
    }

    // 🔧 Lift timingAnalysis to top level for PDF components
    if (normalized.gemini_results?.timingAnalysis && !normalized.timingAnalysis) {
        normalized.timingAnalysis = normalized.gemini_results.timingAnalysis;
    }

    // 🔧 Lift knowledge to top level for PDF components
    if (normalized.gemini_results?.knowledge && !normalized.knowledge) {
        console.log('🔧 Lifting knowledge from gemini_results to top level');
        normalized.knowledge = normalized.gemini_results.knowledge;
    }

    // 🔧 CRITICAL FIX: Fix aptitude scores if needed
    // Priority 1: Use top-level aptitude_scores column (most reliable)
    // Priority 2: Use gemini_results.aptitude._originalScores
    // Priority 3: Use gemini_results.aptitude.scores (may be zeros)
    
    // Check if we have aptitude_scores at top level (from database column)
    if (normalized.aptitude_scores && !normalized.aptitude) {
        console.log('🔧 Creating aptitude object from aptitude_scores column');
        normalized.aptitude = {
            scores: normalized.aptitude_scores
        };
    }
    
    // If aptitude exists but has zero scores, try to fix from _originalScores or aptitude_scores
    if (normalized.aptitude || normalized.gemini_results?.aptitude) {
        const topLevelScores = normalized.aptitude?.scores || {};
        const originalScores = normalized.gemini_results?.aptitude?._originalScores || {};
        const aptitudeScoresColumn = normalized.aptitude_scores || {};

        // Check if top-level scores are all zeros or empty
        const hasNoScores = Object.keys(topLevelScores).length === 0 ||
            Object.values(topLevelScores).every(score => {
                if (typeof score === 'object') {
                    return (score.correct === 0 && score.total === 0) || score.percentage === 0;
                }
                return score === 0;
            });

        // Check if we have valid original scores
        const hasOriginalScores = Object.keys(originalScores).length > 0 &&
            Object.values(originalScores).some(score => {
                if (typeof score === 'object') {
                    return score.percentage > 0 || score.correct > 0;
                }
                return score > 0;
            });

        // Check if we have valid aptitude_scores column data
        const hasAptitudeScoresColumn = Object.keys(aptitudeScoresColumn).length > 0 &&
            Object.values(aptitudeScoresColumn).some(score => {
                if (typeof score === 'object') {
                    return score.percentage > 0 || score.correct > 0;
                }
                return score > 0;
            });

        console.log('🔍 Aptitude normalization check:', {
            hasNoScores,
            hasOriginalScores,
            hasAptitudeScoresColumn,
            topLevelScores: JSON.stringify(topLevelScores),
            originalScores: JSON.stringify(originalScores),
            aptitudeScoresColumn: JSON.stringify(aptitudeScoresColumn)
        });

        if (hasNoScores) {
            // Priority 1: Use aptitude_scores column
            if (hasAptitudeScoresColumn) {
                console.log('🔧 Normalizing aptitude scores from aptitude_scores column');
                console.log('   Before:', JSON.stringify(topLevelScores));
                console.log('   After:', JSON.stringify(aptitudeScoresColumn));
                
                if (!normalized.aptitude) {
                    normalized.aptitude = {};
                }
                normalized.aptitude.scores = { ...aptitudeScoresColumn };
                console.log('✅ Aptitude scores normalized from aptitude_scores column');
            }
            // Priority 2: Use _originalScores
            else if (hasOriginalScores) {
                console.log('🔧 Normalizing aptitude scores from gemini_results.aptitude._originalScores');
                console.log('   Before:', JSON.stringify(topLevelScores));
                console.log('   After:', JSON.stringify(originalScores));
                
                if (!normalized.aptitude) {
                    normalized.aptitude = {};
                }
                normalized.aptitude.scores = { ...originalScores };
                console.log('✅ Aptitude scores normalized from _originalScores');
            }
        } else {
            console.log('ℹ️ Aptitude scores already valid, no normalization needed');
        }
    }

    return normalized;
};

/**
 * Calculate RIASEC percentages from scores
 * 
 * @param {Object} scores - RIASEC scores object {A: 14, S: 12, ...}
 * @param {number} maxScore - Maximum possible score per dimension (default: 24)
 * @returns {Object} - Percentages object {A: 70, S: 60, ...}
 */
export const calculateRIASECPercentages = (scores, maxScore = 24) => {
    if (!scores || typeof scores !== 'object') return {};

    const percentages = {};
    Object.entries(scores).forEach(([code, score]) => {
        percentages[code] = Math.round((score / maxScore) * 100);
    });

    return percentages;
};

/**
 * Get performance label based on percentage
 * 
 * @param {number} percentage - Score percentage (0-100)
 * @returns {string} - Performance label
 */
export const getPerformanceLabel = (percentage) => {
    if (percentage >= 70) return 'Excellent';
    if (percentage >= 40) return 'Good';
    return 'Needs Improvement';
};

/**
 * Get color configuration based on percentage
 * 
 * @param {number} percentage - Score percentage (0-100)
 * @returns {Object} - Color configuration object
 */
export const getScoreColor = (percentage) => {
    if (percentage >= 70) {
        return {
            bg: 'bg-green-500',
            text: 'text-green-600',
            light: 'bg-green-100',
            border: 'border-green-200',
            stroke: '#22c55e',
            gradient: 'from-green-500 to-emerald-500',
            label: 'Excellent'
        };
    }
    if (percentage >= 40) {
        return {
            bg: 'bg-yellow-500',
            text: 'text-yellow-600',
            light: 'bg-yellow-100',
            border: 'border-yellow-200',
            stroke: '#eab308',
            gradient: 'from-yellow-500 to-amber-500',
            label: 'Good'
        };
    }
    return {
        bg: 'bg-red-500',
        text: 'text-red-600',
        light: 'bg-red-100',
        border: 'border-red-200',
        stroke: '#ef4444',
        gradient: 'from-red-500 to-rose-500',
        label: 'Needs Improvement'
    };
};

/**
 * Validate assessment results structure
 * 
 * @param {Object} results - Assessment results to validate
 * @returns {Object} - Validation result {valid: boolean, errors: string[]}
 */
export const validateAssessmentResults = (results) => {
    const errors = [];

    if (!results) {
        errors.push('Results object is null or undefined');
        return { valid: false, errors };
    }

    // Check RIASEC data
    if (!results.riasec) {
        errors.push('Missing RIASEC data');
    } else {
        if (!results.riasec.scores || Object.keys(results.riasec.scores).length === 0) {
            errors.push('Missing RIASEC scores');
        }
        if (!results.riasec.code) {
            errors.push('Missing RIASEC code');
        }
    }

    // Check if we have gemini_results as fallback
    if (errors.length > 0 && results.gemini_results) {
        if (results.gemini_results.riasec?._originalScores) {
            console.log('⚠️ Validation errors found, but gemini_results has fallback data');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        hasGeminiFallback: !!results.gemini_results?.riasec?._originalScores
    };
};

export default {
    normalizeAssessmentResults,
    calculateRIASECPercentages,
    getPerformanceLabel,
    getScoreColor,
    validateAssessmentResults
};
