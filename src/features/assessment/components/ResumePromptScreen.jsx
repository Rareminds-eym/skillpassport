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
 * Calculate progress percentage
 */
const calculateProgress = (attempt) => {
  // Count UUID-based responses (from personal_assessment_responses table)
  const uuidResponsesCount = Object.keys(attempt.restoredResponses || {}).length;
  
  // Count non-UUID responses (from all_responses column - RIASEC, BigFive, etc.)
  const allResponsesCount = attempt.all_responses ? Object.keys(attempt.all_responses).length : 0;
  
  // Total answered questions
  const answeredCount = uuidResponsesCount + allResponsesCount;
  
  // Estimate total questions based on grade level
  let estimatedTotal = 50; // Default
  
  switch (attempt.grade_level) {
    case 'middle':
      estimatedTotal = 41; // Middle school: ~41 questions
      break;
    case 'highschool':
    case 'higher_secondary':
      estimatedTotal = 53; // High school: ~53 questions
      break;
    case 'after10':
      estimatedTotal = 100; // After 10th: ~100 questions
      break;
    case 'after12':
      estimatedTotal = 120; // After 12th: ~120 questions
      break;
    case 'college':
      estimatedTotal = 120; // College: ~120 questions
      break;
  }
  
  return Math.min(100, Math.round((answeredCount / estimatedTotal) * 100));
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
  
  // Count total answered questions (UUID + non-UUID responses)
  const uuidResponsesCount = Object.keys(pendingAttempt.restoredResponses || {}).length;
  const allResponsesCount = pendingAttempt.all_responses ? Object.keys(pendingAttempt.all_responses).length : 0;
  const answeredCount = uuidResponsesCount + allResponsesCount;
  
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
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg shadow-lg"
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
