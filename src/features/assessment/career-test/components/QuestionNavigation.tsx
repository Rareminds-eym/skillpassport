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
        disabled={!canGoPrevious || isSubmitting || isSaving}
        className="flex items-center gap-2 px-6 py-3 disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      {/* Next Button */}
      <motion.div
        whileHover={isAnswered && !isSubmitting && !isSaving ? { scale: 1.02 } : {}}
        whileTap={isAnswered && !isSubmitting && !isSaving ? { scale: 0.98 } : {}}
      >
        <Button
          onClick={onNext}
          disabled={!isAnswered || isSubmitting || isSaving}
          className={`
            flex items-center gap-2 px-8 py-3 transition-all duration-300
            ${isAnswered && !isSubmitting && !isSaving
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
          ) : isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
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
