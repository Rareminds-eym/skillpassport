/**
 * Dashboard Skeleton Sections Component
 * 
 * Skeleton loaders for all dashboard sections matching the exact layout from the design
 */

import StatsCards from './StatsCards';
import AssessmentSection from './AssessmentSection';
import SkillPassportSection from './SkillPassportSection';
import RecommendedCoursesSection from './RecommendedCoursesSection';
import CurrentLearningPathSection from './CurrentLearningPathSection';
import CourseCompletionSection from './CourseCompletionSection';
import OpportunitiesSection from './OpportunitiesSection';
import SkillsSnapshotSection from './SkillsSnapshotSection';

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
                <div className="lg:col-span-2">
                    <CurrentLearningPathSection />
                </div>

                {/* Course Completion - 1 column */}
                <div className="lg:col-span-1">
                    <CourseCompletionSection />
                </div>
            </div>

            {/* Row 4: Opportunities & Skills Snapshot - 2/3 + 1/3 layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Opportunities - 2 columns */}
                <div className="lg:col-span-2">
                    <OpportunitiesSection />
                </div>

                {/* Skills Snapshot - 1 column */}
                <div className="lg:col-span-1">
                    <SkillsSnapshotSection />
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeletonSections;
