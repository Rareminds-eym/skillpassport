import React, { useState } from 'react';
import {
  FunnelIcon,
  ViewColumnsIcon,
  TableCellsIcon,
  Squares2X2Icon,
  EyeIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { candidates } from '../../data/sampleData';

const FilterSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
};

const CheckboxGroup = ({ options, selectedValues, onChange }) => {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center">
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selectedValues, option.value]);
              } else {
                onChange(selectedValues.filter(v => v !== option.value));
              }
            }}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
          {option.count && (
            <span className="ml-auto text-xs text-gray-500">({option.count})</span>
          )}
        </label>
      ))}
    </div>
  );
};

const BadgeComponent = ({ badges }) => {
  const badgeConfig = {
    self_verified: { color: 'bg-gray-100 text-gray-800', label: 'Self' },
    institution_verified: { color: 'bg-blue-100 text-blue-800', label: 'Institution' },
    external_audited: { color: 'bg-yellow-100 text-yellow-800 border border-yellow-300', label: 'External' }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge, index) => {
        const config = badgeConfig[badge] || { color: 'bg-gray-100 text-gray-800', label: badge };
        return (
          <span
            key={index}
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}
          >
            {config.label}
          </span>
        );
      })}
    </div>
  );
};

const CandidateCard = ({ candidate, onViewProfile }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{candidate.name}</h3>
          <p className="text-sm text-gray-500">{candidate.dept}</p>
          <p className="text-xs text-gray-400">{candidate.college} • {candidate.location}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center mb-1">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700 ml-1">{candidate.ai_score_overall}</span>
          </div>
          <BadgeComponent badges={candidate.badges} />
        </div>
      </div>

      {/* Skills */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {candidate.skills.slice(0, 5).map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
            >
              {skill}
            </span>
          ))}
          {candidate.skills.length > 5 && (
            <span className="text-xs text-gray-500">+{candidate.skills.length - 5} more</span>
          )}
        </div>
      </div>

      {/* Evidence snippets */}
      <div className="mb-4 space-y-1">
        {candidate.hackathon && (
          <p className="text-xs text-gray-600">
            🏆 Rank #{candidate.hackathon.rank} in {candidate.hackathon.event_id}
          </p>
        )}
        {candidate.internship && (
          <p className="text-xs text-gray-600">
            💼 {candidate.internship.org} ({candidate.internship.rating}⭐)
          </p>
        )}
        {candidate.projects && candidate.projects.length > 0 && (
          <p className="text-xs text-gray-600">
            🔬 {candidate.projects[0].title}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Updated {new Date(candidate.last_updated).toLocaleDateString()}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewProfile(candidate)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            Preview
          </button>
          <button className="inline-flex items-center px-2 py-1 border border-primary-300 rounded text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100">
            <BookmarkIcon className="h-3 w-3 mr-1" />
            Shortlist
          </button>
        </div>
      </div>
    </div>
  );
};

const TalentPool = ({ onViewProfile }) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    skills: [],
    courses: [],
    badges: [],
    locations: [],
    years: []
  });

  const skillOptions = [
    { value: 'python', label: 'Python', count: 45 },
    { value: 'react', label: 'React', count: 32 },
    { value: 'haccp', label: 'HACCP', count: 28 },
    { value: 'excel', label: 'MS Excel', count: 67 },
    { value: 'autocad', label: 'AutoCAD', count: 23 }
  ];

  const courseOptions = [
    { value: 'gmp', label: 'GMP', count: 89 },
    { value: 'fsqm', label: 'FSQM', count: 76 },
    { value: 'mc', label: 'MC', count: 45 }
  ];

  const badgeOptions = [
    { value: 'external_audited', label: 'External Audited', count: 12 },
    { value: 'institution_verified', label: 'Institution Verified', count: 156 },
    { value: 'self_verified', label: 'Self Verified', count: 234 }
  ];

  const locationOptions = [
    { value: 'chennai', label: 'Chennai', count: 89 },
    { value: 'coimbatore', label: 'Coimbatore', count: 67 },
    { value: 'bangalore', label: 'Bangalore', count: 45 }
  ];

  const yearOptions = [
    { value: 'final', label: 'Final Year', count: 123 },
    { value: 'pre-final', label: 'Pre-Final Year', count: 89 },
    { value: 'third', label: 'Third Year', count: 67 }
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">Talent Pool</h1>
          <span className="ml-2 text-sm text-gray-500">({candidates.length} candidates)</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'grid'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'table'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-gray-900">Filters</h2>
                <button className="text-sm text-primary-600 hover:text-primary-700">
                  Clear all
                </button>
              </div>

              <div className="space-y-0">
                <FilterSection title="Skills" defaultOpen>
                  <CheckboxGroup
                    options={skillOptions}
                    selectedValues={filters.skills}
                    onChange={(values) => setFilters({...filters, skills: values})}
                  />
                </FilterSection>

                <FilterSection title="Course/Track">
                  <CheckboxGroup
                    options={courseOptions}
                    selectedValues={filters.courses}
                    onChange={(values) => setFilters({...filters, courses: values})}
                  />
                </FilterSection>

                <FilterSection title="Verification Badge">
                  <CheckboxGroup
                    options={badgeOptions}
                    selectedValues={filters.badges}
                    onChange={(values) => setFilters({...filters, badges: values})}
                  />
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-yellow-800">
                        Only External-audited (Premium)
                      </span>
                    </label>
                  </div>
                </FilterSection>

                <FilterSection title="Location">
                  <CheckboxGroup
                    options={locationOptions}
                    selectedValues={filters.locations}
                    onChange={(values) => setFilters({...filters, locations: values})}
                  />
                </FilterSection>

                <FilterSection title="Academic Year">
                  <CheckboxGroup
                    options={yearOptions}
                    selectedValues={filters.years}
                    onChange={(values) => setFilters({...filters, years: values})}
                  />
                </FilterSection>

                <FilterSection title="AI Score Range">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Overall Score</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>
                </FilterSection>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Results header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{candidates.length}</span> results
              </p>
              <select className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white">
                <option>Sort by: Relevance</option>
                <option>Sort by: AI Score</option>
                <option>Sort by: Last Updated</option>
                <option>Sort by: Name</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onViewProfile={onViewProfile}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skills
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {candidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {candidate.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {candidate.dept}
                              </div>
                              <BadgeComponent badges={candidate.badges} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 3 && (
                              <span className="text-xs text-gray-500">+{candidate.skills.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {candidate.ai_score_overall}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {candidate.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => onViewProfile(candidate)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              Shortlist
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalentPool;