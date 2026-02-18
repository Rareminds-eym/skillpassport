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
import { CheckCircle2, Zap } from 'lucide-react';

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
  onEnableTestMode
}) => {
  return (
    <div className="w-full">
      {/* Navbar-style Progress Stats - Full Width */}
      <div className="bg-white border-b border-gray-200 shadow-sm w-full">
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            {/* Left: Logo */}
            <div className="flex items-center flex-shrink-0">
              <div className="h-8 sm:h-10 px-2 sm:px-3 rounded-lg bg-blue-50 flex items-center justify-center">
                <img src="/RareMinds ISO Logo-01.png" alt="RareMinds Logo" className="h-6 sm:h-8 w-auto object-contain" />
              </div>
            </div>

            {/* Center: Title - Hidden on mobile, shown on tablet+ */}
            <div className="hidden md:block flex-1 text-center">
              <span className="text-sm lg:text-base font-semibold text-gray-800">Career Assessment</span>
            </div>

            {/* Right: Test Mode and Progress */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              {/* Test Mode Toggle - Only in dev mode */}
              {isDevMode && !testMode && onEnableTestMode && (
                <button
                  onClick={onEnableTestMode}
                  className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-all flex items-center gap-1 sm:gap-2 border border-amber-200"
                  title="Enable Test Mode for quick testing"
                >
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Test Mode</span>
                  <span className="sm:hidden">Test</span>
                </button>
              )}

              {/* Progress Badge */}
              <div className="flex items-center gap-2 sm:gap-3 bg-indigo-50 px-2 sm:px-3 py-1 rounded-lg border border-indigo-100" data-tour="progress-percentage">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-semibold text-indigo-700 whitespace-nowrap">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Steps - Below Navbar */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 mt-4 sm:mt-6 mb-4 sm:mb-6" data-tour="section-progress">
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
                const adaptiveTotal = adaptiveProgress?.estimatedTotalQuestions || 50;
                const adaptiveAnswered = adaptiveProgress?.questionsAnswered || 0;
                lineProgress = adaptiveTotal > 0 ? (adaptiveAnswered / adaptiveTotal) * 100 : 0;
              } else {
                const totalQuestions = section.questions?.length || 0;
                lineProgress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
              }
            }

            return (
              <div key={section.id} className={`flex items-center ${idx < sections.length - 1 ? 'flex-1' : ''}`}>
                {/* Step Circle with Glassmorphism - Responsive sizes */}
                <div className={`
                  w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 relative overflow-hidden
                  ${isCompleted ? 'backdrop-blur-xl bg-green-500/80 border border-green-400/50 text-white shadow-lg' : ''}
                  ${isCurrent ? 'backdrop-blur-xl bg-indigo-600/90 border border-indigo-500/50 text-white shadow-xl ring-2 ring-indigo-400/30 relative z-10' : ''}
                  ${isUpcoming ? 'backdrop-blur-xl bg-white/40 border border-gray-300/50 text-gray-400' : ''}
                `}
                  style={{
                    background: isCompleted
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(22, 163, 74, 0.9) 100%)'
                      : isCurrent
                        ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.9) 0%, rgba(67, 56, 202, 0.95) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(249, 250, 251, 0.3) 100%)',
                    boxShadow: isCompleted
                      ? '0 4px 16px 0 rgba(34, 197, 94, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                      : isCurrent
                        ? '0 4px 16px 0 rgba(79, 70, 229, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 8px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
                  }}
                >
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-full pointer-events-none" />

                  {isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 relative z-10" />
                  ) : (
                    <span className="text-[10px] sm:text-xs font-bold relative z-10">{idx + 1}</span>
                  )}
                </div>

                {/* Connector Line - Minimalist, responsive spacing */}
                {idx < sections.length - 1 && (
                  <div className="flex-1 h-px rounded-full bg-gray-200 overflow-hidden mx-2 sm:mx-3 lg:mx-4">
                    <motion.div
                      className={`h-full rounded-full ${idx < currentSectionIndex
                          ? 'bg-green-500'
                          : idx === currentSectionIndex
                            ? 'bg-indigo-500'
                            : ''
                        }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${lineProgress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Labels Row - Responsive text sizes and visibility */}
        <div className="hidden sm:flex items-start mt-2 sm:mt-3 gap-2 sm:gap-3 lg:gap-4">
          {sections.map((section, idx) => {
            const isCompleted = idx < currentSectionIndex;
            const isCurrent = idx === currentSectionIndex;
            const isUpcoming = idx > currentSectionIndex;

            return (
              <div key={`label-${section.id}`} className={`${idx < sections.length - 1 ? 'flex-1' : ''} flex justify-start`}>
                <span className={`
                  text-[9px] sm:text-[10px] lg:text-xs font-semibold leading-tight
                  ${isCompleted ? 'text-green-700' : ''}
                  ${isCurrent ? 'text-indigo-700' : ''}
                  ${isUpcoming ? 'text-gray-500' : ''}
                `}>
                  {section.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile: Current Section Label Only */}
        <div className="sm:hidden mt-2 text-center">
          <span className="text-xs font-semibold text-indigo-700">
            {sections[currentSectionIndex]?.title}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressHeader;
