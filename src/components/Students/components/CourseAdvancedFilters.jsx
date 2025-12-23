import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

const CourseAdvancedFilters = ({ onApplyFilters, initialFilters = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: initialFilters.category || [],
    skillType: initialFilters.skillType || [],
    duration: initialFilters.duration || [],
    enrollmentRange: initialFilters.enrollmentRange || '',
    postedWithin: initialFilters.postedWithin || '',
  });

  // Dynamic options from database
  const [availableOptions, setAvailableOptions] = useState({
    categories: [],
    skillTypes: [],
    durations: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch available filter options from database
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoadingOptions(true);
        
        // Fetch distinct categories
        const { data: categories } = await supabase
          .from('courses')
          .select('category')
          .not('category', 'is', null)
          .is('deleted_at', null);

        // Fetch distinct skill types
        const { data: skillTypes } = await supabase
          .from('courses')
          .select('skill_type')
          .not('skill_type', 'is', null)
          .is('deleted_at', null);

        // Fetch distinct durations
        const { data: durations } = await supabase
          .from('courses')
          .select('duration')
          .not('duration', 'is', null)
          .is('deleted_at', null);

        setAvailableOptions({
          categories: [...new Set(categories?.map(c => c.category).filter(Boolean))] || [],
          skillTypes: [...new Set(skillTypes?.map(s => s.skill_type).filter(Boolean))] || [],
          durations: [...new Set(durations?.map(d => d.duration).filter(Boolean))] || [],
        });
      } catch (error) {
        console.error('Error fetching filter options:', error);
        // Fallback to static options
        setAvailableOptions({
          categories: ['Corporate Training', 'Academic', 'Professional Development', 'Certification'],
          skillTypes: ['technical', 'soft'],
          durations: ['2 weeks', '3 weeks', '4 weeks', '5 weeks', '6 weeks', '8 weeks'],
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchFilterOptions();
  }, []);

  const postedWithinOptions = [
    { label: 'Last 24 hours', value: '1' },
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 3 months', value: '90' },
    { label: 'Any time', value: '' },
  ];

  const enrollmentRangeOptions = [
    { label: 'Intimate Learning (Up to 25)', value: '1-25', min: 1, max: 25 },
    { label: 'Interactive Groups (26-100)', value: '26-100', min: 26, max: 100 },
    { label: 'Popular Courses (101-500)', value: '101-500', min: 101, max: 500 },
    { label: 'Massive Enrollment (500+)', value: '500+', min: 500, max: null },
    { label: 'All Courses', value: '', min: null, max: null },
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
      category: [],
      skillType: [],
      duration: [],
      enrollmentRange: '',
      postedWithin: '',
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const activeFilterCount = 
    filters.category.length + 
    filters.skillType.length + 
    filters.duration.length + 
    (filters.enrollmentRange ? 1 : 0) +
    (filters.postedWithin ? 1 : 0);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors text-sm font-medium h-12 shadow-sm ${
          activeFilterCount > 0 
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Advanced Filters</span>
        {activeFilterCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-indigo-600 text-white text-xs font-semibold rounded-full">
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
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in">
            <style jsx>{`
              @keyframes slide-in {
                from {
                  transform: translateX(-100%);
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
                <h2 className="text-2xl font-bold text-gray-900">Advanced Course Filters</h2>
                <p className="text-sm text-gray-500 mt-1">Refine your course search with detailed criteria</p>
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
              {loadingOptions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600"></div>
                  <span className="ml-3 text-gray-600">Loading filter options...</span>
                </div>
              ) : (
                <>
                  {/* Category */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Category</h3>
                    {availableOptions.categories.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {availableOptions.categories.map(category => (
                          <label key={category} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filters.category.includes(category)}
                              onChange={() => handleCheckboxChange('category', category)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">{category}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No categories available</p>
                    )}
                  </div>

                  {/* Skill Type */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Skill Type</h3>
                    {availableOptions.skillTypes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {availableOptions.skillTypes.map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filters.skillType.includes(type)}
                              onChange={() => handleCheckboxChange('skillType', type)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">{type}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No skill types available</p>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Duration</h3>
                    {availableOptions.durations.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {availableOptions.durations.map(duration => (
                          <label key={duration} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filters.duration.includes(duration)}
                              onChange={() => handleCheckboxChange('duration', duration)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">{duration}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No durations available</p>
                    )}
                  </div>

                  {/* Course Popularity */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Course Popularity</h3>
                    <div className="space-y-2">
                      {enrollmentRangeOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setFilters(prev => ({ ...prev, enrollmentRange: option.value }))}
                          className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors border ${
                            filters.enrollmentRange === option.value
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
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
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
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

export default CourseAdvancedFilters;