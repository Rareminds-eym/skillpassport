import React, { useState } from 'react';
import { X, BookOpen, Clock, Users, Award, CheckCircle, ShoppingCart, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CoursePurchaseModal = ({ course, isOpen, onClose, onPurchase, userRole = 'educator' }) => {
  const [isPurchasing, setIsPurchasing] = useState(false);

  if (!isOpen || !course) return null;

  // Mock pricing based on role (you can customize this)
  const getPrice = () => {
    if (course.price) return course.price;
    // Default pricing if not set
    return {
      educator: 499,
      school_admin: 2999,
      college_admin: 4999,
      university_admin: 9999
    }[userRole] || 499;
  };

  const price = getPrice();

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      await onPurchase(course);
    } finally {
      setIsPurchasing(false);
    }
  };

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
            {(course.thumbnail?.startsWith('http') || course.thumbnail?.startsWith('data:')) ? (
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
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                course.status === 'Active'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}>
                {course.status}
              </span>
            </div>

            {/* Price Badge */}
            <div className="absolute bottom-4 right-4 bg-white rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">₹{price}</span>
              </div>
              <p className="text-xs text-gray-500 text-right">One-time purchase</p>
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
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Students</p>
                  <p className="text-sm font-medium">{course.enrollment_count || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Modules</p>
                  <p className="text-sm font-medium">{course.modules?.length || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Award className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">Skills</p>
                  <p className="text-sm font-medium">{course.skills_covered?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h3 className="text-sm font-semibold text-emerald-900 mb-3">What's Included</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Lifetime access to course content
                </li>
                <li className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  All course materials and resources
                </li>
                <li className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Certificate of completion
                </li>
                <li className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Access to future updates
                </li>
              </ul>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Course</h3>
              <p className="text-gray-600 leading-relaxed">{course.description}</p>
            </div>

            {/* Instructor */}
            {course.educator_name && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Instructor</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                    {course.educator_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{course.educator_name}</p>
                    <p className="text-sm text-gray-500">Course Instructor</p>
                  </div>
                </div>
              </div>
            )}

            {/* Skills Covered */}
            {course.skills_covered && course.skills_covered.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills You'll Learn</h3>
                <div className="flex flex-wrap gap-2">
                  {course.skills_covered.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Course Modules/Structure */}
            {course.modules && course.modules.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Content</h3>
                <div className="space-y-3">
                  {course.modules.map((module, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Module {index + 1}: {module.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {module.lessons?.length || 0} lessons
                        </span>
                      </div>
                      {module.lessons && module.lessons.length > 0 && (
                        <ul className="space-y-1 ml-4">
                          {module.lessons.slice(0, 3).map((lesson, lessonIndex) => (
                            <li key={lessonIndex} className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-gray-400" />
                              {lesson.title || lesson}
                            </li>
                          ))}
                          {module.lessons.length > 3 && (
                            <li className="text-sm text-gray-500 ml-6">
                              + {module.lessons.length - 3} more lessons
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Target Outcomes */}
            {course.target_outcomes && course.target_outcomes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What You'll Achieve</h3>
                <ul className="space-y-2">
                  {course.target_outcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer with Purchase Button */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">₹{price}</p>
                <p className="text-sm text-gray-600">One-time payment</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={isPurchasing}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={course.status !== 'Active' || isPurchasing}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    course.status === 'Active' && !isPurchasing
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isPurchasing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {course.status === 'Active' ? 'Purchase Course' : 'Coming Soon'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CoursePurchaseModal;
