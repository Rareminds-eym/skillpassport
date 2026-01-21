import React, { useState } from 'react';

interface LessonSectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: React.ReactNode | string;
}

const LessonSection: React.FC<LessonSectionProps> = ({ icon: Icon, title, content }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <Icon className="w-4 h-4 text-gray-600" />
            </div>
            <h6 className="text-sm font-semibold text-gray-900">{title}</h6>
          </div>
          <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg
              className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          {typeof content === 'string' ? (
            <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
          ) : (
            content
          )}
        </div>
      )}
    </div>
  );
};

export default LessonSection;
