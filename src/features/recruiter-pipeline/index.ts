// Recruiter Pipeline Feature - Public API

// UI Components
export { ActivityIndicators } from './ui/ActivityIndicators';
export { default as AdvancedFilters } from './ui/AdvancedFilters';
export { default as AdvancedRequisitionFilters } from './ui/AdvancedRequisitionFilters';
export { default as AdvancedShortlistFilters } from './ui/AdvancedShortlistFilters';
export { default as CandidateProfile } from './ui/CandidateProfile';
export { default as CandidateProfileDrawer } from './ui/CandidateProfileDrawer';
export { CandidateQuickView } from './ui/CandidateQuickView';
export { default as DateRangePicker } from './ui/DateRangePicker';
export { PipelineEmptyState as EmptyState } from './ui/EmptyState';
export { default as Header } from './ui/Header';
export { CandidateCardSkeleton, ColumnLoadingSkeleton, PipelineLoadingSkeleton as LoadingSkeleton } from './ui/LoadingSkeleton';
export { default as MobileTabBar } from './ui/MobileTabBar';
export { default as NotificationPanel } from './ui/NotificationPanel';
export { default as PipelineAdvancedFilters } from './ui/PipelineAdvancedFilters';
export { default as PipelineSortMenu } from './ui/PipelineSortMenu';
export type { PipelineStats } from './ui/PipelineStats';
export { default as Sidebar } from './ui/Sidebar';

// Modals
export { default as AddToShortlistModal } from './ui/modals/AddToShortlistModal';
export { default as DiversityExportModal } from './ui/modals/DiversityExportModal';
export { default as ScheduleInterviewModal } from './ui/modals/ScheduleInterviewModal';

// Pipeline Components
export { default as AddFromTalentPoolModal } from './ui/pipeline/AddFromTalentPoolModal';
export { default as AIRecommendedColumn } from './ui/pipeline/AIRecommendedColumn';
export { default as CandidateCard } from './ui/pipeline/CandidateCard';
export { default as KanbanColumn } from './ui/pipeline/KanbanColumn';
export { default as NextActionModal } from './ui/pipeline/NextActionModal';
export { default as PipelineBulkActionsBar } from './ui/pipeline/PipelineBulkActionsBar';
export { default as PipelineHeader } from './ui/pipeline/PipelineHeader';
export { default as PipelineQuickFilters } from './ui/pipeline/PipelineQuickFilters';
export * from './ui/pipeline/types';

// Services
export * from './api/skillsAnalyticsService';
export { default as FloatingRecruiterAIButton } from '@/shared/ui/FloatingRecruiterAIButton';

export { addCandidateToPipeline } from './api/pipelineService';

export { updateNextAction } from './api/pipelineService';
