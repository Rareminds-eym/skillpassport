/**
 * DetailedAssessmentBreakdown Component
 * Print-only section for developers to track assessment logic and scoring
 * This section is hidden from screen view and only appears in PDF exports
 */

import { printStyles } from '@/features/assessment/lib/printStyles';
import { getScoreStyle } from '@/features/assessment/lib/printUtils';

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

const toNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const pickFirstNumber = (...values) => {
    for (const value of values) {
        const number = Number(value);
        if (Number.isFinite(number)) return number;
    }
    return 0;
};

const clampPercentage = (value) => Math.max(0, Math.min(100, Math.round(toNumber(value))));

const getRiasecMaxScore = (riasec) => {
    const configuredMax = toNumber(riasec?.maxScore, 20);
    const scores = Object.values(riasec?.scores || {}).map((score) => toNumber(score));
    const highestScore = scores.length ? Math.max(...scores) : 0;

    if (highestScore > configuredMax) {
        return Math.max(40, configuredMax, highestScore);
    }

    return configuredMax;
};

const RIASEC_DIMENSIONS = {
    R: { key: 'realistic', name: 'Realistic' },
    I: { key: 'investigative', name: 'Investigative' },
    A: { key: 'artistic', name: 'Artistic' },
    S: { key: 'social', name: 'Social' },
    E: { key: 'enterprising', name: 'Enterprising' },
    C: { key: 'conventional', name: 'Conventional' }
};

const getRiasecLabel = (code) => {
    const normalizedCode = String(code || '').trim();
    const upperCode = normalizedCode.toUpperCase();
    const dimensionFromCode = RIASEC_DIMENSIONS[upperCode];

    if (dimensionFromCode) {
        return `${upperCode} - ${dimensionFromCode.name}`;
    }

    const matchedEntry = Object.entries(RIASEC_DIMENSIONS).find(
        ([, dimension]) => dimension.key === normalizedCode.toLowerCase()
    );

    if (matchedEntry) {
        const [letter, dimension] = matchedEntry;
        return `${letter} - ${dimension.name}`;
    }

    return normalizedCode;
};

const getBigFiveScore = (bigFive, shortKey, longKey) => (
    pickFirstNumber(
        bigFive?.[longKey],
        bigFive?.scores?.[longKey],
        bigFive?.[shortKey],
        bigFive?.scores?.[shortKey]
    )
);

const normalizeWorkValues = (workValues) => {
    if (!workValues) return [];
    if (Array.isArray(workValues.topThree)) {
        return workValues.topThree.map((value) => ({
            label: value.value || value.label,
            value: toNumber(value.score ?? value.valueScore),
            max: 5,
            percentage: clampPercentage((toNumber(value.score ?? value.valueScore) / 5) * 100)
        }));
    }

    const scores = workValues.scores || workValues;
    if (!scores || typeof scores !== 'object') return [];

    return Object.entries(scores)
        .filter(([, score]) => Number.isFinite(Number(score)))
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .slice(0, 8)
        .map(([label, score]) => ({
            label,
            value: toNumber(score),
            max: 5,
            percentage: clampPercentage((toNumber(score) / 5) * 100)
        }));
};

const normalizeKnowledgeScore = (knowledge) => {
    if (!knowledge) return null;
    const details = knowledge.details || knowledge;
    const score = pickFirstNumber(knowledge.score, details.score, knowledge.percentage);
    const correctCount = pickFirstNumber(knowledge.correctCount, details.correctCount);
    const mappedTotalQuestions = pickFirstNumber(knowledge.totalQuestions, details.totalQuestions);
    const inferredTotalQuestions = correctCount > 0 && score > 0
        ? Math.round(correctCount / (score / 100))
        : 0;
    const totalQuestions = mappedTotalQuestions || inferredTotalQuestions;

    return {
        label: 'Overall Knowledge Score',
        value: correctCount || score,
        max: totalQuestions || 100,
        percentage: clampPercentage(score)
    };
};

