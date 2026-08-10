/**
 * DashboardSkeleton Component
 * 
 * Skeleton placeholder component with shimmer animation for dashboard loading state.
 * Matches all 8 widget layouts from CollegeDashboard with professional loading UX.
 * 
 * **Task 17.2**: Create DashboardSkeleton loading component
 * **Validates Requirements**: 12.11, 15.7
 * 
 * @module pages/learner/components/DashboardSkeleton
 */

import React from 'react';

// ===== Reusable Skeleton Primitives =====

/**
 * SkeletonCard - Basic card shape with shimmer effect
 */
const SkeletonCard: React.FC<{ className?: string; children?: React.ReactNode }> = ({
    className = '',
    children,
}) => (
    <div
        className={`bg-white rounded-2xl shadow-md overflow-hidden ${className}`}
        role="status"
        aria-label="Loading..."
    >
        {children}
    </div>
);

/**
 * SkeletonText - Text line placeholder with shimmer
 */
const SkeletonText: React.FC<{ width?: string; height?: string; className?: string }> = ({
    width = 'w-full',
    height = 'h-4',
    className = '',
}) => (
    <div
        className={`${width} ${height} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse ${className}`}
    />
);

/**
 * SkeletonCircle - Circular avatar/icon placeholder
 */
const SkeletonCircle: React.FC<{ size?: string; className?: string }> = ({
    size = 'w-12 h-12',
    className = '',
}) => (
    <div
        className={`${size} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse ${className}`}
    />
);

/**
 * SkeletonBar - Progress bar placeholder
 */
const SkeletonBar: React.FC<{ width?: string; height?: string; className?: string }> = ({
    width = 'w-full',
    height = 'h-2',
    className = '',
}) => (
    <div className={`${width} bg-gray-100 rounded-full overflow-hidden ${className}`}>
        <div className="h-full w-3/5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse" />
    </div>
);

// ===== Widget-Specific Skeleton Components =====

/**
 * Skeleton for StudentProfileCard (Row 1, 2 cols)
 */
const StudentProfileSkeleton: React.FC = () => (
    <SkeletonCard className="p-6">
        <div className="flex items-start space-x-4">
            {/* Avatar */}
            <SkeletonCircle size="w-20 h-20" />

            {/* Profile Info */}
            <div className="flex-1 space-y-3">
                {/* Name */}
                <SkeletonText width="w-48" height="h-6" />

                {/* Email */}
                <SkeletonText width="w-64" height="h-4" />

                {/* College & Program */}
                <div className="flex items-center space-x-4">
                    <SkeletonText width="w-32" height="h-4" />
                    <SkeletonText width="w-24" height="h-4" />
                </div>

                {/* Enrollability Score */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <SkeletonText width="w-40" height="h-4" className="mb-2" />
                    <SkeletonBar height="h-3" />
                </div>
            </div>
        </div>
    </SkeletonCard>
);

/**
 * Skeleton for AchievementStats (Row 1, 1 col)
 */
const AchievementStatsSkeleton: React.FC = () => (
    <SkeletonCard className="p-6">
        <div className="space-y-6">
            {/* Header */}
            <SkeletonText width="w-32" height="h-5" />

            {/* Streak */}
            <div className="space-y-2">
                <SkeletonText width="w-24" height="h-4" />
                <SkeletonText width="w-20" height="h-8" />
            </div>

            {/* Badges */}
            <div className="space-y-2">
                <SkeletonText width="w-20" height="h-4" />
                <SkeletonText width="w-16" height="h-6" />
            </div>

            {/* Certificates */}
            <div className="space-y-2">
                <SkeletonText width="w-28" height="h-4" />
                <SkeletonText width="w-12" height="h-6" />
            </div>
        </div>
    </SkeletonCard>
);

/**
 * Skeleton for LearningMetrics (Row 2, full width with grid)
 */
const LearningMetricsSkeleton: React.FC = () => (
    <SkeletonCard className="p-6">
        {/* Header */}
        <SkeletonText width="w-40" height="h-5" className="mb-6" />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                    <SkeletonText width="w-24" height="h-4" />
                    <SkeletonText width="w-16" height="h-8" />
                    <SkeletonBar height="h-2" />
                </div>
            ))}
        </div>
    </SkeletonCard>
);

/**
 * Skeleton for CareerAITools (Row 3, full width with tool cards)
 */
const CareerAIToolsSkeleton: React.FC = () => (
    <SkeletonCard className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <SkeletonText width="w-48" height="h-5" />
            <SkeletonText width="w-24" height="h-4" />
        </div>

        {/* Tool Cards Grid - 7 tools */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div
                    key={i}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-3"
                >
                    {/* Icon */}
                    <SkeletonCircle size="w-10 h-10" />

                    {/* Tool Name */}
                    <SkeletonText width="w-full" height="h-4" />

                    {/* Description */}
                    <SkeletonText width="w-full" height="h-3" />
                    <SkeletonText width="w-3/4" height="h-3" />
                </div>
            ))}
        </div>
    </SkeletonCard>
);

/**
 * Skeleton for SkillPassportCard (Row 4, 1 col)
 */
