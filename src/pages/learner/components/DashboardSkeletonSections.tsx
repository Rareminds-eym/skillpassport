/**
 * Dashboard Skeleton Sections Component
 * 
 * Skeleton loaders for all dashboard sections matching the exact layout from the design
 */

import StatsCards from './StatsCards';
import AssessmentSection from './AssessmentSection';
import SkillPassportSection from './SkillPassportSection';
import RecommendedCoursesSection from './RecommendedCoursesSection';

interface DashboardSkeletonSectionsProps {
    statsData?: {
        coursesEnrolled?: number;
        coursesCompleted?: number;
        certificatesEarned?: number;
        learningHours?: number;
    };
    statsLoading?: boolean;
}

const DashboardSkeletonSections = ({
    statsData,
    statsLoading = false
}) => {
    return (
        <div className="space-y-6">
            {/* Row 1: Stats Cards - 4 columns */}
            <StatsCards
                coursesEnrolled={statsData?.coursesEnrolled}
                coursesCompleted={statsData?.coursesCompleted}
                certificatesEarned={statsData?.certificatesEarned}
                learningHours={statsData?.learningHours}
                loading={statsLoading}
            />

            {/* Row 2: Assessment, Skill Passport, Recommended Courses - 3 equal columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Assessment Card - 1 column */}
                <div className="lg:col-span-1">
                    <AssessmentSection />
                </div>

                {/* Skill Passport Card - 1 column */}
                <div className="lg:col-span-1">
                    <SkillPassportSection />
                </div>

                {/* Recommended Courses Card - 1 column */}
                <div className="lg:col-span-1">
                    <RecommendedCoursesSection />
                </div>
            </div>

            {/* Row 3: Learning Path & Course Completion - 2/3 + 1/3 layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Learning Path - 2 columns */}
                <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>

                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-blue-200 rounded-lg"></div>
                        <div className="flex-1">
                            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full"></div>
                    </div>

                    {/* Continue Button */}
                    <div className="h-12 bg-blue-200 rounded-lg mb-6"></div>

                    {/* Milestone */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-48"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                </div>

                {/* Course Completion - 1 column */}
                <div className="lg:col-span-1 bg-white rounded-lg p-6 shadow-sm animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-40 mb-6"></div>

                    {/* Donut Chart */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-40 h-40 bg-gray-200 rounded-full"></div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </div>
                                <div className="h-4 bg-gray-200 rounded w-12"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 4: Opportunities & Skills Snapshot - 2/3 + 1/3 layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Opportunities - 2 columns */}
                <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm animate-pulse">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-200 rounded-lg"></div>
                            <div className="h-6 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-4 mb-6">
                        <div className="h-8 bg-blue-200 rounded-lg w-20"></div>
                        <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
                    </div>

                    {/* Job Cards */}
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-start space-x-4 flex-1">
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
                                        <div className="flex space-x-2">
                                            {[1, 2, 3].map((j) => (
                                                <div key={j} className="w-16 h-6 bg-gray-200 rounded"></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-20 h-9 bg-blue-200 rounded-lg ml-4"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Skills Snapshot - 1 column */}
                <div className="lg:col-span-1 bg-white rounded-lg p-6 shadow-sm animate-pulse">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-blue-200 rounded-lg"></div>
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                    </div>

                    {/* Skills Progress Bars */}
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    <div className="h-4 bg-gray-200 rounded w-10"></div>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeletonSections;
