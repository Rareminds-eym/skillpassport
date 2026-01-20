/**
 * Restriction Screen Component
 * Shows when user cannot take assessment (6-month restriction)
 * 
 * @module features/assessment/components/RestrictionScreen
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, Target, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/Students/components/ui/button';
import { ASSESSMENT_RESTRICTION } from '../constants/config';

/**
 * @typedef {Object} RestrictionScreenProps
 * @property {string} errorMessage - The restriction error message
 * @property {Function} onViewLastReport - Callback to view last assessment report
 * @property {Function} onBackToDashboard - Callback to go back to dashboard
 */

/**
 * Restriction Screen Component
 */
export const RestrictionScreen = ({
  errorMessage,
  onViewLastReport,
  onBackToDashboard,
}) => {
  const navigate = useNavigate();

  const handleViewReport = () => {
    if (onViewLastReport) {
      onViewLastReport();
    } else {
      navigate('/student/assessment/result');
    }
  };

  const handleBackToDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      navigate('/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Header with Icon */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Assessment Not Available
          </h2>
          <p className="text-gray-600 text-sm">
            You need to wait before taking the assessment again
          </p>
        </div>

        {/* Warning Message Box */}
        <div className="bg-slate-300 rounded-lg p-4 mb-4 border border-slate-100">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-800 leading-relaxed">
              {errorMessage}
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-slate-100">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-slate-900 mb-1.5">
                Why the {ASSESSMENT_RESTRICTION.MONTHS_BETWEEN_ATTEMPTS}-month waiting period?
              </p>
              <p className="leading-relaxed">
                The career assessment is designed to track your growth and development over time. 
                Taking it too frequently won't provide meaningful insights. 
                Use this time to work on your skills and gain new experiences!
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Button
            onClick={handleViewReport}
            className="w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-3"
          >
            <Target className="w-4 h-4 mr-2" />
            View Your Last Report
          </Button>
          <Button
            variant="outline"
            onClick={handleBackToDashboard}
            className="w-full py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RestrictionScreen;
