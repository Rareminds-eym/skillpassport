/**
 * TestModeControls Component
 * 
 * Development mode controls for quick testing of the assessment.
 * Allows auto-filling answers and skipping to specific sections.
 * 
 * @module features/assessment/career-test/components/layout/TestModeControls
 */

import React from 'react';
import { Zap } from 'lucide-react';

interface TestModeControlsProps {
  onAutoFillAll: () => void;
  onSkipToAptitude: () => void;
  onSkipToKnowledge: () => void;
  onSkipToSubmit: () => void;
  onExitTestMode: () => void;
}

/**
 * Test mode control panel for development
 */
export const TestModeControls: React.FC<TestModeControlsProps> = ({
  onAutoFillAll,
  onSkipToAptitude,
  onSkipToKnowledge,
  onSkipToSubmit,
  onExitTestMode
}) => {
  return (
    <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-800">Test Mode Active</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onAutoFillAll}
          className="px-3 py-1.5 bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-300 transition-all"
        >
          Auto-fill All
        </button>
        <button
          onClick={onSkipToAptitude}
          className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-semibold hover:bg-purple-600 transition-all"
        >
          → Aptitude (AI)
        </button>
        <button
          onClick={onSkipToKnowledge}
          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-all"
        >
          → Knowledge (AI)
        </button>
        <button
          onClick={onSkipToSubmit}
          className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-all"
        >
          Skip to Submit
        </button>
        <button
          onClick={onExitTestMode}
          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-all"
        >
          Exit Test Mode
        </button>
      </div>
    </div>
  );
};

export default TestModeControls;
