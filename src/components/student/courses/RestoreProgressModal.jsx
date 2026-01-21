import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Clock, Play, RotateCcw, X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Modal displayed when student returns to a course with existing progress
 * Offers options to continue from last position or start fresh
 */
const RestoreProgressModal = ({
  isOpen,
  restorePoint,
  courseName,
  onRestore,
  onStartFresh,
  onClose,
  lastAccessedText,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!restorePoint) return null;

  const moduleNumber = (restorePoint.lastModuleIndex || 0) + 1;
  const lessonNumber = (restorePoint.lastLessonIndex || 0) + 1;
  const progress = restorePoint.progress || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 id="restore-modal-title" className="text-xl font-bold">
                    Welcome Back!
                  </h2>
                  <p className="text-indigo-100 text-sm">Continue your learning journey</p>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Course Progress</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {courseName && (
                <p className="text-gray-600 text-sm mb-4">
                  <span className="font-medium text-gray-900">{courseName}</span>
                </p>
              )}

              {/* Last position info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Play className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Module {moduleNumber}, Lesson {lessonNumber}
                    </p>
                    {lastAccessedText && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        Last accessed {lastAccessedText}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={onRestore}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Play className="w-5 h-5" />
                  Continue Where I Left Off
                </button>

                <button
                  onClick={onStartFresh}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Start From Beginning
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RestoreProgressModal;
