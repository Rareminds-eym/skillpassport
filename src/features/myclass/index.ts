// MyClass Feature - Public API

// UI Components
export { default as SchoolMyClass } from './ui/SchoolMyClass';
export { default as CollegeMyClass } from './ui/CollegeMyClass';
export { default as SchoolClassHeader } from './ui/SchoolClassHeader';
export { default as CollegeClassHeader } from './ui/CollegeClassHeader';
export { default as AssignmentCard } from './ui/AssignmentCard';

// Tabs
export { default as AssignmentsTab } from './ui/tabs/AssignmentsTab';
export { default as ClassmatesTab } from './ui/tabs/ClassmatesTab';
export { default as CoCurricularsTab } from './ui/tabs/CoCurricularsTab';
export { default as ExamsTab } from './ui/tabs/ExamsTab';
export { default as OverviewTab } from './ui/tabs/OverviewTab';
export { default as ResultsTab } from './ui/tabs/ResultsTab';
export { default as TimetableViewTab } from './ui/tabs/TimetableViewTab';

// Modals
export { default as AssignmentDetailsModal } from './ui/modals/AssignmentDetailsModal';
export { default as AssignmentUploadModal } from './ui/modals/AssignmentUploadModal';
export { default as SkeletonLoaders } from './ui/modals/SkeletonLoaders';
export { default as TabNavigation } from './ui/modals/TabNavigation';

// Hooks
export { useAssignmentActions } from './model/useAssignmentActions';
export { useAssignmentsData } from './model/useAssignmentsData';
export { useClassInfo } from './model/useClassInfo';
export { useClassmatesData } from './model/useClassmatesData';
export { useNotification } from './model/useNotification';
export { useOptimizedCoCurricularsData } from './model/useOptimizedCoCurricularsData';
export { useOptimizedExamsData } from './model/useOptimizedExamsData';
export { useOverviewData } from './model/useOverviewData';
export { useTimetableData } from './model/useTimetableData';

// Utilities
export * from './lib/assignmentHelpers';
export * from './lib/dateHelpers';
export * from './lib/errorHandlers';
export * from './lib/stringHelpers';
export * from './lib/supabaseHelpers';
