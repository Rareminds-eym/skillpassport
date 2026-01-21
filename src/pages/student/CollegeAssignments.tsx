import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  ClipboardList,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Target,
  Activity,
  Upload,
  X,
  CheckSquare,
  Zap,
  Star,
  Filter,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Mock data for UI preview
const MOCK_ASSIGNMENTS = [
  {
    assignment_id: '1',
    title: 'Data Structures Assignment - Binary Trees',
    description:
      'Implement various binary tree operations including insertion, deletion, and traversal algorithms.',
    course_name: 'Data Structures and Algorithms',
    course_code: 'CS301',
    assignment_type: 'homework',
    total_points: 100,
    due_date: '2024-02-15T23:59:00',
    status: 'todo',
    skill_outcomes: ['Problem Solving', 'Programming', 'Data Structures'],
    allow_late_submission: true,
    created_date: '2024-01-20T10:00:00',
    student_assignment_id: 'sa1',
  },
  {
    assignment_id: '2',
    title: 'Database Design Project',
    description:
      'Design and implement a complete database schema for an e-commerce application with proper normalization.',
    course_name: 'Database Management Systems',
    course_code: 'CS302',
    assignment_type: 'project',
    total_points: 150,
    due_date: '2024-02-20T23:59:00',
    status: 'in-progress',
    skill_outcomes: ['Database Design', 'SQL', 'Problem Solving'],
    allow_late_submission: false,
    created_date: '2024-01-18T10:00:00',
    student_assignment_id: 'sa2',
  },
  {
    assignment_id: '3',
    title: 'Machine Learning Lab Report',
    description:
      'Complete analysis of supervised learning algorithms with implementation and comparison.',
    course_name: 'Machine Learning',
    course_code: 'CS401',
    assignment_type: 'lab',
    total_points: 80,
    due_date: '2024-01-25T23:59:00',
    status: 'submitted',
    submission_date: '2024-01-24T18:30:00',
    skill_outcomes: ['AI', 'Programming', 'Research'],
    allow_late_submission: true,
    created_date: '2024-01-10T10:00:00',
    student_assignment_id: 'sa3',
    grade_percentage: 85,
  },
];

const MOCK_STATS = {
  total: 12,
  todo: 3,
  inProgress: 4,
  submitted: 3,
  graded: 2,
  averageGrade: 82,
};

type StatusType = 'all' | 'todo' | 'in-progress' | 'submitted' | 'graded';

