// Learner Dashboard Widget - Public API

// Main Widget
export { LearnerDashboardWidget } from './ui';

// UI Components
export { default as AchievementsExpanded } from './ui/AchievementsExpanded';
export { default as AchievementsTimeline } from './ui/AchievementsTimeline';
export { ActivitySection } from './ui/ActivitySection';
export { default as AddLearningCourseModal } from './ui/AddLearningCourseModal';
export { default as AdvancedFilters } from './ui/AdvancedFilters';
export { default as AnalyticsView } from './ui/AnalyticsView';
export { default as CourseAdvancedFilters } from './ui/CourseAdvancedFilters';
export { default as Dashboard } from './ui/Dashboard';
export { default as DashboardWithSupabase } from './ui/DashboardWithSupabase';
export { default as LearnerPublicViewer } from './ui/LearnerPublicViewer';
export { default as DigitalBadges } from './ui/DigitalBadges';
export { default as DigitalPortfolioSideDrawer } from './ui/DigitalPortfolioSideDrawer';
export { default as DocumentManager } from './ui/DocumentManager';
export { default as EmployabilityScoreCard } from './ui/EmployabilityScoreCard';
export { default as Footer } from './ui/Footer';
export { generateResumePDF, preparelearnerDataForResume, RESUME_TEMPLATES } from './ui/Generateresumepdf';
export { default as Header } from './ui/Header';
export { default as HeroSection } from './ui/HeroSection';
export { default as IndustrialVisitPreview } from './ui/IndustrialVisitPreview';
export { default as IndustrialVisitsSection } from './ui/IndustrialVisitsSection';
export { default as LearningAnalyticsDashboard } from './ui/LearningAnalyticsDashboard';
export { default as LearningCoursesSection } from './ui/LearningCoursesSection';
export { default as LearningProgressBar } from './ui/LearningProgressBar';
export { LearningSection } from './ui/LearningSection';
export { default as ModernLearningCard } from './ui/ModernLearningCard';
export { default as NotificationPanel } from './ui/NotificationPanel';
export { OpportunitiesCard } from './ui/OpportunitiesCard';
export { default as OpportunityCard } from './ui/OpportunityCard';
export { default as OpportunityListItem } from './ui/OpportunityListItem';
export { default as OpportunityPreview } from './ui/OpportunityPreview';
export { default as PersonalInfoSummary } from './ui/PersonalInfoSummary';
export { default as ProfileEditSection } from './ui/ProfileEditSection';
export { default as ProfileHeroEdit } from './ui/ProfileHeroEdit';
export { ProfileSection } from './ui/ProfileSection';
export { default as RecentUpdatesCard } from './ui/RecentUpdatesCard';
export { default as RecommendedJobs } from './ui/RecommendedJobs';
export { default as ResumeParser } from './ui/ResumeParser';
export { default as SelectCourseModal } from './ui/SelectCourseModal';
export { default as SkillsDashboard } from './ui/SkillsDashboard';
export { default as SkillTrackerExpanded } from './ui/SkillTrackerExpanded';
export { default as LearnerCard3D } from './ui/LearnerCard3D';
export { default as SuggestedNextSteps } from './ui/SuggestedNextSteps';
export { default as TopSkillsInDemand } from './ui/TopSkillsInDemand';
export { default as TrainingRecommendations } from './ui/TrainingRecommendations';

// Re-export from features for FSD compliance (pages can import from widgets)
// This is a valid aggregation pattern - widgets acts as API layer
// Use public API barrel export instead of internal path
export { LearnerPublicViewer } from '@/features/learner-profile';

// Settings Components
export { default as FormField } from './ui/settings/FormField';
export { default as MainSettings } from './ui/settings/MainSettings';
export { default as NotificationsTab } from './ui/settings/NotificationsTab';
export { default as PrivacyTab } from './ui/settings/PrivacyTab';
export { default as ProfileTab } from './ui/settings/ProfileTab';
export { default as SecurityTab } from './ui/settings/SecurityTab';

// Types
export type { LearnerDashboardWidgetProps } from './model/types';
export * from './model/types';

// Mock Data
export * from './model/mockData';
