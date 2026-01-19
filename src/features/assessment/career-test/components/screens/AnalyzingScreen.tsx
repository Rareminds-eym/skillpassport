/**
 * AnalyzingScreen Component
 * 
 * Shows a dynamic progress screen that tracks real API call status.
 * Uses a global event system to receive progress updates from the submission process.
 * 
 * @module features/assessment/career-test/components/screens/AnalyzingScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  Target, 
  Briefcase, 
  FileText,
  CheckCircle,
  Lightbulb,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Analysis stage type
type AnalysisStageId = 'preparing' | 'sending' | 'analyzing' | 'processing' | 'courses' | 'saving' | 'complete' | 'error';

interface AnalyzingScreenProps {
  /** Grade level for customizing messages */
  gradeLevel?: string;
  /** Current stage from parent (optional - for controlled mode) */
  currentStage?: AnalysisStageId;
  /** Progress percentage from parent (optional - for controlled mode) */
  progressPercent?: number;
  /** Error message if analysis failed */
  errorMessage?: string;
}

// Analysis stages with descriptions
const ANALYSIS_STAGES: Record<AnalysisStageId, {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  progressRange: [number, number];
}> = {
  preparing: {
    title: 'Preparing your responses',
    description: 'Organizing assessment data for analysis...',
    icon: FileText,
    progressRange: [0, 10],
  },
  sending: {
    title: 'Connecting to AI',
    description: 'Sending your responses to our AI engine...',
    icon: Sparkles,
    progressRange: [10, 20],
  },
  analyzing: {
    title: 'AI Analysis in Progress',
    description: 'Our AI is analyzing your interests, personality, and aptitudes...',
    icon: Brain,
    progressRange: [20, 70],
  },
  processing: {
    title: 'Processing Results',
    description: 'Generating career matches and recommendations...',
    icon: Target,
    progressRange: [70, 85],
  },
  courses: {
    title: 'Finding Courses',
    description: 'Matching you with relevant learning opportunities...',
    icon: Briefcase,
    progressRange: [85, 95],
  },
  saving: {
    title: 'Saving Your Report',
    description: 'Storing your personalized career profile...',
    icon: Lightbulb,
    progressRange: [95, 100],
  },
  complete: {
    title: 'Analysis Complete!',
    description: 'Redirecting to your results...',
    icon: CheckCircle,
    progressRange: [100, 100],
  },
  error: {
    title: 'Analysis Error',
    description: 'Something went wrong. Please try again.',
    icon: AlertCircle,
    progressRange: [0, 0],
  },
};

// Stage order for tracking
const STAGE_ORDER: AnalysisStageId[] = ['preparing', 'sending', 'analyzing', 'processing', 'courses', 'saving', 'complete'];

// Fun facts to show while waiting
const FUN_FACTS = [
  "Did you know? The average person changes careers 5-7 times during their working life.",
  "Tip: Your interests and personality are just as important as skills for career success.",
  "Fun fact: 85% of jobs that will exist in 2030 haven't been invented yet!",
  "Insight: People who align their career with their values report higher job satisfaction.",
  "Did you know? Soft skills like communication are now the most in-demand by employers.",
  "Tip: Career assessments help you discover paths you might never have considered.",
  "Fun fact: The concept of 'career' only emerged in the 20th century!",
  "Insight: Your unique combination of traits makes you suited for specific career clusters.",
];

// Global event emitter for analysis progress
declare global {
  interface Window {
    analysisProgress?: {
      stage: AnalysisStageId;
      message?: string;
      error?: string;
    };
    setAnalysisProgress?: (stage: AnalysisStageId, message?: string) => void;
  }
}

// Initialize global progress setter
if (typeof window !== 'undefined' && !window.setAnalysisProgress) {
  window.setAnalysisProgress = (stage: AnalysisStageId, message?: string) => {
    window.analysisProgress = { stage, message };
    window.dispatchEvent(new CustomEvent('analysisProgressUpdate', { detail: { stage, message } }));
  };
}

/**
 * Analyzing Screen with real-time progress tracking
 */
