/**
 * MultiSelectQuestion Component
 *
 * Renders a multiple choice question with multiple selection support.
 * Used for questions that require selecting multiple options (e.g., "pick 3").
 *
 * @module features/assessment/career-test/components/questions/MultiSelectQuestion
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface MultiSelectQuestionProps {
  questionId: string;
  questionText: string;
  options: string[];
  selectedAnswers: string[];
  onAnswer: (value: string[]) => void;
  maxSelections: number;
  moduleTitle?: string;
  subtype?: string;
}

/**
 * Multiple selection question component with animated options
 */
export const MultiSelectQuestion: React.FC<MultiSelectQuestionProps> = ({
  questionText,
  options,
  selectedAnswers = [],
  onAnswer,
  maxSelections,
  moduleTitle,
  subtype,
}) => {
  const handleOptionClick = (option: string) => {
    const currentSelections = selectedAnswers || [];

    if (currentSelections.includes(option)) {
      // Remove if already selected
      onAnswer(currentSelections.filter((item) => item !== option));
    } else if (currentSelections.length < maxSelections) {
      // Add if under max limit
      onAnswer([...currentSelections, option]);
    }
    // If at max and trying to add new, do nothing (or could replace oldest)
  };

  const isSelected = (option: string) => (selectedAnswers || []).includes(option);
  const canSelectMore = (selectedAnswers || []).length < maxSelections;
  const selectionsRemaining = maxSelections - (selectedAnswers || []).length;

  return (
    <div className="space-y-4">
      {/* Module/Subtype Badge */}
      {(moduleTitle || subtype) && (
        <div className="flex flex-wrap gap-2 mb-2">
          {moduleTitle && (
            <span className="inline-flex items-center px-3 py-1 bg-amber-100 rounded-full text-xs font-medium text-amber-700">
              {moduleTitle}
            </span>
          )}
          {subtype && (
            <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
              {subtype.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      )}

      {/* Question Text */}
      <h3 className="text-xl md:text-2xl font-medium text-gray-800 leading-snug">{questionText}</h3>

      {/* Selection Instruction - styled like reference */}
      <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
        <p className="text-rose-700 text-sm">
          Select up to <span className="font-bold">{maxSelections}</span> options that feel most
          like you
        </p>
      </div>

      {/* Options - styled like reference with circular indicators */}
      <div className="space-y-3 mt-4">
        {options.map((option, idx) => {
          const selected = isSelected(option);
          const disabled = !selected && !canSelectMore;

          return (
            <motion.button
              key={idx}
              type="button"
              onClick={() => handleOptionClick(option)}
              whileHover={!disabled ? { scale: 1.01 } : {}}
              whileTap={!disabled ? { scale: 0.99 } : {}}
              disabled={disabled}
              className={`
                w-full border-2 rounded-xl p-4 transition-all text-left
                ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30'
                    : disabled
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
                }
              `}
            >
              <div className="flex items-center gap-4">
                {/* Circular checkbox indicator */}
                <div
                  className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                  ${
                    selected
                      ? 'border-indigo-500 bg-indigo-500'
                      : disabled
                        ? 'border-gray-200 bg-gray-100'
                        : 'border-gray-300 bg-white'
                  }
                `}
                >
                  {selected && <Check className="w-4 h-4 text-white" />}
                </div>
                <p
                  className={`
                  flex-1 font-medium text-base
                  ${selected ? 'text-indigo-700' : disabled ? 'text-gray-400' : 'text-gray-700'}
                `}
                >
                  {option}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selection Status */}
      {selectionsRemaining > 0 && (
        <p className="text-sm text-gray-500 mt-2">
          Select {selectionsRemaining} more option{selectionsRemaining !== 1 ? 's' : ''} to continue
        </p>
      )}
      {selectionsRemaining === 0 && (
        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
          <Check className="w-4 h-4" />
          Selection complete
        </p>
      )}
    </div>
  );
};

export default MultiSelectQuestion;
