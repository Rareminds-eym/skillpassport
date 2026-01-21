/**
 * ProgressHeader Component
 *
 * Displays the assessment progress header with section steps,
 * progress percentage, and test mode toggle.
 *
 * @module features/assessment/career-test/components/layout/ProgressHeader
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, Zap } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  isAdaptive?: boolean;
  questions?: any[];
}

interface AdaptiveProgress {
  questionsAnswered: number;
  estimatedTotalQuestions: number;
}

interface ProgressHeaderProps {
  sections: Section[];
  currentSectionIndex: number;
  currentQuestionIndex: number;
  progress: number;
  adaptiveProgress?: AdaptiveProgress | null;
  isDevMode?: boolean;
  testMode?: boolean;
  onEnableTestMode?: () => void;
}

/**
 * Assessment progress header with section steps
 */
export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  sections,
  currentSectionIndex,
  currentQuestionIndex,
  progress,
  adaptiveProgress,
  isDevMode = false,
  testMode = false,
  onEnableTestMode,
}) => {
  return (
    <div className="w-full max-w-4xl mb-6">
      {/* Progress Stats */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Career Assessment</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Test Mode Toggle - Only in dev mode */}
          {isDevMode && !testMode && onEnableTestMode && (
            <button
              onClick={onEnableTestMode}
              className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold hover:bg-amber-200 transition-all flex items-center gap-1"
              title="Enable Test Mode for quick testing"
            >
              <Zap className="w-3 h-3" />
              Test Mode
            </button>
          )}
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-semibold text-indigo-700">
              {Math.round(progress)}% Complete
            </span>
          </div>
        </div>
      </div>

      {/* Section Steps with Progress Lines */}
      <div className="relative">
        {/* Circles and Lines Row */}
        <div className="flex items-center">
          {sections.map((section, idx) => {
            const isCompleted = idx < currentSectionIndex;
            const isCurrent = idx === currentSectionIndex;
            const isUpcoming = idx > currentSectionIndex;

            // Calculate line progress
            let lineProgress = 0;
            if (idx < currentSectionIndex) {
              lineProgress = 100;
            } else if (idx === currentSectionIndex) {
              if (section.isAdaptive) {
                const adaptiveTotal = adaptiveProgress?.estimatedTotalQuestions || 20;
                const adaptiveAnswered = adaptiveProgress?.questionsAnswered || 0;
                lineProgress = adaptiveTotal > 0 ? (adaptiveAnswered / adaptiveTotal) * 100 : 0;
              } else {
                const totalQuestions = section.questions?.length || 0;
                lineProgress =
                  totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
              }
            }

            return (
              <div
                key={section.id}
                className={`flex items-center ${idx < sections.length - 1 ? 'flex-1' : ''}`}
              >
                {/* Step Circle */}
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 shrink-0
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white shadow-md' : ''}
                  ${isCurrent ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg ring-4 ring-indigo-100 relative z-10' : ''}
                  ${isUpcoming ? 'bg-white border-gray-300 text-gray-500' : ''}
                `}
                >
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
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Labels Row */}
        <div className="hidden sm:flex items-start mt-2">
          {sections.map((section, idx) => {
            const isCompleted = idx < currentSectionIndex;
            const isCurrent = idx === currentSectionIndex;
            const isUpcoming = idx > currentSectionIndex;

            return (
              <div
                key={`label-${section.id}`}
                className={`${idx < sections.length - 1 ? 'flex-1' : ''}`}
              >
                <span
                  className={`
                  text-[10px] font-semibold text-center leading-tight block w-10
                  ${isCompleted ? 'text-green-700' : ''}
                  ${isCurrent ? 'text-indigo-700' : ''}
                  ${isUpcoming ? 'text-gray-500' : ''}
                `}
                >
                  {section.title.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressHeader;
