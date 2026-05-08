/**
 * College Dashboard Services
 * Central export for all college management services
 */

export { userManagementService } from './userManagementService';
export { departmentService } from './departmentService';
export { curriculumService } from './curriculumService';
export { learnerAdmissionService } from './learnerAdmissionService';
export { assessmentService, timetableService } from './assessmentService';
export { markEntryService } from './markEntryService';
export { transcriptService } from './transcriptService';
export { feeManagementService } from './feeManagementService';
export { budgetManagementService } from './budgetManagementService';
export { examinationService } from './examinationService';

// Reports & Analytics Service
export { default as reportsService } from './reportsService';

// Re-export types
export type * from '@/shared/types/college';
export * from './circularService';
export * from './circularsService';
export * from './classService';
export * from './classSwapService';
export * from './clubsService';
export * from './assessmentService';
export * from './budgetManagementService';
export * from './courseMappingService';
export * from './curriculumService';
export * from './departmentService';
export * from './examinationService';
export * from './feeManagementService';
export * from './financeService';
export * from './lessonPlanService';
export * from './libraryService';
export * from './markEntryService';
export * from './reportsService';
export * from './learnerAdmissionService';
export * from './transcriptService';
export * from './userManagementService';
export * from './collegeAdminNotificationService';
export * from './collegeAssignmentService';
export * from './collegeLearnerAssignmentService';
export * from './collegeAssignmentTypes';
export * from './collegeClassService';
export * from './collegeService';
export * from './competitionsService';
export * from './csvImportService';
export * from './curriculumApprovalService';
export * from './curriculumChangeFallbackService';
export * from './curriculumChangeRequestService';
export * from './curriculumExportService';
export * from './factoryVisitsService';
export * from './facultyService';
export * from './LibraryServicetest';
export * from './mentorAllocationService';
export * from './programService';
export * from './collegeEventsService';
export * from './collegeEventRegistrationsService';
export * from './collegeTimetableSlotsService';
export * from './collegeBreaksService';
export * from './collegeTimetablesService';
export * from './collegeFacultyLeavesService';
export * from './collegeFacultySubstitutionsService';
export * from './collegeLecturersService';
export * from './organizationsService';

// ============================================
// STUB FUNCTIONS FOR BACKWARD COMPATIBILITY
// ============================================

// These functions are placeholders for missing functionality
// They should be implemented properly in their respective services

export async function getSubjects(): Promise<string[]> {
  // TODO: Implement proper subject fetching
  return ['Mathematics', 'Science', 'English', 'History', 'Geography'];
}

export async function getClasses(): Promise<string[]> {
  // TODO: Implement proper class fetching
  return ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
}

export async function getAcademicYears(): Promise<string[]> {
  // TODO: Implement proper academic year fetching
  const currentYear = new Date().getFullYear();
  return [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];
}

export async function getCurrentAcademicYear(): Promise<string> {
  // TODO: Implement proper current academic year fetching
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Academic year typically starts in July (month 6)
  if (currentMonth >= 6) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
}

// Re-export supabase for backward compatibility
export { supabase } from '@/shared/api';
