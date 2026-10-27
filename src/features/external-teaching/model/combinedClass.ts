/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MarkCombinedLearnersInput, TeachingAttendanceStatus } from '../api/teachingApi';

// Combined class sessions: one trainer teaches the same course to several classes in one session.
// The classes are an SP Admin approved group; the college admin schedules the whole group.
/** A class of an approved group as shown to the college admin, for example "Department of Business Administration - Master of Business Administration - Finance - Sem 4 / A". */
export const approvedClassLabel = (c: { departmentName?: string | null; programName: string; specializations?: string[] | null; semester: number; section: string }): string =>
  `${c.departmentName ? `${c.departmentName} - ` : ''}${c.programName}${c.specializations?.length ? ` - ${c.specializations.join(', ')}` : ''} - Sem ${c.semester} / ${c.section}`;

/** The time slots SP Admin gave the group (the same list on every class), as "HH:MM" pairs. */
export const groupTimeSlots = (group: { classes: { timeSlots?: { start_time: string; end_time: string }[] }[] }): { start_time: string; end_time: string }[] =>
  (group.classes[0]?.timeSlots || []).map(s => ({ start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) }));

/** Students across the classes of a created combined session (each class keeps its own roster). */
export const combinedStudentTotal = (sessions: { total_learners?: number | null }[]): number =>
  sessions.reduce((sum, s) => sum + (s.total_learners || 0), 0);

/** A teaching event: a single session, or every sibling row (one per class) of a combined class session. */
export interface SessionEvent<T = any> { key: string; groupId: string | null; sessions: T[]; representative: T }

export function groupSessionEvents<T extends { id: string; combined_group_id?: string | null; program_section_id?: string | null }>(sessions: T[]): SessionEvent<T>[] {
  const events: SessionEvent<T>[] = [];
  const byGroup = new Map<string, SessionEvent<T>>();
  for (const s of sessions) {
    if (!s.combined_group_id) { events.push({ key: s.id, groupId: null, sessions: [s], representative: s }); continue; }
    let event = byGroup.get(s.combined_group_id);
    if (!event) {
      event = { key: `group:${s.combined_group_id}`, groupId: s.combined_group_id, sessions: [], representative: s };
      byGroup.set(s.combined_group_id, event);
      events.push(event);
    }
    event.sessions.push(s);
  }
  for (const event of events) {
    if (!event.groupId) continue;
    event.sessions.sort((a, b) => String(a.program_section_id).localeCompare(String(b.program_section_id)));
    event.representative = event.sessions[0];
  }
  return events;
}

/** The event that holds a session id or an event key (a session id can be given before the list has loaded). */
export const findSessionEvent = <T extends { id: string }>(events: SessionEvent<T>[], idOrKey: string): SessionEvent<T> | undefined =>
  events.find(e => e.key === idOrKey || e.sessions.some(s => s.id === idOrKey));

export const eventSessionStatus = (event: SessionEvent<{ status?: string | null }>): string => {
  const statuses = new Set(event.sessions.map(s => s.status));
  return statuses.size === 1 ? String([...statuses][0]) : 'ongoing';
};

export const eventSessionLabel = (event: SessionEvent<any>, single: (session: any) => string): string => {
  if (!event.groupId) return single(event.representative);
  const s = event.representative;
  return `${s.date} ${s.start_time} · ${s.subject_name} · ${s.faculty_name} · Combined: ${event.sessions.length} classes, ${combinedStudentTotal(event.sessions)} students (${eventSessionStatus(event)})`;
};

export interface GroupClassRoster { sessionId: string; version: number; attendanceRevision: number; learnerIds: string[] }

/**
 * One marking request for the whole group: each class keeps its own version and revision and only its own students.
 * Classes with nothing to save are left out; returns null when no student has a status.
 */
export function combinedMarkPayload(groupId: string, classes: GroupClassRoster[], statusByLearner: Record<string, string | undefined>): MarkCombinedLearnersInput | null {
  const sessions = classes.map(c => ({
    sessionId: c.sessionId, version: c.version, attendanceRevision: c.attendanceRevision,
    records: c.learnerIds.filter(id => statusByLearner[id]).map(learnerId => ({ learnerId, status: statusByLearner[learnerId] as TeachingAttendanceStatus })),
  })).filter(c => c.records.length);
  return sessions.length ? { groupId, sessions } : null;
}
