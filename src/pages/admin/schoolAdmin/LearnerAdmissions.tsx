import React, { useState, useEffect, useMemo } from 'react';
import {
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  EyeIcon,
  ChevronDownIcon,
  StarIcon,
  XMarkIcon,
  PencilSquareIcon,
  EnvelopeIcon,
  PhoneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { UserPlusIcon } from 'lucide-react';
import { SearchBar } from '@/shared/ui';
import { Pagination } from '@/shared/ui';
import { LearnerProfileDrawer, SchoolAdmissionNoteModal } from '@/features/learner-profile';
import { AddLearnerModal } from '@/features/college-admin';
import { useLearners } from '@/entities/learner/model/useAdminLearners';
import { AssessmentReportDrawer } from '@/features/assessment';
// @ts-ignore - JS file without types
import { getLatestResult } from '@/features/assessment';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('school-admin-learner-admissions');


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

const StatusBadgeComponent = ({ status }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    waitlisted: { color: 'bg-blue-100 text-blue-800', label: 'Waitlisted' }
  };

  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const LearnerCard = ({ learner, onViewProfile, onAddNote, onViewCareerPath, loadingAssessmentForLearner }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{learner.name}</h3>
          <p className="text-sm text-gray-500">{learner.email}</p>
          <p className="text-xs text-gray-400">{learner.profile?.contact_number || learner.phone || '0'}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center mb-1">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700 ml-1">{learner.profile?.education?.[0]?.cgpa || '0'}</span>
          </div>
          <StatusBadgeComponent status={learner.admission_status || 'pending'} />
        </div>
      </div>

      <div className="mb-3">
      </div>

      <div className="mb-4 space-y-1">
        {(learner.college || learner.profile?.university) && (
          <p className="text-xs text-gray-600">
            📚 {learner.college || learner.profile?.university}
          </p>
        )}
        {learner.profile?.education?.[0]?.degree && (
          <p className="text-xs text-gray-600">
            🎓 {learner.profile.education[0].degree}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {learner.profile?.education?.[0]?.level || 'N/A'}
        </span>
        <div className="flex space-x-1 flex-wrap gap-1">
          <button
            onClick={() => onViewProfile(learner)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            View
          </button>
          <button
            onClick={() => onViewCareerPath(learner)}
            className="inline-flex items-center px-2 py-1 border border-yellow-300 rounded text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="View Assessment Report"
            disabled={loadingAssessmentForLearner === learner.id}
          >
            <SparklesIcon className="h-3 w-3 mr-1" />
            {loadingAssessmentForLearner === learner.id ? 'Loading...' : 'Career'}
          </button>
          <button
            onClick={() => onAddNote(learner)}
            className="inline-flex items-center px-2 py-1 border border-primary-300 rounded text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
          >
            <PencilSquareIcon className="h-3 w-3 mr-1" />
            Note
          </button>
        </div>
      </div>
    </div>
  );
};

const LearnerAdmissions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showAssessmentReport, setShowAssessmentReport] = useState(false);
  const [learnerForReport, setlearnerForReport] = useState<any>(null);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [loadingAssessmentForLearner, setLoadingAssessmentForLearner] = useState<string | null>(null);
  const [showAddlearnerModal, setShowAddlearnerModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [learnerForNote, setlearnerForNote] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [filters, setFilters] = useState({
    class: [],
    subjects: [],
    status: [],
    minScore: 0,
    maxScore: 100
  });

  const { learners, loading, error, totalCount } = useLearners({
    searchTerm: debouncedSearch,
    page: currentPage,
    pageSize: itemsPerPage
  });

  // Fetch all learners for filter options (lightweight query - only needed fields)
  const { learners: alllearnersForFilters } = useLearners({
    searchTerm: '', // No search filter for getting all filter options
    page: 1,
    pageSize: 1000 // Get more learners for accurate filter counts
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters, sortBy]);

  const classOptions = useMemo(() => {
    const classCounts: any = {};
    alllearnersForFilters.forEach(learner => {
      if (learner.class && !learner.universityId) { // Only school learners
        const normalizedClass = learner.class.toLowerCase();
        classCounts[normalizedClass] = (classCounts[normalizedClass] || 0) + 1;
      }
    });
    return Object.entries(classCounts)
      .map(([klass, count]) => ({
        value: klass,
        label: klass.charAt(0).toUpperCase() + klass.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [alllearnersForFilters]);

  const subjectOptions = useMemo(() => {
    const subjectCounts: any = {};
    alllearnersForFilters.forEach(learner => {
      if (!learner.universityId && learner.subjects && Array.isArray(learner.subjects)) {
        learner.subjects.forEach(subject => {
          const normalizedSubject = subject.toLowerCase();
          subjectCounts[normalizedSubject] = (subjectCounts[normalizedSubject] || 0) + 1;
        });
      }
    });
    return Object.entries(subjectCounts)
      .map(([subject, count]) => ({
        value: subject,
        label: subject.charAt(0).toUpperCase() + subject.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [alllearnersForFilters]);

  const statusOptions = useMemo(() => {
    const statusCounts: any = {};
    alllearnersForFilters.forEach(learner => {
      if (!learner.universityId && learner.admission_status) {
        const status = learner.admission_status.toLowerCase();
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });
    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [alllearnersForFilters]);

  // Check if any filters are active
  const hasActiveFilters = filters.class.length > 0 ||
    filters.subjects.length > 0 ||
    filters.status.length > 0 ||
    filters.minScore > 0 ||
    filters.maxScore < 100;

  const filteredAndSortedlearners = useMemo(() => {
    // When filters are active, use ALL learners; otherwise use paginated learners
    const sourceData = hasActiveFilters ? alllearnersForFilters : learners;

    // Filter learners associated with schools (universityId is null)
    let result = sourceData.filter(learner => !learner.universityId);

    // Apply search filter if not already applied at DB level
    if (hasActiveFilters && debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(learner =>
        learner.name?.toLowerCase().includes(searchLower) ||
        learner.email?.toLowerCase().includes(searchLower) ||
        learner.contact_number?.toLowerCase().includes(searchLower) ||
        learner.grade?.toLowerCase().includes(searchLower) ||
        learner.section?.toLowerCase().includes(searchLower) ||
        learner.roll_number?.toLowerCase().includes(searchLower)
      );
    }

    // Apply client-side filters (these can't be done at DB level easily)
    if (filters.class.length > 0) {
      result = result.filter(learner =>
        learner.class && filters.class.includes(learner.class.toLowerCase())
      );
    }

    if (filters.subjects.length > 0) {
      result = result.filter(learner =>
        learner.subjects?.some((subject: any) =>
          filters.subjects.includes(subject.toLowerCase())
        )
      );
    }

    if (filters.status.length > 0) {
      result = result.filter(learner =>
        learner.admission_status && filters.status.includes(learner.admission_status.toLowerCase())
      );
    }

    result = result.filter(learner => {
      const score = learner.score || 0;
      return score >= filters.minScore && score <= filters.maxScore;
    });

    // Apply sorting
    const sortedResult = [...result];
    switch (sortBy) {
      case 'score':
        sortedResult.sort((a, b) => (b.score || 0) - (a.score || 0));
        break;
      case 'name':
        sortedResult.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'date':
        sortedResult.sort((a, b) =>
          new Date(b.applied_date || 0).getTime() - new Date(a.applied_date || 0).getTime()
        );
        break;
      case 'relevance':
      default:
        break;
    }
    return sortedResult;
  }, [learners, alllearnersForFilters, filters, sortBy, hasActiveFilters, debouncedSearch]);

  const totalItems = hasActiveFilters ? filteredAndSortedlearners.length : (totalCount || 0);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // If filters are active, paginate client-side; otherwise use DB-paginated data
  const paginatedlearners = hasActiveFilters
    ? filteredAndSortedlearners.slice(startIndex, endIndex)
    : filteredAndSortedlearners;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setFilters({
      class: [],
      subjects: [],
      status: [],
      minScore: 0,
      maxScore: 100
    });
  };

  const handleViewProfile = (learner) => {
    setSelectedLearner(learner);
    setShowDrawer(true);
  };

  const handleAddNoteClick = (learner) => {
    setlearnerForNote(learner);
    setShowNoteModal(true);
  };

  // Opens the Assessment Report drawer to show the learner's completed assessment report
  const handleViewCareerPath = async (learner: any) => {
    try {
      setLoadingAssessmentForLearner(learner.id);
      setlearnerForReport(learner);

      // Fetch the learner's latest assessment result
      // Try both learner.id and learner.user_id as getLatestResult can handle both
      let result = null;

      if (learner.user_id) {
        result = await getLatestResult(learner.user_id);
      }

      // If no result found with user_id, try with learner.id
      if (!result && learner.id) {
        result = await getLatestResult(learner.id);
      }

      if (result) {
        logger.info('Found assessment result for learner', { learnerName: learner.name });
        setAssessmentResult(result);
        setShowAssessmentReport(true);
      } else {
        logger.warn('No assessment result found for learner', { learnerName: learner.name });
        // Still show the drawer but with no assessment data - it will show appropriate message
        setAssessmentResult(null);
        setShowAssessmentReport(true);
      }
    } catch (error) {
      logger.error('Error fetching assessment result', error);
      // Still show the drawer but with error state
      setAssessmentResult(null);
      setShowAssessmentReport(true);
    } finally {
      setLoadingAssessmentForLearner(null);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 sm:p-6 lg:p-8 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Learner Admissions</h1>
          <p className="text-base md:text-lg mt-2 text-gray-600">Manage learner applications and admissions.</p>
        </div>
        <button
          onClick={() => setShowAddlearnerModal(true)}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add Learner
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Learners</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({totalItems} {searchQuery || filters.class.length > 0 ? 'matching' : ''} Learners)
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
              placeholder="Search by name, email, class, grade, roll number..."
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
            {(filters.class.length + filters.subjects.length + filters.status.length) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {filters.class.length + filters.subjects.length + filters.status.length}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${viewMode === 'grid'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${viewMode === 'table'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="lg:hidden p-4 bg-white border-b border-gray-200 space-y-4">
        <div className="text-left">
          <h1 className="text-xl font-semibold text-gray-900">Applications</h1>
          <span className="text-sm text-gray-500">
            {totalItems} {searchQuery || filters.class.length > 0 ? 'matching' : ''} applications
          </span>
        </div>

        <div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onDebouncedChange={setDebouncedSearch}
            debounceMs={500}
            placeholder="Search applications..."
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
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${viewMode === 'grid'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${viewMode === 'table'
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
                <FilterSection title="Class" defaultOpen>
                  <CheckboxGroup
                    options={classOptions}
                    selectedValues={filters.class}
                    onChange={(values) => setFilters({ ...filters, class: values })}
                  />
                </FilterSection>

                <FilterSection title="Subjects">
                  <CheckboxGroup
                    options={subjectOptions}
                    selectedValues={filters.subjects}
                    onChange={(values) => setFilters({ ...filters, subjects: values })}
                  />
                </FilterSection>

                <FilterSection title="Admission Status">
                  <CheckboxGroup
                    options={statusOptions}
                    selectedValues={filters.status}
                    onChange={(values) => setFilters({ ...filters, status: values })}
                  />
                </FilterSection>

                <FilterSection title="Score Range">
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
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Max Score: {filters.maxScore}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.maxScore}
                        onChange={(e) => setFilters({ ...filters, maxScore: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </FilterSection>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
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
                <option value="score">Sort by: Score</option>
                <option value="date">Sort by: Date Applied</option>
                <option value="name">Sort by: Name</option>
              </select>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Skeleton Loading - Grid View */}
                {loading && (
                  <>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="h-4 w-12 bg-gray-200 rounded mb-1"></div>
                            <div className="h-6 w-20 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-9 flex-1 bg-gray-200 rounded"></div>
                          <div className="h-9 w-9 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && paginatedlearners.map((learner) => (
                  <LearnerCard
                    key={learner.id}
                    learner={learner}
                    onViewProfile={handleViewProfile}
                    onAddNote={handleAddNoteClick}
                    onViewCareerPath={handleViewCareerPath}
                    loadingAssessmentForLearner={loadingAssessmentForLearner}
                  />
                ))}
                {!loading && paginatedlearners.length === 0 && !error && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-gray-500">
                      {debouncedSearch || filters.class.length > 0
                        ? 'No applications match your current filters'
                        : 'No applications found.'}
                    </p>
                  </div>
                )}
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
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {learner.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {learner.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-800">{learner.class}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {learner.score}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadgeComponent status={learner.admission_status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                          <button
                            onClick={() => handleViewProfile(learner)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleViewCareerPath(learner)}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View Assessment Report"
                            disabled={loadingAssessmentForLearner === learner.id}
                          >
                            {loadingAssessmentForLearner === learner.id ? 'Loading...' : 'Career'}
                          </button>
                          <button
                            onClick={() => handleAddNoteClick(learner)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Note
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* Learner Profile Drawer */}
      <LearnerProfileDrawer
        learner={selectedLearner}
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setSelectedLearner(null);
        }}
        userRole="school_admin"
      />

      {/* Assessment Report Drawer - Shows the learner's completed assessment report */}
      <AssessmentReportDrawer
        learner={learnerForReport ? {
          id: learnerForReport.id,
          user_id: learnerForReport.user_id || learnerForReport.id,
          name: learnerForReport.name || undefined,
          email: learnerForReport.email || undefined,
          college: learnerForReport.college || learnerForReport.college_school_name || undefined,
          college_name: learnerForReport.college || learnerForReport.college_school_name || undefined,
          grade: learnerForReport.grade || learnerForReport.learner_grade || undefined,
          school_name: learnerForReport.school_name || learnerForReport.college_school_name || undefined,
          roll_number: learnerForReport.roll_number || learnerForReport.admission_number || 'N/A',
          learner_grade: learnerForReport.learner_grade || learnerForReport.grade || undefined,
          program_id: learnerForReport.program_id || undefined,
          program_name: learnerForReport.program_name || undefined,
          stream_name: learnerForReport.stream_name || undefined
        } : undefined}
        assessmentResult={assessmentResult}
        isOpen={showAssessmentReport}
        onClose={() => {
          setShowAssessmentReport(false);
          setlearnerForReport(null);
          setAssessmentResult(null);
        }}
      />

      {/* Add Learner Modal */}
      <AddLearnerModal
        isOpen={showAddlearnerModal}
        onClose={() => {
          setShowAddlearnerModal(false);
          // Small delay to let user see the modal close, then refresh
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }}
        onSuccess={() => {
          // Success is handled in the modal
          logger.info('Learner created successfully');
        }}
      />

      {/* School Admission Note Modal - Opens directly when clicking Note button */}
      {learnerForNote && (
        <SchoolAdmissionNoteModal
          isOpen={showNoteModal}
          onClose={() => {
            setShowNoteModal(false);
            setlearnerForNote(null);
          }}
          learner={learnerForNote}
          onSuccess={() => {
            logger.info('Note saved/sent successfully');
          }}
        />
      )}

    </div>
  );
};

export default LearnerAdmissions;