const normalizeAptitudeScore = (domain, data) => {
    const configs = {
        verbal: 'Verbal Reasoning',
        numerical: 'Numerical Ability',
        abstract: 'Abstract Reasoning',
        spatial: 'Spatial Reasoning',
        clerical: 'Clerical Speed',
        logical_reasoning: 'Logical Reasoning',
        data_interpretation: 'Data Interpretation',
        numerical_reasoning: 'Numerical Reasoning',
        pattern_recognition: 'Pattern Recognition'
    };
    const hasCorrectCount = data && typeof data === 'object' && (
        data.correct !== undefined ||
        data.correctCount !== undefined
    );
    const hasTotalCount = data && typeof data === 'object' && (
        data.total !== undefined ||
        data.totalQuestions !== undefined
    );
    const percentage = typeof data === 'object'
        ? pickFirstNumber(data.percentage, data.accuracy, data.score)
        : toNumber(data);
    const correct = hasCorrectCount
        ? pickFirstNumber(data.correct, data.correctCount)
        : percentage;
    const total = hasTotalCount
        ? pickFirstNumber(data.total, data.totalQuestions)
        : 100;

    return {
        label: configs[String(domain).toLowerCase()] || String(domain).replace(/_/g, ' '),
        value: correct,
        max: total || 100,
        percentage: clampPercentage(percentage)
    };
};

const normalizeEmployabilityScores = (employability) => {
    if (!employability) return [];
    const skillScores = employability.skillScores || employability.scores;

    if (skillScores && typeof skillScores === 'object') {
        return Object.entries(skillScores).map(([skill, score]) => {
            const numericScore = toNumber(score);
            const isPercentage = numericScore > 5;
            const normalizedScore = isPercentage ? numericScore / 20 : numericScore;
            const percentage = isPercentage ? clampPercentage(numericScore) : clampPercentage((numericScore / 5) * 100);

            return {
                label: skill,
                value: normalizedScore,
                max: 5,
                percentage
            };
        });
    }

    if (employability.strengthAreas && Array.isArray(employability.strengthAreas)) {
        return employability.strengthAreas.map((area) => {
            if (typeof area === 'object' && area.skill) {
                const score = toNumber(area.score, 4);
                const isPercentage = score > 5;
                const normalizedScore = isPercentage ? score / 20 : score;
                const percentage = isPercentage ? clampPercentage(score) : clampPercentage((score / 5) * 100);

                return {
                    label: area.skill,
                    value: normalizedScore,
                    max: 5,
                    percentage
                };
            }

            return {
                label: area,
                value: 4,
                max: 5,
                percentage: 80
            };
        });
    }

    return [];
};

const getEmployabilityAverage = (employability) => {
    if (!employability) return 0;

    if (employability.overallReadiness) {
        const readinessMap = { High: 85, Medium: 65, Low: 40 };
        return readinessMap[employability.overallReadiness] || 70;
    }

    const scores = normalizeEmployabilityScores(employability);
    if (scores.length > 0) {
        return clampPercentage(scores.reduce((sum, score) => sum + score.percentage, 0) / scores.length);
    }

    return 0;
};

const getAdaptiveAptitudeData = (results) => (
    results.adaptiveAptitudeResults ||
    results.adaptive_aptitude_results ||
    results.aptitude_scores ||
    results.gemini_results?.adaptiveAptitudeResults ||
    null
);

const normalizeAdaptiveAptitudeScores = (results) => {
    const adaptiveData = getAdaptiveAptitudeData(results);
    if (!adaptiveData) return [];

    const rows = [];
    const aptitudeLevel = pickFirstNumber(adaptiveData.aptitude_level, adaptiveData.aptitudeLevel);
    if (aptitudeLevel > 0) {
        rows.push({
            label: 'Aptitude Level',
            value: aptitudeLevel,
            max: 10,
            percentage: clampPercentage((aptitudeLevel / 10) * 100)
        });
    }

    const totalCorrect = pickFirstNumber(adaptiveData.total_correct, adaptiveData.totalCorrect);
    const totalQuestions = pickFirstNumber(adaptiveData.total_questions, adaptiveData.totalQuestions);
    const overallAccuracy = pickFirstNumber(adaptiveData.overall_accuracy, adaptiveData.overallAccuracy, results.aptitudeOverall, results.aptitude_overall);
    if (totalQuestions > 0 || overallAccuracy > 0) {
        rows.push({
            label: 'Overall Accuracy',
            value: totalQuestions > 0 ? totalCorrect : overallAccuracy,
            max: totalQuestions > 0 ? totalQuestions : 100,
            percentage: clampPercentage(overallAccuracy)
        });
    }

    const accuracyBySubtag = adaptiveData.accuracy_by_subtag || adaptiveData.accuracyBySubtag || {};
    const subtagLabels = {
        verbal_reasoning: 'Verbal Reasoning',
        logical_reasoning: 'Logical Reasoning',
        spatial_reasoning: 'Spatial Reasoning',
        numerical_reasoning: 'Numerical Reasoning',
        pattern_recognition: 'Pattern Recognition',
        data_interpretation: 'Data Interpretation'
    };

    Object.entries(accuracyBySubtag).forEach(([subtag, data]) => {
        if (data && data.total > 0) {
            rows.push({
                label: subtagLabels[subtag] || subtag.replace(/_/g, ' '),
                value: pickFirstNumber(data.correct),
                max: pickFirstNumber(data.total) || 1,
                percentage: clampPercentage(data.accuracy)
            });
        }
    });

    return rows;
};

