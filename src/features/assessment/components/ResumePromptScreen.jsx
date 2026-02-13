/**
 * Resume Prompt Screen Component
 * Asks user if they want to resume a previous assessment attempt
 * 
 * @module features/assessment/components/ResumePromptScreen
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, PlayCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/Students/components/ui/button';
import { Card, CardContent } from '../../../components/Students/components/ui/card';
import { STREAMS_BY_CATEGORY, STREAM_CATEGORIES } from '../constants/config';

/**
 * @typedef {Object} ResumePromptScreenProps
 * @property {Object} pendingAttempt - The pending assessment attempt
 * @property {Function} onResume - Callback to resume the assessment
 * @property {Function} onStartNew - Callback to start a new assessment
 * @property {boolean} isLoading - Whether resume is in progress
 */

/**
 * Get stream label from stream ID
 */
const getStreamLabel = (streamId) => {
  // Check all categories for the stream
  const allStreams = [
    ...STREAM_CATEGORIES,
    ...Object.values(STREAMS_BY_CATEGORY).flat()
  ];
  
  const stream = allStreams.find(s => s.id === streamId);
  return stream?.label || streamId;
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate progress percentage based on actual question counts
 */
const calculateProgress = (attempt) => {
  // IMPORTANT: restoredResponses contains BOTH UUID and non-UUID responses combined
  // So we should use restoredResponses as the total count, not add them separately
  // However, if restoredResponses is empty, fallback to all_responses or assessment_snapshot_v2
  let totalAnsweredQuestions = Object.keys(attempt.restoredResponses || {}).length;
  
  // NEW: For college students, check assessment_snapshot_v2 for comprehensive progress data
  if (totalAnsweredQuestions === 0 && attempt.grade_level === 'college' && attempt.assessment_snapshot_v2?.sections) {
    const sections = attempt.assessment_snapshot_v2.sections;
    totalAnsweredQuestions = Object.values(sections).reduce((acc, section) => {
      return acc + (section.questions?.filter(q => q.answer?.value !== undefined && q.answer?.value !== null).length || 0);
    }, 0);
  }
  
  // Fallback: If restoredResponses is empty but all_responses has data, use all_responses
  if (totalAnsweredQuestions === 0 && attempt.all_responses) {
    totalAnsweredQuestions = Object.keys(attempt.all_responses).length;
  }
  
  // Count adaptive aptitude progress (from adaptive session) - this is separate
  const adaptiveQuestionsAnswered = attempt.adaptiveProgress?.questionsAnswered || 0;
  
  // Total answered questions
  const answeredCount = totalAnsweredQuestions + adaptiveQuestionsAnswered;
  
  // Calculate total questions based on actual question counts from database and codebase
  let estimatedTotal = 50; // Default
  
  switch (attempt.grade_level) {
    case 'middle':
      // Middle school sections:
      // - Interest Explorer: ~5 questions
      // - Strengths & Character: ~11 questions  
      // - Learning Preferences: ~4 questions
      // - Adaptive Aptitude: ~21 questions (typical adaptive test length)
      estimatedTotal = 41;
      break;
      
    case 'highschool':
      // High school sections (from middleSchoolQuestions.ts - total 53 questions):
      // - Interest Explorer: ~5 questions
      // - Strengths & Character: ~12 questions
      // - Learning Preferences: ~4 questions
      // - Aptitude Sampling: ~11 questions
      // - Adaptive Aptitude: ~21 questions
      estimatedTotal = 53;
      break;
      
    case 'higher_secondary':
      // Higher secondary sections:
      // - RIASEC: 48 questions (8 per type × 6 types)
      // - Big Five: 30 questions (6 per trait × 5 traits)
      // - Work Values: 24 questions
      // - Employability: 42 questions (including SJT)
      // - Aptitude: ~50 questions (AI-generated, varies 46-50)
      // - Knowledge: 20 questions (AI-generated, consistent)
      estimatedTotal = 48 + 30 + 24 + 42 + 50 + 20; // = 214
      break;
      
    case 'after10':
      // After 10th sections (stream-agnostic, no knowledge section):
      // - RIASEC: 48 questions
      // - Big Five: 30 questions
      // - Work Values: 24 questions
      // - Employability: 42 questions
      // - Aptitude: 50 questions (AI-generated)
      estimatedTotal = 194; // = 194
      break;
      
    case 'after12':
      // After 12th sections:
      // - RIASEC: 48 questions
      // - Big Five: 30 questions
      // - Work Values: 24 questions
      // - Employability: 42 questions
      // - Aptitude: ~50 questions (AI-generated, varies 48-50)
      // - Knowledge: 20 questions (AI-generated)
      estimatedTotal = 214; // = 214
      break;
      
    case 'college':
      // College sections (same as after12):
      // - RIASEC: 48 questions
      // - Big Five: 30 questions
      // - Work Values: 24 questions
      // - Employability: 42 questions
      // - Aptitude: ~50 questions (AI-generated)
      // - Knowledge: 20 questions (AI-generated)
      estimatedTotal = 214; // = 214
      break;
  }
  
  const progressPercentage = Math.min(100, Math.round((answeredCount / estimatedTotal) * 100));
  
  return progressPercentage;
};

/**
 * Resume Prompt Screen Component
 */
export const ResumePromptScreen = ({
  pendingAttempt,
  onResume,
  onStartNew,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (!pendingAttempt) {
    return null;
  }

  const streamLabel = getStreamLabel(pendingAttempt.stream_id);
  const progress = calculateProgress(pendingAttempt);
  
  // Calculate total answered questions correctly (no double counting)
  // restoredResponses already contains all responses (UUID + non-UUID combined)
  let totalAnsweredQuestions = Object.keys(pendingAttempt.restoredResponses || {}).length;
  
  // NEW: For college students, check assessment_snapshot_v2 for comprehensive progress data
  if (totalAnsweredQuestions === 0 && pendingAttempt.grade_level === 'college' && pendingAttempt.assessment_snapshot_v2?.sections) {
    const sections = pendingAttempt.assessment_snapshot_v2.sections;
    totalAnsweredQuestions = Object.values(sections).reduce((acc, section) => {
      return acc + (section.questions?.filter(q => q.answer?.value !== undefined && q.answer?.value !== null).length || 0);
    }, 0);
  }
  
  // Fallback: If restoredResponses is empty but all_responses has data, use all_responses
  if (totalAnsweredQuestions === 0 && pendingAttempt.all_responses) {
    totalAnsweredQuestions = Object.keys(pendingAttempt.all_responses).length;
  }
  
  const adaptiveQuestionsAnswered = pendingAttempt.adaptiveProgress?.questionsAnswered || 0;
  const answeredCount = totalAnsweredQuestions + adaptiveQuestionsAnswered;
  
  const startedAt = formatDate(pendingAttempt.started_at);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl border-none shadow-2xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Resume Your Assessment?
            </h1>
            <p className="text-gray-600">
              You have an assessment in progress
            </p>
          </div>

          {/* Progress Info */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Stream</span>
                <span className="text-sm font-semibold text-gray-800">{streamLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Started</span>
                <span className="text-sm font-semibold text-gray-800">{startedAt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Questions Answered</span>
                <span className="text-sm font-semibold text-gray-800">{answeredCount}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-medium text-indigo-600">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onResume}
              disabled={isLoading}
              className="w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-6"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Resume Assessment
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onStartNew}
              disabled={isLoading}
              className="w-full py-4 border-gray-200 hover:border-gray-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Fresh (Abandon Previous)
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/student/dashboard')}
              disabled={isLoading}
              className="w-full py-4 text-gray-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> Starting fresh will abandon your previous progress. 
              Your answers will not be saved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumePromptScreen;
