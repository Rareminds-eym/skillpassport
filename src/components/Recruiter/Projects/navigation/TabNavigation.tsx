import React from 'react';
import { 
  RectangleStackIcon, 
  DocumentTextIcon, 
  BriefcaseIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export type ProjectTab = 'all' | 'active-contracts' | 'proposals' | 'milestones' | 'analytics';

interface TabItem {
  id: ProjectTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badge?: 'new' | 'attention' | null;
}

interface TabNavigationProps {
  activeTab: ProjectTab;
  onTabChange: (tab: ProjectTab) => void;
  tabs: TabItem[];
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex space-x-1 px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group relative flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all
                ${isActive 
                  ? 'border-purple-600 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
              <span>{tab.label}</span>
              
              {/* Count Badge */}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`
                  ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${isActive 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}

              {/* Notification Badge */}
              {tab.badge === 'new' && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
              
              {tab.badge === 'attention' && (
                <span className="absolute top-2 right-2 flex h-2 w-2 bg-yellow-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;

// Mobile Tab Navigation (Bottom Sheet)
export const MobileTabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
      <nav className="flex justify-around items-center px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center py-2 px-3 rounded-lg flex-1 relative
                ${isActive ? 'text-purple-600' : 'text-gray-500'}
              `}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
              <span className="text-xs font-medium">{tab.label}</span>
              
              {tab.count !== undefined && tab.count > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {tab.count > 9 ? '9+' : tab.count}
                </span>
              )}

              {tab.badge === 'new' && (
                <span className="absolute top-1 right-1 flex h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

