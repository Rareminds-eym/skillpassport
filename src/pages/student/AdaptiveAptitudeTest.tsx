/**
 * Adaptive Aptitude Test Page Component
 * 
 * Main page for taking the adaptive aptitude test.
 * Reuses existing assessment UI components and wires up the useAdaptiveAptitude hook.
 * 
 * Requirements: 5.1
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Award,
  AlertCircle,
  ChevronRight,
  Brain,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../../components/Students/components/ui/button';
import { Card, CardContent } from '../../components/Students/components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/Students/components/ui/radio-group';
import { Label } from '../../components/Students/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/Students/components/ui/alert-dialog';
import { useAdaptiveAptitude } from '../../hooks/useAdaptiveAptitude';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { GradeLevel, TestPhase, Subtag, DifficultyLevel, ConfidenceTag } from '../../types/adaptiveAptitude';

// =============================================================================
// DEBUG MODE
// =============================================================================
const DEBUG_MODE = true; // Set to false in production

// =============================================================================
// CONSTANTS
// =============================================================================

/** Phase display names */
const PHASE_DISPLAY_NAMES: Record<TestPhase, string> = {
  diagnostic_screener: 'Diagnostic Screener',
  adaptive_core: 'Adaptive Core',
  stability_confirmation: 'Stability Confirmation',
};

/** Subtag display names */
const SUBTAG_DISPLAY_NAMES: Record<Subtag, string> = {
  numerical_reasoning: 'Numerical Reasoning',
  logical_reasoning: 'Logical Reasoning',
  verbal_reasoning: 'Verbal Reasoning',
  spatial_reasoning: 'Spatial Reasoning',
  data_interpretation: 'Data Interpretation',
  pattern_recognition: 'Pattern Recognition',
};

/** Difficulty level labels */
const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

