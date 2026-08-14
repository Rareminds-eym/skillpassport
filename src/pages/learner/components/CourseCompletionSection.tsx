/**
 * CourseCompletionSection Component
 * 
 * Displays course completion statistics with donut chart
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { useCollegeDashboard } from '@/features/learner-profile/model/useCollegeDashboard';

const CourseCompletionSection = () => {
    const { learningMetrics, coursesLoading } = useCollegeDashboard();

    // Calculate totals
    const totalCourses = learningMetrics?.coursesEnrolled || 2450;
    const completed = learningMetrics?.coursesCompleted || 1122;
    const inProgress = learningMetrics?.coursesInProgress || 735;
    const notStarted = learningMetrics?.coursesNotStarted || 613;

    // Calculate percentages
    const completedPercent = totalCourses > 0 ? Math.round((completed / totalCourses) * 100) : 45;
    const inProgressPercent = totalCourses > 0 ? Math.round((inProgress / totalCourses) * 100) : 30;
    const notStartedPercent = totalCourses > 0 ? Math.round((notStarted / totalCourses) * 100) : 25;

    // Donut chart calculations
    const radius = 70;
    const circumference = 2 * Math.PI * radius;

    // Calculate stroke dash offsets for each segment
    const completedDash = (completedPercent / 100) * circumference;
    const inProgressDash = (inProgressPercent / 100) * circumference;
    const notStartedDash = (notStartedPercent / 100) * circumference;

    // Starting points for each segment
    const completedOffset = 0;
    const inProgressOffset = -completedDash;
    const notStartedOffset = -(completedDash + inProgressDash);

    if (coursesLoading) {
        return (
            <Card className="h-full bg-white rounded-xl border border-gray-200 shadow-sm">
                <CardHeader className="px-6 py-5 bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-gray-900 m-0 p-0">
                            Course Completion
                        </CardTitle>
                        <span className="text-xs text-gray-500 font-medium">This Month</span>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 animate-pulse">
                    <div className="flex items-center justify-center">
                        <div className="w-40 h-40 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-8 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardHeader className="px-6 py-5 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-gray-900 m-0 p-0">
                        Course Completion
                    </CardTitle>
                    <span className="text-xs text-gray-500 font-medium">This Month</span>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Donut Chart */}
                <div className="flex flex-col items-center">
                    <div className="relative w-44 h-44">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                            {/* Background circle */}
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke="#E5E7EB"
                                strokeWidth="20"
                            />

                            {/* Completed segment (Light Blue #60A5FA) */}
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke="#60A5FA"
                                strokeWidth="20"
                                strokeDasharray={`${completedDash} ${circumference - completedDash}`}
                                strokeDashoffset={completedOffset}
                                strokeLinecap="round"
                            />

                            {/* In Progress segment (Amber #FBBF24) */}
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke="#FBBF24"
                                strokeWidth="20"
                                strokeDasharray={`${inProgressDash} ${circumference - inProgressDash}`}
                                strokeDashoffset={inProgressOffset}
                                strokeLinecap="round"
                            />

                            {/* Not Started segment (Light Gray #D1D5DB) */}
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke="#D1D5DB"
                                strokeWidth="20"
                                strokeDasharray={`${notStartedDash} ${circumference - notStartedDash}`}
                                strokeDashoffset={notStartedOffset}
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-3xl font-bold text-gray-900">
                                {totalCourses.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                                Total Courses
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="space-y-3">
                    {/* Completed */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            <span className="text-sm font-medium text-gray-700">Completed</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900">{completedPercent}%</span>
                            <span className="text-xs text-gray-500">{completed.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                            <span className="text-sm font-medium text-gray-700">In Progress</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900">{inProgressPercent}%</span>
                            <span className="text-xs text-gray-500">{inProgress.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Not Started */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                            <span className="text-sm font-medium text-gray-700">Not Started</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900">{notStartedPercent}%</span>
                            <span className="text-xs text-gray-500">{notStarted.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Growth Indicator */}
                <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-sm font-semibold text-green-600">+43% vs last month</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CourseCompletionSection;
