import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('DigitalPortfolioPage');

import {
  FolderIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  StarIcon,
  FunnelIcon,
  ChevronDownIcon,
  TableCellsIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLearners } from '@/entities/learner';
import { useEducatorSchool } from '@/features/educator/model/useEducatorSchool';

import { SearchBar } from '@/shared/ui';
import { Pagination } from '@/shared/ui';
import { usePermission } from '@/entities/user/model/usePermissions';

import { useUser, useIsAuthenticated } from '@/shared/model/authStore';
import { useSearch } from '@/shared/model/searchStore';
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

const PortfolioCard = ({ learner, onViewPortfolio, canView, canCreate, canEdit, user }: any) => {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => {
        if (!canView) {
          logger.warn('Action blocked: Card click - no view permission');
          alert('❌ Access Denied: You need VIEW permission to view portfolios');
          return;
        }
        logger.info('Portfolio card clicked', { learnerId: learner.id });
        onViewPortfolio(learner);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">
              {learner.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
              {learner.name}
            </h3>
            <p className="text-sm text-gray-600 truncate">{learner.dept}</p>
            <p className="text-xs text-gray-500 truncate">{learner.college}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1 ml-3">
          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
            <StarIcon className="h-3.5 w-3.5 text-yellow-400 fill-current mr-1" />
            <span className="text-xs font-medium text-yellow-700">{learner.ai_score_overall || 'N/A'}</span>
          </div>
          <BadgeComponent badges={learner.badges || []} />
        </div>
      </div>

      {/* Portfolio Preview */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center space-x-2 mb-3">
          <FolderIcon className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Portfolio Highlights</span>
        </div>
        <div className="space-y-2">
          {learner.skills && learner.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {learner.skills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {typeof skill === 'string' ? skill : skill?.name}
                </span>
              ))}
              {learner.skills.length > 4 && (
                <span className="text-xs text-gray-500 self-center">+{learner.skills.length - 4} more</span>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            {learner.projects && learner.projects.length > 0 && (
              <div className="flex items-center space-x-1">
                <span className="font-medium">📁 Projects:</span>
                <span>{learner.projects.length}</span>
              </div>
            )}
            {learner.hackathon && (
              <div className="flex items-center space-x-1">
                <span className="font-medium">🏆 Hackathons:</span>
                <span>{learner.hackathon.rank ? `#${learner.hackathon.rank}` : '✓'}</span>
              </div>
            )}
            {learner.internship && (
              <div className="flex items-center space-x-1 col-span-2 truncate">
                <span className="font-medium">💼 Internship:</span>
                <span className="truncate">{learner.internship.org}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with View Button */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Updated {new Date(learner.last_updated).toLocaleDateString()}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!canView) {
              logger.warn('Action blocked: View portfolio button - no view permission');
              alert('❌ Access Denied: You need VIEW permission to view portfolios');
              return;
            }
            logger.info('View portfolio button clicked', { learnerId: learner.id });
            onViewPortfolio(learner);
          }}
          disabled={!canView.allowed}
          className={`inline-flex items-center px-3 py-1.5 border rounded-md transition-colors text-xs font-medium ${
            canView.allowed
              ? 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 cursor-pointer'
              : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50 blur-sm'
          }`}
          title={canView.allowed ? 'View Portfolio' : '❌ No VIEW permission'}
        >
          <EyeIcon className="h-3.5 w-3.5 mr-1.5" />
          View Portfolio
        </button>
      </div>
    </div>
  );
};

const DigitalPortfolioPage = () => {
  const navigate = useNavigate()
  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const { searchQuery, setSearchQuery } = useSearch()
  
  // Permission controls for Digital Portfolio module - same pattern as Program Sections
  const canView = usePermission("Digital Portfolio", "view")
  const canCreate = usePermission("Digital Portfolio", "create")
  const canEdit = usePermission("Digital Portfolio", "edit")
  
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    skills: [],
    departments: [],
    badges: [],
    locations: [],
    minScore: 0,
    maxScore: 100
  });

  // Get educator's school/college information
  const { school: educatorSchool, college: educatorCollege, educatorType, educatorRole, assignedClassIds, loading: schoolLoading } = useEducatorSchool();

  // Fetch learners filtered by educator's assigned classes or institution
  const { learners, loading, error } = useLearners({ 
    schoolId: educatorSchool?.id,
    collegeId: educatorCollege?.id,
    classIds: educatorType === 'school' && educatorRole !== 'admin' ? assignedClassIds : undefined
  });

  // Security check - same as Program Sections
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login')
      return
    }
    
    if (user?.role !== 'educator' && user?.role !== 'college_educator') {
      logger.error('Unauthorized access attempt to digital portfolio page')
      navigate('/auth/login')
      return
    }
  }, [isAuthenticated, user, navigate])

  // Permission check - redirect if no view permission - same as Program Sections
  useEffect(() => {
    if (!canView) {
      logger.warn('Access denied: No view permission for Digital Portfolio')
      navigate('/educator/dashboard')
      return
    }
  }, [canView, navigate])

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  // Generate filter options from data
  const skillOptions = React.useMemo(() => {
    const skillCounts = {};
    learners.forEach(learner => {
      if (learner.skills && Array.isArray(learner.skills)) {
        learner.skills.forEach(skill => {
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
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [learners]);

  const departmentOptions = React.useMemo(() => {
    if (educatorType === 'school') {
      // For school educators, show branch/subject options
      const branchCounts = {};
      learners.forEach(learner => {
        const branch = learner.branch_field || learner.course_name;
        if (branch) {
          const normalized = branch.toLowerCase();
          branchCounts[normalized] = (branchCounts[normalized] || 0) + 1;
        }
      });
      return Object.entries(branchCounts)
        .map(([branch, count]) => ({
          value: branch,
          label: branch,
          count
        }))
        .sort((a, b) => b.count - a.count);
    } else {
      // For college educators, show department/course options
      const deptCounts = {};
      learners.forEach(learner => {
        if (learner.dept) {
          const normalized = learner.dept.toLowerCase();
          deptCounts[normalized] = (deptCounts[normalized] || 0) + 1;
        }
      });
      return Object.entries(deptCounts)
        .map(([dept, count]) => ({
          value: dept,
          label: dept,
          count
        }))
        .sort((a, b) => b.count - a.count);
    }
  }, [learners, educatorType]);

  const badgeOptions = React.useMemo(() => {
    const badgeCounts = {};
    learners.forEach(learner => {
      if (learner.badges && Array.isArray(learner.badges)) {
        learner.badges.forEach(badge => {
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
      .sort((a, b) => b.count - a.count);
  }, [learners]);

  const locationOptions = React.useMemo(() => {
    const locationCounts = {};
    learners.forEach(learner => {
      if (learner.location) {
        const normalized = learner.location.toLowerCase();
        locationCounts[normalized] = (locationCounts[normalized] || 0) + 1;
      }
    });
    return Object.entries(locationCounts)
      .map(([location, count]) => ({
        value: location,
        label: location.charAt(0).toUpperCase() + location.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [learners]);

  // Apply filters and sorting
  const filteredlearners = React.useMemo(() => {
    let result = learners;

    // Apply filters
    if (filters.skills.length > 0) {
      result = result.filter(learner =>
        learner.skills?.some((skill: any) => {
          const skillName = typeof skill === 'string' ? skill : skill?.name;
          return skillName && filters.skills.includes(skillName.toLowerCase());
        })
      );
    }

    if (filters.departments.length > 0) {
      result = result.filter(learner => {
        if (educatorType === 'school') {
          // For school learners, check branch_field or course_name
          const branch = (learner.branch_field || learner.course_name)?.toLowerCase();
          return branch && filters.departments.includes(branch);
        } else {
          // For college learners, check dept
          return learner.dept && filters.departments.includes(learner.dept.toLowerCase());
        }
      });
    }

    if (filters.badges.length > 0) {
      result = result.filter(learner =>
        learner.badges?.some(badge => filters.badges.includes(badge))
      );
    }

    if (filters.locations.length > 0) {
      result = result.filter(learner =>
        learner.location && filters.locations.includes(learner.location.toLowerCase())
      );
    }

    // Apply AI score filter
    result = result.filter(learner => {
      const score = learner.ai_score_overall || 0;
      return score >= filters.minScore && score <= filters.maxScore;
    });

    // Apply sorting
    const sorted = [...result];
    switch (sortBy) {
      case 'ai_score':
        sorted.sort((a, b) => (b.ai_score_overall || 0) - (a.ai_score_overall || 0));
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
  }, [learners, filters, sortBy]);

  const totalPages = Math.ceil(filteredlearners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedlearners = filteredlearners.slice(startIndex, endIndex);

  const handleViewPortfolio = (learner: any) => {
    if (!canView) {
      logger.warn('Action blocked: View portfolio - no view permission');
      alert('❌ Access Denied: You need VIEW permission to view portfolios');
      return;
    }
    
    logger.info('View portfolio clicked', { learnerId: learner.id });
    navigate('/digital-pp/homepage', { state: { candidate: learner } });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setFilters({
      skills: [],
      departments: [],
      badges: [],
      locations: [],
      minScore: 0,
      maxScore: 100
    });
  };

  const activeFilterCount = filters.skills.length + filters.departments.length + 
    filters.badges.length + filters.locations.length;

  const isLoading = loading || schoolLoading
  const isEmpty = !isLoading && paginatedlearners.length === 0 && !error && !searchQuery

  // Show access denied if no view permission - same as Program Sections
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XMarkIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to view the Digital Portfolio module.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/educator/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex overflow-y-auto mb-4 flex-col h-screen">
      {/* Permission Debug Panel - Only in development - same as Program Sections */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                📁 Educator Permission Debug - Digital Portfolio
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p><strong>User Role:</strong> {user?.role}</p>
                <p><strong>Module:</strong> Digital Portfolio</p>
                <div className="flex gap-4 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    canView ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    View: {canView ? '✅' : '❌'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    canCreate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    Create: {canCreate ? '✅' : '❌'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    canEdit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    Edit: {canEdit ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}
      {/* Header Section - Desktop */}
      <div className="p-4 sm:p-6 lg:p-8 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Digital Portfolio</h1>
          <p className="text-base md:text-lg mt-2 text-gray-600">Explore the best talent in your network through digital portfolios</p>
        </div>
        
      </div>
      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Digital Portfolios</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({filteredlearners.length} {searchQuery || activeFilterCount > 0 ? 'matching' : ''} portfolios)
            </span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, skills, projects, department..."
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
            {filteredlearners.length} {searchQuery || activeFilterCount > 0 ? 'matching' : ''} portfolios
          </span>
        </div>

        <div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
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
                    onChange={(values) => setFilters({ ...filters, skills: values })}
                  />
                </FilterSection>

                <FilterSection title={educatorType === 'school' ? 'Subject/Branch' : 'Department'}>
                  <CheckboxGroup
                    options={departmentOptions}
                    selectedValues={filters.departments}
                    onChange={(values) => setFilters({ ...filters, departments: values })}
                  />
                </FilterSection>

                <FilterSection title="Verification Badge">
                  <CheckboxGroup
                    options={badgeOptions}
                    selectedValues={filters.badges}
                    onChange={(values) => setFilters({ ...filters, badges: values })}
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
                    onChange={(values) => setFilters({ ...filters, locations: values })}
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
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, filteredlearners.length)}</span> of{' '}
                <span className="font-medium">{filteredlearners.length}</span> result{filteredlearners.length !== 1 ? 's' : ''}
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
            {(loading || schoolLoading) ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error loading portfolios: {typeof error === 'string' ? error : 'Failed to load portfolios'}</p>
              </div>
            ) : paginatedlearners.length === 0 ? (
              <div className="text-center py-12">
                <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolios found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || activeFilterCount > 0
                    ? 'No portfolios match your current filters'
                    : educatorSchool 
                      ? `No learner portfolios available in ${educatorSchool.name}`
                      : educatorCollege
                        ? `No learner portfolios available in ${educatorCollege.name}`
                        : 'No learner portfolios available'}
                </p>
                {(educatorSchool || educatorCollege) && (
                  <p className="text-xs text-gray-400 mb-4">
                    Portfolios are filtered by your assigned {educatorType === 'school' ? 'school' : 'college'}.
                  </p>
                )}
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
                  <div className={`grid grid-cols-1 gap-4 ${
                    showFilters 
                      ? 'md:grid-cols-1 lg:grid-cols-2' // 2 columns when filters are open
                      : 'md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' // 3 columns when filters are closed
                  }`}>
                    {paginatedlearners.map((learner) => (
                      <PortfolioCard
                        key={learner.id}
                        learner={learner}
                        onViewPortfolio={handleViewPortfolio}
                        canView={canView}
                        canCreate={canCreate}
                        canEdit={canEdit}
                        user={user}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Learner
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
                        {paginatedlearners.map((learner) => (
                          <tr key={learner.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-semibold text-sm">
                                    {learner.name?.charAt(0)?.toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {learner.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {learner.dept}
                                  </div>
                                  <BadgeComponent badges={learner.badges || []} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {learner.skills?.slice(0, 3).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {typeof skill === 'string' ? skill : skill?.name || skill?.skill_name || ''}
                                  </span>
                                ))}
                                {learner.skills && learner.skills.length > 3 && (
                                  <span className="text-xs text-gray-500">+{learner.skills.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                <span className="text-sm font-medium text-gray-900">
                                  {learner.ai_score_overall || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {learner.location}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  if (!canView) {
                                    logger.warn('Action blocked: View portfolio (table) - no view permission');
                                    alert('❌ Access Denied: You need VIEW permission to view portfolios');
                                    return;
                                  }
                                  logger.info('View portfolio clicked (table)', { learnerId: learner.id });
                                  handleViewPortfolio(learner);
                                }}
                                disabled={!canView.allowed}
                                className={`transition-all ${
                                  canView.allowed
                                    ? 'text-primary-600 hover:text-primary-900 cursor-pointer'
                                    : 'text-gray-400 cursor-not-allowed opacity-50 blur-sm'
                                }`}
                                title={canView.allowed ? 'View Portfolio' : '❌ No VIEW permission'}
                              >
                                View Portfolio
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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredlearners.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalPortfolioPage;