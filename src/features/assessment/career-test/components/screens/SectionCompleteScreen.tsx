/**
 * SectionCompleteScreen Component
 * 
 * Displays the completion screen after finishing a section
 * with success animation and next section preview.
 * 
 * @module features/assessment/career-test/components/screens/SectionCompleteScreen
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { Button } from '../../../../../components/Students/components/ui/button';
import { formatElapsedTime } from '../../../utils/timeUtils';

interface SectionCompleteScreenProps {
  sectionTitle: string;
  nextSectionTitle?: string;
  elapsedTime?: number;
  isLastSection: boolean;
  onContinue: () => void;
}

/**
 * Section completion screen with animated success indicator
 */
export const SectionCompleteScreen: React.FC<SectionCompleteScreenProps> = ({
  sectionTitle,
  nextSectionTitle,
  elapsedTime,
  isLastSection,
  onContinue
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-[600px] flex flex-col items-center justify-center text-center p-8 bg-gray-50"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6"
      >
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.3 }}
        >
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="text-3xl font-bold text-gray-800 mb-3"
      >
        {sectionTitle} Complete!
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="text-gray-600 mb-4 max-w-md leading-relaxed text-lg"
      >
        Great job! You've finished this section.
      </motion.p>

      {/* Elapsed Time (for non-timed sections) */}
      {elapsedTime && elapsedTime > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full mb-4 border border-emerald-200"
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">
            Completed in {formatElapsedTime(elapsedTime)}
          </span>
        </motion.div>
      )}

      {/* Next Section Preview */}
      {!isLastSection && nextSectionTitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="text-gray-500 mb-6"
        >
          Next up: <span className="font-semibold text-indigo-600">{nextSectionTitle}</span>
        </motion.p>
      )}

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={onContinue}
          className="w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-6 px-10 rounded-xl"
        >
          {isLastSection ? (
            <>
              Submit Assessment
              <CheckCircle2 className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default SectionCompleteScreen;
