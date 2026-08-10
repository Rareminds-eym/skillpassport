import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Award, Clock, TrendingUp, ArrowRight, Play, Circle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { StatCard } from '@/shared/ui/StatCard';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import type { LearningMetricsProps } from '../model/types';

/**
 * LearningMetrics Widget
 * 
 * Comprehensive learning statistics dashboard displaying:
 * - 4 key metrics (courses enrolled, completed, certificates, learning hours)
 * - Course completion rate with visual indicator
 * - Course status breakdown (in progress, not started) with pie chart
 * - "View Courses" navigation button
 * 
 * **Performance Optimization**: Wrapped with React.memo to prevent unnecessary re-renders
 * 
 * Requirements: 3.1-3.8
 * - Display total courses enrolled (3.1)
 * - Display total courses completed (3.2)
 * - Display total certificates earned (3.3)
 * - Calculate and display total learning hours (3.4)
 * - Calculate and display course completion rate as percentage (3.5)
 * - Display count of courses in progress (3.6)
 * - Display count of courses not yet started (3.7)
 * - Navigate to courses page when clicked (3.8)
 * 
 * @param metrics - Learning statistics including course counts, hours, and completion rate
 * @param onViewCourses - Callback when "View Courses" button is clicked
 */
const LearningMetrics: React.FC<LearningMetricsProps> = React.memo(({
    metrics,
    onViewCourses,
}) => {
    // Prepare chart data for course status breakdown
    const chartData = [
        {
            name: 'Completed',
            value: metrics.coursesCompleted,
            color: '#10b981' // green-500
        },
        {
            name: 'In Progress',
            value: metrics.inProgressCount,
            color: '#3b82f6' // blue-500
        },
        {
            name: 'Not Started',
            value: metrics.notStartedCount,
            color: '#f59e0b' // amber-500
        },
    ];

    // Filter out zero values for cleaner chart
    const activeChartData = chartData.filter(item => item.value > 0);

    // Custom tooltip for the pie chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-900">{payload[0].name}</p>
                    <p className="text-sm text-gray-600">
                        {payload[0].value} course{payload[0].value !== 1 ? 's' : ''}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom legend renderer
    const renderLegend = (props: any) => {
        const { payload } = props;
        return (
            <ul className="flex flex-wrap justify-center gap-4 mt-4">
                {payload.map((entry: any, index: number) => (
                    <li key={`legend-${index}`} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-gray-700 font-medium">
                            {entry.value}: {entry.payload.value}
                        </span>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-2 border-indigo-200 shadow-lg overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                {/* Decorative top border */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <CardHeader className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 m-0 p-0">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900">
                                    Learning Metrics
                                </span>
                                <p className="text-sm text-gray-600 mt-0.5 font-medium">
                                    Your learning journey overview
                                </p>
                            </div>
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Key Metrics Grid - 4 metrics in responsive layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Courses Enrolled */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <StatCard
                                title="Courses Enrolled"
                                value={metrics.coursesEnrolled}
                                subtitle="Total courses"
                                icon={<BookOpen className="w-6 h-6 text-indigo-500" />}
                                className="border-indigo-200 hover:border-indigo-300 bg-gradient-to-br from-indigo-50 to-white"
                            />
                        </motion.div>

                        {/* Courses Completed */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <StatCard
                                title="Courses Completed"
                                value={metrics.coursesCompleted}
                                subtitle="Successfully finished"
                                icon={<CheckCircle className="w-6 h-6 text-green-500" />}
                                className="border-green-200 hover:border-green-300 bg-gradient-to-br from-green-50 to-white"
                            />
                        </motion.div>

                        {/* Certificates Earned */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                        >
                            <StatCard
                                title="Certificates"
                                value={metrics.certificatesEarned}
                                subtitle="Earned & verified"
                                icon={<Award className="w-6 h-6 text-amber-500" />}
                                className="border-amber-200 hover:border-amber-300 bg-gradient-to-br from-amber-50 to-white"
                            />
                        </motion.div>

                        {/* Learning Hours */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                        >
                            <StatCard
                                title="Learning Hours"
                                value={metrics.learningHours.toFixed(1)}
                                subtitle="Time invested"
                                icon={<Clock className="w-6 h-6 text-blue-500" />}
                                className="border-blue-200 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-white"
                            />
                        </motion.div>
                    </div>

                    {/* Course Completion Rate Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="mb-6 p-5 rounded-xl bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 shadow-md"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                                <span className="font-bold text-gray-900">Course Completion Rate</span>
                            </div>
                            <span className="text-2xl font-bold text-purple-600">
                                {metrics.courseCompletionRate.toFixed(0)}%
                            </span>
                        </div>

                        {/* Progress Bar Visual Indicator */}
                        <ProgressBar
                            value={metrics.courseCompletionRate}
                            color="auto"
                            height={12}
                            showPercentage={false}
                            className="mb-3"
                        />

                        <div className="flex justify-between text-xs text-gray-600 font-medium">
                            <span>Starting</span>
                            <span>Mastering</span>
                        </div>
                    </motion.div>

                    {/* Course Status Breakdown with Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                        className="mb-6 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 shadow-md"
                    >
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Circle className="w-5 h-5 text-blue-600" />
                            Course Status Breakdown
                        </h3>

                        {/* Status Counts */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-xs text-gray-600 font-medium">Completed</p>
                                    <p className="text-lg font-bold text-gray-900">{metrics.coursesCompleted}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <Play className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-xs text-gray-600 font-medium">In Progress</p>
                                    <p className="text-lg font-bold text-gray-900">{metrics.inProgressCount}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <Circle className="w-5 h-5 text-amber-600" />
                                <div>
                                    <p className="text-xs text-gray-600 font-medium">Not Started</p>
                                    <p className="text-lg font-bold text-gray-900">{metrics.notStartedCount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        {activeChartData.length > 0 ? (
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={activeChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {activeChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend content={renderLegend} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center">
                                <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="text-sm text-gray-500 font-medium">
                                    No courses enrolled yet
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Start your learning journey today!
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* View Courses Button */}
                    {onViewCourses && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.7 }}
                        >
                            <button
                                onClick={onViewCourses}
                                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
                                aria-label="View all courses"
                            >
                                <span>View Courses</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                            </button>
                        </motion.div>
                    )}

                    {/* Motivational Message (when completion rate is high) */}
                    {metrics.courseCompletionRate >= 75 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg"
                        >
                            <p className="text-sm text-purple-800 font-medium text-center">
                                🎉 Excellent progress! You're completing courses at an impressive rate!
                            </p>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
});

LearningMetrics.displayName = 'LearningMetrics';

export default LearningMetrics;