const CollegeAssignments: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS);
  const [stats, setStats] = useState(MOCK_STATS);
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Simulate loading
  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Helper function to parse date as local time
  const parseAsLocalDate = (dateString: string) => {
    if (!dateString) return new Date();
    const dueDateStr = dateString.replace('Z', '').replace('+00:00', '').replace('T', ' ');
    return new Date(dueDateStr);
  };

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (selectedStatus !== 'all' && assignment.status !== selectedStatus) return false;
      if (
        searchQuery &&
        !assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !assignment.course_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [assignments, selectedStatus, searchQuery]);

  const isOverdue = (dueDate: string) => {
    const now = new Date();
    const dueDateStr = dueDate.replace('Z', '').replace('+00:00', '').replace('T', ' ');
    const localDue = new Date(dueDateStr);
    return localDue < now;
  };

  const getDaysRemaining = (dueDate: string) => {
    const now = new Date();
    const dueDateStr = dueDate.replace('Z', '').replace('+00:00', '').replace('T', ' ');
    const localDue = new Date(dueDateStr);
    const diffTime = localDue.getTime() - now.getTime();

    if (diffTime < 0) {
      const overdueDays = Math.floor(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
      if (overdueDays > 0) {
        return (
          <span className="text-red-700 font-medium">
            {overdueDays} day{overdueDays > 1 ? 's' : ''} overdue
          </span>
        );
      }
      return <span className="text-red-700 font-medium">Overdue</span>;
    }

    const remainingDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (remainingDays > 1) {
      return <span className="text-gray-600">{remainingDays} days left</span>;
    } else if (remainingDays === 1) {
      return <span className="text-orange-500 font-medium">Tomorrow</span>;
    } else if (remainingHours > 1) {
      return <span className="text-orange-600 font-medium">{remainingHours} hours left</span>;
    }
    return <span className="text-red-500 font-medium">Due soon</span>;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<
      string,
      { bg: string; text: string; label: string; icon: React.ComponentType<{ className?: string }> }
    > = {
      todo: {
        bg: 'bg-gray-100 border-gray-200',
        text: 'text-gray-700',
        label: 'To Do',
        icon: ClipboardList,
      },
      'in-progress': {
        bg: 'bg-blue-100 border-blue-200',
        text: 'text-blue-700',
        label: 'In Progress',
        icon: Zap,
      },
      submitted: {
        bg: 'bg-purple-100 border-purple-200',
        text: 'text-purple-700',
        label: 'Submitted',
        icon: CheckSquare,
      },
      graded: {
        bg: 'bg-green-100 border-green-200',
        text: 'text-green-700',
        label: 'Graded',
        icon: Star,
      },
    };
    const config = configs[status] || configs.todo;
    const IconComponent = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} shadow-sm`}
      >
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const handleViewDetails = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 rounded-lg p-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
              </div>
              <p className="text-gray-600">Track and manage your college assignments</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">To Do</p>
            <p className="text-2xl font-bold text-gray-900">{stats.todo}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <p className="text-xs text-blue-600 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
          </div>
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
            <p className="text-xs text-purple-600 mb-1">Submitted</p>
            <p className="text-2xl font-bold text-purple-700">{stats.submitted}</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <p className="text-xs text-green-600 mb-1">Graded</p>
            <p className="text-2xl font-bold text-green-700">{stats.graded}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-4">
            <p className="text-xs text-blue-600 mb-1">Avg Grade</p>
            <p className="text-2xl font-bold text-blue-700">{stats.averageGrade}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Assignments
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by title or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <Filter
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as StatusType)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Assignments</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your assignments will appear here when educators create them'}
              </p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => {
              const overdueStatus = isOverdue(assignment.due_date);
              const isSubmitted =
                assignment.status === 'submitted' || assignment.status === 'graded';

              return (
                <div
                  key={assignment.assignment_id}
                  className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
                    overdueStatus && !isSubmitted
                      ? 'border-red-200 bg-red-50/30'
                      : isSubmitted
                        ? 'border-green-200 bg-green-50/30'
                        : 'border-gray-200'
                  }`}
                >
                  {/* Status Bar */}
                  <div
                    className={`h-2 rounded-t-xl ${
                      overdueStatus && !isSubmitted
                        ? 'bg-gradient-to-r from-red-400 to-red-600'
                        : isSubmitted
                          ? 'bg-gradient-to-r from-green-400 to-green-600'
                          : assignment.status === 'in-progress'
                            ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                            : 'bg-gradient-to-r from-gray-300 to-gray-400'
                    }`}
                  />

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`p-2 rounded-xl ${
                              overdueStatus && !isSubmitted
                                ? 'bg-red-100 text-red-600'
                                : isSubmitted
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            <ClipboardList className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {assignment.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {assignment.course_name} ({assignment.course_code})
                            </p>
                          </div>
                        </div>
                        {assignment.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 ml-14">
                            {assignment.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {overdueStatus && !isSubmitted && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            OVERDUE
                          </span>
                        )}
                        {getStatusBadge(assignment.status)}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-500">Due Date</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {parseAsLocalDate(assignment.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <div className="text-xs">{getDaysRemaining(assignment.due_date)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Target className="w-4 h-4 text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-500">Points</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {assignment.total_points}
                          </p>
                          {assignment.grade_percentage && (
                            <p className="text-xs text-green-600 font-medium">
                              Grade: {assignment.grade_percentage}%
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Activity className="w-4 h-4 text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {assignment.assignment_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-500">Late Submit</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {assignment.allow_late_submission ? 'Allowed' : 'Not Allowed'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    {assignment.skill_outcomes && assignment.skill_outcomes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {assignment.skill_outcomes.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Submission Info */}
                    {assignment.submission_date && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-green-800">
                          Submitted on{' '}
                          {parseAsLocalDate(assignment.submission_date).toLocaleDateString(
                            'en-US',
                            {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleViewDetails(assignment)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </button>

                      {assignment.status !== 'submitted' && assignment.status !== 'graded' && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                          <Upload className="w-4 h-4" />
                          Upload Submission
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedAssignment && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
              <div
                className="fixed inset-0 bg-gray-900 bg-opacity-50"
                onClick={() => setShowDetailsModal(false)}
              />
              <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Assignment Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedAssignment.title}
                    </h3>
                    <p className="text-gray-600">{selectedAssignment.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Course</p>
                      <p className="font-medium text-gray-900">{selectedAssignment.course_name}</p>
                      <p className="text-sm text-gray-500">{selectedAssignment.course_code}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Due Date</p>
                      <p className="font-medium text-gray-900">
                        {parseAsLocalDate(selectedAssignment.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Total Points</p>
                      <p className="font-medium text-gray-900">{selectedAssignment.total_points}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Type</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {selectedAssignment.assignment_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {selectedAssignment.skill_outcomes &&
                    selectedAssignment.skill_outcomes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Skill Outcomes</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedAssignment.skill_outcomes.map((skill: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeAssignments;
