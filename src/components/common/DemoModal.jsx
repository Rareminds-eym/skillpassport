import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const TvMinimalPlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z"/>
    <path d="M7 21h10"/>
    <rect width="20" height="14" x="2" y="3" rx="2"/>
  </svg>
);

const DemoModal = ({ isOpen, onClose, message = "This feature is for demo purposes only." }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6  p-2 bg-gray-100 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-800" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <TvMinimalPlayIcon />
              </div>
              <div className="pt-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Demo Mode</h3>
                <p className="text-gray-700 text-sm font-medium">Feature Information</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-6">
            <p className="text-gray-600 text-base leading-relaxed">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <button
              onClick={onClose}
              className="w-full px-6 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-sm"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DemoModal;