const SkillPassportSkeleton: React.FC = () => (
    <SkeletonCard className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
            <SkeletonCircle size="w-8 h-8" />
            <SkeletonText width="w-40" height="h-5" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                    <SkeletonText width="w-20" height="h-4" />
                    <SkeletonText width="w-12" height="h-6" />
                </div>
            ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
            <SkeletonText width="w-24" height="h-9" />
            <SkeletonText width="w-32" height="h-9" />
        </div>
    </SkeletonCard>
);

/**
 * Skeleton for CurrentLearningPath (Row 4, 1 col)
 */
const CurrentLearningPathSkeleton: React.FC = () => (
    <SkeletonCard className="p-6">
        {/* Header */}
        <SkeletonText width="w-48" height="h-5" className="mb-6" />

        {/* Path Info */}
        <div className="space-y-4">
            {/* Path Name */}
            <SkeletonText width="w-full" height="h-6" />

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex justify-between">
                    <SkeletonText width="w-24" height="h-4" />
                    <SkeletonText width="w-12" height="h-4" />
                </div>
                <SkeletonBar height="h-3" />
            </div>

            {/* Module Info */}
            <SkeletonText width="w-40" height="h-4" />

            {/* Skills */}
            <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map(i => (
                    <SkeletonText key={i} width="w-16" height="h-6" />
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-4">
                <SkeletonText width="w-28" height="h-9" />
                <SkeletonText width="w-32" height="h-9" />
            </div>
        </div>
    </SkeletonCard>
);

/**
 * Skeleton for OpportunitiesWidget (Row 5, full width with job list)
 */
const OpportunitiesWidgetSkeleton: React.FC = () => (
    <SkeletonCard className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <SkeletonText width="w-48" height="h-5" />
            <SkeletonText width="w-24" height="h-4" />
        </div>

        {/* Job Opportunities List - 3 jobs */}
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div
                    key={i}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 space-y-3"
                >
                    {/* Job Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                            <SkeletonCircle size="w-12 h-12" />
                            <div className="flex-1 space-y-2">
                                <SkeletonText width="w-48" height="h-5" />
                                <SkeletonText width="w-32" height="h-4" />
                            </div>
                        </div>
                        <SkeletonText width="w-20" height="h-8" />
                    </div>

                    {/* Job Details */}
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4].map(j => (
                            <SkeletonText key={j} width="w-20" height="h-6" />
                        ))}
                    </div>

                    {/* Match Score */}
                    <div className="space-y-2">
                        <SkeletonText width="w-32" height="h-4" />
                        <SkeletonBar height="h-2" />
                    </div>
                </div>
            ))}
        </div>
    </SkeletonCard>
);

/**
 * Skeleton for SkillsSnapshot (Row 6, full width with skill list)
 */
const SkillsSnapshotSkeleton: React.FC = () => (
    <SkeletonCard className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <SkeletonText width="w-40" height="h-5" />
            <SkeletonText width="w-24" height="h-4" />
        </div>

        {/* Skills List - 5 skills */}
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div
                    key={i}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-3"
                >
                    {/* Skill Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <SkeletonCircle size="w-8 h-8" />
                            <div className="space-y-2">
                                <SkeletonText width="w-32" height="h-4" />
                                <SkeletonText width="w-24" height="h-3" />
                            </div>
                        </div>
                        <SkeletonText width="w-16" height="h-8" />
                    </div>

                    {/* Proficiency Bar */}
                    <SkeletonBar height="h-2" />
                </div>
            ))}
        </div>
    </SkeletonCard>
);

// ===== Main DashboardSkeleton Component =====

/**
 * DashboardSkeleton Component
 * 
 * Complete skeleton loading state matching CollegeDashboard layout with shimmer animations.
 * Matches all responsive breakpoints and spacing from the actual dashboard.
 */
const DashboardSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Dashboard Header Skeleton */}
                <div className="mb-8 space-y-3">
                    <SkeletonText width="w-72" height="h-10" />
                    <SkeletonText width="w-96" height="h-5" />
                </div>

                {/* Row 1: StudentProfileCard (2 cols) + AchievementStats (1 col) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* StudentProfileCard - spans 2 columns on desktop */}
                    <div className="lg:col-span-2">
                        <StudentProfileSkeleton />
                    </div>

                    {/* AchievementStats - spans 1 column */}
                    <div className="lg:col-span-1">
                        <AchievementStatsSkeleton />
                    </div>
                </div>

                {/* Row 2: LearningMetrics (full width) */}
                <div className="w-full">
                    <LearningMetricsSkeleton />
                </div>

                {/* Row 3: CareerAITools (full width) */}
                <div className="w-full">
                    <CareerAIToolsSkeleton />
                </div>

                {/* Row 4: SkillPassportCard (1 col) + CurrentLearningPath (1 col) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SkillPassportCard */}
                    <div>
                        <SkillPassportSkeleton />
                    </div>

                    {/* CurrentLearningPath */}
                    <div>
                        <CurrentLearningPathSkeleton />
                    </div>
                </div>

                {/* Row 5: OpportunitiesWidget (full width) */}
                <div className="w-full">
                    <OpportunitiesWidgetSkeleton />
                </div>

                {/* Row 6: SkillsSnapshot (full width) */}
                <div className="w-full">
                    <SkillsSnapshotSkeleton />
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
