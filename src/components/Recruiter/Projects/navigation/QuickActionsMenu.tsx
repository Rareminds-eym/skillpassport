import React, { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  DocumentPlusIcon,
  BriefcaseIcon,
  ChartBarIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color?: 'purple' | 'blue' | 'green' | 'orange';
}

interface QuickActionsMenuProps {
  actions: QuickAction[];
}

const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const getColorClasses = (color?: string) => {
    const colors = {
      purple: 'bg-purple-600 hover:bg-purple-700',
      blue: 'bg-blue-600 hover:bg-blue-700',
      green: 'bg-green-600 hover:bg-green-700',
      orange: 'bg-orange-600 hover:bg-orange-700',
    };
    return colors[color as keyof typeof colors] || colors.purple;
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {/* Action Items (shown when open) */}
      {isOpen && (
        <div className="mb-4 space-y-2 animate-in slide-in-from-bottom-2 duration-200">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-full shadow-lg text-white font-medium
                  transition-all hover:scale-105 hover:shadow-xl
                  ${getColorClasses(action.color)}
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="pr-2">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center w-14 h-14 rounded-full shadow-lg
          transition-all hover:scale-110 hover:shadow-xl
          ${isOpen ? 'bg-red-600 hover:bg-red-700 rotate-45' : 'bg-purple-600 hover:bg-purple-700'}
        `}
        aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6 text-white" />
        ) : (
          <PlusIcon className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 -z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default QuickActionsMenu;

// Compact version for desktop corner
export const CompactQuickActions: React.FC<{ onNewProject: () => void }> = ({ onNewProject }) => {
  return (
    <button
      onClick={onNewProject}
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
      aria-label="Create new project"
    >
      <PlusIcon className="h-6 w-6" />
    </button>
  );
};