/** Confidence tag colors */
const CONFIDENCE_COLORS: Record<ConfidenceTag, { bg: string; text: string; border: string }> = {
  high: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  low: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Adaptive Aptitude Test Page
 * 
 * Provides the UI for taking an adaptive aptitude test that adjusts difficulty
 * based on student performance.
 */
const AdaptiveAptitudeTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get grade level from navigation state or default to high_school
  const gradeLevel: GradeLevel = location.state?.gradeLevel || 'high_school';
  
  // Get student data
  const { studentData, loading: studentLoading } = useStudentDataByEmail(user?.email || '', false);
  
  // Local state
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [testInitialized, setTestInitialized] = useState(false);
  
  // Use the adaptive aptitude hook
  const {
    currentQuestion,
    session,
    progress,
    phase,
    loading,
    submitting,
    error,
    isTestComplete,
    results,
    startTest,
    submitAnswer,
    checkAndResumeSession,
    // abandonTest is available for future use
    clearError,
  } = useAdaptiveAptitude({
    studentId: studentData?.id || '',
    gradeLevel,
    onTestComplete: (testResults) => {
      console.log('✅ Adaptive aptitude test completed:', testResults);
    },
    onError: (err) => {
      console.error('❌ Adaptive aptitude test error:', err);
    },
  });

  // Debug logging - after hook is initialized
  useEffect(() => {
    if (DEBUG_MODE) {
      console.log('🔍 [AdaptiveAptitudeTest] Component State:', {
        user: user?.email,
        studentData: studentData ? { id: studentData.id, email: studentData.email } : null,
        studentLoading,
        gradeLevel,
        testInitialized,
        loading,
        error,
        currentQuestion: currentQuestion ? { id: currentQuestion.id, text: currentQuestion.text?.substring(0, 50) } : null,
        session: session ? { id: session.id, phase: session.currentPhase, questionsAnswered: session.questionsAnswered } : null,
        phase,
        isTestComplete,
        results: results ? 'Available' : null,
      });
    }
  }, [user, studentData, studentLoading, gradeLevel, testInitialized, loading, error, currentQuestion, session, phase, isTestComplete, results]);

  // Initialize test when student data is available
  useEffect(() => {
    const initializeTest = async () => {
      console.log('🚀 [AdaptiveAptitudeTest] initializeTest called:', {
        hasStudentId: !!studentData?.id,
        studentId: studentData?.id,
        testInitialized,
        loading,
      });
      
      if (studentData?.id && !testInitialized && !loading) {
        console.log('✅ [AdaptiveAptitudeTest] Starting test initialization...');
        setTestInitialized(true);
        
        try {
          // Check for existing in-progress session
          console.log('🔍 [AdaptiveAptitudeTest] Checking for existing session...');
          const hasExistingSession = await checkAndResumeSession();
          console.log('📋 [AdaptiveAptitudeTest] Existing session check result:', hasExistingSession);
          
          if (!hasExistingSession) {
            // Start a new test
            console.log('🆕 [AdaptiveAptitudeTest] No existing session, starting new test...');
            await startTest();
            console.log('✅ [AdaptiveAptitudeTest] New test started successfully');
          } else {
            console.log('♻️ [AdaptiveAptitudeTest] Resumed existing session');
          }
        } catch (err) {
          console.error('❌ [AdaptiveAptitudeTest] Failed to initialize test:', err);
          // Error will be handled by the hook's error state
        }
      } else {
        console.log('⏳ [AdaptiveAptitudeTest] Waiting for conditions:', {
          hasStudentId: !!studentData?.id,
          testInitialized,
          loading,
        });
      }
    };

    initializeTest();
  }, [studentData?.id, testInitialized, loading, checkAndResumeSession, startTest]);

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(null);
  }, [currentQuestion?.id]);

  // Handle answer submission
  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) return;
    
    await submitAnswer(selectedAnswer);
    setSelectedAnswer(null);
  };

  // Handle exit
  const handleExit = async () => {
    // Progress is auto-saved, just navigate away
    navigate('/student/my-learning');
  };

  // Handle abandon and exit (abandonTest available from hook if needed)
  // const handleAbandonAndExit = async () => {
  //   await abandonTest();
  //   navigate('/student/my-learning');
  // };

  // Format time display
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading || studentLoading || !testInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Preparing Your Test</h2>
          <p className="text-gray-600 mb-4">Setting up your adaptive aptitude assessment...</p>
          <div className="bg-white rounded-xl p-4 mb-4 border-2 border-blue-200">
            <div className="flex items-center justify-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              <p className="text-lg font-bold text-blue-600">Adaptive Aptitude Test</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Grade Level: {gradeLevel === 'middle_school' ? 'Middle School' : 'High School'}
            </p>
          </div>
          <p className="text-sm text-gray-400">This may take a few seconds...</p>
          
          {/* Debug Panel */}
          {DEBUG_MODE && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left text-xs">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-orange-600">Debug Info</span>
              </div>
              <div className="space-y-1 font-mono">
                <p>User Email: {user?.email || 'Not logged in'}</p>
                <p>Student ID: {studentData?.id || 'Loading...'}</p>
                <p>Student Loading: {studentLoading ? 'Yes' : 'No'}</p>
                <p>Hook Loading: {loading ? 'Yes' : 'No'}</p>
                <p>Test Initialized: {testInitialized ? 'Yes' : 'No'}</p>
                <p>Grade Level: {gradeLevel}</p>
                <p>Error: {error || 'None'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    // Check for common error types and provide helpful messages
    let errorMessage = error;
    let helpText = '';
    
    if (error.includes('relation') || error.includes('does not exist') || error.includes('42P01')) {
      errorMessage = 'Database tables not found';
      helpText = 'The adaptive aptitude test database tables need to be created. Please run the migration script.';
    } else if (error.includes('API key') || error.includes('401') || error.includes('Unauthorized')) {
      errorMessage = 'API configuration error';
      helpText = 'The AI question generation service is not properly configured.';
    } else if (error.includes('permission') || error.includes('RLS') || error.includes('policy')) {
      errorMessage = 'Permission denied';
      helpText = 'You may not have permission to access this test. Please contact support.';
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Test</h2>
            <p className="text-gray-600 mb-2">{errorMessage}</p>
            {helpText && <p className="text-sm text-gray-500 mb-6">{helpText}</p>}
            {!helpText && <p className="text-sm text-gray-500 mb-6">{error}</p>}
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/student/my-learning')}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={() => {
                  clearError();
                  setTestInitialized(false);
                }}
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
  if (isTestComplete && results) {
    const aptitudeLabel = DIFFICULTY_LABELS[results.aptitudeLevel];
    const confidenceColors = CONFIDENCE_COLORS[results.confidenceTag];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Results Header */}
            <Card className="overflow-hidden rounded-2xl shadow-xl border border-gray-100 mb-6">
              <div className="p-8 text-center bg-gradient-to-r from-blue-500 to-indigo-500">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-28 h-28 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Award className="w-14 h-14 text-white" />
                </motion.div>
                
                <h1 className="text-2xl font-bold text-white mb-2">Assessment Complete!</h1>
                <p className="text-white/90 text-sm">
                  Your adaptive aptitude test has been completed
                </p>
              </div>

              <div className="p-8 bg-white">
                {/* Aptitude Level */}
                <div className="flex justify-center mb-8">
                  <div className="relative w-40 h-40 rounded-full flex items-center justify-center bg-blue-50">
                    <div className="text-center">
                      <span className="text-5xl font-bold text-blue-600">
                        {results.aptitudeLevel}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">{aptitudeLabel}</p>
                      <p className="text-xs text-gray-400">Aptitude Level</p>
                    </div>
                  </div>
                </div>

                {/* Confidence Tag */}
                <div className="flex justify-center mb-8">
                  <div className={`px-4 py-2 rounded-full ${confidenceColors.bg} ${confidenceColors.border} border`}>
                    <span className={`text-sm font-medium ${confidenceColors.text}`}>
                      {results.confidenceTag.charAt(0).toUpperCase() + results.confidenceTag.slice(1)} Confidence
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{results.totalQuestions}</p>
                    <p className="text-xs text-gray-500">Total Questions</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{results.totalCorrect}</p>
                    <p className="text-xs text-gray-500">Correct</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{Math.round(results.overallAccuracy)}%</p>
                    <p className="text-xs text-gray-500">Accuracy</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatTime(results.averageResponseTimeMs)}
                    </p>
                    <p className="text-xs text-gray-500">Avg Time</p>
                  </div>
                </div>

                {/* Path Classification */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Performance Pattern: {results.pathClassification.charAt(0).toUpperCase() + results.pathClassification.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Back Button */}
                <Button
                  onClick={() => navigate('/student/my-learning')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to My Learning
                </Button>
              </div>
            </Card>

            {/* Detailed Analytics */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Accuracy by Difficulty */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Accuracy by Difficulty</h3>
                  <div className="space-y-3">
                    {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((level) => {
                      const data = results.accuracyByDifficulty[level];
                      if (data.total === 0) return null;
                      return (
                        <div key={level} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-gray-600">{DIFFICULTY_LABELS[level]}</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${data.accuracy}%` }}
                            />
                          </div>
                          <span className="w-16 text-sm text-gray-600 text-right">
                            {data.correct}/{data.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Accuracy by Subtag */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Accuracy by Category</h3>
                  <div className="space-y-3">
                    {(Object.keys(SUBTAG_DISPLAY_NAMES) as Subtag[]).map((subtag) => {
                      const data = results.accuracyBySubtag[subtag];
                      if (data.total === 0) return null;
                      return (
                        <div key={subtag} className="flex items-center gap-3">
                          <span className="w-32 text-sm text-gray-600 truncate" title={SUBTAG_DISPLAY_NAMES[subtag]}>
                            {SUBTAG_DISPLAY_NAMES[subtag]}
                          </span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${data.accuracy}%` }}
                            />
                          </div>
                          <span className="w-16 text-sm text-gray-600 text-right">
                            {data.correct}/{data.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Question display
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading next question...</p>
        </div>
      </div>
    );
  }

  // Calculate progress percentage
  const progressPercentage = progress ? progress.completionPercentage : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setShowExitDialog(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Exit Test</span>
          </button>

          {/* Exit Confirmation Dialog */}
          <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
            <AlertDialogContent className="bg-white rounded-xl max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                  Exit Adaptive Test?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  Your progress will be saved. You can resume this test later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleExit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save & Exit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center gap-4">
            {/* Phase indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {phase ? PHASE_DISPLAY_NAMES[phase] : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {progress ? progress.questionsAnswered + 1 : 1}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {progressPercentage}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Test Info */}
        <div className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Adaptive Aptitude Test</h2>
              <p className="text-sm text-gray-600">
                {gradeLevel === 'middle_school' ? 'Middle School' : 'High School'} Level
              </p>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardContent className="p-8">
                {/* Question Header */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">
                        {progress ? progress.currentQuestionIndex + 1 : 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-medium text-gray-900 leading-relaxed">
                        {currentQuestion.text}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 capitalize">
                          {SUBTAG_DISPLAY_NAMES[currentQuestion.subtag]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <RadioGroup
                  value={selectedAnswer || ''}
                  onValueChange={(value: string) => setSelectedAnswer(value as 'A' | 'B' | 'C' | 'D')}
                  className="space-y-3"
                >
                  {(['A', 'B', 'C', 'D'] as const).map((option) => (
                    <div
                      key={option}
                      className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedAnswer === option
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedAnswer(option)}
                    >
                      <RadioGroupItem value={option} id={`option-${option}`} />
                      <Label
                        htmlFor={`option-${option}`}
                        className="flex-1 cursor-pointer text-gray-700"
                      >
                        <span className="font-semibold mr-2">{option}.</span>
                        {currentQuestion.options[option]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer || submitting}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Answer
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveAptitudeTest;
