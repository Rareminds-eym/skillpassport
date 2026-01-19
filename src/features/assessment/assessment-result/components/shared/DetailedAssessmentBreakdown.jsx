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
            data: riasec,
            scores: riasec?.scores ? Object.entries(riasec.scores).map(([code, score]) => ({
                label: `${code} - ${riasecNames?.[code] || code}`,
                value: score,
                max: riasec.maxScore || 20,
                percentage: Math.round((score / (riasec.maxScore || 20)) * 100)
            })) : [],
            avgPercentage: riasec?.scores ? Math.round(
                Object.values(riasec.scores).reduce((sum, s) => sum + s, 0) / 
                Object.values(riasec.scores).length / 
                (riasec.maxScore || 20) * 100
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
                    value: knowledge.score,
                    max: 100,
                    percentage: knowledge.score
                }
            ] : [],
            avgPercentage: knowledge?.score || 0
        },
        {
            id: 6,
            name: 'Employability Skills',
            data: employability,
            scores: employability?.strengthAreas ? employability.strengthAreas.map((area, idx) => ({
                label: area.skill || area,
                value: area.score || 4,
                max: 5,
                percentage: Math.round(((area.score || 4) / 5) * 100)
            })) : [],
            avgPercentage: employability?.strengthAreas ? Math.round(
                employability.strengthAreas.reduce((sum, area) => sum + (area.score || 4), 0) / 
                employability.strengthAreas.length / 5 * 100
            ) : 0
        }
    ];

    // Filter stages based on grade level
    // Middle School (6-8) & High School (9-10): Basic stages only
    // After 10 (11-12): Add knowledge assessment
    // After 12 & College: All stages including employability
    const getStagesForGradeLevel = () => {
        switch (gradeLevel) {
            case 'middle':
            case 'highschool':
                // Grades 6-10: RIASEC, Big Five, Work Values (no aptitude tests, no knowledge, no employability)
                return allStages.filter(s => [1, 3, 4].includes(s.id));
            
            case 'after10':
                // Grades 11-12: RIASEC, Aptitude, Big Five, Work Values, Knowledge
                return allStages.filter(s => [1, 2, 3, 4, 5].includes(s.id));
            
            case 'after12':
            case 'college':
                // After 12 & College: All stages including Employability
                return allStages;
            
            default:
                // Show all available stages
                return allStages;
        }
    };

    const stages = getStagesForGradeLevel();

    return (
        <div style={{ 
            pageBreakBefore: 'always',
            padding: '15px',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '10px',
            lineHeight: '1.3',
            color: '#1f2937'
        }}>
            {/* Header - Dark slate theme matching "Message for You" */}
            <div style={{
                ...printStyles.finalBox,
                marginTop: '0',
                marginBottom: '10px',
                padding: '10px 15px'
            }}>
                <h2 style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#fbbf24',
                    margin: '0 0 4px 0'
                }}>
                    Detailed Assessment Breakdown
                </h2>
                <p style={{
                    fontSize: '8px',
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
                padding: '8px 10px',
                marginBottom: '10px',
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
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
                            {stages.filter(s => s.data).length} / {stages.length}
                        </span>
                    </div>
                    <div>
                        <span style={{ fontSize: '8px', color: '#cbd5e1' }}>Overall Average:</span>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ffffff', marginLeft: '5px' }}>
                            {Math.round(stages.filter(s => s.data).reduce((sum, s) => sum + s.avgPercentage, 0) / stages.filter(s => s.data).length)}%
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
                        marginBottom: '8px',
                        padding: '0',
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid'
                    }}>
                        {/* Stage Header - Dark slate theme matching "Message for You" */}
                        <div style={{
                            background: '#1e293b',
                            color: 'white',
                            padding: '6px 10px',
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
                                <h4 style={{ fontSize: '10px', fontWeight: 'bold', margin: 0 }}>
                                    {stage.name}
                                </h4>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fbbf24' }}>{stage.avgPercentage}%</div>
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
                                                    {score.value.toFixed(1)} / {score.max}
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

                        {/* Stage Summary - matching print view summary box */}
                        <div style={{
                            background: '#f8fafc',
                            padding: '10px 12px',
                            margin: '12px -12px -12px -12px',
                            borderTop: '1px solid #e2e8f0',
                            borderRadius: '0 0 6px 6px'
                        }}>
                            <p style={{
                                fontSize: '9px',
                                color: '#475569',
                                margin: 0,
                                lineHeight: '1.5'
                            }}>
                                <strong>Analysis:</strong> {
                                    stage.avgPercentage >= 70 
                                        ? `Strong performance across ${stage.name.toLowerCase()}. Scores indicate clear strengths in this area.`
                                        : stage.avgPercentage >= 40
                                        ? `Solid performance in ${stage.name.toLowerCase()}. Some dimensions show room for development.`
                                        : `Development opportunity in ${stage.name.toLowerCase()}. Focus on improving lower-scoring dimensions.`
                                }
                            </p>
                        </div>
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
