import { useState, useRef, useEffect } from 'react';
import { Settings2, FileText, BookOpen, MessageSquare, Check } from 'lucide-react';

export type AssistantMode = 'worksheet' | 'lesson-plan' | 'chat' | null;

interface TeachingAssistantSettingsProps {
  currentMode: AssistantMode;
  onModeChange: (_mode: AssistantMode) => void;
}

const TeachingAssistantSettings = ({
  currentMode,
  onModeChange
}: TeachingAssistantSettingsProps) => {
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
    { value: 'worksheet' as const, label: 'Worksheet Generator', icon: FileText, desc: 'Generate quizzes & rubrics' },
    { value: 'lesson-plan' as const, label: 'Lesson Planner', icon: BookOpen, desc: 'Structure teaching time & notes' },
    { value: 'chat' as const, label: 'Freeform AI Assistant', icon: MessageSquare, desc: 'Ask any teaching query' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        title="Assistant Mode Settings"
        aria-label="Assistant Mode Settings"
      >
        <Settings2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
          <div className="px-3 py-1.5 border-b border-slate-100">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Assistant Mode</p>
          </div>

          <div className="p-1 space-y-0.5">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isActive = currentMode === mode.value;

              return (
                <button
                  type="button"
                  key={mode.value}
                  onClick={() => {
                    onModeChange(mode.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 text-left flex items-start gap-2.5 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-50/70 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-tight">{mode.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">{mode.desc}</p>
                  </div>
                  {isActive && (
                    <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachingAssistantSettings;
