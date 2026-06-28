import { withAuth } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiError } from '../../lib/response';

import * as coursesHandlers from './handlers/courses';
import * as assignmentsHandlers from './handlers/assignments';
import * as attendanceHandlers from './handlers/attendance';
import * as mentorHandlers from './handlers/mentor';
import * as educatorInfoHandlers from './handlers/educatorInfo';
import * as learnersHandlers from './handlers/learners';
import * as utilitiesHandlers from './handlers/utilities';
import * as assessmentHandlers from './handlers/assessment';

type ActionHandler = (params?: any, context?: AuthenticatedContext, startTime?: number) => Promise<any>;

const actionMap: Record<string, ActionHandler> = {
  // Courses
  'get-all-courses': (params, context, startTime) => coursesHandlers.handleGetAllCourses(params, context!, startTime!),
  'list-courses': (params, context, startTime) => coursesHandlers.handleGetAllCourses(params, context!, startTime!),
  'get-courses-by-school': (params, context, startTime) => coursesHandlers.handleGetCoursesBySchool(params, context!, startTime!),
  'get-courses-by-educator': (params, context, startTime) => coursesHandlers.handleGetCoursesByEducator(params, context!, startTime!),
  'get-course-full-data': (params, context, startTime) => coursesHandlers.handleGetCourseFullData(params, context!, startTime!),
  'get-course': (params, context, startTime) => coursesHandlers.handleGetCourse(params, context!, startTime!),
  'get-course-by-id': (params, context, startTime) => coursesHandlers.handleGetCourse(params, context!, startTime!),
  'fetch-course-school-id': (params, context, startTime) => coursesHandlers.handleFetchCourseSchoolId(params, context!, startTime!),
  'create-course': (params, context, startTime) => coursesHandlers.handleCreateCourse(params, context!, startTime!),
  'update-course': (params, context, startTime) => coursesHandlers.handleUpdateCourse(params, context!, startTime!),
  'delete-course': (params, context, startTime) => coursesHandlers.handleDeleteCourse(params, context!, startTime!),
  'add-module': (params, context, startTime) => coursesHandlers.handleAddModule(params, context!, startTime!),
  'add-lesson': (params, context, startTime) => coursesHandlers.handleAddLesson(params, context!, startTime!),
  'update-lesson': (params, context, startTime) => coursesHandlers.handleUpdateLesson(params, context!, startTime!),
  'delete-lesson': (params, context, startTime) => coursesHandlers.handleDeleteLesson(params, context!, startTime!),
  'add-resource': (params, context, startTime) => coursesHandlers.handleAddResource(params, context!, startTime!),
  'delete-resource': (params, context, startTime) => coursesHandlers.handleDeleteResource(params, context!, startTime!),
  'update-course-field': (params, context, startTime) => coursesHandlers.handleUpdateCourseField(params, context!, startTime!),

  // Assignments
  'get-educator-assigned-class-ids': (params, context, startTime) => assignmentsHandlers.handleGetEducatorAssignedClassIds(params, context!, startTime!),
  'create-assignment': (params, context, startTime) => assignmentsHandlers.handleCreateAssignment(params, context!, startTime!),
  'create-assignments-for-classes': (params, context, startTime) => assignmentsHandlers.handleCreateAssignmentsForClasses(params, context!, startTime!),
  'get-assignments-by-educator': (params, context, startTime) => assignmentsHandlers.handleGetAssignmentsByEducator(params, context!, startTime!),
  'get-assignment-by-id': (params, context, startTime) => assignmentsHandlers.handleGetAssignmentById(params, context!, startTime!),
  'update-assignment': (params, context, startTime) => assignmentsHandlers.handleUpdateAssignment(params, context!, startTime!),
  'delete-assignment': (params, context, startTime) => assignmentsHandlers.handleDeleteAssignment(params, context!, startTime!),
  'add-assignment-attachment': (params, context, startTime) => assignmentsHandlers.handleAddAssignmentAttachment(params, context!, startTime!),
  'remove-assignment-attachment': (params, context, startTime) => assignmentsHandlers.handleRemoveAssignmentAttachment(params, context!, startTime!),
  'assign-to-learners': (params, context, startTime) => assignmentsHandlers.handleAssignToLearners(params, context!, startTime!),
  'get-assignment-learners': (params, context, startTime) => assignmentsHandlers.handleGetAssignmentLearners(params, context!, startTime!),
  'grade-assignment': (params, context, startTime) => assignmentsHandlers.handleGradeAssignment(params, context!, startTime!),
  'get-assignment-statistics': (params, context, startTime) => assignmentsHandlers.handleGetAssignmentStatistics(params, context!, startTime!),
  'get-assignment-attachments': (params, context, startTime) => assignmentsHandlers.handleGetAssignmentAttachments(params, context!, startTime!),
  'get-attachment-by-id': (params, context, startTime) => assignmentsHandlers.handleGetAttachmentById(params, context!, startTime!),
  'get-assignment-with-attachments': (params, context, startTime) => assignmentsHandlers.handleGetAssignmentWithAttachments(params, context!, startTime!),

  // Attendance
  'get-educator-info': (params, context, startTime) => attendanceHandlers.handleGetEducatorInfo(context!, startTime!),
  'get-school-timetable-slots': (params, context, startTime) => attendanceHandlers.handleGetSchoolTimetableSlots(params, context!, startTime!),
  'get-college-attendance-sessions': (params, context, startTime) => attendanceHandlers.handleGetCollegeAttendanceSessions(params, context!, startTime!),
  'get-school-attendance-data': (params, context, startTime) => attendanceHandlers.handleGetSchoolAttendanceData(params, context!, startTime!),
  'get-class-learners-for-attendance': (params, context, startTime) => attendanceHandlers.handleGetClassLearnersForAttendance(params, context!, startTime!),
  'get-existing-attendance-records': (params, context, startTime) => attendanceHandlers.handleGetExistingAttendanceRecords(params, context!, startTime!),
  'get-college-attendance-records': (params, context, startTime) => attendanceHandlers.handleGetCollegeAttendanceRecords(params, context!, startTime!),
  'get-program-by-name': (params, context, startTime) => attendanceHandlers.handleGetProgramByName(params, context!, startTime!),
  'get-program-sections-by-criteria': (params, context, startTime) => attendanceHandlers.handleGetProgramSectionsByCriteria(params, context!, startTime!),
  'get-learners-by-program-section': (params, context, startTime) => attendanceHandlers.handleGetLearnersByProgramSection(params, context!, startTime!),
  'submit-school-attendance': (params, context, startTime) => attendanceHandlers.handleSubmitSchoolAttendance(params, context!, startTime!),
  'get-program-details': (params, context, startTime) => attendanceHandlers.handleGetProgramDetails(params, context!, startTime!),
  'get-faculty-name': (params, context, startTime) => attendanceHandlers.handleGetFacultyName(params, context!, startTime!),
  'submit-college-attendance': (params, context, startTime) => attendanceHandlers.handleSubmitCollegeAttendance(params, context!, startTime!),
  'get-timetable-slot-id': (params, context, startTime) => attendanceHandlers.handleGetTimetableSlotId(params, context!, startTime!),
  'get-school-schedule': (params, context, startTime) => attendanceHandlers.handleGetSchoolSchedule(params, context!, startTime!),
  'get-college-schedule': (params, context, startTime) => attendanceHandlers.handleGetCollegeSchedule(params, context!, startTime!),
  'process-school-slots': (params, context, startTime) => attendanceHandlers.handleProcessSchoolSlots(params, context!, startTime!),
  'start-school-attendance-session': (params, context, startTime) => attendanceHandlers.handleStartSchoolAttendanceSession(params, context!, startTime!),
  'start-college-attendance-session': (params, context, startTime) => attendanceHandlers.handleStartCollegeAttendanceSession(params, context!, startTime!),

  // Mentor Notes
  'save-mentor-note': (params, context, startTime) => mentorHandlers.handleSaveMentorNote(params, context!, startTime!),
  'get-mentor-learners': (params, context, startTime) => mentorHandlers.handleGetMentorLearners(context!, startTime!),
  'get-mentor-notes': (params, context, startTime) => mentorHandlers.handleGetMentorNotes(context!, startTime!),
  'list-mentor-notes': (params, context, startTime) => mentorHandlers.handleListMentorNotes(params, context!, startTime!),
  'update-mentor-note': (params, context, startTime) => mentorHandlers.handleUpdateMentorNote(params, context!, startTime!),

  // Educator Info
  'get-organization-by-id': (params, context, startTime) => educatorInfoHandlers.handleGetOrganizationById(params, context!, startTime!),
  'fetch-educator-school-info': (params, context, startTime) => educatorInfoHandlers.handleFetchEducatorSchoolInfo(params, context!, startTime!),
  'fetch-educator-id': (params, context, startTime) => educatorInfoHandlers.handleFetchEducatorId(params, context!, startTime!),
  'fetch-educator-by-email': (params, context, startTime) => educatorInfoHandlers.handleFetchEducatorByEmail(params, context!, startTime!),
  'get-school-educator-by-email': (params, context, startTime) => educatorInfoHandlers.handleGetSchoolEducatorByEmail(params, context!, startTime!),
  'fetch-school-educator-by-email': (params, context, startTime) => educatorInfoHandlers.handleGetSchoolEducatorByEmail(params, context!, startTime!),
  'get-school-educator-by-user-id': (params, context, startTime) => educatorInfoHandlers.handleGetSchoolEducatorByUserId(params, context!, startTime!),
  'fetch-school-educator-by-user-id': (params, context, startTime) => educatorInfoHandlers.handleGetSchoolEducatorByUserId(params, context!, startTime!),
  'get-school-educator-by-user-id-ilike': (params, context, startTime) => educatorInfoHandlers.handleGetSchoolEducatorByUserIdIlike(params, context!, startTime!),
  'get-school-educator-by-id': (params, context, startTime) => educatorInfoHandlers.handleGetSchoolEducatorById(params, context!, startTime!),
  'create-school-educator': (params, context, startTime) => educatorInfoHandlers.handleCreateSchoolEducator(params, context!, startTime!),
  'update-school-educator': (params, context, startTime) => educatorInfoHandlers.handleUpdateSchoolEducator(params, context!, startTime!),
  'update-school-educator-by-email': (params, context, startTime) => educatorInfoHandlers.handleUpdateSchoolEducatorByEmail(params, context!, startTime!),
  'delete-school-educator': (params, context, startTime) => educatorInfoHandlers.handleDeleteSchoolEducator(params, context!, startTime!),
  'list-school-educators': (params, context, startTime) => educatorInfoHandlers.handleListSchoolEducators(params, context!, startTime!),
  'get-college-lecturer-by-user-id': (params, context, startTime) => educatorInfoHandlers.handleGetCollegeLecturerByUserId(params, context!, startTime!),
  'fetch-college-lecturer-by-user-id': (params, context, startTime) => educatorInfoHandlers.handleGetCollegeLecturerByUserId(params, context!, startTime!),
  'get-university-educator-by-user-id': (params, context, startTime) => educatorInfoHandlers.handleGetUniversityEducatorByUserId(params, context!, startTime!),
  'list-organizations': (params, context, startTime) => educatorInfoHandlers.handleListOrganizations(params, context!, startTime!),
  'save-educator-profile': (params, context, startTime) => educatorInfoHandlers.handleSaveEducatorProfile(params, context!, startTime!),
  'update-educator-media': (params, context, startTime) => educatorInfoHandlers.handleUpdateEducatorMedia(params, context!, startTime!),
  'remove-educator-media': (params, context, startTime) => educatorInfoHandlers.handleRemoveEducatorMedia(params, context!, startTime!),
  'remove-experience-letter': (params, context, startTime) => educatorInfoHandlers.handleRemoveExperienceLetter(params, context!, startTime!),
  'fetch-organization-by-admin-id': (params, context, startTime) => educatorInfoHandlers.handleFetchOrganizationByAdminId(params, context!, startTime!),
  'fetch-organization-by-email': (params, context, startTime) => educatorInfoHandlers.handleFetchOrganizationByEmail(params, context!, startTime!),
  'fetch-user-by-email': (params, context, startTime) => educatorInfoHandlers.handleFetchUserByEmail(params, context!, startTime!),
  'fetch-school-classes': (params, context, startTime) => educatorInfoHandlers.handleFetchSchoolClasses(params, context!, startTime!),
  'get-educator-by-user-id': (params, context, startTime) => educatorInfoHandlers.handleGetEducatorByUserId(context!, startTime!),
  'get-educator-school-and-classes': (params, context, startTime) => educatorInfoHandlers.handleGetEducatorSchoolAndClasses(params, context!, startTime!),
  'get-curriculum-subjects': (params, context, startTime) => educatorInfoHandlers.handleGetCurriculumSubjects(params, context!, startTime!),
  'get-educator-type-by-user-id': (params, context, startTime) => educatorInfoHandlers.handleGetEducatorTypeByUserId(context!, startTime!),

  // Learners
  'get-user-by-id': (params, context, startTime) => learnersHandlers.handleGetUserById(params, context!, startTime!),
  'get-learners-by-emails': (params, context, startTime) => learnersHandlers.handleGetLearnersByEmails(params, context!, startTime!),
  'fetch-learner-projects': (params, context, startTime) => learnersHandlers.handleFetchLearnerProjects(params, context!, startTime!),
  'fetch-learner-certificates': (params, context, startTime) => learnersHandlers.handleFetchLearnerCertificates(params, context!, startTime!),
  'fetch-learners-by-ids': (params, context, startTime) => learnersHandlers.handleFetchLearnersByIds(params, context!, startTime!),
  'fetch-learners-with-filters': (params, context, startTime) => learnersHandlers.handleFetchLearnersWithFilters(params, context!, startTime!),
  'fetch-classes-by-ids': (params, context, startTime) => learnersHandlers.handleFetchClassesByIds(params, context!, startTime!),
  'get-assigned-learner-ids': (params, context, startTime) => learnersHandlers.handleGetAssignedLearnerIds(params, context!, startTime!),
  'fetch-learner-assignment-submissions': (params, context, startTime) => learnersHandlers.handleFetchLearnerAssignmentSubmissions(params, context!, startTime!),
  'fetch-learner-profiles-data': (params, context, startTime) => learnersHandlers.handleFetchLearnerProfilesData(params, context!, startTime!),
  'get-educator-learners': (params, context, startTime) => learnersHandlers.handleGetEducatorLearners(params, context!, startTime!),

  // Utilities
  'fetch-course-enrollments': (params, context, startTime) => utilitiesHandlers.handleFetchCourseEnrollments(params, context!, startTime!),
  'fetch-learner-course-progress': (params, context, startTime) => utilitiesHandlers.handleFetchLearnerCourseProgress(params, context!, startTime!),
  'list-conversations': (params, context, startTime) => utilitiesHandlers.handleListConversations(params, context!, startTime!),
  'fetch-educator-conversations': (params, context, startTime) => utilitiesHandlers.handleFetchEducatorConversations(params, context!, startTime!),
  'create-course-notification': (params, context, startTime) => utilitiesHandlers.handleCreateCourseNotification(params, context!, startTime!),
  'db-select': (params, context, startTime) => utilitiesHandlers.handleDbSelect(params, context!, startTime!),
  'db-update': (params, context, startTime) => utilitiesHandlers.handleDbUpdate(params, context!, startTime!),
  'update-educator-table': (params, context, startTime) => utilitiesHandlers.handleUpdateEducatorTable(params, context!, startTime!),
  'update-college-assignment': (params, context, startTime) => utilitiesHandlers.handleUpdateCollegeAssignment(params, context!, startTime!),
  'delete-college-assignment': (params, context, startTime) => utilitiesHandlers.handleDeleteCollegeAssignment(params, context!, startTime!),
  'get-assigned-learners': (params, context, startTime) => utilitiesHandlers.handleGetAssignedLearners(params, context!, startTime!),
  'check-club-membership': (params, context, startTime) => utilitiesHandlers.handleCheckClubMembership(params, context!, startTime!),
  'get-club-participation-report': (params, context, startTime) => utilitiesHandlers.handleGetClubParticipationReport(context!, startTime!),
  'get-competition-performance-report': (params, context, startTime) => utilitiesHandlers.handleGetCompetitionPerformanceReport(context!, startTime!),

  // Assessment
  'fetch-educator-assessment-results': (params, context, startTime) => assessmentHandlers.handleFetchEducatorAssessmentResults(context!, startTime!),
};

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  const startTime = Date.now();

  try {
    const handler = actionMap[action];
    if (!handler) {
      return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
    return await handler(params, context, startTime);
  } catch (error: any) {
    console.error(`[educator/actions] action=${action}:`, error?.message || error);
    const { apiDbError } = await import('../../lib/response');
    return apiDbError(error, context.request, { startTime });
  }
});
