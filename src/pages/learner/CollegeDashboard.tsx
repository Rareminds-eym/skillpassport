/**
 * CollegeDashboard Page Component
 * 
 * Main dashboard page for college students that assembles all 8 widgets
 * in a responsive grid layout. Uses the useLearnerDashboard() hook to
 * fetch all necessary data in parallel and passes it to individual widgets.
 * 
 * **Task 17.1**: Create CollegeDashboard page component
 * **Task 25.1**: Performance optimizations - lazy loading, useCallback for handlers
 * **Validates Requirements**: 1.1-1.10, 2.1-2.5, 3.1-3.8, 4.1-4.11, 5.1-5.9, 6.1-6.9, 7.1-7.9, 8.1-8.8, 15.1-15.3, 16.1-16.6, 16.10
 * 
 * @module pages/learner/CollegeDashboard
 */

import React, { Suspense, useCallback, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollegeDashboard } from '@/features/learner-profile/model/useCollegeDashboard';

// Lazy load widgets for performance (Requirement 16.10)
const StudentProfileCard = lazy(() => import('@/widgets/learner-dashboard/ui/StudentProfileCard'));
const AchievementStats = lazy(() => import('@/widgets/learner-dashboard/ui/AchievementStats'));
const LearningMetrics = lazy(() => import('@/widgets/learner-dashboard/ui/LearningMetrics'));
const CareerAITools = lazy(() => import('@/widgets/learner-dashboard/ui/CareerAITools'));
const SkillPassportCard = lazy(() => import('@/widgets/learner-dashboard/ui/SkillPassportCard'));
const CurrentLearningPath = lazy(() => import('@/widgets/learner-dashboard/ui/CurrentLearningPath'));
const OpportunitiesWidget = lazy(() => import('@/widgets/learner-dashboard/ui/OpportunitiesWidget'));
const SkillsSnapshot = lazy(() => import('@/widgets/learner-dashboard/ui/SkillsSnapshot'));

import type {
    StudentProfileCardProps,
    AchievementStatsProps,
    LearningMetricsProps,
    CareerAIToolsProps,
    SkillPassportCardProps,
    CurrentLearningPathProps,
    OpportunitiesWidgetProps,
    SkillsSnapshotProps,
    SkillMetric,
} from '@/widgets/learner-dashboard/model/types';
import { CAREER_TOOLS } from '@/entities/opportunity/model/types';
import DashboardSkeleton from './components/DashboardSkeleton';
import ErrorState from './components/ErrorState';

/**
 * CollegeDashboard Component
 * 
 * **Layout Structure:**
 * - Row 1: StudentProfileCard (2 cols) + AchievementStats (1 col)
 * - Row 2: LearningMetrics (full width)
 * - Row 3: CareerAITools (full width)
 * - Row 4: SkillPassportCard (1 col) + CurrentLearningPath (1 col)
 * - Row 5: OpportunitiesWidget (full width)
 * - Row 6: SkillsSnapshot (full width)
 * 
 * **Responsive Breakpoints:**
 * - Mobile (< 768px): 1 column layout
 * - Tablet (768px - 1024px): 2 column layout
 * - Desktop (>= 1024px): 3 column layout
 */
