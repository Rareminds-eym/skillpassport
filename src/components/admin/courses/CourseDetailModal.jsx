import React from 'react';
import { X, BookOpen, Clock, Users, Award, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CourseDetailModal = ({ course, isOpen, onClose }) => {
  if (!isOpen || !course) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header with Thumbnail */}
          <div className="relative h-64 bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
            {course.thumbnail?.startsWith('http') || course.thumbnail?.startsWith('data:') ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-24 w-24 text-white opacity-90" />
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Status Badge */}
            <div className="absolute top-4 left-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.status === 'Active'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {course.status}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Course Title and Code */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h2>
              <p className="text-sm text-gray-500">Course Code: {course.code}</p>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-medium">{course.duration || 'Self-paced'}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CourseDetailModal;
