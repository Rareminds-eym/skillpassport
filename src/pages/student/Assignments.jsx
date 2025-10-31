import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import {
  ClipboardList,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Filter,
  Download,
  Upload,
  Eye,
  Search,
  X,
  List,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Target,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import {
  getAssignmentsByStudentId,
  getAssignmentStats,
  updateAssignmentStatus,
} from '../../services/assignmentsService';

// Helper function to transform database assignment to UI format
const transformAssignment = (dbAssignment) => ({
  // Core identifiers
  id: dbAssignment.assignment_id,
  student_assignment_id: dbAssignment.student_assignment_id,
  
  // Assignment details
  title: dbAssignment.title,
  course: dbAssignment.course_name,
  description: dbAssignment.description,
  fullDescription: dbAssignment.description,
  points: dbAssignment.total_points,
  rubric: dbAssignment.rubric || '',
  attachments: [],
  
  // Status & Priority
  status: dbAssignment.status,
  priority: dbAssignment.priority,
  
  // Dates - comprehensive tracking
  dueDate: dbAssignment.due_date,
  assignedDate: dbAssignment.assigned_date,
  startedDate: dbAssignment.started_date,
  submittedDate: dbAssignment.submission_date,
  completedDate: dbAssignment.completed_date,
  gradedDate: dbAssignment.graded_date,
  feedbackDate: dbAssignment.feedback_date,
  
  // Submission details
  submissionType: dbAssignment.submission_type,
  submissionContent: dbAssignment.submission_content,
  submissionUrl: dbAssignment.submission_url,
  
  // Grading information
  gradeReceived: dbAssignment.grade_received,
  grade: dbAssignment.grade_percentage,
  feedback: dbAssignment.instructor_feedback,
  gradedBy: dbAssignment.graded_by,
  
  // Late tracking
  isLate: dbAssignment.is_late,
  latePenalty: dbAssignment.late_penalty
});

const Assignments = () => {
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData, loading: authLoading } = useStudentDataByEmail(userEmail);
  const studentId = studentData?.id || user?.id;
  
  console.log('🎯 ASSIGNMENTS COMPONENT MOUNTED');
  console.log('🎯 authLoading:', authLoading);
  console.log('🎯 studentData:', studentData);
  console.log('🎯 studentId:', studentId);
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, completed: 0, averageGrade: 0 });
  const [loading, setLoading] = useState(true);
  const [showStatusToast, setShowStatusToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showQuickTip, setShowQuickTip] = useState(true);

  // Fetch assignments from database
  useEffect(() => {
    console.log('🔄 useEffect triggered - authLoading:', authLoading, 'studentData:', studentData);
    
    const fetchAssignments = async () => {
      // Still loading auth
      if (authLoading) {
        console.log('⏳ Still loading auth...');
        return;
      }

      // Auth complete but no student data - show empty state
      if (!studentId) {
        console.log('⚠️ No student ID found. studentData:', studentData, 'studentId:', studentId);
        setLoading(false);
        setAssignments([]);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 Fetching assignments for student ID:', studentId);
        
        const [assignmentsData, statsData] = await Promise.all([
          getAssignmentsByStudentId(studentId),
          getAssignmentStats(studentId)
        ]);

        console.log('📦 Assignments data received:', assignmentsData);
        console.log('📊 Stats data received:', statsData);

        const transformedAssignments = assignmentsData.map(transformAssignment);
        setAssignments(transformedAssignments);
        setStats(statsData);
      } catch (error) {
        console.error('❌ Error fetching assignments:', error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [studentId, authLoading]);

  // Get unique courses for filter
  const courses = useMemo(() => {
    const uniqueCourses = [...new Set(assignments.map(a => a.course))];
    return uniqueCourses.sort();
  }, [assignments]);

  // Handle status change
  const handleStatusChange = async (assignmentId, newStatus) => {
    try {
      // Find the assignment to get student_assignment_id
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        console.error('Assignment not found:', assignmentId);
        return;
      }

      // Optimistically update UI
      setAssignments(prevAssignments => 
        prevAssignments.map(assignment => {
          if (assignment.id === assignmentId) {
            const updatedAssignment = {
              ...assignment,
              status: newStatus
            };
            
            // Auto-set submission date when submitted
            if (newStatus === 'submitted' && !assignment.submittedDate) {
              updatedAssignment.submittedDate = new Date().toISOString();
            }
            
            return updatedAssignment;
          }
          return assignment;
        })
      );

      // Update in database using student_assignment_id
      await updateAssignmentStatus(assignment.student_assignment_id, newStatus);

      // Refresh stats
      if (studentId) {
        const updatedStats = await getAssignmentStats(studentId);
        setStats(updatedStats);
      }
      
      // Show toast notification
      const statusLabels = {
        'todo': '📋 To Do',
        'in-progress': '⚡ In Progress',
        'submitted': '📤 Submitted',
        'graded': '✅ Graded'
      };
      setToastMessage(`Status updated to ${statusLabels[newStatus]}`);
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    } catch (error) {
      console.error('Error updating assignment status:', error);
      // Optionally: revert optimistic update or show error toast
    }
  };

  // Filter and sort assignments with search
  const filteredAssignments = useMemo(() => {
    return assignments
      .filter(assignment => {
        if (filterStatus !== 'all' && assignment.status !== filterStatus) return false;
        if (courseFilter !== 'all' && assignment.course !== courseFilter) return false;
        if (priorityFilter !== 'all' && assignment.priority !== priorityFilter) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            assignment.title.toLowerCase().includes(query) ||
            assignment.course.toLowerCase().includes(query) ||
            assignment.description.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (sortBy === 'priority') {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return 0;
      });
  }, [assignments, filterStatus, courseFilter, priorityFilter, searchQuery, sortBy]);


  const getStatusBadge = (status) => {
    const configs = {
      'todo': { className: 'bg-gray-50 text-gray-700 border border-gray-200', label: '📋 To Do', icon: '📋' },
      'in-progress': { className: 'bg-blue-50 text-blue-700 border border-blue-200', label: '⚡ In Progress', icon: '⚡' },
      'submitted': { className: 'bg-purple-50 text-purple-700 border border-purple-200', label: '📤 Submitted', icon: '📤' },
      'graded': { className: 'bg-green-50 text-green-700 border border-green-200', label: '✅ Graded', icon: '✅' }
    };
    const config = configs[status] || configs.todo;
    return <Badge className={`${config.className} text-xs font-medium px-2 py-1`}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const configs = {
      'high': { className: 'bg-red-50 text-red-700 border border-red-200', label: 'High' },
      'medium': { className: 'bg-orange-50 text-orange-700 border border-orange-200', label: 'Medium' },
      'low': { className: 'bg-gray-50 text-gray-600 border border-gray-200', label: 'Low' }
    };
    const config = configs[priority] || configs.medium;
    return <Badge className={`${config.className} border text-xs font-medium px-2 py-1`}>{config.label}</Badge>;
  };

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <span className="text-red-600 text-sm font-medium">Overdue</span>;
    if (diffDays === 0) return <span className="text-orange-600 text-sm font-medium">Due Today</span>;
    if (diffDays === 1) return <span className="text-orange-500 text-sm font-medium">Due Tomorrow</span>;
    if (diffDays <= 3) return <span className="text-orange-500 text-sm">{diffDays} days left</span>;
    return <span className="text-gray-600 text-sm">{diffDays} days left</span>;
  };

  // Calendar helper functions
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAssignmentsForDate = (date) => {
    if (!date) return [];
    return filteredAssignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      return (
        dueDate.getDate() === date.getDate() &&
        dueDate.getMonth() === date.getMonth() &&
        dueDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const changeMonth = (delta) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-blue-600" />
                My Assignments
              </h1>
              <p className="text-sm text-gray-600 mt-2">Track and manage your course assignments</p>
            </div>

            {/* View Toggle */}
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg'
                }
              >
                <List className="w-4 h-4 mr-2" />
                List View
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={viewMode === 'calendar' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg'
                }
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Calendar View
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8">
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-600">Total</span>
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-600">To Do</span>
                <AlertCircle className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.todo}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-blue-600">In Progress</span>
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-blue-700">{stats.inProgress}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-purple-600">Submitted</span>
                <Upload className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-purple-700">{stats.submitted || 0}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-green-600">Graded</span>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-700">{stats.graded || 0}</p>
            </div>

            {stats.averageGrade > 0 && (
              <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-purple-600">Avg Grade</span>
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-purple-700">{stats.averageGrade}%</p>
              </div>
            )}
          </div>

          {/* Quick Tip Banner */}
          {showQuickTip && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60 p-4 mb-6 flex items-start gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">💡 Quick Tip: Track Your Progress</h4>
                <p className="text-xs text-blue-800">
                  Update your assignment status: To Do → In Progress → Submitted → Graded. 
                  Click the status dropdown to change, or use the "Submit Assignment" button. Changes save automatically!
                </p>
              </div>
              <button 
                onClick={() => setShowQuickTip(false)}
                className="text-blue-400 hover:text-blue-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-6 mb-8 shadow-sm">
            {/* Search Bar */}
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments by title, course, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Filters:</span>
              </div>

              {/* Status Pills */}
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'todo', label: 'To Do' },
                  { id: 'in-progress', label: 'In Progress' },
                  { id: 'submitted', label: 'Submitted' },
                  { id: 'graded', label: 'Graded' }
                ].map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setFilterStatus(status.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      filterStatus === status.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              {/* Dropdowns */}
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeMonth(-1)}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeMonth(1)}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Calendar Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Due This Month</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {filteredAssignments.filter(a => {
                      const due = new Date(a.dueDate);
                      return due.getMonth() === currentMonth.getMonth() && 
                             due.getFullYear() === currentMonth.getFullYear();
                    }).length}
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="text-xs text-red-600 mb-1">Overdue</div>
                  <div className="text-2xl font-bold text-red-700">
                    {filteredAssignments.filter(a => {
                      const due = new Date(a.dueDate);
                      return due < new Date() && a.status !== 'submitted' && a.status !== 'graded';
                    }).length}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="text-xs text-orange-600 mb-1">Late Submitted</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {filteredAssignments.filter(a => a.isLate && a.status === 'submitted').length}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs text-blue-600 mb-1">In Progress</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {filteredAssignments.filter(a => a.status === 'in-progress').length}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-xs text-purple-600 mb-1">Awaiting Grade</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {filteredAssignments.filter(a => a.status === 'submitted').length}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-green-600 mb-1">Graded</div>
                  <div className="text-2xl font-bold text-green-700">
                    {filteredAssignments.filter(a => a.status === 'graded').length}
                  </div>
                </div>
              </div>

              {/* Color Legend */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="font-semibold text-gray-600">Status Colors:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
                    <span className="text-gray-700">To Do</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
                    <span className="text-gray-700">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
                    <span className="text-gray-700">Submitted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
                    <span className="text-gray-700">Graded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-50 border-2 border-red-400"></div>
                    <span className="text-gray-700">Overdue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-50 border-2 border-orange-400"></div>
                    <span className="text-gray-700">Late Submission</span>
                  </div>
                </div>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="font-semibold text-gray-600">Timeline Events:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-600">▶</span>
                    <span className="text-gray-700">Started</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-purple-600 font-bold">📤</span>
                    <span className="text-gray-700">Submitted</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span className="text-gray-700">Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-600">★</span>
                    <span className="text-gray-700">Graded</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-700 text-sm py-2">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {getCalendarDays().map((date, index) => {
                  const assignmentsOnDate = date ? getAssignmentsForDate(date) : [];
                  const isToday = date && 
                    date.toDateString() === new Date().toDateString();
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const cellDate = date ? new Date(date) : null;
                  if (cellDate) cellDate.setHours(0, 0, 0, 0);
                  const isPastDate = cellDate && cellDate < today;
                  
                  // Analyze assignments on this date
                  const hasGraded = assignmentsOnDate.some(a => a.status === 'graded');
                  const hasSubmitted = assignmentsOnDate.some(a => a.status === 'submitted');
                  const hasInProgress = assignmentsOnDate.some(a => a.status === 'in-progress');
                  const hasTodo = assignmentsOnDate.some(a => a.status === 'todo');
                  const hasOverdue = assignmentsOnDate.some(a => {
                    const dueDate = new Date(a.dueDate);
                    return dueDate < new Date() && a.status !== 'submitted' && a.status !== 'graded';
                  });
                  const hasLateSubmission = assignmentsOnDate.some(a => a.isLate);
                  const hasHighPriority = assignmentsOnDate.some(a => a.priority === 'high');
                  const hasLatePenalty = assignmentsOnDate.some(a => a.latePenalty && a.latePenalty > 0);
                  
                  // Timeline tracking - check what happened on this date
                  const assignmentsStartedToday = assignmentsOnDate.filter(a => 
                    a.startedDate && new Date(a.startedDate).toDateString() === date?.toDateString()
                  );
                  const assignmentsSubmittedToday = assignmentsOnDate.filter(a => 
                    a.submittedDate && new Date(a.submittedDate).toDateString() === date?.toDateString()
                  );
                  const assignmentsCompletedToday = assignmentsOnDate.filter(a => 
                    a.completedDate && new Date(a.completedDate).toDateString() === date?.toDateString()
                  );
                  const assignmentsGradedToday = assignmentsOnDate.filter(a => 
                    a.gradedDate && new Date(a.gradedDate).toDateString() === date?.toDateString()
                  );
                  
                  // Check if there are submissions or completions today
                  const hasSubmissionToday = assignmentsSubmittedToday.length > 0;
                  const hasCompletionToday = assignmentsCompletedToday.length > 0;
                  
                  // Calculate completion rate for this day
                  const completedCount = assignmentsOnDate.filter(a => 
                    a.status === 'graded' || a.status === 'submitted'
                  ).length;
                  const totalCount = assignmentsOnDate.length;
                  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                  
                  // Priority: Overdue > High Priority > Status-based coloring
                  let dateCellStyle = '';
                  let dateNumberStyle = '';
                  let borderStyle = '';
                  
                  if (!date) {
                    dateCellStyle = 'bg-gray-50/50 border-gray-100';
                  } else if (isToday) {
                    dateCellStyle = 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 ring-2 ring-blue-300 shadow-sm';
                    dateNumberStyle = 'text-blue-700 font-bold';
                  } else if (assignmentsOnDate.length === 0) {
                    dateCellStyle = 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300';
                    dateNumberStyle = isPastDate ? 'text-gray-400' : 'text-gray-700';
                  } else {
                    // Prioritize overdue assignments
                    if (hasOverdue) {
                      dateCellStyle = 'bg-red-50/80 border-red-300 hover:bg-red-100 hover:border-red-400 ring-1 ring-red-200';
                      dateNumberStyle = 'text-red-700 font-bold';
                      borderStyle = 'border-l-4 border-l-red-500';
                    } else if (hasLateSubmission) {
                      dateCellStyle = 'bg-orange-50/80 border-orange-300 hover:bg-orange-100 hover:border-orange-400';
                      dateNumberStyle = 'text-orange-700 font-semibold';
                      borderStyle = 'border-l-4 border-l-orange-500';
                    } else if (hasGraded && completionRate === 100) {
                      // All graded - Green
                      dateCellStyle = 'bg-green-50/70 border-green-300 hover:bg-green-100 hover:border-green-400';
                      dateNumberStyle = 'text-green-700 font-semibold';
                    } else if (hasSubmitted) {
                      // Has submitted - Purple
                      dateCellStyle = 'bg-purple-50/70 border-purple-300 hover:bg-purple-100 hover:border-purple-400';
                      dateNumberStyle = 'text-purple-700 font-semibold';
                    } else if (hasInProgress) {
                      // Has in progress - Blue
                      dateCellStyle = 'bg-blue-50/70 border-blue-300 hover:bg-blue-100 hover:border-blue-400';
                      dateNumberStyle = 'text-blue-700';
                    } else if (hasTodo) {
                      // Only to do - Gray/Neutral
                      dateCellStyle = 'bg-gray-50/70 border-gray-300 hover:bg-gray-100 hover:border-gray-400';
                      dateNumberStyle = 'text-gray-700';
                    }
                    
                    // Add high priority indicator
                    if (hasHighPriority && !hasOverdue) {
                      borderStyle = 'border-l-4 border-l-amber-500';
                    }
                  }
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-32 p-3 border rounded-xl transition-all cursor-pointer ${dateCellStyle} ${borderStyle}`}
                      onClick={() => {
                        if (assignmentsOnDate.length === 1) {
                          setSelectedAssignment(assignmentsOnDate[0]);
                        }
                      }}
                    >
                      {date && (
                        <>
                          {/* Date number with indicators */}
                          <div className="flex items-center justify-between mb-2">
                            <div className={`text-sm font-bold ${dateNumberStyle || 'text-gray-700'}`}>
                              {date.getDate()}
                            </div>
                            {assignmentsOnDate.length > 0 && (
                              <div className="flex flex-col items-end gap-0.5">
                                {/* Status indicators */}
                                <div className="flex items-center gap-1">
                                  {hasOverdue && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Overdue"></div>
                                  )}
                                  {hasHighPriority && !hasOverdue && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="High Priority"></div>
                                  )}
                                  {hasLateSubmission && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Late Submission"></div>
                                  )}
                                  {hasLatePenalty && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-700" title="Late Penalty Applied"></div>
                                  )}
                                </div>
                                {/* Timeline events for today */}
                                {(assignmentsStartedToday.length > 0 || 
                                  assignmentsSubmittedToday.length > 0 ||
                                  assignmentsCompletedToday.length > 0 || 
                                  assignmentsGradedToday.length > 0) && (
                                  <div className="flex items-center gap-0.5 text-[9px]">
                                    {assignmentsStartedToday.length > 0 && (
                                      <span className="text-blue-600 font-bold" title={`${assignmentsStartedToday.length} started today`}>▶</span>
                                    )}
                                    {assignmentsSubmittedToday.length > 0 && (
                                      <span className="text-purple-600 font-bold" title={`${assignmentsSubmittedToday.length} submitted today`}>📤</span>
                                    )}
                                    {assignmentsCompletedToday.length > 0 && (
                                      <span className="text-indigo-600 font-bold" title={`${assignmentsCompletedToday.length} completed today`}>✓</span>
                                    )}
                                    {assignmentsGradedToday.length > 0 && (
                                      <span className="text-green-600 font-bold" title={`${assignmentsGradedToday.length} graded today`}>★</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Assignments list */}
                          {assignmentsOnDate.length > 0 && (
                            <div className="space-y-1">
                              {assignmentsOnDate.slice(0, 2).map(assignment => {
                                const assignmentDue = new Date(assignment.dueDate);
                                const isOverdue = assignmentDue < new Date() && 
                                                assignment.status !== 'submitted' && 
                                                assignment.status !== 'graded';
                                
                                return (
                                  <button
                                    key={assignment.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAssignment(assignment);
                                    }}
                                    className={`w-full text-left text-xs px-2 py-1.5 rounded-lg font-medium transition-all hover:shadow-md group relative ${
                                      isOverdue
                                        ? 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
                                        : assignment.status === 'graded'
                                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                          : assignment.status === 'submitted'
                                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                            : assignment.status === 'in-progress'
                                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      {assignment.priority === 'high' && (
                                        <span className="text-[10px]">🔥</span>
                                      )}
                                      <span className="truncate flex-1">{assignment.title}</span>
                                      
                                      {/* Show grade or timeline status */}
                                      {assignment.gradeReceived ? (
                                        <span className="text-[10px] font-bold text-green-700">
                                          {assignment.grade}%
                                          {assignment.latePenalty > 0 && (
                                            <span className="text-red-600 ml-0.5">-{assignment.latePenalty}%</span>
                                          )}
                                        </span>
                                      ) : assignment.completedDate && new Date(assignment.completedDate).toDateString() === date?.toDateString() ? (
                                        <span className="text-[9px] text-indigo-600 font-bold">✓</span>
                                      ) : assignment.submittedDate && new Date(assignment.submittedDate).toDateString() === date?.toDateString() ? (
                                        <span className="text-[9px] text-purple-600 font-bold">📤</span>
                                      ) : assignment.status === 'submitted' && assignment.submittedDate ? (
                                        <span className="text-[9px] text-purple-600">📤</span>
                                      ) : assignment.status === 'in-progress' && assignment.startedDate ? (
                                        <span className="text-[9px] text-blue-600">▶</span>
                                      ) : null}
                                    </div>
                                    
                                    {/* Enhanced Tooltip with Timeline */}
                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-20 w-56 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl">
                                      <div className="font-semibold mb-1">{assignment.title}</div>
                                      <div className="text-gray-400 text-[10px] mb-2">{assignment.course}</div>
                                      
                                      {/* Complete Timeline */}
                                      <div className="space-y-1 border-t border-gray-700 pt-2 mb-2">
                                        {assignment.assignedDate && (
                                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                            <span>📋</span>
                                            <span className="flex-1">Assigned:</span>
                                            <span className="font-semibold">{new Date(assignment.assignedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                          </div>
                                        )}
                                        {assignment.startedDate && (
                                          <div className="flex items-center gap-2 text-[10px] text-blue-400">
                                            <span>▶</span>
                                            <span className="flex-1">Started:</span>
                                            <span className="font-semibold">{new Date(assignment.startedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                          </div>
                                        )}
                                        {assignment.submittedDate && (
                                          <div className="flex items-center gap-2 text-[10px] text-purple-400">
                                            <span>📤</span>
                                            <span className="flex-1">Submitted:</span>
                                            <span className="font-semibold">
                                              {new Date(assignment.submittedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              {assignment.isLate && <span className="text-orange-400 ml-1">(Late)</span>}
                                            </span>
                                          </div>
                                        )}
                                        {assignment.completedDate && (
                                          <div className="flex items-center gap-2 text-[10px] text-indigo-400">
                                            <span>✓</span>
                                            <span className="flex-1">Completed:</span>
                                            <span className="font-semibold">{new Date(assignment.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                          </div>
                                        )}
                                        {assignment.gradedDate && (
                                          <div className="flex items-center gap-2 text-[10px] text-green-400">
                                            <span>⭐</span>
                                            <span className="flex-1">Graded:</span>
                                            <span className="font-semibold">{new Date(assignment.gradedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Grade Info */}
                                      {assignment.gradeReceived && (
                                        <div className="border-t border-gray-700 pt-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-gray-400">Grade:</span>
                                            <span className="text-green-300 font-bold">{assignment.gradeReceived}/{assignment.points}</span>
                                          </div>
                                          <div className="flex items-center justify-between mt-1">
                                            <span className="text-gray-400">Percentage:</span>
                                            <span className="text-green-300 font-bold">{assignment.grade}%</span>
                                          </div>
                                          {assignment.latePenalty > 0 && (
                                            <div className="flex items-center justify-between mt-1">
                                              <span className="text-red-400">Late Penalty:</span>
                                              <span className="text-red-300 font-bold">-{assignment.latePenalty}%</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Warnings */}
                                      {isOverdue && (
                                        <div className="text-red-300 mt-2 font-medium text-[10px] bg-red-900/30 rounded px-2 py-1">
                                          ⚠️ {Math.ceil((new Date() - new Date(assignment.dueDate)) / (1000 * 60 * 60 * 24))} days overdue
                                        </div>
                                      )}
                                      
                                      <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1" />
                                    </div>
                                  </button>
                                );
                              })}
                              
                              {assignmentsOnDate.length > 2 && (
                                <div className="text-[11px] text-gray-600 font-semibold pl-2 pt-1 flex items-center justify-between">
                                  <span>+{assignmentsOnDate.length - 2} more</span>
                                  {completionRate > 0 && (
                                    <span className="text-[10px] text-green-600">
                                      {Math.round(completionRate)}% done
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Assignments List */}
        {viewMode === 'list' && (
          <div className="space-y-5">
          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200/60 p-16 text-center shadow-sm">
              <ClipboardList className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <p className="text-gray-500 text-lg font-semibold">No assignments found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search query</p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white rounded-xl border border-gray-200/60 hover:border-blue-400 hover:shadow-md transition-all p-6 shadow-sm"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{assignment.title}</h3>
                      
                      {/* Status Change Dropdown - Student can only change to certain statuses */}
                      <div className="relative group">
                        <select
                          value={assignment.status}
                          onChange={(e) => handleStatusChange(assignment.id, e.target.value)}
                          disabled={assignment.status === 'graded'}
                          title={assignment.status === 'graded' ? 'Graded assignments cannot be changed' : 'Click to change assignment status'}
                          className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-lg text-xs font-medium border transition-all hover:shadow-sm ${
                            assignment.status === 'todo'
                              ? 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-100'
                              : assignment.status === 'in-progress'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400 hover:bg-blue-100'
                                : assignment.status === 'submitted'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400 hover:bg-purple-100'
                                  : 'bg-green-50 text-green-700 border-green-200 opacity-75 cursor-not-allowed'
                          }`}
                        >
                          <option value="todo">📋 To Do</option>
                          <option value="in-progress">⚡ In Progress</option>
                          <option value="submitted">📤 Submitted</option>
                          {assignment.status === 'graded' && <option value="graded">✅ Graded</option>}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                        
                        {/* Tooltip on hover */}
                        <div className="absolute left-0 -bottom-8 hidden group-hover:block z-10 w-48 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                          Click to update status
                          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45" />
                        </div>
                      </div>
                      
                      {getPriorityBadge(assignment.priority)}
                    </div>
                    <p className="text-sm text-blue-600 font-semibold">{assignment.course}</p>
                  </div>
                  <div className="text-right">
                    {assignment.gradeReceived ? (
                      <>
                        <p className="text-sm text-gray-600">Grade</p>
                        <p className="text-xl font-bold text-green-600">
                          {assignment.gradeReceived}/{assignment.points}
                        </p>
                        {assignment.grade && (
                          <p className="text-sm font-semibold text-green-700">({assignment.grade}%)</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">Max Points</p>
                        <p className="text-lg font-semibold text-gray-900">{assignment.points}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Progress Indicator */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">Progress</span>
                    <span className="text-xs font-medium text-gray-600">
                      {assignment.status === 'todo' ? 'Not Started' : 
                       assignment.status === 'in-progress' ? 'Working On It' :
                       assignment.status === 'submitted' ? 'Awaiting Grade' : 'Graded'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${
                          assignment.status === 'todo' ? 'w-0 bg-gray-400' :
                          assignment.status === 'in-progress' ? 'w-1/3 bg-blue-500' :
                          assignment.status === 'submitted' ? 'w-2/3 bg-purple-500' :
                          'w-full bg-green-500'
                        }`}
                      />
                    </div>
                    <div className="flex gap-1">
                      {/* Step 1: Todo */}
                      <div className={`w-2 h-2 rounded-full transition-colors ${
                        assignment.status !== 'todo' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      {/* Step 2: In Progress */}
                      <div className={`w-2 h-2 rounded-full transition-colors ${
                        assignment.status === 'in-progress' || assignment.status === 'submitted' || assignment.status === 'graded'
                          ? 'bg-blue-500' : 'bg-gray-200'
                      }`} />
                      {/* Step 3: Submitted */}
                      <div className={`w-2 h-2 rounded-full transition-colors ${
                        assignment.status === 'submitted' || assignment.status === 'graded'
                          ? 'bg-purple-500' : 'bg-gray-200'
                      }`} />
                      {/* Step 4: Graded */}
                      <div className={`w-2 h-2 rounded-full transition-colors ${
                        assignment.status === 'graded' ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-5 leading-relaxed">
                  {assignment.description}
                </p>

                {/* Due Date Row */}
                <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100">
                  <div className="flex items-center gap-5 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Due:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {getDaysRemaining(assignment.dueDate)}
                  </div>

                  {assignment.submittedDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">Submitted:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(assignment.submittedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => setSelectedAssignment(assignment)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  {assignment.status === 'todo' || assignment.status === 'in-progress' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(assignment.id, 'submitted')}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 text-sm font-medium px-5 py-2.5 rounded-lg"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Assignment
                    </Button>
                  ) : assignment.status === 'submitted' ? (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Awaiting instructor grade</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showStatusToast && (
        <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-out transform">
          <div className="bg-white border border-green-200 rounded-xl shadow-lg p-4 flex items-center gap-3 animate-slide-in-right">
            <div className="bg-green-100 rounded-full p-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{toastMessage}</p>
              <p className="text-xs text-gray-600">Changes saved successfully</p>
            </div>
            <button
              onClick={() => setShowStatusToast(false)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedAssignment(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {selectedAssignment.title}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {selectedAssignment.course}
                    </Badge>
                    {getStatusBadge(selectedAssignment.status)}
                    {getPriorityBadge(selectedAssignment.priority)}
                    {selectedAssignment.gradeReceived ? (
                      <Badge className="bg-green-50 text-green-700 border border-green-200">
                        <Target className="w-3 h-3 mr-1" />
                        {selectedAssignment.gradeReceived}/{selectedAssignment.points} pts
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-50 text-gray-700 border border-gray-200">
                        <Target className="w-3 h-3 mr-1" />
                        Max: {selectedAssignment.points} pts
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Due:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(selectedAssignment.dueDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="mx-2 text-gray-300">•</span>
                  {getDaysRemaining(selectedAssignment.dueDate)}
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedAssignment.fullDescription || selectedAssignment.description}
                </p>
              </div>

              {selectedAssignment.rubric && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Grading Rubric</h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-800">{selectedAssignment.rubric}</p>
                  </div>
                </div>
              )}

              {selectedAssignment.submittedDate && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Submission Details</h3>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Submitted on:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(selectedAssignment.submittedDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {selectedAssignment.grade && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-700">Grade:</span>
                        <span className="font-bold text-green-700 text-lg">
                          {selectedAssignment.grade}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedAssignment.feedback && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Instructor Feedback</h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">{selectedAssignment.feedback}</p>
                  </div>
                </div>
              )}

              {selectedAssignment.attachments.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Course Materials</h3>
                  <div className="space-y-2">
                    {selectedAssignment.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <span className="text-sm text-gray-800 font-medium">{file}</span>
                        </div>
                        <Download className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAssignment(null)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Close
                </Button>
                {selectedAssignment.status === 'completed' ? (
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Submission
                  </Button>
                ) : (
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    {selectedAssignment.status === 'in-progress' ? 'Update Submission' : 'Submit Assignment'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
