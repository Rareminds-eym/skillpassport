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
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { PipelineFilters } from '../../../types/recruiter';

interface PipelineAdvancedFiltersProps {
  filters: PipelineFilters;
  onFiltersChange: (filters: PipelineFilters) => void;
  onReset: () => void;
}

// Filter options data
const STAGES = [
  { value: 'sourced', label: 'Sourced' },
  { value: 'screened', label: 'Screened' },
  { value: 'interview_1', label: 'Interview 1' },
  { value: 'interview_2', label: 'Interview 2' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' }
];

const SKILLS = ['React', 'Python', 'Node.js', 'Java', 'TypeScript', 'AWS', 'Docker', 'SQL', 'MongoDB', 'Kubernetes'];
const DEPARTMENTS = ['Engineering', 'Food Safety', 'Manufacturing', 'Quality Assurance', 'IT', 'Operations'];
const LOCATIONS = ['Chennai', 'Bangalore', 'Coimbatore', 'Pune', 'Mumbai', 'Hyderabad', 'Delhi'];
const SOURCES = [
  { value: 'talent_pool', label: 'Talent Pool' },
  { value: 'direct_application', label: 'Direct Application' },
  { value: 'referral', label: 'Referral' },
  { value: 'sourced', label: 'Sourced' }
];

const NEXT_ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'schedule_interview', label: 'Schedule Interview' },
  { value: 'make_offer', label: 'Make Offer' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'review_application', label: 'Review Application' }
];

const RECRUITERS = ['Sarah Johnson', 'Mike Chen', 'Lisa Wang', 'Raj Kumar', 'Emily Brown'];

const PipelineAdvancedFilters: React.FC<PipelineAdvancedFiltersProps> = ({ 
  filters, 
  onFiltersChange, 
  onReset 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Count active filters
  const activeFilterCount = 
    filters.stages.length +
    filters.skills.length +
    filters.departments.length +
    filters.locations.length +
    filters.sources.length +
    filters.nextActionTypes.length +
    filters.assignedTo.length +
    (filters.aiScoreRange.min !== undefined || filters.aiScoreRange.max !== undefined ? 1 : 0) +
    (filters.hasNextAction !== null ? 1 : 0);

  const toggleFilter = (category: keyof PipelineFilters, value: string) => {
    const currentValues = filters[category] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({
      ...filters,
      [category]: newValues
    });
  };

  const clearCategory = (category: keyof PipelineFilters) => {
    if (category === 'aiScoreRange') {
      onFiltersChange({
        ...filters,
        aiScoreRange: {}
      });
    } else if (category === 'hasNextAction') {
      onFiltersChange({
        ...filters,
        hasNextAction: null
      });
    } else {
      onFiltersChange({
        ...filters,
        [category]: []
      });
    }
  };

  const FilterSection = ({ 
    title, 
    icon: Icon, 
    category, 
    options 
  }: { 
    title: string; 
    icon: any; 
    category: keyof PipelineFilters; 
    options: Array<string | { value: string; label: string }> 
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
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              const isSelected = selectedValues.includes(optionValue);
              
              return (
                <label
                  key={optionValue}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleFilter(category, optionValue)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{optionLabel}</span>
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

  const AIScoreRangeSection = () => {
    const isActive = filters.aiScoreRange.min !== undefined || filters.aiScoreRange.max !== undefined;

    return (
      <div className="border-b border-gray-200">
        <button
          onClick={() => setActiveSection(activeSection === 'aiScoreRange' ? null : 'aiScoreRange')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChartBarIcon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
              AI Score Range
            </span>
            {isActive && (
              <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                {filters.aiScoreRange.min || 0} - {filters.aiScoreRange.max || 100}
              </span>
            )}
          </div>
          <ChevronDownIcon 
            className={`h-4 w-4 text-gray-400 transition-transform ${
              activeSection === 'aiScoreRange' ? 'transform rotate-180' : ''
            }`} 
          />
        </button>
        
        {activeSection === 'aiScoreRange' && (
          <div className="px-6 py-4 bg-gray-50 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.aiScoreRange.min || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  aiScoreRange: { ...filters.aiScoreRange, min: e.target.value ? Number(e.target.value) : undefined }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.aiScoreRange.max || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  aiScoreRange: { ...filters.aiScoreRange, max: e.target.value ? Number(e.target.value) : undefined }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="100"
              />
            </div>
            {isActive && (
              <button
                onClick={() => clearCategory('aiScoreRange')}
                className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Clear AI Score Range
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const NextActionStatusSection = () => {
    const isActive = filters.hasNextAction !== null;

    return (
      <div className="border-b border-gray-200">
        <button
          onClick={() => setActiveSection(activeSection === 'hasNextAction' ? null : 'hasNextAction')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ClockIcon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
              Next Action Status
            </span>
            {isActive && (
              <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                1
              </span>
            )}
          </div>
          <ChevronDownIcon 
            className={`h-4 w-4 text-gray-400 transition-transform ${
              activeSection === 'hasNextAction' ? 'transform rotate-180' : ''
            }`} 
          />
        </button>
        
        {activeSection === 'hasNextAction' && (
          <div className="px-6 py-4 bg-gray-50 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
              <input
                type="radio"
                checked={filters.hasNextAction === null}
                onChange={() => onFiltersChange({ ...filters, hasNextAction: null })}
                className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">All</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
              <input
                type="radio"
                checked={filters.hasNextAction === true}
                onChange={() => onFiltersChange({ ...filters, hasNextAction: true })}
                className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Has Next Action</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
              <input
                type="radio"
                checked={filters.hasNextAction === false}
                onChange={() => onFiltersChange({ ...filters, hasNextAction: false })}
                className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">No Next Action</span>
            </label>
            {isActive && (
              <button
                onClick={() => clearCategory('hasNextAction')}
                className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Clear Next Action Status
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
                <h3 className="text-lg font-semibold text-gray-900">Pipeline Filters</h3>
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
                title="Pipeline Stage"
                icon={BriefcaseIcon}
                category="stages"
                options={STAGES}
              />
              
              <FilterSection
                title="Skills"
                icon={SparklesIcon}
                category="skills"
                options={SKILLS}
              />
              
              <FilterSection
                title="Department"
                icon={BriefcaseIcon}
                category="departments"
                options={DEPARTMENTS}
              />
              
              <FilterSection
                title="Location"
                icon={MapPinIcon}
                category="locations"
                options={LOCATIONS}
              />
              
              <FilterSection
                title="Source"
                icon={UserGroupIcon}
                category="sources"
                options={SOURCES}
              />
              
              <AIScoreRangeSection />
              
              <FilterSection
                title="Next Action Type"
                icon={ClockIcon}
                category="nextActionTypes"
                options={NEXT_ACTION_TYPES}
              />
              
              <NextActionStatusSection />
              
              <FilterSection
                title="Assigned To"
                icon={UserIcon}
                category="assignedTo"
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
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PipelineAdvancedFilters;
