import React, { useState } from 'react';
import {
  Calendar,
  Users,
  CheckCircle,
  Plus,
  Search,
  Download,
  Edit,
  Send,
  Eye,
  BookOpen,
  Award,
  Building2,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';

const UniversityExaminationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');

  // Mock data for demonstration
  const [examinations, setExaminations] = useState([
    {
      id: 1,
      title: 'End Semester Examination - December 2024',
      type: 'End Semester',
      academicYear: '2024-25',
      semester: 'Odd',
      startDate: '2024-12-15',
      endDate: '2024-12-30',
      status: 'Scheduled',
      colleges: 45,
      students: 12500,
      subjects: 180,
      progress: 0,
    },
    {
      id: 2,
      title: 'Internal Assessment - November 2024',
      type: 'Internal Assessment',
      academicYear: '2024-25',
      semester: 'Odd',
      startDate: '2024-11-20',
      endDate: '2024-11-25',
      status: 'Completed',
      colleges: 45,
      students: 12500,
      subjects: 180,
      progress: 100,
    },
    {
      id: 3,
      title: 'Practical Examination - January 2025',
      type: 'Practical',
      academicYear: '2024-25',
      semester: 'Odd',
      startDate: '2025-01-10',
      endDate: '2025-01-20',
      status: 'Draft',
      colleges: 45,
      students: 8200,
      subjects: 95,
      progress: 0,
    },
  ]);

  const [results] = useState([
    {
      id: 1,
      examination: 'Internal Assessment - November 2024',
      college: 'ABC Engineering College',
      department: 'Computer Science',
      semester: '5th Semester',
      totalStudents: 120,
      passedStudents: 108,
      failedStudents: 12,
      passPercentage: 90,
      averageMarks: 78.5,
      status: 'Published',
      publishedDate: '2024-11-30',
    },
    {
      id: 2,
      examination: 'Internal Assessment - November 2024',
      college: 'XYZ Arts & Science College',
      department: 'Mathematics',
      semester: '3rd Semester',
      totalStudents: 85,
      passedStudents: 82,
      failedStudents: 3,
      passPercentage: 96.5,
      averageMarks: 82.3,
      status: 'Published',
      publishedDate: '2024-11-28',
    },
  ]);

  // Mock data for colleges (for future use)
  // const [colleges] = useState([
  //   { id: 1, name: "ABC Engineering College", code: "AEC", students: 2500 },
  //   { id: 2, name: "XYZ Arts & Science College", code: "XASC", students: 1800 },
  //   { id: 3, name: "PQR Medical College", code: "PMC", students: 1200 },
  // ]);

  // Filter examinations
  const filteredExaminations = examinations.filter((exam) => {
    if (searchTerm && !exam.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter && exam.status !== statusFilter) return false;
    return true;
  });

  // Filter results
  const filteredResults = results.filter((result) => {
    if (searchTerm && !result.examination.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    if (collegeFilter && !result.college.toLowerCase().includes(collegeFilter.toLowerCase()))
      return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      Draft: 'bg-gray-100 text-gray-700',
      Scheduled: 'bg-blue-100 text-blue-700',
      Ongoing: 'bg-yellow-100 text-yellow-700',
      Completed: 'bg-green-100 text-green-700',
      Published: 'bg-purple-100 text-purple-700',
    };
    return styles[status as keyof typeof styles] || styles.Draft;
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      'Internal Assessment': 'bg-purple-100 text-purple-700',
      'End Semester': 'bg-indigo-100 text-indigo-700',
      Practical: 'bg-teal-100 text-teal-700',
      Viva: 'bg-pink-100 text-pink-700',
      Arrears: 'bg-orange-100 text-orange-700',
    };
    return styles[type as keyof typeof styles] || styles['Internal Assessment'];
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'examinations', label: 'Examination Scheduling', icon: Calendar },
    { id: 'results', label: 'Results & Grades', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const handleCreateExamination = () => {
    // Mock creation - in real app, this would open a modal or navigate to form
    const newExam = {
      id: examinations.length + 1,
      title: 'New Examination',
      type: 'Internal Assessment',
      academicYear: '2024-25',
      semester: 'Even',
      startDate: '2025-02-15',
      endDate: '2025-02-20',
      status: 'Draft',
      colleges: 0,
      students: 0,
      subjects: 0,
      progress: 0,
    };
    setExaminations([...examinations, newExam]);
  };

  const handlePublishResults = (examId: number) => {
    // Mock publish - in real app, this would make API call
    alert(`Results published for examination ID: ${examId}`);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          University Examination Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage examination scheduling, evaluation workflows, and grade calculation across all
          colleges
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Active Examinations</p>
                    <p className="text-3xl font-bold">3</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Calendar className="h-7 w-7" />
                  </div>
                </div>
                <p className="text-sm text-blue-100">Across all colleges</p>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-green-100 text-sm mb-1">Total Students</p>
                    <p className="text-3xl font-bold">33.2K</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Users className="h-7 w-7" />
                  </div>
                </div>
                <p className="text-sm text-green-100">Enrolled for exams</p>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">Affiliated Colleges</p>
                    <p className="text-3xl font-bold">45</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Building2 className="h-7 w-7" />
                  </div>
                </div>
                <p className="text-sm text-purple-100">Participating in exams</p>
              </div>

              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-orange-100 text-sm mb-1">Pass Percentage</p>
                    <p className="text-3xl font-bold">92.8%</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Award className="h-7 w-7" />
                  </div>
                </div>
                <p className="text-sm text-orange-100">Overall university average</p>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Internal Assessment Results Published
                    </p>
                    <p className="text-sm text-gray-600">
                      November 2024 IA results for all colleges
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">2 hours ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">End Semester Exam Scheduled</p>
                    <p className="text-sm text-gray-600">
                      December 2024 examination timetable released
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">1 day ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Grade Calculation in Progress</p>
                    <p className="text-sm text-gray-600">
                      Final grades being calculated for 12,500 students
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'examinations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Examination Scheduling ({filteredExaminations.length})
              </h2>
              <button
                onClick={handleCreateExamination}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Schedule New Examination
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search examinations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>

              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                Bulk Upload
              </button>
            </div>

            {/* Examinations Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Examination
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Colleges
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Students
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExaminations.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{exam.title}</p>
                          <p className="text-sm text-gray-600">
                            {exam.academicYear} - {exam.semester} Semester
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(exam.type)}`}
                        >
                          {exam.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {exam.startDate} to {exam.endDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{exam.colleges}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {exam.students.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(exam.status)}`}
                        >
                          {exam.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${exam.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{exam.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                            title="Download Report"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Results & Grade Calculation ({filteredResults.length})
              </h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Results
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Send className="h-4 w-4" />
                  Publish Results
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <input
                type="text"
                placeholder="Filter by college..."
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Examination
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      College & Department
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Students
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Pass Rate
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Average Marks
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{result.examination}</p>
                          <p className="text-sm text-gray-600">{result.semester}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{result.college}</p>
                          <p className="text-sm text-gray-600">{result.department}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-900">Total: {result.totalStudents}</p>
                          <p className="text-green-600">Passed: {result.passedStudents}</p>
                          <p className="text-red-600">Failed: {result.failedStudents}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                result.passPercentage >= 90
                                  ? 'bg-green-600'
                                  : result.passPercentage >= 75
                                    ? 'bg-yellow-600'
                                    : 'bg-red-600'
                              }`}
                              style={{ width: `${result.passPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {result.passPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {result.averageMarks}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(result.status)}`}
                        >
                          {result.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePublishResults(result.id)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                            title="Publish Results"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Examination Analytics</h2>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-blue-900">Overall Performance</h3>
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Pass Rate</span>
                    <span className="font-semibold text-blue-900">92.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Average Marks</span>
                    <span className="font-semibold text-blue-900">78.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Grade A+</span>
                    <span className="font-semibold text-blue-900">15.3%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-green-900">Top Performing Colleges</h3>
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">ABC Engineering</span>
                    <span className="font-semibold text-green-900">96.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">XYZ Arts & Science</span>
                    <span className="font-semibold text-green-900">94.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">PQR Medical</span>
                    <span className="font-semibold text-green-900">91.8%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-purple-900">Subject Analysis</h3>
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-700">Mathematics</span>
                    <span className="font-semibold text-purple-900">89.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-700">Computer Science</span>
                    <span className="font-semibold text-purple-900">94.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-700">Physics</span>
                    <span className="font-semibold text-purple-900">87.3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Examination Trends</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Pass Rate Trends</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">2024 Odd Semester</span>
                      <span className="font-medium text-gray-900">92.8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">2023 Even Semester</span>
                      <span className="font-medium text-gray-900">91.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">2023 Odd Semester</span>
                      <span className="font-medium text-gray-900">89.7%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Grade Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Grade A+ (90-100)</span>
                      <span className="font-medium text-gray-900">15.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Grade A (80-89)</span>
                      <span className="font-medium text-gray-900">28.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Grade B (70-79)</span>
                      <span className="font-medium text-gray-900">31.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Grade C (60-69)</span>
                      <span className="font-medium text-gray-900">17.6%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Grade F (Below 60)</span>
                      <span className="font-medium text-red-600">7.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversityExaminationManagement;
