import React from 'react';
import { Users, Calendar, ClipboardList, GraduationCap, FileText, Award, Target } from 'lucide-react';

type TabType = 'overview' | 'assignments' | 'timetable' | 'classmates' | 'curriculars' | 'exams' | 'results';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'overview' as TabType, label: 'Overview', icon: Target },
  { id: 'assignments' as TabType, label: 'Assignments', icon: ClipboardList },
  { id: 'timetable' as TabType, label: 'Timetable', icon: Calendar },
  { id: 'classmates' as TabType, label: 'Classmates', icon: Users },
  { id: 'curriculars' as TabType, label: 'Co-Curriculars', icon: GraduationCap },
  { id: 'exams' as TabType, label: 'Exams', icon: FileText },
  { id: 'results' as TabType, label: 'Results', icon: Award }
];

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="border-b border-gray-200">
        {/* Mobile Selector */}
        <div className="sm:hidden">
          <select
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value as TabType)}
            className="block w-full px-4 py-3 text-base border-0 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {tabs.map(tab => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex -mb-px overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 lg:px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;
