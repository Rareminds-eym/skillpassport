import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabaseClient';
import { analyzeAssessmentWithGemini } from '../../../../services/geminiAssessmentService';
import { riasecQuestions } from '../../assessment-data/riasecQuestions';
import { bigFiveQuestions } from '../../assessment-data/bigFiveQuestions';
import { workValuesQuestions } from '../../assessment-data/workValuesQuestions';
import { employabilityQuestions } from '../../assessment-data/employabilityQuestions';
import { streamKnowledgeQuestions } from '../../assessment-data/streamKnowledgeQuestions';

/**
 * Custom hook for managing assessment results
 */
export const useAssessmentResults = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retrying, setRetrying] = useState(false);
    const [studentInfo, setStudentInfo] = useState({
        name: '—',
        regNo: '—',
        college: '—',
        stream: '—'
    });

    // Convert string to Title Case
    const toTitleCase = (str) => {
        if (!str || str === '—') return str;
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Fetch student profile data from Supabase
    const fetchStudentInfo = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('first_name, last_name, full_name, register_number, college_id, colleges(name)')
                    .eq('user_id', user.id)
                    .single();

                if (studentData) {
                    const rawName = studentData.full_name ||
                        `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() ||
                        user.user_metadata?.full_name ||
                        user.email?.split('@')[0] || '—';

                    const fullName = toTitleCase(rawName);

                    setStudentInfo({
                        name: fullName,
                        regNo: studentData.register_number || '—',
                        college: studentData.colleges?.name || '—',
                        stream: (localStorage.getItem('assessment_stream') || '—').toUpperCase()
                    });

                    localStorage.setItem('studentName', fullName);
                    localStorage.setItem('studentRegNo', studentData.register_number || '');
                    localStorage.setItem('collegeName', studentData.colleges?.name || '');
                } else {
                    const rawName = user.user_metadata?.full_name || user.email?.split('@')[0] || '—';
                    const name = toTitleCase(rawName);
                    setStudentInfo(prev => ({
                        ...prev,
                        name: name,
                        stream: (localStorage.getItem('assessment_stream') || '—').toUpperCase()
                    }));
                    localStorage.setItem('studentName', name);
                }
            }
        } catch (err) {
            console.error('Error fetching student info:', err);
            const storedName = localStorage.getItem('studentName') || '—';
            setStudentInfo({
                name: toTitleCase(storedName),
                regNo: localStorage.getItem('studentRegNo') || '—',
                college: localStorage.getItem('collegeName') || '—',
                stream: (localStorage.getItem('assessment_stream') || '—').toUpperCase()
            });
        }
    };

    const loadResults = async () => {
        setLoading(true);
        setError(null);

        fetchStudentInfo();

        const answersJson = localStorage.getItem('assessment_answers');
        const geminiResultsJson = localStorage.getItem('assessment_gemini_results');
        const stream = localStorage.getItem('assessment_stream');

        if (!answersJson) {
            navigate('/student/assessment/test');
            return;
        }

        if (geminiResultsJson) {
            try {
                const geminiResults = JSON.parse(geminiResultsJson);
                console.log('=== useAssessmentResults Debug (from cache) ===');
                console.log('Cached results aptitude:', geminiResults.aptitude);
                console.log('Cached results aptitude.scores:', geminiResults.aptitude?.scores);
                if (geminiResults.careerFit) {
                    setResults(geminiResults);
                    setLoading(false);
                    return;
                }
                console.log('Old result format detected, re-analyzing...');
            } catch (e) {
                console.error('Error parsing Gemini results:', e);
            }
        }

        if (stream) {
            try {
                const answers = JSON.parse(answersJson);
                const questionBanks = {
                    riasecQuestions,
                    bigFiveQuestions,
                    workValuesQuestions,
                    employabilityQuestions,
                    streamKnowledgeQuestions
                };

                const geminiResults = await analyzeAssessmentWithGemini(answers, stream, questionBanks);

                if (geminiResults) {
                    localStorage.setItem('assessment_gemini_results', JSON.stringify(geminiResults));
                    setResults(geminiResults);
                    setLoading(false);
                    return;
                } else {
                    throw new Error('AI analysis returned no results');
                }
            } catch (e) {
                console.error('Gemini analysis failed:', e);
                setError(e.message || 'Failed to analyze assessment with AI. Please try again.');
                setLoading(false);
                return;
            }
        }

        setError('No AI analysis results found. Please retake the assessment.');
        setLoading(false);
    };

    const handleRetry = async () => {
        setRetrying(true);
        localStorage.removeItem('assessment_gemini_results');
        await loadResults();
        setRetrying(false);
    };

    useEffect(() => {
        loadResults();
    }, [navigate]);

    // Validate results
    const validateResults = () => {
        if (!results) return [];
        
        const missingFields = [];
        const { riasec, bigFive, workValues, employability, knowledge, careerFit, skillGap, roadmap, finalNote } = results;

        if (!riasec || !riasec.topThree || riasec.topThree.length === 0) missingFields.push('RIASEC Interests');
        if (!bigFive || typeof bigFive.O === 'undefined') missingFields.push('Big Five Personality');
        if (!workValues || !workValues.topThree || workValues.topThree.length === 0) missingFields.push('Work Values');
        if (!employability || !employability.strengthAreas) missingFields.push('Employability Skills');
        if (!knowledge || typeof knowledge.score === 'undefined') missingFields.push('Knowledge Assessment');
        if (!careerFit || !careerFit.clusters || careerFit.clusters.length === 0) missingFields.push('Career Fit');
        if (!skillGap || !skillGap.priorityA) missingFields.push('Skill Gap Analysis');
        if (!roadmap || !roadmap.projects) missingFields.push('Action Roadmap');
        if (!finalNote) missingFields.push('Final Recommendations');

        return missingFields;
    };

    return {
        results,
        loading,
        error,
        retrying,
        studentInfo,
        handleRetry,
        validateResults,
        navigate
    };
};