const normalizeStreamAptitudeScores = (results) => {
    const details = results.streamAptitudeDetails || results.stream_aptitude_details;
    if (!details) return [];

    const byDifficulty = details.byDifficulty || details.by_difficulty || {};
    const rows = Object.entries(byDifficulty)
        .filter(([, data]) => data && typeof data === 'object')
        .map(([difficulty, data]) => {
            const correct = pickFirstNumber(data.correct, data.correctCount);
            const total = pickFirstNumber(data.total, data.totalQuestions);
            const percentage = pickFirstNumber(
                data.percentage,
                data.accuracy,
                total > 0 ? (correct / total) * 100 : 0
            );

            return {
                label: `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)} Difficulty`,
                value: correct,
                max: total || 1,
                percentage: clampPercentage(percentage)
            };
        });

    if (rows.length > 0) return rows;

    const score = pickFirstNumber(results.streamAptitudeScore, results.stream_aptitude_score, details.score);
    const correctCount = pickFirstNumber(details.correctCount);
    const mappedTotalQuestions = pickFirstNumber(details.totalQuestions);
    const inferredTotalQuestions = correctCount > 0 && score > 0
        ? Math.round(correctCount / (score / 100))
        : 0;

    return [{
        label: 'Overall Stream Aptitude',
        value: correctCount || score,
        max: mappedTotalQuestions || inferredTotalQuestions || 100,
        percentage: clampPercentage(score)
    }];
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
    const adaptiveAptitudeScores = normalizeAdaptiveAptitudeScores(results);
    const adaptiveAptitudeData = getAdaptiveAptitudeData(results);
    const adaptiveAptitudeAverage = pickFirstNumber(
        adaptiveAptitudeData?.overall_accuracy,
        adaptiveAptitudeData?.overallAccuracy,
        results.aptitudeOverall,
        results.aptitude_overall
    );
    const streamAptitudeScores = normalizeStreamAptitudeScores(results);
    const streamAptitudeScore = pickFirstNumber(
        results.streamAptitudeScore,
        results.stream_aptitude_score,
        results.streamAptitudeDetails?.score,
        results.stream_aptitude_details?.score
    );

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

        if (allZeros && hasOriginalScores) {
            safeRiasec = {
                ...riasec,
                scores: originalScores,
                maxScore: riasec.maxScore ||
                         results.gemini_results?.riasec?.maxScore ||
                         24
            };
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
    const riasecMaxScore = getRiasecMaxScore(safeRiasec);
    const allStages = [
        {
            id: 1,
            name: 'Interest Explorer (RIASEC)',
            data: safeRiasec,
            scores: safeRiasec?.scores ? Object.entries(safeRiasec.scores).map(([code, score]) => ({
                label: getRiasecLabel(code),
                value: score,
                max: riasecMaxScore,
                percentage: clampPercentage((score / riasecMaxScore) * 100)
            })) : [],
            avgPercentage: safeRiasec?.scores ? clampPercentage(
                Object.values(safeRiasec.scores).reduce((sum, s) => sum + s, 0) /
                Object.values(safeRiasec.scores).length /
                riasecMaxScore * 100
            ) : 0
        },
        {
            id: 2,
            name: 'Personality Traits (Big Five)',
            data: bigFive,
            scores: bigFive ? [
                { label: 'Openness', value: getBigFiveScore(bigFive, 'O', 'openness'), max: 5, percentage: clampPercentage((getBigFiveScore(bigFive, 'O', 'openness') / 5) * 100) },
                { label: 'Conscientiousness', value: getBigFiveScore(bigFive, 'C', 'conscientiousness'), max: 5, percentage: clampPercentage((getBigFiveScore(bigFive, 'C', 'conscientiousness') / 5) * 100) },
                { label: 'Extraversion', value: getBigFiveScore(bigFive, 'E', 'extraversion'), max: 5, percentage: clampPercentage((getBigFiveScore(bigFive, 'E', 'extraversion') / 5) * 100) },
                { label: 'Agreeableness', value: getBigFiveScore(bigFive, 'A', 'agreeableness'), max: 5, percentage: clampPercentage((getBigFiveScore(bigFive, 'A', 'agreeableness') / 5) * 100) },
                { label: 'Neuroticism', value: getBigFiveScore(bigFive, 'N', 'neuroticism'), max: 5, percentage: clampPercentage((getBigFiveScore(bigFive, 'N', 'neuroticism') / 5) * 100) }
            ] : [],
            avgPercentage: bigFive ? clampPercentage(
                (
                    getBigFiveScore(bigFive, 'O', 'openness') +
                    getBigFiveScore(bigFive, 'C', 'conscientiousness') +
                    getBigFiveScore(bigFive, 'E', 'extraversion') +
                    getBigFiveScore(bigFive, 'A', 'agreeableness') +
                    getBigFiveScore(bigFive, 'N', 'neuroticism')
                ) / 5 / 5 * 100
            ) : 0
        },
        {
            id: 3,
            name: 'Work Values',
            data: workValues,
            scores: normalizeWorkValues(workValues),
            avgPercentage: normalizeWorkValues(workValues).length ? clampPercentage(
                normalizeWorkValues(workValues).reduce((sum, val) => sum + val.percentage, 0) / normalizeWorkValues(workValues).length
            ) : 0
        },
        {
            id: 4,
            name: 'Employability Skills',
            data: employability,
            scores: normalizeEmployabilityScores(employability),
            avgPercentage: getEmployabilityAverage(employability)
        },
        {
            id: 5,
            name: 'Adaptive Aptitude Test',
            data: adaptiveAptitudeScores.length > 0 ? adaptiveAptitudeScores : null,
            scores: adaptiveAptitudeScores,
            avgPercentage: clampPercentage(adaptiveAptitudeAverage)
        },
        {
            id: 6,
            name: 'Stream Based Aptitude',
            data: streamAptitudeScores.length > 0 ? streamAptitudeScores : null,
            scores: streamAptitudeScores,
            avgPercentage: clampPercentage(streamAptitudeScore),
            allowHeaderOnly: true
        },
        {
            id: 7,
            name: 'Stream Knowledge',
            data: knowledge,
            scores: normalizeKnowledgeScore(knowledge) ? [normalizeKnowledgeScore(knowledge)] : [],
            avgPercentage: normalizeKnowledgeScore(knowledge)?.percentage || 0
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
                    // Always include Adaptive Aptitude if it has data
                    if (s.id === 5 && s.data && s.scores.length > 0) return true;
                    // Don't include other stages for middle/high school
                    return false;
                });
            
            case 'after10':
                // Grades 11-12: RIASEC, Big Five, Work Values, Employability, Adaptive Aptitude, Stream Aptitude
                // Note: Knowledge section is NOT included for after10 (stream-agnostic assessment)
                return allStages.filter(s => [1, 2, 3, 4, 5, 6].includes(s.id) && s.data && s.scores.length > 0);
            
            case 'after12':
            case 'college':
                // After 12 & College: All stages including Employability and Knowledge
                return allStages.filter(s => s.data && s.scores.length > 0);
            
            default:
                // Show all available stages that have data
                return allStages.filter(s => s.data && s.scores.length > 0);
        }
    };

    const stages = getStagesForGradeLevel();
    
    // 🔧 CRITICAL FIX: Total expected stages should show ALL possible stages for the grade level
    // This shows learners what they SHOULD complete, not just what they DID complete
    // For after10: 6 stages (RIASEC, BigFive, WorkValues, Employability, Adaptive Aptitude, Stream Aptitude)
    const getTotalExpectedStages = () => {
        switch (gradeLevel) {
            case 'middle':
            case 'highschool':
                return 2; // RIASEC + Adaptive Aptitude
            case 'after10':
                // After 10th has 6 possible stages:
                // 1. RIASEC (Career Interests)
                // 2. Big Five Personality
                // 3. Work Values
                // 4. Employability Skills
                // 5. Adaptive Aptitude
                // 6. Stream Aptitude
                // Note: Knowledge is NOT included for after10
                return 6;
            case 'after12':
            case 'college':
                // RIASEC, Big Five, Work Values, Employability, Adaptive Aptitude, Stream Aptitude, Knowledge
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
                if (!stage.data || (stage.scores.length === 0 && !stage.allowHeaderOnly)) return null;

                const hasUsableRows = stage.scores.length > 0 && stage.scores.some((score) => (
                    Number.isFinite(score.value) &&
                    Number.isFinite(score.max) &&
                    score.max > 0 &&
                    Number.isFinite(score.percentage) &&
                    score.percentage > 0
                ));

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
                        {hasUsableRows && (
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
                        )}

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
