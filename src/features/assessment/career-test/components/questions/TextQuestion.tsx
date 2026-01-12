/**
 * TextQuestion Component
 * 
 * Renders a text input question for open-ended responses.
 * Used for reflection questions in middle school and high school assessments.
 * 
 * @module features/assessment/career-test/components/questions/TextQuestion
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PenLine } from 'lucide-react';

interface TextQuestionProps {
  questionId: string;
  questionText: string;
  placeholder?: string;
  value: string;
  onAnswer: (value: string) => void;
  minLength?: number;
}

/**
 * Text input question component for open-ended responses
 */
export const TextQuestion: React.FC<TextQuestionProps> = ({
  questionId,
  questionText,
  placeholder = 'Type your answer here...',
  value = '',
  onAnswer,
  minLength = 10
}) => {
  const charCount = value?.length || 0;
  const isValid = charCount >= minLength;

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <h3 className="text-xl md:text-2xl font-medium text-gray-800 leading-snug">
        {questionText}
      </h3>

      {/* Text Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <div className="absolute top-4 left-4 text-gray-400">
          <PenLine className="w-5 h-5" />
        </div>
        <textarea
          id={questionId}
          value={value || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className={`
            w-full pl-12 pr-4 py-4 
            border-2 rounded-xl 
            text-gray-800 text-lg
            placeholder-gray-400
            resize-none
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${isValid 
              ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20' 
              : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
            }
          `}
        />
        
        {/* Character Count */}
        <div className="flex justify-between items-center mt-2 px-1">
          <span className={`text-sm ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
            {charCount} characters
            {!isValid && ` (minimum ${minLength})`}
          </span>
          {isValid && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm text-green-600 font-medium"
            >
              ✓ Ready to continue
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* Helper Text */}
      <p className="text-sm text-gray-500 italic">
        Take your time to reflect and share your thoughts. There are no wrong answers.
      </p>
    </div>
  );
};

export default TextQuestion;
