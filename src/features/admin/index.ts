// Admin Feature - Public API

// Types and Models
export * from './model';

// Utilities
export * from './lib';

// UI Components
export { default as AddOnAnalyticsDashboard } from './ui/AddOnAnalyticsDashboard';
export { default as AICounsellingFAB } from './ui/AICounsellingFAB';
export { default as CareerPathDrawer } from './ui/CareerPathDrawer';
export { default as Header } from './ui/Header';
export { default as KPIDashboardAdvanced } from './ui/KPIDashboardAdvanced';
export { default as NotificationPanel } from './ui/NotificationPanel';
export { default as Pagination } from './ui/Pagination';
export { default as Sidebar } from './ui/Sidebar';
export { default as StreakTestPanel } from './ui/StreakTestPanel';
export { default as LearnerProfileDrawer } from './ui/LearnerProfileDrawer';

// College Admin Components - Now exported from @/features/college-admin
// These components have been moved to the consolidated college-admin feature
// Import from @/features/college-admin instead

// Modals
export { default as AddAttendanceSessionModal } from './ui/modals/AddAttendanceSessionModal';
export { default as AttendanceDetailsModal } from './ui/modals/AttendanceDetailsModal';
export { default as CompanyStatusModal } from './ui/modals/CompanyStatusModal';
export { default as CourseDetailModal } from '@/features/courses/ui/CourseDetailModal';
export { default as CoursePurchaseModal } from './ui/modals/CoursePurchaseModal';
export { default as DocumentViewerModal } from '@/features/school-admin/ui/modals/DocumentViewerModal';
export { default as FacultyDocumentViewerModal } from './ui/modals/FacultyDocumentViewerModal';
export { default as LearnerHistoryModal } from './ui/modals/LearnerHistoryModal';

// University Admin Components - Now exported from @/features/university-ai
// These components have been moved to the consolidated university-ai feature
// Import from @/features/university-ai instead

// Services
export * from './api/adminNotificationService';
export * from './api/settingsService';
