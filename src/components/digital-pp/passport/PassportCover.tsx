import React from 'react';
import { motion } from 'framer-motion';

interface PassportCoverProps {
  isOpen: boolean;
  onClick: () => void;
}

const PassportCover: React.FC<PassportCoverProps> = ({ isOpen, onClick }) => {
  return (
    <motion.div
      className={`passport-page ${isOpen ? 'passport-flip flipped' : 'passport-flip'}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.6 }}
    >
      {/* Front Cover */}
      <div className="passport-front">
        <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg shadow-2xl p-8 flex flex-col items-center justify-center text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white rounded-full"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border border-white rounded-full"></div>
            <div className="absolute bottom-8 left-8 w-8 h-8 border border-white rounded-full"></div>
            <div className="absolute bottom-4 right-4 w-20 h-20 border-2 border-white rounded-full"></div>
          </div>

          {/* Logo/Emblem */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
              </svg>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2 tracking-wide">DIGITAL</h1>
            <h2 className="text-4xl font-bold mb-4 tracking-wider">PASSPORT</h2>
            <div className="w-32 h-0.5 bg-white mx-auto mb-4"></div>
            <p className="text-lg opacity-90">Professional Portfolio</p>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="absolute bottom-6 left-0 right-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <p className="text-sm opacity-75">Click to open</p>
          </motion.div>
        </div>
      </div>

      {/* Back Cover (when flipped) */}
      <div className="passport-back">
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl p-8 flex flex-col items-center justify-center text-white">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Digital Portfolio System</h3>
            <p className="text-sm opacity-75 mb-6 max-w-xs">
              This digital passport contains verified professional information and achievements.
            </p>
            <div className="space-y-2 text-xs opacity-60">
              <p>© 2024 Digital Portfolio Platform</p>
              <p>Powered by RareMins Technology</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PassportCover;
