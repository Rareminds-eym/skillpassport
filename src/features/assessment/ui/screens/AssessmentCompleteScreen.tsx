import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, BarChart3, Zap } from 'lucide-react';

interface AssessmentCompleteScreenProps {
  attemptId: string;
  score?: number;
}

export const AssessmentCompleteScreen: React.FC<AssessmentCompleteScreenProps> = ({
  attemptId,
  score,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
            <CheckCircle className="w-20 h-20 text-green-600 relative z-10" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
        <p className="text-gray-600 mb-6">Your assessment has been successfully submitted.</p>

        {/* Score if available */}
        {score !== undefined && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Your Score</span>
            </div>
            <div className="text-4xl font-bold text-blue-600">{score}%</div>
          </div>
        )}

        {/* Next Steps */}
        <div className="mb-8 space-y-3 text-left">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Zap className="w-5 h-5 text-yellow-500 mt-1" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">View Your Results</p>
              <p className="text-sm text-gray-600">Check your detailed assessment results and recommendations</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/assessment/result?attemptId=${attemptId}`)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            View Results
          </button>
          <button
            onClick={() => navigate('/learner/dashboard')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-6">
          Attempt ID: <span className="font-mono">{attemptId}</span>
        </p>
      </div>
    </div>
  );
};
