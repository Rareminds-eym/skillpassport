/**
 * College Dashboard Services
 * Central export for all college management services
 */

export { userManagementService } from './userManagementService';
export { departmentService } from './departmentService';
export { curriculumService } from './curriculumService';
export { studentAdmissionService } from './studentAdmissionService';
export { assessmentService, timetableService } from './assessmentService';
export { markEntryService } from './markEntryService';
export { transcriptService } from './transcriptService';
export { feeManagementService } from './feeManagementService';
export { budgetManagementService } from './budgetManagementService';

// NEW: Examination, Finance & Library Services
export * as examinationService from './examinationService';
export * as libraryService from './libraryService';
export * as financeService from './financeService';

// Reports & Analytics Service
export { reportsService } from './reportsService';

// Re-export types
export type * from '../../types/college';
