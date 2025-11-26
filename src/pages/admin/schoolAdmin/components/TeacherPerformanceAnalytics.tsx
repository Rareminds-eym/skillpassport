import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, BookOpen, FileText, Award, 
  Calendar, Clock, Target, BarChart3 
} from 'lucide-react';
import { getTeachers, getTeacherPerformance } from '../../../../services/teacherService';

interface TeacherMetrics {
  teacher_id: string;
  teacher_name: string;
  classes_taught: number;
  students_count: number;
  lesson_plans_created: number;
  assignments_created: number;
  average_student_performance: number;
  attendance_rate: number;
}

const TeacherPerformanceAnalytics: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<TeacherMetrics[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const schoolId = 'your-school-id'; // Replace with actual
      const teachersData = await getTeachers(schoolId);
      setTeachers(teachersData);

      // Load performance metrics for each teacher
      const metricsPromises = teachersData.map(async (teacher) => {
        const performance = await getTeacherPerformance(teacher.id);
        return {
          ...performance,
          teacher_name: `${teacher.first_name} ${teacher.last_name}`,
        };
      });

      const metricsData = await Promise.all(metricsPromises);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTopPerformers = () => {
    return metrics
      .sort((a, b) => b.lesson_plans_created + b.assignments_created - (a.lesson_plans_created + a.assignments_created))
      .slice(0, 5);
  };

  const getAverageMetrics = () => {
    if (metrics.length === 0) return null;
    
    return {
      avgClasses: (metrics.reduce((sum, m) => sum + m.classes_taught, 0) / metrics.length).toFixed(1),
      avgStudents: (metrics.reduce((sum, m) => sum + m.students_count, 0) / metrics.length).toFixed(0),
      avgLessonPlans: (metrics.reduce((sum, m) => sum + m.lesson_plans_created, 0) / metrics.length).toFixed(1),
      avgAssignments: (metrics.reduce((sum, m) => sum + m.assignments_created, 0) / metrics.length).toFixed(1),
    };
  };

  const averages = getAverageMetrics();
  const topPerformers = getTopPerformers();

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Performance Analytics</h2>
          <p className="text-gray-600 mt-1">Track and analyze teacher performance metrics</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="semester">This Semester</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Average Metrics */}
      {averages && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                AVG
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{averages.avgClasses}</p>
            <p className="text-sm text-gray-600">Classes per Teacher</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-green-600" />
              <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded-full">
                AVG
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{averages.avgStudents}</p>
            <p className="text-sm text-gray-600">Students per Teacher</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded-full">
                AVG
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{averages.avgLessonPlans}</p>
            <p className="text-sm text-gray-600">Lesson Plans Created</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-8 w-8 text-orange-600" />
              <span className="text-xs font-medium text-orange-600 bg-orange-200 px-2 py-1 rounded-full">
                AVG
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{averages.avgAssignments}</p>
            <p className="text-sm text-gray-600">Assignments Created</p>
          </div>
        </div>
      )}

      {/* Top Performers */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-6 w-6 text-yellow-600" />
          <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
        </div>
        
        <div className="space-y-3">
          {topPerformers.map((teacher, index) => (
            <div
              key={teacher.teacher_id}
              className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' :
                  'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{teacher.teacher_name}</p>
                  <p className="text-sm text-gray-600">
                    {teacher.classes_taught} classes • {teacher.students_count} students
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-purple-600">{teacher.lesson_plans_created}</p>
                  <p className="text-gray-600">Lessons</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-orange-600">{teacher.assignments_created}</p>
                  <p className="text-gray-600">Assignments</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Teachers Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">All Teachers Performance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Teacher
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Classes
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Students
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Lesson Plans
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Assignments
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.map((metric) => {
                const totalActivity = metric.lesson_plans_created + metric.assignments_created;
                const performanceScore = Math.min(100, (totalActivity / 20) * 100);
                
                return (
                  <tr key={metric.teacher_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{metric.teacher_name}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        <Users className="h-3 w-3" />
                        {metric.classes_taught}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <Users className="h-3 w-3" />
                        {metric.students_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        <BookOpen className="h-3 w-3" />
                        {metric.lesson_plans_created}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        <FileText className="h-3 w-3" />
                        {metric.assignments_created}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              performanceScore >= 80 ? 'bg-green-500' :
                              performanceScore >= 60 ? 'bg-yellow-500' :
                              performanceScore >= 40 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${performanceScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-12">
                          {performanceScore.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherPerformanceAnalytics;
