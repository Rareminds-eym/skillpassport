/**
 * SectionIntroScreen Component
 * 
 * Displays the introduction screen for each assessment section
 * with title, description, and instructions.
 * 
 * @module features/assessment/career-test/components/questions/SectionIntroScreen
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Code, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../../components/Students/components/ui/button';
import DemoModal from '../../../../../components/common/DemoModal';
import type { GradeLevel } from '../../config/sections';

interface SectionIntroScreenProps {
  title: string;
  description: string;
  instruction: string;
  icon: string; // Changed from React.ReactNode to string (image path)
  color: string;
  sectionId: string;
  questionCount: number;
  timeLimit?: number;
  isAptitude?: boolean;
  isAdaptive?: boolean;
  isTimed?: boolean;
  showAIPoweredBadge?: boolean;
  isLoading?: boolean;
  gradeLevel?: GradeLevel | null;
  onStart: () => void;
}

/**
 * Section introduction screen with animated elements
 */
export const SectionIntroScreen: React.FC<SectionIntroScreenProps> = ({
  title,
  description,
  instruction,
  icon,
  color,
  sectionId,
  questionCount,
  timeLimit,
  isAptitude = false,
  isAdaptive = false,
  isTimed = false,
  showAIPoweredBadge = false,
  isLoading = false,
  gradeLevel = null,
  onStart
}) => {
  const [showDemoModal, setShowDemoModal] = React.useState(false);
  
  // Format time limit for display
  const formatTimeLimit = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  // Get time per question label for adaptive aptitude
  const getAdaptiveTimeLabel = () => {
    // Middle school (6-8) gets 5 minutes per question
    if (gradeLevel === '6-8') {
      return '5 min per question';
    }
    // All other grades get 1 minute per question
    return '1 min per question';
  };

  // Get total time label for adaptive aptitude
  const getAdaptiveTotalTime = () => {
    // Middle school (6-8): 50 questions × 5 minutes = 250 minutes
    if (gradeLevel === '6-8') {
      return '250 min total';
    }
    // All other grades: 50 questions × 1 minute = 50 minutes
    return '50 min total';
  };

  // Get section type indicator
  const getSectionTypeIndicator = () => {
    if (sectionId === 'knowledge') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Code className="w-4 h-4" />
          <span className="text-sm font-medium">Knowledge Test - Answers will be scored</span>
        </div>
      );
    }
    if (sectionId === 'aptitude' || isAptitude) {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">Aptitude Test - Speed & accuracy matter</span>
        </div>
      );
    }
    if (isAdaptive) {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Adaptive Test - Adjusts to your level</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">No right or wrong answers</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-[600px] flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50"
    >
      {/* Icon with Glassmorphism */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6 p-5 relative overflow-hidden backdrop-blur-xl bg-white/30 border border-white/40 shadow-2xl"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)`,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-3xl" />
        
        <img 
          src={icon} 
          alt={title}
          className="w-full h-full object-contain relative z-10 drop-shadow-lg"
        />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.2 }}
        className="text-3xl font-bold text-gray-800 mb-4"
      >
        {title}
      </motion.h2>

      {/* AI-Powered Badge */}
      {showAIPoweredBadge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-semibold mb-4 shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Powered Questions</span>
        </motion.div>
      )}

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.3 }}
        className="text-gray-600 mb-6 max-w-lg leading-relaxed text-lg"
      >
        {description}
      </motion.p>

      {/* Instruction Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.4 }}
        className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-6 max-w-lg w-full"
      >
        <p className="text-sm font-medium text-blue-700">
          {instruction}
        </p>
      </motion.div>

      {/* Section Type Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.3 }}
        className="mb-6"
      >
        {getSectionTypeIndicator()}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="flex flex-wrap justify-center gap-4 mb-8 text-sm text-gray-600"
      >
        <span className="px-3 py-1 bg-gray-100 rounded-full">
          {isAdaptive ? '50 questions' : `${questionCount} questions`}
        </span>
        {isTimed && timeLimit && (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
            60 sec per question
          </span>
        )}
        {isAdaptive && (
          <>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              {getAdaptiveTimeLabel()}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              {getAdaptiveTotalTime()}
            </span>
          </>
        )}
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        whileHover={{ scale: isLoading ? 1 : 1.05 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
      >
        <Button
        // onClick={onStart}
          onClick={() => setShowDemoModal(true)}
          disabled={isLoading}
          className="w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-6 px-10 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading Questions...
            </>
          ) : (
            <>
              Start Section
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </motion.div>

      {/* Demo Modal */}
      <DemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        message="This feature is available in the full version. You are currently viewing the demo. Please contact us to get complete access."
      />
    </motion.div>
  );
};

export default SectionIntroScreen;
