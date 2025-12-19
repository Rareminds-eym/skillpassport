import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderIcon,
  EyeIcon,
  Squares2X2Icon,
  StarIcon,
  FunnelIcon,
  ChevronDownIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { useStudents } from '../../../hooks/useAdminStudents';
import SearchBar from '../../../components/common/SearchBar';
import Pagination from '../../../components/admin/Pagination';

const FilterSection = ({ title, children, defaultOpen = false }: any) => {
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

const CheckboxGroup = ({ options, selectedValues, onChange }: any) => {
  return (
    <div className="space-y-2">
      {options.map((option: any) => (
        <label key={option.value} className="flex items-center">
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selectedValues, option.value]);
              } else {
                onChange(selectedValues.filter((v: any) => v !== option.value));
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

const BadgeComponent = ({ badges }: { badges: any[] }) => {
  const badgeConfig: any = {
    self_verified: { color: 'bg-gray-100 text-gray-800', label: 'Self' },
    institution_verified: { color: 'bg-blue-100 text-blue-800', label: 'Institution' },
    external_audited: { color: 'bg-yellow-100 text-yellow-800 border border-yellow-300', label: 'External' }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge: any, index: number) => {
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

const PortfolioCard = ({ student, onViewPortfolio }: any) => {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onViewPortfolio(student)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">
              {student.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
              {student.name}
            </h3>
            <p className="text-sm text-gray-600 truncate">{student.dept || student.class}</p>
            <p className="text-xs text-gray-500 truncate">{student.college || student.school}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1 ml-3">
          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
            <StarIcon className="h-3.5 w-3.5 text-yellow-400 fill-current mr-1" />
            <span className="text-xs font-medium text-yellow-700">{student.ai_score_overall || student.score || 'N/A'}</span>
          </div>
          <BadgeComponent badges={student.badges || []} />
        </div>
      </div>

      {/* Portfolio Preview */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center space-x-2 mb-3">
          <FolderIcon className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Portfolio Highlights</span>
        </div>
        <div className="space-y-2">
          {student.skills && student.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {student.skills.slice(0, 4).map((skill: any, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {typeof skill === 'string' ? skill : skill?.name}
                </span>
              ))}
              {student.skills.length > 4 && (
                <span className="text-xs text-gray-500 self-center">+{student.skills.length - 4} more</span>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            {student.projects && student.projects.length > 0 && (
              <div className="flex items-center space-x-1">
                <span className="font-medium">📁 Projects:</span>
                <span>{student.projects.length}</span>
              </div>
            )}
            {student.hackathon && (
              <div className="flex items-center space-x-1">
                <span className="font-medium">🏆 Hackathons:</span>
                <span>{student.hackathon.rank ? `#${student.hackathon.rank}` : '✓'}</span>
              </div>
            )}
            {student.internship && (
              <div className="flex items-center space-x-1 col-span-2 truncate">
                <span className="font-medium">💼 Internship:</span>
                <span className="truncate">{student.internship.org}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with View Button */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Updated {new Date(student.last_updated || Date.now()).toLocaleDateString()}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewPortfolio(student);
          }}
          className="inline-flex items-center px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors text-xs font-medium"
        >
          <EyeIcon className="h-3.5 w-3.5 mr-1.5" />
          View Portfolio
        </button>
      </div>
    </div>
  );
};

const DigitalPortfolioPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    skills: [],
    classes: [],
    badges: [],
    locations: [],
    minScore: 0,
    maxScore: 100
  });

  // Fetch students from school admin hook with search and pagination
  const { students, loading, error, totalCount } = useStudents({
    searchTerm: debouncedSearch,
    page: currentPage,
    pageSize: itemsPerPage
  });

  // Fetch all students for filter options (lightweight query - only needed fields)
  const { students: allStudentsForFilters } = useStudents({
    searchTerm: '', // No search filter for getting all filter options
    page: 1,
    pageSize: 1000 // Get more students for accurate filter counts
  });

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters, sortBy]);

  // Generate filter options from ALL students data
  const skillOptions = useMemo(() => {
    const skillCounts: any = {};
    allStudentsForFilters.forEach(student => {
      if (student.skills && Array.isArray(student.skills)) {
        student.skills.forEach((skill: any) => {
          const skillName = typeof skill === 'string' ? skill : skill?.name;
          if (skillName) {
            const normalized = skillName.toLowerCase();
            skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(skillCounts)
      .map(([skill, count]) => ({
        value: skill,
        label: skill.charAt(0).toUpperCase() + skill.slice(1),
        count
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 15);
  }, [allStudentsForFilters]);

  const classOptions = useMemo(() => {
    const classCounts: any = {};
    allStudentsForFilters.forEach(student => {
      if (student.class) {
        const normalized = student.class.toLowerCase();
        classCounts[normalized] = (classCounts[normalized] || 0) + 1;
      }
    });
    return Object.entries(classCounts)
      .map(([cls, count]) => ({
        value: cls,
        label: cls,
        count
      }))
      .sort((a: any, b: any) => b.count - a.count);
  }, [allStudentsForFilters]);

  const badgeOptions = useMemo(() => {
    const badgeCounts: any = {};
    allStudentsForFilters.forEach(student => {
      if (student.badges && Array.isArray(student.badges)) {
        student.badges.forEach((badge: any) => {
          badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
        });
      }
    });
    return Object.entries(badgeCounts)
      .map(([badge, count]) => ({
        value: badge,
        label: badge.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        count
      }))
      .sort((a: any, b: any) => b.count - a.count);
  }, [allStudentsForFilters]);

  const locationOptions = useMemo(() => {
    const locationCounts: any = {};
    allStudentsForFilters.forEach(student => {
      if (student.location) {
        const normalized = student.location.toLowerCase();
        locationCounts[normalized] = (locationCounts[normalized] || 0) + 1;
      }
    });
    return Object.entries(locationCounts)
      .map(([location, count]) => ({
        value: location,
        label: location.charAt(0).toUpperCase() + location.slice(1),
        count
      }))
      .sort((a: any, b: any) => b.count - a.count);
  }, [allStudentsForFilters]);

  // Check if any filters are active
  const hasActiveFilters = filters.classes.length > 0 || 
                          filters.skills.length > 0 || 
                          filters.badges.length > 0 || 
                          filters.locations.length > 0 ||
                          filters.minScore > 0 ||
                          filters.maxScore < 100;

  // Apply filters and sorting
  const filteredStudents = useMemo(() => {
    // When filters are active, use ALL students; otherwise use paginated students
    const sourceData = hasActiveFilters ? allStudentsForFilters : students;
    let result = sourceData;

    // Apply search filter if not already applied at DB level
    if (hasActiveFilters && debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(student => 
        student.name?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.class?.toLowerCase().includes(searchLower) ||
        student.skills?.some((skill: any) => {
          const skillName = typeof skill === 'string' ? skill : skill?.name;
          return skillName?.toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply filters
    if (filters.skills.length > 0) {
      result = result.filter(student =>
        student.skills?.some((skill: any) => {
          const skillName = typeof skill === 'string' ? skill : skill?.name;
          return skillName && (filters.skills as any).includes(skillName.toLowerCase());
        })
      );
    }

    if (filters.classes.length > 0) {
      result = result.filter(student =>
        student.class && (filters.classes as any).includes(student.class.toLowerCase())
      );
    }

    if (filters.badges.length > 0) {
      result = result.filter(student =>
        student.badges?.some((badge: any) => (filters.badges as any).includes(badge))
      );
    }

    if (filters.locations.length > 0) {
      result = result.filter(student =>
        student.location && (filters.locations as any).includes(student.location.toLowerCase())
      );
    }

    // Apply AI score filter
    result = result.filter(student => {
      const score = student.ai_score_overall || student.score || 0;
      return score >= filters.minScore && score <= filters.maxScore;
    });

    // Apply sorting
    const sorted = [...result];
    switch (sortBy) {
      case 'ai_score':
        sorted.sort((a, b) => (b.ai_score_overall || b.score || 0) - (a.ai_score_overall || a.score || 0));
        break;
      case 'name':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'last_updated':
        sorted.sort((a, b) =>
          new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime()
        );
        break;
      default:
        break;
    }

    return sorted;
  }, [students, allStudentsForFilters, filters, sortBy, hasActiveFilters, debouncedSearch]);
  
  const totalItems = hasActiveFilters ? filteredStudents.length : (totalCount || 0);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  // If filters are active, paginate client-side; otherwise use DB-paginated data
  const paginatedStudents = hasActiveFilters 
    ? filteredStudents.slice(startIndex, endIndex)
    : filteredStudents;

  const handleViewPortfolio = (student: any) => {
    navigate('/digital-pp/homepage', { state: { candidate: student } });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setFilters({
      skills: [],
      classes: [],
      badges: [],
      locations: [],
      minScore: 0,
      maxScore: 100
    });
  };

  const activeFilterCount = filters.skills.length + filters.classes.length + 
    filters.badges.length + filters.locations.length;

  return (
    <div className="flex flex-col h-screen">
      {/* Header Section - Desktop */}
      <div className="p-4 sm:p-6 lg:p-8 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Digital Portfolio</h1>
          <p className="text-base md:text-lg mt-2 text-gray-600">Explore student portfolios and achievements</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Digital Portfolios</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({filteredStudents.length} {searchQuery || activeFilterCount > 0 ? 'matching' : ''} portfolios)
            </span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onDebouncedChange={setDebouncedSearch}
              debounceMs={500}
              placeholder="Search by name, skills, projects, class..."
              size="md"
            />
          </div>
        </div>

        <div className="w-80 flex-shrink-0 pl-4 flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {activeFilterCount}
              </span>
            )}
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

      {/* Header Section - Mobile/Tablet */}
      <div className="lg:hidden p-4 bg-white border-b border-gray-200 space-y-4">
        <div className="text-left">
          <h1 className="text-xl font-semibold text-gray-900">Digital Portfolios</h1>
          <span className="text-sm text-gray-500">
            {filteredStudents.length} {searchQuery || activeFilterCount > 0 ? 'matching' : ''} portfolios
          </span>
        </div>

        <div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onDebouncedChange={setDebouncedSearch}
            debounceMs={500}
            placeholder="Search portfolios..."
            size="md"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {activeFilterCount}
              </span>
            )}
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
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-0">
                <FilterSection title="Skills" defaultOpen>
                  <CheckboxGroup
                    options={skillOptions}
                    selectedValues={filters.skills}
                    onChange={(values: any) => setFilters({ ...filters, skills: values })}
                  />
                </FilterSection>

                <FilterSection title="Class">
                  <CheckboxGroup
                    options={classOptions}
                    selectedValues={filters.classes}
                    onChange={(values: any) => setFilters({ ...filters, classes: values })}
                  />
                </FilterSection>

                <FilterSection title="Verification Badge">
                  <CheckboxGroup
                    options={badgeOptions}
                    selectedValues={filters.badges}
                    onChange={(values: any) => setFilters({ ...filters, badges: values })}
                  />
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800">
                      <strong>Institution:</strong> Verified by institution<br />
                      <strong>External:</strong> Third-party audited
                    </p>
                  </div>
                </FilterSection>

                <FilterSection title="Location">
                  <CheckboxGroup
                    options={locationOptions}
                    selectedValues={filters.locations}
                    onChange={(values: any) => setFilters({ ...filters, locations: values })}
                  />
                </FilterSection>

                <FilterSection title="AI Score Range">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Min Score: {filters.minScore}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.minScore}
                        onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
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
          <div className="px-4 sm:px-6 lg:px-8 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
                <span className="font-medium">{endIndex}</span> of{' '}
                <span className="font-medium">{totalItems}</span> result{totalItems !== 1 ? 's' : ''}
                {searchQuery && <span className="text-gray-500"> for "{searchQuery}"</span>}
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="ai_score">Sort by: AI Score</option>
                <option value="last_updated">Sort by: Last Updated</option>
                <option value="name">Sort by: Name</option>
              </select>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error loading portfolios: {error}</p>
              </div>
            ) : paginatedStudents.length === 0 ? (
              <div className="text-center py-12">
                <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolios found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || activeFilterCount > 0
                    ? 'No portfolios match your current filters'
                    : 'No student portfolios available'}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Skeleton Loading - Grid View */}
                    {loading && (
                      <>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                          <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-lg p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3 mb-4">
                              <div className="h-4 bg-gray-200 rounded w-full"></div>
                              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                            <div className="flex gap-2 mb-3">
                              <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                          </div>
                        ))}
                      </>
                    )}
                    
                    {!loading && paginatedStudents.map((student) => (
                      <PortfolioCard
                        key={student.id}
                        student={student}
                        onViewPortfolio={handleViewPortfolio}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Skills
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            AI Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Class
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-semibold text-sm">
                                    {student.name?.charAt(0)?.toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {student.class || student.dept}
                                  </div>
                                  <BadgeComponent badges={student.badges || []} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {student.skills?.slice(0, 3).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {typeof skill === 'string' ? skill : skill?.name}
                                  </span>
                                ))}
                                {student.skills && student.skills.length > 3 && (
                                  <span className="text-xs text-gray-500">+{student.skills.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                <span className="text-sm font-medium text-gray-900">
                                  {student.ai_score_overall || student.score || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{student.class || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleViewPortfolio(student)}
                                className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-200 bg-white">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={filteredStudents.length}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalPortfolioPage;
