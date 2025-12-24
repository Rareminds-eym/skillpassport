import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Target, Clock, FileText, Zap, CheckCircle, ArrowLeft } from 'lucide-react';
import { checkAssessmentStatus } from '../../services/externalAssessmentService';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';

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
        const result = await checkAssessmentStatus(studentData.id, certificateName);
        
        if (result.status === 'in_progress' && result.attempt) {
          setInProgressAttempt(result.attempt);
        } else if (result.status === 'completed') {
          // Already completed, go back
          alert('You have already completed this assessment');
          navigate('/student/my-learning');
          return;
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
      
      // Navigate with saved data
      navigate('/student/assessment/start', { 
        state: { 
          courseId,
          certificateId,
          certificateName,
          userId: user?.id,
          email: user?.email,
          useDynamicGeneration,
          level,
          resumeAttempt: inProgressAttempt,
          preGeneratedQuestions: inProgressAttempt.questions
        } 
      });
      return;
    }
    
    // If using dynamic generation, pre-load questions here
    if (useDynamicGeneration && certificateName) {
      try {
        console.log('🎯 Pre-generating questions for:', certificateName);
        
        // Call backend API to generate questions
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/assessment/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseName: certificateName,
            level: level,
            questionCount: 15
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate assessment questions');
        }
        
        const assessment = await response.json();
        console.log('✅ Questions generated, navigating to test...');
        
        // Navigate with pre-generated questions
        navigate('/student/assessment/start', { 
          state: { 
            courseId,
            certificateId,
            certificateName,
            userId: user?.id,
            email: user?.email,
            useDynamicGeneration,
            level,
            preGeneratedQuestions: assessment.questions // Pass the questions
          } 
        });
      } catch (error) {
        console.error('❌ Error generating questions:', error);
        alert('Failed to generate assessment. Please try again.');
        setIsStarting(false);
      }
    } else {
      // Navigate normally for static questions
      navigate('/student/assessment/start', { 
        state: { 
          courseId,
          certificateId,
          certificateName,
          userId: user?.id,
          email: user?.email,
          useDynamicGeneration,
          level
        } 
      });
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Purple Gradient with Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-600 p-12 flex-col justify-between relative overflow-hidden">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 text-white z-10 mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Target className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">RareMinds</span>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/student/my-learning')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to My Learning</span>
          </button>
        </div>

        {/* Illustration Card */}
        <div className="z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="h-3 bg-white/30 rounded-full w-3/4 mb-2"></div>
                <div className="h-3 bg-white/20 rounded-full w-1/2"></div>
              </div>
            </div>
            <div className="flex gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-400 rounded-full"></div>
              <div className="w-12 h-12 bg-purple-400 rounded-full"></div>
              <div className="w-12 h-12 bg-pink-400 rounded-full"></div>
            </div>
            <div className="bg-green-500/20 text-white px-4 py-2 rounded-full text-sm font-medium inline-block">
              Completed
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="text-white z-10">
          <p className="text-xl font-medium mb-2">"The secret of getting ahead is getting started."</p>
          <p className="text-white/80">— Mark Twain</p>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Assessment Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {certificateName}
            </h1>
            
            {user && (
              <p className="text-gray-600">
                Hello, <span className="font-semibold text-blue-600">{user.email?.split('@')[0]}</span>!
              </p>
            )}
          </div>

          {/* Assessment Info */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">What to Expect:</h2>
            <ul className="space-y-2.5">
              <li className="flex items-start text-sm">
                <Clock className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Duration:</strong> Approximately 15-20 minutes
                </span>
              </li>
              <li className="flex items-start text-sm">
                <FileText className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Questions:</strong> Multiple choice format
                </span>
              </li>
              <li className="flex items-start text-sm">
                <Zap className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>Results:</strong> Instant feedback upon completion
                </span>
              </li>
            </ul>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-xs font-semibold text-yellow-800 mb-1">Important:</h3>
                <p className="text-xs text-yellow-700">
                  Please ensure you have a stable internet connection and won't be interrupted during the assessment.
                </p>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartAssessment}
            disabled={isStarting || checkingStatus}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {checkingStatus ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking status...
              </>
            ) : isStarting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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
                Start Assessment
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {/* Footer Note */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Your progress will be automatically saved
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssessmentStart;
