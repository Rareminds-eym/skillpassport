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
    Loader2
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

// Import Gemini assessment service
import { analyzeAssessmentWithGemini } from '../../services/geminiAssessmentService';

// Import database services
import { useAssessment } from '../../hooks/useAssessment';
import { useAuth } from '../../context/AuthContext';
import * as assessmentService from '../../services/assessmentService';

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
        checkInProgressAttempt
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
    const [studentStream, setStudentStream] = useState(null);
    const [showStreamSelection, setShowStreamSelection] = useState(false); // Start false, set true after check
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [useDatabase, setUseDatabase] = useState(false); // Track if using database mode

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Track if saving progress
    const [error, setError] = useState(null);
    const [showSectionIntro, setShowSectionIntro] = useState(true);
    const [showSectionComplete, setShowSectionComplete] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // Elapsed time for non-timed sections
    const [sectionTimings, setSectionTimings] = useState({}); // Track time spent on each section

    // Load questions from database when stream is selected
    const loadQuestionsFromDatabase = async (streamId) => {
        setQuestionsLoading(true);
        setQuestionsError(null);
        try {
            const allQuestions = await assessmentService.fetchAllQuestions(streamId);
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
            // Wait for auth hook to be ready
            if (dbLoading) return;

            setCheckingExistingAttempt(true);

            try {
                if (user?.id) {
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
                            setShowStreamSelection(true);
                        }
                    } else {
                        // No existing attempt, show stream selection
                        setShowStreamSelection(true);
                    }
                } else {
                    // Not logged in, show stream selection
                    setShowStreamSelection(true);
                }
            } catch (err) {
                console.error('Error checking for existing attempt:', err);
                setShowStreamSelection(true);
            } finally {
                setCheckingExistingAttempt(false);
                setInitialCheckDone(true);
            }
        };
        checkExistingAttempt();
    }, [user?.id, dbLoading, checkInProgressAttempt, initialCheckDone, assessmentStarted]);

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

            // Load questions for this stream
            await loadQuestionsFromDatabase(pendingAttempt.stream_id);

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

            // Show section intro if at the start of a section (question 0)
            // This ensures users see the section instructions when resuming
            const shouldShowIntro = questionIdx === 0;
            setShowSectionIntro(shouldShowIntro);
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
        setShowStreamSelection(true);
    };

    // Transform database questions to match UI format
    const transformDbQuestion = (dbQ) => ({
        id: dbQ.id,
        text: dbQ.question_text,
        type: dbQ.subtype,           // Used for Career Interests (R,I,A,S,E,C), Big Five (O,C,E,A,N), Values, Employability domains
        subtype: dbQ.subtype,        // Used for aptitude categorization (verbal, numerical, etc.)
        moduleTitle: dbQ.module_title,
        options: dbQ.options,
        correct: dbQ.correct_answer,
        partType: dbQ.part_type,     // For employability: 'selfRating' or 'sjt'
        scenario: dbQ.scenario,
        bestAnswer: dbQ.best_answer,
        worstAnswer: dbQ.worst_answer
    });

    // Get questions for a section - from database or fallback
    const getQuestionsForSection = (sectionId) => {
        if (dbQuestions && dbQuestions[sectionId]?.questions) {
            return dbQuestions[sectionId].questions.map(transformDbQuestion);
        }
        // Fallback to hardcoded questions
        switch (sectionId) {
            case 'riasec': return fallbackRiasecQuestions;
            case 'aptitude': return getAllAptitudeQuestions();
            case 'bigfive': return fallbackBigFiveQuestions;
            case 'values': return fallbackWorkValuesQuestions;
            case 'employability': return fallbackEmployabilityQuestions;
            case 'knowledge': return fallbackStreamKnowledgeQuestions[studentStream] || [];
            default: return [];
        }
    };

    // Define assessment sections with dynamic questions
    const sections = useMemo(() => [
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
            id: 'aptitude',
            title: 'Multi-Aptitude Battery',
            icon: <Zap className="w-6 h-6 text-amber-500" />,
            description: "Measure your cognitive strengths across verbal, numerical, logical, spatial, and clerical domains.",
            color: "amber",
            questions: getQuestionsForSection('aptitude'),
            isTimed: true,
            timeLimit: 10 * 60, // 10 minutes
            isAptitude: true,
            instruction: "Choose the correct answer. Speed matters for clerical questions."
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
    ], [dbQuestions, studentStream]);

    const streams = [
        { id: 'cs', label: 'B.Sc Computer Science / B.Tech CS/IT' },
        { id: 'bca', label: 'BCA General' },
        { id: 'bba', label: 'BBA General' },
        { id: 'dm', label: 'BBA Digital Marketing' },
        { id: 'animation', label: 'B.Sc Animation' }
    ];

    // Calculate progress
    const currentSection = sections[currentSectionIndex];
    const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / totalQuestions) * 100;

    // Timer for timed sections
    // Persistence Effect


    // Scroll to top on question change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentSectionIndex, currentQuestionIndex, showStreamSelection, showSectionIntro, showSectionComplete]);

    // Timer for timed sections
    useEffect(() => {
        if (currentSection?.isTimed) {
            // If we just entered the section and have no time set, set it
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
        } else {
            setTimeRemaining(null);
        }
    }, [currentSection?.id, currentSection?.isTimed, currentSection?.timeLimit]); // Only re-run if section changes

    // Handle timer expiry
    useEffect(() => {
        if (timeRemaining === 0 && currentSection?.isTimed) {
            handleNextSection();
        }
    }, [timeRemaining, currentSection?.isTimed]);

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

    const handleStreamSelect = async (streamId) => {
        // Mark that user has started an assessment to prevent re-checking
        setAssessmentStarted(true);
        setStudentStream(streamId);
        setShowStreamSelection(false);

        // Load questions from database first
        await loadQuestionsFromDatabase(streamId);

        setShowSectionIntro(true);

        // Try to create a database attempt if user is logged in
        if (user?.id) {
            try {
                await startAssessment(streamId);
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
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        } else if (currentSectionIndex > 0) {
            setCurrentSectionIndex(prev => prev - 1);
            setCurrentQuestionIndex(sections[currentSectionIndex - 1].questions.length - 1);
            setTimeRemaining(null);
        }
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
            const questionBanks = {
                riasecQuestions: getQuestionsForSection('riasec'),
                aptitudeQuestions: getQuestionsForSection('aptitude'),
                bigFiveQuestions: getQuestionsForSection('bigfive'),
                workValuesQuestions: getQuestionsForSection('values'),
                employabilityQuestions: getQuestionsForSection('employability'),
                streamKnowledgeQuestions: { [studentStream]: getQuestionsForSection('knowledge') }
            };

            // Analyze with Gemini AI - this is required, no fallback
            const geminiResults = await analyzeAssessmentWithGemini(
                answers,
                studentStream,
                questionBanks,
                finalTimings // Pass section timings to Gemini
            );

            if (geminiResults) {
                // Save AI-analyzed results to localStorage (backward compatibility)
                localStorage.setItem('assessment_gemini_results', JSON.stringify(geminiResults));
                console.log('Gemini analysis complete:', geminiResults);

                // Save results to database if in database mode
                if (useDatabase && currentAttempt?.id) {
                    try {
                        const dbResults = await completeAssessment(geminiResults, finalTimings);
                        console.log('Results saved to database:', dbResults);
                        // Navigate with attemptId for database retrieval
                        navigate(`/student/assessment/result?attemptId=${currentAttempt.id}`);
                    } catch (dbErr) {
                        console.error('Failed to save to database, results still in localStorage:', dbErr);
                        navigate('/student/assessment/result');
                    }
                } else {
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

    // Check if current question is answered (SJT needs both BEST and WORST)
    const isCurrentAnswered = (() => {
        const answer = answers[questionId];
        if (!answer) return false;
        // For SJT questions, both best and worst must be selected
        if (currentQuestion?.partType === 'sjt') {
            return answer.best && answer.worst;
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

    if (showStreamSelection) {
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

                        {questionsError && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-700">
                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                    Using offline questions. Some features may be limited.
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-700">Select Your Stream/Course</Label>
                            {streams.map((stream) => (
                                <button
                                    key={stream.id}
                                    onClick={() => handleStreamSelect(stream.id)}
                                    className="w-full p-5 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 text-left group transform hover:-translate-y-1 relative overflow-hidden hover:z-20"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="flex items-center justify-between relative z-10">
                                        <span className="font-semibold text-gray-800 group-hover:text-indigo-700 text-lg tracking-tight">{stream.label}</span>
                                        <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700">
                                    <p className="font-semibold mb-1">What to expect:</p>
                                    <ul className="space-y-1 text-sm">
                                        <li>• 6 assessment sections covering interests, personality, values, skills, and knowledge</li>
                                        <li>• Approximately 45-60 minutes to complete</li>
                                        <li>• Your responses are private and used only for career guidance</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                    <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className="text-sm font-semibold text-indigo-700">{Math.round(progress)}% Complete</span>
                    </div>
                </div>

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
                                            <span className="text-sm font-medium">No right or wrong answers</span>
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
                                    <Button
                                        onClick={handleStartSection}
                                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-10 py-6 text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 rounded-xl font-bold tracking-wide"
                                    >
                                        Start Section
                                        <ChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
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
                                        <h2 className="text-xl font-bold text-gray-800 mb-2">{currentSection.title}</h2>
                                        <p className="text-sm text-gray-500 leading-relaxed mb-4">{currentSection.description}</p>

                                        {/* Module indicator for Aptitude section */}
                                        {currentSection.id === 'aptitude' && currentQuestion?.moduleTitle && (
                                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                                                <p className="text-xs font-bold text-amber-800 mb-1">{currentQuestion.moduleTitle}</p>
                                                <p className="text-xs text-amber-600">
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
                                                        <div key={mod.id} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${isCurrentModule ? 'bg-amber-100 font-semibold' : 'opacity-60'}`}>
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
                                                            <p className="text-xs font-bold text-green-800 mb-1">{moduleInfo.partTitle}</p>
                                                            <p className="text-xs text-green-700 font-medium">{moduleInfo.domain}</p>
                                                            <p className="text-xs text-green-600">
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
                                                            <div className={`text-xs font-semibold px-2 py-1 ${moduleInfo.part === 'A' ? 'text-green-700' : 'text-gray-400'}`}>
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
                                                            <div className={`text-xs font-semibold px-2 py-1 mt-1 ${moduleInfo.part === 'B' ? 'text-rose-700' : 'text-gray-400'}`}>
                                                                Part B: SJT Scenarios
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 mb-4">
                                            <p className="text-xs font-medium text-indigo-700">{currentSection.instruction}</p>
                                        </div>

                                        {/* Section type indicator */}
                                        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${currentSection.id === 'knowledge' || currentSection.id === 'aptitude'
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
                                                    <span>No right or wrong answers</span>
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
                                            <span>Question {currentQuestionIndex + 1} / {currentSection.questions.length}</span>
                                        </div>

                                        {currentSection.isTimed && timeRemaining !== null ? (
                                            <div className="flex items-center gap-3 text-sm font-semibold text-orange-600">
                                                <Clock className="w-4 h-4" />
                                                <span>Time Left: {formatTime(timeRemaining)}</span>
                                            </div>
                                        ) : !currentSection.isTimed && (
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
                                                <p className="text-gray-500">Gemini AI is generating your personalized career roadmap.</p>
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
                                                        Question {currentQuestionIndex + 1} / {currentSection.questions.length}
                                                    </span>
                                                    <h3 className="text-xl md:text-2xl font-medium text-gray-800 leading-snug">
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
                                                                            <p className="flex-1 text-gray-700 font-medium">{option}</p>
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
                                                    ) : currentSection.responseScale ? (
                                                        // Likert scale response
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
                                                                    <Label htmlFor={`opt-${option.value}`} className="flex-1 cursor-pointer font-medium text-gray-700">
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
                                                                    <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-medium text-gray-700">
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
                                                disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
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
