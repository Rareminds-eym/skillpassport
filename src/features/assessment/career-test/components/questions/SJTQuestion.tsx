/**
 * SJTQuestion Component
 *
 * Renders a Situational Judgment Test question where users
 * select both the BEST and WORST response options.
 *
 * @module features/assessment/career-test/components/questions/SJTQuestion
 */

import React from 'react';
import { motion } from 'framer-motion';

interface SJTAnswer {
  best: string | null;
  worst: string | null;
}

interface SJTQuestionProps {
  questionId: string;
  questionText: string;
  scenario?: string;
  options: string[];
  optionLabels?: string[];
  selectedAnswer: SJTAnswer | null;
  onAnswer: (value: SJTAnswer) => void;
}

/**
 * Situational Judgment Test question component
 */
export const SJTQuestion: React.FC<SJTQuestionProps> = ({
  questionId,
  questionText,
  scenario,
  options,
  optionLabels,
  selectedAnswer,
  onAnswer,
}) => {
  const currentAnswer = selectedAnswer || { best: null, worst: null };

  const handleBestSelect = (option: string) => {
    // Can't select same option for both
    if (currentAnswer.worst === option) return;

    // Toggle: if already selected as best, deselect it
    const newBest = currentAnswer.best === option ? null : option;
    onAnswer({ ...currentAnswer, best: newBest });
  };

  const handleWorstSelect = (option: string) => {
    // Can't select same option for both
    if (currentAnswer.best === option) return;

    // Toggle: if already selected as worst, deselect it
    const newWorst = currentAnswer.worst === option ? null : option;
    onAnswer({ ...currentAnswer, worst: newWorst });
  };

  return (
    <div className="space-y-4">
      {/* Scenario (if provided) */}
      {scenario && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
          <p className="text-gray-700 italic">{scenario}</p>
        </div>
      )}

      {/* Question Text */}
      <h3 className="text-xl md:text-2xl font-medium text-gray-800 leading-snug">{questionText}</h3>

      {/* Instructions */}
      <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 mb-4">
        <p className="text-sm font-medium text-rose-700">
          Select the <span className="font-bold text-green-700">BEST</span> response and the{' '}
          <span className="font-bold text-red-700">WORST</span> response for this scenario.
        </p>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {options.map((option, idx) => {
          const label = optionLabels?.[idx] || String.fromCharCode(97 + idx); // a, b, c, d
          const isBest = currentAnswer.best === option;
          const isWorst = currentAnswer.worst === option;

          return (
            <div
              key={idx}
              className={`
                border-2 rounded-xl p-4 transition-all
                ${
                  isBest
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500/30'
                    : isWorst
                      ? 'border-red-500 bg-red-50 ring-1 ring-red-500/30'
                      : 'border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              {/* Option Text */}
              <div className="flex items-start gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                  {label}
                </span>
                <p className="flex-1 text-gray-700 font-medium text-lg">{option}</p>
              </div>

              {/* Best/Worst Buttons */}
              <div className="flex gap-2 ml-9">
                <motion.button
                  type="button"
                  onClick={() => handleBestSelect(option)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={currentAnswer.worst === option}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-semibold transition-all
                    ${
                      isBest
                        ? 'bg-green-500 text-white shadow-md'
                        : currentAnswer.worst === option
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }
                  `}
                >
                  {isBest ? '✓ BEST' : 'Best'}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => handleWorstSelect(option)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={currentAnswer.best === option}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-semibold transition-all
                    ${
                      isWorst
                        ? 'bg-red-500 text-white shadow-md'
                        : currentAnswer.best === option
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }
                  `}
                >
                  {isWorst ? '✓ WORST' : 'Worst'}
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection Status */}
      <div className="flex justify-center gap-4 mt-4 text-sm">
        <span
          className={`
          px-3 py-1 rounded-full
          ${currentAnswer.best ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
        `}
        >
          Best: {currentAnswer.best ? '✓ Selected' : 'Not selected'}
        </span>
        <span
          className={`
          px-3 py-1 rounded-full
          ${currentAnswer.worst ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}
        `}
        >
          Worst: {currentAnswer.worst ? '✓ Selected' : 'Not selected'}
        </span>
      </div>
    </div>
  );
};

export default SJTQuestion;
