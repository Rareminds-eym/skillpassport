import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabaseClient';
import * as assessmentService from '../../../../services/assessmentService';
import { saveRecommendations } from '../../../../services/courseRecommendationService';
import { analyzeAssessmentWithGemini, addCourseRecommendations } from '../../../../services/geminiAssessmentService';
import { validateAssessmentResults } from '../utils/assessmentValidation';
import { validateAptitudeScores } from '../../../../services/aptitudeScoreValidator';
import { validateRiasecScores } from '../../../../services/riasecScoreValidator';
import { normalizeAssessmentResults } from '../../../../utils/assessmentDataNormalizer';
import { transformAssessmentResults } from '../../../../services/assessmentResultTransformer';
import { isCollegeStudent as checkIsCollegeStudent, isSchoolStudent as checkIsSchoolStudent } from '../../../../utils/studentType';
import {
    riasecQuestions,
    bigFiveQuestions,
    workValuesQuestions,
    employabilityQuestions,
    streamKnowledgeQuestions,
} from '../../index';

/**
 * Get the student record ID from auth user ID
 * Questions are saved with students.id, not auth.user.id
 */
const getStudentRecordId = async (authUserId) => {
    try {
        const { data: student, error } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', authUserId)
            .maybeSingle();

        if (error || !student) {
            console.log(`⚠️ No student record found for auth user: ${authUserId}`);
            return null;
        }

        console.log(`✅ Found student record: ${student.id} for auth user: ${authUserId}`);
        return student.id;
    } catch (err) {
        console.error('Error looking up student record:', err);
        return null;
    }
};

/**
 * Fetch AI-generated aptitude questions from database for scoring
 * @param {string} authUserId - Auth user ID (will be converted to student record ID)
 * @param {string[]} answerKeys - Answer keys to match question IDs
 * 
 * NOTE: Questions are saved with students.id (from students table), not auth.user.id
 * So we need to look up the student record first
 */
const fetchAIAptitudeQuestions = async (authUserId, answerKeys = []) => {
    try {
        const targetQuestionIds = answerKeys
            .filter(k => k.startsWith('aptitude_'))
            .map(k => k.replace('aptitude_', ''));

        // First, look up the student record ID from the auth user ID
        const studentRecordId = await getStudentRecordId(authUserId);

        // Try with student record ID first (this is how questions are saved)
        if (studentRecordId) {
            const { data: allQuestionSets, error } = await supabase
                .from('career_assessment_ai_questions')
                .select('id, questions, created_at')
                .eq('student_id', studentRecordId)
                .eq('question_type', 'aptitude')
                .order('created_at', { ascending: false });

            if (!error && allQuestionSets && allQuestionSets.length > 0) {
                // Find matching question set
                let matchingQuestionSet = null;
                if (targetQuestionIds.length > 0) {
                    for (const questionSet of allQuestionSets) {
                        const questionIds = questionSet.questions.map(q => q.id);
                        const matchCount = targetQuestionIds.filter(id => questionIds.includes(id)).length;
                        if (matchCount > 0) {
                            matchingQuestionSet = questionSet;
                            break;
                        }
                    }
                }
                if (!matchingQuestionSet) matchingQuestionSet = allQuestionSets[0];

                return matchingQuestionSet.questions.map(q => ({
                    ...q,
                    correct: q.correct_answer,
                    correctAnswer: q.correct_answer,
                    subtype: q.subtype || q.category || 'verbal'
                }));
            }
        }

        // Fallback: Try with auth user ID directly
        const { data: fallbackQuestionSets, error: fallbackError } = await supabase
            .from('career_assessment_ai_questions')
            .select('id, questions, created_at')
            .eq('student_id', authUserId)
            .eq('question_type', 'aptitude')
            .order('created_at', { ascending: false });

        if (!fallbackError && fallbackQuestionSets && fallbackQuestionSets.length > 0) {
            let matchingQuestionSet = null;
            if (targetQuestionIds.length > 0) {
                for (const questionSet of fallbackQuestionSets) {
                    const questionIds = questionSet.questions.map(q => q.id);
                    const matchCount = targetQuestionIds.filter(id => questionIds.includes(id)).length;
                    if (matchCount > 0) {
                        matchingQuestionSet = questionSet;
                        break;
                    }
                }
            }
            if (!matchingQuestionSet) matchingQuestionSet = fallbackQuestionSets[0];

            return matchingQuestionSet.questions.map(q => ({
                ...q,
                correct: q.correct_answer,
                correctAnswer: q.correct_answer,
                subtype: q.subtype || q.category || 'verbal'
            }));
        }

        console.log('No AI aptitude questions found in database');
        return [];
    } catch (err) {
        console.error('Error fetching AI aptitude questions:', err);
        return [];
    }
};

/**
 * Fetch AI-generated knowledge questions from database for scoring
 * 
 * NOTE: Questions are saved with students.id (from students table), not auth.user.id
 * So we need to look up the student record first
 */
const fetchAIKnowledgeQuestions = async (authUserId, answerKeys = []) => {
    try {
        const targetQuestionIds = answerKeys
            .filter(k => k.startsWith('knowledge_'))
            .map(k => k.replace('knowledge_', ''));

        // First, look up the student record ID from the auth user ID
        const studentRecordId = await getStudentRecordId(authUserId);

        // Try with student record ID first (this is how questions are saved)
        if (studentRecordId) {
            const { data: allQuestionSets, error } = await supabase
                .from('career_assessment_ai_questions')
                .select('id, questions, created_at')
                .eq('student_id', studentRecordId)
                .eq('question_type', 'knowledge')
                .order('created_at', { ascending: false });

            if (!error && allQuestionSets && allQuestionSets.length > 0) {
                let matchingQuestionSet = null;
                if (targetQuestionIds.length > 0) {
                    for (const questionSet of allQuestionSets) {
                        const questionIds = questionSet.questions.map(q => q.id);
                        const matchCount = targetQuestionIds.filter(id => questionIds.includes(id)).length;
                        if (matchCount > 0) {
                            matchingQuestionSet = questionSet;
                            break;
                        }
                    }
                }
                if (!matchingQuestionSet) matchingQuestionSet = allQuestionSets[0];

                return matchingQuestionSet.questions.map(q => ({
                    ...q,
                    correct: q.correct_answer,
                    correctAnswer: q.correct_answer
                }));
            }
        }

        // Fallback: Try with auth user ID directly
        const { data: fallbackQuestionSets, error: fallbackError } = await supabase
            .from('career_assessment_ai_questions')
            .select('id, questions, created_at')
            .eq('student_id', authUserId)
            .eq('question_type', 'knowledge')
            .order('created_at', { ascending: false });

        if (!fallbackError && fallbackQuestionSets && fallbackQuestionSets.length > 0) {
            let matchingQuestionSet = null;
            if (targetQuestionIds.length > 0) {
                for (const questionSet of fallbackQuestionSets) {
                    const questionIds = questionSet.questions.map(q => q.id);
                    const matchCount = targetQuestionIds.filter(id => questionIds.includes(id)).length;
                    if (matchCount > 0) {
                        matchingQuestionSet = questionSet;
                        break;
                    }
                }
            }
            if (!matchingQuestionSet) matchingQuestionSet = fallbackQuestionSets[0];

            return matchingQuestionSet.questions.map(q => ({
                ...q,
                correct: q.correct_answer,
                correctAnswer: q.correct_answer
            }));
        }

        console.log('No AI knowledge questions found in database');
        return [];
    } catch (err) {
        console.error('Error fetching AI knowledge questions:', err);
        return [];
    }
};

/**
 * Custom hook for managing assessment results
 * Database-only storage (localStorage removed for consistency)
 */
