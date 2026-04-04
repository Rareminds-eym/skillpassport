// Educator Feature - Public API

// UI Components
export { default as AddLessonModal } from './ui/AddLessonModal';
export { default as AssignEducatorModal } from './ui/AssignEducatorModal';
export { default as AssignmentFileUpload } from './ui/AssignmentFileUpload';
export { default as AssignTaskModal } from './ui/AssignTaskModal';
export { default as CourseCard } from './ui/CourseCard';
export { default as CourseDetailDrawer } from './ui/CourseDetailDrawer';
export { default as CourseFilters } from './ui/CourseFilters';
export { default as CourseProgressAnalytics } from './ui/CourseProgressAnalytics';
export { default as CreateCourseModal } from './ui/CreateCourseModal';
export { default as CSVImportPreview } from './ui/CSVImportPreview';
export { default as GradingModal } from './ui/GradingModal';
export { default as Header } from './ui/Header';
export { default as InterventionResponseModal } from './ui/InterventionResponseModal';
export { default as KPICard } from './ui/KPICard';
export { default as ManageProgramStudentsModal } from './ui/ManageProgramStudentsModal';
export { default as ManageStudentsModal } from './ui/ManageStudentsModal';
export { default as MentorResponseModal } from './ui/MentorResponseModal';
export { default as NotificationPanel } from './ui/NotificationPanel';
export { default as Pagination } from './ui/Pagination';
export { default as ResourceUploadComponent } from './ui/ResourceUploadComponent';
export { default as Sidebar } from './ui/Sidebar';
export { default as StudentProfileDrawer } from './ui/StudentProfileDrawer';
export { default as StudentSelectionModal } from './ui/StudentSelectionModal';
export { default as FloatingEducatorAIButton } from './ui/FloatingEducatorAIButton';

// Modals
export { default as AddStudentModal } from './ui/modals/Addstudentmodal';
export { default as AddToShortlistModal } from './ui/modals/AddToShortlistModal';
export { default as BulkDeleteStudentsModal } from './ui/modals/BulkDeleteStudentsModal';
export { default as CSVImportModal } from './ui/modals/CSVImportModal';
export { default as DeleteStudentModal } from './ui/modals/DeleteStudentModal';
export { default as DiversityExportModal } from './ui/modals/DiversityExportModal';
export { default as EditStudentModal } from './ui/modals/EditStudentModal';
export { default as ScheduleInterviewModal } from './ui/modals/ScheduleInterviewModal';

// Teacher Components
export { default as SwapRequestCard } from './ui/teacher/SwapRequestCard';
export { default as SwapRequestModal } from './ui/teacher/SwapRequestModal';

// Hooks
export { useEducatorSchool } from './model/useEducatorSchool';
export * from './model/useEducatorId';
export * from './model/useEducatorMessages';
export * from './model/useEducatorAdminMessages';
export * from './model/useCollegeEducatorAdminConversations';
export * from './model/useCollegeEducatorAdminMessages';
export * from './model/useDiversityData';
export * from './model/useGeographicDistribution';
export * from './model/useQualityMetrics';
export * from './model/useTopHiringColleges';

// Services
export * from './api/fileUploadService';
export { getAssignmentStudents, gradeAssignment } from './api/assignmentsService';
export { addResource, deleteResource, addLesson, updateLesson, deleteLesson, getAllCourses, getCoursesByEducator, createCourse, updateCourse, deleteCourse } from './api/coursesService';
export * from './api/mentorNotes';
export * from './api/dashboardApi';

// Mock data / models
export { SKILL_CATEGORIES, CLASSES } from './model/mockCourses';
export { Class, mockClasses } from './model/mockClasses';
export { Activity, mockActivities } from './model/mockActivities';
export { mockStudents, Student } from './model/mockStudents';
export { MediaAsset, mockMediaAssets } from './model/mockMedia';
