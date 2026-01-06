import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    BrainCircuit,
    Heart,
    Target,
    Clock,
    AlertCircle,
    Award,
    TrendingUp,
    Users,
    Code,
    Zap,
    Loader2,
    ArrowLeft,
    FlaskConical,
    BarChart3,
    BookOpen
} from 'lucide-react';
import { Button } from '../../components/Students/components/ui/button';
import { Card, CardContent } from '../../components/Students/components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/Students/components/ui/radio-group';
import { Label } from '../../components/Students/components/ui/label';

// Import question banks (fallback for offline/legacy mode)
import { riasecQuestions as fallbackRiasecQuestions } from './assessment-data/riasecQuestions';
import { getAllAptitudeQuestions, getModuleQuestionIndex, aptitudeModules } from './assessment-data/aptitudeQuestions';
import { bigFiveQuestions as fallbackBigFiveQuestions } from './assessment-data/bigFiveQuestions';
import { workValuesQuestions as fallbackWorkValuesQuestions } from './assessment-data/workValuesQuestions';
import { employabilityQuestions as fallbackEmployabilityQuestions, getCurrentEmployabilityModule } from './assessment-data/employabilityQuestions';
import { streamKnowledgeQuestions as fallbackStreamKnowledgeQuestions } from './assessment-data/streamKnowledgeQuestions';
import {
    interestExplorerQuestions,
    strengthsCharacterQuestions,
    learningPreferencesQuestions,
    strengthsRatingScale,
    highSchoolInterestQuestions,
    highSchoolStrengthsQuestions,
    highSchoolLearningQuestions,
    highSchoolAptitudeQuestions,
    highSchoolRatingScale,
    aptitudeRatingScale
} from './assessment-data/middleSchoolQuestions';

// Import Gemini assessment service
import { analyzeAssessmentWithGemini } from '../../services/geminiAssessmentService';

// Import AI question generation service for Aptitude & Knowledge
import { loadCareerAssessmentQuestions, STREAM_KNOWLEDGE_PROMPTS, normalizeStreamId } from '../../services/careerAssessmentAIService';

// Import database services
import { useAssessment } from '../../hooks/useAssessment';
import { useAuth } from '../../context/AuthContext';
import * as assessmentService from '../../services/assessmentService';

import { supabase } from '../../lib/supabaseClient';

// Helper function to determine grade level from student's grade
const getGradeLevelFromGrade = (grade) => {
    if (!grade) return null;
    
    // Handle program-based grades (UG, PG, Diploma, etc.)
    const upperGrade = grade.toUpperCase();
    if (upperGrade === 'UG' || upperGrade === 'UNDERGRADUATE') return 'after12';
    if (upperGrade === 'PG' || upperGrade === 'POSTGRADUATE') return 'after12'; // Post-graduation also uses after12 assessment
    if (upperGrade === 'DIPLOMA') return 'after10'; // Diploma can be after 10th
    if (upperGrade === 'CERTIFICATE') return 'after12';
    
    const gradeNum = parseInt(grade, 10);
    if (isNaN(gradeNum)) {
        // Handle non-numeric grades like "12th", "10th"
        const match = grade.match(/(\d+)/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num >= 6 && num <= 8) return 'middle';
            if (num >= 9 && num <= 12) return 'highschool';
        }
        return null;
    }
    if (gradeNum >= 6 && gradeNum <= 8) return 'middle';
    if (gradeNum >= 9 && gradeNum <= 12) return 'highschool';
    return null;
};

