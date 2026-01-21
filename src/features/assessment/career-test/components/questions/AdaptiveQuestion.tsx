/**
 * AdaptiveQuestion Component
 *
 * Renders an adaptive aptitude test question with per-question timer.
 * Difficulty level is hidden from the user for a better test experience.
 *
 * @module features/assessment/career-test/components/questions/AdaptiveQuestion
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Loader2, Target } from 'lucide-react';

interface AdaptiveQuestionProps {
  questionId: string;
  questionText: string;
  options: Record<string, string>; // { A: "option1", B: "option2", ... }
  selectedAnswer: string | null; // 'A', 'B', 'C', 'D'
  onAnswer: (value: string) => void;
  difficultyLevel?: number; // Hidden from UI
  subtag?: string;
  timer: number; // seconds remaining
  loading?: boolean;
  disabled?: boolean; // Disable options when saving
}

/**
 * Adaptive aptitude question component
 */
export const AdaptiveQuestion: React.FC<AdaptiveQuestionProps> = ({
  questionId,
  questionText,
  options,
  selectedAnswer,
  onAnswer,
  difficultyLevel = 3,
  subtag,
  timer,
  loading = false,
  disabled = false,
}) => {
  // Format timer display
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Timer color based on remaining time
  const getTimerColor = () => {
    if (timer <= 10) return 'bg-red-100 text-red-700 animate-pulse';
    if (timer <= 30) return 'bg-amber-100 text-amber-700';
    return 'bg-indigo-100 text-indigo-700';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading next question...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Badges with Timer */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          {/* Difficulty Level Badge */}
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 rounded-full text-xs font-medium text-indigo-700">
            <Target className="w-3 h-3" />
            Level {difficultyLevel}
          </span>

          {/* Subtag/Category */}
          {subtag && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 capitalize">
              {subtag.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Per-question Timer (90 seconds) */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${getTimerColor()}`}
        >
          <Clock className="w-4 h-4" />
          {timerDisplay}
        </div>
      </div>

      {/* Question Text */}
      <h3 className="text-xl md:text-2xl font-medium text-gray-800 leading-snug">{questionText}</h3>

      {/* Options */}
      <div className="space-y-3 mt-6">
        {['A', 'B', 'C', 'D'].map((optionKey) => {
          const optionText = options[optionKey];
          if (!optionText) return null;

          const isSelected = selectedAnswer === optionKey;

          return (
            <motion.button
              key={optionKey}
              type="button"
              onClick={() => !disabled && onAnswer(optionKey)}
              whileHover={!disabled ? { scale: 1.01 } : {}}
              whileTap={!disabled ? { scale: 0.99 } : {}}
              disabled={disabled}
              className={`
                w-full border-2 rounded-xl p-4 transition-all text-left
                ${disabled ? 'cursor-not-allowed opacity-70' : ''}
                ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30'
                    : disabled
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
                  w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold transition-all
                  ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}
                `}
                >
                  {optionKey}
                </div>
                <p
                  className={`
                  flex-1 font-medium text-lg
                  ${isSelected ? 'text-indigo-700' : 'text-gray-700'}
                `}
                >
                  {optionText}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Saving indicator when disabled */}
      {disabled && (
        <div className="flex items-center justify-center gap-2 mt-4 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Saving your answer...</span>
        </div>
      )}
    </div>
  );
};

export default AdaptiveQuestion;
