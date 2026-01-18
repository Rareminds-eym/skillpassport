import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabaseClient';
import * as assessmentService from '../../../../services/assessmentService';
import { saveRecommendations } from '../../../../services/courseRecommendationService';
import { analyzeAssessmentWithGemini } from '../../../../services/geminiAssessmentService';
import { validateAssessmentResults } from '../utils/assessmentValidation';
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
    console.log('🔥🔥🔥 useAssessmentResults hook loaded - NEW CODE WITH FIXES 🔥🔥🔥');

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retrying, setRetrying] = useState(false);
    const [autoRetry, setAutoRetry] = useState(false); // Flag to trigger auto-retry
    const [retryCompleted, setRetryCompleted] = useState(false); // Flag to prevent re-triggering after successful retry
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
    const [validationWarnings, setValidationWarnings] = useState([]);

    // Helper function to apply validation to results
    const applyValidation = (geminiResults, rawAnswers = {}, sectionTimings = {}) => {
        const { results: validatedResults, warnings } = validateAssessmentResults(
            geminiResults,
            rawAnswers,
            sectionTimings
        );

        if (warnings.length > 0) {
            console.log('⚠️ Assessment validation warnings:', warnings);
            setValidationWarnings(warnings);
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
                        grade_start_date
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

                    // Determine student type
                    const isSchoolStudent = hasSchoolId || (isSchoolGrade && !hasCollegeId);
                    const isCollegeStudent = hasCollegeId || (isCollegeGrade && !hasSchoolId);

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
                            // Can't determine if it's school or college, so set both
                            schoolName = institutionName;
                            collegeName = institutionName;
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
                    if (studentData.school_id || studentData.schoolClassId) {
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
                    console.log('Derived gradeLevel from student data:', derivedGradeLevel, 'grade:', studentGrade, 'school_id:', studentData.school_id, 'college_id:', studentData.college_id, 'schoolClassId:', studentData.schoolClassId);

                    // Derive stream from branch_field or course_name (database only)
                    let derivedStream = '—';

                    // For middle/high school, use friendly labels
                    if (derivedGradeLevel === 'middle') {
                        derivedStream = 'Middle School (Grades 6-8)';
                    } else if (derivedGradeLevel === 'highschool' || derivedGradeLevel === 'higher_secondary') {
                        derivedStream = 'High School (Grades 9-10)';
                    }
                    // If we have branch_field or course_name, derive the stream
                    else if (studentData.branch_field || studentData.course_name) {
                        const fieldText = (studentData.branch_field || studentData.course_name || '').toLowerCase();

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
                        stream: derivedStream,
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
        console.log('🔥 loadResults called with attemptId:', attemptId);
        console.log('🔥 Full URL search params:', searchParams.toString());

        if (attemptId) {
            // Load results from database - ALWAYS prefer database over localStorage
            try {
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

                        // Validate that AI analysis is complete (has RIASEC scores)
                        const hasValidRiasec = geminiResults.riasec?.scores &&
                            Object.keys(geminiResults.riasec.scores).length > 0 &&
                            Object.values(geminiResults.riasec.scores).some(score => score > 0);

                        if (!hasValidRiasec) {
                            console.log('⚠️ Database result has gemini_results but RIASEC scores are empty/invalid');
                            console.log('   RIASEC scores:', geminiResults.riasec?.scores);
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
                            const validatedResults = applyValidation(geminiResults, attempt.all_responses || {});
                            setResults(validatedResults);

                            // Set grade level from attempt
                            if (attempt.grade_level) {
                                setGradeLevel(attempt.grade_level);
                                setGradeLevelFromAttempt(true);
                                gradeLevelFromAttemptRef.current = true; // Set ref synchronously to prevent race condition
                            }

                            // ✅ REMOVED: localStorage caching (database is source of truth)

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

                            setLoading(false);
                            return;
                        }
                    } else {
                        // Result exists but no AI analysis - AUTO-GENERATE IT!

                        // Check if we already tried auto-retrying this session
                        const retryKey = `auto_retry_done_${result.id}`;
                        const alreadyRetried = sessionStorage.getItem(retryKey);

                        if (retryCompleted || alreadyRetried) {
                            console.log('⏭️ Skipping auto-retry - already completed/attempted');

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
                        console.log('   gemini_results:', result.gemini_results);
                        console.log('   retryCompleted:', retryCompleted);
                        console.log('   🚀 Setting autoRetry flag to TRUE...');

                        // Set grade level from attempt
                        if (attempt.grade_level) {
                            setGradeLevel(attempt.grade_level);
                            setGradeLevelFromAttempt(true);
                            gradeLevelFromAttemptRef.current = true;
                        }

                        // Mark as attempted to prevent loops on remount
                        sessionStorage.setItem(retryKey, 'true');

                        // Set flag to trigger auto-retry (will be handled by useEffect)
                        // Keep loading=true so user sees "Generating Your Report" screen
                        setAutoRetry(true);
                        console.log('   ✅ autoRetry flag set to TRUE');
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

                    // Validate that AI analysis is complete (has RIASEC scores with non-zero values)
                    const hasValidRiasec = geminiResults.riasec?.scores &&
                        Object.keys(geminiResults.riasec.scores).length > 0 &&
                        Object.values(geminiResults.riasec.scores).some(score => score > 0);

                    if (!hasValidRiasec) {
                        console.log('⚠️ Latest result has gemini_results but RIASEC scores are empty/invalid');
                        console.log('   RIASEC scores:', geminiResults.riasec?.scores);
                        console.log('   Redirecting to assessment test...');

                        navigate('/student/assessment/test');
                        return;
                    } else {
                        console.log('Loaded results from database');
                        // Apply validation to correct RIASEC topThree and detect aptitude patterns
                        const validatedResults = applyValidation(geminiResults);
                        setResults(validatedResults);

                        // Set grade level from result
                        if (latestResult.grade_level) {
                            setGradeLevel(latestResult.grade_level);
                            setGradeLevelFromAttempt(true);
                            gradeLevelFromAttemptRef.current = true; // Set ref synchronously to prevent race condition
                        }

                        // ✅ REMOVED: localStorage caching (database is source of truth)

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

        // ✅ REMOVED: localStorage fallback (database is now single source of truth)
        // If no database results found, redirect to assessment test
        console.log('❌ No assessment results found in database');
        console.log('   Redirecting to assessment test page...');
        navigate('/student/assessment/test');
    };

    const handleRetry = useCallback(async () => {
        setRetrying(true);
        // Don't clear error yet - this keeps the ErrorState visible (with spinner)
        // instead of showing a blank screen while retrying

        try {
            // ✅ Get answers from database instead of localStorage
            const attemptId = searchParams.get('attemptId');

            if (!attemptId) {
                setError('No attempt ID found. Please retake the assessment.');
                setRetrying(false);
                return;
            }

            console.log('🔄 Regenerating AI analysis from database data');
            console.log('   Attempt ID:', attemptId);

            // Fetch attempt data from database
            const { data: attempt, error: attemptError } = await supabase
                .from('personal_assessment_attempts')
                .select('all_responses, stream_id, grade_level, section_timings')
                .eq('id', attemptId)
                .single();

            if (attemptError || !attempt) {
                console.error('Failed to fetch attempt:', attemptError);
                setError('Could not load assessment data. Please try again.');
                setRetrying(false);
                return;
            }

            const answers = attempt.all_responses;
            const stream = attempt.stream_id;
            const storedGradeLevel = attempt.grade_level || gradeLevel || 'after12';
            const sectionTimings = attempt.section_timings || {};

            if (!answers || !stream) {
                setError('Assessment data is incomplete. Please retake the assessment.');
                setRetrying(false);
                return;
            }

            console.log('   Stream:', stream);
            console.log('   Grade Level:', storedGradeLevel);
            console.log('   Total answers:', Object.keys(answers).length);

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
            // Use studentInfo that was already fetched earlier in the hook
            const studentContext = {
                rawGrade: studentInfo.grade || storedGradeLevel, // Use actual grade from studentInfo
                programName: studentInfo.courseName || null, // Use course name from studentInfo
                programCode: null, // Not available in retry context
                degreeLevel: extractDegreeLevel(studentInfo.grade || storedGradeLevel) // Extract from grade
            };

            console.log('📚 Retry Student Context:', studentContext);
            console.log('🎓 Extracted degree level:', studentContext.degreeLevel, 'from grade:', studentInfo.grade);

            // Force regenerate with AI - pass gradeLevel and student context
            const geminiResults = await analyzeAssessmentWithGemini(
                answers,
                stream,
                questionBanks,
                {}, // Empty timings in retry
                storedGradeLevel, // Pass grade level for proper scoring
                null, // preCalculatedScores (not available in retry)
                studentContext // Pass student context for enhanced recommendations
            );

            if (!geminiResults) {
                throw new Error('AI analysis returned no results');
            }

            // Apply validation to correct RIASEC topThree and detect aptitude patterns
            const validatedResults = applyValidation(geminiResults, answers, sectionTimings);

            // ✅ Save to database only (no localStorage)
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
                                gemini_results: validatedResults,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', latestResult.id);

                        if (updateError) {
                            console.warn('Could not update database result:', updateError.message);
                        } else {
                            console.log('✅ Database result updated with regenerated AI analysis');
                        }

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
                    }
                }
            } catch (dbError) {
                console.log('Could not update database:', dbError.message);
            }

            // Update state with new results
            setResults(validatedResults);
            setError(null); // Clear error only on success
            setRetryCompleted(true); // Mark retry as completed to prevent re-triggering
            console.log('✅ AI analysis regenerated successfully');

        } catch (e) {
            console.error('Regeneration failed:', e);
            setError(e.message || 'Failed to regenerate report. Please try again.');
        } finally {
            setRetrying(false);
            setLoading(false); // Ensure loading screen is dismissed
        }
    }, [searchParams, gradeLevel, studentInfo.grade, studentInfo.courseName]); // Use specific fields instead of whole object

    useEffect(() => {
        loadResults();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.get('attemptId')]); // Only run when attemptId changes

    // Auto-retry effect: Trigger handleRetry when autoRetry flag is set
    useEffect(() => {
        if (autoRetry && !retrying && !retryCompleted) {
            console.log('🤖 Auto-retry triggered - calling handleRetry...');
            console.log('   autoRetry:', autoRetry);
            console.log('   retrying:', retrying);
            console.log('   retryCompleted:', retryCompleted);
            setAutoRetry(false); // Reset flag immediately to prevent loops

            // Add a small delay to ensure state updates have propagated
            const retryTimer = setTimeout(() => {
                console.log('⏰ Executing handleRetry after delay...');
                handleRetry();
            }, 100);

            return () => clearTimeout(retryTimer);
        } else if (autoRetry) {
            console.log('⚠️ Auto-retry NOT triggered - conditions not met:');
            console.log('   autoRetry:', autoRetry);
            console.log('   retrying:', retrying);
            console.log('   retryCompleted:', retryCompleted);
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
        validationWarnings, // Export validation warnings for display
        handleRetry,
        validateResults,
        navigate
    };
};
