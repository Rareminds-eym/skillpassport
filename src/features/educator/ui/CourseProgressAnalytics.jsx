import { motion } from 'framer-motion';
import {
    BarChart3,
    CheckCircle,
    Clock,
    Download,
    Search,
    TrendingUp,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { apiPost } from '@/shared/api/apiClient';

/**
 * Course Progress Analytics Dashboard for Educators
 * Shows detailed learner progress metrics and insights
 */
const CourseProgressAnalytics = ({ courseId, courseName }) => {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [lessonProgress, setLessonProgress] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('progress');

  // Fetch analytics data
  useEffect(() => {
    if (courseId) {
      fetchAnalytics();
    }
  }, [courseId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch enrollments with progress
      const enrollRes = await apiPost('/educator/actions', { action: 'fetch-course-enrollments', courseId });
      setEnrollments(enrollRes?.data || []);

      // Fetch lesson-level progress
      const progressRes = await apiPost('/educator/actions', { action: 'fetch-learner-course-progress', courseId });
      setLessonProgress(progressRes?.data || []);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary stats
  const stats = {
    totalEnrollments: enrollments.length,
    activelearners: enrollments.filter(e => e.status === 'active').length,
    completedlearners: enrollments.filter(e => e.status === 'completed' || e.progress === 100).length,
    averageProgress: enrollments.length > 0
      ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / enrollments.length)
      : 0,
    totalTimeSpent: enrollments.reduce((acc, e) => acc + (e.total_time_spent_seconds || 0), 0),
    averageTimePerLearner: enrollments.length > 0
      ? Math.round(enrollments.reduce((acc, e) => acc + (e.total_time_spent_seconds || 0), 0) / enrollments.length)
      : 0
  };

  // Progress distribution data for pie chart
  const progressDistribution = [
    { name: 'Not Started (0%)', value: enrollments.filter(e => e.progress === 0).length, color: '#94a3b8' },
    { name: '1-25%', value: enrollments.filter(e => e.progress > 0 && e.progress <= 25).length, color: '#f97316' },
    { name: '26-50%', value: enrollments.filter(e => e.progress > 25 && e.progress <= 50).length, color: '#eab308' },
    { name: '51-75%', value: enrollments.filter(e => e.progress > 50 && e.progress <= 75).length, color: '#22c55e' },
    { name: '76-99%', value: enrollments.filter(e => e.progress > 75 && e.progress < 100).length, color: '#3b82f6' },
    { name: 'Completed (100%)', value: enrollments.filter(e => e.progress === 100).length, color: '#8b5cf6' }
  ].filter(d => d.value > 0);

  // Weekly enrollment trend (last 4 weeks)
  const getWeeklyTrend = () => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekEnrollments = enrollments.filter(e => {
        const enrollDate = new Date(e.enrolled_at);
        return enrollDate >= weekStart && enrollDate <= weekEnd;
      });

      weeks.push({
        week: `Week ${4 - i}`,
        enrollments: weekEnrollments.length,
        completions: weekEnrollments.filter(e => e.progress === 100).length
      });
    }
    
    return weeks;
  };

  // Filter and sort learners
  const filteredlearners = enrollments
    .filter(e => {
      const matchesSearch = e.learner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           e.learner_email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' ||
                           (filterStatus === 'completed' && e.progress === 100) ||
                           (filterStatus === 'in_progress' && e.progress > 0 && e.progress < 100) ||
                           (filterStatus === 'not_started' && e.progress === 0);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        case 'name':
          return (a.learner_name || '').localeCompare(b.learner_name || '');
        case 'recent':
          return new Date(b.last_accessed || 0) - new Date(a.last_accessed || 0);
        case 'time':
          return (b.total_time_spent_seconds || 0) - (a.total_time_spent_seconds || 0);
        default:
          return 0;
      }
    });

  // Format time duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Learner Name', 'Email', 'Progress', 'Status', 'Time Spent', 'Last Accessed', 'Enrolled Date'];
    const rows = enrollments.map(e => [
      e.learner_name || '',
      e.learner_email || '',
      `${e.progress || 0}%`,
      e.progress === 100 ? 'Completed' : e.progress > 0 ? 'In Progress' : 'Not Started',
      formatDuration(e.total_time_spent_seconds),
      formatDate(e.last_accessed),
      formatDate(e.enrolled_at)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseName || 'course'}_progress_report.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress Analytics</h2>
          <p className="text-gray-600">{courseName}</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedlearners}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageProgress}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Time/Learner</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.averageTimePerLearner)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Progress Distribution
          </h3>
          {progressDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={progressDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${value}`}
                >
                  {progressDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No enrollment data yet
            </div>
          )}
        </motion.div>

        {/* Weekly Trend Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Weekly Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={getWeeklyTrend()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="enrollments" name="New Enrollments" fill="#6366f1" />
              <Bar dataKey="completions" name="Completions" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Learner List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learner Progress</h3>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search learners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="progress">Sort by Progress</option>
              <option value="name">Sort by Name</option>
              <option value="recent">Sort by Recent Activity</option>
              <option value="time">Sort by Time Spent</option>
            </select>
          </div>
        </div>

        {/* Learner Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Learner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredlearners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No learners found
                  </td>
                </tr>
              ) : (
                filteredlearners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {(learner.learner_name || learner.learner_email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{learner.learner_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{learner.learner_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              learner.progress === 100 ? 'bg-emerald-500' :
                              learner.progress > 50 ? 'bg-blue-500' :
                              learner.progress > 0 ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${learner.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {learner.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDuration(learner.total_time_spent_seconds)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(learner.last_accessed)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        learner.progress === 100
                          ? 'bg-emerald-100 text-emerald-800'
                          : learner.progress > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {learner.progress === 100 ? 'Completed' : learner.progress > 0 ? 'In Progress' : 'Not Started'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default CourseProgressAnalytics;
