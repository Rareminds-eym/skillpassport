import { useState, useEffect, useMemo } from 'react';
import {
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  EyeIcon,
  ChevronDownIcon,
  StarIcon,
  PencilSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { UserPlusIcon } from 'lucide-react';
import SearchBar from '../../../components/common/SearchBar';
import Pagination from '../../../components/admin/Pagination';
import StudentProfileDrawer from '@/components/shared/StudentProfileDrawer';
import AddStudentModal from '../../../components/educator/modals/Addstudentmodal';
import { AdmissionNoteModal } from '@/components/shared/StudentProfileDrawer/modals';
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

const CheckboxGroup = ({ options, selectedValues, onChange }: {
  options: Array<{ value: string; label: string; count?: number }>;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}) => {
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

const StatusBadgeComponent = ({ status }: { status: string }) => {
  const statusConfig = {
    enrolled: { color: 'bg-green-100 text-green-800', label: 'Enrolled' },
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    graduated: { color: 'bg-blue-100 text-blue-800', label: 'Graduated' },
    withdrawn: { color: 'bg-red-100 text-red-800', label: 'Withdrawn' },
    suspended: { color: 'bg-orange-100 text-orange-800', label: 'Suspended' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const StudentCard = ({ student, onViewProfile, onAddNote, onViewCareerPath, loadingAssessmentForStudent }: {
  student: any;
  onViewProfile: (student: any) => void;
  onAddNote: (student: any) => void;
  onViewCareerPath: (student: any) => void;
  loadingAssessmentForStudent: string | null;
}) => {


  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{student.name}</h3>
          <p className="text-sm text-gray-500">{student.email}</p>
          <p className="text-xs text-gray-400">{student.phone || 'N/A'}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center mb-1">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700 ml-1">{student.ai_score_overall || '0'}</span>
          </div>
          <StatusBadgeComponent status={student.approval_status || 'pending'} />
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
        {student.dept && (
          <p className="text-xs text-gray-600">
            🎓 {student.dept}
          </p>
        )}
      </div>



      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {student.location || 'N/A'}
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

const StudentDataAdmission = () => {
  const [searchQuery, setSearchQuery] = useState('');
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
  const [itemsPerPage] = useState(25);

  const [filters, setFilters] = useState({
    degree: [] as string[],
    course: [] as string[],
    college: [] as string[],
    status: [] as string[],
    minScore: 0,
    maxScore: 100
  });

  const { students, loading, error } = useStudents();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, filters.degree.length, filters.course.length, filters.college.length, filters.status.length, filters.minScore, filters.maxScore]);

  const degreeOptions = useMemo(() => {
    const degreeCounts: any = {};
    students.forEach(student => {
      if (student.dept) {
        const normalizedDegree = student.dept.toLowerCase();
        degreeCounts[normalizedDegree] = (degreeCounts[normalizedDegree] || 0) + 1;
      }
    });
    return Object.entries(degreeCounts)
      .map(([degree, count]) => ({
        value: degree,
        label: degree.charAt(0).toUpperCase() + degree.slice(1),
        count: count as number
      }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  }, [students]);

  const courseOptions = useMemo(() => {
    const courseCounts: any = {};
    students.forEach(student => {
      if (student.dept) {
        const normalizedCourse = student.dept.toLowerCase();
        courseCounts[normalizedCourse] = (courseCounts[normalizedCourse] || 0) + 1;
      }
    });
    return Object.entries(courseCounts)
      .map(([course, count]) => ({
        value: course,
        label: course.charAt(0).toUpperCase() + course.slice(1),
        count: count as number
      }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 15);
  }, [students]);

  const collegeOptions = useMemo(() => {
    const collegeCounts: any = {};
    students.forEach(student => {
      if (student.college) {
        const normalizedCollege = student.college.toLowerCase();
        collegeCounts[normalizedCollege] = (collegeCounts[normalizedCollege] || 0) + 1;
      }
    });
    return Object.entries(collegeCounts)
      .map(([college, count]) => ({
        value: college,
        label: college.charAt(0).toUpperCase() + college.slice(1),
        count: count as number
      }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  }, [students]);

  const statusOptions = useMemo(() => {
    const statusCounts: any = {};
    students.forEach(student => {
      if (student.approval_status) {
        const status = student.approval_status.toLowerCase();
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });
    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        count: count as number
      }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  }, [students]);

  const filteredAndSortedStudents = useMemo(() => {
    // Filter students associated with colleges (college_id is not null)
    // Note: The useStudents hook already filters by college_id via RLS, so we get all relevant students
    let result = students;

    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();

      result = result.filter(student => {
        return (
          (student.name && student.name.toLowerCase().includes(query)) ||
          (student.email && student.email.toLowerCase().includes(query)) ||
          (student.phone && student.phone.includes(query)) ||
          (student.dept && student.dept.toLowerCase().includes(query)) ||
          (student.college && student.college.toLowerCase().includes(query))
        );
      });
    }

    if (filters.degree.length > 0) {
      result = result.filter(student =>
        student.dept && filters.degree.includes(student.dept.toLowerCase())
      );
    }

    if (filters.course.length > 0) {
      result = result.filter(student =>
        student.dept && filters.course.includes(student.dept.toLowerCase())
      );
    }

    if (filters.college.length > 0) {
      result = result.filter(student =>
        student.college && filters.college.includes(student.college.toLowerCase())
      );
    }

    if (filters.status.length > 0) {
      result = result.filter(student =>
        student.approval_status && filters.status.includes(student.approval_status.toLowerCase())
      );
    }

    result = result.filter(student => {
      const score = student.ai_score_overall || 0;
      return score >= filters.minScore && score <= filters.maxScore;
    });

    if (!searchQuery || searchQuery.trim() === '') {
      const sortedResult = [...result];
      switch (sortBy) {
        case 'score':
          sortedResult.sort((a, b) => (b.ai_score_overall || 0) - (a.ai_score_overall || 0));
          break;
        case 'name':
          sortedResult.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'date':
          sortedResult.sort((a, b) =>
            new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime()
          );
          break;
        case 'relevance':
        default:
          break;
      }
      return sortedResult;
    }

    return result;
  }, [students, searchQuery, filters, sortBy]);

  const totalItems = filteredAndSortedStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredAndSortedStudents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setFilters({
      degree: [],
      course: [],
      college: [],
      status: [],
      minScore: 0,
      maxScore: 100
    });
  };

  const handleViewProfile = (student: any) => {
    // Debug: Log the student data to see what fields are available
    console.log('🔍 Student data passed to profile drawer:', {
      id: student.id,
      name: student.name,
      semester: student.semester,
      grade: student.grade,
      college_id: student.college_id,
      approval_status: student.approval_status,
      allFields: Object.keys(student)
    });
    
    setSelectedStudent(student);
    setShowDrawer(true);
  };

  const handleAddNoteClick = (student: any) => {
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
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Student Data & Admission</h1>
          <p className="text-base md:text-lg mt-2 text-gray-600">Manage student enrollments and profiles for your college.</p>
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
            <h1 className="text-xl font-semibold text-gray-900">Enrollments</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({totalItems} {searchQuery || filters.degree.length > 0 ? 'matching' : ''} enrollments)
            </span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, email, course, college..."
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
            {(filters.degree.length + filters.course.length + filters.college.length + filters.status.length) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {filters.degree.length + filters.course.length + filters.college.length + filters.status.length}
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
          <h1 className="text-xl font-semibold text-gray-900">Enrollments</h1>
          <span className="text-sm text-gray-500">
            {totalItems} {searchQuery || filters.degree.length > 0 ? 'matching' : ''} enrollments
          </span>
        </div>

        <div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search enrollments..."
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
                <FilterSection title="Degree" defaultOpen>
                  <CheckboxGroup
                    options={degreeOptions}
                    selectedValues={filters.degree}
                    onChange={(values) => setFilters({ ...filters, degree: values })}
                  />
                </FilterSection>

                <FilterSection title="Course">
                  <CheckboxGroup
                    options={courseOptions}
                    selectedValues={filters.course}
                    onChange={(values) => setFilters({ ...filters, course: values })}
                  />
                </FilterSection>

                <FilterSection title="College">
                  <CheckboxGroup
                    options={collegeOptions}
                    selectedValues={filters.college}
                    onChange={(values) => setFilters({ ...filters, college: values })}
                  />
                </FilterSection>

                <FilterSection title="Enrollment Status">
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
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
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
                <option value="date">Sort by: Last Updated</option>
                <option value="name">Sort by: Name</option>
              </select>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading && <div className="text-sm text-gray-500">Loading enrollments...</div>}
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
                      {searchQuery || filters.degree.length > 0
                        ? 'No enrollments match your current filters'
                        : 'No enrollments found.'}
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
                        College
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
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
                          <span className="text-sm text-gray-800">{student.college}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-800">{student.dept}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {student.ai_score_overall}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-800">
                            {(() => {
                              // Calculate academic year from admission year and semester
                              const calculateAcademicYear = (admissionYear: string, semester: number): string => {
                                try {
                                  const yearsProgressed = Math.floor((semester - 1) / 2);
                                  const [startYear] = admissionYear.split('-');
                                  const newStartYear = parseInt(startYear) + yearsProgressed;
                                  return `${newStartYear}-${(newStartYear + 1).toString().slice(-2)}`;
                                } catch {
                                  const currentYear = new Date().getFullYear();
                                  return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
                                }
                              };

                              // Dynamic semester calculation
                              let currentSem = 1;
                              let totalSems = 8;
                              
                              // First, check if semester is directly available in the student record
                              if ((student as any).semester && (student as any).semester > 0) {
                                currentSem = (student as any).semester;
                              }
                              // For college students, calculate based on enrollment date
                              else if ((student as any).college_id && (student as any).enrollmentDate) {
                                const enrollmentDate = new Date((student as any).enrollmentDate);
                                const currentDate = new Date();
                                const monthsDiff = (currentDate.getFullYear() - enrollmentDate.getFullYear()) * 12 + 
                                                  (currentDate.getMonth() - enrollmentDate.getMonth());
                                currentSem = Math.max(1, Math.floor(monthsDiff / 6) + 1);
                              }
                              // For school students, use grade
                              else if (student.school_id && student.grade) {
                                currentSem = parseInt(student.grade) || 1;
                                totalSems = 12;
                              }
                              // Fallback
                              else {
                                currentSem = parseInt((student as any).current_semester) || 1;
                              }
                              
                              // Calculate total semesters
                              if (student.school_id) {
                                totalSems = 12;
                              } else {
                                const degreeType = student.branch_field?.toLowerCase() || student.dept?.toLowerCase() || '';
                                if (degreeType.includes('phd') || degreeType.includes('doctorate')) totalSems = 8;
                                else if (degreeType.includes('master') || degreeType.includes('mtech') || degreeType.includes('mba')) totalSems = 4;
                                else if (degreeType.includes('bachelor') || degreeType.includes('btech') || degreeType.includes('be') || degreeType.includes('bsc') || degreeType.includes('ba')) totalSems = 8;
                                else if (degreeType.includes('diploma')) totalSems = 6;
                                else totalSems = 8;
                              }
                              
                              // Calculate academic year for display
                              const academicYear = (student as any).admission_academic_year 
                                ? calculateAcademicYear((student as any).admission_academic_year, currentSem)
                                : 'N/A';
                              
                              return `${currentSem} / ${totalSems} (${academicYear})`;
                            })()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadgeComponent status={student.approval_status || 'pending'} />
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
        userRole="college_admin"
      />

      {/* Assessment Report Drawer - Shows the student's completed assessment report */}
      <AssessmentReportDrawer
        student={studentForReport ? {
          id: studentForReport.id,
          user_id: studentForReport.user_id || studentForReport.id,
          name: studentForReport.name || undefined,
          email: studentForReport.email || undefined,
          college: studentForReport.college || undefined,
          college_name: studentForReport.college || undefined,
          grade: studentForReport.grade || studentForReport.student_grade || undefined,
          school_name: studentForReport.college || undefined,
          roll_number: studentForReport.enrollmentNumber || studentForReport.roll_number || 'N/A',
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

      {/* Admission Note Modal - Opens directly when clicking Note button */}
      {studentForNote && (
        <AdmissionNoteModal
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

export default StudentDataAdmission;