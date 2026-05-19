import React, { useState, useRef, useEffect } from 'react';
import { Settings, FileText, BookOpen } from 'lucide-react';

export type AssistantMode = 'worksheet' | 'lesson-plan' | null;

interface TeachingAssistantSettingsProps {
  currentMode: AssistantMode;
  onModeChange: (mode: AssistantMode) => void;
}

const TeachingAssistantSettings: React.FC<TeachingAssistantSettingsProps> = ({ 
  currentMode, 
  onModeChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const modes = [
    { value: 'worksheet' as const, label: 'Worksheet Generator', icon: FileText },
    { value: 'lesson-plan' as const, label: 'Lesson Planner', icon: BookOpen },
  ];

  const currentModeData = modes.find(m => m.value === currentMode);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        title="Teaching Assistant Mode"
      >
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700">Assistant Mode</p>
          </div>
          
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.value;
            
            return (
              <button
                key={mode.value}
                onClick={() => {
                  onModeChange(mode.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-purple-50 transition-colors ${
                  isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{mode.label}</p>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-purple-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeachingAssistantSettings;
