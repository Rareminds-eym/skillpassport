import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabaseClient';
import * as assessmentService from '../../../../services/assessmentService';
import { saveRecommendations } from '../../../../services/courseRecommendationService';
import { analyzeAssessmentWithGemini } from '../../../../services/geminiAssessmentService';
import {
    riasecQuestions,
    bigFiveQuestions,
    workValuesQuestions,
    employabilityQuestions,
    streamKnowledgeQuestions,
} from '../../index';

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
    const [gradeLevelFromAttempt, setGradeLevelFromAttempt] = useState(false); // Track if grade level was set from attempt
    // Use ref to track grade level from attempt synchronously (avoids race condition with async state updates)
    const gradeLevelFromAttemptRef = useRef(false);
    const [studentInfo, setStudentInfo] = useState({
        name: '—',
        regNo: '—',
        rollNumberType: 'school',
        college: '—',
        school: '—',
        stream: '—',
        grade: '—',
        branchField: '—',
        courseName: '—'
    });
    const [studentAcademicData, setStudentAcademicData] = useState({
        subjectMarks: [],
        projects: [],
        experiences: [],
        education: []
    });
    const [monthsInGrade, setMonthsInGrade] = useState(null);

    // Calculate months between a start date and now
    const calculateMonthsInGrade = (startDate) => {
        if (!startDate) return null;
        const start = new Date(startDate);
        const now = new Date();
        const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
        return Math.max(0, months);
    };

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
                // First, try to fetch student data with relationships
                let { data: studentData, error: fetchError } = await supabase
                    .from('students')
                    .select(`
                        id, 
                        name, 
                        registration_number,
                        school_roll_no,
                        institute_roll_no,
                        university_roll_no,
                        grade,
                        year,
                        semester,
                        college_id, 
                        school_id,
                        school_class_id,
                        branch_field,
                        course_name,
                        grade_start_date,
                        colleges(name),
                        schools(name),
                        school_classes(grade, academic_year)
                    `)
                    .eq('user_id', user.id)
                    .maybeSingle();

                // If the query with relationships fails, try without relationships
                if (fetchError) {
                    console.warn('Query with relationships failed, trying without:', fetchError.message);
                    const simpleQuery = await supabase
                        .from('students')
                        .select('*')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    
                    studentData = simpleQuery.data;
                    fetchError = simpleQuery.error;
                    
                    // If we got data, fetch related college/school names separately from organizations table
                    if (studentData) {
                        if (studentData.college_id) {
                            const { data: orgData } = await supabase
                                .from('organizations')
                                .select('name')
                                .eq('id', studentData.college_id)
                                .maybeSingle();
                            if (orgData) {
                                studentData.colleges = { name: orgData.name };
                            }
                        }
                        if (studentData.school_id) {
                            const { data: orgData } = await supabase
                                .from('organizations')
                                .select('name')
                                .eq('id', studentData.school_id)
                                .maybeSingle();
                            if (orgData) {
                                studentData.schools = { name: orgData.name };
                            }
                        }
                        if (studentData.school_class_id) {
                            const { data: classData } = await supabase
                                .from('school_classes')
                                .select('grade')
                                .eq('id', studentData.school_class_id)
                                .maybeSingle();
                            if (classData) {
                                studentData.school_classes = { grade: classData.grade };
                            }
                        }
                    }
                }

                if (fetchError) {
                    console.error('Error fetching student data:', fetchError);
                    console.error('Error details:', fetchError.message, fetchError.details, fetchError.hint);
                }

                console.log('Fetched student data:', studentData);
                console.log('Student data keys:', studentData ? Object.keys(studentData) : 'null');

                if (studentData) {
                    const rawName = studentData.name ||
                        user.user_metadata?.full_name ||
                        user.email?.split('@')[0] || '—';

                    const fullName = toTitleCase(rawName);

                    // Get grade - prioritize students.grade, then school_classes.grade as fallback
                    let studentGrade = studentData.grade || studentData.school_classes?.grade;
                    
                    // If no grade and student is in college, try year or semester
                    if (!studentGrade && studentData.college_id) {
                        if (studentData.year) {
                            studentGrade = `Year ${studentData.year}`;
                        } else if (studentData.semester) {
                            studentGrade = `Semester ${studentData.semester}`;
                        } else {
                            studentGrade = '—';
                        }
                    } else if (!studentGrade) {
                        studentGrade = '—';
                    }
                    
                    console.log('Student grade:', studentGrade, 'from students.grade:', studentData.grade, 'from school_classes:', studentData.school_classes?.grade, 'year:', studentData.year, 'semester:', studentData.semester);
                    
                    // Get institution name - school for school students, college for college students
                    const institutionName = studentData.schools?.name || studentData.colleges?.name || '—';
                    const schoolName = studentData.schools?.name || '—';
                    
                    console.log('Institution names - school:', studentData.schools?.name, 'college:', studentData.colleges?.name, 'final institution:', institutionName, 'final school:', schoolName);
                    console.log('Roll numbers - school_roll_no:', studentData.school_roll_no, 'institute_roll_no:', studentData.institute_roll_no, 'university_roll_no:', studentData.university_roll_no);
                    console.log('IDs - school_id:', studentData.school_id, 'college_id:', studentData.college_id, 'school_class_id:', studentData.school_class_id);

                    // Determine which roll number to use and roll number type
                    let rollNumber = '—';
                    let rollNumberType = 'school'; // default
                    const gradeNum = parseInt(studentGrade);
                    
                    // Priority 1: Check if student has college_id (college student)
                    if (studentData.college_id) {
                        rollNumber = studentData.university_roll_no || '—';
                        rollNumberType = 'university';
                    } 
                    // Priority 2: Check grade number for 11th/12th
                    else if (!isNaN(gradeNum) && gradeNum >= 11 && gradeNum <= 12) {
                        rollNumber = studentData.institute_roll_no || '—';
                        rollNumberType = 'institute';
                    }
                    // Priority 3: Check if grade is "12th" or "after12" (string format)
                    else if (studentGrade && (studentGrade.toString().toLowerCase().includes('12') || studentGrade.toString().toLowerCase().includes('after'))) {
                        rollNumber = studentData.institute_roll_no || studentData.university_roll_no || '—';
                        rollNumberType = studentData.university_roll_no ? 'university' : 'institute';
                    }
                    // Priority 4: If no grade but has university_roll_no, assume university student
                    else if (studentData.university_roll_no && studentData.university_roll_no !== '—') {
                        rollNumber = studentData.university_roll_no;
                        rollNumberType = 'university';
                    }
                    // Priority 5: If no grade but has institute_roll_no, assume 11th/12th student
                    else if (studentData.institute_roll_no && studentData.institute_roll_no !== '—') {
                        rollNumber = studentData.institute_roll_no;
                        rollNumberType = 'institute';
                    }
                    // Default: School students
                    else {
                        rollNumber = studentData.school_roll_no || '—';
                        rollNumberType = 'school';
                    }

                    // Determine grade level based on student data
                    // NOTE: This is only used as a fallback. The assessment attempt's grade_level
                    // takes priority and is set in loadResults() after this runs.
                    let derivedGradeLevel = 'after12'; // default
                    if (studentData.school_id || studentData.school_class_id) {
                        // School student - determine if middle or high school based on grade
                        if (!isNaN(gradeNum)) {
                            if (gradeNum >= 6 && gradeNum <= 8) {
                                derivedGradeLevel = 'middle';
                            } else if (gradeNum >= 9 && gradeNum <= 10) {
                                derivedGradeLevel = 'highschool';
                            } else if (gradeNum >= 11 && gradeNum <= 12) {
                                // 11th and 12th grade students should see after12 assessment results
                                derivedGradeLevel = 'after12';
                            }
                        } else {
                            // If grade is not a number, default to after12 for school students
                            derivedGradeLevel = 'after12';
                        }
                    } else if (studentData.college_id) {
                        // College student
                        derivedGradeLevel = 'after12';
                    }
                    
                    // Update gradeLevel state - this is a fallback value
                    // Only set if grade level wasn't already set from the assessment attempt
                    // Use ref for synchronous check to avoid race condition with async state updates
                    if (!gradeLevelFromAttemptRef.current) {
                        setGradeLevel(derivedGradeLevel);
                    }
                    console.log('Derived gradeLevel from student data:', derivedGradeLevel, 'grade:', studentGrade, 'school_id:', studentData.school_id, 'college_id:', studentData.college_id);

                    setStudentInfo({
                        name: fullName,
                        regNo: rollNumber,
                        rollNumberType: rollNumberType,
                        college: institutionName,
                        school: schoolName,
                        stream: (localStorage.getItem('assessment_stream') || '—').toUpperCase(),
                        grade: studentGrade,
                        branchField: studentData.branch_field || '—',
                        courseName: studentData.course_name || '—'
                    });

                    // Calculate months in grade from grade_start_date
                    if (studentData.grade_start_date) {
                        const months = calculateMonthsInGrade(studentData.grade_start_date);
                        setMonthsInGrade(months);
                        console.log('Months in grade:', months, 'from grade_start_date:', studentData.grade_start_date);
                    } else if (studentData.school_classes?.academic_year) {
                        // Fallback: estimate from academic year (e.g., "2024-2025")
                        const yearMatch = studentData.school_classes.academic_year.match(/^(\d{4})/);
                        if (yearMatch) {
                            const startYear = parseInt(yearMatch[1]);
                            const estimatedStartDate = `${startYear}-06-01`; // Assume June start
                            const months = calculateMonthsInGrade(estimatedStartDate);
                            setMonthsInGrade(months);
                            console.log('Months in grade (estimated):', months, 'from academic_year:', studentData.school_classes.academic_year);
                        }
                    }

                    localStorage.setItem('studentName', fullName);
                    localStorage.setItem('studentRegNo', rollNumber);
                    localStorage.setItem('collegeName', studentData.colleges?.name || '');
                    
                    // Fetch academic data (marks, projects, experiences)
                    await fetchStudentAcademicData(studentData.id);
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
                rollNumberType: 'school',
                college: localStorage.getItem('collegeName') || '—',
                school: '—',
                stream: (localStorage.getItem('assessment_stream') || '—').toUpperCase(),
                grade: '—',
                branchField: '—',
                courseName: '—'
            });
        }
    };

    // Fetch student's academic data: marks, projects, experiences
    const fetchStudentAcademicData = async (studentId) => {
        try {
            // Fetch subject marks with subject names
            const { data: marksData } = await supabase
                .from('mark_entries')
                .select(`
                    id,
                    subject_id,
                    marks_obtained,
                    total_marks,
                    percentage,
                    grade,
                    curriculum_subjects(name)
                `)
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            // Fetch projects
            const { data: projectsData } = await supabase
                .from('projects')
                .select('id, title, description, tech_stack, status, organization')
                .eq('student_id', studentId)
                .eq('enabled', true)
                .order('created_at', { ascending: false });

            // Fetch experiences
            const { data: experiencesData } = await supabase
                .from('experience')
                .select('id, organization, role, duration, verified')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            // Fetch education
            const { data: educationData } = await supabase
                .from('education')
                .select('id, degree, department, university, cgpa, level, status')
                .eq('student_id', studentId)
                .eq('enabled', true)
                .order('year_of_passing', { ascending: false });

            setStudentAcademicData({
                subjectMarks: marksData || [],
                projects: projectsData || [],
                experiences: experiencesData || [],
                education: educationData || []
            });

            console.log('Fetched academic data:', {
                marks: marksData?.length || 0,
                projects: projectsData?.length || 0,
                experiences: experiencesData?.length || 0,
                education: educationData?.length || 0
            });
        } catch (err) {
            console.error('Error fetching academic data:', err);
        }
    };

    const loadResults = async () => {
        setLoading(true);
        setError(null);
        // Reset the ref at the start of loading to ensure clean state
        gradeLevelFromAttemptRef.current = false;

        // Don't await fetchStudentInfo - it runs in parallel but won't override attempt grade_level
        fetchStudentInfo();

        // Check if we have an attemptId in URL params (database mode)
        const attemptId = searchParams.get('attemptId');
        
        if (attemptId) {
            // Load results from database - ALWAYS prefer database over localStorage
            try {
                const attempt = await assessmentService.getAttemptWithResults(attemptId);
                if (attempt?.results?.[0]?.gemini_results) {
                    const geminiResults = attempt.results[0].gemini_results;
                    setResults(geminiResults);

                    // Set grade level from attempt
                    if (attempt.grade_level) {
                        setGradeLevel(attempt.grade_level);
                        setGradeLevelFromAttempt(true);
                        gradeLevelFromAttemptRef.current = true; // Set ref synchronously to prevent race condition
                    }

                    // Clear localStorage to prevent stale data issues
                    localStorage.removeItem('assessment_gemini_results');
                    localStorage.setItem('assessment_gemini_results', JSON.stringify(geminiResults));

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
                        setGradeLevelFromAttempt(true);
                        gradeLevelFromAttemptRef.current = true; // Set ref synchronously to prevent race condition
                    }

                    // Sync localStorage with database results to prevent stale data
                    localStorage.removeItem('assessment_gemini_results');
                    localStorage.setItem('assessment_gemini_results', JSON.stringify(geminiResults));

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
        const storedGradeLevel = localStorage.getItem('assessment_grade_level');

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
                console.log('Cached results streamRecommendation:', geminiResults.streamRecommendation);
                console.log('Cached results careerFit:', geminiResults.careerFit);
                console.log('Stored grade level:', storedGradeLevel);
                
                // Check if results are complete (have careerFit)
                // streamRecommendation is only required for after10 students who need stream guidance
                // For after12, middle, highschool, higher_secondary - careerFit is sufficient
                const hasCareerFit = geminiResults.careerFit && geminiResults.careerFit.clusters?.length > 0;
                
                // Only after10 students truly need streamRecommendation with a valid recommendedStream
                const needsStreamRecommendation = storedGradeLevel === 'after10';
                const hasValidStreamRecommendation = geminiResults.streamRecommendation?.recommendedStream && 
                    geminiResults.streamRecommendation.recommendedStream !== 'N/A';
                
                const isComplete = hasCareerFit && (!needsStreamRecommendation || hasValidStreamRecommendation);
                
                console.log('Completeness check:', { hasCareerFit, needsStreamRecommendation, hasValidStreamRecommendation, isComplete });
                
                if (isComplete) {
                    setResults(geminiResults);
                    // Set grade level from localStorage if available
                    if (storedGradeLevel) {
                        setGradeLevel(storedGradeLevel);
                        setGradeLevelFromAttempt(true);
                        gradeLevelFromAttemptRef.current = true; // Set ref synchronously to prevent race condition
                    }
                    setLoading(false);
                    return;
                }
                console.log('Results incomplete, re-analyzing...', { hasCareerFit, needsStreamRecommendation, hasValidStreamRecommendation });
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

                // Pass gradeLevel to get proper stream recommendations
                const effectiveGradeLevel = storedGradeLevel || 'after12';
                console.log('Re-analyzing with gradeLevel:', effectiveGradeLevel);
                const geminiResults = await analyzeAssessmentWithGemini(answers, stream, questionBanks, {}, effectiveGradeLevel);

                if (geminiResults) {
                    localStorage.setItem('assessment_gemini_results', JSON.stringify(geminiResults));
                    
                    // Set grade level
                    if (storedGradeLevel) {
                        setGradeLevel(storedGradeLevel);
                        setGradeLevelFromAttempt(true);
                        gradeLevelFromAttemptRef.current = true; // Set ref synchronously to prevent race condition
                    }
                    
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
                                            .maybeSingle();
                                        
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
            const storedGradeLevel = localStorage.getItem('assessment_grade_level') || gradeLevel || 'after12';
            
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
            console.log('Grade Level:', storedGradeLevel);
            console.log('Answer keys:', Object.keys(answers));
            console.log('Total answers:', Object.keys(answers).length);
            console.log('Sample answers:', JSON.stringify(answers).substring(0, 500));
            
            // Force regenerate with AI - pass gradeLevel
            const geminiResults = await analyzeAssessmentWithGemini(answers, stream, questionBanks, {}, storedGradeLevel);
            
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

    // Update roll number type when grade level changes to after12/after10
    useEffect(() => {
        if (gradeLevel === 'after12' || gradeLevel === 'after10') {
            setStudentInfo(prev => {
                // Only update if currently showing 'school' type
                if (prev.rollNumberType === 'school' && prev.regNo === '—') {
                    return {
                        ...prev,
                        rollNumberType: 'university' // Default to university for after12/after10
                    };
                }
                return prev;
            });
        }
    }, [gradeLevel]);

    // Validate results - only check critical fields that affect display
    // Different validation based on grade level
    const validateResults = () => {
        if (!results) return [];

        const missingFields = [];
        const { riasec, bigFive, workValues, employability, knowledge, careerFit, skillGap, roadmap, aptitude } = results;

        // For middle school, high school, and higher secondary, only check basic fields
        if (gradeLevel === 'middle' || gradeLevel === 'highschool' || gradeLevel === 'higher_secondary') {
            // Basic interest exploration (mapped to RIASEC codes)
            if (!riasec || !riasec.topThree || riasec.topThree.length === 0) missingFields.push('Interest Explorer');
            // For high school and higher secondary, check aptitude sampling
            if ((gradeLevel === 'highschool' || gradeLevel === 'higher_secondary') && (!aptitude || !aptitude.scores)) missingFields.push('Aptitude Sampling');
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
        monthsInGrade, // Export months in grade for conditional display
        studentInfo,
        studentAcademicData, // Export academic data for course matching
        handleRetry,
        validateResults,
        navigate
    };
};
