import { useState, useEffect } from 'react';
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
    Code
} from 'lucide-react';
import { Button } from '../../components/Students/components/ui/button';
import { Card, CardContent } from '../../components/Students/components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/Students/components/ui/radio-group';
import { Label } from '../../components/Students/components/ui/label';

// Import question banks
import { riasecQuestions } from './assessment-data/riasecQuestions';
import { bigFiveQuestions } from './assessment-data/bigFiveQuestions';
import { workValuesQuestions } from './assessment-data/workValuesQuestions';
import { employabilityQuestions } from './assessment-data/employabilityQuestions';
import { streamKnowledgeQuestions } from './assessment-data/streamKnowledgeQuestions';

// Import Gemini assessment service
import { analyzeAssessmentWithGemini } from '../../services/geminiAssessmentService';

const AssessmentTest = () => {
    const navigate = useNavigate();
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [studentStream, setStudentStream] = useState(null);
    const [showStreamSelection, setShowStreamSelection] = useState(true);
    const [error, setError] = useState(null);
    const [showSectionIntro, setShowSectionIntro] = useState(true);
    const [showSectionComplete, setShowSectionComplete] = useState(false);

    // Define assessment sections
    const sections = [
        {
            id: 'riasec',
            title: 'Career Interests (RIASEC)',
            icon: <Heart className="w-6 h-6 text-rose-500" />,
            description: "Discover what types of work environments and activities appeal to you most.",
            color: "rose",
            questions: riasecQuestions,
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
            title: 'Work Style & Personality',
            icon: <BrainCircuit className="w-6 h-6 text-purple-500" />,
            description: "Understand your work style, approach to tasks, and how you interact with others.",
            color: "purple",
            questions: bigFiveQuestions,
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
            questions: workValuesQuestions,
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
            questions: employabilityQuestions,
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
            questions: streamKnowledgeQuestions[studentStream] || [],
            isTimed: true,
            timeLimit: 30 * 60, // 30 minutes in seconds
            instruction: "Choose the best answer for each question."
        }
    ];

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
    useEffect(() => {
        if (currentSection?.isTimed && timeRemaining === null) {
            setTimeRemaining(currentSection.timeLimit);
        }

        if (currentSection?.isTimed && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleNextSection();
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [currentSection, timeRemaining]);

    const handleStreamSelect = (streamId) => {
        setStudentStream(streamId);
        setShowStreamSelection(false);
        setShowSectionIntro(true);
    };

    const handleStartSection = () => {
        setShowSectionIntro(false);
        setShowSectionComplete(false);
    };

    const handleAnswer = (value) => {
        const questionId = `${currentSection.id}_${currentSection.questions[currentQuestionIndex].id}`;
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < currentSection.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
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
        
        try {
            // Save answers to localStorage first
            localStorage.setItem('assessment_answers', JSON.stringify(answers));
            localStorage.setItem('assessment_stream', studentStream);
            // Clear any previous results
            localStorage.removeItem('assessment_gemini_results');

            // Prepare question banks for Gemini analysis
            const questionBanks = {
                riasecQuestions,
                bigFiveQuestions,
                workValuesQuestions,
                employabilityQuestions,
                streamKnowledgeQuestions
            };

            // Analyze with Gemini AI - this is required, no fallback
            const geminiResults = await analyzeAssessmentWithGemini(
                answers, 
                studentStream, 
                questionBanks
            );

            if (geminiResults) {
                // Save AI-analyzed results
                localStorage.setItem('assessment_gemini_results', JSON.stringify(geminiResults));
                console.log('Gemini analysis complete:', geminiResults);
                navigate('/student/assessment/result');
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
    const isCurrentAnswered = !!answers[questionId];

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Stream Selection Screen
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

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-700">Select Your Stream/Course</Label>
                            {streams.map((stream) => (
                                <button
                                    key={stream.id}
                                    onClick={() => handleStreamSelect(stream.id)}
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-800 group-hover:text-indigo-700">{stream.label}</span>
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
                                    <ul className="space-y-1 text-sm">
                                        <li>• 5 assessment sections covering interests, personality, values, skills, and knowledge</li>
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
                                        ${isCurrent ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg ring-4 ring-indigo-100' : ''}
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
                                                className={`h-full rounded-full ${
                                                    idx < currentSectionIndex 
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
                                className="text-gray-600 mb-6 max-w-md leading-relaxed text-lg"
                            >
                                Great job! You've finished this section.
                            </motion.p>
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
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 text-lg shadow-lg"
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
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                                    currentSection.id === 'knowledge' 
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                            >
                                {currentSection.id === 'knowledge' ? (
                                    <>
                                        <Code className="w-4 h-4" />
                                        <span className="text-sm font-medium">Knowledge Test - Answers will be scored</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">No right or wrong answers</span>
                                    </>
                                )}
                            </motion.div>
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
                                        <span>30 minutes</span>
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
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 text-lg shadow-lg"
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

                                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 mb-4">
                                    <p className="text-xs font-medium text-indigo-700">{currentSection.instruction}</p>
                                </div>

                                {/* Section type indicator */}
                                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                                    currentSection.id === 'knowledge' 
                                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                    {currentSection.id === 'knowledge' ? (
                                        <>
                                            <Code className="w-3.5 h-3.5" />
                                            <span>Answers scored</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>No right or wrong</span>
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

                                {currentSection.isTimed && timeRemaining !== null && (
                                    <div className="flex items-center gap-3 text-sm font-semibold text-orange-600">
                                        <Clock className="w-4 h-4" />
                                        <span>Time: {formatTime(timeRemaining)}</span>
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
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
                                            {currentSection.responseScale ? (
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
                                        className="text-gray-500 hover:text-gray-800"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        Previous
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        disabled={!isCurrentAnswered}
                                        className={`bg-indigo-600 hover:bg-indigo-700 text-white px-8 transition-all ${!isCurrentAnswered ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-indigo-200'
                                            }`}
                                    >
                                        {currentSectionIndex === sections.length - 1 && currentQuestionIndex === currentSection.questions.length - 1
                                            ? 'Submit Assessment'
                                            : 'Next Question'
                                        }
                                        {currentSectionIndex === sections.length - 1 && currentQuestionIndex === currentSection.questions.length - 1
                                            ? <CheckCircle2 className="w-4 h-4 ml-2" />
                                            : <ChevronRight className="w-4 h-4 ml-2" />
                                        }
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