const AssessmentTest = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Database integration hook
    const {
        loading: dbLoading,
        currentAttempt,
        startAssessment,
        saveResponse: saveDbResponse,
        updateProgress,
        completeAssessment,
        checkInProgressAttempt,
        studentRecordId
    } = useAssessment();

    // State for questions loaded from database
    const [dbQuestions, setDbQuestions] = useState(null);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [questionsError, setQuestionsError] = useState(null);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [pendingAttempt, setPendingAttempt] = useState(null);
    const [checkingExistingAttempt, setCheckingExistingAttempt] = useState(true); // Start with checking
    const [initialCheckDone, setInitialCheckDone] = useState(false); // Prevent re-checking after initial load
    const [assessmentStarted, setAssessmentStarted] = useState(false); // Track if user has started an assessment

    // Lazy initialization from localStorage
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [gradeLevel, setGradeLevel] = useState(null); // 'middle' (6-8), 'highschool' (9-12), 'after12' (After 12th), or 'college'
    const [showGradeSelection, setShowGradeSelection] = useState(false); // Show grade level selection first
    const [studentStream, setStudentStream] = useState(null);
    const [showStreamSelection, setShowStreamSelection] = useState(false); // Start false, set true after check
    const [showCategorySelection, setShowCategorySelection] = useState(false); // Show Science/Commerce/Arts selection
    const [selectedCategory, setSelectedCategory] = useState(null); // 'science', 'commerce', 'arts'
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [useDatabase, setUseDatabase] = useState(false); // Track if using database mode

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Track if saving progress
    const [error, setError] = useState(null);
    const [showSectionIntro, setShowSectionIntro] = useState(true);
    const [showSectionComplete, setShowSectionComplete] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // Elapsed time for non-timed sections
    const [aptitudeQuestionTimer, setAptitudeQuestionTimer] = useState(60); // Per-question timer for first 30 aptitude questions
    const [aptitudePhase, setAptitudePhase] = useState('individual'); // 'individual' for first 30, 'shared' for last 20
    
    // TEST MODE - Auto-fill answers for development/testing
    const [testMode, setTestMode] = useState(false);
    const isDevMode = import.meta.env.DEV || window.location.hostname === 'localhost';
    // skillpassport.pages.dev shows all options, localhost and skilldevelopment.rareminds.in filter by grade
    const shouldShowAllOptions = window.location.hostname === 'skillpassport.pages.dev';
    const shouldFilterByGrade = window.location.hostname === 'localhost' || 
                                 window.location.hostname === 'skilldevelopment.rareminds.in';
    const [sectionTimings, setSectionTimings] = useState({}); // Track time spent on each section
    
    // Student grade from database
    const [studentGrade, setStudentGrade] = useState(null);
    const [studentSchoolClassId, setStudentSchoolClassId] = useState(null);
    const [studentId, setStudentId] = useState(null); // Student record ID for AI question saving
    const [isCollegeStudent, setIsCollegeStudent] = useState(false);
    const [studentProgram, setStudentProgram] = useState(null); // Program name for college students (BBA, BCA, BSC, etc.)
    const [gradeStartDate, setGradeStartDate] = useState(null); // When student started current grade
    const [monthsInGrade, setMonthsInGrade] = useState(null); // Months since starting current grade
    const [loadingStudentGrade, setLoadingStudentGrade] = useState(true);
    
    // Helper function to calculate months between two dates
    const calculateMonthsInGrade = (startDate) => {
        if (!startDate) return null;
        const start = new Date(startDate);
        const now = new Date();
        const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
        return Math.max(0, months);
    };
    
    // Fetch student's grade from database (either from student.grade or from school_classes.grade)
    useEffect(() => {
        const fetchStudentGrade = async () => {
            console.log('Fetching student grade for user:', user?.id, user?.email);
            console.log('shouldFilterByGrade:', shouldFilterByGrade);
            
            if (!user?.id) {
                console.log('No user id, skipping grade fetch');
                setLoadingStudentGrade(false);
                return;
            }
            
            try {
                // First try to get student by user_id with school_class grade and program name joined
                let { data: student, error } = await supabase
                    .from('students')
                    .select('id, grade, grade_start_date, school_class_id, school_id, university_college_id, program_id, course_name, school_classes:school_class_id(grade, academic_year), program:program_id(name, code)')
                    .eq('user_id', user.id)
                    .maybeSingle();
                
                console.log('Student by user_id:', student, error);
                
                // If not found by user_id, try by email
                if (!student && user.email) {
                    const result = await supabase
                        .from('students')
                        .select('id, grade, grade_start_date, school_class_id, school_id, university_college_id, program_id, course_name, school_classes:school_class_id(grade, academic_year), program:program_id(name, code)')
                        .eq('email', user.email)
                        .maybeSingle();
                    student = result.data;
                    error = result.error;
                    console.log('Student by email:', student, error);
                }
                
                if (error) {
                    console.error('Error fetching student grade:', error);
                } else if (student) {
                    console.log('Student grade data found:', student);
                    
                    // Save student ID for AI question saving
                    setStudentId(student.id);
                    
                    // Check if student is a college student (has university_college_id but no school_id)
                    const isCollege = student.university_college_id && !student.school_id;
                    console.log('Is college student:', isCollege);
                    setIsCollegeStudent(isCollege);
                    
                    // Set program name if available (BBA, BCA, BSC, etc.)
                    // Priority: program.name > program.code > course_name
                    const programName = student.program?.name || student.program?.code || student.course_name;
                    if (programName) {
                        console.log('Student program:', programName);
                        setStudentProgram(programName);
                    }
                    
                    // Set grade_start_date and calculate months in grade
                    if (student.grade_start_date) {
                        setGradeStartDate(student.grade_start_date);
                        const months = calculateMonthsInGrade(student.grade_start_date);
                        setMonthsInGrade(months);
                        console.log('Grade start date:', student.grade_start_date, 'Months in grade:', months);
                    } else if (student.school_classes?.academic_year) {
                        // Fallback: estimate from academic year (e.g., "2024-2025" -> started June 2024)
                        const academicYear = student.school_classes.academic_year;
                        const yearMatch = academicYear.match(/^(\d{4})/);
                        if (yearMatch) {
                            const startYear = parseInt(yearMatch[1]);
                            // Assume academic year starts in June
                            const estimatedStartDate = `${startYear}-06-01`;
                            const months = calculateMonthsInGrade(estimatedStartDate);
                            setMonthsInGrade(months);
                            console.log('Estimated from academic year:', academicYear, 'Months in grade:', months);
                        }
                    }
                    
                    // Use student.grade first, if not available use grade from school_classes
                    const effectiveGrade = student.grade || student.school_classes?.grade;
                    console.log('Effective grade:', effectiveGrade);
                    
                    setStudentGrade(effectiveGrade);
                    setStudentSchoolClassId(student.school_class_id);
                } else {
                    console.log('No student found for this user');
                }
            } catch (err) {
                console.error('Error fetching student grade:', err);
            } finally {
                setLoadingStudentGrade(false);
            }
        };
        
        fetchStudentGrade();
    }, [user?.id, user?.email, shouldFilterByGrade]);

    // Auto-fill all answers for test mode
    const autoFillAllAnswers = () => {
        if (!sections || sections.length === 0) return;
        
        const filledAnswers = {};
        
        sections.forEach(section => {
            section.questions.forEach(question => {
                const questionId = `${section.id}_${question.id}`;
                
                if (question.partType === 'sjt') {
                    // SJT questions need best and worst
                    const options = question.options || [];
                    if (options.length >= 2) {
                        filledAnswers[questionId] = {
                            best: options[0],
                            worst: options[options.length - 1]
                        };
                    }
                } else if (section.responseScale) {
                    // Likert scale - pick middle value (3)
                    filledAnswers[questionId] = 3;
                } else if (question.options && question.options.length > 0) {
                    // MCQ - pick first option (or correct if available for testing)
                    filledAnswers[questionId] = question.correct || question.options[0];
                }
            });
        });
        
        setAnswers(filledAnswers);
        console.log('Test Mode: Auto-filled', Object.keys(filledAnswers).length, 'answers');
    };

    // Skip to Aptitude section (section 5) - fills first 4 sections and jumps to aptitude
    const skipToAptitude = () => {
        if (!sections || sections.length === 0) return;
        
        const filledAnswers = {};
        
        // Only fill first 4 sections (RIASEC, Big Five, Work Values, Employability)
        sections.slice(0, 4).forEach(section => {
            section.questions.forEach(question => {
                const questionId = `${section.id}_${question.id}`;
                
                if (question.partType === 'sjt') {
                    const options = question.options || [];
                    if (options.length >= 2) {
                        filledAnswers[questionId] = {
                            best: options[0],
                            worst: options[options.length - 1]
                        };
                    }
                } else if (section.responseScale) {
                    filledAnswers[questionId] = 3;
                } else if (question.options && question.options.length > 0) {
                    filledAnswers[questionId] = question.correct || question.options[0];
                }
            });
        });
        
        setAnswers(filledAnswers);
        // Jump to section 5 (Aptitude - index 4)
        const aptitudeIndex = sections.findIndex(s => s.id === 'aptitude');
        if (aptitudeIndex >= 0) {
            setCurrentSectionIndex(aptitudeIndex);
            setCurrentQuestionIndex(0);
            setShowSectionIntro(true);
            setShowSectionComplete(false);
        }
        console.log('Test Mode: Skipped to Aptitude section, filled', Object.keys(filledAnswers).length, 'answers');
    };

    // Skip to Knowledge section (section 6) - fills first 5 sections and jumps to knowledge
    const skipToKnowledge = () => {
        if (!sections || sections.length === 0) return;
        
        const filledAnswers = {};
        
        // Fill first 5 sections (RIASEC, Big Five, Work Values, Employability, Aptitude)
        sections.slice(0, 5).forEach(section => {
            section.questions.forEach(question => {
                const questionId = `${section.id}_${question.id}`;
                
                if (question.partType === 'sjt') {
                    const options = question.options || [];
                    if (options.length >= 2) {
                        filledAnswers[questionId] = {
                            best: options[0],
                            worst: options[options.length - 1]
                        };
                    }
                } else if (section.responseScale) {
                    filledAnswers[questionId] = 3;
                } else if (question.options && question.options.length > 0) {
                    filledAnswers[questionId] = question.correct || question.options[0];
                }
            });
        });
        
        setAnswers(filledAnswers);
        // Jump to section 6 (Knowledge - index 5)
        const knowledgeIndex = sections.findIndex(s => s.id === 'knowledge');
        if (knowledgeIndex >= 0) {
            setCurrentSectionIndex(knowledgeIndex);
            setCurrentQuestionIndex(0);
            setShowSectionIntro(true);
            setShowSectionComplete(false);
        }
        console.log('Test Mode: Skipped to Knowledge section, filled', Object.keys(filledAnswers).length, 'answers');
    };

    // Skip to last section for quick testing
    const skipToLastSection = () => {
        autoFillAllAnswers();
        setCurrentSectionIndex(sections.length - 1);
        setCurrentQuestionIndex(sections[sections.length - 1].questions.length - 1);
        setShowSectionIntro(false);
        setShowSectionComplete(false);
    };

    // Load questions from database when stream is selected
    const loadQuestionsFromDatabase = async (streamId, gradeLevel) => {
        setQuestionsLoading(true);
        setQuestionsError(null);
        try {
            const allQuestions = await assessmentService.fetchAllQuestions(streamId, gradeLevel);
            console.log('Questions loaded from database:', allQuestions);
            setDbQuestions(allQuestions);
            setUseDatabase(true);
            return allQuestions;
        } catch (err) {
            console.error('Failed to load questions from database:', err);
            setQuestionsError(err.message);
            setUseDatabase(false);
            return null;
        } finally {
            setQuestionsLoading(false);
        }
    };

    // Check for in-progress attempt on mount (only once)
    useEffect(() => {
        // Only run once on mount, and not if user has already started an assessment
        if (initialCheckDone || assessmentStarted) return;

        const checkExistingAttempt = async () => {
            // Wait for auth hook to be ready and student ID to be loaded
            if (dbLoading || loadingStudentGrade) return;

            setCheckingExistingAttempt(true);

            try {
                // Use studentId (from students table) instead of user.id (auth user)
                if (studentId) {
                    // First check if user can take assessment (6-month restriction)
                    const eligibility = await assessmentService.canTakeAssessment(studentId);
                    
                    if (!eligibility.canTake) {
                        // User cannot take assessment yet
                        const nextDate = new Date(eligibility.nextAvailableDate);
                        const lastDate = new Date(eligibility.lastAttemptDate);
                        setError(`You can retake the assessment after ${nextDate.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}. Your last assessment was completed on ${lastDate.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}.`);
                        setCheckingExistingAttempt(false);
                        setInitialCheckDone(true);
                        return;
                    }

                    const existingAttempt = await checkInProgressAttempt();
                    if (existingAttempt) {
                        console.log('Found in-progress attempt:', existingAttempt);

                        // Check if user has actually answered any questions
                        const answeredCount = Object.keys(existingAttempt.restoredResponses || {}).length;
                        const hasProgress = existingAttempt.current_section_index > 0 ||
                            existingAttempt.current_question_index > 0 ||
                            answeredCount > 0;

                        if (hasProgress) {
                            // Show resume prompt only if there's actual progress
                            setPendingAttempt(existingAttempt);
                            setShowResumePrompt(true);
                            setShowStreamSelection(false);
                        } else {
                            // No real progress - abandon the empty attempt and start fresh
                            console.log('Empty attempt found, abandoning and starting fresh');
                            try {
                                await assessmentService.abandonAttempt(existingAttempt.id);
                            } catch (err) {
                                console.error('Error abandoning empty attempt:', err);
                            }
                            setShowGradeSelection(true);
                        }
                    } else {
                        // No existing attempt, show grade selection
                        setShowGradeSelection(true);
                    }
                } else if (!user?.id) {
                    // Not logged in, show grade selection
                    setShowGradeSelection(true);
                } else {
                    // User logged in but no student record found yet, wait
                    console.log('Waiting for student record to load...');
                }
            } catch (err) {
                console.error('Error checking for existing attempt:', err);
                setShowGradeSelection(true);
            } finally {
                setCheckingExistingAttempt(false);
                setInitialCheckDone(true);
            }
        };
        checkExistingAttempt();
    }, [studentId, user?.id, dbLoading, loadingStudentGrade, checkInProgressAttempt, initialCheckDone, assessmentStarted]);

    // Handle resume assessment
    const handleResumeAssessment = async () => {
        if (!pendingAttempt) return;

        // Mark that user has started an assessment to prevent re-checking
        setAssessmentStarted(true);
        setQuestionsLoading(true);
        setShowResumePrompt(false);

        try {
            setUseDatabase(true);
            setStudentStream(pendingAttempt.stream_id);

            // Restore grade level from pending attempt
            if (pendingAttempt.grade_level) {
                setGradeLevel(pendingAttempt.grade_level);
            }

            // Load questions for this stream and grade level
            await loadQuestionsFromDatabase(pendingAttempt.stream_id, pendingAttempt.grade_level);

            // Restore previous answers
            if (pendingAttempt.restoredResponses) {
                console.log('Restoring answers:', Object.keys(pendingAttempt.restoredResponses).length, 'answers');
                setAnswers(pendingAttempt.restoredResponses);
            }

            // Restore progress
            const sectionIdx = pendingAttempt.current_section_index ?? 0;
            const questionIdx = pendingAttempt.current_question_index ?? 0;

            console.log('Resuming at section:', sectionIdx, 'question:', questionIdx);

            setCurrentSectionIndex(sectionIdx);
            setCurrentQuestionIndex(questionIdx);

            // Don't show section intro when resuming - go directly to the question
            // Users have already seen the intro when they first started
            setShowSectionIntro(false);
            setShowSectionComplete(false);

            if (pendingAttempt.section_timings) {
                setSectionTimings(pendingAttempt.section_timings);
            }

            // Restore timer for timed sections (aptitude, knowledge)
            if (pendingAttempt.timer_remaining !== null && pendingAttempt.timer_remaining !== undefined) {
                console.log('Restoring timer:', pendingAttempt.timer_remaining, 'seconds remaining');
                setTimeRemaining(pendingAttempt.timer_remaining);
            }

            // Restore elapsed time for non-timed sections
            if (pendingAttempt.elapsed_time !== null && pendingAttempt.elapsed_time !== undefined) {
                console.log('Restoring elapsed time:', pendingAttempt.elapsed_time, 'seconds');
                setElapsedTime(pendingAttempt.elapsed_time);
            }
        } catch (err) {
            console.error('Error resuming assessment:', err);
            setShowStreamSelection(true);
        } finally {
            setQuestionsLoading(false);
        }
    };

    // Handle start new assessment (abandon previous)
    const handleStartNewAssessment = async () => {
        if (pendingAttempt?.id) {
            try {
                await assessmentService.abandonAttempt(pendingAttempt.id);
            } catch (err) {
                console.error('Error abandoning attempt:', err);
            }
        }
        setPendingAttempt(null);
        setShowResumePrompt(false);
        setShowGradeSelection(true);
    };

    // Transform database questions to match UI format
    const transformDbQuestion = (dbQ) => ({
        id: dbQ.id,
        text: dbQ.question_text,
        type: dbQ.question_type || dbQ.subtype,  // question_type for input type (multiselect, singleselect, rating, text)
        subtype: dbQ.subtype,                    // Used for aptitude categorization (verbal, numerical, etc.)
        moduleTitle: dbQ.module_title,
        options: dbQ.options,
        correct: dbQ.correct_answer,
        partType: dbQ.part_type,                 // For employability: 'selfRating' or 'sjt'
        scenario: dbQ.scenario,
        bestAnswer: dbQ.best_answer,
        worstAnswer: dbQ.worst_answer,
        maxSelections: dbQ.max_selections,       // For multiselect questions
        categoryMapping: dbQ.category_mapping,   // Maps options to RIASEC types (R,I,A,S,E,C)
        strengthType: dbQ.strength_type,         // For character strengths questions
        taskType: dbQ.task_type,                 // For aptitude task categorization
        placeholder: dbQ.placeholder             // For text input questions
    });

    // State for AI-generated questions (aptitude & knowledge for after12)
    const [aiQuestions, setAiQuestions] = useState({ aptitude: null, knowledge: null });
    const [aiQuestionsLoading, setAiQuestionsLoading] = useState(false);

    // Load AI questions for after12 AND college students
    useEffect(() => {
        const loadAIQuestions = async () => {
            // Only require gradeLevel and studentStream - studentId is optional for saving
            // Support both 'after12' and 'college' grade levels
            if ((gradeLevel === 'after12' || gradeLevel === 'college') && studentStream) {
                setAiQuestionsLoading(true);
                try {
                    console.log(`🤖 Loading AI questions for ${gradeLevel} student, stream:`, studentStream, 'studentId:', studentId || 'not set yet');
                    // Pass studentId and attemptId for save/resume functionality (optional)
                    const questions = await loadCareerAssessmentQuestions(
                        studentStream, 
                        gradeLevel, 
                        studentId || null, 
                        currentAttempt?.id || null
                    );
                    setAiQuestions(questions);
                    console.log('✅ AI questions loaded:', {
                        aptitude: questions.aptitude?.length || 0,
                        knowledge: questions.knowledge?.length || 0
                    });
                } catch (error) {
                    console.warn('Failed to load AI questions, will use fallback:', error);
                }
                setAiQuestionsLoading(false);
            }
        };
        loadAIQuestions();
    }, [gradeLevel, studentStream, studentId, currentAttempt?.id]);

    // Get questions for a section - from database or AI (no fallback for after12/college)
    const getQuestionsForSection = (sectionId) => {
        // Helper to normalize AI question format (AI uses 'question', UI expects 'text')
        const normalizeAIQuestion = (q) => ({
            ...q,
            text: q.question || q.text, // Map 'question' to 'text' for UI compatibility
            correct: q.correct_answer || q.correct // Map 'correct_answer' to 'correct'
        });

        // For after12 AND college grade levels, use AI questions ONLY for aptitude and knowledge
        if (gradeLevel === 'after12' || gradeLevel === 'college') {
            if (sectionId === 'aptitude') {
                if (aiQuestionsLoading) {
                    console.log('⏳ AI aptitude questions still loading...');
                    return []; // Return empty while loading
                }
                if (aiQuestions.aptitude?.length > 0) {
                    console.log('✅ Using AI-generated aptitude questions:', aiQuestions.aptitude.length);
                    return aiQuestions.aptitude.map(normalizeAIQuestion);
                }
                console.log('⚠️ No AI aptitude questions available yet');
                return []; // No fallback - wait for AI
            }
            if (sectionId === 'knowledge') {
                if (aiQuestionsLoading) {
                    console.log('⏳ AI knowledge questions still loading...');
                    return []; // Return empty while loading
                }
                if (aiQuestions.knowledge?.length > 0) {
                    console.log('✅ Using AI-generated knowledge questions:', aiQuestions.knowledge.length);
                    return aiQuestions.knowledge.map(normalizeAIQuestion);
                }
                console.log('⚠️ No AI knowledge questions available yet');
                return []; // No fallback - wait for AI
            }
        }

        // Try database questions for other sections
        if (dbQuestions && dbQuestions[sectionId]?.questions) {
            return dbQuestions[sectionId].questions.map(transformDbQuestion);
        }
        
        // Fallback to hardcoded questions for non-AI sections only
        switch (sectionId) {
            case 'riasec': return fallbackRiasecQuestions;
            case 'bigfive': return fallbackBigFiveQuestions;
            case 'values': return fallbackWorkValuesQuestions;
            case 'employability': return fallbackEmployabilityQuestions;
            default: return [];
        }
    };

    // Define assessment sections with dynamic questions
    const sections = useMemo(() => {
        // For middle school (grades 6-8), show simplified assessment with 3 sections
        // IMPORTANT: Section IDs must match database section names in personal_assessment_sections table
        if (gradeLevel === 'middle') {
            return [
                {
                    id: 'middle_interest_explorer',  // Matches database section name
                    title: 'Interest Explorer',
                    icon: <Heart className="w-6 h-6 text-rose-500" />,
                    description: "Let's discover what kinds of activities and subjects you enjoy most!",
                    color: "rose",
                    questions: getQuestionsForSection('middle_interest_explorer'),  // Load from database
                    instruction: "There are no right or wrong answers. Pick what feels most like you today."
                },
                {
                    id: 'middle_strengths_character',  // Matches database section name
                    title: 'Strengths & Character',
                    icon: <Award className="w-6 h-6 text-amber-500" />,
                    description: "Discover your personal strengths and character traits.",
                    color: "amber",
                    questions: getQuestionsForSection('middle_strengths_character'),  // Load from database
                    responseScale: strengthsRatingScale,
                    instruction: "Rate each statement: 1 = not like me, 2 = sometimes, 3 = mostly me, 4 = very me"
                },
                {
                    id: 'middle_learning_preferences',  // Matches database section name
                    title: 'Learning & Work Preferences',
                    icon: <Users className="w-6 h-6 text-blue-500" />,
                    description: "Learn about how you like to work and learn best.",
                    color: "blue",
                    questions: getQuestionsForSection('middle_learning_preferences'),  // Load from database
                    instruction: "Choose the options that best describe you."
                }
            ];
        }

        // For high school (grades 9-12), show detailed assessment with 4 sections
        if (gradeLevel === 'highschool') {
            return [
                {
                    id: 'hs_interest_explorer',
                    title: 'Interest Explorer',
                    icon: <Heart className="w-6 h-6 text-rose-500" />,
                    description: "Discover what activities and subjects truly excite you.",
                    color: "rose",
                    questions: getQuestionsForSection('hs_interest_explorer'),  // Load from database
                    instruction: "Answer honestly based on your real preferences, not what others expect."
                },
                {
                    id: 'hs_strengths_character',
                    title: 'Strengths & Character',
                    icon: <Award className="w-6 h-6 text-amber-500" />,
                    description: "Identify your personal strengths and character traits.",
                    color: "amber",
                    questions: getQuestionsForSection('hs_strengths_character'),  // Load from database
                    responseScale: highSchoolRatingScale,
                    instruction: "Rate each: 1 = not me, 2 = a bit, 3 = mostly, 4 = strongly me"
                },
                {
                    id: 'hs_learning_preferences',
                    title: 'Learning & Work Preferences',
                    icon: <Users className="w-6 h-6 text-blue-500" />,
                    description: "Understand how you work, learn, and contribute best.",
                    color: "blue",
                    questions: getQuestionsForSection('hs_learning_preferences'),  // Load from database
                    instruction: "Select the options that best describe you."
                },
                {
                    id: 'hs_aptitude_sampling',
                    title: 'Aptitude Sampling',
                    icon: <Zap className="w-6 h-6 text-purple-500" />,
                    description: "Rate your experience with different types of tasks.",
                    color: "purple",
                    questions: getQuestionsForSection('hs_aptitude_sampling'),  // Load from database
                    responseScale: aptitudeRatingScale,
                    instruction: "After each task, rate: Ease 1–4, Enjoyment 1–4"
                }
            ];
        }

        // For after 10th, after 12th and college, show full comprehensive assessment
        // Currently all use the same sections, but can be customized differently if needed
        if (gradeLevel === 'after10' || gradeLevel === 'after12' || gradeLevel === 'college') {
            return [
        {
            id: 'riasec',
            title: 'Career Interests',
            icon: <Heart className="w-6 h-6 text-rose-500" />,
            description: "Discover what types of work environments and activities appeal to you most.",
            color: "rose",
            questions: getQuestionsForSection('riasec'),
            responseScale: [
                { value: 1, label: "Strongly Dislike" },
                { value: 2, label: "Dislike" },
                { value: 3, label: "Neutral" },
                { value: 4, label: "Like" },
                { value: 5, label: "Strongly Like" }
            ],
            instruction: "Rate how much you would LIKE or DISLIKE each activity."
        },

        {
            id: 'bigfive',
            title: 'Big Five Personality',
            icon: <BrainCircuit className="w-6 h-6 text-purple-500" />,
            description: "Understand your work style, approach to tasks, and how you interact with others.",
            color: "purple",
            questions: getQuestionsForSection('bigfive'),
            responseScale: [
                { value: 1, label: "Very Inaccurate" },
                { value: 2, label: "Moderately Inaccurate" },
                { value: 3, label: "Neither" },
                { value: 4, label: "Moderately Accurate" },
                { value: 5, label: "Very Accurate" }
            ],
            instruction: "How accurately does each statement describe you?"
        },
        {
            id: 'values',
            title: 'Work Values & Motivators',
            icon: <Target className="w-6 h-6 text-indigo-500" />,
            description: "Identify what drives your career satisfaction and choices.",
            color: "indigo",
            questions: getQuestionsForSection('values'),
            responseScale: [
                { value: 1, label: "Not Important" },
                { value: 2, label: "Slightly Important" },
                { value: 3, label: "Moderately Important" },
                { value: 4, label: "Very Important" },
                { value: 5, label: "Extremely Important" }
            ],
            instruction: "How important is each factor in your ideal career?"
        },
        {
            id: 'employability',
            title: 'Employability Skills',
            icon: <TrendingUp className="w-6 h-6 text-green-500" />,
            description: "Assess your job-readiness and 21st-century skills.",
            color: "green",
            questions: getQuestionsForSection('employability'),
            responseScale: [
                { value: 1, label: "Not Like Me" },
                { value: 2, label: "Slightly" },
                { value: 3, label: "Somewhat" },
                { value: 4, label: "Mostly" },
                { value: 5, label: "Very Much Like Me" }
            ],
            instruction: "How well does each statement describe you?"
        },
        {
            id: 'aptitude',
            title: 'Multi-Aptitude',
            icon: <Zap className="w-6 h-6 text-amber-500" />,
            description: "Measure your cognitive strengths across verbal, numerical, logical, spatial, and clerical domains.",
            color: "amber",
            questions: getQuestionsForSection('aptitude'),
            isTimed: true,
            timeLimit: 15 * 60, // Fallback shared timer
            isAptitude: true,
            individualTimeLimit: 60, // 1 minute per question
            get individualQuestionCount() { return this.questions.length; }, // All questions have individual timers
            instruction: "Choose the correct answer. You have 1 minute per question."
        },
        {
            id: 'knowledge',
            title: 'Stream Knowledge',
            icon: <Code className="w-6 h-6 text-blue-500" />,
            description: "Test your understanding of core concepts in your field.",
            color: "blue",
            questions: getQuestionsForSection('knowledge'),
            isTimed: true,
            timeLimit: 30 * 60, // 30 minutes in seconds
            instruction: "Choose the best answer for each question."
        }
            ];
        }
        
        // Default: return empty array when no grade level is selected
        return [];
    }, [dbQuestions, studentStream, gradeLevel, aiQuestions, aiQuestionsLoading]);

    // Stream categories for After 12th
    const streamCategories = [
        { id: 'science', label: 'Science', icon: <FlaskConical className="w-7 h-7 text-blue-600" />, description: 'Engineering, Medical, Pure Sciences' },
        { id: 'commerce', label: 'Commerce', icon: <BarChart3 className="w-7 h-7 text-green-600" />, description: 'Business, Finance, Accounting' },
        { id: 'arts', label: 'Arts/Humanities', icon: <BookOpen className="w-7 h-7 text-purple-600" />, description: 'Literature, Social Sciences, Design' }
    ];

    // Streams grouped by category with RIASEC mappings for AI recommendations
    const streamsByCategory = {
        science: [
            { id: 'cs', label: 'B.Sc Computer Science / B.Tech CS/IT', riasec: ['I', 'C', 'R'], aptitudeStrengths: ['logical', 'numerical', 'abstract'] },
            { id: 'engineering', label: 'B.Tech / B.E (Other Engineering)', riasec: ['R', 'I', 'C'], aptitudeStrengths: ['numerical', 'spatial', 'logical'] },
            { id: 'medical', label: 'MBBS / BDS / Nursing', riasec: ['I', 'S', 'R'], aptitudeStrengths: ['verbal', 'logical', 'numerical'] },
            { id: 'pharmacy', label: 'B.Pharm / Pharm.D', riasec: ['I', 'C', 'S'], aptitudeStrengths: ['numerical', 'verbal', 'logical'] },
            { id: 'bsc', label: 'B.Sc (Physics/Chemistry/Biology/Maths)', riasec: ['I', 'R', 'C'], aptitudeStrengths: ['numerical', 'logical', 'abstract'] },
            { id: 'animation', label: 'B.Sc Animation / Game Design', riasec: ['A', 'I', 'R'], aptitudeStrengths: ['spatial', 'abstract', 'logical'] }
        ],
        commerce: [
            { id: 'bba', label: 'BBA General', riasec: ['E', 'S', 'C'], aptitudeStrengths: ['verbal', 'numerical', 'logical'] },
            { id: 'bca', label: 'BCA General', riasec: ['I', 'C', 'E'], aptitudeStrengths: ['logical', 'numerical', 'abstract'] },
            { id: 'dm', label: 'BBA Digital Marketing', riasec: ['E', 'A', 'S'], aptitudeStrengths: ['verbal', 'abstract', 'logical'] },
            { id: 'bcom', label: 'B.Com / B.Com (Hons)', riasec: ['C', 'E', 'I'], aptitudeStrengths: ['numerical', 'logical', 'verbal'] },
            { id: 'ca', label: 'CA / CMA / CS', riasec: ['C', 'I', 'E'], aptitudeStrengths: ['numerical', 'logical', 'verbal'] },
            { id: 'finance', label: 'BBA Finance / Banking', riasec: ['E', 'C', 'I'], aptitudeStrengths: ['numerical', 'logical', 'verbal'] }
        ],
        arts: [
            { id: 'ba', label: 'BA (English/History/Political Science)', riasec: ['S', 'A', 'I'], aptitudeStrengths: ['verbal', 'abstract', 'logical'] },
            { id: 'journalism', label: 'BA Journalism / Mass Communication', riasec: ['A', 'S', 'E'], aptitudeStrengths: ['verbal', 'abstract', 'logical'] },
            { id: 'design', label: 'B.Des / Fashion Design', riasec: ['A', 'R', 'E'], aptitudeStrengths: ['spatial', 'abstract', 'verbal'] },
            { id: 'law', label: 'BA LLB / BBA LLB', riasec: ['E', 'S', 'I'], aptitudeStrengths: ['verbal', 'logical', 'abstract'] },
            { id: 'psychology', label: 'BA/B.Sc Psychology', riasec: ['S', 'I', 'A'], aptitudeStrengths: ['verbal', 'logical', 'abstract'] },
            { id: 'finearts', label: 'BFA / Visual Arts', riasec: ['A', 'R', 'S'], aptitudeStrengths: ['spatial', 'abstract', 'verbal'] }
        ]
    };

    // Get streams based on selected category (for backward compatibility)
    const streams = selectedCategory ? streamsByCategory[selectedCategory] : [
        { id: 'cs', label: 'B.Sc Computer Science / B.Tech CS/IT' },
        { id: 'bca', label: 'BCA General' },
        { id: 'bba', label: 'BBA General' },
        { id: 'dm', label: 'BBA Digital Marketing' },
        { id: 'animation', label: 'B.Sc Animation' }
    ];

    // Calculate progress
    const currentSection = sections?.[currentSectionIndex];
    const totalQuestions = sections?.reduce((sum, section) => sum + section.questions.length, 0) || 0;
    const answeredCount = Object.keys(answers).length;
    const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    // Timer for timed sections
    // Persistence Effect


    // Scroll to top on question change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentSectionIndex, currentQuestionIndex, showStreamSelection, showSectionIntro, showSectionComplete]);

    // Determine aptitude phase based on question index
    useEffect(() => {
        if (currentSection?.isAptitude) {
            const individualCount = currentSection.individualQuestionCount || 30;
            if (currentQuestionIndex < individualCount) {
                setAptitudePhase('individual');
            } else {
                setAptitudePhase('shared');
            }
        }
    }, [currentSection?.isAptitude, currentQuestionIndex, currentSection?.individualQuestionCount]);

    // Reset per-question timer when moving to a new question in aptitude individual phase
    useEffect(() => {
        if (currentSection?.isAptitude && aptitudePhase === 'individual' && !showSectionIntro) {
            setAptitudeQuestionTimer(currentSection.individualTimeLimit || 60);
        }
    }, [currentSection?.isAptitude, aptitudePhase, currentQuestionIndex, showSectionIntro, currentSection?.individualTimeLimit]);

    // Initialize shared timer when entering aptitude shared phase
    useEffect(() => {
        if (currentSection?.isAptitude && aptitudePhase === 'shared' && timeRemaining === null) {
            setTimeRemaining(currentSection.timeLimit); // 15 minutes for last 20 questions
        }
    }, [currentSection?.isAptitude, aptitudePhase, timeRemaining, currentSection?.timeLimit]);

    // Timer for timed sections
    useEffect(() => {
        // Don't run timer if section intro or complete screen is showing
        if (currentSection?.isTimed && !showSectionIntro && !showSectionComplete) {
            // Aptitude section with individual timers for first 30 questions
            if (currentSection.isAptitude && aptitudePhase === 'individual') {
                const timer = setInterval(() => {
                    setAptitudeQuestionTimer(prev => {
                        if (prev <= 1) {
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
                return () => clearInterval(timer);
            }
            
            // Aptitude shared timer (last 20 questions) or other timed sections
            if (!currentSection.isAptitude || aptitudePhase === 'shared') {
                if (timeRemaining === null) {
                    setTimeRemaining(currentSection.timeLimit);
                }

                const timer = setInterval(() => {
                    setTimeRemaining(prev => {
                        if (prev === null) return currentSection.timeLimit;
                        if (prev <= 1) {
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                return () => clearInterval(timer);
            }
        } else if (!currentSection?.isTimed) {
            setTimeRemaining(null);
        }
    }, [currentSection?.id, currentSection?.isTimed, currentSection?.timeLimit, currentSection?.isAptitude, aptitudePhase, showSectionIntro, showSectionComplete]);

    // Handle timer expiry for aptitude individual questions
    useEffect(() => {
        if (currentSection?.isAptitude && aptitudePhase === 'individual' && aptitudeQuestionTimer === 0) {
            // Auto-advance to next question when individual timer expires
            if (currentQuestionIndex < currentSection.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setShowSectionComplete(true);
            }
        }
    }, [aptitudeQuestionTimer, currentSection?.isAptitude, aptitudePhase, currentQuestionIndex, currentSection?.questions?.length]);

    // Handle timer expiry for shared timer sections
    useEffect(() => {
        if (timeRemaining === 0 && currentSection?.isTimed) {
            // For aptitude, only handle shared phase expiry
            if (currentSection.isAptitude && aptitudePhase !== 'shared') {
                return;
            }
            handleNextSection();
        }
    }, [timeRemaining, currentSection?.isTimed, currentSection?.isAptitude, aptitudePhase]);

    // Elapsed time timer for non-timed sections
    useEffect(() => {
        // Only run elapsed timer for non-timed sections when not showing intro/complete screens
        if (!currentSection?.isTimed && !showSectionIntro && !showSectionComplete && !isSubmitting) {
            const timer = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [currentSection?.isTimed, showSectionIntro, showSectionComplete, isSubmitting]);

    // Reset elapsed time when section changes
    useEffect(() => {
        setElapsedTime(0);
    }, [currentSectionIndex]);

    // Periodically save timer/elapsed time (every 30 seconds)
    useEffect(() => {
        if (useDatabase && currentAttempt?.id && !showSectionIntro && !showSectionComplete) {
            const saveProgress = setInterval(() => {
                if (currentSection?.isTimed && timeRemaining !== null) {
                    console.log('Auto-saving timer:', timeRemaining);
                    updateProgress(currentSectionIndex, currentQuestionIndex, sectionTimings, timeRemaining, null);
                } else if (!currentSection?.isTimed && elapsedTime > 0) {
                    console.log('Auto-saving elapsed time:', elapsedTime);
                    updateProgress(currentSectionIndex, currentQuestionIndex, sectionTimings, null, elapsedTime);
                }
            }, 30000); // Save every 30 seconds

            return () => clearInterval(saveProgress);
        }
    }, [useDatabase, currentAttempt?.id, currentSection?.isTimed, timeRemaining, elapsedTime, currentSectionIndex, currentQuestionIndex, sectionTimings, updateProgress, showSectionIntro, showSectionComplete]);

    // Save progress when user leaves the page
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (useDatabase && currentAttempt?.id) {
                const timerToSave = currentSection?.isTimed ? timeRemaining : null;
                const elapsedToSave = !currentSection?.isTimed ? elapsedTime : null;
                console.log('Saving progress on page unload - timer:', timerToSave, 'elapsed:', elapsedToSave);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [useDatabase, currentAttempt?.id, currentSection?.isTimed, timeRemaining, elapsedTime, currentSectionIndex, currentQuestionIndex, sectionTimings]);

    // Handle grade level selection
    const handleGradeSelect = async (level) => {
        setGradeLevel(level);
        setShowGradeSelection(false);

        // For middle school and high school, skip stream selection and go directly to assessment
        if (level === 'middle') {
            setAssessmentStarted(true);
            const streamId = 'middle_school'; // Use a generic stream for middle school
            setStudentStream(streamId);

            // Load questions and create attempt for middle school
            await loadQuestionsFromDatabase(streamId, 'middle');

            if (studentRecordId) {
                try {
                    console.log('Creating assessment attempt with studentRecordId:', studentRecordId);
                    await startAssessment(streamId, 'middle');
                    setUseDatabase(true);
                } catch (err) {
                    console.log('Could not create database attempt:', err.message);
                }
            } else {
                console.log('No studentRecordId available, skipping database attempt creation');
            }

            setShowSectionIntro(true);
        } else if (level === 'highschool') {
            setAssessmentStarted(true);
            const streamId = 'high_school'; // Use a generic stream for high school
            setStudentStream(streamId);

            // Load questions and create attempt for high school
            await loadQuestionsFromDatabase(streamId, 'highschool');

            if (studentRecordId) {
                try {
                    console.log('Creating assessment attempt with studentRecordId:', studentRecordId);
                    await startAssessment(streamId, 'highschool');
                    setUseDatabase(true);
                } catch (err) {
                    console.log('Could not create database attempt:', err.message);
                }
            } else {
                console.log('No studentRecordId available, skipping database attempt creation');
            }

            setShowSectionIntro(true);
        } else if (level === 'after10') {
            // For after 10th, show category selection (Science/Commerce/Arts) similar to after12
            setShowCategorySelection(true);
        } else if (level === 'college') {
            // For college students (UG/PG), go directly to assessment using their program
            setAssessmentStarted(true);
            
            // Use student's program as the stream, normalize it to match STREAM_KNOWLEDGE_PROMPTS
            // Pass the original program name to normalizeStreamId (it handles the conversion)
            const streamId = normalizeStreamId(studentProgram || 'college');
            console.log(`🎓 College student stream: ${studentProgram} -> normalized: ${streamId}`);
            setStudentStream(streamId);

            // Load questions and create attempt for college
            await loadQuestionsFromDatabase(streamId, 'college');

            if (studentRecordId) {
                try {
                    await startAssessment(streamId, 'college');
                    setUseDatabase(true);
                } catch (err) {
                    console.log('Could not create database attempt:', err.message);
                }
            }

            setShowSectionIntro(true);
        } else {
            // For after 12th, show category selection (Science/Commerce/Arts)
            setShowCategorySelection(true);
        }
    };

    // Handle category selection (Science/Commerce/Arts)
    // After selecting category, go directly to assessment (no stream selection)
    const handleCategorySelect = async (categoryId) => {
        setSelectedCategory(categoryId);
        setShowCategorySelection(false);
        
        // Mark that user has started an assessment
        setAssessmentStarted(true);
        
        // Use category as the stream for now - specific course will be recommended after assessment
        const streamId = categoryId; // 'science', 'commerce', or 'arts'
        setStudentStream(streamId);

        // Load questions from database
        await loadQuestionsFromDatabase(streamId, gradeLevel || 'after12');

        setShowSectionIntro(true);

        // Try to create a database attempt if student record exists
        if (studentRecordId) {
            try {
                await startAssessment(streamId, gradeLevel || 'after12');
                setUseDatabase(true);
                console.log('Assessment attempt created in database for category:', categoryId);
            } catch (err) {
                console.log('Could not create database attempt, using localStorage mode:', err.message);
            }
        }
    };

    // handleStreamSelect is kept for backward compatibility but not used in new flow
    const handleStreamSelect = async (streamId) => {
        // Mark that user has started an assessment to prevent re-checking
        setAssessmentStarted(true);
        setStudentStream(streamId);
        setShowStreamSelection(false);

        // Load questions from database first
        await loadQuestionsFromDatabase(streamId, gradeLevel || 'after12');

        setShowSectionIntro(true);

        // Try to create a database attempt if student record exists
        if (studentRecordId) {
            try {
                await startAssessment(streamId, gradeLevel || 'after12');
                setUseDatabase(true);
                console.log('Assessment attempt created in database');
            } catch (err) {
                console.log('Could not create database attempt, using localStorage mode:', err.message);
                // Still use database for questions even if attempt creation fails
            }
        }
    };

    const handleStartSection = () => {
        setShowSectionIntro(false);
        setShowSectionComplete(false);
    };

    const handleAnswer = (value) => {
        const question = currentSection.questions[currentQuestionIndex];
        const questionId = `${currentSection.id}_${question.id}`;

        setAnswers(prev => {
            // If value is undefined or empty object, remove the answer
            if (value === undefined || (typeof value === 'object' && Object.keys(value).length === 0)) {
                const { [questionId]: removed, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [questionId]: value
            };
        });

        // Save to database if in database mode
        if (useDatabase && currentAttempt?.id) {
            // Determine if answer is correct for MCQ questions
            let isCorrect = null;
            if (currentSection.id === 'knowledge' || currentSection.id === 'aptitude') {
                isCorrect = value === question.correct;
            }
            saveDbResponse(currentSection.id, question.id, value, isCorrect);

            // Save current progress position, timer (for timed sections), and elapsed time (for non-timed)
            const timerToSave = currentSection.isTimed ? timeRemaining : null;
            const elapsedToSave = !currentSection.isTimed ? elapsedTime : null;
            updateProgress(currentSectionIndex, currentQuestionIndex, sectionTimings, timerToSave, elapsedToSave);
        }
    };

    const handleNext = async () => {
        if (currentQuestionIndex < currentSection.questions.length - 1) {
            const nextQuestionIndex = currentQuestionIndex + 1;

            // Save progress to database before moving to next question
            if (useDatabase && currentAttempt?.id) {
                setIsSaving(true);
                try {
                    const timerToSave = currentSection.isTimed ? timeRemaining : null;
                    const elapsedToSave = !currentSection.isTimed ? elapsedTime : null;

                    const result = await updateProgress(
                        currentSectionIndex,
                        nextQuestionIndex,
                        sectionTimings,
                        timerToSave,
                        elapsedToSave
                    );

                    if (!result?.success) {
                        console.error('Failed to save progress:', result?.error);
                        // Still proceed but log the error
                    }
                } catch (err) {
                    console.error('Error saving progress:', err);
                } finally {
                    setIsSaving(false);
                }
            }

            // Move to next question
            setCurrentQuestionIndex(nextQuestionIndex);
        } else {
            // Show section complete message before moving to next section
            if (currentSectionIndex < sections.length - 1) {
                setShowSectionComplete(true);
            } else {
                handleSubmit();
            }
        }
    };

    // Generate course recommendations based on assessment results
    const generateCourseRecommendations = (analysisResults) => {
        try {
            // Get all courses from all categories
            const allCourses = [
                ...streamsByCategory.science,
                ...streamsByCategory.commerce,
                ...streamsByCategory.arts
            ];

            if (allCourses.length === 0) return [];

            // Extract scores from analysis results
            const riasec = analysisResults?.riasec || {};
            const riasecScores = riasec.scores || {}; // { R: 15, I: 12, A: 8, ... }
            const riasecMaxScore = riasec.maxScore || 20;
            const riasecTopThree = riasec.topThree || []; // ['R', 'I', 'A']
            
            const aptitudeResults = analysisResults?.aptitude || {};
            const aptitudeScores = aptitudeResults.scores || {}; // { verbal: {percentage: 80}, numerical: {percentage: 70}, ... }
            const aptitudeTopStrengths = aptitudeResults.topStrengths || [];
            
            const bigFive = analysisResults?.bigFive || {};
            // Big Five scores are 0-5 scale
            
            console.log('📊 Generating recommendations with:', {
                riasecScores,
                riasecTopThree,
                aptitudeScores,
                aptitudeTopStrengths,
                bigFive
            });
            
            // Calculate match scores for each course
            const courseMatches = allCourses.map(course => {
                let matchScore = 0;
                let matchReasons = [];
                
                // RIASEC matching (40% weight)
                // Check if course's RIASEC types match student's top interests
                if (course.riasec && course.riasec.length > 0) {
                    let riasecMatchPoints = 0;
                    
                    course.riasec.forEach(type => {
                        const typeUpper = type.toUpperCase();
                        const score = riasecScores[typeUpper] || 0;
                        const percentage = (score / riasecMaxScore) * 100;
                        
                        // Bonus if this type is in student's top 3
                        if (riasecTopThree.includes(typeUpper)) {
                            riasecMatchPoints += percentage * 1.5; // 50% bonus for top 3
                        } else {
                            riasecMatchPoints += percentage;
                        }
                    });
                    
                    const avgRiasecMatch = riasecMatchPoints / course.riasec.length;
                    matchScore += avgRiasecMatch * 0.4;
                    
                    // Add reason if strong match
                    const matchingTopTypes = course.riasec.filter(type => 
                        riasecTopThree.includes(type.toUpperCase())
                    );
                    if (matchingTopTypes.length > 0) {
                        matchReasons.push(`Aligns with your ${matchingTopTypes.join(', ')} interests`);
                    }
                }
                
                // Aptitude matching (35% weight)
                if (course.aptitudeStrengths && course.aptitudeStrengths.length > 0) {
                    let aptitudeMatchPoints = 0;
                    
                    course.aptitudeStrengths.forEach(strength => {
                        const strengthLower = strength.toLowerCase();
                        const scoreData = aptitudeScores[strengthLower];
                        const percentage = scoreData?.percentage || 0;
                        
                        // Bonus if this is in student's top strengths
                        const isTopStrength = aptitudeTopStrengths.some(s => 
                            s.toLowerCase().includes(strengthLower) || strengthLower.includes(s.toLowerCase())
                        );
                        
                        if (isTopStrength) {
                            aptitudeMatchPoints += percentage * 1.3; // 30% bonus
                        } else {
                            aptitudeMatchPoints += percentage;
                        }
                    });
                    
                    const avgAptitudeMatch = aptitudeMatchPoints / course.aptitudeStrengths.length;
                    matchScore += avgAptitudeMatch * 0.35;
                    
                    // Add reason if strong aptitude match
                    if (avgAptitudeMatch > 60) {
                        matchReasons.push(`Strong aptitude in required skills`);
                    }
                }
                
                // Personality fit (25% weight)
                // Big Five scores are 0-5, convert to percentage
                const O = ((bigFive.O || 3) / 5) * 100; // Openness
                const C = ((bigFive.C || 3) / 5) * 100; // Conscientiousness
                const E = ((bigFive.E || 3) / 5) * 100; // Extraversion
                const A = ((bigFive.A || 3) / 5) * 100; // Agreeableness
                const N = ((bigFive.N || 3) / 5) * 100; // Neuroticism (lower is better for most careers)
                
                let personalityFit = 50; // Base score
                
                // Adjust based on course type
                if (course.id === 'cs' || course.id === 'bca' || course.id === 'engineering') {
                    // Tech/Engineering: High Openness, High Conscientiousness
                    personalityFit = (O * 0.4) + (C * 0.4) + ((100 - N) * 0.2);
                    if (O > 70) matchReasons.push('Your curiosity suits technical fields');
                } else if (course.id === 'bba' || course.id === 'dm' || course.id === 'finance') {
                    // Business: High Extraversion, High Conscientiousness
                    personalityFit = (E * 0.4) + (C * 0.3) + (A * 0.3);
                    if (E > 70) matchReasons.push('Your outgoing nature fits business roles');
                } else if (course.id === 'design' || course.id === 'finearts' || course.id === 'animation') {
                    // Creative: High Openness, Moderate Extraversion
                    personalityFit = (O * 0.5) + (E * 0.2) + ((100 - C) * 0.3); // Less structure-focused
                    if (O > 75) matchReasons.push('Your creativity aligns with design fields');
                } else if (course.id === 'medical' || course.id === 'pharmacy' || course.id === 'psychology') {
                    // Healthcare: High Agreeableness, High Conscientiousness
                    personalityFit = (A * 0.4) + (C * 0.4) + ((100 - N) * 0.2);
                    if (A > 70) matchReasons.push('Your empathy suits healthcare careers');
                } else if (course.id === 'law' || course.id === 'journalism') {
                    // Communication-heavy: High Extraversion, High Openness
                    personalityFit = (E * 0.35) + (O * 0.35) + (C * 0.3);
                } else if (course.id === 'bcom' || course.id === 'ca') {
                    // Accounting: High Conscientiousness, Lower Openness OK
                    personalityFit = (C * 0.5) + ((100 - N) * 0.3) + (A * 0.2);
                    if (C > 75) matchReasons.push('Your attention to detail suits accounting');
                } else {
                    // Default: balanced approach
                    personalityFit = (O * 0.25) + (C * 0.25) + (E * 0.2) + (A * 0.2) + ((100 - N) * 0.1);
                }
                
                matchScore += personalityFit * 0.25;
                
                // Ensure score is between 0-100
                matchScore = Math.min(100, Math.max(0, matchScore));
                
                // Determine category
                const category = streamsByCategory.science.find(s => s.id === course.id) ? 'Science' :
                                streamsByCategory.commerce.find(s => s.id === course.id) ? 'Commerce' : 'Arts';
                
                return {
                    courseId: course.id,
                    courseName: course.label,
                    matchScore: Math.round(matchScore),
                    matchLevel: matchScore >= 75 ? 'Excellent' : matchScore >= 60 ? 'Good' : matchScore >= 45 ? 'Fair' : 'Low',
                    reasons: matchReasons.slice(0, 3), // Max 3 reasons
                    category: category
                };
            });
            
            // Sort by match score and return top 5 recommendations
            const topRecommendations = courseMatches
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 5);
            
            console.log('✅ Top recommendations:', topRecommendations);
            return topRecommendations;
                
        } catch (error) {
            console.error('Error generating course recommendations:', error);
            return [];
        }
    };

    const handleNextSection = () => {
        // Save timing for current section before moving
        const currentSectionId = currentSection?.id;
        if (currentSectionId) {
            const timeSpent = currentSection.isTimed
                ? (currentSection.timeLimit - (timeRemaining || 0)) // For timed section, calculate used time
                : elapsedTime; // For non-timed sections, use elapsed time

            setSectionTimings(prev => {
                const newTimings = { ...prev, [currentSectionId]: timeSpent };
                // Update progress in database
                if (useDatabase && currentAttempt?.id) {
                    updateProgress(currentSectionIndex + 1, 0, newTimings);
                }
                return newTimings;
            });
        }

        setShowSectionComplete(false);
        if (currentSectionIndex < sections.length - 1) {
            setCurrentSectionIndex(prev => prev + 1);
            setCurrentQuestionIndex(0);
            setTimeRemaining(null);
            setShowSectionIntro(true);
        } else {
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        // Only allow going back within the current section, not to previous sections
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
        // Removed: going back to previous sections is not allowed
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        // Capture final section timing (knowledge section)
        const finalTimings = { ...sectionTimings };
        const currentSectionId = currentSection?.id;
        if (currentSectionId && !finalTimings[currentSectionId]) {
            const timeSpent = currentSection.isTimed
                ? (currentSection.timeLimit - (timeRemaining || 0))
                : elapsedTime;
            finalTimings[currentSectionId] = timeSpent;
        }

        try {
            // Save answers and timings to localStorage (for backward compatibility)
            localStorage.setItem('assessment_answers', JSON.stringify(answers));
            localStorage.setItem('assessment_stream', studentStream);
            localStorage.setItem('assessment_section_timings', JSON.stringify(finalTimings));
            // Clear any previous results
            localStorage.removeItem('assessment_gemini_results');

            // Prepare question banks for Gemini analysis
            // Use database questions if available, otherwise fallback to hardcoded
            // IMPORTANT: Section names must match grade level
            const getSectionId = (baseSection) => {
                if (gradeLevel === 'middle') {
                    const map = { 'riasec': 'middle_interest_explorer', 'bigfive': 'middle_strengths_character', 'knowledge': 'middle_learning_preferences' };
                    return map[baseSection] || baseSection;
                } else if (gradeLevel === 'highschool') {
                    const map = { 'riasec': 'hs_interest_explorer', 'aptitude': 'hs_aptitude_sampling', 'bigfive': 'hs_strengths_character', 'knowledge': 'hs_learning_preferences' };
                    return map[baseSection] || baseSection;
                }
                return baseSection; // after12 uses default section names
            };

            const questionBanks = {
                riasecQuestions: getQuestionsForSection(getSectionId('riasec')),
                aptitudeQuestions: getQuestionsForSection(getSectionId('aptitude')),
                bigFiveQuestions: getQuestionsForSection(getSectionId('bigfive')),
                workValuesQuestions: getQuestionsForSection('values'),
                employabilityQuestions: getQuestionsForSection('employability'),
                streamKnowledgeQuestions: { [studentStream]: getQuestionsForSection(getSectionId('knowledge')) }
            };

            // Analyze with Gemini AI - this is required, no fallback
            const geminiResults = await analyzeAssessmentWithGemini(
                answers,
                studentStream,
                questionBanks,
                finalTimings, // Pass section timings to Gemini
                gradeLevel // Pass grade level for proper scoring
            );

            if (geminiResults) {
                // Add course recommendations for after12 students
                if (gradeLevel === 'after12') {
                    geminiResults.courseRecommendations = generateCourseRecommendations(geminiResults);
                    console.log('✅ Course recommendations generated:', geminiResults.courseRecommendations);
                }

                // Save AI-analyzed results to localStorage (backward compatibility)
                localStorage.setItem('assessment_gemini_results', JSON.stringify(geminiResults));
                console.log('Gemini analysis complete:', geminiResults);

                // Save results to database
                console.log('=== Database Save Debug ===');
                console.log('useDatabase:', useDatabase);
                console.log('currentAttempt:', currentAttempt);
                console.log('currentAttempt?.id:', currentAttempt?.id);
                console.log('user?.id:', user?.id);
                
                // Get attempt ID - either from currentAttempt or fetch the latest in-progress attempt
                let attemptId = currentAttempt?.id;
                
                if (!attemptId && user?.id) {
                    console.log('No currentAttempt, fetching latest attempt from database...');
                    try {
                        const { data: latestAttempt } = await supabase
                            .from('personal_assessment_attempts')
                            .select('id, stream_id, grade_level')
                            .eq('student_id', user.id)
                            .eq('status', 'in_progress')
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .single();
                        
                        if (latestAttempt) {
                            attemptId = latestAttempt.id;
                            console.log('Found latest attempt:', attemptId);
                        }
                    } catch (fetchErr) {
                        console.log('Could not fetch latest attempt:', fetchErr.message);
                    }
                }
                
                // Save to database if we have an attempt
                if (attemptId) {
                    try {
                        console.log('Attempting to save results to database with attemptId:', attemptId);
                        
                        // If currentAttempt is null, call completeAttempt directly
                        if (currentAttempt?.id) {
                            const dbResults = await completeAssessment(geminiResults, finalTimings);
                            console.log('✅ Results saved to database via hook:', dbResults);
                        } else {
                            // Direct call to assessmentService
                            const dbResults = await assessmentService.completeAttempt(
                                attemptId,
                                user.id,
                                studentStream,
                                gradeLevel || 'after12',
                                geminiResults,
                                finalTimings
                            );
                            console.log('✅ Results saved to database directly:', dbResults);
                        }
                        
                        // Navigate with attemptId for database retrieval
                        navigate(`/student/assessment/result?attemptId=${attemptId}`);
                    } catch (dbErr) {
                        console.error('❌ Failed to save to database:', dbErr);
                        console.error('Error details:', {
                            message: dbErr.message,
                            code: dbErr.code,
                            details: dbErr.details,
                            hint: dbErr.hint
                        });
                        // Still navigate to results (localStorage has the data)
                        navigate('/student/assessment/result');
                    }
                } else {
                    console.log('No attemptId available, navigating without database save');
                    navigate('/student/assessment/result');
                }
            } else {
                throw new Error('AI analysis returned no results. Please check your API key configuration.');
            }
        } catch (err) {
            console.error('Error submitting assessment:', err);
            setIsSubmitting(false);
            setError(err.message || 'Failed to analyze assessment with AI. Please try again.');
        }
    };

    const currentQuestion = currentSection?.questions[currentQuestionIndex];
    const questionId = `${currentSection?.id}_${currentQuestion?.id}`;

    // Check if current question is answered (SJT needs both BEST and WORST, multiselect needs required count, text needs content)
    const isCurrentAnswered = (() => {
        const answer = answers[questionId];
        if (!answer) return false;
        // For SJT questions, both best and worst must be selected
        if (currentQuestion?.partType === 'sjt') {
            return answer.best && answer.worst;
        }
        // For multiselect questions, check if required number of selections made
        if (currentQuestion?.type === 'multiselect') {
            return Array.isArray(answer) && answer.length === currentQuestion.maxSelections;
        }
        // For text questions, check if there's some content (at least 10 characters for meaningful response)
        if (currentQuestion?.type === 'text') {
            return typeof answer === 'string' && answer.trim().length >= 10;
        }
        return true;
    })();

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Format elapsed time with hours if needed
    const formatElapsedTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Unified loading screen - clean and simple
    // Only show loading for initial check and questions loading, not for dbLoading during assessment
    const showLoading = checkingExistingAttempt || questionsLoading || (!assessmentStarted && dbLoading);
    if (showLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show restriction message if user cannot take assessment
    if (error && !showStreamSelection && !showResumePrompt && !assessmentStarted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    {/* Header with Icon */}
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Not Available</h2>
                        <p className="text-gray-600 text-sm">You need to wait before taking the assessment again</p>
                    </div>

                    {/* Warning Message Box */}
                    <div className="bg-slate-300 rounded-lg p-4 mb-4 border border-slate-100">
                        <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-800 leading-relaxed">{error}</p>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-slate-100">
                        <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-gray-700">
                                <p className="font-semibold text-slate-900 mb-1.5">Why the 6-month waiting period?</p>
                                <p className="leading-relaxed">The career assessment is designed to track your growth and development over time. Taking it too frequently won't provide meaningful insights. Use this time to work on your skills and gain new experiences!</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2.5">
                        <Button
                            onClick={() => navigate('/student/assessment/result')}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-sm font-medium rounded-lg transition-colors"
                        >
                            <Target className="w-4 h-4 mr-2" />
                            View Your Last Report
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/student/dashboard')}
                            className="w-full py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Resume Prompt Screen - shown when user has an in-progress assessment
    if (showResumePrompt && pendingAttempt) {
        const streamLabel = streams.find(s => s.id === pendingAttempt.stream_id)?.label || pendingAttempt.stream_id;
        const answeredCount = Object.keys(pendingAttempt.restoredResponses || {}).length;

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg border-none shadow-2xl">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Clock className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Continue Your Assessment?</h2>
                            <p className="text-gray-600">You have an incomplete assessment</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Stream:</span>
                                <span className="font-medium text-gray-800">{streamLabel}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Questions Answered:</span>
                                <span className="font-medium text-gray-800">{answeredCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Started:</span>
                                <span className="font-medium text-gray-800">
                                    {new Date(pendingAttempt.started_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={handleResumeAssessment}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-6 text-lg shadow-lg"
                            >
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Continue Assessment
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleStartNewAssessment}
                                className="w-full py-4 text-gray-600 hover:text-red-600 hover:border-red-200"
                            >
                                Start Fresh (Discard Progress)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Grade Level Selection Screen
    if (showGradeSelection) {
        // Determine which grade level to show based on student's grade
        const detectedGradeLevel = getGradeLevelFromGrade(studentGrade);
        
        // Check if student has incomplete profile (no grade and not college student)
        const hasIncompleteProfile = shouldFilterByGrade && !detectedGradeLevel && !isCollegeStudent;
        
        // Show loading while fetching student grade (only when filtering)
        if (loadingStudentGrade && shouldFilterByGrade) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
            );
        }
        
        // Show message to complete profile if no grade/class info
        if (hasIncompleteProfile) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl border-none shadow-2xl">
                        <CardContent className="p-8">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <AlertCircle className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">Complete Your Profile</h1>
                                <p className="text-gray-600">Please update your personal information to take the assessment</p>
                            </div>

                            <div className="bg-amber-50 rounded-xl p-6 mb-6 border border-amber-200">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-amber-800 mb-2">Missing Information</p>
                                        <p className="text-sm text-amber-700">
                                            We couldn't determine your grade level or class. Please go to your profile settings and update your:
                                        </p>
                                        <ul className="text-sm text-amber-700 mt-2 list-disc list-inside space-y-1">
                                            <li>Grade/Class information (for school students)</li>
                                            <li>College/University details (for college students)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => navigate('/student/settings')}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-6 text-lg shadow-lg"
                            >
                                Go to Profile Settings
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={() => navigate('/student/dashboard')}
                                className="w-full mt-3 py-4"
                            >
                                Back to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }
        
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl border-none shadow-2xl">
                    <CardContent className="p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Award className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Career Assessment</h1>
                            <p className="text-gray-600">Select your grade level to get started</p>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-gray-700">Choose Your Grade Level</Label>

                            {/* Grades 6-8 (Middle School) - Show if: show all OR not filtering OR grade is 6-8 */}
                            {(shouldShowAllOptions || !shouldFilterByGrade || detectedGradeLevel === 'middle') && (
                            <button
                                onClick={() => handleGradeSelect('middle')}
                                className="w-full p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 text-left group transform hover:-translate-y-1 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">Grades 6–8</h3>
                                        <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 group-hover:text-gray-700">Middle School Students</p>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>Assessment: 20 questions (15-20 minutes)</span>
                                    </div>
                                </div>
                            </button>
                            )}

                            {/* Grades 9-12 (High School) - Show if: show all OR not filtering OR grade is 9/11 OR (grade is 10 AND less than 6 months) OR (grade is 12 AND less than 6 months) */}
                            {(shouldShowAllOptions || !shouldFilterByGrade || 
                              (detectedGradeLevel === 'highschool' && !(studentGrade === '10' || studentGrade === '10th' || studentGrade === '12' || studentGrade === '12th')) ||
                              (detectedGradeLevel === 'highschool' && (studentGrade === '10' || studentGrade === '10th') && monthsInGrade !== null && monthsInGrade < 6) ||
                              (detectedGradeLevel === 'highschool' && (studentGrade === '12' || studentGrade === '12th') && monthsInGrade !== null && monthsInGrade < 6)
                            ) && (
                            <button
                                onClick={() => handleGradeSelect('highschool')}
                                className="w-full p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 text-left group transform hover:-translate-y-1 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">Grades 9–12</h3>
                                        <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 group-hover:text-gray-700">High School Students</p>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>Assessment: 32 questions (30-40 minutes)</span>
                                    </div>
                                    {/* Show months info for grade 12 students */}
                                    {(studentGrade === '12' || studentGrade === '12th') && monthsInGrade !== null && monthsInGrade < 6 && (
                                        <div className="mt-2 text-xs text-indigo-600 font-medium">
                                            {monthsInGrade} month{monthsInGrade !== 1 ? 's' : ''} in 12th grade
                                        </div>
                                    )}
                                    {/* Show months info for grade 10 students */}
                                    {(studentGrade === '10' || studentGrade === '10th') && monthsInGrade !== null && monthsInGrade < 6 && (
                                        <div className="mt-2 text-xs text-indigo-600 font-medium">
                                            {monthsInGrade} month{monthsInGrade !== 1 ? 's' : ''} in 10th grade
                                        </div>
                                    )}
                                </div>
                            </button>
                            )}

                            {/* After 10th - Show if: show all OR not filtering OR (grade is 10 AND 6+ months in grade) */}
                            {(shouldShowAllOptions || !shouldFilterByGrade || 
                              (detectedGradeLevel === 'highschool' && (studentGrade === '10' || studentGrade === '10th') && (monthsInGrade === null || monthsInGrade >= 6))
                            ) && (
                            <button
                                onClick={() => handleGradeSelect('after10')}
                                className="w-full p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 text-left group transform hover:-translate-y-1 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">After 10th</h3>
                                        <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 group-hover:text-gray-700">Students who have completed 10th grade</p>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>Assessment: (30-40 minutes)</span>
                                    </div>
                                    {/* Show months info for grade 10 students */}
                                    {(studentGrade === '10' || studentGrade === '10th') && monthsInGrade !== null && monthsInGrade >= 6 && (
                                        <div className="mt-2 text-xs text-green-600 font-medium">
                                            {monthsInGrade} month{monthsInGrade !== 1 ? 's' : ''} in 10th grade - Ready for stream selection!
                                        </div>
                                    )}
                                </div>
                            </button>
                            )}

                            {/* After 12th - Show if: show all OR not filtering OR (grade is 12 AND 6+ months in grade) */}
                            {(shouldShowAllOptions || !shouldFilterByGrade || 
                              (detectedGradeLevel === 'highschool' && (studentGrade === '12' || studentGrade === '12th') && (monthsInGrade === null || monthsInGrade >= 6))
                            ) && (
                            <button
                                onClick={() => handleGradeSelect('after12')}
                                className="w-full p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 text-left group transform hover:-translate-y-1 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">After 12th</h3>
                                        <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 group-hover:text-gray-700">Students who have completed 12th grade</p>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>Assessment: (35-45 minutes)</span>
                                    </div>
                                    {/* Show months info for grade 12 students */}
                                    {(studentGrade === '12' || studentGrade === '12th') && monthsInGrade !== null && monthsInGrade >= 6 && (
                                        <div className="mt-2 text-xs text-green-600 font-medium">
                                            {monthsInGrade} month{monthsInGrade !== 1 ? 's' : ''} in 12th grade - Ready for career planning!
                                        </div>
                                    )}
                                </div>
                            </button>
                            )}

                            {/* College (UG/PG) - Show if: show all OR not filtering OR is college student (UG/PG grade) */}
                            {(shouldShowAllOptions || !shouldFilterByGrade || isCollegeStudent || 
                              detectedGradeLevel === 'after12'
                            ) && (
                            <button
                                onClick={() => handleGradeSelect('college')}
                                className="w-full p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 text-left group transform hover:-translate-y-1 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">
                                            {studentProgram ? studentProgram : 'College'}
                                        </h3>
                                        <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 group-hover:text-gray-700">
                                        {studentProgram ? 'College/University Student' : 'Undergraduate & Postgraduate Students'}
                                    </p>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>Assessment: (45-60 minutes)</span>
                                    </div>
                                </div>
                            </button>
                            )}
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700">
                                    <p className="font-semibold mb-1">Personalized Career Guidance</p>
                                    <p>This assessment is designed to help you discover your interests, strengths, and potential career paths based on your age and educational level.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Category Selection Screen (Science/Commerce/Arts)
    if (showCategorySelection) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl border-none shadow-2xl">
                    <CardContent className="p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Award className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Career Assessment - {gradeLevel === 'after10' ? 'After 10th' : 'After 12th'}
                            </h1>
                            <p className="text-gray-600">Select your stream category to continue</p>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-gray-700">Choose Your Stream Category</Label>
                            
                            {streamCategories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategorySelect(category.id)}
                                    className="w-full p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 text-left group transform hover:-translate-y-1 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                                                    {category.icon}
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">{category.label}</h3>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 group-hover:text-gray-700 ml-15 pl-0.5">{category.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700">
                                    <p className="font-semibold mb-1">How It Works</p>
                                    <p>After completing the assessment, we'll recommend the best courses/programs for you based on your interests, aptitude, and personality.</p>
                                </div>
                            </div>
                        </div>
                        
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCategorySelection(false);
                                setShowGradeSelection(true);
                            }}
                            className="w-full mt-4 py-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Grade Selection
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Stream selection is no longer used - college students go directly to assessment
    // Keeping this commented for reference if needed in future
    /*
    if (showStreamSelection) {
        // Default streams for college students
        const collegeStreams = [
            { id: 'cs', label: 'B.Sc Computer Science / B.Tech CS/IT' },
            { id: 'bca', label: 'BCA General' },
            { id: 'bba', label: 'BBA General' },
            { id: 'dm', label: 'BBA Digital Marketing' },
            { id: 'animation', label: 'B.Sc Animation' }
        ];

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl border-none shadow-2xl">
                    <CardContent className="p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Award className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Career Assessment</h1>
                            <p className="text-gray-600">Let's personalize your assessment based on your stream</p>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-gray-700">Select Your Stream/Course</Label>
                            
                            {collegeStreams.map((stream) => (
                                <button
                                    key={stream.id}
                                    onClick={() => handleStreamSelect(stream.id)}
                                    className="w-full p-4 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-xl shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-300 text-left group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-800 font-medium group-hover:text-indigo-700">{stream.label}</span>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700">
                                    <p className="font-semibold mb-1">What to expect:</p>
                                    <ul className="space-y-1">
                                        <li>• 6 assessment sections covering interests, personality, values, skills, and knowledge</li>
                                        <li>• Approximately 45-60 minutes to complete</li>
                                        <li>• Your responses are private and used only for career guidance</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowStreamSelection(false);
                                setShowGradeSelection(true);
                            }}
                            className="w-full mt-4 py-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Grade Selection
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    */

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col items-center py-8 px-4">
            {/* Modern Progress Header */}
            <div className="w-full max-w-4xl mb-6">
                {/* Progress Stats */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Award className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Career Assessment</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Test Mode Toggle - Only in dev mode */}
                        {isDevMode && !testMode && (
                            <button
                                onClick={() => setTestMode(true)}
                                className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold hover:bg-amber-200 transition-all flex items-center gap-1"
                                title="Enable Test Mode for quick testing"
                            >
                                <Zap className="w-3 h-3" />
                                Test Mode
                            </button>
                        )}
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                            <span className="text-sm font-semibold text-indigo-700">{Math.round(progress)}% Complete</span>
                        </div>
                    </div>
                </div>

                {/* Dev Mode Controls - Only visible when test mode is enabled */}
                {isDevMode && testMode && (
                    <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-800">Test Mode Active</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={autoFillAllAnswers}
                                className="px-3 py-1.5 bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-300 transition-all"
                            >
                                Auto-fill All
                            </button>
                            <button
                                onClick={skipToAptitude}
                                className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-semibold hover:bg-purple-600 transition-all"
                            >
                                → Aptitude (AI)
                            </button>
                            <button
                                onClick={skipToKnowledge}
                                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-all"
                            >
                                → Knowledge (AI)
                            </button>
                            <button
                                onClick={skipToLastSection}
                                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-all"
                            >
                                Skip to Submit
                            </button>
                            <button
                                onClick={() => setTestMode(false)}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-all"
                            >
                                Exit Test Mode
                            </button>
                        </div>
                    </div>
                )}

                {/* Section Steps with Progress Lines - Proper Alignment */}
                <div className="relative">
                    {/* Circles and Lines Row */}
                    <div className="flex items-center">
                        {sections.map((section, idx) => {
                            const isCompleted = idx < currentSectionIndex;
                            const isCurrent = idx === currentSectionIndex;
                            const isUpcoming = idx > currentSectionIndex;

                            let lineProgress = 0;
                            if (idx < currentSectionIndex) {
                                lineProgress = 100;
                            } else if (idx === currentSectionIndex) {
                                const totalQuestions = sections[idx].questions.length;
                                lineProgress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
                            }

                            return (
                                <div key={section.id} className={`flex items-center ${idx < sections.length - 1 ? 'flex-1' : ''}`}>
                                    {/* Step Circle */}
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 shrink-0
                                        ${isCompleted ? 'bg-green-500 border-green-500 text-white shadow-md' : ''}
                                        ${isCurrent ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg ring-4 ring-indigo-100 relative z-10' : ''}
                                        ${isUpcoming ? 'bg-white border-gray-300 text-gray-500' : ''}
                                    `}>
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <span className="text-sm font-bold">{idx + 1}</span>
                                        )}
                                    </div>

                                    {/* Connector Line */}
                                    {idx < sections.length - 1 && (
                                        <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden mx-2">
                                            <motion.div
                                                className={`h-full rounded-full ${idx < currentSectionIndex
                                                    ? 'bg-green-500'
                                                    : idx === currentSectionIndex
                                                        ? 'bg-indigo-500'
                                                        : ''
                                                    }`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${lineProgress}%` }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Labels Row - Separate for proper alignment */}
                    <div className="hidden sm:flex items-start mt-2">
                        {sections.map((section, idx) => {
                            const isCompleted = idx < currentSectionIndex;
                            const isCurrent = idx === currentSectionIndex;
                            const isUpcoming = idx > currentSectionIndex;

                            return (
                                <div key={`label-${section.id}`} className={`${idx < sections.length - 1 ? 'flex-1' : ''}`}>
                                    <span className={`
                                        text-[10px] font-semibold text-center leading-tight block w-10
                                        ${isCompleted ? 'text-green-700' : ''}
                                        ${isCurrent ? 'text-indigo-700' : ''}
                                        ${isUpcoming ? 'text-gray-500' : ''}
                                    `}>
                                        {section.title.split(' ')[0]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Card */}
            <Card className="w-full max-w-4xl border-none shadow-xl bg-white overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-${currentSection.color}-500`}></div>

                <CardContent className="p-0 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {/* Section Complete - Full Width */}
                        {showSectionComplete && !error && !isSubmitting ? (
                            <motion.div
                                key={`section-complete-${currentSectionIndex}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="min-h-[600px] flex flex-col items-center justify-center text-center p-8 bg-gray-50"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                                    className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0, rotate: -90 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.3 }}
                                    >
                                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                                    </motion.div>
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.3 }}
                                    className="text-3xl font-bold text-gray-800 mb-3"
                                >
                                    {currentSection.title} Complete!
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.3 }}
                                    className="text-gray-600 mb-4 max-w-md leading-relaxed text-lg"
                                >
                                    Great job! You've finished this section.
                                </motion.p>
                                {!currentSection.isTimed && elapsedTime > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.55, duration: 0.3 }}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full mb-4 border border-emerald-200"
                                    >
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-medium">Completed in {formatElapsedTime(elapsedTime)}</span>
                                    </motion.div>
                                )}
                                {currentSectionIndex < sections.length - 1 && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6, duration: 0.3 }}
                                        className="text-gray-500 mb-6"
                                    >
                                        Next up: <span className="font-semibold text-indigo-600">{sections[currentSectionIndex + 1]?.title}</span>
                                    </motion.p>
                                )}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7, duration: 0.3 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        onClick={handleNextSection}
                                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-10 py-6 text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 rounded-xl font-bold tracking-wide"
                                    >
                                        Continue
                                        <ChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </motion.div>
                            </motion.div>
                        ) : showSectionIntro && !error && !isSubmitting ? (
                            <motion.div
                                key={`section-intro-${currentSectionIndex}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="min-h-[600px] flex flex-col items-center justify-center text-center p-8 bg-gray-50"
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                                    className={`w-20 h-20 rounded-2xl bg-${currentSection.color}-100 flex items-center justify-center mb-6 shadow-lg`}
                                >
                                    {currentSection.icon}
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.2 }}
                                    className="text-3xl font-bold text-gray-800 mb-4"
                                >
                                    {currentSection.title}
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.3 }}
                                    className="text-gray-600 mb-6 max-w-lg leading-relaxed text-lg"
                                >
                                    {currentSection.description}
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.4 }}
                                    className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 mb-6 max-w-lg w-full"
                                >
                                    <p className="text-sm font-medium text-indigo-700">
                                        {currentSection.instruction}
                                    </p>
                                </motion.div>
                                {/* Section type indicator */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.45, duration: 0.3 }}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${currentSection.id === 'knowledge' || currentSection.id === 'aptitude'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                        }`}
                                >
                                    {currentSection.id === 'knowledge' ? (
                                        <>
                                            <Code className="w-4 h-4" />
                                            <span className="text-sm font-medium">Knowledge Test - Answers will be scored</span>
                                        </>
                                    ) : currentSection.id === 'aptitude' ? (
                                        <>
                                            <Zap className="w-4 h-4" />
                                            <span className="text-sm font-medium">Aptitude Test - Speed & accuracy matter</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-sm font-medium">There are no right or wrong answers.</span>
                                        </>
                                    )}
                                </motion.div>

                                {/* Module breakdown for Aptitude section */}
                                {currentSection.id === 'aptitude' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.3 }}
                                        className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200 max-w-lg w-full"
                                    >
                                        <p className="text-xs font-bold text-amber-800 mb-2">5 Modules in this section:</p>
                                        <div className="grid grid-cols-1 gap-1 text-xs">
                                            {aptitudeModules.map((mod) => (
                                                <div key={mod.id} className="flex items-center justify-between text-amber-700">
                                                    <span>{mod.title}</span>
                                                    <span className="text-amber-500">{mod.questionCount} Qs</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Module breakdown for Employability section */}
                                {currentSection.id === 'employability' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.3 }}
                                        className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200 max-w-lg w-full"
                                    >
                                        <p className="text-xs font-bold text-green-800 mb-2">2 Parts in this section:</p>
                                        <div className="space-y-2 text-xs">
                                            <div className="bg-white/70 rounded-lg p-2">
                                                <p className="font-semibold text-green-700">Part A: Self-Rating Skills (25 Qs)</p>
                                                <p className="text-green-600 text-[10px]">Communication, Teamwork, Problem Solving, Adaptability, Leadership, Digital Fluency, Professionalism, Career Readiness</p>
                                            </div>
                                            <div className="bg-white/70 rounded-lg p-2">
                                                <p className="font-semibold text-rose-700">Part B: Situational Judgement Test (6 Qs)</p>
                                                <p className="text-rose-600 text-[10px]">Choose BEST and WORST response for workplace scenarios</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.3 }}
                                    className="flex items-center gap-6 text-sm text-gray-500 mb-6"
                                >
                                    <div className="flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        <span>Section {currentSectionIndex + 1} of {sections.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span>{currentSection.questions.length} questions</span>
                                    </div>
                                    {currentSection.isTimed && (
                                        <div className="flex items-center gap-2 text-orange-600 font-medium">
                                            <Clock className="w-4 h-4" />
                                            <span>{currentSection.id === 'aptitude' ? '10 minutes' : '30 minutes'}</span>
                                        </div>
                                    )}
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.6 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {/* Show loading state for AI sections with no questions */}
                                    {(currentSection.id === 'aptitude' || currentSection.id === 'knowledge') && 
                                     currentSection.questions.length === 0 ? (
                                        <div className="flex flex-col items-center gap-4">
                                            {aiQuestionsLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                    <p className="text-gray-600">Loading AI-generated questions...</p>
                                                    <p className="text-sm text-gray-400">This may take up to 30 seconds</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-red-600 font-medium">Failed to load questions</p>
                                                    <Button
                                                        onClick={() => window.location.reload()}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
                                                    >
                                                        Retry
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={handleStartSection}
                                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-10 py-6 text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 rounded-xl font-bold tracking-wide"
                                        >
                                            Start Section
                                            <ChevronRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    )}
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`questions-${currentSectionIndex}`}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                                className="flex flex-col md:flex-row min-h-[600px]"
                            >

                                {/* Sidebar */}
                                <div className="md:w-1/3 bg-gray-50 p-8 border-r border-gray-100">
                                    <div className="mb-8">
                                        <div className={`w-12 h-12 rounded-xl bg-${currentSection.color}-100 flex items-center justify-center mb-4 shadow-sm`}>
                                            {currentSection.icon}
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentSection.title}</h2>
                                        <p className="text-base text-gray-500 leading-relaxed mb-4">{currentSection.description}</p>

                                        {/* Module indicator for Aptitude section */}
                                        {currentSection.id === 'aptitude' && currentQuestion?.moduleTitle && (
                                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                                                <p className="text-sm font-bold text-amber-800 mb-1">{currentQuestion.moduleTitle}</p>
                                                <p className="text-sm text-amber-600">
                                                    {(() => {
                                                        const moduleInfo = getModuleQuestionIndex(currentQuestionIndex);
                                                        return `Question ${moduleInfo.moduleIndex} of ${moduleInfo.moduleTotal} in this module`;
                                                    })()}
                                                </p>
                                            </div>
                                        )}

                                        {/* Module progress for Aptitude */}
                                        {currentSection.id === 'aptitude' && (
                                            <div className="mb-4 space-y-1">
                                                {aptitudeModules.map((mod) => {
                                                    const moduleInfo = getModuleQuestionIndex(currentQuestionIndex);
                                                    const isCurrentModule = moduleInfo.module.id === mod.id;
                                                    const moduleColors = {
                                                        blue: 'bg-blue-500',
                                                        green: 'bg-green-500',
                                                        purple: 'bg-purple-500',
                                                        orange: 'bg-orange-500',
                                                        pink: 'bg-pink-500'
                                                    };
                                                    return (
                                                        <div key={mod.id} className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${isCurrentModule ? 'bg-amber-100 font-semibold' : 'opacity-60'}`}>
                                                            <div className={`w-2 h-2 rounded-full ${moduleColors[mod.color]}`}></div>
                                                            <span className="truncate">{mod.title}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Module indicator for Employability section */}
                                        {currentSection.id === 'employability' && (
                                            <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
                                                {(() => {
                                                    const moduleInfo = getCurrentEmployabilityModule(currentQuestionIndex);
                                                    return (
                                                        <>
                                                            <p className="text-sm font-bold text-green-800 mb-1">{moduleInfo.partTitle}</p>
                                                            <p className="text-sm text-green-700 font-medium">{moduleInfo.domain}</p>
                                                            <p className="text-sm text-green-600">
                                                                Question {moduleInfo.questionInDomain} of {moduleInfo.domainTotal}
                                                            </p>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {/* Module progress for Employability */}
                                        {currentSection.id === 'employability' && (
                                            <div className="mb-4 space-y-1">
                                                {(() => {
                                                    const moduleInfo = getCurrentEmployabilityModule(currentQuestionIndex);
                                                    const partADomains = ['Communication', 'Teamwork', 'Problem Solving', 'Adaptability', 'Leadership', 'Digital Fluency', 'Professionalism', 'Career Readiness'];
                                                    const domainColors = ['blue', 'green', 'purple', 'orange', 'red', 'cyan', 'indigo', 'amber'];

                                                    return (
                                                        <>
                                                            <div className={`text-sm font-semibold px-2 py-1 ${moduleInfo.part === 'A' ? 'text-green-700' : 'text-gray-400'}`}>
                                                                Part A: Self-Rating
                                                            </div>
                                                            {partADomains.map((domain, idx) => {
                                                                const isCurrentDomain = moduleInfo.part === 'A' && moduleInfo.domain === domain;
                                                                return (
                                                                    <div key={domain} className={`flex items-center gap-2 text-xs px-2 py-0.5 rounded ml-2 ${isCurrentDomain ? 'bg-green-100 font-semibold' : 'opacity-50'}`}>
                                                                        <div className={`w-1.5 h-1.5 rounded-full bg-${domainColors[idx]}-500`}></div>
                                                                        <span className="truncate text-[10px]">{domain}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                            <div className={`text-sm font-semibold px-2 py-1 mt-1 ${moduleInfo.part === 'B' ? 'text-rose-700' : 'text-gray-400'}`}>
                                                                Part B: SJT Scenarios
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 mb-4">
                                            <p className="text-sm font-medium text-indigo-700">{currentSection.instruction}</p>
                                        </div>

                                        {/* Section type indicator */}
                                        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${currentSection.id === 'knowledge' || currentSection.id === 'aptitude'
                                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                            }`}>
                                            {currentSection.id === 'knowledge' || currentSection.id === 'aptitude' ? (
                                                <>
                                                    <Code className="w-3.5 h-3.5" />
                                                    <span>Answers scored</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>There are no right or wrong answers.</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Target className="w-4 h-4" />
                                            <span>Section {currentSectionIndex + 1} of {sections.length}</span>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Users className="w-4 h-4" />
                                            <span>Question {currentQuestionIndex + 1} / {
                                                (gradeLevel === 'after12' && currentSection.id === 'aptitude') ? 50 :
                                                (gradeLevel === 'after12' && currentSection.id === 'knowledge') ? 20 :
                                                currentSection.questions.length
                                            }</span>
                                        </div>

                                        {currentSection.isTimed ? (
                                            currentSection.isAptitude ? (
                                                aptitudePhase === 'individual' ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className={`flex items-center gap-3 text-sm font-semibold ${aptitudeQuestionTimer <= 10 ? 'text-red-600' : 'text-orange-600'}`}>
                                                            <Clock className="w-4 h-4" />
                                                            <span>Question Time: {formatTime(aptitudeQuestionTimer)}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Q {currentQuestionIndex + 1}/{Math.min(currentSection.individualQuestionCount || 30, currentSection.questions.length)} (1 min each)
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        <div className={`flex items-center gap-3 text-sm font-semibold ${timeRemaining !== null && timeRemaining <= 60 ? 'text-red-600' : 'text-orange-600'}`}>
                                                            <Clock className="w-4 h-4" />
                                                            <span>Time Left: {formatTime(timeRemaining || 0)}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Q {currentQuestionIndex + 1 - (currentSection.individualQuestionCount || 30)}/{currentSection.questions.length - (currentSection.individualQuestionCount || 30)} (15 min shared)
                                                        </div>
                                                    </div>
                                                )
                                            ) : timeRemaining !== null ? (
                                                <div className="flex items-center gap-3 text-sm font-semibold text-orange-600">
                                                    <Clock className="w-4 h-4" />
                                                    <span>Time Left: {formatTime(timeRemaining)}</span>
                                                </div>
                                            ) : null
                                        ) : (
                                            <div className="flex items-center gap-3 text-sm font-medium text-emerald-600">
                                                <Clock className="w-4 h-4" />
                                                <span>Time: {formatElapsedTime(elapsedTime)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Question Area */}
                                <div className="md:w-2/3 p-8 flex flex-col relative">
                                    <AnimatePresence mode="wait">
                                        {error ? (
                                            <motion.div
                                                key="error"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex-1 flex flex-col items-center justify-center text-center"
                                            >
                                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-800 mb-2">Analysis Failed</h3>
                                                <p className="text-red-600 mb-4 max-w-md">{error}</p>
                                                <div className="flex gap-3">
                                                    <Button
                                                        onClick={() => {
                                                            setError(null);
                                                            handleSubmit();
                                                        }}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 px-6 py-2 rounded-lg font-medium"
                                                    >
                                                        Try Again
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setError(null)}
                                                    >
                                                        Go Back
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ) : isSubmitting ? (
                                            <motion.div
                                                key="submitting"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex-1 flex flex-col items-center justify-center text-center"
                                            >
                                                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                                                <h3 className="text-xl font-bold text-gray-800 mb-2">Analyzing your profile with AI...</h3>
                                                <p className="text-gray-500">Rareminds is generating your personalized career roadmap.</p>
                                            </motion.div>
                                        ) : !currentQuestion ? (
                                            <motion.div
                                                key="loading-question"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex-1 flex flex-col items-center justify-center text-center"
                                            >
                                                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                                <p className="text-gray-600">Loading question...</p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key={`${currentSectionIndex}-${currentQuestionIndex}`}
                                                initial={{ opacity: 0, x: 30 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -30 }}
                                                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                                className="flex-1 flex flex-col"
                                            >
                                                <div className="mb-6">
                                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 block">
                                                        Question {currentQuestionIndex + 1} / {
                                                            (gradeLevel === 'after12' && currentSection.id === 'aptitude') ? 50 :
                                                            (gradeLevel === 'after12' && currentSection.id === 'knowledge') ? 20 :
                                                            currentSection.questions.length
                                                        }
                                                    </span>
                                                    <h3 className="text-2xl md:text-3xl font-medium text-gray-800 leading-snug">
                                                        {currentQuestion.text}
                                                    </h3>
                                                </div>

                                                <div className="space-y-3 mt-4">
                                                    {/* SJT Questions - Select BEST and WORST */}
                                                    {currentQuestion.partType === 'sjt' ? (
                                                        <div className="space-y-4">
                                                            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 mb-4">
                                                                <p className="text-sm font-medium text-rose-700">
                                                                    Select the <span className="font-bold text-green-700">BEST</span> response and the <span className="font-bold text-red-700">WORST</span> response for this scenario.
                                                                </p>
                                                            </div>

                                                            {currentQuestion.options.map((option, idx) => {
                                                                const optionLabel = currentQuestion.optionLabels?.[idx] || String.fromCharCode(97 + idx);
                                                                const sjtAnswer = answers[questionId] || {};
                                                                const isBest = sjtAnswer.best === option;
                                                                const isWorst = sjtAnswer.worst === option;

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={`border rounded-xl p-4 transition-all ${isBest ? 'border-green-500 bg-green-50 ring-1 ring-green-500/30' :
                                                                            isWorst ? 'border-red-500 bg-red-50 ring-1 ring-red-500/30' :
                                                                                'border-gray-200 hover:bg-gray-50'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-start gap-3">
                                                                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                                                                                {optionLabel}
                                                                            </span>
                                                                            <p className="flex-1 text-gray-700 font-medium text-lg">{option}</p>
                                                                        </div>
                                                                        <div className="flex gap-2 mt-3 ml-9">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const current = answers[questionId] || {};
                                                                                    // Can't select same option for both
                                                                                    if (current.worst === option) return;
                                                                                    // Toggle: if already selected as best, deselect it
                                                                                    if (isBest) {
                                                                                        const { best, ...rest } = current;
                                                                                        handleAnswer(Object.keys(rest).length > 0 ? rest : undefined);
                                                                                    } else {
                                                                                        handleAnswer({ ...current, best: option });
                                                                                    }
                                                                                }}
                                                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isBest
                                                                                    ? 'bg-green-600 text-white shadow-md'
                                                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                                    } ${isWorst ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                                                disabled={isWorst}
                                                                            >
                                                                                ✓ BEST
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const current = answers[questionId] || {};
                                                                                    // Can't select same option for both
                                                                                    if (current.best === option) return;
                                                                                    // Toggle: if already selected as worst, deselect it
                                                                                    if (isWorst) {
                                                                                        const { worst, ...rest } = current;
                                                                                        handleAnswer(Object.keys(rest).length > 0 ? rest : undefined);
                                                                                    } else {
                                                                                        handleAnswer({ ...current, worst: option });
                                                                                    }
                                                                                }}
                                                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isWorst
                                                                                    ? 'bg-red-600 text-white shadow-md'
                                                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                                    } ${isBest ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                                                disabled={isBest}
                                                                            >
                                                                                ✗ WORST
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : currentQuestion.type === 'multiselect' ? (
                                                        // Multi-select questions (Middle School)
                                                        <div className="space-y-4">
                                                            <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
                                                                <p className="text-sm font-medium text-green-700">
                                                                    Select up to <span className="font-bold">{currentQuestion.maxSelections}</span> options that feel most like you
                                                                    {answers[questionId]?.length > 0 && (
                                                                        <span className="ml-2 text-green-600">
                                                                            ({answers[questionId]?.length || 0}/{currentQuestion.maxSelections} selected)
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>

                                                            {currentQuestion.options.map((option, idx) => {
                                                                const selectedOptions = answers[questionId] || [];
                                                                const isSelected = selectedOptions.includes(option);
                                                                const canSelect = selectedOptions.length < currentQuestion.maxSelections || isSelected;

                                                                return (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const current = answers[questionId] || [];
                                                                            if (isSelected) {
                                                                                // Deselect
                                                                                const newSelection = current.filter(opt => opt !== option);
                                                                                handleAnswer(newSelection.length > 0 ? newSelection : undefined);
                                                                            } else if (current.length < currentQuestion.maxSelections) {
                                                                                // Select
                                                                                handleAnswer([...current, option]);
                                                                            }
                                                                        }}
                                                                        disabled={!canSelect}
                                                                        className={`w-full border rounded-xl p-4 transition-all text-left ${
                                                                            isSelected
                                                                                ? 'border-green-500 bg-green-50 ring-2 ring-green-500/30'
                                                                                : canSelect
                                                                                    ? 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                                                                    : 'border-gray-200 opacity-40 cursor-not-allowed'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-start gap-3">
                                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                                                                isSelected
                                                                                    ? 'bg-green-500 text-white'
                                                                                    : 'bg-gray-100 text-gray-400'
                                                                            }`}>
                                                                                {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                                                            </div>
                                                                            <p className={`flex-1 font-medium text-lg ${
                                                                                isSelected ? 'text-green-700' : 'text-gray-700'
                                                                            }`}>
                                                                                {option}
                                                                            </p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : currentQuestion.type === 'singleselect' ? (
                                                        // Single-select questions (Middle School - simpler UI)
                                                        <div className="space-y-3">
                                                            {currentQuestion.options.map((option, idx) => {
                                                                const isSelected = answers[questionId] === option;

                                                                return (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        onClick={() => handleAnswer(option)}
                                                                        className={`w-full border rounded-xl p-4 transition-all text-left ${
                                                                            isSelected
                                                                                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30'
                                                                                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-start gap-3">
                                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                                                                isSelected
                                                                                    ? 'bg-indigo-500 text-white'
                                                                                    : 'bg-gray-100 text-gray-400'
                                                                            }`}>
                                                                                {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                                                            </div>
                                                                            <p className={`flex-1 font-medium text-lg ${
                                                                                isSelected ? 'text-indigo-700' : 'text-gray-700'
                                                                            }`}>
                                                                                {option}
                                                                            </p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : currentQuestion.type === 'rating' ? (
                                                        // Rating questions (1-4 scale for middle school)
                                                        <div className="space-y-4">
                                                            <div className="flex justify-center gap-2 md:gap-4">
                                                                {currentSection.responseScale.map((option) => (
                                                                    <button
                                                                        key={option.value}
                                                                        type="button"
                                                                        onClick={() => handleAnswer(option.value)}
                                                                        className={`flex-1 max-w-[120px] border-2 rounded-xl p-4 transition-all ${
                                                                            answers[questionId] === option.value
                                                                                ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/30 shadow-md'
                                                                                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                                                        }`}
                                                                    >
                                                                        <div className="text-center">
                                                                            <div className={`text-3xl font-bold mb-2 ${
                                                                                answers[questionId] === option.value ? 'text-amber-600' : 'text-gray-600'
                                                                            }`}>
                                                                                {option.value}
                                                                            </div>
                                                                            <div className={`text-xs font-medium ${
                                                                                answers[questionId] === option.value ? 'text-amber-700' : 'text-gray-600'
                                                                            }`}>
                                                                                {option.label}
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : currentQuestion.type === 'text' ? (
                                                        // Text input questions (open reflection)
                                                        <div className="space-y-3">
                                                            <textarea
                                                                value={answers[questionId] || ''}
                                                                onChange={(e) => handleAnswer(e.target.value)}
                                                                placeholder={currentQuestion.placeholder || 'Type your answer here...'}
                                                                className="w-full min-h-[150px] p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none text-lg text-gray-700"
                                                            />
                                                            <p className="text-sm text-gray-500">
                                                                {answers[questionId]?.length || 0} characters
                                                            </p>
                                                        </div>
                                                    ) : currentSection.responseScale ? (
                                                        // Likert scale response (for After 12th assessments)
                                                        <RadioGroup
                                                            value={answers[questionId]?.toString() || ""}
                                                            onValueChange={(val) => handleAnswer(parseInt(val))}
                                                            className="space-y-3"
                                                        >
                                                            {currentSection.responseScale.map((option) => (
                                                                <div
                                                                    key={option.value}
                                                                    onClick={() => handleAnswer(option.value)}
                                                                    className={`flex items-center space-x-3 border rounded-xl p-4 transition-all cursor-pointer hover:bg-gray-50 ${answers[questionId] === option.value
                                                                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20'
                                                                        : 'border-gray-200'
                                                                        }`}>
                                                                    <RadioGroupItem value={option.value.toString()} id={`opt-${option.value}`} className="text-indigo-600" />
                                                                    <Label htmlFor={`opt-${option.value}`} className="flex-1 cursor-pointer font-medium text-gray-700 text-lg">
                                                                        {option.label}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    ) : (
                                                        // MCQ response
                                                        <RadioGroup
                                                            value={answers[questionId] || ""}
                                                            onValueChange={handleAnswer}
                                                            className="space-y-3"
                                                        >
                                                            {currentQuestion.options.map((option, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    onClick={() => handleAnswer(option)}
                                                                    className={`flex items-center space-x-3 border rounded-xl p-4 transition-all cursor-pointer hover:bg-gray-50 ${answers[questionId] === option
                                                                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20'
                                                                        : 'border-gray-200'
                                                                        }`}>
                                                                    <RadioGroupItem value={option} id={`opt-${idx}`} className="text-indigo-600" />
                                                                    <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-medium text-gray-700 text-lg">
                                                                        {option}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Navigation - only show when answering questions */}
                                    {!isSubmitting && !showSectionComplete && !error && (
                                        <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-100">
                                            <Button
                                                variant="ghost"
                                                onClick={handlePrevious}
                                                disabled={currentQuestionIndex === 0}
                                                className="text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 border-2 border-transparent hover:border-indigo-100 px-6 py-3 rounded-xl transition-all duration-200 font-medium"
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-2" />
                                                Previous
                                            </Button>

                                            <Button
                                                onClick={handleNext}
                                                disabled={!isCurrentAnswered || isSaving}
                                                className={`bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-6 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 font-bold tracking-wide ${(!isCurrentAnswered || isSaving) ? 'opacity-50 cursor-not-allowed grayscale shadow-none' : ''
                                                    }`}
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : currentSectionIndex === sections.length - 1 && currentQuestionIndex === currentSection.questions.length - 1 ? (
                                                    <>
                                                        Submit Assessment
                                                        <CheckCircle2 className="w-5 h-5 ml-2" />
                                                    </>
                                                ) : (
                                                    <>
                                                        Next Question
                                                        <ChevronRight className="w-5 h-5 ml-2" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
};

export default AssessmentTest;