export const useAssessmentResults = () => {
    // 🔥 DEBUG: Verify new code is loaded
    console.log('🔥🔥🔥 useAssessmentResults hook loaded - NEW CODE WITH TRANSFORMER 🔥🔥🔥');

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [results, setResultsInternal] = useState(null); // ✅ Renamed to internal
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retrying, setRetrying] = useState(false);
    const [autoRetry, setAutoRetry] = useState(false); // Flag to trigger auto-retry
    const [retryCompleted, setRetryCompleted] = useState(false); // Flag to prevent re-triggering after successful retry
    const [autoRetryStartTime, setAutoRetryStartTime] = useState(null); // Track when auto-retry was triggered
    const [retryAttemptCount, setRetryAttemptCount] = useState(0); // Track number of retry attempts (max 3) - prevents infinite loops
    const [gradeLevel, setGradeLevel] = useState('after12'); // Default to after12
    const [gradeLevelFromAttempt, setGradeLevelFromAttempt] = useState(false); // Track if grade level was set from attempt
    // Use ref to track grade level from attempt synchronously (avoids race condition with async state updates)
    const gradeLevelFromAttemptRef = useRef(false);
    const loadedAttemptIdRef = useRef(null); // Track loaded attempt to prevent loop
    const streamFromAssessmentRef = useRef(null); // Track stream_id from assessment to prevent fetchStudentInfo from overwriting
    const autoRetryInProgressRef = useRef(false); // Prevent multiple concurrent auto-retry attempts
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
    const [validationWarnings, setValidationWarnings] = useState([]);

    // ✅ NEW: Wrapper for setResults that applies transformation
    const setResults = useCallback((resultsData) => {
        if (!resultsData) {
            setResultsInternal(null);
            return;
        }

        console.log('🔍 setResults called with data:', {
            hasData: !!resultsData,
            keys: Object.keys(resultsData || {}),
            _transformed: resultsData._transformed,
            hasGeminiResults: !!resultsData.gemini_results,
            hasGeminiAnalysis: !!resultsData.gemini_analysis,
            hasRiasec: !!resultsData.riasec,
            hasRiasecScores: !!resultsData.riasec_scores,
            // ✅ ADD MORE DEBUG INFO
            geminiResultsType: resultsData.gemini_results ? typeof resultsData.gemini_results : 'undefined',
            geminiResultsKeys: resultsData.gemini_results && typeof resultsData.gemini_results === 'object' ? Object.keys(resultsData.gemini_results) : null,
            riasecScoresValue: resultsData.riasec_scores,
            sampleData: resultsData.gemini_results?.riasec || resultsData.riasec || 'none'
        });

        // Check if data is already transformed
        if (resultsData._transformed) {
            console.log('✅ Results already transformed, using as-is');
            setResultsInternal(resultsData);
            return;
        }

        // Check if this looks like database format
        // Data can be in gemini_analysis/gemini_results field OR in individual columns
        const isDatabaseFormat = resultsData.gemini_analysis ||
            resultsData.gemini_results ||
            resultsData.aptitude_scores ||
            resultsData.riasec_scores ||
            resultsData.top_interests ||
            resultsData.career_recommendations;

        if (isDatabaseFormat) {
            console.log('🔄 Transforming database results to PDF format...');
            console.log('   Input data structure:', {
                hasGeminiAnalysis: !!resultsData.gemini_analysis,
                hasAptitudeScores: !!resultsData.aptitude_scores,
                hasRiasecScores: !!resultsData.riasec_scores,
                hasCareerRecommendations: !!resultsData.career_recommendations
            });
            try {
                const transformed = transformAssessmentResults(resultsData);
                console.log('✅ Transformation complete:', {
                    hasAptitude: !!transformed.aptitude,
                    hasCareerFit: !!transformed.careerFit,
                    hasSkillGap: !!transformed.skillGap,
                    hasLearningStyles: !!transformed.learningStyles,
                    riasecScores: transformed.riasec?.scores
                });
                setResultsInternal(transformed);
            } catch (error) {
                console.error('❌ Transformation failed, using original:', error);
                console.error('   Error details:', error.message, error.stack);
                setResultsInternal(resultsData);
            }
        } else {
            // Already in correct format (from Gemini API)
            console.log('✅ Results already in correct format (no transformation needed)');
            console.log('   Data structure:', {
                hasRiasec: !!resultsData.riasec,
                hasAptitude: !!resultsData.aptitude,
                hasCareerFit: !!resultsData.careerFit
            });
            setResultsInternal(resultsData);
        }
    }, []);

    // Helper function to apply validation to results
    const applyValidation = async (geminiResults, rawAnswers = {}, sectionTimings = {}) => {
        const { results: validatedResults, warnings } = validateAssessmentResults(
            geminiResults,
            rawAnswers,
            sectionTimings
        );

        if (warnings.length > 0) {
            console.log('⚠️ Assessment validation warnings:', warnings);
            setValidationWarnings(warnings);
        }

        // Validate and correct RIASEC scores if we have the necessary data
        if (validatedResults.riasec && rawAnswers && Object.keys(rawAnswers).length > 0) {
            try {
                console.log('🔍 Validating RIASEC scores...');
                const correctedRiasec = validateRiasecScores(
                    validatedResults.riasec,
                    rawAnswers
                );

                if (correctedRiasec._corrected) {
                    console.log('✅ RIASEC scores corrected');
                    console.log('📊 Before:', validatedResults.riasec.scores);
                    console.log('📊 After:', correctedRiasec.scores);
                    validatedResults.riasec = correctedRiasec;
                    console.log('📊 Applied to validatedResults:', validatedResults.riasec.scores);
                }
            } catch (error) {
                console.error('❌ Error validating RIASEC scores:', error);
                // Continue with original scores if validation fails
            }
        }

        // Validate and correct aptitude scores if we have the necessary data
        // 🔧 CRITICAL FIX: Skip aptitude validation if adaptive results exist
        // For college students with adaptive aptitude, scores come from adaptive test, not MCQ questions
        const hasAdaptiveResults = validatedResults.adaptiveAptitudeResults ||
            validatedResults.adaptive_aptitude_results ||
            rawAnswers?.adaptive_aptitude_session_id;

        if (validatedResults.aptitude && rawAnswers && Object.keys(rawAnswers).length > 0 && !hasAdaptiveResults) {
            try {
                // Fetch aptitude questions for this student
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const aptitudeQuestions = await fetchAIAptitudeQuestions(user.id, Object.keys(rawAnswers));

                    if (aptitudeQuestions && aptitudeQuestions.length > 0) {
                        console.log('🔍 Validating aptitude scores with', aptitudeQuestions.length, 'questions');
                        const correctedAptitude = validateAptitudeScores(
                            validatedResults.aptitude,
                            rawAnswers,
                            aptitudeQuestions
                        );

                        if (correctedAptitude._corrected) {
                            console.log('✅ Aptitude scores corrected');
                            validatedResults.aptitude = correctedAptitude;
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Error validating aptitude scores:', error);
                // Continue with original scores if validation fails
            }
        } else if (hasAdaptiveResults) {
            console.log('✅ Skipping aptitude validation - using adaptive aptitude results');
        }

        return validatedResults;
    };

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
        console.log('🔍 ========== FETCH STUDENT INFO START ==========');
        try {
            const { data: { user } } = await supabase.auth.getUser();

            console.log('👤 Authenticated User:', {
                id: user?.id,
                email: user?.email,
                metadata: user?.user_metadata
            });

            if (user) {
                console.log('📊 Querying students table with user_id:', user.id);

                // First, try to fetch student data with relationships
                // Query students table - using actual database column names (mix of camelCase and snake_case)
                let { data: studentData, error: fetchError } = await supabase
                    .from('students')
                    .select(`
                        id, 
                        name,
                        enrollmentNumber,
                        admission_number,
                        roll_number,
                        grade,
                        semester,
                        college_id, 
                        school_id,
                        schoolClassId,
                        branch_field,
                        course_name,
                        college_school_name,
                        grade_start_date,
                        program_id,
                        programs (
                            id,
                            name,
                            code,
                            degree_level
                        )
                    `)
                    .eq('user_id', user.id)
                    .maybeSingle();


                console.log('📦 Student Data Query Result:', {
                    hasData: !!studentData,
                    hasError: !!fetchError,
                    studentData: studentData,
                    error: fetchError
                });

                if (fetchError) {
                    console.error('❌ Error fetching student data:', fetchError);
                    console.error('❌ Error details:', {
                        message: fetchError.message,
                        details: fetchError.details,
                        hint: fetchError.hint,
                        code: fetchError.code
                    });
                }

                if (!studentData) {
                    console.warn('⚠️ No student data found for user_id:', user.id);
                    console.warn('⚠️ This could mean:');
                    console.warn('   1. No student record exists with this user_id');
                    console.warn('   2. RLS policy is blocking access');
                    console.warn('   3. The user_id in students table doesn\'t match auth user');
                }

                // If we got student data, fetch related college/school names separately
                if (studentData && !fetchError) {
                    console.log('✅ Student data found! Fetching related organization data...');

                    if (studentData.college_id) {
                        console.log('🏛️ Fetching college organization:', studentData.college_id);
                        const { data: orgData, error: orgError } = await supabase
                            .from('organizations')
                            .select('name')
                            .eq('id', studentData.college_id)
                            .maybeSingle();
                        console.log('🏛️ College org result:', { orgData, orgError });
                        if (orgData) {
                            studentData.colleges = { name: orgData.name };
                        }
                        console.log('📊 fetchStudentInfo - Fetched college name:', orgData?.name);
                    }

                    if (studentData.school_id) {
                        console.log('🏫 Fetching school organization:', studentData.school_id);
                        const { data: orgData, error: orgError } = await supabase
                            .from('organizations')
                            .select('name')
                            .eq('id', studentData.school_id)
                            .maybeSingle();
                        console.log('🏫 School org result:', { orgData, orgError });
                        if (orgData) {
                            studentData.schools = { name: orgData.name };
                        }
                    }

                    if (studentData.schoolClassId) {
                        console.log('📚 Fetching school class:', studentData.schoolClassId);
                        const { data: classData, error: classError } = await supabase
                            .from('school_classes')
                            .select('grade')
                            .eq('id', studentData.schoolClassId)
                            .maybeSingle();
                        console.log('📚 School class result:', { classData, classError });
                        if (classData) {
                            studentData.school_classes = { grade: classData.grade };
                        }
                    }
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

                    // Format grade value
                    if (studentGrade && studentGrade !== '—') {
                        // Convert to string for consistent display
                        studentGrade = studentGrade.toString();
                    }
                    // If no grade and student is in college, try year or semester
                    else if (studentData.college_id) {
                        if (studentData.year) {
                            studentGrade = `Year ${studentData.year}`;
                        } else if (studentData.semester) {
                            studentGrade = `Semester ${studentData.semester}`;
                        } else {
                            studentGrade = '—';
                        }
                    } else {
                        studentGrade = '—';
                    }

                    console.log('Student grade:', studentGrade, 'from students.grade:', studentData.grade, 'from school_classes:', studentData.school_classes?.grade, 'year:', studentData.year, 'semester:', studentData.semester);

                    // Get institution name - show school OR college, not both
                    let institutionName = '—';
                    let schoolName = '—';
                    let collegeName = '—';

                    // Determine if this is a school student or college student
                    // Priority 1: Check if they have school_id or schoolClassId
                    const hasSchoolId = studentData.school_id || studentData.schoolClassId;
                    const hasCollegeId = studentData.college_id;

                    // Priority 2: Check grade level (Grades 1-12 are school, Year/Semester are college)
                    // Extract numeric grade from strings like "Grade 10", "10", "Year 2", "Semester 4"
                    let gradeNum = parseInt(studentGrade);

                    // If direct parsing fails, try to extract number from "Grade X" format
                    if (isNaN(gradeNum) && studentGrade.includes('Grade')) {
                        const match = studentGrade.match(/Grade\s*(\d+)/i);
                        if (match) {
                            gradeNum = parseInt(match[1]);
                        }
                    }

                    const isSchoolGrade = !isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 12;
                    const isCollegeGrade = studentGrade.includes('Year') || studentGrade.includes('Semester');

                    // Determine student type using centralized utility
                    const isSchoolStudent = checkIsSchoolStudent(studentData);
                    const isCollegeStudent = checkIsCollegeStudent(studentData);

                    if (isSchoolStudent) {
                        // School student - show only school name
                        if (studentData.college_school_name && studentData.college_school_name !== '—') {
                            schoolName = toTitleCase(studentData.college_school_name);
                            institutionName = schoolName;
                        } else if (studentData.schools?.name) {
                            schoolName = toTitleCase(studentData.schools.name);
                            institutionName = schoolName;
                        }
                        collegeName = '—'; // Don't show college for school students
                    } else if (isCollegeStudent) {
                        // College student - show only college name
                        if (studentData.college_school_name && studentData.college_school_name !== '—') {
                            collegeName = toTitleCase(studentData.college_school_name);
                            institutionName = collegeName;
                        } else if (studentData.colleges?.name) {
                            collegeName = toTitleCase(studentData.colleges.name);
                            institutionName = collegeName;
                        }
                        schoolName = '—'; // Don't show school for college students
                    } else {
                        // Fallback: use college_school_name if available
                        if (studentData.college_school_name && studentData.college_school_name !== '—') {
                            institutionName = toTitleCase(studentData.college_school_name);
                            // For grade 12 students, treat as school student
                            if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 12) {
                                schoolName = institutionName;
                                collegeName = '—';
                            } else {
                                // Can't determine if it's school or college, so set both
                                schoolName = institutionName;
                                collegeName = institutionName;
                            }
                        }
                    }

                    console.log('Institution detection - hasSchoolId:', hasSchoolId, 'hasCollegeId:', hasCollegeId, 'isSchoolGrade:', isSchoolGrade, 'isCollegeGrade:', isCollegeGrade, 'isSchoolStudent:', isSchoolStudent, 'isCollegeStudent:', isCollegeStudent, 'final school:', schoolName, 'final college:', collegeName);
                    console.log('Roll numbers - enrollmentNumber:', studentData.enrollmentNumber, 'admission_number:', studentData.admission_number, 'roll_number:', studentData.roll_number);
                    console.log('IDs - school_id:', studentData.school_id, 'college_id:', studentData.college_id, 'schoolClassId:', studentData.schoolClassId);

                    // Determine which roll number to use and roll number type
                    let rollNumber = '—';
                    let rollNumberType = 'school'; // default
                    // gradeNum already declared above, reuse it

                    // Priority 1: Use enrollmentNumber if available
                    if (studentData.enrollmentNumber && studentData.enrollmentNumber !== '—') {
                        rollNumber = studentData.enrollmentNumber;
                        // Determine type based on student context
                        if (studentData.college_id) {
                            rollNumberType = 'university';
                        } else if (!isNaN(gradeNum) && gradeNum >= 11) {
                            rollNumberType = 'institute';
                        } else {
                            rollNumberType = 'school';
                        }
                    }
                    // Priority 2: Fallback to admission_number
                    else if (studentData.admission_number && studentData.admission_number !== '—') {
                        rollNumber = studentData.admission_number;
                        rollNumberType = studentData.college_id ? 'university' : 'school';
                    }
                    // Priority 3: Fallback to roll_number
                    else if (studentData.roll_number && studentData.roll_number !== '—') {
                        rollNumber = studentData.roll_number;
                        rollNumberType = 'school';
                    }

                    // Determine grade level based on student data
                    // NOTE: This is only used as a fallback. The assessment attempt's grade_level
                    // takes priority and is set in loadResults() after this runs.
                    let derivedGradeLevel = 'after12'; // default
                    
                    // Check if student is in college based on multiple indicators
                    const hasCollegeProgram = studentData.programs?.degree_level && 
                        ['undergraduate', 'postgraduate', 'diploma'].includes(studentData.programs.degree_level.toLowerCase());
                    
                    // Check if grade indicates postgraduate/college level
                    const gradeStr = (studentData.grade || '').toLowerCase();
                    const isCollegeGradeLevel = ['ug', 'pg', 'diploma', 'undergraduate', 'postgraduate'].some(term => 
                        gradeStr.includes(term)
                    );
                    
                    // Check if has college name but no college_id (data inconsistency)
                    const hasCollegeName = studentData.college_school_name && 
                        studentData.college_school_name !== '—' && 
                        !studentData.school_id;
                    
                    if (studentData.school_id || studentData.schoolClassId) {
                        // School student - determine if middle or high school based on grade
                        if (!isNaN(gradeNum)) {
                            if (gradeNum >= 6 && gradeNum <= 8) {
                                derivedGradeLevel = 'middle';
                            } else if (gradeNum >= 9 && gradeNum <= 10) {
                                derivedGradeLevel = 'highschool';
                            } else if (gradeNum >= 11 && gradeNum <= 12) {
                                // 11th and 12th grade students - use higher_secondary for stream-based assessments
                                derivedGradeLevel = 'higher_secondary';
                            }
                        } else {
                            // If grade is not a number, default to after12 for school students
                            derivedGradeLevel = 'after12';
                        }
                    } else if (studentData.college_id || hasCollegeProgram || isCollegeGradeLevel || hasCollegeName) {
                        // College student - has college_id OR has a college-level program OR grade indicates college
                        derivedGradeLevel = 'college';
                    }

                    // Update gradeLevel state - this is a fallback value
                    // Only set if grade level wasn't already set from the assessment attempt
                    // Use ref for synchronous check to avoid race condition with async state updates
                    if (!gradeLevelFromAttemptRef.current) {
                        setGradeLevel(derivedGradeLevel);
                    }
                    console.log('Derived gradeLevel from student data:', derivedGradeLevel, 'grade:', studentGrade, 'school_id:', studentData.school_id, 'college_id:', studentData.college_id, 'schoolClassId:', studentData.schoolClassId);

                    // Derive stream from program, branch_field or course_name (database only)
                    let derivedStream = '—';
                    let programName = '—';

                    // For middle/high school, use friendly labels
                    if (derivedGradeLevel === 'middle') {
                        derivedStream = 'Middle School (Grades 6-8)';
                    } else if (derivedGradeLevel === 'highschool') {
                        derivedStream = 'High School (Grades 9-10)';
                    } else if (derivedGradeLevel === 'higher_secondary') {
                        derivedStream = 'Higher Secondary (Grades 11-12)';
                    }
                    // For college students, show degree level instead of stream
                    else if (derivedGradeLevel === 'college') {
                        // Priority: program.name > program.code > course_name > branch_field
                        programName = studentData.programs?.name || studentData.programs?.code || studentData.course_name || studentData.branch_field || '—';
                        
                        // Determine degree level from program or grade
                        const degreeLevel = studentData.programs?.degree_level || null;
                        const gradeStr = (studentData.grade || '').toLowerCase();
                        
                        if (degreeLevel === 'postgraduate' || gradeStr.includes('pg') || gradeStr.includes('postgraduate') || 
                            gradeStr.includes('m.tech') || gradeStr.includes('mtech') || gradeStr.includes('mca') || 
                            gradeStr.includes('mba') || gradeStr.includes('m.sc') || gradeStr.includes('msc')) {
                            derivedStream = 'Postgraduate';
                        } else if (degreeLevel === 'undergraduate' || gradeStr.includes('ug') || gradeStr.includes('undergraduate') ||
                            gradeStr.includes('b.tech') || gradeStr.includes('btech') || gradeStr.includes('bca') || 
                            gradeStr.includes('b.sc') || gradeStr.includes('b.com') || gradeStr.includes('ba ') || gradeStr.includes('bba')) {
                            derivedStream = 'Undergraduate';
                        } else if (degreeLevel === 'diploma' || gradeStr.includes('diploma')) {
                            derivedStream = 'Diploma';
                        } else {
                            derivedStream = 'College';
                        }
                        
                        console.log('📚 College student - Level:', derivedStream, 'Program:', programName);
                        // Skip further stream derivation for college students - we already have the degree level
                    }
                    // Check if student has a program (from programs table) - for non-college students ONLY
                    else if (studentData.programs && derivedGradeLevel !== 'college') {
                        programName = studentData.programs.name || studentData.programs.code || '—';
                        const fieldText = programName.toLowerCase();

                        // Science stream indicators
                        if (fieldText.includes('science') || fieldText.includes('engineering') ||
                            fieldText.includes('tech') || fieldText.includes('bca') ||
                            fieldText.includes('computer') || fieldText.includes('physics') ||
                            fieldText.includes('chemistry') || fieldText.includes('biology') ||
                            fieldText.includes('mathematics') || fieldText.includes('medical') ||
                            fieldText.includes('mbbs') || fieldText.includes('bsc') ||
                            fieldText.includes('b.sc') || fieldText.includes('b.tech') ||
                            fieldText.includes('m.tech') || fieldText.includes('mtech') ||
                            fieldText.includes('electronics') || fieldText.includes('ece')) {
                            derivedStream = 'SCIENCE';
                        }
                        // Commerce stream indicators
                        else if (fieldText.includes('commerce') || fieldText.includes('business') ||
                            fieldText.includes('bba') || fieldText.includes('bcom') ||
                            fieldText.includes('b.com') || fieldText.includes('finance') ||
                            fieldText.includes('accounting') || fieldText.includes('economics') ||
                            fieldText.includes('management') || fieldText.includes('marketing')) {
                            derivedStream = 'COMMERCE';
                        }
                        // Arts stream indicators
                        else if (fieldText.includes('arts') || fieldText.includes('humanities') ||
                            fieldText.includes('ba ') || fieldText.includes('b.a') ||
                            fieldText.includes('law') || fieldText.includes('llb') ||
                            fieldText.includes('english') || fieldText.includes('history') ||
                            fieldText.includes('political') || fieldText.includes('sociology') ||
                            fieldText.includes('psychology') || fieldText.includes('literature')) {
                            derivedStream = 'ARTS';
                        }

                        console.log('📚 Derived stream from program:', derivedStream, 'from program:', programName);
                    }
                    // Fallback: If we have course_name or branch_field, derive the stream
                    else if (studentData.course_name || studentData.branch_field) {
                        // Priority: course_name > branch_field (course_name is the primary field for custom programs)
                        programName = studentData.course_name || studentData.branch_field || '—';
                        const fieldText = programName.toLowerCase();

                        // Science stream indicators
                        if (fieldText.includes('science') || fieldText.includes('engineering') ||
                            fieldText.includes('tech') || fieldText.includes('bca') ||
                            fieldText.includes('computer') || fieldText.includes('physics') ||
                            fieldText.includes('chemistry') || fieldText.includes('biology') ||
                            fieldText.includes('mathematics') || fieldText.includes('medical') ||
                            fieldText.includes('mbbs') || fieldText.includes('bsc') ||
                            fieldText.includes('b.sc') || fieldText.includes('b.tech') ||
                            fieldText.includes('m.tech') || fieldText.includes('mtech')) {
                            derivedStream = 'SCIENCE';
                        }
                        // Commerce stream indicators
                        else if (fieldText.includes('commerce') || fieldText.includes('business') ||
                            fieldText.includes('bba') || fieldText.includes('bcom') ||
                            fieldText.includes('b.com') || fieldText.includes('finance') ||
                            fieldText.includes('accounting') || fieldText.includes('economics') ||
                            fieldText.includes('management') || fieldText.includes('marketing')) {
                            derivedStream = 'COMMERCE';
                        }
                        // Arts stream indicators
                        else if (fieldText.includes('arts') || fieldText.includes('humanities') ||
                            fieldText.includes('ba ') || fieldText.includes('b.a') ||
                            fieldText.includes('law') || fieldText.includes('llb') ||
                            fieldText.includes('english') || fieldText.includes('history') ||
                            fieldText.includes('political') || fieldText.includes('sociology') ||
                            fieldText.includes('psychology') || fieldText.includes('literature')) {
                            derivedStream = 'ARTS';
                        }

                        console.log('📚 Derived stream from database:', derivedStream, 'from field:', fieldText);
                    }

                    setStudentInfo({
                        name: fullName,
                        regNo: rollNumber,
                        rollNumberType: rollNumberType,
                        college: collegeName,  // Only show college for college students
                        school: schoolName,    // Only show school for school students
                        stream: streamFromAssessmentRef.current || derivedStream, // Use assessment stream if available, otherwise derived
                        grade: studentGrade,
                        branchField: programName, // Use program name instead of branch_field
                        courseName: programName   // Use program name for course name too
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

                    // ✅ REMOVED: localStorage caching for student info (use database as source of truth)

                    // Fetch academic data (marks, projects, experiences)
                    await fetchStudentAcademicData(studentData.id);
                } else {
                    const rawName = user.user_metadata?.full_name || user.email?.split('@')[0] || '—';
                    const name = toTitleCase(rawName);

                    setStudentInfo(prev => ({
                        ...prev,
                        name: name,
                        stream: '—'
                    }));
                }
            }
        } catch (err) {
            console.error('Error fetching student info:', err);
            setStudentInfo({
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
        }
    };

    // Fetch student's academic data: marks, projects, experiences
    const fetchStudentAcademicData = async (studentId) => {
        try {
            // Fetch subject marks with subject names (optional - may not exist for all students)
            let marksData = [];
            try {
                const { data, error } = await supabase
                    .from('mark_entries')
                    .select(`
                        id,
                        subject_id,
                        marks_obtained,
                        total_marks,
                        percentage,
                        grade
                    `)
                    .eq('student_id', studentId)
                    .order('created_at', { ascending: false });

                if (error) {
                    // Silently handle error - marks are optional for career assessment
                    console.log('📊 Academic marks not available (this is normal for career assessments)');
                    console.log('   Error:', error.message);
                } else if (data) {
                    marksData = data;
                }
            } catch (marksError) {
                // Catch any thrown errors
                console.log('📊 Academic marks query failed (this is normal for career assessments)');
            }

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
            // Set empty data to prevent undefined errors
            setStudentAcademicData({
                subjectMarks: [],
                projects: [],
                experiences: [],
                education: []
            });
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

        // Prevent redundant loops if already loading/loaded this attempt
        if (attemptId && loadedAttemptIdRef.current === attemptId && results && !loading) {
            console.log('♻️ Results for attemptId', attemptId, 'already loaded - skipping redundancy');
            // Ensure loading is false just in case
            if (loading) setLoading(false);
            return;
        }



        console.log('🔥 loadResults called with attemptId:', attemptId);
        console.log('🔥 Full URL search params:', searchParams.toString());

        if (attemptId) {
            // Load results from database - ALWAYS prefer database over localStorage
            try {
                // STEP 1: Try to find result by attempt_id first (most direct path)
                console.log('🔍 STEP 1: Looking for result by attempt_id:', attemptId);
                const { data: directResult, error: directError } = await supabase
                    .from('personal_assessment_results')
                    .select('*')
                    .eq('attempt_id', attemptId)
                    .maybeSingle();

                console.log('   Direct result lookup:', {
                    found: !!directResult,
                    error: directError?.message || 'none',
                    hasGeminiResults: !!directResult?.gemini_results,
                    hasRiasecScores: !!directResult?.riasec_scores,
                    hasAptitudeScores: !!directResult?.aptitude_scores,
                    allKeys: directResult ? Object.keys(directResult) : []
                });

                // If we found a result directly, use it
                if (directResult) {
                    console.log('✅ Found result directly by attempt_id');

                    // ✅ Fetch the attempt data to get all_responses
                    let attemptData = null;
                    const { data: fetchedAttempt, error: attemptError } = await supabase
                        .from('personal_assessment_attempts')
                        .select('*')
                        .eq('id', attemptId)
                        .maybeSingle();

                    if (fetchedAttempt && !attemptError) {
                        console.log('✅ Found attempt data with all_responses');
                        attemptData = fetchedAttempt;
                    }

                    // ✅ NEW: Fetch adaptive aptitude results if session ID exists
                    let adaptiveAptitudeResults = null;
                    if (directResult.adaptive_aptitude_session_id) {
                        console.log('🔍 Fetching adaptive aptitude results for session:', directResult.adaptive_aptitude_session_id);
                        const { data: adaptiveData, error: adaptiveError } = await supabase
                            .from('adaptive_aptitude_results')
                            .select('*')
                            .eq('session_id', directResult.adaptive_aptitude_session_id)
                            .maybeSingle();

                        if (adaptiveData && !adaptiveError) {
                            console.log('✅ Found adaptive aptitude results');
                            adaptiveAptitudeResults = adaptiveData;
                        } else if (adaptiveError) {
                            console.warn('⚠️ Error fetching adaptive results:', adaptiveError);
                        }
                    }

                    // ✅ NEW: Check if data is in individual columns instead of gemini_results
                    let geminiResults = directResult.gemini_results;

                    // CRITICAL FIX: If gemini_results AND individual columns are ALL NULL, trigger regeneration
                    // Don't reconstruct empty objects - they pass validation but have no data
                    const hasIndividualColumns = directResult.riasec_scores || directResult.aptitude_scores || directResult.career_fit;
                    
                    if ((!geminiResults || Object.keys(geminiResults).length === 0) && !hasIndividualColumns) {
                        console.log('🔥 ========== AUTO-REGENERATION TRIGGERED ==========');
                        console.log('   gemini_results is NULL AND individual columns are NULL');
                        console.log('   Result ID:', directResult.id);
                        console.log('   Attempt ID:', attemptId);
                        console.log('   This means AI analysis never ran - will trigger regeneration');
                        
                        // Set grade level before falling through to regeneration
                        if (directResult.grade_level) {
                            setGradeLevel(directResult.grade_level);
                            setGradeLevelFromAttempt(true);
                            gradeLevelFromAttemptRef.current = true;
                        }
                        
                        // Set geminiResults to null to trigger regeneration below
                        geminiResults = null;
                    }
                    // If gemini_results is missing but we have individual score columns, reconstruct it
                    else if ((!geminiResults || Object.keys(geminiResults).length === 0) && hasIndividualColumns) {
                        console.log('🔧 Reconstructing results from individual database columns...');
                        geminiResults = {
                            riasec: {
                                scores: directResult.riasec_scores || {},
                                code: directResult.riasec_code || '',
                                topThree: directResult.riasec_code ? directResult.riasec_code.split('').map(code => {
                                    const names = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' };
                                    return { code, name: names[code] || code };
                                }) : []
                            },
                            aptitude: directResult.aptitude_scores ? {
                                scores: directResult.aptitude_scores,
                                overallScore: directResult.aptitude_overall || 0
                            } : undefined,
                            bigFive: directResult.bigfive_scores || undefined,
                            workValues: directResult.work_values_scores ? {
                                scores: directResult.work_values_scores
                            } : undefined,
                            employability: directResult.employability_scores ? {
                                skillScores: directResult.employability_scores,
                                overallReadiness: directResult.employability_readiness || 0
                            } : undefined,
                            knowledge: directResult.knowledge_details || (directResult.knowledge_score ? {
                                percentage: directResult.knowledge_score
                            } : undefined),
                            careerFit: directResult.career_fit || null,
                            skillGap: directResult.skill_gap || null,
                            roadmap: directResult.roadmap || null,
                            profileSnapshot: directResult.profile_snapshot || '',
                            finalNote: directResult.final_note || '',
                            overallSummary: directResult.overall_summary || '',
                            // Add adaptive aptitude results if they exist
                            adaptiveAptitudeResults: adaptiveAptitudeResults || undefined
                        };
                        console.log('✅ Reconstructed results:', {
                            hasRiasec: !!geminiResults.riasec,
                            hasAptitude: !!geminiResults.aptitude,
                            hasCareerFit: !!geminiResults.careerFit
                        });
                    }

                    // Check if AI analysis exists and is valid
                    if (geminiResults && typeof geminiResults === 'object' && Object.keys(geminiResults).length > 0) {

                        // Validate that AI analysis is complete (has RIASEC data)
                        // More lenient validation - just check if RIASEC data exists
                        const hasValidRiasec = geminiResults.riasec && (
                            (geminiResults.riasec.scores && Object.keys(geminiResults.riasec.scores).length > 0) ||
                            (geminiResults.riasec.topThree && geminiResults.riasec.topThree.length > 0) ||
                            (geminiResults.riasec.code && geminiResults.riasec.code.length > 0)
                        );

                        if (!hasValidRiasec) {
                            console.log('⚠️ Result has gemini_results but RIASEC data is missing/invalid');
                            console.log('   RIASEC data:', geminiResults.riasec);
                            console.log('   Will regenerate AI analysis');

                            // Set grade level before falling through
                            if (directResult.grade_level) {
                                setGradeLevel(directResult.grade_level);
                                setGradeLevelFromAttempt(true);
                                gradeLevelFromAttemptRef.current = true;
                            }

                            // Fall through to regenerate
                        } else {
                            // Valid AI analysis exists - use it
                            console.log('✅ [UNIFIED LOADER] AI analysis found in database!');
                            console.log('✅ [UNIFIED LOADER] Results will display IMMEDIATELY');
                            console.log('✅ [UNIFIED LOADER] No additional AI analysis needed');
                            console.log('✅ [UNIFIED LOADER] Result ID:', directResult.id);
                            
                            const validatedResults = await applyValidation(geminiResults, {});

                            console.log('🔍 DEBUG - Before normalization (direct lookup):', {
                                hasRiasec: !!validatedResults.riasec,
                                riasecScores: validatedResults.riasec?.scores,
                                hasGeminiResults: !!validatedResults.gemini_results,
                                originalScores: validatedResults.gemini_results?.riasec?._originalScores
                            });

                            // Normalize results to fix data inconsistencies
                            const normalizedResults = normalizeAssessmentResults(validatedResults);
                            
                            // Add attempt data and adaptive results for debug panel
                            normalizedResults.attempt_data = attemptData;
                            if (adaptiveAptitudeResults) {
                                normalizedResults.adaptive_aptitude_results = adaptiveAptitudeResults;
                            }
                            
                            // ✅ CRITICAL FIX: Preserve raw database fields for debug panel
                            // These fields are needed to show what's actually stored in the database
                            normalizedResults._rawDatabaseFields = {
                                id: directResult.id,
                                attempt_id: directResult.attempt_id,
                                student_id: directResult.student_id,
                                stream_id: directResult.stream_id,
                                grade_level: directResult.grade_level,
                                riasec_scores: directResult.riasec_scores,
                                riasec_code: directResult.riasec_code,
                                aptitude_scores: directResult.aptitude_scores,
                                aptitude_overall: directResult.aptitude_overall,
                                bigfive_scores: directResult.bigfive_scores,
                                work_values_scores: directResult.work_values_scores,
                                employability_scores: directResult.employability_scores,
                                knowledge_score: directResult.knowledge_score,
                                career_fit: directResult.career_fit,
                                skill_gap: directResult.skill_gap,
                                roadmap: directResult.roadmap,
                                gemini_results: directResult.gemini_results,
                                adaptive_aptitude_session_id: directResult.adaptive_aptitude_session_id,
                                status: directResult.status,
                                created_at: directResult.created_at,
                                updated_at: directResult.updated_at
                            };
                            
                            console.log('🔧 Assessment results normalized (direct lookup):', {
                                before: validatedResults.riasec?.scores,
                                after: normalizedResults.riasec?.scores,
                                hasAttemptData: !!attemptData,
                                hasAllResponses: !!attemptData?.all_responses,
                                hasAdaptiveResults: !!adaptiveAptitudeResults,
                                hasRawDatabaseFields: !!normalizedResults._rawDatabaseFields
                            });
                            setResults(normalizedResults);

                            // Set grade level
                            if (directResult.grade_level) {
                                setGradeLevel(directResult.grade_level);
                                setGradeLevelFromAttempt(true);
                                gradeLevelFromAttemptRef.current = true;
                            }

                            loadedAttemptIdRef.current = attemptId;
                            console.log('✅ [UNIFIED LOADER] Results loaded successfully - hiding loader');
                            setLoading(false);
                            return;
                        }
                    } else {
                        // Result exists but no AI analysis - AUTO-GENERATE IT!
                        console.log('🔥 ========== AUTO-RETRY TRIGGER DETECTED ==========');
                        console.log('   Result exists but missing AI analysis');
                        console.log('   Result ID:', directResult.id);
                        console.log('   Attempt ID:', attemptId);
                        console.log('   gemini_results:', directResult.gemini_results);
                        console.log('   status:', directResult.status);
                        console.log('   grade_level:', directResult.grade_level);
                        
                        console.log('⚠️ [UNIFIED LOADER] AI analysis missing from database!');
                        console.log('⚠️ [UNIFIED LOADER] This should NOT happen with the new flow');
                        console.log('⚠️ [UNIFIED LOADER] AI analysis should have been done during submission');
                        console.log('⚠️ [UNIFIED LOADER] Possible causes:');
                        console.log('   1. Old assessment (before unified loader implementation)');
                        console.log('   2. AI analysis failed during submission');
                        console.log('   3. Database save failed partially');
                        
                        // Set grade level
                        if (directResult.grade_level) {
                            console.log('✅ Setting grade level from result:', directResult.grade_level);
                            setGradeLevel(directResult.grade_level);
                            setGradeLevelFromAttempt(true);
                            gradeLevelFromAttemptRef.current = true;
                        }

                        // Check if we already tried auto-retrying
                        const retryKey = `auto_retry_done_attempt_${attemptId}`;
                        const alreadyRetried = sessionStorage.getItem(retryKey);

                        if (retryCompleted || alreadyRetried) {
                            console.log('⏭️ Skipping auto-retry - already completed/attempted');
                            console.log('   retryCompleted:', retryCompleted);
                            console.log('   alreadyRetried:', !!alreadyRetried);
                            setError(new Error("Unable to retrieve assessment report. Please click 'Retry' to regenerate."));
                            setLoading(false);
                            return;
                        }

                        // Trigger auto-retry
                        console.log('🚀 Triggering auto-retry mechanism (fallback for old assessments)');
                        console.log('   Setting autoRetry flag to TRUE');
                        console.log('   Grade level will be passed to AI:', directResult.grade_level || gradeLevel);
                        setAutoRetry(true);
                        console.log('✅ Auto-retry flag set - waiting for useEffect to trigger');
                        return;
                    }
                }

                // STEP 2: If direct lookup failed, try the old way (via attempt table)
                console.log('🔍 STEP 2: Trying lookup via personal_assessment_attempts table');
                const attempt = await assessmentService.getAttemptWithResults(attemptId);

                console.log('🔥🔥🔥 ATTEMPT LOOKUP DEBUG 🔥🔥🔥');
                console.log('   attempt exists:', !!attempt);
                console.log('   attempt.results:', attempt?.results);
                console.log('   attempt.results type:', Array.isArray(attempt?.results) ? 'array' : typeof attempt?.results);
                console.log('   attempt.results[0]:', attempt?.results?.[0]);
                console.log('   attempt.results length:', attempt?.results?.length);

                // Check if we have a result record (even if AI analysis is missing)
                // Supabase returns results as an ARRAY when using select with relationship
                // BUT if the relationship is one-to-one, it might return an object instead
                const result = Array.isArray(attempt?.results) ? attempt.results[0] : attempt?.results;

                console.log('🔥 Result after normalization:', result);
                console.log('🔥 Result exists:', !!result);

                if (result && result.id) {
                    console.log('🔥 Result found, checking AI analysis...');

                    // If AI analysis exists AND is valid, use it
                    if (result.gemini_results && typeof result.gemini_results === 'object' && Object.keys(result.gemini_results).length > 0) {
                        const geminiResults = result.gemini_results;

                        // Validate that AI analysis is complete (has RIASEC data)
                        // More lenient validation - just check if RIASEC data exists
                        const hasValidRiasec = geminiResults.riasec && (
                            (geminiResults.riasec.scores && Object.keys(geminiResults.riasec.scores).length > 0) ||
                            (geminiResults.riasec.topThree && geminiResults.riasec.topThree.length > 0) ||
                            (geminiResults.riasec.code && geminiResults.riasec.code.length > 0)
                        );

                        if (!hasValidRiasec) {
                            console.log('⚠️ Database result has gemini_results but RIASEC data is missing/invalid');
                            console.log('   RIASEC data:', geminiResults.riasec);
                            console.log('   Available gemini_results keys:', Object.keys(geminiResults));
                            console.log('   Will regenerate AI analysis');

                            // Set grade level from attempt before falling through
                            if (attempt.grade_level) {
                                setGradeLevel(attempt.grade_level);
                                setGradeLevelFromAttempt(true);
                                gradeLevelFromAttemptRef.current = true;
                            }

                            // Fall through to regenerate AI analysis
                        } else {
                            // Valid AI analysis exists - use it
                            // Apply validation to correct RIASEC topThree and detect aptitude patterns
                            const validatedResults = await applyValidation(geminiResults, attempt.all_responses || {});

                            // DISABLED: Course generation during assessment
                            // Courses are now generated on-demand when user clicks a job role
                            // This improves assessment generation speed and reduces unnecessary API calls
                            /*
                            // Check if courses are missing and regenerate if needed
                            if (!validatedResults.platformCourses || validatedResults.platformCourses.length === 0) {
                                console.log('⚠️ Course recommendations missing - regenerating...');
                                console.log('   Current result ID:', result.id);
                                console.log('   Attempt ID:', attemptId);
                                try {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    let studentId = null;
                                    if (user) {
                                        const { data: student } = await supabase
                                            .from('students')
                                            .select('id')
                                            .eq('user_id', user.id)
                                            .single();
                                        studentId = student?.id;
                                        console.log('   Student ID:', studentId);
                                    }
                                    
                                    console.log('   Calling addCourseRecommendations...');
                                    const resultsWithCourses = await addCourseRecommendations(validatedResults, studentId);
                                    console.log('   ✅ Courses generated:', {
                                        platformCourses: resultsWithCourses.platformCourses?.length || 0,
                                        technical: resultsWithCourses.coursesByType?.technical?.length || 0,
                                        soft: resultsWithCourses.coursesByType?.soft?.length || 0
                                    });
                                    
                                    // Update database with new courses
                                    console.log('   Saving to database...');
                                    const { error: updateError } = await supabase
                                        .from('personal_assessment_results')
                                        .update({
                                            platform_courses: resultsWithCourses.platformCourses,
                                            courses_by_type: resultsWithCourses.coursesByType,
                                            skill_gap_courses: resultsWithCourses.skillGapCourses,
                                            gemini_results: resultsWithCourses
                                        })
                                        .eq('id', result.id);
                                    
                                    if (updateError) {
                                        console.error('   ❌ Failed to save courses:', updateError);
                                    } else {
                                        console.log('   ✅ Courses saved to database successfully');
                                    }
                                    
                                    setResults(resultsWithCourses);
                                } catch (courseError) {
                                    console.error('   ❌ Failed to regenerate courses:', courseError);
                                    setResults(validatedResults); // Use results without courses
                                }
                            } else {
                                console.log('✅ Courses already exist:', {
                                    platformCourses: validatedResults.platformCourses?.length || 0,
                                    technical: validatedResults.coursesByType?.technical?.length || 0,
                                    soft: validatedResults.coursesByType?.soft?.length || 0
                                });
                                setResults(validatedResults);
                            }
                            */

                            // Set results without course generation
                            console.log('📋 Loading assessment results (courses will be generated on-demand)');

                            // Normalize results to fix data inconsistencies
                            const normalizedResults = normalizeAssessmentResults(validatedResults);
                            
                            // ✅ CRITICAL FIX: Preserve raw database fields for debug panel
                            // These fields are needed to show what's actually stored in the database
                            normalizedResults._rawDatabaseFields = {
                                id: result.id,
                                attempt_id: result.attempt_id,
                                student_id: result.student_id,
                                stream_id: result.stream_id,
                                grade_level: result.grade_level,
                                riasec_scores: result.riasec_scores,
                                riasec_code: result.riasec_code,
                                aptitude_scores: result.aptitude_scores,
                                aptitude_overall: result.aptitude_overall,
                                bigfive_scores: result.bigfive_scores,
                                work_values_scores: result.work_values_scores,
                                employability_scores: result.employability_scores,
                                knowledge_score: result.knowledge_score,
                                career_fit: result.career_fit,
                                skill_gap: result.skill_gap,
                                roadmap: result.roadmap,
                                gemini_results: result.gemini_results,
                                adaptive_aptitude_session_id: result.adaptive_aptitude_session_id,
                                status: result.status,
                                created_at: result.created_at,
                                updated_at: result.updated_at
                            };
                            
                            console.log('🔧 Assessment results normalized (attempt lookup):', {
                                before: validatedResults.riasec?.scores,
                                after: normalizedResults.riasec?.scores,
                                hasRawDbFields: !!normalizedResults._rawDatabaseFields
                            });
                            setResults(normalizedResults);

                            // Set grade level from attempt
                            if (attempt.grade_level) {
                                setGradeLevel(attempt.grade_level);
                                setGradeLevelFromAttempt(true);
                                gradeLevelFromAttemptRef.current = true; // Set ref synchronously to prevent race condition
                            }

                            // Update studentInfo with actual stream_id from assessment result
                            if (attempt.stream_id || result.stream_id) {
                                const actualStreamId = attempt.stream_id || result.stream_id;
                                console.log('📚 Updating studentInfo.stream with actual stream_id:', actualStreamId);
                                streamFromAssessmentRef.current = actualStreamId; // Set ref to prevent fetchStudentInfo from overwriting
                                setStudentInfo(prev => ({
                                    ...prev,
                                    stream: actualStreamId
                                }));
                            }

                            // ✅ REMOVED: localStorage caching (database is source of truth)

                            // DISABLED: Course recommendation saving
                            // Courses are now generated on-demand when user clicks a job role
                            /*
                            // Ensure recommendations are saved (in case they weren't before)
                            if (validatedResults.platformCourses && validatedResults.platformCourses.length > 0) {
                                try {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    if (user) {
                                        await saveRecommendations(
                                            user.id,
                                            geminiResults.platformCourses,
                                            result.id,
                                            'assessment'
                                        );
                                    }
                                } catch (recError) {
                                    // Silently fail - recommendations may already exist
                                    console.log('Recommendations sync:', recError.message);
                                }
                            }
                            */


                            loadedAttemptIdRef.current = attemptId; // Mark as loaded
                            setLoading(false);
                            return;
                        }
                    } else {
                        // Result exists but no AI analysis - AUTO-GENERATE IT!

                        // Check if this is a newly created result (within last 30 seconds)
                        const resultCreatedAt = new Date(result.created_at);
                        const now = new Date();
                        const ageInSeconds = (now - resultCreatedAt) / 1000;
                        const isNewlyCreated = ageInSeconds < 30;

                        // Check if we already tried auto-retrying this session (using attemptId to match handleRetry)
                        const retryKey = `auto_retry_done_attempt_${attemptId}`;
                        const alreadyRetried = sessionStorage.getItem(retryKey);

                        // For newly created results, always generate (ignore session storage)
                        // For older results, check session storage to avoid infinite loops
                        if (!isNewlyCreated && (retryCompleted || alreadyRetried)) {
                            console.log('⏭️ Skipping auto-retry - already completed/attempted');
                            console.log('   Result age:', Math.round(ageInSeconds), 'seconds');
                            console.log('   retryCompleted:', retryCompleted);
                            console.log('   alreadyRetried:', !!alreadyRetried);

                            // If we're skipping but don't have results, set an error so the user can manually retry
                            // instead of showing a blank page
                            if (!result.gemini_results || Object.keys(result.gemini_results).length === 0) {
                                console.log('❌ No results found after skip - setting error state');
                                setError(new Error("Unable to retrieve assessment report. Please click 'Retry' to regenerate."));
                            }

                            setLoading(false);
                            return;
                        }

                        console.log('🔥🔥🔥 AUTO-GENERATING AI ANALYSIS 🔥🔥🔥');
                        console.log('📊 Database result exists but missing AI analysis');
                        console.log('   Result ID:', result.id);
                        console.log('   Attempt ID:', attemptId);
                        console.log('   Result age:', Math.round(ageInSeconds), 'seconds');
                        console.log('   Is newly created:', isNewlyCreated);
                        console.log('   gemini_results:', result.gemini_results);
                        console.log('   status:', result.status || attempt.status);
                        console.log('   grade_level:', attempt.grade_level);
                        console.log('   retryCompleted:', retryCompleted);
                        console.log('   🚀 Triggering auto-retry mechanism');

                        // Set grade level from attempt
                        if (attempt.grade_level) {
                            console.log('✅ Setting grade level from attempt:', attempt.grade_level);
                            setGradeLevel(attempt.grade_level);
                            setGradeLevelFromAttempt(true);
                            gradeLevelFromAttemptRef.current = true;
                        }

                        // Store the result ID for use in handleRetry's sessionStorage marker
                        // NOTE: We do NOT set sessionStorage here anymore - it's set in handleRetry's finally block
                        // This fixes the React Strict Mode race condition where the component re-mounts
                        // before handleRetry can complete, causing the second loadResults to skip the retry

                        // Set flag to trigger auto-retry (will be handled by useEffect)
                        // Keep loading=true so user sees "Generating Your Report" screen
                        console.log('🚀 Setting autoRetry flag to TRUE');
                        console.log('   Grade level will be passed to AI:', attempt.grade_level || gradeLevel);
                        setAutoRetry(true);
                        console.log('   ✅ autoRetry flag set to TRUE - waiting for useEffect to trigger');
                        // Don't set loading to false - keep showing loading screen
                        return;
                    }
                } else {
                    // Attempt exists but no result record found
                    console.log('🔥🔥🔥 CRITICAL: Attempt exists but NO result record found! 🔥🔥🔥');
                    console.log('   Attempt ID:', attemptId);
                    console.log('   Attempt status:', attempt?.status);
                    console.log('   attempt.results type:', typeof attempt?.results);
                    console.log('   attempt.results value:', attempt?.results);
                    console.log('   This should NOT happen - attempt is completed but no result!');

                    // Set grade level from attempt
                    if (attempt?.grade_level) {
                        setGradeLevel(attempt.grade_level);
                        setGradeLevelFromAttempt(true);
                        gradeLevelFromAttemptRef.current = true;
                    }

                    // Show error with retry option
                    setError('Your assessment was saved but the results are missing. Click "Try Again" to generate your personalized career report.');
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error('🔥 Error in attemptId path:', e);
                console.error('   This error was caught, execution will continue to latest result path');
                // Don't return here - let it fall through to latest result path
            }
        }

        // Try to load latest result from database for current user
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const latestResult = await assessmentService.getLatestResult(user.id);
                if (latestResult?.gemini_results && typeof latestResult.gemini_results === 'object' && Object.keys(latestResult.gemini_results).length > 0) {
                    const geminiResults = latestResult.gemini_results;

                    // Validate that AI analysis is complete (has RIASEC scores)
                    // More lenient validation - just check if RIASEC data exists
                    const hasValidRiasec = geminiResults.riasec && (
                        (geminiResults.riasec.scores && Object.keys(geminiResults.riasec.scores).length > 0) ||
                        (geminiResults.riasec.topThree && geminiResults.riasec.topThree.length > 0) ||
                        (geminiResults.riasec.code && geminiResults.riasec.code.length > 0)
                    );

                    if (!hasValidRiasec) {
                        console.log('⚠️ Latest result has gemini_results but RIASEC data is missing/invalid');
                        console.log('   RIASEC data:', geminiResults.riasec);
                        console.log('   Available gemini_results keys:', Object.keys(geminiResults));
                        console.log('   Redirecting to assessment test...');

                        navigate('/student/assessment/test');
                        return;
                    } else {
                        console.log('Loaded results from database');
                        // Apply validation to correct RIASEC topThree and detect aptitude patterns
                        const validatedResults = await applyValidation(geminiResults);

                        // Normalize results to fix data inconsistencies
                        const normalizedResults = normalizeAssessmentResults(validatedResults);
                        
                        // ✅ CRITICAL FIX: Preserve raw database fields for debug panel
                        // These fields are needed to show what's actually stored in the database
                        normalizedResults._rawDatabaseFields = {
                            id: latestResult.id,
                            attempt_id: latestResult.attempt_id,
                            student_id: latestResult.student_id,
                            stream_id: latestResult.stream_id,
                            grade_level: latestResult.grade_level,
                            riasec_scores: latestResult.riasec_scores,
                            riasec_code: latestResult.riasec_code,
                            aptitude_scores: latestResult.aptitude_scores,
                            aptitude_overall: latestResult.aptitude_overall,
                            bigfive_scores: latestResult.bigfive_scores,
                            work_values_scores: latestResult.work_values_scores,
                            employability_scores: latestResult.employability_scores,
                            knowledge_score: latestResult.knowledge_score,
                            career_fit: latestResult.career_fit,
                            skill_gap: latestResult.skill_gap,
                            roadmap: latestResult.roadmap,
                            gemini_results: latestResult.gemini_results,
                            adaptive_aptitude_session_id: latestResult.adaptive_aptitude_session_id,
                            status: latestResult.status,
                            created_at: latestResult.created_at,
                            updated_at: latestResult.updated_at
                        };
                        
                        console.log('🔧 Assessment results normalized (latest result):', {
                            before: validatedResults.riasec?.scores,
                            after: normalizedResults.riasec?.scores,
                            hasRawDbFields: !!normalizedResults._rawDatabaseFields
                        });
                        setResults(normalizedResults);

                        // Set grade level from result
                        if (latestResult.grade_level) {
                            setGradeLevel(latestResult.grade_level);
                            setGradeLevelFromAttempt(true);
                            gradeLevelFromAttemptRef.current = true; // Set ref synchronously to prevent race condition
                        }

                        // Update studentInfo with actual stream_id from assessment result
                        if (latestResult.stream_id) {
                            console.log('📚 Updating studentInfo.stream with actual stream_id:', latestResult.stream_id);
                            streamFromAssessmentRef.current = latestResult.stream_id; // Set ref to prevent fetchStudentInfo from overwriting
                            setStudentInfo(prev => ({
                                ...prev,
                                stream: latestResult.stream_id
                            }));
                        }

                        // ✅ REMOVED: localStorage caching (database is source of truth)

                        // DISABLED: Course recommendation saving
                        // Courses are now generated on-demand when user clicks a job role
                        /*
                        // Ensure recommendations are saved
                        if (validatedResults.platformCourses && validatedResults.platformCourses.length > 0) {
                            try {
                                await saveRecommendations(
                                    user.id,
                                    validatedResults.platformCourses,
                                    latestResult.id,
                                    'assessment'
                                );
                            } catch (recError) {
                                console.log('Recommendations sync:', recError.message);
                            }
                        }
                        */

                        setLoading(false);
                        return;
                    }
                } else {
                    console.log('No valid database results found');
                }
            }
        } catch (e) {
            console.log('No database results found:', e.message);
        }

        // Fallback to localStorage (legacy mode)
        let answersJson = localStorage.getItem('assessment_answers');
        const geminiResultsJson = localStorage.getItem('assessment_gemini_results');
        let stream = localStorage.getItem('assessment_stream');
        let storedGradeLevel = localStorage.getItem('assessment_grade_level');

        // CRITICAL FIX: If localStorage is empty, try to load answers from database
        // This handles cases where localStorage was cleared (refresh, different device, etc.)
        if (!answersJson && attemptId) {
            console.log('📊 localStorage empty, attempting to load answers from database...');
            try {
                const attempt = await assessmentService.getAttemptWithResults(attemptId);
                if (attempt?.all_responses && Object.keys(attempt.all_responses).length > 0) {
                    answersJson = JSON.stringify(attempt.all_responses);
                    console.log('✅ Loaded answers from database:', Object.keys(attempt.all_responses).length, 'answers');

                    // Also restore stream and grade level from attempt if not in localStorage
                    if (!stream && attempt.stream_id) {
                        stream = attempt.stream_id;
                        localStorage.setItem('assessment_stream', attempt.stream_id);
                        console.log('✅ Restored stream from database:', attempt.stream_id);
                    }
                    if (!storedGradeLevel && attempt.grade_level) {
                        storedGradeLevel = attempt.grade_level;
                        localStorage.setItem('assessment_grade_level', attempt.grade_level);
                        console.log('✅ Restored grade level from database:', attempt.grade_level);
                    }
                } else {
                    console.warn('⚠️ Database attempt has no answers in all_responses');
                }
            } catch (dbError) {
                console.error('❌ Error loading answers from database:', dbError);
            }
        }

        if (!answersJson) {
            console.error('❌ No answers found in localStorage or database');
            navigate('/student/assessment/test');
            return;
        }
    }; // End of loadResults function

    // Handle retry - regenerate AI analysis from database
    const handleRetry = useCallback(async () => {
        try {
            setRetrying(true);
            setError(null);

            // Check if max retry attempts reached (max 3 attempts)
            if (retryAttemptCount >= 3) {
                console.error('❌ Max retry attempts (3) reached');
                setError('Maximum retry attempts reached. Please try again later or contact support if the issue persists.');
                setRetrying(false);
                return;
            }

            // Increment retry attempt counter
            setRetryAttemptCount(prev => prev + 1);
            console.log(`🔄 Retry attempt ${retryAttemptCount + 1} of 3`);

            // ✅ Get answers from database instead of localStorage
            const attemptId = searchParams.get('attemptId');

            if (!attemptId) {
                setError('No attempt ID found. Please retake the assessment.');
                setRetrying(false);
                return;
            }

            console.log('🔄 ========== RETRY AI ANALYSIS START ==========');
            console.log('   Attempt ID:', attemptId);
            console.log('   Current gradeLevel state:', gradeLevel);
            console.log('   gradeLevelFromAttempt:', gradeLevelFromAttempt);

            // Fetch the attempt with all responses
            const attempt = await assessmentService.getAttemptWithResults(attemptId);

            if (!attempt) {
                setError('Assessment attempt not found. Please retake the assessment.');
                setRetrying(false);
                return;
            }

            const answers = attempt.all_responses;
            const stream = attempt.stream_id;
            // CRITICAL: Use grade level from attempt (source of truth), fallback to state, then default
            const storedGradeLevel = attempt.grade_level || gradeLevel || 'after12';
            const sectionTimings = attempt.section_timings || {};

            console.log('📊 Retry Analysis Context:');
            console.log('   Grade Level (from attempt):', attempt.grade_level);
            console.log('   Grade Level (from state):', gradeLevel);
            console.log('   Grade Level (final):', storedGradeLevel);
            console.log('   Stream ID:', stream);
            console.log('   Total answers:', Object.keys(answers).length);

            if (!answers || !stream) {
                console.error('❌ Assessment data is incomplete:');
                console.error('   Has answers:', !!answers);
                console.error('   Has stream:', !!stream);
                setError('Assessment data is incomplete. Please retake the assessment.');
                setRetrying(false);
                return;
            }

            console.log('✅ Assessment data validated');
            console.log('   Answers count:', Object.keys(answers).length);
            console.log('   Stream:', stream);
            console.log('   Grade Level for AI analysis:', storedGradeLevel);

            // Check if this is an AI assessment that needs questions from database
            const isAIAssessment = ['after10', 'after12', 'college', 'higher_secondary'].includes(storedGradeLevel);

            // Build question banks
            let questionBanks = {
                riasecQuestions,
                aptitudeQuestions: [], // Will be populated for AI assessments
                bigFiveQuestions,
                workValuesQuestions,
                employabilityQuestions,
                streamKnowledgeQuestions
            };

            // For AI assessments, fetch questions from database for proper scoring
            if (isAIAssessment) {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const answerKeys = Object.keys(answers);

                        // Fetch aptitude questions
                        const aptitudeAnswerKeys = answerKeys.filter(k => k.startsWith('aptitude_'));
                        if (aptitudeAnswerKeys.length > 0) {
                            console.log('📡 Fetching AI aptitude questions for retry...');
                            const aiAptitudeQuestions = await fetchAIAptitudeQuestions(user.id, aptitudeAnswerKeys);
                            if (aiAptitudeQuestions.length > 0) {
                                questionBanks.aptitudeQuestions = aiAptitudeQuestions;
                                console.log(`✅ Loaded ${aiAptitudeQuestions.length} AI aptitude questions`);
                            }
                        }

                        // Fetch knowledge questions
                        const knowledgeAnswerKeys = answerKeys.filter(k => k.startsWith('knowledge_'));
                        if (knowledgeAnswerKeys.length > 0) {
                            console.log('📡 Fetching AI knowledge questions for retry...');
                            const aiKnowledgeQuestions = await fetchAIKnowledgeQuestions(user.id, knowledgeAnswerKeys);
                            if (aiKnowledgeQuestions.length > 0) {
                                questionBanks.streamKnowledgeQuestions = { [stream]: aiKnowledgeQuestions };
                                console.log(`✅ Loaded ${aiKnowledgeQuestions.length} AI knowledge questions`);
                            }
                        }
                    }
                } catch (fetchErr) {
                    console.warn('Could not fetch AI questions for retry:', fetchErr.message);
                }
            }

            console.log('=== REGENERATE: Starting AI analysis ===');
            console.log('📚 Question bank counts:', {
                riasec: questionBanks.riasecQuestions?.length || 0,
                aptitude: questionBanks.aptitudeQuestions?.length || 0,
                bigFive: questionBanks.bigFiveQuestions?.length || 0,
                workValues: questionBanks.workValuesQuestions?.length || 0,
                employability: questionBanks.employabilityQuestions?.length || 0,
                knowledge: questionBanks.streamKnowledgeQuestions?.[stream]?.length || 0
            });

            // CRITICAL DEBUG: Check if questions have correct_answer field
            if (questionBanks.aptitudeQuestions?.length > 0) {
                const sampleAptQ = questionBanks.aptitudeQuestions[0];
                console.log('📊 REGENERATE: Sample aptitude question structure:', {
                    id: sampleAptQ.id,
                    hasCorrectAnswer: !!sampleAptQ.correct_answer,
                    hasCorrect: !!sampleAptQ.correct,
                    hasCorrectAnswerField: !!sampleAptQ.correctAnswer,
                    keys: Object.keys(sampleAptQ)
                });
            }

            if (questionBanks.streamKnowledgeQuestions?.[stream]?.length > 0) {
                const sampleKnowQ = questionBanks.streamKnowledgeQuestions[stream][0];
                console.log('📚 REGENERATE: Sample knowledge question structure:', {
                    id: sampleKnowQ.id,
                    hasCorrectAnswer: !!sampleKnowQ.correct_answer,
                    hasCorrect: !!sampleKnowQ.correct,
                    hasCorrectAnswerField: !!sampleKnowQ.correctAnswer,
                    keys: Object.keys(sampleKnowQ)
                });
            }

            console.log('Sample answers:', JSON.stringify(answers).substring(0, 500));

            // Extract degree level from grade for better AI recommendations
            const extractDegreeLevel = (grade) => {
                if (!grade) return null;
                const gradeStr = grade.toLowerCase();
                if (gradeStr.includes('pg') || gradeStr.includes('postgraduate') ||
                    gradeStr.includes('m.tech') || gradeStr.includes('mtech') ||
                    gradeStr.includes('mca') || gradeStr.includes('mba') ||
                    gradeStr.includes('m.sc') || gradeStr.includes('msc')) {
                    return 'postgraduate';
                }
                if (gradeStr.includes('ug') || gradeStr.includes('undergraduate') ||
                    gradeStr.includes('b.tech') || gradeStr.includes('btech') ||
                    gradeStr.includes('bca') || gradeStr.includes('b.sc') ||
                    gradeStr.includes('b.com') || gradeStr.includes('ba ') ||
                    gradeStr.includes('bba')) {
                    return 'undergraduate';
                }
                if (gradeStr.includes('diploma')) {
                    return 'diploma';
                }
                return null;
            };

            // Build student context for enhanced AI recommendations
            // CRITICAL FIX: Use studentContext from attempt if available (stored during submission)
            // This ensures career clusters are aligned with the student's program/course
            let studentContext = {};

            if (attempt.student_context && Object.keys(attempt.student_context).length > 0) {
                console.log('✅ Using student context from attempt (stored during submission)');
                studentContext = attempt.student_context;
            } else {
                console.log('⚠️ No student context in attempt, building from studentInfo...');
                // Fallback: Build from studentInfo that was fetched earlier
                // Try multiple sources for program name with correct priority
                // Priority: courseName (from studentInfo) > branchField > fetch from DB
                let programName = studentInfo.courseName || studentInfo.branchField || null;
                
                // If still no program name, try to fetch from student record
                if (!programName && attempt.student_id) {
                    try {
                        const { data: studentData } = await supabase
                            .from('students')
                            .select('course_name, branch_field, program:program_id(name, code)')
                            .eq('id', attempt.student_id)
                            .maybeSingle();
                        
                        if (studentData) {
                            // Priority: program.name > program.code > course_name > branch_field
                            programName = studentData.program?.name || 
                                         studentData.program?.code || 
                                         studentData.course_name ||
                                         studentData.branch_field;
                            console.log('📚 Fetched program name from student record:', programName);
                        }
                    } catch (err) {
                        console.warn('Could not fetch program name:', err);
                    }
                }
                
                studentContext = {
                    rawGrade: studentInfo.grade || storedGradeLevel,
                    programName: programName,
                    programCode: null,
                    degreeLevel: extractDegreeLevel(studentInfo.grade || storedGradeLevel)
                };
            }

            console.log('📚 Retry Student Context:', studentContext);
            console.log('🎓 Degree level:', studentContext.degreeLevel);

            // 🔧 CRITICAL FIX: Fetch adaptive aptitude results if session ID exists
            // This ensures high school students get their adaptive test data included in AI analysis
            if (answers.adaptive_aptitude_session_id) {
                console.log('🔍 Fetching adaptive aptitude results for AI analysis...');
                console.log('   Session ID:', answers.adaptive_aptitude_session_id);

                try {
                    const { data: adaptiveData, error: adaptiveError } = await supabase
                        .from('adaptive_aptitude_results')
                        .select('*')
                        .eq('session_id', answers.adaptive_aptitude_session_id)
                        .maybeSingle();

                    if (adaptiveData && !adaptiveError) {
                        console.log('✅ Found adaptive aptitude results:', {
                            level: adaptiveData.aptitude_level,
                            accuracy: adaptiveData.overall_accuracy,
                            confidence: adaptiveData.confidence_tag
                        });
                        // Add to answers so AI can use it
                        answers.adaptive_aptitude_results = adaptiveData;
                    } else if (adaptiveError) {
                        console.warn('⚠️ Error fetching adaptive results:', adaptiveError);
                    } else {
                        console.warn('⚠️ No adaptive results found for session:', answers.adaptive_aptitude_session_id);
                    }
                } catch (err) {
                    console.error('❌ Failed to fetch adaptive results:', err);
                }
            }

            // Force regenerate with AI - pass gradeLevel and student context
            // 🔧 CRITICAL FIX: Pass pre-calculated aptitude scores from attempt
            const preCalculatedScores = attempt.aptitude_scores ? {
                aptitude: attempt.aptitude_scores
            } : null;

            console.log('📊 Pre-calculated scores for regeneration:', preCalculatedScores);

            // 🔧 CRITICAL FIX: Pass adaptive results as 8th parameter
            const adaptiveResultsForAI = answers.adaptive_aptitude_results || null;
            console.log('📊 Adaptive results for AI:', adaptiveResultsForAI ? 'Available' : 'Not available');

            const geminiResults = await analyzeAssessmentWithGemini(
                answers,
                stream,
                questionBanks,
                {}, // Empty timings in retry
                storedGradeLevel, // Pass grade level for proper scoring
                preCalculatedScores, // Pass pre-calculated scores from attempt
                studentContext, // Pass student context for enhanced recommendations
                adaptiveResultsForAI // Pass adaptive results for aptitude scoring
            );

            if (!geminiResults) {
                throw new Error('AI analysis returned no results');
            }

            console.log('✅ AI analysis completed successfully');
            console.log('   Has RIASEC:', !!geminiResults.riasec);
            console.log('   Has aptitude:', !!geminiResults.aptitude);
            console.log('   Has careerFit:', !!geminiResults.careerFit);

            // ============================================================================
            // CRITICAL DEBUG: Log AI response structure
            // ============================================================================
            console.log('🔍 === AI RESPONSE STRUCTURE (useAssessmentResults) ===');
            console.log('🔍 Response keys:', Object.keys(geminiResults));
            console.log('🔍 riasec.code:', geminiResults.riasec?.code);
            console.log('🔍 riasec.scores:', JSON.stringify(geminiResults.riasec?.scores));
            console.log('🔍 aptitude.scores:', JSON.stringify(geminiResults.aptitude?.scores));
            console.log('🔍 aptitude.overallScore:', geminiResults.aptitude?.overallScore);
            console.log('🔍 bigFive:', JSON.stringify(geminiResults.bigFive));
            console.log('🔍 careerFit.clusters count:', geminiResults.careerFit?.clusters?.length);
            console.log('🔍 === END AI RESPONSE STRUCTURE ===');

            // Apply validation to correct RIASEC topThree and detect aptitude patterns
            const validatedResults = await applyValidation(geminiResults, answers, sectionTimings);

            // 🔧 CRITICAL FIX: Preserve adaptive results in validated results
            // The AI might not include adaptive results in its response, so we need to add them manually
            if (answers.adaptive_aptitude_results && !validatedResults.adaptiveAptitudeResults) {
                console.log('🔧 Adding adaptive results to validated results');
                validatedResults.adaptiveAptitudeResults = answers.adaptive_aptitude_results;
                validatedResults.adaptive_aptitude_results = answers.adaptive_aptitude_results;
            }

            // ✅ Save to database only (no localStorage)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Get the latest result and update it
                    const latestResult = await assessmentService.getLatestResult(user.id);
                    if (latestResult) {
                        // Extract individual scores from AI results for database columns
                        const updateData = {
                            gemini_results: validatedResults,
                            updated_at: new Date().toISOString()
                        };

                        // Include adaptive_aptitude_session_id if available from attempt
                        if (attempt?.adaptive_aptitude_session_id) {
                            updateData.adaptive_aptitude_session_id = attempt.adaptive_aptitude_session_id;
                            console.log('✅ Including adaptive_aptitude_session_id in update:', attempt.adaptive_aptitude_session_id);
                        }

                        // Extract and store individual score components
                        if (validatedResults.riasec) {
                            updateData.riasec_scores = validatedResults.riasec.scores;
                            updateData.riasec_code = validatedResults.riasec.code;
                        }
                        if (validatedResults.aptitude) {
                            updateData.aptitude_scores = validatedResults.aptitude.scores;
                            updateData.aptitude_overall = validatedResults.aptitude.overallScore;
                        }
                        if (validatedResults.bigFive) {
                            updateData.bigfive_scores = validatedResults.bigFive;
                        }
                        if (validatedResults.workValues) {
                            updateData.work_values_scores = validatedResults.workValues.scores;
                        }
                        if (validatedResults.employability) {
                            updateData.employability_scores = validatedResults.employability.skillScores;
                            updateData.employability_readiness = validatedResults.employability.overallReadiness;
                        }
                        if (validatedResults.knowledge) {
                            updateData.knowledge_score = validatedResults.knowledge.percentage;
                            updateData.knowledge_details = validatedResults.knowledge;
                        }
                        if (validatedResults.careerFit) {
                            updateData.career_fit = validatedResults.careerFit;
                        }
                        if (validatedResults.skillGap) {
                            updateData.skill_gap = validatedResults.skillGap;
                        }
                        if (validatedResults.roadmap) {
                            updateData.roadmap = validatedResults.roadmap;
                        }
                        if (validatedResults.profileSnapshot) {
                            updateData.profile_snapshot = validatedResults.profileSnapshot;
                        }
                        if (validatedResults.finalNote) {
                            updateData.final_note = validatedResults.finalNote;
                        }
                        if (validatedResults.overallSummary) {
                            updateData.overall_summary = validatedResults.overallSummary;
                        }

                        // 🔧 CRITICAL FIX: Ensure adaptive results are saved in gemini_results
                        // This is needed for the validation check and display
                        if (validatedResults.adaptiveAptitudeResults || validatedResults.adaptive_aptitude_results) {
                            console.log('✅ Including adaptive results in database save');
                            // Already in validatedResults, will be saved in gemini_results
                        }

                        // Update the existing result with new AI analysis
                        const { error: updateError } = await supabase
                            .from('personal_assessment_results')
                            .update(updateData)
                            .eq('id', latestResult.id);

                        if (updateError) {
                            console.warn('Could not update database result:', updateError.message);
                        } else {
                            console.log('✅ Database result updated with regenerated AI analysis');
                        }

                        // DISABLED: Course recommendation saving
                        // Courses are now generated on-demand when user clicks a job role
                        /*
                        // Save course recommendations
                        if (validatedResults.platformCourses && validatedResults.platformCourses.length > 0) {
                            try {
                                await saveRecommendations(
                                    user.id,
                                    validatedResults.platformCourses,
                                    latestResult.id,
                                    'assessment'
                                );
                            } catch (recError) {
                                console.log('Recommendations sync:', recError.message);
                            }
                        }
                        */
                    }
                }
            } catch (dbError) {
                console.log('Could not update database:', dbError.message);
            }

            // Update state with new results
            // Normalize results to fix data inconsistencies
            const normalizedResults = normalizeAssessmentResults(validatedResults);
            
            // ✅ CRITICAL FIX: Preserve raw database fields for debug panel
            // Note: In retry, we don't have the full database record, so we'll use what we have
            normalizedResults._rawDatabaseFields = {
                gemini_results: validatedResults.gemini_results || validatedResults,
                riasec_scores: validatedResults.riasec_scores,
                riasec_code: validatedResults.riasec?.code,
                aptitude_scores: validatedResults.aptitude_scores,
                bigfive_scores: validatedResults.bigfive_scores,
                career_fit: validatedResults.career_fit || validatedResults.careerFit,
                roadmap: validatedResults.roadmap,
                // Other fields may not be available in retry context
            };
            
            console.log('🔧 Assessment results normalized (retry):', {
                before: validatedResults.riasec?.scores,
                after: normalizedResults.riasec?.scores,
                hasRawDbFields: !!normalizedResults._rawDatabaseFields
            });
            setResults(normalizedResults);
            setError(null); // Clear error only on success
            setRetryCompleted(true); // Mark retry as completed to prevent re-triggering
            console.log('✅ AI analysis regenerated successfully');

            // Update studentInfo with actual stream_id from attempt
            if (stream) {
                console.log('📚 Updating studentInfo.stream with actual stream_id:', stream);
                streamFromAssessmentRef.current = stream; // Set ref to prevent fetchStudentInfo from overwriting
                setStudentInfo(prev => ({
                    ...prev,
                    stream: stream
                }));
            }

        } catch (e) {
            console.error('Regeneration failed:', e);

            // Provide user-friendly error message based on retry attempt count
            let errorMessage = e.message || 'Failed to regenerate report. Please try again.';

            if (retryAttemptCount >= 2) {
                // On 3rd attempt failure, suggest contacting support
                errorMessage = 'Unable to generate your report after multiple attempts. Please contact support or try again later.';
            } else if (retryAttemptCount >= 1) {
                // On 2nd attempt failure, provide more context
                errorMessage = `Analysis failed (Attempt ${retryAttemptCount + 1}/3). ${e.message || 'Please try again.'}`;
            }

            setError(errorMessage);
        } finally {
            // Mark retry as attempted in sessionStorage AFTER the retry completes (success or failure)
            // This fixes the React Strict Mode race condition - we only mark as attempted when done
            const attemptIdForMarker = searchParams.get('attemptId');
            if (attemptIdForMarker) {
                // Use attemptId since result.id may not be available in all cases
                sessionStorage.setItem(`auto_retry_done_attempt_${attemptIdForMarker}`, 'true');
                console.log('📝 Marked retry as completed for attempt:', attemptIdForMarker);
            }
            setRetrying(false);
            setLoading(false); // Ensure loading screen is dismissed
        }
    }, [searchParams, gradeLevel, studentInfo.grade, studentInfo.courseName]); // searchParams object itself is stable

    useEffect(() => {
        loadResults();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]); // Only run when searchParams changes

    // Auto-retry effect: Trigger handleRetry when autoRetry flag is set
    useEffect(() => {
        if (autoRetry && !retrying && !retryCompleted && !autoRetryInProgressRef.current) {
            // Check if max retry attempts reached
            if (retryAttemptCount >= 3) {
                console.error('❌ Auto-retry NOT triggered - max attempts (3) reached');
                setError('Maximum retry attempts reached. Please refresh the page or contact support if the issue persists.');
                setAutoRetry(false);
                return;
            }

            console.log('🤖 Auto-retry triggered - calling handleRetry...');
            console.log('   autoRetry:', autoRetry);
            console.log('   retrying:', retrying);
            console.log('   retryCompleted:', retryCompleted);
            console.log('   retryAttemptCount:', retryAttemptCount);
            console.log('   autoRetryInProgressRef.current:', autoRetryInProgressRef.current);

            // Record start time for timing measurement
            const startTime = Date.now();
            setAutoRetryStartTime(startTime);
            console.log('⏱️ Auto-retry start time:', new Date(startTime).toISOString());

            // Set flag to prevent concurrent attempts
            autoRetryInProgressRef.current = true;
            setAutoRetry(false); // Reset flag immediately to prevent loops

            // REMOVED TIMEOUT: Executing immediately to prevent cancellation on component unmount/update
            // (common in React Strict Mode or when dependencies change rapidly)
            console.log('🤖 Executing handleRetry immediately...');
            if (typeof handleRetry === 'function') {
                handleRetry().finally(() => {
                    // Reset the in-progress flag after retry completes (success or failure)
                    autoRetryInProgressRef.current = false;

                    // Calculate and log timing
                    const endTime = Date.now();
                    const duration = (endTime - startTime) / 1000; // Convert to seconds
                    console.log('⏱️ Auto-retry completed in', duration.toFixed(2), 'seconds');

                    // Verify timing requirement (should trigger within 2 seconds)
                    if (duration > 2) {
                        console.warn('⚠️ Auto-retry took longer than 2 seconds:', duration.toFixed(2), 'seconds');
                    } else {
                        console.log('✅ Auto-retry timing verified: completed within 2 seconds');
                    }
                });
            } else {
                console.error('❌ handleRetry is not a function');
                setError('Internal error: Retry mechanism failed.');
                autoRetryInProgressRef.current = false;
            }
        } else if (autoRetry) {
            console.log('⚠️ Auto-retry NOT triggered - conditions not met:');
            console.log('   autoRetry:', autoRetry);
            console.log('   retrying:', retrying);
            console.log('   retryCompleted:', retryCompleted);
            console.log('   autoRetryInProgressRef.current:', autoRetryInProgressRef.current);
        }
    }, [autoRetry, retrying, retryCompleted]); // Remove handleRetry from dependencies to prevent cleanup

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

            // For high school, after10, and higher secondary, check adaptive aptitude results
            // Aptitude Sampling is just a self-assessment, real aptitude comes from adaptive test
            if ((gradeLevel === 'highschool' || gradeLevel === 'after10' || gradeLevel === 'higher_secondary')) {
                // Check if adaptive aptitude results exist
                const hasAdaptiveResults = results.adaptiveAptitudeResults ||
                    results.adaptive_aptitude_results ||
                    results.adaptive_aptitude_session_id ||
                    (results.gemini_results && results.gemini_results.adaptiveAptitudeResults) ||
                    (results.aptitude && results.aptitude.adaptiveTest) ||
                    (results.aptitude && results.aptitude.adaptiveLevel);

                if (!hasAdaptiveResults) {
                    missingFields.push('Adaptive Aptitude Test');
                }
            }

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

    return useMemo(() => ({
        results,
        loading,
        error,
        retrying,
        retryAttemptCount, // Export retry attempt count for UI display
        gradeLevel, // Export grade level
        monthsInGrade, // Export months in grade for conditional display
        studentInfo,
        studentAcademicData, // Export academic data for course matching
        validationWarnings, // Export validation warnings for display
        handleRetry,
        validateResults,
        navigate,
        // Debug data - full database records
        attemptData: results?.attempt_data || null,
        resultData: results // The full result record
    }), [results, loading, error, retrying, retryAttemptCount, gradeLevel, monthsInGrade, studentInfo, studentAcademicData, validationWarnings, handleRetry, validateResults, navigate]);
};
