import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Target,
  Award,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/Students/components/ui/button';
import { Card, CardContent } from '../../components/Students/components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/Students/components/ui/radio-group';
import { Label } from '../../components/Students/components/ui/label';
import { generateAssessment, getCachedAssessment, cacheAssessment } from '../../services/assessmentGenerationService';
import { 
  createAssessmentAttempt, 
  updateAssessmentProgress, 
  completeAssessment,
  checkAssessmentStatus 
} from '../../services/externalAssessmentService';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useAuth } from '../../context/AuthContext';

/**
 * Dynamic Assessment Component
 * Generates course-specific assessments using AI
 */
const DynamicAssessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get course info from navigation state
  const courseName = location.state?.courseName || 'General Skills';
  const courseLevel = location.state?.level || 'Intermediate';
  const courseId = location.state?.courseId;
  const resumeAttempt = location.state?.resumeAttempt; // For resuming in-progress assessment
  const preGeneratedQuestions = location.state?.preGeneratedQuestions; // For pre-generated questions
  
  // Get student data
  const { studentData } = useStudentDataByEmail(user?.email, false);
  
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes default
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [attemptId, setAttemptId] = useState(null); // Track database attempt ID
  const [isSaving, setIsSaving] = useState(false); // Track save status
  const [loadedExistingAttempt, setLoadedExistingAttempt] = useState(null); // Store loaded existing attempt

  // Check for existing in-progress attempt when page loads directly (not from AssessmentStart)
  useEffect(() => {
    const checkForExistingAttempt = async () => {
      // Only check if:
      // 1. No resumeAttempt was passed in location state
      // 2. We have student data and course name
      // 3. We haven't loaded an existing attempt yet
      if (!resumeAttempt && loadedExistingAttempt === null && studentData?.id && courseName) {
        console.log('🔍 DynamicAssessment: Checking for existing in-progress attempt...', {
          studentId: studentData.id,
          courseName: courseName
        });
        
        const result = await checkAssessmentStatus(studentData.id, courseName);
        
        console.log('📊 DynamicAssessment: Check result:', result);
        
        if (result.status === 'in_progress' && result.attempt) {
          console.log('✅ DynamicAssessment: Found existing in-progress attempt!', {
            attemptId: result.attempt.id,
            currentQuestionIndex: result.attempt.current_question_index,
            totalQuestions: result.attempt.total_questions,
            timeRemaining: result.attempt.time_remaining
          });
          setLoadedExistingAttempt(result.attempt);
        } else if (result.status === 'completed') {
          console.log('⚠️ DynamicAssessment: Assessment already completed');
          alert('You have already completed this assessment');
          navigate('/student/my-learning');
          return;
        } else {
          console.log('ℹ️ DynamicAssessment: No existing attempt found, will create new one');
          setLoadedExistingAttempt(false); // Mark as checked but no attempt found
        }
      }
    };
    
    checkForExistingAttempt();
  }, [studentData?.id, courseName, resumeAttempt, loadedExistingAttempt, navigate]);

  // Load or generate assessment
  useEffect(() => {
    console.log('🔄 DynamicAssessment: Load assessment effect triggered', {
      resumeAttempt: resumeAttempt ? 'YES' : 'NO',
      loadedExistingAttempt: loadedExistingAttempt === null ? 'NULL' : loadedExistingAttempt === false ? 'FALSE' : 'ATTEMPT_OBJECT'
    });
    
    // Only load assessment after we've checked for existing attempts
    // OR if resumeAttempt was passed directly
    if (resumeAttempt || loadedExistingAttempt !== null) {
      console.log('✅ DynamicAssessment: Conditions met, calling loadAssessment()');
      loadAssessment();
    } else {
      console.log('⏳ DynamicAssessment: Waiting for existing attempt check...');
    }
  }, [courseName, resumeAttempt, loadedExistingAttempt]);

  // Debug: Log course info
  useEffect(() => {
    console.log('🎓 Assessment Page Loaded:', {
      courseName,
      courseLevel,
      locationState: location.state,
      resumeAttempt: resumeAttempt ? 'YES' : 'NO',
      preGeneratedQuestions: preGeneratedQuestions ? 'YES' : 'NO'
    });
  }, [courseName, courseLevel, location.state]);

  // Timer - countdown for timed assessments
  useEffect(() => {
    if (!loading && !showResults && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - auto submit
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, showResults, timeRemaining]);

  // Auto-save progress every 10 seconds
  useEffect(() => {
    if (!loading && !showResults && attemptId && assessment) {
      const autoSave = setInterval(() => {
        const currentAnswer = answers[assessment.questions[currentQuestionIndex]?.id];
        if (currentAnswer) {
          console.log('💾 Auto-saving progress...');
          updateAssessmentProgress(
            attemptId,
            currentQuestionIndex,
            currentAnswer,
            timeRemaining
          );
        }
      }, 10000); // Every 10 seconds

      return () => clearInterval(autoSave);
    }
  }, [loading, showResults, attemptId, currentQuestionIndex, answers, timeRemaining, assessment]);

  const loadAssessment = async () => {
    console.log('📥 DynamicAssessment: loadAssessment() called');
    setLoading(true);
    setError(null);

    try {
      // Determine which attempt to use: passed via state or loaded from database
      const attemptToResume = resumeAttempt || (loadedExistingAttempt && loadedExistingAttempt !== false ? loadedExistingAttempt : null);
      
      console.log('🔍 DynamicAssessment: Checking attemptToResume:', {
        hasResumeAttempt: !!resumeAttempt,
        hasLoadedExistingAttempt: !!(loadedExistingAttempt && loadedExistingAttempt !== false),
        attemptToResume: attemptToResume ? 'YES' : 'NO'
      });
      
      // CASE 1: Resuming an in-progress assessment
      if (attemptToResume) {
        console.log('🔄 DynamicAssessment: CASE 1 - Resuming in-progress assessment:', {
          attemptId: attemptToResume.id,
          courseName: attemptToResume.course_name,
          currentQuestionIndex: attemptToResume.current_question_index,
          totalQuestions: attemptToResume.total_questions,
          timeRemaining: attemptToResume.time_remaining
        });
        
        // Restore assessment data from attempt
        const restoredAssessment = {
          course: attemptToResume.course_name,
          level: attemptToResume.assessment_level,
          questions: attemptToResume.questions
        };
        
        console.log('📦 DynamicAssessment: Restored assessment:', {
          course: restoredAssessment.course,
          level: restoredAssessment.level,
          questionsCount: restoredAssessment.questions?.length
        });
        
        setAssessment(restoredAssessment);
        setAttemptId(attemptToResume.id);
        
        // Restore progress
        const restoredQuestionIndex = attemptToResume.current_question_index || 0;
        const restoredTimeRemaining = attemptToResume.time_remaining || 900;
        
        console.log('⏮️ DynamicAssessment: Restoring progress:', {
          questionIndex: restoredQuestionIndex,
          timeRemaining: restoredTimeRemaining
        });
        
        setCurrentQuestionIndex(restoredQuestionIndex);
        setTimeRemaining(restoredTimeRemaining);
        
        // Restore answers
        const restoredAnswers = {};
        attemptToResume.student_answers?.forEach((ans, idx) => {
          if (ans.selected_answer !== null) {
            const questionId = attemptToResume.questions[idx]?.id;
            if (questionId) {
              restoredAnswers[questionId] = ans.selected_answer;
            }
          }
        });
        setAnswers(restoredAnswers);
        
        console.log('✅ DynamicAssessment: Assessment resumed successfully!', {
          questionIndex: restoredQuestionIndex,
          answersRestored: Object.keys(restoredAnswers).length,
          timeRemaining: restoredTimeRemaining
        });
        
        setLoading(false);
        return;
      }

      console.log('➡️ DynamicAssessment: No attempt to resume, proceeding to other cases...');

      // CASE 2: Using pre-generated questions
      if (preGeneratedQuestions && Array.isArray(preGeneratedQuestions)) {
        console.log('✅ Using pre-generated questions:', preGeneratedQuestions.length);
        
        const generatedAssessment = {
          course: courseName,
          level: courseLevel,
          questions: preGeneratedQuestions
        };
        
        setAssessment(generatedAssessment);
        
        // Create database attempt if user is logged in
        if (studentData?.id) {
          const result = await createAssessmentAttempt({
            studentId: studentData.id,
            courseName: courseName,
            courseId: courseId,
            assessmentLevel: courseLevel,
            questions: preGeneratedQuestions
          });
          
          if (result.success) {
            setAttemptId(result.data.id);
            console.log('✅ Database attempt created:', result.data.id);
          } else {
            console.warn('⚠️ Could not create database attempt:', result.error);
          }
        }
        
        setLoading(false);
        return;
      }

      // CASE 3: Try to load from cache first
      const cached = getCachedAssessment(courseName);
      
      if (cached) {
        console.log('✅ Using cached assessment for:', courseName);
        console.log('📅 Cached on:', new Date(cached.cachedAt).toLocaleString());
        setAssessment(cached);
        
        // Create database attempt if user is logged in
        if (studentData?.id) {
          const result = await createAssessmentAttempt({
            studentId: studentData.id,
            courseName: courseName,
            courseId: courseId,
            assessmentLevel: courseLevel,
            questions: cached.questions
          });
          
          if (result.success) {
            setAttemptId(result.data.id);
            console.log('✅ Database attempt created:', result.data.id);
          }
        }
        
        setLoading(false);
        return;
      }

      // CASE 4: Generate new assessment
      console.log('🔄 No cache found. Generating new assessment for:', courseName);
      const generated = await generateAssessment(courseName, courseLevel, 15, courseId);
      
      console.log('✅ Assessment generated successfully');
      setAssessment(generated);
      cacheAssessment(courseName, generated);
      
      // Create database attempt if user is logged in
      if (studentData?.id) {
        const result = await createAssessmentAttempt({
          studentId: studentData.id,
          courseName: courseName,
          courseId: courseId,
          assessmentLevel: courseLevel,
          questions: generated.questions
        });
        
        if (result.success) {
          setAttemptId(result.data.id);
          console.log('✅ Database attempt created:', result.data.id);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading assessment:', err);
      setError(err.message || 'Failed to load assessment');
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Don't save here - we'll save when user clicks Next
    // This prevents overwriting the progress saved by handleNext
  };

  const handleNext = async () => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      // Save progress before moving to next question
      if (attemptId) {
        setIsSaving(true);
        const currentAnswer = answers[assessment.questions[currentQuestionIndex]?.id];
        if (currentAnswer) {
          console.log('💾 Saving progress before moving to next question...', {
            currentQuestionIndex,
            nextQuestionIndex: currentQuestionIndex + 1,
            answer: currentAnswer
          });
          
          // Save the CURRENT question's answer with the NEXT question index
          // So when user resumes, they start from the next question
          await updateAssessmentProgress(
            attemptId,
            currentQuestionIndex, // Current question index (the one we just answered)
            currentAnswer,
            timeRemaining,
            currentQuestionIndex + 1 // Next question index (where to resume)
          );
        }
        setIsSaving(false);
      }

      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    // Calculate score
    let correctCount = 0;
    assessment.questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer && userAnswer === q.correct_answer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / assessment.questions.length) * 100);
    setScore(percentage);

    // Complete assessment in database
    if (attemptId) {
      const timeTaken = 900 - timeRemaining; // Calculate time taken
      const result = await completeAssessment(attemptId, timeTaken);
      
      if (result.success) {
        console.log('✅ Assessment completed in database');
      } else {
        console.error('❌ Failed to complete assessment:', result.error);
      }
    }

    setShowResults(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Assessment</h2>
          <p className="text-gray-600 mb-4">Creating personalized questions for:</p>
          <div className="bg-white rounded-xl p-4 mb-4 border-2 border-blue-200">
            <p className="text-xl font-bold text-blue-600">{courseName}</p>
            <p className="text-sm text-gray-500">Level: {courseLevel}</p>
          </div>
          <p className="text-sm text-gray-400">This may take 10-20 seconds...</p>
          <p className="text-xs text-gray-400 mt-2">Questions will be cached for future use</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Assessment</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={loadAssessment}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const passed = score >= 60;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center py-8 px-4">
        <div className="max-w-lg w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden rounded-2xl shadow-xl border border-gray-100">
              {/* Header with gradient */}
              <div className={`p-8 text-center ${
                passed 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4"
                >
                  {passed ? (
                    <Award className="w-10 h-10 text-white" />
                  ) : (
                    <Target className="w-10 h-10 text-white" />
                  )}
                </motion.div>
                
                <h1 className="text-2xl font-bold text-white mb-2">
                  {passed ? 'Congratulations!' : 'Keep Learning!'}
                </h1>
                <p className="text-white/90 text-sm">
                  {passed 
                    ? 'You have successfully passed the assessment' 
                    : 'Review the material and strengthen your skills'}
                </p>
              </div>

              {/* Score Section */}
              <div className="p-8 bg-white">
                {/* Score Circle */}
                <div className="flex justify-center mb-8">
                  <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
                    passed ? 'bg-emerald-50' : 'bg-blue-50'
                  }`}>
                    <div className="text-center">
                      <span className={`text-4xl font-bold ${
                        passed ? 'text-emerald-600' : 'text-blue-600'
                      }`}>
                        {score}%
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Your Score</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xl font-bold text-gray-900">{assessment.questions.length}</p>
                    <p className="text-xs text-gray-500">Total Questions</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className={`text-xl font-bold ${passed ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {Math.round((score / 100) * assessment.questions.length)}
                    </p>
                    <p className="text-xs text-gray-500">Correct</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xl font-bold text-gray-900">{formatTime(900 - timeRemaining)}</p>
                    <p className="text-xs text-gray-500">Time Taken</p>
                  </div>
                </div>

                {/* Assessment Info */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800 text-center">
                    <span className="font-semibold">{courseName}</span>
                    <br />
                    <span className="text-blue-600 text-xs">Assessment Completed</span>
                  </p>
                </div>

                {/* Action Button - Only Back to Learning */}
                <Button
                  onClick={() => navigate('/student/my-learning')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-200/50"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to My Learning
                </Button>

                {/* Note about one-time assessment */}
                <p className="text-center text-xs text-gray-400 mt-4">
                  This assessment can only be taken once per course
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Assessment questions
  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const isAnswered = answers[currentQuestion.id] !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to exit? Your progress will be saved.')) {
                navigate(-1);
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Exit Assessment</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Save indicator */}
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{formatTime(timeRemaining)}</span>
            </div>
            
            {/* Debug: Regenerate button */}
            {import.meta.env.DEV && (
              <button
                onClick={() => {
                  if (window.confirm('Regenerate questions? Current progress will be lost.')) {
                    // Clear cache
                    const cacheKey = `assessment_${courseName.toLowerCase().replace(/\s+/g, '_')}`;
                    localStorage.removeItem(cacheKey);
                    // Reload
                    window.location.reload();
                  }
                }}
                className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                title="Clear cache and regenerate questions"
              >
                🔄 Regenerate
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          {/* Resume banner */}
          {(resumeAttempt || (loadedExistingAttempt && loadedExistingAttempt !== false)) && (
            <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">Assessment Resumed</h3>
                  <p className="text-xs text-blue-700">
                    You're continuing from question {currentQuestionIndex + 1}. 
                    Your previous answers have been restored.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {assessment.questions.length}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Course Info */}
        <div className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{assessment.course}</h2>
              <p className="text-sm text-gray-600">Level: {assessment.level}</p>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardContent className="p-8">
                {/* Question */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-medium text-gray-900 leading-relaxed">
                        {currentQuestion.question}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                        <span className="text-xs font-medium text-gray-600">
                          {currentQuestion.skill_tag}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options */}
                {currentQuestion.type === 'mcq' && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                  >
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, idx) => (
                        <div
                          key={idx}
                          className={`
                            relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer
                            ${answers[currentQuestion.id] === option
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                            }
                          `}
                        >
                          <RadioGroupItem
                            value={option}
                            id={`option-${idx}`}
                            className="mr-3"
                          />
                          <Label
                            htmlFor={`option-${idx}`}
                            className="flex-1 cursor-pointer text-gray-900"
                          >
                            {option}
                          </Label>
                          {answers[currentQuestion.id] === option && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {/* Short Answer */}
                {currentQuestion.type === 'short_answer' && (
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                    rows={4}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="px-6"
          >
            Previous
          </Button>

          <div className="text-sm text-gray-600">
            {Object.keys(answers).length} of {assessment.questions.length} answered
          </div>

          <Button
            onClick={handleNext}
            disabled={!isAnswered}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            {currentQuestionIndex === assessment.questions.length - 1 ? 'Submit' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DynamicAssessment;
