/**
 * DetailedAssessmentBreakdown Component
 * Print-only section for developers to track assessment logic and scoring
 * This section is hidden from screen view and only appears in PDF exports
 */

import { printStyles } from './styles';
import { getScoreStyle } from './utils';

/**
 * Helper function to get color based on percentage (matching print view theme)
 */
const getScoreColor = (percentage) => {
    if (percentage >= 70) return '#22c55e'; // Green - matches print view
    if (percentage >= 40) return '#eab308'; // Yellow - matches print view
    return '#ef4444'; // Red - matches print view
};

/**
 * Helper function to get performance label
 */
const getPerformanceLabel = (percentage) => {
    if (percentage >= 70) return 'Excellent';
    if (percentage >= 40) return 'Good';
    return 'Needs Improvement';
};

/**
 * DetailedAssessmentBreakdown Component
 * @param {Object} props - Component props
 * @param {Object} props.results - Assessment results data
 * @param {Object} props.riasecNames - RIASEC code to name mapping
 * @param {string} props.gradeLevel - Grade level (middle, highschool, after10, after12, college)
 */
const DetailedAssessmentBreakdown = ({ results, riasecNames, gradeLevel }) => {
    if (!results) return null;

    const { riasec, aptitude, bigFive, workValues, knowledge, employability } = results;

    console.log('🔍 DetailedAssessmentBreakdown received:', {
        hasRiasec: !!riasec,
        riasecScores: riasec?.scores,
        riasecOriginal: riasec?._originalScores,
        hasGeminiResults: !!results.gemini_results,
        geminiOriginal: results.gemini_results?.riasec?._originalScores,
        hasAdaptiveAptitude: !!(results.adaptiveAptitudeResults || results.adaptive_aptitude_results || results.gemini_results?.adaptiveAptitudeResults),
        adaptiveAptitudeData: results.adaptiveAptitudeResults || results.adaptive_aptitude_results || results.gemini_results?.adaptiveAptitudeResults,
        adaptiveFoundAt: results.adaptiveAptitudeResults ? 'results.adaptiveAptitudeResults' : 
                        results.adaptive_aptitude_results ? 'results.adaptive_aptitude_results' : 
                        results.gemini_results?.adaptiveAptitudeResults ? 'results.gemini_results.adaptiveAptitudeResults' : 
                        'NOT FOUND'
    });

    // 🔧 CRITICAL FIX: Check BOTH locations for _originalScores
    let safeRiasec = riasec;
    if (riasec) {
        const scores = riasec.scores || {};
        const allZeros = Object.values(scores).every(score => score === 0);
        
        // Check riasec._originalScores first (after normalization)
        // Then check gemini_results.riasec._originalScores (before normalization)
        const originalScores = riasec._originalScores || 
                              results.gemini_results?.riasec?._originalScores || 
                              {};
        const hasOriginalScores = Object.keys(originalScores).length > 0 &&
            Object.values(originalScores).some(score => score > 0);
        
        console.log('🔍 DetailedAssessmentBreakdown normalization check:', {
            allZeros,
            hasOriginalScores,
            originalScores,
            foundAt: riasec._originalScores ? 'riasec._originalScores' : 
                    results.gemini_results?.riasec?._originalScores ? 'gemini_results.riasec._originalScores' : 
                    'NOT FOUND'
        });
        
        if (allZeros && hasOriginalScores) {
            console.log('🔧 DetailedAssessmentBreakdown: Fixing RIASEC scores from _originalScores');
            console.log('   Using scores:', originalScores);
            safeRiasec = {
                ...riasec,
                scores: originalScores,
                maxScore: riasec.maxScore || 
                         results.gemini_results?.riasec?.maxScore || 
                         24
            };
            console.log('✅ DetailedAssessmentBreakdown: Fixed scores:', safeRiasec.scores);
        } else {
            console.log('⚠️ DetailedAssessmentBreakdown: No fix applied', {
                reason: !allZeros ? 'Scores not all zeros' : 'No original scores found'
            });
        }
    }

    // Calculate stage averages
    const calculateStageAverage = (scores) => {
        if (!scores || Object.keys(scores).length === 0) return 0;
        const values = Object.values(scores).filter(v => typeof v === 'number');
        if (values.length === 0) return 0;
        return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
    };

    // Define all possible stages
    const allStages = [
        {
            id: 1,
            name: 'Interest Explorer (RIASEC)',
            data: safeRiasec,
            scores: safeRiasec?.scores ? Object.entries(safeRiasec.scores).map(([code, score]) => ({
                label: `${code} - ${riasecNames?.[code] || code}`,
                value: score,
                max: safeRiasec.maxScore || 20,
                percentage: Math.round((score / (safeRiasec.maxScore || 20)) * 100)
            })) : [],
            avgPercentage: safeRiasec?.scores ? Math.round(
                Object.values(safeRiasec.scores).reduce((sum, s) => sum + s, 0) / 
                Object.values(safeRiasec.scores).length / 
                (safeRiasec.maxScore || 20) * 100
            ) : 0
        },
        {
            id: 2,
            name: 'Cognitive Abilities (Aptitude)',
            data: aptitude,
            scores: aptitude?.scores ? Object.entries(aptitude.scores).map(([domain, data]) => {
                const configs = {
                    verbal: 'Verbal Reasoning',
                    numerical: 'Numerical Ability',
                    abstract: 'Abstract Reasoning',
                    spatial: 'Spatial Reasoning',
                    clerical: 'Clerical Speed'
                };
                const correct = typeof data === 'object' ? (data.correct || 0) : 0;
                const total = typeof data === 'object' ? (data.total || 1) : 1;
                const percentage = typeof data === 'object' 
                    ? (data.percentage || Math.round((correct / total) * 100))
                    : (typeof data === 'number' ? data : 0);
                
                return {
                    label: configs[domain.toLowerCase()] || domain,
                    value: correct,
                    max: total,
                    percentage
                };
            }) : [],
            avgPercentage: aptitude?.scores ? Math.round(
                Object.values(aptitude.scores).reduce((sum, data) => {
                    const pct = typeof data === 'object' ? (data.percentage || 0) : (typeof data === 'number' ? data : 0);
                    return sum + pct;
                }, 0) / Object.values(aptitude.scores).length
            ) : 0
        },
        {
            id: 2.5,
            name: 'Adaptive Aptitude Test',
            data: results.adaptiveAptitudeResults || results.adaptive_aptitude_results || results.gemini_results?.adaptiveAptitudeResults,
            scores: (() => {
                const adaptiveData = results.adaptiveAptitudeResults || results.adaptive_aptitude_results || results.gemini_results?.adaptiveAptitudeResults;
                if (!adaptiveData) return [];
                
                const scores = [];
                
                // Overall metrics
                scores.push({
                    label: 'Aptitude Level',
                    value: adaptiveData.aptitude_level || adaptiveData.aptitudeLevel || 0,
                    max: 10,
                    percentage: Math.round(((adaptiveData.aptitude_level || adaptiveData.aptitudeLevel || 0) / 10) * 100)
                });
                
                scores.push({
                    label: 'Overall Accuracy',
                    value: adaptiveData.total_correct || adaptiveData.totalCorrect || 0,
                    max: adaptiveData.total_questions || adaptiveData.totalQuestions || 1,
                    percentage: Math.round(parseFloat(adaptiveData.overall_accuracy || adaptiveData.overallAccuracy || 0))
                });
                
                // Breakdown by subtag (question type)
                const accuracyBySubtag = adaptiveData.accuracy_by_subtag || adaptiveData.accuracyBySubtag || {};
                const subtagLabels = {
                    'verbal_reasoning': 'Verbal Reasoning',
                    'logical_reasoning': 'Logical Reasoning',
                    'spatial_reasoning': 'Spatial Reasoning',
                    'numerical_reasoning': 'Numerical Reasoning',
                    'pattern_recognition': 'Pattern Recognition',
                    'data_interpretation': 'Data Interpretation'
                };
                
                Object.entries(accuracyBySubtag).forEach(([subtag, data]) => {
                    if (data && data.total > 0) {
                        scores.push({
                            label: subtagLabels[subtag] || subtag,
                            value: data.correct || 0,
                            max: data.total || 1,
                            percentage: Math.round(data.accuracy || 0)
                        });
                    }
                });
                
                return scores;
            })(),
            avgPercentage: (() => {
                const adaptiveData = results.adaptiveAptitudeResults || results.adaptive_aptitude_results || results.gemini_results?.adaptiveAptitudeResults;
                if (!adaptiveData) return 0;
                return Math.round(parseFloat(adaptiveData.overall_accuracy || adaptiveData.overallAccuracy || 0));
            })()
        },
        {
            id: 3,
            name: 'Personality Traits (Big Five)',
            data: bigFive,
            scores: bigFive ? [
                { label: 'Openness', value: bigFive.O || 0, max: 5, percentage: Math.round(((bigFive.O || 0) / 5) * 100) },
                { label: 'Conscientiousness', value: bigFive.C || 0, max: 5, percentage: Math.round(((bigFive.C || 0) / 5) * 100) },
                { label: 'Extraversion', value: bigFive.E || 0, max: 5, percentage: Math.round(((bigFive.E || 0) / 5) * 100) },
                { label: 'Agreeableness', value: bigFive.A || 0, max: 5, percentage: Math.round(((bigFive.A || 0) / 5) * 100) },
                { label: 'Neuroticism', value: bigFive.N || 0, max: 5, percentage: Math.round(((bigFive.N || 0) / 5) * 100) }
            ] : [],
            avgPercentage: bigFive ? Math.round(
                ((bigFive.O || 0) + (bigFive.C || 0) + (bigFive.E || 0) + (bigFive.A || 0) + (bigFive.N || 0)) / 5 / 5 * 100
            ) : 0
        },
        {
            id: 4,
            name: 'Work Values',
            data: workValues,
            scores: workValues?.topThree?.map((val) => ({
                label: val.value,
                value: val.score,
                max: 5,
                percentage: Math.round((val.score / 5) * 100)
            })) || [],
            avgPercentage: workValues?.topThree ? Math.round(
                workValues.topThree.reduce((sum, val) => sum + val.score, 0) / workValues.topThree.length / 5 * 100
            ) : 0
        },
        {
            id: 5,
            name: 'Knowledge Assessment',
            data: knowledge,
            scores: knowledge?.score !== undefined ? [
                {
                    label: 'Overall Knowledge Score',
                    value: knowledge.correctCount || 0,
                    max: knowledge.totalQuestions || 0,
                    percentage: knowledge.score
                }
            ] : [],
            avgPercentage: knowledge?.score || 0
        },
        {
            id: 6,
            name: 'Employability Skills',
            data: employability,
            scores: (() => {
                if (!employability) return [];
                
                // Handle skillScores object (e.g., {Teamwork: 4.67, Leadership: 5, ...})
                if (employability.skillScores && typeof employability.skillScores === 'object') {
                    return Object.entries(employability.skillScores).map(([skill, score]) => {
                        // Check if score is already a percentage (> 5) or a 0-5 scale
                        const isPercentage = score > 5;
                        const normalizedScore = isPercentage ? score / 20 : score; // If percentage, convert back to 0-5 scale
                        const percentage = isPercentage ? Math.round(score) : Math.round((score / 5) * 100);
                        
                        return {
                            label: skill,
                            value: normalizedScore,
                            max: 5,
                            percentage: percentage
                        };
                    });
                }
                
                // Handle strengthAreas array (e.g., ["Leadership", "Teamwork", ...])
                if (employability.strengthAreas && Array.isArray(employability.strengthAreas)) {
                    return employability.strengthAreas.map((area) => {
                        // If area is an object with skill and score
                        if (typeof area === 'object' && area.skill) {
                            const score = area.score || 4;
                            const isPercentage = score > 5;
                            const normalizedScore = isPercentage ? score / 20 : score;
                            const percentage = isPercentage ? Math.round(score) : Math.round((score / 5) * 100);
                            
                            return {
                                label: area.skill,
                                value: normalizedScore,
                                max: 5,
                                percentage: percentage
                            };
                        }
                        // If area is just a string, use default score
                        return {
                            label: area,
                            value: 4,
                            max: 5,
                            percentage: 80
                        };
                    });
                }
                
                return [];
            })(),
            avgPercentage: (() => {
                if (!employability) return 0;
                
                // Use overallReadiness if available
                if (employability.overallReadiness) {
                    const readinessMap = { 'High': 85, 'Medium': 65, 'Low': 40 };
                    return readinessMap[employability.overallReadiness] || 70;
                }
                
                // Calculate from skillScores
                if (employability.skillScores && typeof employability.skillScores === 'object') {
                    const scores = Object.values(employability.skillScores);
                    // Check if scores are already percentages (> 5) or 0-5 scale
                    const firstScore = scores[0] || 0;
                    const isPercentage = firstScore > 5;
                    
                    if (isPercentage) {
                        // Scores are already percentages, just average them
                        return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
                    } else {
                        // Scores are 0-5 scale, convert to percentage
                        return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length / 5 * 100);
                    }
                }
                
                // Default for strengthAreas
                if (employability.strengthAreas && employability.strengthAreas.length > 0) {
                    return 80;
                }
                
                return 0;
            })()
        }
    ];

    // Filter stages based on grade level - ONLY show stages that have data
    // Middle School (6-8) & High School (9-10): Basic stages only
    // After 10 (11-12): Add knowledge assessment
    // After 12 & College: All stages including employability
    const getStagesForGradeLevel = () => {
        switch (gradeLevel) {
            case 'middle':
            case 'highschool':
                // Grades 6-10: RIASEC and Adaptive Aptitude are REQUIRED
                // Big Five and Work Values are OPTIONAL (not counted in completion)
                // Only show stages that have data
                return allStages.filter(s => {
                    // Always include RIASEC (stage 1) if it has data
                    if (s.id === 1 && s.data) return true;
                    // Always include Adaptive Aptitude (stage 2.5) if it has data
                    if (s.id === 2.5 && s.data) return true;
                    // Don't include other stages for middle/high school
                    return false;
                });
            
            case 'after10':
                // Grades 11-12: RIASEC, Stream Aptitude, Adaptive Aptitude (if available), Big Five, Work Values, Employability
                // Note: Knowledge section (stage 5) is NOT included for after10 (stream-agnostic assessment)
                return allStages.filter(s => [1, 2, 2.5, 3, 4, 6].includes(s.id) && s.data);
            
            case 'after12':
            case 'college':
                // After 12 & College: All stages including Employability and Knowledge
                return allStages.filter(s => s.data);
            
            default:
                // Show all available stages that have data
                return allStages.filter(s => s.data);
        }
    };

    const stages = getStagesForGradeLevel();
    
    // 🔧 CRITICAL FIX: Total expected stages should show ALL possible stages for the grade level
    // This shows students what they SHOULD complete, not just what they DID complete
    // For after10: 6 stages (RIASEC, BigFive, WorkValues, Employability, Adaptive Aptitude, Stream Aptitude)
    const getTotalExpectedStages = () => {
        switch (gradeLevel) {
            case 'middle':
            case 'highschool':
                return 2; // RIASEC + Adaptive Aptitude
            case 'after10':
                // After 10th has 6 possible stages:
                // 1. RIASEC (Career Interests)
                // 2. Stream Aptitude
                // 2.5. Adaptive Aptitude
                // 3. Big Five Personality
                // 4. Work Values
                // 6. Employability Skills
                // Note: Knowledge (stage 5) is NOT included for after10
                return 6;
            case 'after12':
            case 'college':
                // All 7 stages including Employability and Knowledge
                return 7;
            default:
                return stages.length;
        }
    };
    
    const totalExpectedStages = getTotalExpectedStages();

    return (
        <div style={{ 
            padding: '10px',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '9px',
            lineHeight: '1.2',
            color: '#1f2937'
        }}>
            {/* Header - Dark slate theme matching "Message for You" */}
            <div style={{
                ...printStyles.finalBox,
                marginTop: '0',
                marginBottom: '6px',
                padding: '8px 12px'
            }}>
                <h2 style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fbbf24',
                    margin: '0 0 3px 0'
                }}>
                    Detailed Assessment Breakdown
                </h2>
                <p style={{
                    fontSize: '7px',
                    color: '#cbd5e1',
                    margin: 0,
                    fontStyle: 'italic'
                }}>
                    Developer Reference: Stage-by-stage scoring logic and performance metrics
                </p>
            </div>

            {/* Overall Summary - Dark theme to match */}
            <div style={{
                background: '#334155',
                border: '1px solid #475569',
                borderRadius: '6px',
                padding: '6px 8px',
                marginBottom: '6px'
            }}>
                <h3 style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#fbbf24',
                    margin: '0 0 6px 0'
                }}>
                    Assessment Completion Summary
                </h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div>
                        <span style={{ fontSize: '8px', color: '#cbd5e1' }}>Stages Completed:</span>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ffffff', marginLeft: '5px' }}>
                            {stages.length} / {totalExpectedStages}
                        </span>
                    </div>
                    <div>
                        <span style={{ fontSize: '8px', color: '#cbd5e1' }}>Overall Average:</span>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ffffff', marginLeft: '5px' }}>
                            {stages.length > 0 ? Math.round(stages.reduce((sum, s) => sum + s.avgPercentage, 0) / stages.length) : 0}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Stage Details */}
            {stages.map((stage) => {
                if (!stage.data || stage.scores.length === 0) return null;

                return (
                    <div key={stage.id} style={{
                        ...printStyles.card,
                        marginBottom: '6px',
                        padding: '0'
                    }}>
                        {/* Stage Header - Dark slate theme matching "Message for You" */}
                        <div style={{
                            background: '#1e293b',
                            color: 'white',
                            padding: '5px 8px',
                            margin: '0',
                            borderRadius: '6px 6px 0 0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #fbbf24'
                        }}>
                            <div>
                                <span style={{ fontSize: '7px', color: '#fbbf24', display: 'block', marginBottom: '1px', fontWeight: '600' }}>
                                    STAGE {stage.id}
                                </span>
                                <h4 style={{ fontSize: '9px', fontWeight: 'bold', margin: 0 }}>
                                    {stage.name}
                                </h4>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fbbf24' }}>{stage.avgPercentage}%</div>
                                <div style={{ fontSize: '6px', opacity: 0.9 }}>Average</div>
                            </div>
                        </div>

                        {/* Score Details Table - matching print view table style */}
                        <div style={{ padding: '0' }}>
                            <table style={printStyles.table}>
                                <thead>
                                    <tr>
                                        <th style={{
                                            ...printStyles.th,
                                            textAlign: 'left',
                                            fontSize: '9px'
                                        }}>
                                            Dimension
                                        </th>
                                        <th style={{
                                            ...printStyles.th,
                                            textAlign: 'center',
                                            fontSize: '9px'
                                        }}>
                                            Score
                                        </th>
                                        <th style={{
                                            ...printStyles.th,
                                            textAlign: 'center',
                                            fontSize: '9px'
                                        }}>
                                            Percentage
                                        </th>
                                        <th style={{
                                            ...printStyles.th,
                                            textAlign: 'center',
                                            fontSize: '9px'
                                        }}>
                                            Performance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stage.scores.map((score, idx) => {
                                        const color = getScoreColor(score.percentage);
                                        const performance = getPerformanceLabel(score.percentage);
                                        
                                        return (
                                            <tr key={idx}>
                                                <td style={{
                                                    ...printStyles.td,
                                                    fontSize: '9px',
                                                    color: '#1f2937'
                                                }}>
                                                    {score.label}
                                                </td>
                                                <td style={{
                                                    ...printStyles.td,
                                                    textAlign: 'center',
                                                    fontSize: '9px',
                                                    fontWeight: '600',
                                                    color: '#374151'
                                                }}>
                                                    {/* Show whole numbers for knowledge scores, decimals for others */}
                                                    {stage.id === 5 
                                                        ? `${Math.round(score.value)} / ${score.max}`
                                                        : `${score.value.toFixed(1)} / ${score.max}`
                                                    }
                                                </td>
                                                <td style={{
                                                    ...printStyles.td,
                                                    textAlign: 'center'
                                                }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '9px',
                                                        fontWeight: '600',
                                                        backgroundColor: `${color}20`,
                                                        color: color,
                                                        border: `1px solid ${color}40`
                                                    }}>
                                                        {score.percentage}%
                                                    </span>
                                                </td>
                                                <td style={{
                                                    ...printStyles.td,
                                                    textAlign: 'center',
                                                    fontSize: '8px',
                                                    color: color,
                                                    fontWeight: '600'
                                                }}>
                                                    {performance}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Stage Summary removed to save space */}
                    </div>
                );
            })}

            {/* Footer Note - Dark theme matching "Message for You" */}
            <div style={{
                ...printStyles.finalBox,
                marginTop: '15px'
            }}>
                <h4 style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#fbbf24',
                    margin: '0 0 6px 0'
                }}>
                    Developer Note
                </h4>
                <p style={{
                    fontSize: '9px',
                    color: '#e2e8f0',
                    margin: 0,
                    lineHeight: '1.6'
                }}>
                    This detailed breakdown is included in the PDF export for internal tracking and quality assurance. 
                    It provides granular visibility into the assessment scoring logic, helping developers verify calculation accuracy and identify 
                    potential data quality issues. <strong style={{ color: '#fbbf24' }}>Color coding:</strong> <strong style={{ color: '#22c55e' }}>Green (≥70%)</strong> = Excellent, <strong style={{ color: '#eab308' }}>Yellow (40-69%)</strong> = Good, <strong style={{ color: '#ef4444' }}>Red (&lt;40%)</strong> = Needs Improvement.
                </p>
            </div>
        </div>
    );
};

export default DetailedAssessmentBreakdown;
