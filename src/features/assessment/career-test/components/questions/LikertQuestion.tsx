/**
 * LikertQuestion Component
 *
 * Renders a Likert scale question with rating options.
 * Used for RIASEC, Big Five, Work Values, and Employability sections.
 *
 * @module features/assessment/career-test/components/questions/LikertQuestion
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ResponseScaleItem {
  value: number;
  label: string;
}

interface LikertQuestionProps {
  questionId: string;
  questionText: string;
  responseScale: ResponseScaleItem[];
  selectedValue: number | null;
  onAnswer: (value: number) => void;
  color?: string;
}

/**
 * Likert scale question component with animated rating buttons
 */
export const LikertQuestion: React.FC<LikertQuestionProps> = ({
  questionId,
  questionText,
  responseScale,
  selectedValue,
  onAnswer,
  color = 'indigo',
}) => {
  return (
    <div className="space-y-6">
      {/* Question Text */}
      <h3 className="text-xl md:text-2xl font-medium text-gray-800 leading-snug">{questionText}</h3>

      {/* Rating Scale */}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        {responseScale.map((option, idx) => {
          const isSelected = selectedValue === option.value;

          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => onAnswer(option.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                flex flex-col items-center justify-center p-4 rounded-xl border-2 
                min-w-[100px] transition-all duration-200
                ${
                  isSelected
                    ? `border-${color}-500 bg-${color}-50 ring-2 ring-${color}-500/30`
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <span
                className={`
                text-2xl font-bold mb-1
                ${isSelected ? `text-${color}-600` : 'text-gray-600'}
              `}
              >
                {option.value}
              </span>
              <span
                className={`
                text-xs text-center leading-tight
                ${isSelected ? `text-${color}-700 font-medium` : 'text-gray-500'}
              `}
              >
                {option.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Scale Legend */}
      <div className="flex justify-between text-xs text-gray-400 px-4 mt-2">
        <span>{responseScale[0]?.label}</span>
        <span>{responseScale[responseScale.length - 1]?.label}</span>
      </div>
    </div>
  );
};

export default LikertQuestion;
