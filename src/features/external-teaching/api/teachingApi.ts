import { apiPost } from '@/shared/api/apiClient';
export async function teaching(action:string,payload:Record<string,unknown>={}):Promise<any>{
  const result=await apiPost<{data:any}>('/teaching/actions',{action,payload});return result.data;
}

// Combined class sessions: one session row per class, rows of one combined class share combined_group_id.
// Payloads follow functions/lib/teaching-contract.ts. Trainer swap is not offered for combined sessions.
export type TeachingAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export interface CombinedSessionRow {
  id: string; combined_group_id: string; program_section_id: string; staff_assignment_id: string; organization_staff_id: string;
  date: string; start_time: string; end_time: string; status: string; version: number; attendance_revision: number;
  total_learners: number | null; subject_name: string; program_name: string; semester: number; section: string;
  [column: string]: unknown;
}
export interface CombinedSessionVersion { sessionId: string; version: number }
export interface CombinedGroupInput { groupId: string; sessions: CombinedSessionVersion[] }
export interface ApprovedCombinedClass {
  mappingId: string; mappingVersion: number; sectionId: string; departmentName: string | null; programName: string; specializations: string[] | null;
  semester: number; section: string; academicYear: string | null; startDate: string | null; endDate: string | null;
  timeSlots: { start_time: string; end_time: string }[];
}
/** A combined group defined by SP Admin (the approved classes of one external trainer for one course). */
export interface ApprovedCombinedGroup { groupId: string; staffId: string; staffName: string; courseId: string; courseTitle: string; classes: ApprovedCombinedClass[] }
export interface CreateCombinedSessionInput {
  approvedGroupId: string;
  mappings: { mappingId: string; mappingVersion: number }[]; courseId: string; date: string; startTime: string; endTime: string;
  requestId: string; room?: string; remarks?: string;
}
export interface CancelCombinedSessionInput extends CombinedGroupInput { reason: string }
export interface ReplaceCombinedSessionInput extends CombinedGroupInput { mappingIds: string[]; reason: string }
export interface MarkCombinedStaffInput extends CombinedGroupInput { status: TeachingAttendanceStatus; reason: string }
export interface CombinedClassMarks {
  sessionId: string; version: number; attendanceRevision: number; records: { learnerId: string; status: TeachingAttendanceStatus }[];
}
export interface MarkCombinedLearnersInput { groupId: string; sessions: CombinedClassMarks[] }
export interface CombinedSessionsResult { groupId: string; sessions: CombinedSessionRow[] }

export const listApprovedCombinedGroups = (input: { collegeId: string; date: string }): Promise<ApprovedCombinedGroup[]> => teaching('combined_groups', { ...input });
export const createCombinedSession = (input: CreateCombinedSessionInput): Promise<CombinedSessionsResult> => teaching('create_combined_session', { ...input });
export const cancelCombinedSession = (input: CancelCombinedSessionInput): Promise<{ cancelled: true; groupId: string; count: number }> => teaching('cancel_combined_session', { ...input });
export const replaceCombinedSession = (input: ReplaceCombinedSessionInput): Promise<{ updated: true; groupId: string }> => teaching('replace_combined_session', { ...input });
export const markCombinedStaff = (input: MarkCombinedStaffInput): Promise<{ updated: true; groupId: string }> => teaching('mark_combined_staff', { ...input });
export const markCombinedLearners = (input: MarkCombinedLearnersInput): Promise<{ updated: true } & CombinedSessionsResult> => teaching('mark_combined_learners', { ...input });
