import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  Award
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { PieChart as RechartsePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Animated Pie Chart Component using Recharts
const CoursePieChart = ({ courses }) => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#8b5cf6', // purple
    '#f59e0b', // orange
    '#ec4899', // pink
    '#6366f1', // indigo
  ];

  // Prepare data for Recharts
  const chartData = courses.map((course, index) => ({
    name: course.courseName,
    value: course.completionRate || 1,
    completionRate: course.completionRate,
    color: COLORS[index % COLORS.length]
  }));

  // Custom label to show percentage
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label if slice is too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            Completion: <span className="font-bold text-purple-600">{payload[0].payload.completionRate}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-full">
      <div className="flex flex-col items-center">
        {/* Pie Chart */}
        <ResponsiveContainer width="100%" height={280}>
          <RechartsePieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
              isAnimationActive={isAnimated}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="hover:opacity-80 cursor-pointer transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </RechartsePieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-3xl font-bold text-gray-700">{courses.length}</p>
          <p className="text-xs text-gray-500">Courses</p>
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2 w-full px-4">
          {chartData.map((entry, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]"
              style={{ animationDelay: `${800 + index * 100}ms` }}
            >
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 truncate" title={entry.name}>
                {entry.name.length > 15 ? entry.name.substring(0, 15) + '...' : entry.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

const WeeklyLearningTracker = () => {
  const [weekData, setWeekData] = useState([]);
  const [courseData, setCourseData] = useState([]);
  const [stats, setStats] = useState({
    totalMinutes: 0,
    completedLessons: 0,
    completedModules: 0,
    completedCourses: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);

  // Get current week dates (Monday to Sunday)
  const getCurrentWeek = () => {
    const curr = new Date();
    const week = [];

    // Start from Monday
    const first = curr.getDate() - curr.getDay() + 1;

    for (let i = 0; i < 7; i++) {
      const date = new Date(curr);
      date.setDate(first + i);
      week.push(date);
    }

    return week;
  };

  const weekDates = getCurrentWeek();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Fetch real learning data from Supabase
  useEffect(() => {
    fetchWeeklyProgress();

    // Refresh every 30 seconds to show updated progress
    const interval = setInterval(() => {
      fetchWeeklyProgress();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchWeeklyProgress = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get date range for the current week
      const startOfWeek = new Date(weekDates[0]);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(weekDates[6]);
      endOfWeek.setHours(23, 59, 59, 999);

      console.log('Fetching progress for week:', startOfWeek, 'to', endOfWeek);

      // Fetch ALL student progress (not filtered by date)
      // We'll filter by date after to properly calculate daily stats
      const { data: progressData, error: progressError } = await supabase
        .from('student_course_progress')
        .select('*')
        .eq('student_id', user.id);

      if (progressError) throw progressError;

      console.log('Total progress records:', progressData?.length || 0);

      // Fetch enrollments to get course count
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('student_id', user.id)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      // Fetch course details with completion rates
      const courseProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
          console.log('Processing enrollment:', enrollment);

          // Fetch course details separately
          const { data: courseDetails, error: courseError } = await supabase
            .from('courses')
            .select('id, title, description')
            .eq('id', enrollment.course_id)
            .single();

          if (courseError) {
            console.error('Error fetching course details:', courseError);
          }
          console.log('Course details:', courseDetails);

          // Get total lessons in this course through modules
          // First get all modules for this course
          const { data: modulesData, error: modulesError } = await supabase
            .from('course_modules')
            .select('module_id')
            .eq('course_id', enrollment.course_id);

          if (modulesError) {
            console.error('Error fetching modules:', modulesError);
          }

          console.log('Modules for course:', modulesData);

          // Get lesson count for all modules
          let totalCount = 0;
          if (modulesData && modulesData.length > 0) {
            const moduleIds = modulesData.map(m => m.module_id);
            const { count: lessonsCount, error: lessonsError } = await supabase
              .from('lessons')
              .select('*', { count: 'exact', head: true })
              .in('module_id', moduleIds);

            if (lessonsError) {
              console.error('Error fetching lessons count:', lessonsError);
            } else {
              totalCount = lessonsCount || 0;
            }
          }

          console.log('Total lessons for course:', totalCount);

          // Get completed lessons for this course
          const { count: completedCount, error: completedError } = await supabase
            .from('student_course_progress')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', user.id)
            .eq('course_id', enrollment.course_id)
            .eq('status', 'completed');

          if (completedError) {
            console.error('Error fetching completed count:', completedError);
          }
          console.log('Completed lessons for course:', completedCount);

          const total = totalCount || 0;
          const completed = completedCount || 0;
          const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            courseId: enrollment.course_id,
            courseName: courseDetails?.title || enrollment.course_title || 'Untitled Course',
            completionRate,
            completedLessons: completed,
            totalLessons: total,
            startDate: enrollment.enrolled_at,
            status: enrollment.completed_at ? 'completed' : 'in-progress'
          };
        })
      );

      console.log('Final course progress data:', courseProgress);

      setCourseData(courseProgress.sort((a, b) => b.completionRate - a.completionRate));

      // Process weekly data
      const weeklyData = dayNames.map((day, index) => {
        const currentDate = weekDates[index];
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Get all lessons accessed this day
        const dayLessons = progressData.filter(p => {
          const accessDate = new Date(p.last_accessed);
          return accessDate >= dayStart && accessDate <= dayEnd;
        });

        // Calculate total minutes for all lessons accessed this day
        const totalSeconds = dayLessons.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0);
        const minutes = Math.round(totalSeconds / 60);

        // Count lessons completed this specific day
        const completedLessons = progressData.filter(p =>
          p.status === 'completed' &&
          p.completed_at &&
          new Date(p.completed_at) >= dayStart &&
          new Date(p.completed_at) <= dayEnd
        ).length;

        // Count unique courses worked on this day
        const uniqueCourses = new Set(dayLessons.map(p => p.course_id)).size;

        console.log(`${day}:`, { minutes, lessons: completedLessons, courses: uniqueCourses });

        return {
          day,
          minutes,
          lessons: completedLessons,
          modules: uniqueCourses
        };
      });

      setWeekData(weeklyData);

      // Calculate total stats for the week
      const totalMinutes = weeklyData.reduce((sum, day) => sum + day.minutes, 0);
      const totalLessons = weeklyData.reduce((sum, day) => sum + day.lessons, 0);
      const totalModules = weeklyData.reduce((sum, day) => sum + day.modules, 0);

      // Count completed courses
      const completedCourses = enrollments.filter(e => e.completed_at !== null).length;

      // Calculate streak
      const streak = calculateStreak(weeklyData);

      console.log('Weekly stats:', { totalMinutes, totalLessons, totalModules, enrollments: enrollments.length });

      setStats({
        totalMinutes,
        completedLessons: totalLessons,
        completedModules: totalModules,
        completedCourses: enrollments.length,
        currentStreak: streak
      });

    } catch (error) {
      console.error('Error fetching weekly progress:', error);
      // Set empty data on error
      setWeekData(dayNames.map(day => ({ day, minutes: 0, lessons: 0, modules: 0 })));
    } finally {
      setLoading(false);
    }
  };

  // Calculate current learning streak
  const calculateStreak = (weeklyData) => {
    let streak = 0;
    const today = new Date();
    const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Convert to Mon=0, Sun=6

    // Count backwards from today
    for (let i = currentDayIndex; i >= 0; i--) {
      if (weeklyData[i].minutes > 0 || weeklyData[i].lessons > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // Find max minutes for scaling bars
  const maxMinutes = Math.max(...weekData.map(d => d.minutes), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-600">Loading progress...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Weekly Learning Progress</h2>
                <p className="text-sm text-gray-500">Track your learning activity this week</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
          <Award className="w-5 h-5 text-orange-600" />
          <div>
            <p className="text-xs text-orange-600 font-medium">Current Streak</p>
            <p className="text-lg font-bold text-orange-700">{stats.currentStreak} days</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-600 font-medium">Total Time</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.totalMinutes}</p>
          <p className="text-xs text-blue-600">minutes</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-600 font-medium">Lessons</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.completedLessons}</p>
          <p className="text-xs text-green-600">completed</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-purple-600 font-medium">Modules</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">{stats.completedModules}</p>
          <p className="text-xs text-purple-600">completed</p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-indigo-600" />
            <p className="text-xs text-indigo-600 font-medium">Courses</p>
          </div>
          <p className="text-2xl font-bold text-indigo-700">{stats.completedCourses}</p>
          <p className="text-xs text-indigo-600">in progress</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Daily Learning Time (minutes)</h3>
        <div className="space-y-3">
          {weekData.map((day, index) => (
            <div key={day.day} className="flex items-center gap-3">
              {/* Day Label */}
              <div className="w-16">
                <p className="text-sm font-medium text-gray-700">{day.day}</p>
                <p className="text-xs text-gray-500">
                  {weekDates[index]?.getDate()}/{weekDates[index]?.getMonth() + 1}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 relative">
                <div className="h-12 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                    style={{ width: `${(day.minutes / maxMinutes) * 100}%` }}
                  >
                    {day.minutes > 0 && (
                      <span className="text-white text-sm font-semibold">
                        {day.minutes}m
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lessons & Modules Count */}
              <div className="flex gap-3 w-32">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">{day.lessons}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">{day.modules}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Weekly Average</p>
            <p className="text-lg font-bold text-gray-900">
              {Math.round(stats.totalMinutes / 7)} min/day
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Most Productive Day</p>
            <p className="text-lg font-bold text-gray-900">
              {weekData.reduce((max, day) => day.minutes > max.minutes ? day : max, weekData[0])?.day || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Activities</p>
            <p className="text-lg font-bold text-gray-900">
              {stats.completedLessons + stats.completedModules}
            </p>
          </div>
        </div>
      </div>

          {/* Motivational Message */}
          {stats.currentStreak >= 5 && (
            <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Great job! 🎉</p>
                  <p className="text-sm text-green-700">
                    You're on a {stats.currentStreak}-day streak! Keep up the amazing work!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Course Enrollment Progress */}
          {courseData.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 rounded-lg p-2">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Course Completion Status</h3>
                  <p className="text-sm text-gray-500">Track progress across all enrolled courses</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Animated Pie Chart */}
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                  <CoursePieChart courses={courseData} />

                  {/* Average Progress Circle */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Overall Progress</p>
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="transform -rotate-90" width="100" height="100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="url(#gradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - (courseData.reduce((sum, c) => sum + c.completionRate, 0) / courseData.length) / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                          style={{ transitionDelay: '500ms' }}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute">
                        <p className="text-2xl font-bold text-purple-700">
                          {Math.round(courseData.reduce((sum, c) => sum + c.completionRate, 0) / courseData.length)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course List */}
                <div className="space-y-3">
                  {courseData.map((course, index) => {
                    const startDate = new Date(course.startDate);
                    const formattedDate = startDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });

                    const colors = [
                      { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' },
                      { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
                      { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-500' },
                      { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
                      { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', dot: 'bg-pink-500' },
                      { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', dot: 'bg-indigo-500' },
                    ];
                    const colorScheme = colors[index % colors.length];

                    return (
                      <div
                        key={course.courseId}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-300 opacity-0 animate-[slideIn_0.5s_ease-out_forwards]"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Color Indicator */}
                          <div className={`w-3 h-3 rounded-full ${colorScheme.dot} flex-shrink-0`} />

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                              {course.courseName}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formattedDate}</span>
                              </div>
                              <span>•</span>
                              <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                            </div>
                          </div>

                          {/* Completion Badge */}
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`}>
                            <span>{course.completionRate}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Course Summary Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100 transform hover:scale-105 transition-transform">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Courses</p>
                  <p className="text-2xl font-bold text-blue-700">{courseData.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100 transform hover:scale-105 transition-transform">
                  <p className="text-sm text-green-600 font-medium mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-700">
                    {courseData.filter(c => c.completionRate === 100).length}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-100 transform hover:scale-105 transition-transform">
                  <p className="text-sm text-purple-600 font-medium mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {courseData.filter(c => c.completionRate < 100).length}
                  </p>
                </div>
              </div>

              <style jsx>{`
                @keyframes slideIn {
                  from {
                    opacity: 0;
                    transform: translateX(-20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
              `}</style>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeeklyLearningTracker;
