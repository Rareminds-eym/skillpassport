import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Target, Clock, FileText, Zap, CheckCircle, ArrowLeft } from 'lucide-react';
import { checkAssessmentStatus } from '../../services/externalAssessmentService';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
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

/**
 * Assessment Start Page
 * Shows welcome screen and starts the assessment
 */
const AssessmentStart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isStarting, setIsStarting] = React.useState(false);
  const [checkingStatus, setCheckingStatus] = React.useState(true);
  const [inProgressAttempt, setInProgressAttempt] = React.useState(null);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const userEmail = user?.email;
  const { studentData } = useStudentDataByEmail(userEmail, false);

  // Get certificate/course data from navigation state
  const certificateName = location.state?.certificateName || location.state?.courseName || 'General Assessment';
  const courseId = location.state?.courseId || 'default';
  const certificateId = location.state?.certificateId;
  const useDynamicGeneration = location.state?.useDynamicGeneration || false;
  const level = location.state?.level || 'Intermediate';

  // Check for in-progress assessment on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (studentData?.id && certificateName) {
        setCheckingStatus(true);
        console.log('🔍 Checking assessment status for:', {
          studentId: studentData.id,
          courseName: certificateName
        });
        
        const result = await checkAssessmentStatus(studentData.id, certificateName);
        
        console.log('📊 Assessment status result:', result);
        
        if (result.status === 'in_progress' && result.attempt) {
          console.log('✅ Found in-progress attempt:', {
            id: result.attempt.id,
            currentQuestionIndex: result.attempt.current_question_index,
            totalQuestions: result.attempt.total_questions,
            answeredCount: result.attempt.student_answers?.filter(a => a.selected_answer !== null).length,
            timeRemaining: result.attempt.time_remaining
          });
          setInProgressAttempt(result.attempt);
        } else if (result.status === 'completed') {
          // Already completed, go back
          alert('You have already completed this assessment');
          navigate('/student/my-learning');
          return;
        } else {
          console.log('ℹ️ No in-progress attempt found');
        }
        setCheckingStatus(false);
      } else {
        setCheckingStatus(false);
      }
    };
    
    checkStatus();
  }, [studentData?.id, certificateName, navigate]);

  const handleStartAssessment = async () => {
    setIsStarting(true);
    
    // If there's an in-progress attempt, resume it
    if (inProgressAttempt) {
      console.log('📝 Resuming in-progress assessment from question', inProgressAttempt.current_question_index + 1);
      console.log('📦 Passing resumeAttempt to test page:', {
        id: inProgressAttempt.id,
        currentQuestionIndex: inProgressAttempt.current_question_index,
        questionsCount: inProgressAttempt.questions?.length,
        answersCount: inProgressAttempt.student_answers?.length
      });
      
      // Navigate to DynamicAssessment with resume data
      navigate('/student/assessment/dynamic', { 
        state: { 
          courseId,
          certificateId,
          courseName: certificateName,
          userId: user?.id,
          email: user?.email,
          level,
          resumeAttempt: inProgressAttempt
        } 
      });
      return;
    }
    
    // If using dynamic generation, pre-load questions here
    if (useDynamicGeneration && certificateName) {
      try {
        console.log('🎯 Pre-generating questions for:', certificateName);
        
        // Use the generateAssessment service which checks database first
        const { generateAssessment } = await import('../../services/assessmentGenerationService');
        const assessment = await generateAssessment(certificateName, level, 15, courseId);
        
        console.log('✅ Questions loaded, navigating to test...');
        
        // Navigate to DynamicAssessment with pre-generated questions
        navigate('/student/assessment/dynamic', { 
          state: { 
            courseId,
            certificateId,
            courseName: certificateName,
            userId: user?.id,
            email: user?.email,
            level,
            preGeneratedQuestions: assessment.questions // Pass the questions
          } 
        });
      } catch (error) {
        console.error('❌ Error loading questions:', error);
        alert('Failed to load assessment. Please try again.');
        setIsStarting(false);
      }
    } else {
      // Navigate to DynamicAssessment for static questions
      navigate('/student/assessment/dynamic', { 
        state: { 
          courseId,
          certificateId,
          courseName: certificateName,
          userId: user?.id,
          email: user?.email,
          level
        } 
      });
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - White with Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-white p-12 flex-col justify-between relative overflow-hidden">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 z-10 mb-6">
            <img 
              src="/RareMinds.webp" 
              alt="RareMinds Logo" 
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/student/my-learning')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to My Learning</span>
          </button>
        </div>

        {/* Illustration Card */}
        <div className="z-10">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 border border-blue-200 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="h-3 bg-blue-300 rounded-full w-3/4 mb-2"></div>
                <div className="h-3 bg-blue-200 rounded-full w-1/2"></div>
              </div>
            </div>
            <div className="flex gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-400 rounded-full"></div>
              <div className="w-12 h-12 bg-purple-400 rounded-full"></div>
              <div className="w-12 h-12 bg-pink-400 rounded-full"></div>
            </div>
            <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium inline-block">
              Completed
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="text-gray-800 z-10">
          <p className="text-xl font-medium mb-2">"The secret of getting ahead is getting started."</p>
          <p className="text-gray-500">— Mark Twain</p>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Blue Gradient with Assessment Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-blue-600 to-indigo-600 relative overflow-hidden">
        {/* Decorative circles for right side */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        <div className="max-w-md w-full z-10">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
              <Target className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">{certificateName}</h1>

            {user && (
              <p className="text-white/80">
                Hello, <span className="font-semibold text-white">{user.email?.split('@')[0]}</span>!
              </p>
            )}
          </div>

          {/* Resume Progress Banner */}
          {inProgressAttempt && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
              <div className="flex">
                <CheckCircle className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-xs font-semibold text-white mb-1">Assessment In Progress</h3>
                  <p className="text-xs text-white/80">
                    You have an incomplete assessment. You'll resume from question{' '}
                    {inProgressAttempt.current_question_index + 1} of {inProgressAttempt.total_questions}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 mb-6 border border-white/20">
            <h2 className="text-base font-semibold text-white mb-3">What to Expect:</h2>
            <ul className="space-y-2.5">
              <li className="flex items-start text-sm">
                <Clock className="w-5 h-5 text-white/80 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-white/90">
                  <strong className="text-white">Duration:</strong> Approximately 15-20 minutes
                </span>
              </li>
              <li className="flex items-start text-sm">
                <FileText className="w-5 h-5 text-white/80 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-white/90">
                  <strong className="text-white">Questions:</strong> Multiple choice format
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Zap className="w-5 h-5 text-white/80 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-white/90">
                  <strong className="text-white">Results:</strong> Instant feedback upon completion
                </span>
              </li>
            </ul>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-500/20 backdrop-blur-sm border-l-4 border-yellow-400 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg
                className="w-5 h-5 text-yellow-300 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="text-xs font-semibold text-yellow-200 mb-1">Important:</h3>
                <p className="text-xs text-yellow-100/90">
                  Please ensure you have a stable internet connection and won't be interrupted during the assessment.
                </p>
              </div>
            </div>
          </div>

          {/* Start/Continue Button */}
          <button
            onClick={handleStartAssessment}
            disabled={isStarting || checkingStatus}
            className="w-full bg-white hover:bg-gray-100 text-blue-600 font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
          >
            {checkingStatus ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking status...
              </>
            ) : isStarting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {inProgressAttempt ? 'Resuming...' : 'Starting Assessment...'}
              </>
            ) : inProgressAttempt ? (
              <>
                Continue Assessment (Q{inProgressAttempt.current_question_index + 1}/{inProgressAttempt.total_questions})
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            ) : (
              <>
                {inProgressAttempt ? 'Continue Assessment' : 'Start Assessment'}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {/* Footer Note */}
          <p className="text-center text-xs text-white/70 mt-4">
            Your progress will be automatically saved
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssessmentStart;
