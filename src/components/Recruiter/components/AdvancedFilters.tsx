import React, { useState } from 'react';
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  MapPinIcon,
  BriefcaseIcon,
  UserGroupIcon,
  AcademicCapIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { AnalyticsFilters } from '../../../types/recruiter';

interface AdvancedFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onReset: () => void;
}

// Filter options data
const DEPARTMENTS = [
  'Engineering',
  'Food Safety',
  'Manufacturing',
  'Quality Assurance',
  'IT',
  'Operations',
];
const JOB_LEVELS = ['Intern', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead'];
const SOURCES = [
  'Direct Application',
  'Referral',
  'Campus Drive',
  'Hackathon',
  'Course Program',
  'LinkedIn',
  'Job Board',
];
const SKILLS = [
  'React',
  'Python',
  'Node.js',
  'HACCP',
  'Six Sigma',
  'AutoCAD',
  'AWS',
  'TypeScript',
  'Java',
  'FMEA',
];
const LOCATIONS = ['Chennai', 'Bangalore', 'Coimbatore', 'Pune', 'Mumbai', 'Hyderabad', 'Delhi'];
const RECRUITERS = ['Sarah Johnson', 'Mike Chen', 'Lisa Wang', 'Raj Kumar', 'Emily Brown'];

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ filters, onFiltersChange, onReset }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Count active filters
  const activeFilterCount =
    filters.departments.length +
    filters.jobLevels.length +
    filters.sources.length +
    filters.skills.length +
    filters.locations.length +
    filters.recruiters.length;

  const toggleFilter = (category: keyof AnalyticsFilters, value: string) => {
    const currentValues = filters[category] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...filters,
      [category]: newValues,
    });
  };

  const clearCategory = (category: keyof AnalyticsFilters) => {
    onFiltersChange({
      ...filters,
      [category]: [],
    });
  };

  const FilterSection = ({
    title,
    icon: Icon,
    category,
    options,
  }: {
    title: string;
    icon: any;
    category: keyof AnalyticsFilters;
    options: string[];
  }) => {
    const selectedValues = filters[category] as string[];
    const isActive = selectedValues.length > 0;

    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => setActiveSection(activeSection === category ? null : category)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
              {title}
            </span>
            {isActive && (
              <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                {selectedValues.length}
              </span>
            )}
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition-transform ${
              activeSection === category ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {activeSection === category && (
          <div className="px-6 py-4 bg-gray-50 space-y-2 max-h-80 overflow-y-auto">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option);
              return (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleFilter(category, option)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              );
            })}
            {selectedValues.length > 0 && (
              <button
                onClick={() => clearCategory(category)}
                className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Clear {title}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${
          isExpanded || activeFilterCount > 0
            ? 'bg-primary-50 border-primary-300 text-primary-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Advanced Filters</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Filter Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setIsExpanded(false)}
          />

          {/* Slide-in Panel from Right */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FunnelIcon className="h-6 w-6 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700 font-medium">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                  </span>
                  <button
                    onClick={onReset}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            )}

            {/* Filter Sections */}
            <div className="flex-1 overflow-y-auto">
              <FilterSection
                title="Department"
                icon={BriefcaseIcon}
                category="departments"
                options={DEPARTMENTS}
              />

              <FilterSection
                title="Job Level"
                icon={AcademicCapIcon}
                category="jobLevels"
                options={JOB_LEVELS}
              />

              <FilterSection
                title="Source"
                icon={SparklesIcon}
                category="sources"
                options={SOURCES}
              />

              <FilterSection
                title="Skills"
                icon={SparklesIcon}
                category="skills"
                options={SKILLS}
              />

              <FilterSection
                title="Location"
                icon={MapPinIcon}
                category="locations"
                options={LOCATIONS}
              />

              <FilterSection
                title="Recruiter"
                icon={UserGroupIcon}
                category="recruiters"
                options={RECRUITERS}
              />
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
              <button
                onClick={onReset}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="absolute top-full left-0 mt-2 flex flex-wrap gap-2 max-w-2xl">
          {filters.departments.map((dept) => (
            <span
              key={dept}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
            >
              <BriefcaseIcon className="h-3 w-3" />
              {dept}
              <button
                onClick={() => toggleFilter('departments', dept)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}

          {filters.jobLevels.map((level) => (
            <span
              key={level}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
            >
              <AcademicCapIcon className="h-3 w-3" />
              {level}
              <button
                onClick={() => toggleFilter('jobLevels', level)}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}

          {filters.sources.map((source) => (
            <span
              key={source}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full"
            >
              <SparklesIcon className="h-3 w-3" />
              {source}
              <button
                onClick={() => toggleFilter('sources', source)}
                className="hover:bg-purple-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}

          {filters.locations.map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full"
            >
              <MapPinIcon className="h-3 w-3" />
              {loc}
              <button
                onClick={() => toggleFilter('locations', loc)}
                className="hover:bg-orange-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
