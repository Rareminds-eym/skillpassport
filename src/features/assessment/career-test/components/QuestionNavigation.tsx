/**
 * QuestionNavigation Component
 * 
 * Navigation buttons for moving between questions.
 * Handles previous/next with proper disabled states.
 * 
 * @module features/assessment/career-test/components/QuestionNavigation
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/Students/components/ui/button';

interface QuestionNavigationProps {
  canGoPrevious: boolean;
  canGoNext: boolean;
  isAnswered: boolean;
  isSubmitting?: boolean;
  isSaving?: boolean;
  isLastQuestion: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Question navigation buttons
 */
export const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  canGoPrevious,
  canGoNext,
  isAnswered,
  isSubmitting = false,
  isSaving = false,
  isLastQuestion,
  onPrevious,
  onNext
}) => {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
      {/* Previous Button */}
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoPrevious || isSubmitting}
        className="flex items-center gap-2 px-6 py-3 bg-white/60 rounded-xl border border-blue-200/50 disabled:opacity-50 hover:bg-white/80"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </div>
      )}

      {/* Next Button */}
      <motion.div
        whileHover={isAnswered && !isSubmitting ? { scale: 1.02 } : {}}
        whileTap={isAnswered && !isSubmitting ? { scale: 0.98 } : {}}
      >
        <Button
          onClick={onNext}
          disabled={!isAnswered || isSubmitting}
          className={`
            flex items-center gap-2 px-8 py-3 transition-all duration-200 rounded-xl
            ${isAnswered && !isSubmitting
              ? 'w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-105'
              : 'bg-white/60 border border-blue-200/50 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {isLastQuestion ? 'Complete Section' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default QuestionNavigation;
