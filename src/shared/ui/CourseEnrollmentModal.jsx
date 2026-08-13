import { motion } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

/**
 * Confirmation shown after a learner's course interest has been persisted.
 *
 * Renders the success case only - it is never displayed unless the interest
 * record was written. The pending state and any error message belong to the
 * entry point that owns the control the learner clicked, not to this modal.
 *
 * Rendered above the surface that opened it, including the Career Track wizard
 * (z-[100]), so dismissing it returns the learner to that surface unchanged.
 * Clicks are stopped at the overlay so dismissal cannot reach the surface below.
 *
 * @param {boolean}  isOpen  Visibility state, set only after capture succeeded.
 * @param {Function} onClose Clears the visibility state. No other side effects.
 */
const CourseEnrollmentModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-enrollment-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-sm bg-white rounded-[20px] shadow-[0_16px_48px_-12px_rgba(15,23,42,0.18)] px-8 pt-9 pb-8 text-center"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-blue-50 ring-8 ring-blue-50/60 flex items-center justify-center">
          <CheckCircle className="w-11 h-11 text-blue-600" strokeWidth={1.75} />
        </div>

        <h3
          id="course-enrollment-title"
          className="text-xl font-bold text-gray-900 tracking-tight"
        >
          Course Enrollment
        </h3>

        <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-blue-600" />

        <p className="mt-4 mx-auto max-w-[19rem] text-[15px] leading-relaxed text-gray-600">
          Thank you for your interest in this course. An administrator will
          contact you shortly to assist you with the enrollment process.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-3/5 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold shadow-sm shadow-blue-600/20 transition-colors"
        >
          OK
        </button>
      </motion.div>
    </div>
  );
};

export default CourseEnrollmentModal;
