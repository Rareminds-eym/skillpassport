// College Admin Feature - Public API
export * from './ui';

// Default export for Header component (using educator Header)

// API & Data Access
export * from './api';

export * from './model';

// Lib utilities
export * from './lib';
export { collegeTimetablesService } from './api/collegeTimetablesService';
export { createClass } from './api/classService';
export { adminApproveSwapRequest } from './api/classSwapService';
export { autoMapHeaders } from './api/csvImportService';
export { addlearnerToClass } from './api/classService';
export { removelearnerFromProgram } from './api/programService';
export { circularService } from './api/circularService';
export { curriculumApprovalService } from './api/curriculumApprovalService';
export { getLearners } from './api/mentorAllocationService';
export { getCollegeLearnerAssignmentStats } from './api/collegeLearnerAssignmentService';
export { getDepartments } from './api/mentorAllocationService';
export { getPrograms } from './api/mentorAllocationService';
export { getCollegeLearnerClassInfo } from './api/collegeClassService';
export { collegeLecturersService } from './api/collegeLecturersService';
export { createProgramSection } from './api/programService';
export { getCollegeLecturerProgramSections } from './api/programService';
export { getAssignmentStatistics } from './api/collegeAssignmentService';
export { exportCurriculum } from './api/curriculumExportService';
export { createMentorAllocations } from './api/mentorAllocationService';
export { updateMentorNoteResponse } from './api/mentorAllocationService';
export { getMentors } from './api/mentorAllocationService';
export { collegeEventsService } from './api/collegeEventsService';
export { updateMentorAllocation } from './api/mentorAllocationService';
export { getCollegeSwapStatistics } from './api/classSwapService';
export { createMentorPeriod } from './api/mentorAllocationService';
export { useCurriculum } from './model/useCurriculum';
export { lessonPlanService } from './api/lessonPlanService';
export { escalateNote } from './api/mentorAllocationService';
export { curriculumChangeRequestService } from './api/curriculumChangeRequestService';
export { getCollegeDepartments } from './api/programService';
export { deleteAssignment } from './api/collegeAssignmentService';
export { removelearnerFromClass } from './api/classService';
export { addlearnerToProgram } from './api/programService';
export { getCollegeSwapRequestsWithDetails } from './api/classSwapService';
export { getAvailableSlotsForSwap } from './api/classSwapService';
export { createSwapRequest } from './api/classSwapService';
export { getPendingSwapCount } from './api/classSwapService';
export { organizationsService } from './api/organizationsService';
export { default as factoryVisitsService } from './api/factoryVisitsService';
export { unassignLecturerFromProgramSection } from './api/programService';
export { assignTaskToClass } from './api/classService';
export { fetchlearnerDirectory } from './api/classService';
export { collegeTimetableSlotsService } from './api/collegeTimetableSlotsService';
export { getAvailablelearnersForProgram } from './api/programService';
export { createMentorNote } from './api/mentorAllocationService';
export { collegeBreaksService } from './api/collegeBreaksService';
export { updateClass } from './api/classService';
export { getMentorPeriods } from './api/mentorAllocationService';
export { getMentorAllocations } from './api/mentorAllocationService';
export { collegeFacultyLeavesService } from './api/collegeFacultyLeavesService';
export { fetchCollegeLearnerAssignments } from './api/collegeLearnerAssignmentService';
export { fetchEducatorClasses } from './api/classService';
export { getSwapRequests } from './api/classSwapService';
export { collegeFacultySubstitutionsService } from './api/collegeFacultySubstitutionsService';
export { collegeEventRegistrationsService } from './api/collegeEventRegistrationsService';
export { resolveNote } from './api/mentorAllocationService';
export { updateMentorPeriod } from './api/mentorAllocationService';
export { getlearnersByProgramSection } from './api/programService';
export { submitCollegeAssignment } from './api/collegeLearnerAssignmentService';
export { getCollegeClassmates } from './api/collegeClassService';
export { updateCollegeLearnerAssignmentStatus } from './api/collegeLearnerAssignmentService';
export { getFaculty } from './api/facultyService';
export { findAllocationId } from './api/mentorAllocationService';
export { getMentorNotes } from './api/mentorAllocationService';
export { updateMentorNoteFeedback } from './api/mentorAllocationService';
export type { default as AssignmentFileUpload } from './ui/AssignmentFileUpload';
export { MANDATORY_FIELDS } from './api/csvImportService';
export type { default as ManageLearnersModal } from './ui/modals/ManageLearnersModal';
export type { default as ManageProgramLearnersModal } from './ui/modals/ManageProgramLearnersModal';
export type { default as AddLearnerModal } from './ui/AddLearnerModal';
export type { default as MentorResponseModal } from './ui/modals/MentorResponseModal';
export { getlearnerTypeInfo } from './api/collegeClassService';
export type { default as LearnerSelectionModal } from './ui/LearnerSelectionModal';
export { default as SwapRequestCard } from './ui/SwapRequestCard';
export { CollegeAdminNotificationService } from './api/collegeAdminNotificationService';
export type { default as SwapRequestModal } from './ui/modals/SwapRequestModal';

// Note: Learner type already exported above from mentorAllocationService
// Note: AttendanceSession and AttendanceRecord already exported above
// Note: getFacultyStatistics from facultyService
export { timetableService, assessmentService } from './api/assessmentService';
