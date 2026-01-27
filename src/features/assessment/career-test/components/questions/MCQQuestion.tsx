/**
 * MCQQuestion Component
 * 
 * Renders a multiple choice question with single selection.
 * Used for Aptitude and Knowledge sections.
 * 
 * @module features/assessment/career-test/components/questions/MCQQuestion
 */

import React from 'react';
import { motion } from 'framer-motion';

interface MCQQuestionProps {
  questionId: string;
  questionText: string;
  options: string[];
  selectedAnswer: string | null;
  onAnswer: (value: string) => void;
  showCorrectIndicator?: boolean;
  correctAnswer?: string;
  moduleTitle?: string;
  subtype?: string;
}

/**
 * Multiple choice question component with animated options
 */
export const MCQQuestion: React.FC<MCQQuestionProps> = ({
  questionId,
  questionText,
  options,
  selectedAnswer,
  onAnswer,
  showCorrectIndicator = false,
  correctAnswer,
  moduleTitle,
  subtype
}) => {
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
      <h3 className="text-xl md:text-2xl font-medium text-gray-800 leading-snug" data-tour="question-content">
        {questionText}
      </h3>

      {/* Options */}
      <div className="space-y-3 mt-6" data-tour="answer-options">
        {options.map((option, idx) => {
          const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
          const isSelected = selectedAnswer === option;
          const isCorrect = showCorrectIndicator && correctAnswer === option;
          const isWrong = showCorrectIndicator && isSelected && correctAnswer !== option;

          return (
            <motion.button
              key={idx}
              type="button"
              onClick={() => onAnswer(option)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`
                w-full border-2 rounded-xl p-4 transition-all text-left
                ${isSelected && !showCorrectIndicator
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30'
                  : isCorrect
                    ? 'border-green-500 bg-green-50'
                    : isWrong
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold transition-all
                  ${isSelected && !showCorrectIndicator
                    ? 'bg-indigo-500 text-white'
                    : isCorrect
                      ? 'bg-green-500 text-white'
                      : isWrong
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {optionLabel}
                </div>
                <p className={`
                  flex-1 font-medium text-lg
                  ${isSelected && !showCorrectIndicator
                    ? 'text-indigo-700'
                    : isCorrect
                      ? 'text-green-700'
                      : isWrong
                        ? 'text-red-700'
                        : 'text-gray-700'
                  }
                `}>
                  {option}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MCQQuestion;
