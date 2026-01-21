import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import AITutorChat from './AITutorChat';

interface AITutorButtonProps {
  courseId: string;
  lessonId?: string;
  position?: 'bottom-right' | 'bottom-left';
}

const AITutorButton: React.FC<AITutorButtonProps> = ({
  courseId,
  lessonId,
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = position === 'bottom-right' ? 'right-6 bottom-6' : 'left-6 bottom-6';

  const chatPositionClasses =
    position === 'bottom-right' ? 'right-6 bottom-24' : 'left-6 bottom-24';

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${positionClasses} z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group`}
        aria-label={isOpen ? 'Close AI Tutor' : 'Open AI Tutor'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </>
        )}

        {/* Tooltip */}
        {!isOpen && (
          <span className="absolute right-full mr-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            AI Course Tutor
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className={`fixed ${chatPositionClasses} z-40`}>
          <AITutorChat courseId={courseId} lessonId={lessonId} onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
};

export default AITutorButton;
