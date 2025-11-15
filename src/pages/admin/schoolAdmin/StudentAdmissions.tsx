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
} from '@heroicons/react/24/outline';
import SearchBar from '../../../components/common/SearchBar';
import Pagination from '../../../components/admin/Pagination';
import StudentProfileDrawer from '@/components/admin/components/StudentProfileDrawer';
import { useStudents } from '../../../hooks/useAdminStudents';

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

const StudentCard = ({ student, onViewProfile, onAddNote }) => {
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
        <div className="flex space-x-2">
          <button
            onClick={() => onViewProfile(student)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            View
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
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [showDrawer, setShowDrawer] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [filters, setFilters] = useState({
    class: [],
    subjects: [],
    status: [],
    minScore: 0,
    maxScore: 100
  });

  const { students, loading, error } = useStudents();
  console.log('Students:', students);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  const classOptions = useMemo(() => {
    const classCounts: any = {};
    students.forEach(student => {
      if (student.class) {
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
  }, [students]);

  const subjectOptions = useMemo(() => {
    const subjectCounts: any = {};
    students.forEach(student => {
      if (student.subjects && Array.isArray(student.subjects)) {
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
  }, [students]);

  const statusOptions = useMemo(() => {
    const statusCounts: any = {};
    students.forEach(student => {
      if (student.admission_status) {
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
  }, [students]);

  const filteredAndSortedStudents = useMemo(() => {
    let result = students;

    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();

      result = result.filter(student => {
        return (
          (student.name && student.name.toLowerCase().includes(query)) ||
          (student.email && student.email.toLowerCase().includes(query)) ||
          (student.contact_number && student.contact_number.includes(query)) ||
          (student.class && student.class.toLowerCase().includes(query)) ||
          (student.subjects && student.subjects.some((s: any) => s.toLowerCase().includes(query)))
        );
      });
    }

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

    if (!searchQuery || searchQuery.trim() === '') {
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
    setSelectedStudent(student);
    setShowDrawer(true);
    // TODO: Optionally set a tab to notes when opened
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 sm:p-6 lg:p-8 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Student Admissions</h1>
          <p className="text-base md:text-lg mt-2 text-gray-600">Manage student applications and admissions.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Applications</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({totalItems} {searchQuery || filters.class.length > 0 ? 'matching' : ''} applications)
            </span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, email, class, subjects..."
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
                <option value="date">Sort by: Date Applied</option>
                <option value="name">Sort by: Name</option>
              </select>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading && <div className="text-sm text-gray-500">Loading applications...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && paginatedStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onViewProfile={handleViewProfile}
                    onAddNote={handleAddNoteClick}
                  />
                ))}
                {!loading && paginatedStudents.length === 0 && !error && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-gray-500">
                      {searchQuery || filters.class.length > 0
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
      />
    </div>
  );
};

export default StudentAdmissions;