export const AnalyzingScreen: React.FC<AnalyzingScreenProps> = ({ 
  gradeLevel: _gradeLevel,
  currentStage: controlledStage,
  progressPercent: controlledProgress,
  errorMessage 
}) => {
  const [stage, setStage] = useState<AnalysisStageId>(controlledStage || 'preparing');
  const [progress, setProgress] = useState(controlledProgress || 0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Listen for progress updates from the submission process
  useEffect(() => {
    const handleProgressUpdate = (event: CustomEvent<{ stage: AnalysisStageId; message?: string }>) => {
      const { stage: newStage } = event.detail;
      console.log('📊 Analysis progress update:', newStage);
      setStage(newStage);
    };

    window.addEventListener('analysisProgressUpdate', handleProgressUpdate as EventListener);
    
    // Check for initial progress
    if (window.analysisProgress?.stage) {
      setStage(window.analysisProgress.stage);
    }

    return () => {
      window.removeEventListener('analysisProgressUpdate', handleProgressUpdate as EventListener);
    };
  }, []);

  // Use controlled props if provided
  useEffect(() => {
    if (controlledStage) setStage(controlledStage);
    if (controlledProgress !== undefined) setProgress(controlledProgress);
  }, [controlledStage, controlledProgress]);

  // Calculate progress based on current stage
  useEffect(() => {
    const stageConfig = ANALYSIS_STAGES[stage];
    if (!stageConfig) return;

    const [minProgress, maxProgress] = stageConfig.progressRange;
    
    // Animate progress within the stage range
    const interval = setInterval(() => {
      setProgress(prev => {
        // If we're at the analyzing stage, progress slowly (AI takes time)
        const increment = stage === 'analyzing' ? 0.3 : 1;
        const next = prev + increment;
        
        // Don't exceed the max for this stage (unless complete)
        if (stage === 'complete') return 100;
        if (stage === 'error') return prev;
        
        return Math.min(next, maxProgress - 2); // Leave room for next stage
      });
    }, 200);

    // Jump to minimum progress for this stage
    setProgress(prev => Math.max(prev, minProgress));

    return () => clearInterval(interval);
  }, [stage]);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Rotate fun facts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % FUN_FACTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get completed stages
  const getCompletedStages = useCallback(() => {
    const currentIndex = STAGE_ORDER.indexOf(stage);
    return STAGE_ORDER.slice(0, currentIndex);
  }, [stage]);

  const stageConfig = ANALYSIS_STAGES[stage];
  const StageIcon = stageConfig?.icon || Brain;
  const completedStages = getCompletedStages();
  const isError = stage === 'error';

  // Format elapsed time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
        >
          {/* Animated Icon */}
          <div className="flex justify-center mb-8">
            <motion.div
              animate={isError ? {} : { 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: isError ? 0 : Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className={`w-24 h-24 ${isError ? 'bg-red-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} rounded-2xl flex items-center justify-center shadow-lg ${isError ? 'shadow-red-500/30' : 'shadow-indigo-500/30'}`}>
                {stage === 'analyzing' ? (
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                ) : (
                  <StageIcon className="w-12 h-12 text-white" />
                )}
              </div>
              {/* Sparkle effects - only show when not error */}
              {!isError && (
                <>
                  <motion.div
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                      x: [-10, -20, -10],
                      y: [-10, -20, -10]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    className="absolute -top-2 -left-2"
                  >
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </motion.div>
                  <motion.div
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                      x: [10, 20, 10],
                      y: [-10, -20, -10]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="w-5 h-5 text-pink-400" />
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className={`text-2xl md:text-3xl font-bold ${isError ? 'text-red-600' : 'text-gray-800'} mb-2`}>
              {isError ? 'Analysis Failed' : 'Analyzing Your Assessment'}
            </h1>
            <p className="text-gray-500">
              {isError 
                ? (errorMessage || 'Something went wrong. Please try again.')
                : 'Our AI is creating your personalized career profile'
              }
            </p>
          </div>

          {/* Progress Bar */}
          {!isError && (
            <div className="mb-8">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>{Math.round(progress)}% complete</span>
                <span>Elapsed: {formatTime(elapsedTime)}</span>
              </div>
            </div>
          )}

          {/* Current Stage */}
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${isError ? 'bg-red-50' : 'bg-indigo-50'} rounded-xl p-4 mb-6`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${isError ? 'bg-red-100' : 'bg-indigo-100'} rounded-lg flex items-center justify-center`}>
                  {stage === 'analyzing' ? (
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  ) : (
                    <StageIcon className={`w-5 h-5 ${isError ? 'text-red-600' : 'text-indigo-600'}`} />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${isError ? 'text-red-900' : 'text-indigo-900'}`}>
                    {stageConfig?.title}
                  </p>
                  <p className={`text-sm ${isError ? 'text-red-600' : 'text-indigo-600'}`}>
                    {stageConfig?.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Stage Indicators */}
          {!isError && (
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-8">
              {STAGE_ORDER.map((stageId) => {
                const config = ANALYSIS_STAGES[stageId];
                const isCompleted = completedStages.includes(stageId);
                const isCurrent = stageId === stage;
                const Icon = config.icon;
                
                return (
                  <div
                    key={stageId}
                    className={`
                      flex flex-col items-center p-2 rounded-lg transition-all
                      ${isCompleted ? 'bg-green-50' : isCurrent ? 'bg-indigo-50' : 'bg-gray-50'}
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center mb-1
                      ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-indigo-500' : 'bg-gray-200'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span className={`
                      text-[10px] text-center leading-tight
                      ${isCompleted ? 'text-green-600' : isCurrent ? 'text-indigo-600' : 'text-gray-400'}
                    `}>
                      {config.title.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fun Fact - only show when not error */}
          {!isError && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFactIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-xl p-4"
              >
                <div className="flex gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{FUN_FACTS[currentFactIndex]}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Bottom Note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          {isError 
            ? 'Please refresh the page and try again, or contact support if the issue persists.'
            : "Please don't close this page. Your results will be ready shortly."
          }
        </p>
      </div>
    </div>
  );
};

export default AnalyzingScreen;
