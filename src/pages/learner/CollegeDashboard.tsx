/**
 * CollegeDashboard Page Component
 * 
 * Main dashboard with real data and skeleton loaders
 */

import { useCollegeDashboard } from '@/features/learner-profile/model/useCollegeDashboard';
import DashboardSkeletonSections from './components/DashboardSkeletonSections';

const CollegeDashboard = () => {
    // Fetch dashboard data
    const {
        learningMetrics,
        isLoading,
    } = useCollegeDashboard();

    // Prepare stats data
    const statsData = {
        coursesEnrolled: learningMetrics?.coursesEnrolled || 0,
        coursesCompleted: learningMetrics?.coursesCompleted || 0,
        certificatesEarned: learningMetrics?.certificatesEarned || 0,
        learningHours: Math.round(learningMetrics?.totalLearningHours || 0),
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Dashboard Sections with real stats */}
                <DashboardSkeletonSections
                    statsData={statsData}
                    statsLoading={isLoading}
                />
            </div>
        </div>
    );
};

export default CollegeDashboard;