const CollegeDashboard: React.FC = () => {
    const navigate = useNavigate();

    // Fetch all dashboard data using the composite hook
    const {
        profile,
        courses,
        skills,
        opportunities,
        achievements,
        learningPath,
        enrollabilityScore,
        learningMetrics,
        skillHealth,
        matchedJobs,
        isLoading,
        error,
        refresh,
    } = useCollegeDashboard();

    // ===== Navigation Callbacks (memoized for performance - Requirement 16.4) =====

    const handleViewProfile = useCallback(() => {
        console.log('Navigate to profile page');
        navigate('/learner/profile');
    }, [navigate]);

    const handleViewAchievements = useCallback(() => {
        console.log('Navigate to achievements page');
        navigate('/learner/achievements');
    }, [navigate]);

    const handleViewCourses = useCallback(() => {
        console.log('Navigate to courses page');
        navigate('/learner/courses');
    }, [navigate]);

    const handleToolSelect = useCallback((toolId: string) => {
        console.log('Tool selected:', toolId);
        // Navigation is handled internally by CareerAITools widget
    }, []);

    const handleUpskill = useCallback(() => {
        console.log('Navigate to upskill resources');
        navigate('/learner/skills/improve');
    }, [navigate]);

    const handleViewDetails = useCallback(() => {
        console.log('Navigate to digital portfolio');
        navigate('/learner/portfolio');
    }, [navigate]);

    const handleContinue = useCallback(() => {
        console.log('Continue learning current path');
        if (learningPath) {
            navigate(`/learner/learning-path/${learningPath.id}/continue`);
        }
    }, [navigate, learningPath]);

    const handleChangePath = useCallback(() => {
        console.log('Navigate to learning paths selection');
        navigate('/learner/learning-paths');
    }, [navigate]);

    const handleViewAllOpportunities = useCallback(() => {
        console.log('Navigate to all opportunities');
        navigate('/learner/opportunities');
    }, [navigate]);

    const handleApply = useCallback((opportunityId: string) => {
        console.log('Apply to opportunity:', opportunityId);
        navigate(`/learner/opportunities/${opportunityId}/apply`);
    }, [navigate]);

    const handleViewAllSkills = useCallback(() => {
        console.log('Navigate to all skills');
        navigate('/learner/skills');
    }, [navigate]);

    const handleImproveSkill = useCallback((skillId: string) => {
        console.log('Navigate to skill improvement:', skillId);
        navigate(`/learner/skills/${skillId}/improve`);
    }, [navigate]);

    // ===== Loading State =====
    if (isLoading) {
        return <DashboardSkeleton />;
    }

    // ===== Error State =====
    if (error) {
        return <ErrorState error={error} onRetry={refresh} />;
    }

    // ===== Prepare Widget Props =====

    // 1. StudentProfileCard Props
    const studentProfileProps: StudentProfileCardProps | null = profile
        ? {
            learnerData: {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar,
                collegeId: profile.collegeId,
                collegeName: profile.collegeName,
                linkRangeId: profile.linkRangeId,
                program: profile.program,
                semester: profile.semester,
                enrollabilityScore: enrollabilityScore?.score || 0,
                grade: profile.grade,
            },
            onViewProfile: handleViewProfile,
        }
        : null;

    // 2. AchievementStats Props
    const achievementStatsProps: AchievementStatsProps | null = achievements
        ? {
            stats: {
                streak: achievements.currentStreak || 0,
                streakBest: achievements.longestStreak,
                badges: achievements.badges?.length || 0,
                badgesTotal: achievements.totalBadgesAvailable,
                certificates: achievements.certificates?.length || 0,
                lastActivity: achievements.lastActivity,
            },
            onViewAchievements: handleViewAchievements,
        }
        : null;

    // 3. LearningMetrics Props
    const learningMetricsProps: LearningMetricsProps | null = learningMetrics
        ? {
            metrics: {
                coursesEnrolled: learningMetrics.coursesEnrolled,
                coursesCompleted: learningMetrics.coursesCompleted,
                certificatesEarned: learningMetrics.certificatesEarned,
                learningHours: learningMetrics.learningHours,
                courseCompletionRate: learningMetrics.courseCompletionRate,
                inProgressCount: learningMetrics.inProgressCount,
                notStartedCount: learningMetrics.notStartedCount,
            },
            onViewCourses: handleViewCourses,
        }
        : null;

    // 4. CareerAITools Props
    const careerAIToolsProps: CareerAIToolsProps = {
        tools: CAREER_TOOLS,
        onToolSelect: handleToolSelect,
        userAccess: {
            hasAIAccess: profile?.hasAIAccess || false,
            remainingCredits: profile?.aiCredits,
            planType: profile?.subscriptionPlan || 'free',
        },
    };

    // 5. SkillPassportCard Props
    const skillPassportProps: SkillPassportCardProps | null = profile && skills
        ? {
            passport: {
                verifiedSkills: profile.verifiedSkillsCount || 0,
                skillScore: profile.skillScore || 0,
                certificates: achievements?.certificates?.length || 0,
                verificationStatus: profile.verificationStatus || 'none',
                lastVerified: profile.lastVerified,
                skills: skills.map(skill => ({
                    name: skill.name,
                    proficiency: skill.proficiency || 0,
                })),
            },
            onUpskill: handleUpskill,
            onViewDetails: handleViewDetails,
        }
        : null;

    // 6. CurrentLearningPath Props
    const currentLearningPathProps: CurrentLearningPathProps = {
        path: learningPath
            ? {
                id: learningPath.id,
                name: learningPath.name,
                progress: learningPath.progress,
                currentModule: learningPath.currentModule,
                totalModules: learningPath.totalModules,
                completedModules: learningPath.completedModules,
                estimatedCompletion: learningPath.estimatedCompletion,
                skills: learningPath.skills || [],
            }
            : null,
        onContinue: handleContinue,
        onChangePath: handleChangePath,
    };

    // 7. OpportunitiesWidget Props
    const opportunitiesProps: OpportunitiesWidgetProps = {
        opportunities: opportunities || [],
        matchedJobs: matchedJobs || [],
        onViewAll: handleViewAllOpportunities,
        onApply: handleApply,
    };

    // 8. SkillsSnapshot Props
    const skillsSnapshotProps: SkillsSnapshotProps | null = skills
        ? {
            skills: skills.map(
                (skill): SkillMetric => ({
                    id: skill.id,
                    name: skill.name,
                    category: skill.category || 'technical',
                    proficiency: skill.proficiency || 0,
                    lastAssessed: skill.lastAssessed,
                    assessmentSource: skill.assessmentSource || 'self',
                    trend: skill.trend || 'stable',
                    recommendations: skill.recommendations,
                })
            ),
            onViewAll: handleViewAllSkills,
            onImproveSkill: handleImproveSkill,
        }
        : null;

    // ===== Main Dashboard Render =====
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Dashboard Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        Welcome back, {profile?.name?.split(' ')[0] || 'Student'}!
                    </h1>
                    <p className="text-gray-600">
                        Here's your learning progress and opportunities
                    </p>
                </div>

                {/* Row 1: StudentProfileCard (2 cols) + AchievementStats (1 col) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* StudentProfileCard - spans 2 columns on desktop */}
                    <div className="lg:col-span-2">
                        <Suspense fallback={<DashboardSkeleton />}>
                            {studentProfileProps && <StudentProfileCard {...studentProfileProps} />}
                        </Suspense>
                    </div>

                    {/* AchievementStats - spans 1 column */}
                    <div className="lg:col-span-1">
                        <Suspense fallback={<DashboardSkeleton />}>
                            {achievementStatsProps && <AchievementStats {...achievementStatsProps} />}
                        </Suspense>
                    </div>
                </div>

                {/* Row 2: LearningMetrics (full width) */}
                <div className="w-full">
                    <Suspense fallback={<DashboardSkeleton />}>
                        {learningMetricsProps && <LearningMetrics {...learningMetricsProps} />}
                    </Suspense>
                </div>

                {/* Row 3: CareerAITools (full width) */}
                <div className="w-full">
                    <Suspense fallback={<DashboardSkeleton />}>
                        <CareerAITools {...careerAIToolsProps} />
                    </Suspense>
                </div>

                {/* Row 4: SkillPassportCard (1 col) + CurrentLearningPath (1 col) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SkillPassportCard */}
                    <div>
                        <Suspense fallback={<DashboardSkeleton />}>
                            {skillPassportProps && <SkillPassportCard {...skillPassportProps} />}
                        </Suspense>
                    </div>

                    {/* CurrentLearningPath */}
                    <div>
                        <Suspense fallback={<DashboardSkeleton />}>
                            <CurrentLearningPath {...currentLearningPathProps} />
                        </Suspense>
                    </div>
                </div>

                {/* Row 5: OpportunitiesWidget (full width) */}
                <div className="w-full">
                    <Suspense fallback={<DashboardSkeleton />}>
                        <OpportunitiesWidget {...opportunitiesProps} />
                    </Suspense>
                </div>

                {/* Row 6: SkillsSnapshot (full width) */}
                <div className="w-full">
                    <Suspense fallback={<DashboardSkeleton />}>
                        {skillsSnapshotProps && <SkillsSnapshot {...skillsSnapshotProps} />}
                    </Suspense>
                </div>
            </div>
        </div>
    );
};

export default CollegeDashboard;
