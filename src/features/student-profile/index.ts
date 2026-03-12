/**
 * Student Profile Feature - Public API
 * 
 * This is the main entry point for the student profile feature.
 * Other features and pages should import from this file rather than internal modules.
 * 
 * @example
 * ```typescript
 * import { StudentProfileDrawer, useStudentProfile } from '@/features/student-profile';
 * ```
 */

// ============================================================================
// UI Components
// ============================================================================

export { StudentProfileDrawer } from './ui';
export { AdmissionNoteModal, SchoolAdmissionNoteModal, MessageModal, ExportModal } from './ui/modals';

// ============================================================================
// State Management (Domain Hooks)
// ============================================================================

export {
  useStudentProfile,
  useStudentAcademics,
  useStudentPortfolio,
  useStudentActivity,
  useStudentMessages,
  useStudentSettings
} from './model';

// ============================================================================
// API Services
// ============================================================================

export {
  studentProfileService,
  studentDocumentService
} from './api';

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  Student as StudentProfile,
  Project,
  Certificate,
  Course,
  
  // Academic types
  AssessmentResult as AcademicRecord,
  CurriculumData,
  
  // Component props
  StudentProfileDrawerProps
} from './ui/types';

export type {
  // Profile hook types
  Education,
  Experience,
  Skill,
  
  // Academic hook types
  ExamResult,
  
  // Portfolio hook types
  Training,
  
  // Activity hook types
  LearningItem,
  Achievement,
  Badge,
  RecentUpdate
} from './model';
