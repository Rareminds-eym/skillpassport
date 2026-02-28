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
import SearchBar from '../../../components/common/SearchBar';
import Pagination from '../../../components/admin/Pagination';
import StudentProfileDrawer from '@/components/shared/StudentProfileDrawer';
import AddStudentModal from '../../../components/educator/modals/Addstudentmodal';
import { SchoolAdmissionNoteModal } from '@/components/shared/StudentProfileDrawer/modals';
import { useStudents } from '../../../hooks/useAdminStudents';
import AssessmentReportDrawer from '@/components/shared/AssessmentReportDrawer';
// @ts-ignore - JS file without types
import { getLatestResult } from '../../../services/assessmentService';


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

const StudentCard = ({ student, onViewProfile, onAddNote, onViewCareerPath, loadingAssessmentForStudent }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{student.name}</h3>
          <p className="text-sm text-gray-500">{student.email}</p>
          <p className="text-xs text-gray-400">{student.profile?.contact_number || student.phone || '0'}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center mb-1">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700 ml-1">{student.profile?.education?.[0]?.cgpa || '0'}</span>
          </div>
          <StatusBadgeComponent status={student.admission_status || 'pending'} />
        </div>
      </div>

      <div className="mb-3">
      </div>

      <div className="mb-4 space-y-1">
        {(student.college || student.profile?.university) && (
          <p className="text-xs text-gray-600">
            📚 {student.college || student.profile?.university}
          </p>
        )}
        {student.profile?.education?.[0]?.degree && (
          <p className="text-xs text-gray-600">
            🎓 {student.profile.education[0].degree}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {student.profile?.education?.[0]?.level || 'N/A'}
        </span>
        <div className="flex space-x-1 flex-wrap gap-1">
          <button
            onClick={() => onViewProfile(student)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            View
          </button>
          <button
            onClick={() => onViewCareerPath(student)}
            className="inline-flex items-center px-2 py-1 border border-yellow-300 rounded text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="View Assessment Report"
            disabled={loadingAssessmentForStudent === student.id}
          >
            <SparklesIcon className="h-3 w-3 mr-1" />
            {loadingAssessmentForStudent === student.id ? 'Loading...' : 'Career'}
          </button>
          <button
            onClick={() => onAddNote(student)}
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

const StudentAdmissions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showAssessmentReport, setShowAssessmentReport] = useState(false);
  const [studentForReport, setStudentForReport] = useState<any>(null);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [loadingAssessmentForStudent, setLoadingAssessmentForStudent] = useState<string | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [studentForNote, setStudentForNote] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [filters, setFilters] = useState({
    class: [],
    subjects: [],
    status: [],
    minScore: 0,
    maxScore: 100
  });

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

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters, sortBy]);

  const classOptions = useMemo(() => {
    const classCounts: any = {};
    allStudentsForFilters.forEach(student => {
      if (student.class && !student.universityId) { // Only school students
        const normalizedClass = student.class.toLowerCase();
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
  }, [allStudentsForFilters]);

  const subjectOptions = useMemo(() => {
    const subjectCounts: any = {};
    allStudentsForFilters.forEach(student => {
      if (!student.universityId && student.subjects && Array.isArray(student.subjects)) {
        student.subjects.forEach(subject => {
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
  }, [allStudentsForFilters]);

  const statusOptions = useMemo(() => {
    const statusCounts: any = {};
    allStudentsForFilters.forEach(student => {
      if (!student.universityId && student.admission_status) {
        const status = student.admission_status.toLowerCase();
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
  }, [allStudentsForFilters]);

  // Check if any filters are active
  const hasActiveFilters = filters.class.length > 0 || 
                          filters.subjects.length > 0 || 
                          filters.status.length > 0 || 
                          filters.minScore > 0 || 
                          filters.maxScore < 100;

  const filteredAndSortedStudents = useMemo(() => {
    // When filters are active, use ALL students; otherwise use paginated students
    const sourceData = hasActiveFilters ? allStudentsForFilters : students;
    
    // Filter students associated with schools (universityId is null)
    let result = sourceData.filter(student => !student.universityId);

    // Apply search filter if not already applied at DB level
    if (hasActiveFilters && debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(student => 
        student.name?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.contact_number?.toLowerCase().includes(searchLower) ||
        student.grade?.toLowerCase().includes(searchLower) ||
        student.section?.toLowerCase().includes(searchLower) ||
        student.roll_number?.toLowerCase().includes(searchLower)
      );
    }

    // Apply client-side filters (these can't be done at DB level easily)
    if (filters.class.length > 0) {
      result = result.filter(student =>
        student.class && filters.class.includes(student.class.toLowerCase())
      );
    }

    if (filters.subjects.length > 0) {
      result = result.filter(student =>
        student.subjects?.some((subject: any) =>
          filters.subjects.includes(subject.toLowerCase())
        )
      );
    }

    if (filters.status.length > 0) {
      result = result.filter(student =>
        student.admission_status && filters.status.includes(student.admission_status.toLowerCase())
      );
    }

    result = result.filter(student => {
      const score = student.score || 0;
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
  }, [students, allStudentsForFilters, filters, sortBy, hasActiveFilters, debouncedSearch]);
  
  const totalItems = hasActiveFilters ? filteredAndSortedStudents.length : (totalCount || 0);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  // If filters are active, paginate client-side; otherwise use DB-paginated data
  const paginatedStudents = hasActiveFilters 
    ? filteredAndSortedStudents.slice(startIndex, endIndex)
    : filteredAndSortedStudents;

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

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setShowDrawer(true);
  };

  const handleAddNoteClick = (student) => {
    setStudentForNote(student);
    setShowNoteModal(true);
  };

  // Opens the Assessment Report drawer to show the student's completed assessment report
  const handleViewCareerPath = async (student: any) => {
    try {
      setLoadingAssessmentForStudent(student.id);
      setStudentForReport(student);
      
      // Fetch the student's latest assessment result
      // Try both student.id and student.user_id as getLatestResult can handle both
      let result = null;
      
      if (student.user_id) {
        result = await getLatestResult(student.user_id);
      }
      
      // If no result found with user_id, try with student.id
      if (!result && student.id) {
        result = await getLatestResult(student.id);
      }
      
      if (result) {
        console.log('✅ Found assessment result for student:', student.name);
        setAssessmentResult(result);
        setShowAssessmentReport(true);
      } else {
        console.warn('⚠️ No assessment result found for student:', student.name);
        // Still show the drawer but with no assessment data - it will show appropriate message
        setAssessmentResult(null);
        setShowAssessmentReport(true);
      }
    } catch (error) {
      console.error('❌ Error fetching assessment result:', error);
      // Still show the drawer but with error state
      setAssessmentResult(null);
      setShowAssessmentReport(true);
    } finally {
      setLoadingAssessmentForStudent(null);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 sm:p-6 lg:p-8 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Student Admissions</h1>
          <p className="text-base md:text-lg mt-2 text-gray-600">Manage student applications and admissions.</p>
        </div>
        <button
          onClick={() => setShowAddStudentModal(true)}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add Student
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Students</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({totalItems} {searchQuery || filters.class.length > 0 ? 'matching' : ''} Students)
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
                {!loading && paginatedStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onViewProfile={handleViewProfile}
                    onAddNote={handleAddNoteClick}
                    onViewCareerPath={handleViewCareerPath}
                    loadingAssessmentForStudent={loadingAssessmentForStudent}
                  />
                ))}
                {!loading && paginatedStudents.length === 0 && !error && (
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
                    {paginatedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-800">{student.class}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {student.score}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadgeComponent status={student.admission_status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                          <button
                            onClick={() => handleViewProfile(student)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleViewCareerPath(student)}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View Assessment Report"
                            disabled={loadingAssessmentForStudent === student.id}
                          >
                            {loadingAssessmentForStudent === student.id ? 'Loading...' : 'Career'}
                          </button>
                          <button
                            onClick={() => handleAddNoteClick(student)}
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

      {/* Student Profile Drawer */}
      <StudentProfileDrawer
        student={selectedStudent}
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setSelectedStudent(null);
        }}
        userRole="school_admin"
      />

      {/* Assessment Report Drawer - Shows the student's completed assessment report */}
      <AssessmentReportDrawer
        student={studentForReport ? {
          id: studentForReport.id,
          user_id: studentForReport.user_id || studentForReport.id,
          name: studentForReport.name || undefined,
          email: studentForReport.email || undefined,
          college: studentForReport.college || studentForReport.college_school_name || undefined,
          college_name: studentForReport.college || studentForReport.college_school_name || undefined,
          grade: studentForReport.grade || studentForReport.student_grade || undefined,
          school_name: studentForReport.school_name || studentForReport.college_school_name || undefined,
          roll_number: studentForReport.roll_number || studentForReport.admission_number || 'N/A',
          student_grade: studentForReport.student_grade || studentForReport.grade || undefined,
          program_id: studentForReport.program_id || undefined,
          program_name: studentForReport.program_name || undefined,
          stream_name: studentForReport.stream_name || undefined
        } : undefined}
        assessmentResult={assessmentResult}
        isOpen={showAssessmentReport}
        onClose={() => {
          setShowAssessmentReport(false);
          setStudentForReport(null);
          setAssessmentResult(null);
        }}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => {
          setShowAddStudentModal(false);
          // Small delay to let user see the modal close, then refresh
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }}
        onSuccess={() => {
          // Success is handled in the modal - just log it
          console.log('Student created successfully');
        }}
      />

      {/* School Admission Note Modal - Opens directly when clicking Note button */}
      {studentForNote && (
        <SchoolAdmissionNoteModal
          isOpen={showNoteModal}
          onClose={() => {
            setShowNoteModal(false);
            setStudentForNote(null);
          }}
          student={studentForNote}
          onSuccess={() => {
            console.log('Note saved/sent successfully');
          }}
        />
      )}

    </div>
  );
};

export default StudentAdmissions;