import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabaseClient';
import { analyzeAssessmentWithGemini } from '../../../../services/geminiAssessmentService';
import { riasecQuestions } from '../../assessment-data/riasecQuestions';
import { bigFiveQuestions } from '../../assessment-data/bigFiveQuestions';
import { workValuesQuestions } from '../../assessment-data/workValuesQuestions';
import { employabilityQuestions } from '../../assessment-data/employabilityQuestions';
import { streamKnowledgeQuestions } from '../../assessment-data/streamKnowledgeQuestions';
import * as assessmentService from '../../../../services/assessmentService';
import { saveRecommendations } from '../../../../services/courseRecommendationService';

/**
 * Custom hook for managing assessment results
 * Now supports both localStorage (legacy) and database storage
 */
export const useAssessmentResults = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retrying, setRetrying] = useState(false);
    const [gradeLevel, setGradeLevel] = useState('after12'); // Default to after12
    const [studentInfo, setStudentInfo] = useState({
        name: '—',
        regNo: '—',
        college: '—',
        school: '—',
        stream: '—',
        grade: '—',
        branchField: '—',
        courseName: '—'
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
                    .select('name, registration_number, admission_number, college_id, colleges(name), grade, branch_field, course_name, school_class_id, school_classes(grade, section), school_id, schools(name)')
                    .eq('user_id', user.id)
                    .single();

                if (studentData) {
                    const rawName = studentData.name ||
                        user.user_metadata?.full_name ||
                        user.email?.split('@')[0] || '—';

                    const fullName = toTitleCase(rawName);

                    // Get grade from school_classes if available, otherwise from students table
                    const studentGrade = studentData.school_classes?.grade || studentData.grade || '—';
                    
                    // Get institution name - school for school students, college for college students
                    const institutionName = studentData.schools?.name || studentData.colleges?.name || '—';

                    // Determine grade level based on student data
                    let derivedGradeLevel = 'after12'; // default
                    if (studentData.school_id || studentData.school_class_id) {
                        // School student - determine if middle or high school based on grade
                        const gradeNum = parseInt(studentGrade);
                        if (!isNaN(gradeNum)) {
                            if (gradeNum >= 6 && gradeNum <= 8) {
                                derivedGradeLevel = 'middle';
                            } else if (gradeNum >= 9 && gradeNum <= 12) {
                                derivedGradeLevel = 'high';
                            }
                        } else {
                            // If grade is not a number, default to high school for school students
                            derivedGradeLevel = 'high';
                        }
                    } else if (studentData.college_id) {
                        // College student
                        derivedGradeLevel = 'college';
                    }
                    
                    // Update gradeLevel state - this will be the source of truth for display
                    // The assessment attempt's grade_level is for the assessment context,
                    // but for display purposes we use the student's actual grade level
                    setGradeLevel(derivedGradeLevel);
                    console.log('Derived gradeLevel from student data:', derivedGradeLevel, 'grade:', studentGrade, 'school_id:', studentData.school_id, 'college_id:', studentData.college_id);

                    setStudentInfo({
                        name: fullName,
                        regNo: studentData.admission_number || studentData.registration_number || '—',
                        college: institutionName,
                        school: studentData.schools?.name || '—',
                        stream: (localStorage.getItem('assessment_stream') || '—').toUpperCase(),
                        grade: studentGrade,
                        branchField: studentData.branch_field || '—',
                        courseName: studentData.course_name || '—'
                    });

                    localStorage.setItem('studentName', fullName);
                    localStorage.setItem('studentRegNo', studentData.registration_number || '');
                    localStorage.setItem('collegeName', institutionName);
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
                school: '—',
                stream: (localStorage.getItem('assessment_stream') || '—').toUpperCase(),
                grade: '—',
                branchField: '—',
                courseName: '—'
            });
        }
    };

    const loadResults = async () => {
        setLoading(true);
        setError(null);

        fetchStudentInfo();

        // Check if we have an attemptId in URL params (database mode)
        const attemptId = searchParams.get('attemptId');
        
        if (attemptId) {
            // Load results from database
            try {
                const attempt = await assessmentService.getAttemptWithResults(attemptId);
                if (attempt?.results?.[0]?.gemini_results) {
                    const geminiResults = attempt.results[0].gemini_results;
                    setResults(geminiResults);

                    // Set grade level from attempt
                    if (attempt.grade_level) {
                        setGradeLevel(attempt.grade_level);
                    }

                    // Ensure recommendations are saved (in case they weren't before)
                    if (geminiResults.platformCourses && geminiResults.platformCourses.length > 0) {
                        try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                                await saveRecommendations(
                                    user.id,
                                    geminiResults.platformCourses,
                                    attempt.results[0].id,
                                    'assessment'
                                );
                            }
                        } catch (recError) {
                            // Silently fail - recommendations may already exist
                            console.log('Recommendations sync:', recError.message);
                        }
                    }

                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error('Error loading results from database:', e);
            }
        }

        // Try to load latest result from database for current user
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const latestResult = await assessmentService.getLatestResult(user.id);
                if (latestResult?.gemini_results) {
                    console.log('Loaded results from database');
                    const geminiResults = latestResult.gemini_results;
                    setResults(geminiResults);

                    // Set grade level from result
                    if (latestResult.grade_level) {
                        setGradeLevel(latestResult.grade_level);
                    }

                    // Ensure recommendations are saved
                    if (geminiResults.platformCourses && geminiResults.platformCourses.length > 0) {
                        try {
                            await saveRecommendations(
                                user.id,
                                geminiResults.platformCourses,
                                latestResult.id,
                                'assessment'
                            );
                        } catch (recError) {
                            console.log('Recommendations sync:', recError.message);
                        }
                    }

                    setLoading(false);
                    return;
                }
            }
        } catch (e) {
            console.log('No database results found, checking localStorage');
        }

        // Fallback to localStorage (legacy mode)
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
                    
                    // Also try to save to database if user is logged in
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                            // Check if there's an in-progress attempt to complete
                            const inProgressAttempt = await assessmentService.getInProgressAttempt(user.id);
                            if (inProgressAttempt) {
                                const sectionTimings = JSON.parse(localStorage.getItem('assessment_section_timings') || '{}');
                                const completedAttempt = await assessmentService.completeAttempt(
                                    inProgressAttempt.id,
                                    user.id,
                                    stream,
                                    inProgressAttempt.grade_level || 'after12', // Use grade_level from attempt or default to after12
                                    geminiResults,
                                    sectionTimings
                                );
                                console.log('Results saved to database');
                                
                                // Save course recommendations to database
                                if (geminiResults.platformCourses && geminiResults.platformCourses.length > 0) {
                                    try {
                                        // Get the assessment result ID
                                        const { data: resultData } = await supabase
                                            .from('personal_assessment_results')
                                            .select('id')
                                            .eq('attempt_id', inProgressAttempt.id)
                                            .single();
                                        
                                        await saveRecommendations(
                                            user.id,
                                            geminiResults.platformCourses,
                                            resultData?.id || null,
                                            'assessment'
                                        );
                                        console.log('Course recommendations saved to database');
                                    } catch (recError) {
                                        console.warn('Could not save recommendations:', recError.message);
                                    }
                                }
                            }
                        }
                    } catch (dbError) {
                        console.log('Could not save to database:', dbError.message);
                    }
                    
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
        setError(null);
        
        try {
            // Clear cached results
            localStorage.removeItem('assessment_gemini_results');
            
            // Get answers and stream from localStorage
            const answersJson = localStorage.getItem('assessment_answers');
            const stream = localStorage.getItem('assessment_stream');
            
            if (!answersJson || !stream) {
                setError('No assessment data found. Please retake the assessment.');
                setRetrying(false);
                return;
            }
            
            const answers = JSON.parse(answersJson);
            const questionBanks = {
                riasecQuestions,
                bigFiveQuestions,
                workValuesQuestions,
                employabilityQuestions,
                streamKnowledgeQuestions
            };
            
            console.log('Regenerating AI analysis...');
            console.log('Stream:', stream);
            console.log('Answer keys:', Object.keys(answers));
            console.log('Total answers:', Object.keys(answers).length);
            console.log('Sample answers:', JSON.stringify(answers).substring(0, 500));
            
            // Force regenerate with AI
            const geminiResults = await analyzeAssessmentWithGemini(answers, stream, questionBanks);
            
            if (!geminiResults) {
                throw new Error('AI analysis returned no results');
            }
            
            // Save to localStorage
            localStorage.setItem('assessment_gemini_results', JSON.stringify(geminiResults));
            
            // Update database if user is logged in
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Get the latest result and update it
                    const latestResult = await assessmentService.getLatestResult(user.id);
                    if (latestResult) {
                        // Update the existing result with new AI analysis
                        const { error: updateError } = await supabase
                            .from('personal_assessment_results')
                            .update({ 
                                gemini_results: geminiResults,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', latestResult.id);
                        
                        if (updateError) {
                            console.warn('Could not update database result:', updateError.message);
                        } else {
                            console.log('Database result updated with regenerated AI analysis');
                        }
                        
                        // Save course recommendations
                        if (geminiResults.platformCourses && geminiResults.platformCourses.length > 0) {
                            try {
                                await saveRecommendations(
                                    user.id,
                                    geminiResults.platformCourses,
                                    latestResult.id,
                                    'assessment'
                                );
                            } catch (recError) {
                                console.log('Recommendations sync:', recError.message);
                            }
                        }
                    }
                }
            } catch (dbError) {
                console.log('Could not update database:', dbError.message);
            }
            
            // Update state with new results
            setResults(geminiResults);
            console.log('AI analysis regenerated successfully');
            
        } catch (e) {
            console.error('Regeneration failed:', e);
            setError(e.message || 'Failed to regenerate report. Please try again.');
        } finally {
            setRetrying(false);
        }
    };

    useEffect(() => {
        loadResults();
    }, [navigate]);

    // Validate results - only check critical fields that affect display
    // Different validation based on grade level
    const validateResults = () => {
        if (!results) return [];

        const missingFields = [];
        const { riasec, bigFive, workValues, employability, knowledge, careerFit, skillGap, roadmap, aptitude } = results;

        // For middle school and high school, only check basic fields
        if (gradeLevel === 'middle' || gradeLevel === 'highschool') {
            // Basic interest exploration (mapped to RIASEC codes)
            if (!riasec || !riasec.topThree || riasec.topThree.length === 0) missingFields.push('Interest Explorer');
            // For high school, check aptitude sampling
            if (gradeLevel === 'highschool' && (!aptitude || !aptitude.scores)) missingFields.push('Aptitude Sampling');
            return missingFields;
        }

        // For after12, check all comprehensive assessment fields (keep as-is)
        if (!riasec || !riasec.topThree || riasec.topThree.length === 0) missingFields.push('RIASEC Interests');
        if (!bigFive || typeof bigFive.O === 'undefined') missingFields.push('Big Five Personality');
        if (!workValues || !workValues.topThree || workValues.topThree.length === 0) missingFields.push('Work Values');
        if (!employability || !employability.strengthAreas) missingFields.push('Employability Skills');
        if (!knowledge || typeof knowledge.score === 'undefined') missingFields.push('Knowledge Assessment');
        if (!careerFit || !careerFit.clusters || careerFit.clusters.length === 0) missingFields.push('Career Fit');
        if (!skillGap || !skillGap.priorityA || skillGap.priorityA.length === 0) missingFields.push('Skill Gap Analysis');
        if (!roadmap || !roadmap.projects || roadmap.projects.length === 0) missingFields.push('Action Roadmap');

        // Note: finalNote, profileSnapshot, and overallSummary are optional for display
        // They enhance the report but aren't critical for core functionality

        return missingFields;
    };

    return {
        results,
        loading,
        error,
        retrying,
        gradeLevel, // Export grade level
        studentInfo,
        handleRetry,
        validateResults,
        navigate
    };
};
