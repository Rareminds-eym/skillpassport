import React from 'react';
import { motion } from 'framer-motion';

const VideoPortfolioLoader: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900">
      <div className="flex flex-col items-center justify-center h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* RM Logo with Spinning Ring */}
          <div className="relative mb-6">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400"></div>
            <img
              src="/RMLogo.webp"
              alt="RM Logo"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 object-contain"
            />
          </div>

          {/* Video Portfolio Text with Loading Dots */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-xl font-semibold text-gray-800 dark:text-white">
                Loading Video Portfolio
              </p>

              {/* Animated Loading Dots */}
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    className="w-1.5 h-1.5 bg-gray-800 dark:bg-white rounded-full"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: index * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
              Powered by <span className="font-semibold text-indigo-600 dark:text-indigo-400">RareMinds</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoPortfolioLoader;
