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
export { addStudentToClass } from './api/classService';
export { removeStudentFromProgram } from './api/programService';
export { circularService } from './api/circularService';
export { curriculumApprovalService } from './api/curriculumApprovalService';
export { getStudents } from './api/mentorAllocationService';
export { getCollegeStudentAssignmentStats } from './api/collegeStudentAssignmentService';
export { getDepartments } from './api/mentorAllocationService';
export { getPrograms } from './api/mentorAllocationService';
export { getCollegeStudentClassInfo } from './api/collegeClassService';
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
export { removeStudentFromClass } from './api/classService';
export { addStudentToProgram } from './api/programService';
export { getCollegeSwapRequestsWithDetails } from './api/classSwapService';
export { getAvailableSlotsForSwap } from './api/classSwapService';
export { createSwapRequest } from './api/classSwapService';
export { getPendingSwapCount } from './api/classSwapService';
export { organizationsService } from './api/organizationsService';
export { default as factoryVisitsService } from './api/factoryVisitsService';
export { unassignLecturerFromProgramSection } from './api/programService';
export { assignTaskToClass } from './api/classService';
export { fetchStudentDirectory } from './api/classService';
export { collegeTimetableSlotsService } from './api/collegeTimetableSlotsService';
export { getAvailableStudentsForProgram } from './api/programService';
export { createMentorNote } from './api/mentorAllocationService';
export { collegeBreaksService } from './api/collegeBreaksService';
export { updateClass } from './api/classService';
export { getMentorPeriods } from './api/mentorAllocationService';
export { getMentorAllocations } from './api/mentorAllocationService';
export { collegeFacultyLeavesService } from './api/collegeFacultyLeavesService';
export { fetchCollegeStudentAssignments } from './api/collegeStudentAssignmentService';
export { fetchEducatorClasses } from './api/classService';
export { getSwapRequests } from './api/classSwapService';
export { collegeFacultySubstitutionsService } from './api/collegeFacultySubstitutionsService';
export { collegeEventRegistrationsService } from './api/collegeEventRegistrationsService';
export { resolveNote } from './api/mentorAllocationService';
export { updateMentorPeriod } from './api/mentorAllocationService';
export { getStudentsByProgramSection } from './api/programService';
export { submitCollegeAssignment } from './api/collegeStudentAssignmentService';
export { getCollegeClassmates } from './api/collegeClassService';
export { updateCollegeStudentAssignmentStatus } from './api/collegeStudentAssignmentService';
export { getFaculty } from './api/facultyService';
export { findAllocationId } from './api/mentorAllocationService';
export { getMentorNotes } from './api/mentorAllocationService';
export { updateMentorNoteFeedback } from './api/mentorAllocationService';
export type { default as AssignmentFileUpload } from './ui/AssignmentFileUpload';
export { MANDATORY_FIELDS } from './api/csvImportService';
export type { default as ManageStudentsModal } from './ui/modals/ManageStudentsModal';
export type { default as ManageProgramStudentsModal } from './ui/modals/ManageProgramStudentsModal';
export type { default as AddStudentModal } from './ui/AddStudentModal';
export type { default as MentorResponseModal } from './ui/modals/MentorResponseModal';
export { getStudentTypeInfo } from './api/collegeClassService';
export type { default as StudentSelectionModal } from './ui/StudentSelectionModal';
export { default as SwapRequestCard } from './ui/SwapRequestCard';
export { CollegeAdminNotificationService } from './api/collegeAdminNotificationService';
export type { default as SwapRequestModal } from './ui/modals/SwapRequestModal';

// Note: Student type already exported above from mentorAllocationService
// Note: AttendanceSession and AttendanceRecord already exported above
// Note: getFacultyStatistics from facultyService
export { timetableService, assessmentService } from './api/assessmentService';
