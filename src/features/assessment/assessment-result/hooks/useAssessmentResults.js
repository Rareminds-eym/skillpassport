import { useEffect, useState, useRef } from 'react';
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
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            console.log('📊 fetchStudentInfo - Current user ID:', user?.id);

            if (user) {
                // First, try to fetch student data with relationships
                // Query students table - skip relationships that don't exist
                let { data: studentData, error: fetchError } = await supabase
                    .from('students')
                    .select(`
                        id, 
                        name, 
                        registration_number,
                        grade,
                        year,
                        semester,
                        college_id, 
                        school_id,
                        school_class_id,
                        branch_field,
                        course_name,
                        grade_start_date
                    `)
                    .eq('user_id', user.id)
                    .maybeSingle();

                console.log('📊 fetchStudentInfo - Query error:', fetchError);
                console.log('📊 fetchStudentInfo - Raw studentData from database:', studentData);
                console.log('📊 fetchStudentInfo - grade field:', studentData?.grade);
                console.log('📊 fetchStudentInfo - school_id field:', studentData?.school_id);
                console.log('📊 fetchStudentInfo - college_id field:', studentData?.college_id);

                // If we got student data, fetch related college/school names separately
                if (studentData && !fetchError) {
                    if (studentData.college_id) {
                        const { data: orgData } = await supabase
                            .from('organizations')
                            .select('name')
                            .eq('id', studentData.college_id)
                            .maybeSingle();
                        if (orgData) {
                            studentData.colleges = { name: orgData.name };
                        }
                        console.log('📊 fetchStudentInfo - Fetched college name:', orgData?.name);
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

                    // Derive stream from branch_field or course_name
                    let derivedStream = localStorage.getItem('assessment_stream') || '—';
                    
                    // For middle/high school, use friendly labels
                    if (derivedStream === 'middle_school') {
                        derivedStream = 'Middle School (Grades 6-8)';
                    } else if (derivedStream === 'high_school' || derivedStream === 'highschool') {
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
                        college: institutionName,
                        school: schoolName,
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

                    localStorage.setItem('studentName', fullName);
                    localStorage.setItem('studentRegNo', rollNumber);
                    localStorage.setItem('collegeName', studentData.colleges?.name || '');
                    
                    // Fetch academic data (marks, projects, experiences)
                    await fetchStudentAcademicData(studentData.id);
                } else {
                    const rawName = user.user_metadata?.full_name || user.email?.split('@')[0] || '—';
                    const name = toTitleCase(rawName);
                    let streamLabel = localStorage.getItem('assessment_stream') || '—';
                    
                    // Convert stream IDs to friendly labels
                    if (streamLabel === 'middle_school') {
                        streamLabel = 'Middle School (Grades 6-8)';
                    } else if (streamLabel === 'high_school' || streamLabel === 'highschool') {
                        streamLabel = 'High School (Grades 9-10)';
                    } else if (streamLabel !== '—') {
                        streamLabel = streamLabel.toUpperCase();
                    }
                    
                    setStudentInfo(prev => ({
                        ...prev,
                        name: name,
                        stream: streamLabel
                    }));
                    localStorage.setItem('studentName', name);
                }
            }
        } catch (err) {
            console.error('Error fetching student info:', err);
            const storedName = localStorage.getItem('studentName') || '—';
            let streamLabel = localStorage.getItem('assessment_stream') || '—';
            
            // Convert stream IDs to friendly labels
            if (streamLabel === 'middle_school') {
                streamLabel = 'Middle School (Grades 6-8)';
            } else if (streamLabel === 'high_school' || streamLabel === 'highschool') {
                streamLabel = 'High School (Grades 9-10)';
            } else if (streamLabel !== '—') {
                streamLabel = streamLabel.toUpperCase();
            }
            
            setStudentInfo({
                name: toTitleCase(storedName),
                regNo: localStorage.getItem('studentRegNo') || '—',
                rollNumberType: 'school',
                college: localStorage.getItem('collegeName') || '—',
                school: '—',
                stream: streamLabel,
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
                
                // Check if we have a result record (even if AI analysis is missing)
                if (attempt?.results?.[0]) {
                    const result = attempt.results[0];
                    
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
                            console.log('   Will regenerate AI analysis from localStorage');
                            
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

                            // Clear localStorage to prevent stale data issues
                            localStorage.removeItem('assessment_gemini_results');
                            localStorage.setItem('assessment_gemini_results', JSON.stringify(validatedResults));

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
                        // Result exists but no AI analysis - this happens when Submit saves without AI
                        // Fall through to generate AI analysis from localStorage data
                        console.log('📊 Database result exists but missing AI analysis');
                        console.log('   Will generate AI analysis from localStorage (Submit → Auto-generate flow)');
                        
                        // Set grade level from attempt before falling through
                        if (attempt.grade_level) {
                            setGradeLevel(attempt.grade_level);
                            setGradeLevelFromAttempt(true);
                            gradeLevelFromAttemptRef.current = true;
                        }
                        
                        // Don't return - fall through to localStorage logic which will generate AI
                    }
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
                if (latestResult?.gemini_results && typeof latestResult.gemini_results === 'object' && Object.keys(latestResult.gemini_results).length > 0) {
                    const geminiResults = latestResult.gemini_results;
                    
                    // Validate that AI analysis is complete (has RIASEC scores with non-zero values)
                    const hasValidRiasec = geminiResults.riasec?.scores && 
                        Object.keys(geminiResults.riasec.scores).length > 0 &&
                        Object.values(geminiResults.riasec.scores).some(score => score > 0);
                    
                    if (!hasValidRiasec) {
                        console.log('⚠️ Latest result has gemini_results but RIASEC scores are empty/invalid');
                        console.log('   RIASEC scores:', geminiResults.riasec?.scores);
                        console.log('   Will regenerate AI analysis from localStorage');
                        
                        // Set grade level from result before falling through
                        if (latestResult.grade_level) {
                            setGradeLevel(latestResult.grade_level);
                            setGradeLevelFromAttempt(true);
                            gradeLevelFromAttemptRef.current = true;
                        }
                        
                        // Fall through to regenerate
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

                        // Sync localStorage with database results to prevent stale data
                        localStorage.removeItem('assessment_gemini_results');
                        localStorage.setItem('assessment_gemini_results', JSON.stringify(validatedResults));

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
                    console.log('No valid database results found, checking localStorage');
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
                    // Apply validation to correct RIASEC topThree and detect aptitude patterns
                    const validatedResults = applyValidation(geminiResults);
                    setResults(validatedResults);
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
                
                // Check if this is an AI assessment that needs questions from database
                const effectiveGradeLevel = storedGradeLevel || 'after12';
                const isAIAssessment = ['after10', 'after12', 'college', 'higher_secondary'].includes(effectiveGradeLevel);
                
                // Build question banks
                let questionBanks = {
                    riasecQuestions,
                    aptitudeQuestions: [], // Will be populated for AI assessments
                    bigFiveQuestions,
                    workValuesQuestions,
                    employabilityQuestions,
                    streamKnowledgeQuestions
                };
                
                // For middle school and high school, use their specific question sets
                if (effectiveGradeLevel === 'middle') {
                    // Import middle school questions dynamically
                    try {
                        const { 
                            interestExplorerQuestions, 
                            strengthsCharacterQuestions, 
                            learningPreferencesQuestions 
                        } = await import('../../data/questions/middleSchoolQuestions');
                        
                        // Override with grade-specific questions
                        questionBanks.riasecQuestions = interestExplorerQuestions || [];
                        questionBanks.bigFiveQuestions = strengthsCharacterQuestions || [];
                        questionBanks.streamKnowledgeQuestions = { 
                            [stream]: learningPreferencesQuestions || [] 
                        };
                        
                        console.log('✅ Loaded middle school question banks:', {
                            interest: interestExplorerQuestions?.length || 0,
                            strengths: strengthsCharacterQuestions?.length || 0,
                            learning: learningPreferencesQuestions?.length || 0
                        });
                    } catch (importErr) {
                        console.warn('Could not load middle school questions:', importErr.message);
                    }
                } else if (effectiveGradeLevel === 'highschool' || effectiveGradeLevel === 'higher_secondary') {
                    // Import high school questions dynamically
                    try {
                        const { 
                            highSchoolInterestQuestions, 
                            highSchoolStrengthsQuestions, 
                            highSchoolLearningQuestions 
                        } = await import('../../data/questions/middleSchoolQuestions');
                        
                        // Override with grade-specific questions
                        questionBanks.riasecQuestions = highSchoolInterestQuestions || [];
                        questionBanks.bigFiveQuestions = highSchoolStrengthsQuestions || [];
                        questionBanks.streamKnowledgeQuestions = { 
                            [stream]: highSchoolLearningQuestions || [] 
                        };
                        
                        console.log('✅ Loaded high school question banks:', {
                            interest: highSchoolInterestQuestions?.length || 0,
                            strengths: highSchoolStrengthsQuestions?.length || 0,
                            learning: highSchoolLearningQuestions?.length || 0
                        });
                    } catch (importErr) {
                        console.warn('Could not load high school questions:', importErr.message);
                    }
                }
                
                // For AI assessments, fetch questions from database for proper scoring
                if (isAIAssessment) {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                            const answerKeys = Object.keys(answers);
                            
                            // Fetch aptitude questions
                            const aptitudeAnswerKeys = answerKeys.filter(k => k.startsWith('aptitude_'));
                            if (aptitudeAnswerKeys.length > 0) {
                                console.log('📡 Fetching AI aptitude questions for re-analysis...');
                                const aiAptitudeQuestions = await fetchAIAptitudeQuestions(user.id, aptitudeAnswerKeys);
                                if (aiAptitudeQuestions.length > 0) {
                                    questionBanks.aptitudeQuestions = aiAptitudeQuestions;
                                    console.log(`✅ Loaded ${aiAptitudeQuestions.length} AI aptitude questions`);
                                }
                            }
                            
                            // Fetch knowledge questions
                            const knowledgeAnswerKeys = answerKeys.filter(k => k.startsWith('knowledge_'));
                            if (knowledgeAnswerKeys.length > 0) {
                                console.log('📡 Fetching AI knowledge questions for re-analysis...');
                                const aiKnowledgeQuestions = await fetchAIKnowledgeQuestions(user.id, knowledgeAnswerKeys);
                                if (aiKnowledgeQuestions.length > 0) {
                                    questionBanks.streamKnowledgeQuestions = { [stream]: aiKnowledgeQuestions };
                                    console.log(`✅ Loaded ${aiKnowledgeQuestions.length} AI knowledge questions`);
                                }
                            }
                        }
                    } catch (fetchErr) {
                        console.warn('Could not fetch AI questions for re-analysis:', fetchErr.message);
                    }
                }

                // Pass gradeLevel to get proper stream recommendations
                console.log('Re-analyzing with gradeLevel:', effectiveGradeLevel);
                const geminiResults = await analyzeAssessmentWithGemini(answers, stream, questionBanks, {}, effectiveGradeLevel);

                if (geminiResults) {
                    // Apply validation to correct RIASEC topThree and detect aptitude patterns
                    const sectionTimings = JSON.parse(localStorage.getItem('assessment_section_timings') || '{}');
                    const validatedResults = applyValidation(geminiResults, answers, sectionTimings);
                    localStorage.setItem('assessment_gemini_results', JSON.stringify(validatedResults));
                    
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
                            // First, check if there's a completed result that needs AI analysis
                            const latestResult = await assessmentService.getLatestResult(user.id);
                            if (latestResult && !latestResult.gemini_results) {
                                // Update the existing result with AI analysis
                                console.log('📊 Updating completed result with AI analysis');
                                
                                // Apply grade-level specific field filtering (same as assessmentService.js)
                                const isSimplifiedAssessment = effectiveGradeLevel === 'middle' || effectiveGradeLevel === 'highschool';
                                
                                // Clean gemini_results for simplified assessments
                                // Remove fields that don't exist in simplified assessments to prevent database triggers from extracting them
                                let cleanedGeminiResults = { ...validatedResults };
                                if (isSimplifiedAssessment) {
                                    delete cleanedGeminiResults.workValues;
                                    delete cleanedGeminiResults.employability;
                                    delete cleanedGeminiResults.knowledge;
                                    console.log('🧹 Cleaned gemini_results for simplified assessment (removed workValues, employability, knowledge)');
                                }
                                
                                const updateData = {
                                    gemini_results: cleanedGeminiResults,
                                    riasec_scores: validatedResults.riasec?.scores || null,
                                    riasec_code: validatedResults.riasec?.code || null,
                                    aptitude_scores: validatedResults.aptitude?.scores || null,
                                    aptitude_overall: validatedResults.aptitude?.overallScore ?? null,
                                    bigfive_scores: validatedResults.bigFive || null,
                                    // These fields are ONLY for comprehensive assessments (after10, after12, college, higher_secondary)
                                    work_values_scores: isSimplifiedAssessment ? null : (validatedResults.workValues?.scores || null),
                                    employability_scores: isSimplifiedAssessment ? null : (validatedResults.employability?.skillScores || null),
                                    employability_readiness: isSimplifiedAssessment ? null : (validatedResults.employability?.overallReadiness || null),
                                    knowledge_score: isSimplifiedAssessment ? null : (validatedResults.knowledge?.score ?? null),
                                    knowledge_details: isSimplifiedAssessment ? null : (validatedResults.knowledge || null),
                                    career_fit: validatedResults.careerFit || null,
                                    skill_gap: validatedResults.skillGap || null,
                                    skill_gap_courses: validatedResults.skillGapCourses || null,
                                    roadmap: validatedResults.roadmap || null,
                                    profile_snapshot: validatedResults.profileSnapshot || null,
                                    timing_analysis: validatedResults.timingAnalysis || null,
                                    final_note: validatedResults.finalNote || null,
                                    overall_summary: validatedResults.overallSummary || null,
                                    updated_at: new Date().toISOString()
                                };
                                
                                console.log('📊 Update data (grade:', effectiveGradeLevel, ', simplified:', isSimplifiedAssessment, '):');
                                console.log('  work_values_scores:', updateData.work_values_scores, isSimplifiedAssessment ? '(excluded for simplified)' : '');
                                console.log('  employability_scores:', updateData.employability_scores, isSimplifiedAssessment ? '(excluded for simplified)' : '');
                                console.log('  knowledge_score:', updateData.knowledge_score, isSimplifiedAssessment ? '(excluded for simplified)' : '');
                                
                                const { error: updateError } = await supabase
                                    .from('personal_assessment_results')
                                    .update(updateData)
                                    .eq('id', latestResult.id);
                                
                                if (updateError) {
                                    console.warn('Could not update database result:', updateError.message);
                                } else {
                                    console.log('✅ Database result updated with AI analysis');
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
                                        console.log('Course recommendations saved to database');
                                    } catch (recError) {
                                        console.warn('Could not save recommendations:', recError.message);
                                    }
                                }
                            } else {
                                // Fallback: Check if there's an in-progress attempt to complete
                                const inProgressAttempt = await assessmentService.getInProgressAttempt(user.id);
                                if (inProgressAttempt) {
                                    const completedAttempt = await assessmentService.completeAttempt(
                                        inProgressAttempt.id,
                                        user.id,
                                        stream,
                                        inProgressAttempt.grade_level || 'after12',
                                        validatedResults,
                                        sectionTimings
                                    );
                                    console.log('Results saved to database');
                                    
                                    // Save course recommendations to database
                                    if (validatedResults.platformCourses && validatedResults.platformCourses.length > 0) {
                                        try {
                                            // Get the assessment result ID
                                            const { data: resultData } = await supabase
                                                .from('personal_assessment_results')
                                                .select('id')
                                                .eq('attempt_id', inProgressAttempt.id)
                                                .maybeSingle();
                                            
                                            await saveRecommendations(
                                                user.id,
                                                validatedResults.platformCourses,
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
                        }
                    } catch (dbError) {
                        console.log('Could not save to database:', dbError.message);
                    }
                    
                    setResults(validatedResults);
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
            console.log('Stream:', stream);
            console.log('Grade Level:', storedGradeLevel);
            console.log('Answer keys:', Object.keys(answers));
            console.log('Total answers:', Object.keys(answers).length);
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
            
            // Force regenerate with AI - pass gradeLevel
            const geminiResults = await analyzeAssessmentWithGemini(answers, stream, questionBanks, {}, storedGradeLevel);
            
            if (!geminiResults) {
                throw new Error('AI analysis returned no results');
            }
            
            // Apply validation to correct RIASEC topThree and detect aptitude patterns
            const sectionTimings = JSON.parse(localStorage.getItem('assessment_section_timings') || '{}');
            const validatedResults = applyValidation(geminiResults, answers, sectionTimings);
            
            // Save to localStorage
            localStorage.setItem('assessment_gemini_results', JSON.stringify(validatedResults));
            
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
                                gemini_results: validatedResults,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', latestResult.id);
                        
                        if (updateError) {
                            console.warn('Could not update database result:', updateError.message);
                        } else {
                            console.log('Database result updated with regenerated AI analysis');
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
        validationWarnings, // Export validation warnings for display
        handleRetry,
        validateResults,
        navigate
    };
};
