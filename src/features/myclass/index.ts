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

export { SchoolTimetableSlot } from './ui/tabs/TimetableViewTab';

export { getTodaySchedule } from './api/studentClassService';

export { formatClubName } from './lib/stringHelpers';

export { isOverdue } from './lib/dateHelpers';

export { SchoolAchievement } from './ui/tabs/CoCurricularsTab';

export { Assignment } from './ui/AssignmentCard';

export { SchoolActivity } from './ui/tabs/CoCurricularsTab';

export { validateStorageConfig } from './lib/supabaseHelpers';

export { getClassTimetable } from './api/studentClassService';

export { AssignmentStats } from './ui/tabs/OverviewTab';

export { SchoolCertificate } from './ui/tabs/CoCurricularsTab';

export { getClassmates } from './api/studentClassService';

export { getAuthSession } from './lib/supabaseHelpers';

export { SchoolStudentResult } from './ui/tabs/ResultsTab';

export { SchoolClassInfo } from './ui/SchoolClassHeader';

export { SchoolResultStats } from './ui/tabs/ResultsTab';

export { SchoolGroupedExam } from './ui/tabs/ExamsTab';

export { SchoolClub } from './ui/tabs/CoCurricularsTab';

export { getStudentClassInfo } from './api/studentClassService';

export { getUploadErrorMessage } from './lib/errorHandlers';

export { normalizeRelation } from './lib/supabaseHelpers';

export type { Classmate } from './ui/tabs/ClassmatesTab';
export type { AdditionalInfo } from './ui/tabs/OverviewTab';
