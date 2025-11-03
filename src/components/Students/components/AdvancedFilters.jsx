import React, { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Button } from './ui/button';

const AdvancedFilters = ({ onApplyFilters, initialFilters = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    employmentType: initialFilters.employmentType || [],
    experienceLevel: initialFilters.experienceLevel || [],
    mode: initialFilters.mode || [],
    salaryMin: initialFilters.salaryMin || '',
    salaryMax: initialFilters.salaryMax || '',
    skills: initialFilters.skills || [],
    department: initialFilters.department || [],
    postedWithin: initialFilters.postedWithin || '',
  });

  // Options based on actual database schema
  const employmentTypes = ['full-time', 'part-time', 'contract', 'internship', 'temporary'];
  const experienceLevels = ['entry level', 'mid level', 'senior level', 'lead', 'executive'];
  const workModes = ['onsite', 'remote', 'hybrid'];
  const departments = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Customer Support', 'Legal'];
  
  // Common tech skills - can be expanded
  const skillsList = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#',
    'React', 'Vue.js', 'Angular', 'Node.js', 'Django', 'Flask',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'Git', 'CI/CD', 'Agile', 'Scrum'
  ];
  
  const postedWithinOptions = [
    { label: 'Last 24 hours', value: '1' },
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Any time', value: '' },
  ];

  const handleCheckboxChange = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters = {
      employmentType: [],
      experienceLevel: [],
      mode: [],
      salaryMin: '',
      salaryMax: '',
      skills: [],
      department: [],
      postedWithin: '',
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const activeFilterCount = 
    filters.employmentType.length + 
    filters.experienceLevel.length + 
    filters.mode.length + 
    filters.skills.length + 
    filters.department.length +
    (filters.salaryMin ? 1 : 0) +
    (filters.salaryMax ? 1 : 0) +
    (filters.postedWithin ? 1 : 0);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Advanced Filters</span>
        {activeFilterCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Slide-in Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in">
            <style jsx>{`
              @keyframes slide-in {
                from {
                  transform: translateX(100%);
                }
                to {
                  transform: translateX(0);
                }
              }
              .animate-slide-in {
                animation: slide-in 0.3s ease-out;
              }
            `}</style>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">Advanced Filters</h2>
                <p className="text-sm text-gray-500 mt-1">Refine your job search with detailed criteria</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Employment Type */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Employment Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {employmentTypes.map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.employmentType.includes(type)}
                        onChange={() => handleCheckboxChange('employmentType', type)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Experience Level</h3>
                <div className="grid grid-cols-2 gap-2">
                  {experienceLevels.map(level => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.experienceLevel.includes(level)}
                        onChange={() => handleCheckboxChange('experienceLevel', level)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Work Mode */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Work Mode</h3>
                <div className="grid grid-cols-3 gap-2">
                  {workModes.map(mode => (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.mode.includes(mode)}
                        onChange={() => handleCheckboxChange('mode', mode)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Salary Range (Monthly)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                    <input
                      type="number"
                      placeholder="$ 0"
                      value={filters.salaryMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                    <input
                      type="number"
                      placeholder="$ 10,000"
                      value={filters.salaryMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, salaryMax: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Department */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Department</h3>
                <div className="grid grid-cols-2 gap-2">
                  {departments.map(dept => (
                    <label key={dept} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.department.includes(dept)}
                        onChange={() => handleCheckboxChange('department', dept)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Skills Required</h3>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                  {skillsList.map(skill => (
                    <label key={skill} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.skills.includes(skill)}
                        onChange={() => handleCheckboxChange('skills', skill)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Posted Within */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Posted Within</h3>
                <div className="flex flex-wrap gap-2">
                  {postedWithinOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFilters(prev => ({ ...prev, postedWithin: option.value }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.postedWithin === option.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Reset All
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdvancedFilters;
