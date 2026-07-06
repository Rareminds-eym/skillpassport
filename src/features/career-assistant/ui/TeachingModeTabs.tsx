import React from 'react';
import { FileText, BookOpen } from 'lucide-react';

export type AssistantMode = 'worksheet' | 'lesson-plan' | null;

interface TeachingModeTabsProps {
  currentMode: AssistantMode;
  onModeChange: (mode: AssistantMode) => void;
}

/**
 * Horizontal tab selector for educators
 * Clean tab design similar to SwapRequestsDashboard
 */
const TeachingModeTabs: React.FC<TeachingModeTabsProps> = ({ 
  currentMode, 
  onModeChange 
}) => {
  return (
    <div className="inline-flex gap-3 bg-gray-100 p-1 rounded-xl">
      <button
        onClick={() => onModeChange(currentMode === 'worksheet' ? null : 'worksheet')}
        className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
          currentMode === 'worksheet'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <FileText className="w-4 h-4" />
        Worksheet Generator
        {currentMode === 'worksheet' && (
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full ml-1" />
        )}
      </button>
      <button
        onClick={() => onModeChange(currentMode === 'lesson-plan' ? null : 'lesson-plan')}
        className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
          currentMode === 'lesson-plan'
            ? 'bg-white text-purple-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <BookOpen className="w-4 h-4" />
        Lesson Planner
        {currentMode === 'lesson-plan' && (
          <div className="w-1.5 h-1.5 bg-purple-600 rounded-full ml-1" />
        )}
      </button>
    </div>
  );
};

export default TeachingModeTabs;
