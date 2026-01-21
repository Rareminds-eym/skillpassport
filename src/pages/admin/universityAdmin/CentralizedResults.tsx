import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  ResultStatusBadge,
  GradeBadge,
  QuickStatsCard,
  ResultsSummary,
  ExportOptionsModal,
} from '../../../components/admin/universityAdmin/ResultsComponents';
import ResultsAnalytics from '../../../components/admin/universityAdmin/ResultsAnalytics';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  program: string;
  semester: string;
  college: string;
  email: string;
  phone: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  type: 'theory' | 'practical' | 'project';
}

interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  examType: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  status: 'pass' | 'fail' | 'absent' | 'pending';
  semester: string;
  academicYear: string;
  publishedAt?: string;
  publishedBy?: string;
}

const CentralizedResults: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  // Filter states
  const [filters, setFilters] = useState({
    program: '',
    semester: '',
    college: '',
    examType: '',
    status: '',
    academicYear: '2024-25',
  });

  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [showAddResult, setShowAddResult] = useState(false);
  const [showEditResult, setShowEditResult] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  // Mock data - replace with actual API calls
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock students data
    const mockStudents: Student[] = [
      {
        id: '1',
        name: 'John Doe',
        rollNumber: 'CS2021001',
        program: 'Computer Science',
        semester: '6',
        college: 'Engineering College A',
        email: 'john.doe@example.com',
        phone: '+91 9876543210',
      },
      {
        id: '2',
        name: 'Jane Smith',
        rollNumber: 'CS2021002',
        program: 'Computer Science',
        semester: '6',
        college: 'Engineering College A',
        email: 'jane.smith@example.com',
        phone: '+91 9876543211',
      },
      {
        id: '3',
        name: 'Mike Johnson',
        rollNumber: 'ME2021001',
        program: 'Mechanical Engineering',
        semester: '4',
        college: 'Engineering College B',
        email: 'mike.johnson@example.com',
        phone: '+91 9876543212',
      },
    ];

    // Mock subjects data
    const mockSubjects: Subject[] = [
      { id: '1', code: 'CS301', name: 'Data Structures', credits: 4, type: 'theory' },
      { id: '2', code: 'CS302', name: 'Database Systems', credits: 3, type: 'theory' },
      { id: '3', code: 'CS303', name: 'Software Engineering', credits: 3, type: 'theory' },
      { id: '4', code: 'CS304', name: 'Web Development Lab', credits: 2, type: 'practical' },
      { id: '5', code: 'ME201', name: 'Thermodynamics', credits: 4, type: 'theory' },
      { id: '6', code: 'ME202', name: 'Fluid Mechanics', credits: 3, type: 'theory' },
    ];

    // Mock results data
    const mockResults: Result[] = [
      {
        id: '1',
        studentId: '1',
        subjectId: '1',
        examType: 'End Semester',
        marksObtained: 85,
        totalMarks: 100,
        grade: 'A',
        status: 'pass',
        semester: '6',
        academicYear: '2024-25',
        publishedAt: '2024-01-15',
        publishedBy: 'Dr. Smith',
      },
      {
        id: '2',
        studentId: '1',
        subjectId: '2',
        examType: 'End Semester',
        marksObtained: 78,
        totalMarks: 100,
        grade: 'B+',
        status: 'pass',
        semester: '6',
        academicYear: '2024-25',
        publishedAt: '2024-01-15',
        publishedBy: 'Dr. Johnson',
      },
      {
        id: '3',
        studentId: '2',
        subjectId: '1',
        examType: 'End Semester',
        marksObtained: 92,
        totalMarks: 100,
        grade: 'A+',
        status: 'pass',
        semester: '6',
        academicYear: '2024-25',
        publishedAt: '2024-01-15',
        publishedBy: 'Dr. Smith',
      },
      {
        id: '4',
        studentId: '3',
        subjectId: '5',
        examType: 'Mid Semester',
        marksObtained: 0,
        totalMarks: 50,
        grade: 'F',
        status: 'absent',
        semester: '4',
        academicYear: '2024-25',
      },
    ];

    setStudents(mockStudents);
    setSubjects(mockSubjects);
    setResults(mockResults);
  };

  // Helper functions
  const getStudentById = (id: string) => students.find((s) => s.id === id);
  const getSubjectById = (id: string) => subjects.find((s) => s.id === id);

  // Filter and search results
  const filteredResults = results.filter((result) => {
    const student = getStudentById(result.studentId);
    const subject = getSubjectById(result.subjectId);

    if (!student || !subject) return false;

    // Apply filters
    if (filters.program && student.program !== filters.program) return false;
    if (filters.semester && result.semester !== filters.semester) return false;
    if (filters.college && student.college !== filters.college) return false;
    if (filters.examType && result.examType !== filters.examType) return false;
    if (filters.status && result.status !== filters.status) return false;
    if (filters.academicYear && result.academicYear !== filters.academicYear) return false;

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        student.name.toLowerCase().includes(searchLower) ||
        student.rollNumber.toLowerCase().includes(searchLower) ||
        subject.name.toLowerCase().includes(searchLower) ||
        subject.code.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const stats = {
    totalResults: results.length,
    published: results.filter((r) => r.publishedAt).length,
    pending: results.filter((r) => !r.publishedAt).length,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    absent: results.filter((r) => r.status === 'absent').length,
  };
  // Action handlers
  const handleAddResult = () => {
    setSelectedResult(null);
    setShowAddResult(true);
  };

  const handleEditResult = (result: Result) => {
    setSelectedResult(result);
    setShowEditResult(true);
  };

  const handleDeleteResult = (resultId: string) => {
    if (window.confirm('Are you sure you want to delete this result?')) {
      setResults((prev) => prev.filter((r) => r.id !== resultId));
    }
  };

  const handlePublishResult = (resultId: string) => {
    setResults((prev) =>
      prev.map((r) =>
        r.id === resultId
          ? {
              ...r,
              publishedAt: new Date().toISOString().split('T')[0],
              publishedBy: 'Current User',
            }
          : r
      )
    );
  };

  const handleBulkPublish = () => {
    const unpublishedResults = filteredResults.filter((r) => !r.publishedAt);
    if (unpublishedResults.length === 0) {
      alert('No unpublished results to publish');
      return;
    }

    if (window.confirm(`Publish ${unpublishedResults.length} results?`)) {
      const today = new Date().toISOString().split('T')[0];
      setResults((prev) =>
        prev.map((r) =>
          unpublishedResults.some((ur) => ur.id === r.id)
            ? { ...r, publishedAt: today, publishedBy: 'Current User' }
            : r
        )
      );
    }
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleExportWithOptions = (format: string, options: any) => {
    // Mock export functionality with options
    console.log(
      `Exporting ${filteredResults.length} results as ${format.toUpperCase()} with options:`,
      options
    );
    alert(`Exporting ${filteredResults.length} results as ${format.toUpperCase()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const resetFilters = () => {
    setFilters({
      program: '',
      semester: '',
      college: '',
      examType: '',
      status: '',
      academicYear: '2024-25',
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                Centralized Results Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and publish examination results across all colleges and programs
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkUpload(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Bulk Upload
              </button>
              <button
                onClick={handleAddResult}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Add Result
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <ResultsSummary
          totalResults={stats.totalResults}
          publishedResults={stats.published}
          pendingResults={stats.pending}
          passRate={stats.totalResults > 0 ? (stats.passed / stats.totalResults) * 100 : 0}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <QuickStatsCard
            title="Total Results"
            value={stats.totalResults}
            icon={DocumentTextIcon}
            color="text-blue-600"
          />
          <QuickStatsCard
            title="Published"
            value={stats.published}
            icon={CheckCircleIcon}
            color="text-green-600"
          />
          <QuickStatsCard
            title="Pending"
            value={stats.pending}
            icon={ClockIcon}
            color="text-yellow-600"
          />
          <QuickStatsCard
            title="Passed"
            value={stats.passed}
            icon={CheckCircleIcon}
            color="text-green-600"
          />
          <QuickStatsCard
            title="Failed"
            value={stats.failed}
            icon={XCircleIcon}
            color="text-red-600"
          />
          <QuickStatsCard
            title="Absent"
            value={stats.absent}
            icon={ExclamationTriangleIcon}
            color="text-gray-600"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'results', name: 'Results Management', icon: DocumentTextIcon },
                { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={handleBulkPublish}
                  className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <CheckCircleIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-700">Bulk Publish Results</p>
                  <p className="text-xs text-blue-600">{stats.pending} pending</p>
                </button>

                <button
                  onClick={handleExport}
                  className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700">Export to Excel</p>
                  <p className="text-xs text-green-600">Download all results</p>
                </button>

                <button
                  onClick={handleExport}
                  className="p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <DocumentTextIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-700">Generate Reports</p>
                  <p className="text-xs text-purple-600">PDF format</p>
                </button>

                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-700">Bulk Upload</p>
                  <p className="text-xs text-orange-600">Import from Excel</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {results
                  .filter((r) => r.publishedAt)
                  .slice(0, 5)
                  .map((result) => {
                    const student = getStudentById(result.studentId);
                    const subject = getSubjectById(result.subjectId);
                    return (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Result published for {student?.name} - {subject?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Grade: {result.grade} | Published by: {result.publishedBy}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{result.publishedAt}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Reset All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                  <select
                    value={filters.program}
                    onChange={(e) => setFilters((prev) => ({ ...prev, program: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Programs</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select
                    value={filters.semester}
                    onChange={(e) => setFilters((prev) => ({ ...prev, semester: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem.toString()}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                  <select
                    value={filters.examType}
                    onChange={(e) => setFilters((prev) => ({ ...prev, examType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="Mid Semester">Mid Semester</option>
                    <option value="End Semester">End Semester</option>
                    <option value="Internal Assessment">Internal Assessment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="absent">Absent</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by student name, roll number, or subject..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Excel
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                  >
                    <PrinterIcon className="h-4 w-4" />
                    Print
                  </button>
                </div>
              </div>
            </div>
            {/* Results Table */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Results ({filteredResults.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBulkPublish}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Bulk Publish
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Published
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedResults.map((result) => {
                      const student = getStudentById(result.studentId);
                      const subject = getSubjectById(result.subjectId);

                      return (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student?.rollNumber} | {student?.program}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {subject?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {subject?.code} | {subject?.credits} credits
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.examType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.marksObtained}/{result.totalMarks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <GradeBadge grade={result.grade} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ResultStatusBadge status={result.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.publishedAt ? (
                              <div>
                                <div className="text-green-600 font-medium">Published</div>
                                <div className="text-xs text-gray-500">{result.publishedAt}</div>
                              </div>
                            ) : (
                              <span className="text-yellow-600 font-medium">Pending</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditResult(result)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Result"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteResult(result.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Result"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                              {!result.publishedAt && (
                                <button
                                  onClick={() => handlePublishResult(result.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Publish Result"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to{' '}
                    {Math.min(startIndex + itemsPerPage, filteredResults.length)} of{' '}
                    {filteredResults.length} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded text-sm ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'analytics' && (
          <ResultsAnalytics
            results={results}
            students={students}
            getStudentById={getStudentById}
            getSubjectById={getSubjectById}
          />
        )}

        {/* Modals */}
        {showAddResult && <AddResultModal onClose={() => setShowAddResult(false)} />}
        {showEditResult && selectedResult && (
          <EditResultModal result={selectedResult} onClose={() => setShowEditResult(false)} />
        )}
        {showBulkUpload && <BulkUploadModal onClose={() => setShowBulkUpload(false)} />}
        <ExportOptionsModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExportWithOptions}
        />
      </div>
    </div>
  );
};

// Modal Components
const AddResultModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Result</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option>Select Student</option>
              <option>John Doe (CS2021001)</option>
              <option>Jane Smith (CS2021002)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option>Select Subject</option>
              <option>Data Structures (CS301)</option>
              <option>Database Systems (CS302)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert('Result added successfully!');
              onClose();
            }}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Add Result
          </button>
        </div>
      </div>
    </div>
  );
};

const EditResultModal: React.FC<{ result: Result; onClose: () => void }> = ({
  result,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Result</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained</label>
              <input
                type="number"
                defaultValue={result.marksObtained}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
              <input
                type="number"
                defaultValue={result.totalMarks}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              defaultValue={result.grade}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="B+">B+</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="F">F</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert('Result updated successfully!');
              onClose();
            }}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Update Result
          </button>
        </div>
      </div>
    </div>
  );
};

const BulkUploadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Upload Results</h3>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <ArrowDownTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Drop your Excel file here or click to browse
            </p>
            <input type="file" accept=".xlsx,.xls" className="hidden" />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Choose File
            </button>
          </div>
          <div className="text-sm text-gray-500">
            <p className="font-medium mb-2">File Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Excel format (.xlsx or .xls)</li>
              <li>Include columns: Student ID, Subject Code, Marks, Total Marks</li>
              <li>Maximum 1000 records per upload</li>
            </ul>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert('File uploaded and processed successfully!');
              onClose();
            }}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Upload & Process
          </button>
        </div>
      </div>
    </div>
  );
};

export default CentralizedResults;
