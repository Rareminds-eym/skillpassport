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
// BACKWARD COMPATIBILITY FUNCTIONS
// ============================================

import { apiPost } from '@/shared/api/apiClient';

export async function getSubjects(): Promise<string[]> {
  try {
    const result: any = await apiPost('/college-admin/academic', { action: 'get-subjects' });
    return (result?.data || []).map((s: any) => s.course_name || s.course_code || s.id);
  } catch {
    return [];
  }
}

export async function getClasses(): Promise<string[]> {
  try {
    const result: any = await apiPost('/college-admin/academic', { action: 'get-classes' });
    return (result?.data || []).map((c: any) => c.name || c.code || c.id);
  } catch {
    return [];
  }
}

export async function getAcademicYears(): Promise<string[]> {
  try {
    const result: any = await apiPost('/college-admin/academic', { action: 'get-academic-years' });
    const years = result?.data || [];
    if (years.length > 0) return years.map((y: any) => y.name);
  } catch {
    // fall through to fallback
  }
  const currentYear = new Date().getFullYear();
  return [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];
}

export async function getCurrentAcademicYear(): Promise<string> {
  try {
    const result: any = await apiPost('/college-admin/academic', { action: 'get-current-academic-year' });
    if (result?.data?.name) return result.data.name;
  } catch {
    // fall through to fallback
  }
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 6) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
}


