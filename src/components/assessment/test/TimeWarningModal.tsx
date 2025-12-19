import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimeWarningModalProps {
  type: 'half-time' | 'review-time';
  onClose: () => void;
}

const TimeWarningModal: React.FC<TimeWarningModalProps> = ({ type, onClose }) => {
  const messages = {
    'half-time': {
      title: '30 Minutes Remaining',
      message: 'You have reached the halfway point. Please manage your time wisely and ensure all questions are answered.'
    },
    'review-time': {
      title: '10 Minutes Remaining',
      message: 'You are now in the review period. Please review your answers carefully before the test auto-submits.'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl m-4"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            {type === 'half-time' ? (
              <Clock className="h-8 w-8 text-yellow-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-serif">
            {messages[type].title}
          </h3>
          <p className="mt-2 text-gray-600">
            {messages[type].message}
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continue Test
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TimeWarningModal;