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

    // Fix aptitude scores if needed
    if (normalized.aptitude && normalized.gemini_results?.aptitude) {
        const topLevelScores = normalized.aptitude.scores || {};
        const originalScores = normalized.gemini_results.aptitude._originalScores || {};

        // Check if top-level scores are all zeros or empty
        const hasNoScores = Object.keys(topLevelScores).length === 0 ||
            Object.values(topLevelScores).every(score => {
                if (typeof score === 'object') {
                    return score.correct === 0 && score.total === 0;
                }
                return score === 0;
            });

        // Check if we have valid original scores
        const hasOriginalScores = Object.keys(originalScores).length > 0;

        if (hasNoScores && hasOriginalScores) {
            console.log('🔧 Normalizing aptitude scores from gemini_results._originalScores');
            
            // Convert original scores to the expected format
            normalized.aptitude.scores = {};
            Object.entries(originalScores).forEach(([domain, data]) => {
                if (typeof data === 'object' && data.accuracy !== undefined) {
                    // Convert accuracy percentage to score format
                    normalized.aptitude.scores[domain] = {
                        correct: 0,
                        total: 0,
                        percentage: data.accuracy
                    };
                }
            });

            console.log('✅ Aptitude scores normalized:', normalized.aptitude.scores);
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
