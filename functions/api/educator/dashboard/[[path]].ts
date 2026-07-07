import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getContextUser, withAuth, type AuthUser } from '../../../lib/auth';
import { apiError, apiSuccess } from '../../../lib/response';
import { ADMIN_ROLES } from '../../../lib/roleCategories';
import { resolveSchoolRole } from '../../../lib/schoolRole';
import { getServiceClient } from '../../../lib/supabase';

interface EducatorInfo {
  user: { id: string; email: string; roles?: string[] };
  educatorData: { id: string; school_id: string; role: string };
  educatorType: 'school' | 'college';
  assignedClassIds: string[];
}

interface ActivityApprovalRow {
  approval_status: string | null;
}

interface DashboardKPIs {
  totallearners: number;
  activelearners: number;
  pendingActivities: number;
  verifiedActivities: number;
  totalActivities: number;
  verificationRate: number;
  recentActivitiesCount: number;
  totalMentorNotes: number;
}

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  learnerName: string;
  category: string;
  status: 'pending' | 'sent_to_admin' | 'approved' | 'rejected';
  submittedDate: string;
}

interface SkillAnalytics {
  skillParticipation: { skill: string; count: number }[];
  skillDistribution: { category: string; count: number }[];
}

// `isAdmin` only WIDENS data scope (admins see all learners in scope; educators
// see their assigned classes). This endpoint is gated by educator registration
// (`getAuthenticatedEducator` throws otherwise), NOT by an admin guard — so the
// role check uses the shared ADMIN_ROLES group (non-guard), replacing the prior
// local inline literal (bug §7.1).
function isAdmin(user: { roles?: string[] }): boolean {
  return user?.roles?.some((r: string) => ADMIN_ROLES.includes(r)) ?? false;
}

function sanitizeFilterValue(val: unknown): string {
  const s = String(val);
  if (!/^[\w\s-]+$/.test(s)) {
    throw new Error(`Invalid filter value: ${JSON.stringify(s)}`);
  }
  return s;
}

function zeroKPIs(): DashboardKPIs {
  return { totallearners: 0, activelearners: 0, pendingActivities: 0, verifiedActivities: 0, totalActivities: 0, verificationRate: 0, recentActivitiesCount: 0, totalMentorNotes: 0 };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function getAuthenticatedEducator(supabase: SupabaseClient, user: AuthUser): Promise<EducatorInfo> {
  const admin = isAdmin(user);

  // SCHOOL-INTERNAL data-scope read (task 12.2/19; finalized in P4 task 22.3). This row
  // supplies `id` and `school_id` only (data `resolveSchoolRole` does NOT return), used below
  // to scope class assignments and learner queries.
  //
  // `school_educators.role` is NO LONGER read here (task 22.3 — authority de-shadowing). The
  // school-wide-scope decision derives ENTIRELY from the verified JWT via `isAdmin(user)`:
  // the `school_educators.role` CHECK constraint permits only
  // {school_admin, principal, it_admin, class_teacher, subject_teacher} — never the legacy
  // `'admin'` literal the old `role !== 'admin'` clause compared against — so that comparison
  // was always true for the school path and contributed nothing beyond `!admin`. The synthetic
  // `educatorData.role` returned below is fixed to a non-`'admin'` sentinel so the downstream
  // `educatorData.role === 'admin'` data-scope checks keep their exact (school-path) outcomes
  // without consulting the shadow store (CC-2: authorization stays on the JWT).
  const { data: schoolEducatorData } = await supabase
    .from('school_educators')
    .select('id, school_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (schoolEducatorData?.school_id) {
    let assignedClassIds: string[] = [];
    if (!admin) {
      const { data: classAssignments } = await supabase
        .from('school_educator_class_assignments')
        .select('class_id')
        .eq('educator_id', schoolEducatorData.id);
      if (classAssignments) {
        assignedClassIds = classAssignments.map(a => a.class_id);
      }
    }
    return {
      user: user as any,
      educatorData: { id: schoolEducatorData.id, school_id: schoolEducatorData.school_id, role: 'educator' },
      educatorType: 'school',
      assignedClassIds,
    };
  }

  const { data: collegeLecturerData } = await supabase
    .from('college_lecturers')
    .select('id, collegeId, department')
    .eq('user_id', user.id)
    .maybeSingle();

  if (collegeLecturerData?.collegeId) {
    const isCollegeAdmin = admin || collegeLecturerData.department === 'Administration';
    let assignedCourseIds: string[] = [];
    if (!isCollegeAdmin) {
      const { data: courseAssignments } = await supabase
        .from('college_course_mappings')
        .select('course_id')
        .eq('faculty_id', collegeLecturerData.id);
      if (courseAssignments) {
        assignedCourseIds = courseAssignments.map(a => a.course_id);
      }
    }
    return {
      user: user as any,
      educatorData: { id: collegeLecturerData.id, school_id: collegeLecturerData.collegeId, role: isCollegeAdmin ? 'admin' : 'lecturer' },
      educatorType: 'college',
      assignedClassIds: assignedCourseIds,
    };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Identity/scoping fallback (task 12.2/19): the educator-TYPE branch now derives from the
  // CURRENT user's verified JWT via `resolveSchoolRole`, not the shadow `users.role` column
  // (which P4 drops). For the SSO roles this path cares about (`college_educator` /
  // `school_educator`) resolveSchoolRole returns them straight from the JWT — the SAME value
  // `users.role` carried for synced users — so educatorType resolution is preserved. The
  // `users` row is still read for `id` / `organizationId` (scoping data the resolver does not
  // provide). A `null` result or any non-educator permission code falls through to the
  // "not registered" throw, exactly as a non-educator `users.role` did.
  //
  // ⚠️ task 14 preservation flag: (a) a user whose `users.role` is NULL/non-educator but whose
  // JWT carries an educator role is now treated as an educator (intended de-shadowing); and
  // (b) for a multi-role user, resolveSchoolRole applies admin-over-educator precedence, so a
  // JWT holding both an admin and an educator code resolves to the admin code (→ throw) where
  // a single `users.role` of the educator code previously returned educator info. Both are
  // inconsistent-data edges; synced single-role users are unaffected.
  if (userData?.id) {
    const roleCode = await resolveSchoolRole(supabase, user);
    if (roleCode === 'college_educator' || roleCode === 'school_educator') {
      return {
        user: user as any,
        educatorData: { id: userData.id, school_id: userData.organizationId, role: 'educator' },
        educatorType: roleCode === 'college_educator' ? 'college' : 'school',
        assignedClassIds: [],
      };
    }
  }

  throw new Error('Educator not registered with any school or college. Please contact your administrator.');
}

async function safeQuery<T>(promise: Promise<{ data: T | null; error: any }>, fallback: T): Promise<T> {
  try {
    const result = await promise;
    if (result.error) {
      return fallback;
    }
    return result.data ?? fallback;
  } catch {
    return fallback;
  }
}

async function countActiveLearners(supabase: SupabaseClient, learnerUserIds: string[]): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateFilter = thirtyDaysAgo.toISOString();

  const [activeProjects, activeTrainings, activeCertificates, activeAssessments] = await Promise.all([
    safeQuery(supabase.from('projects').select('learner_id').in('learner_id', learnerUserIds).gte('created_at', dateFilter), []),
    safeQuery(supabase.from('trainings').select('learner_id').in('learner_id', learnerUserIds).gte('created_at', dateFilter), []),
    safeQuery(supabase.from('certificates').select('learner_id').in('learner_id', learnerUserIds).gte('created_at', dateFilter), []),
    safeQuery(supabase.from('personal_assessment_results').select('learner_id').in('learner_id', learnerUserIds).gte('created_at', dateFilter), []),
  ]);

  const activeLearnerIds = new Set<string>();
  for (const p of activeProjects) if (p.learner_id) activeLearnerIds.add(p.learner_id);
  for (const t of activeTrainings) if (t.learner_id) activeLearnerIds.add(t.learner_id);
  for (const c of activeCertificates) if (c.learner_id) activeLearnerIds.add(c.learner_id);
  for (const a of activeAssessments) if (a.learner_id) activeLearnerIds.add(a.learner_id);

  return activeLearnerIds.size;
}

async function getKPIs(supabase: SupabaseClient, educator: EducatorInfo): Promise<DashboardKPIs> {
  const { user, educatorData, educatorType, assignedClassIds } = educator;
  const admin = isAdmin(user);

  if (educatorType === 'school' && educatorData.role !== 'admin' && !admin && assignedClassIds.length === 0) {
    return zeroKPIs();
  }

  if (educatorType === 'school') {
    let learnersQuery = supabase
      .from('learners')
      .select('id, user_id')
      .eq('is_deleted', false)
      .not('learner_id', 'is', null);

    if (admin || educatorData.role === 'admin') {
      learnersQuery = learnersQuery.eq('school_id', educatorData.school_id).is('college_id', null);
    } else if (assignedClassIds.length > 0) {
      learnersQuery = learnersQuery.eq('school_id', educatorData.school_id).in('school_class_id', assignedClassIds).is('college_id', null);
    }

    const { data: learnersData } = await learnersQuery;
    if (!learnersData || learnersData.length === 0) return zeroKPIs();

    const learnerUserIds = learnersData.map(s => s.user_id).filter(Boolean);
    const learnerIds = learnersData.map(s => s.id).filter(Boolean);

    const [projectsData, trainingsData, certificatesData, attendanceData, assessmentData, assignmentData, mentorNotesData] = await Promise.all([
      safeQuery(supabase.from('projects').select('approval_status').in('learner_id', learnerUserIds), [] as any[]),
      safeQuery(supabase.from('trainings').select('approval_status').in('learner_id', learnerUserIds), [] as any[]),
      safeQuery(supabase.from('certificates').select('approval_status').in('learner_id', learnerUserIds), [] as any[]),
      safeQuery(supabase.from('attendance_records').select('status').in('learner_id', learnerIds), [] as any[]),
      safeQuery(supabase.from('personal_assessment_results').select('status').in('learner_id', learnerUserIds).eq('status', 'completed'), [] as any[]),
      safeQuery(supabase.from('learner_assignments').select('status').in('learner_id', learnerIds).in('status', ['submitted', 'graded']), [] as any[]),
      safeQuery(supabase.from('mentor_notes').select('id').eq('school_educator_id', educatorData.id).in('learner_id', learnerIds), [] as any[]),
    ]);

    const verifiableActivities = [
      ...(projectsData || []).map(p => ({ status: p.approval_status })),
      ...(trainingsData || []).map(t => ({ status: t.approval_status })),
      ...(certificatesData || []).map(c => ({ status: c.approval_status })),
    ];

    const totalActivities = verifiableActivities.length
      + (attendanceData || []).length
      + (assessmentData || []).length
      + (assignmentData || []).length
      + (mentorNotesData || []).length;

    const pendingActivities = verifiableActivities.filter(a => a.status === 'pending').length;
    const verifiedActivities = verifiableActivities.filter(a => a.status === 'approved' || a.status === 'sent_to_admin').length;
    const verificationRate = verifiableActivities.length > 0 ? Math.round((verifiedActivities / verifiableActivities.length) * 100) : 0;
    const activelearners = await countActiveLearners(supabase, learnerUserIds);

    return {
      totallearners: learnersData.length,
      activelearners,
      pendingActivities,
      verifiedActivities,
      totalActivities,
      verificationRate,
      recentActivitiesCount: Math.min(totalActivities, 10),
      totalMentorNotes: (mentorNotesData || []).length,
    };
  }

  const { data: sections } = await supabase
    .from('program_sections')
    .select('program_id, semester, section')
    .eq('faculty_id', user.id)
    .eq('status', 'active');

  if (!sections || sections.length === 0) return zeroKPIs();

  let collegeLearnersQuery = supabase
    .from('learners')
    .select('id, user_id, name, email, college_id, program_id, semester, section')
    .eq('is_deleted', false)
    .not('learner_id', 'is', null)
    .eq('college_id', educatorData.school_id);

  const orConditions = sections.map(s =>
    `and(program_id.eq.${sanitizeFilterValue(s.program_id)},semester.eq.${sanitizeFilterValue(s.semester)},section.eq.${sanitizeFilterValue(s.section)})`
  ).join(',');
  collegeLearnersQuery = collegeLearnersQuery.or(orConditions);

  const { data: learnersData } = await collegeLearnersQuery;
  if (!learnersData || learnersData.length === 0) return zeroKPIs();

  const learnerUserIds = learnersData.map(s => s.user_id).filter(Boolean);
  const learnerIds = learnersData.map(s => s.id).filter(Boolean);

  const [projectsData, trainingsData, certificatesData, attendanceData, assessmentData, assignmentData, mentorNotesData] = await Promise.all([
    safeQuery(supabase.from('projects').select('approval_status').in('learner_id', learnerIds), [] as ActivityApprovalRow[]),
    safeQuery(supabase.from('trainings').select('approval_status').in('learner_id', learnerIds), [] as ActivityApprovalRow[]),
    safeQuery(supabase.from('certificates').select('approval_status').in('learner_id', learnerIds), [] as ActivityApprovalRow[]),
    safeQuery(supabase.from('college_attendance_records').select('status, learner_id, date, college_id').in('learner_id', learnerIds), [] as any[]),
    safeQuery(supabase.from('personal_assessment_results').select('status').in('learner_id', learnerUserIds).eq('status', 'completed'), [] as any[]),
    safeQuery(supabase.from('learner_assignments').select('status').in('learner_id', learnerIds).in('status', ['submitted', 'graded']), [] as any[]),
    safeQuery(supabase.from('mentor_notes').select('id').eq('college_lecturer_id', educatorData.id).in('learner_id', learnerIds), [] as any[]),
  ]);

  const verifiableActivities = [
    ...(projectsData || []).map(p => ({ status: p.approval_status })),
    ...(trainingsData || []).map(t => ({ status: t.approval_status })),
    ...(certificatesData || []).map(c => ({ status: c.approval_status })),
  ];

  const totalActivities = verifiableActivities.length
    + (attendanceData || []).length
    + (assessmentData || []).length
    + (assignmentData || []).length
    + (mentorNotesData || []).length;

  const pendingActivities = verifiableActivities.filter(a => a.status === 'pending').length;
  const verifiedActivities = verifiableActivities.filter(a => a.status === 'approved' || a.status === 'sent_to_admin').length;
  const verificationRate = verifiableActivities.length > 0 ? Math.round((verifiedActivities / verifiableActivities.length) * 100) : 0;
  const activelearners = await countActiveLearners(supabase, learnerUserIds);

  return {
    totallearners: learnersData.length,
    activelearners,
    pendingActivities,
    verifiedActivities,
    totalActivities,
    verificationRate,
    recentActivitiesCount: Math.min(totalActivities, 10),
    totalMentorNotes: (mentorNotesData || []).length,
  };
}

async function getRecentActivities(supabase: SupabaseClient, educator: EducatorInfo, limit: number): Promise<RecentActivity[]> {
  const { user, educatorData, educatorType, assignedClassIds } = educator;

  if (educatorType === 'school' && educatorData.role !== 'admin' && !isAdmin(user) && assignedClassIds.length === 0) {
    return [];
  }

  let learnersQuery = supabase
    .from('learners')
    .select('id, user_id, name')
    .eq('is_deleted', false);

  if (educatorType === 'school') {
    if (isAdmin(user) || educatorData.role === 'admin') {
      learnersQuery = learnersQuery.eq('school_id', educatorData.school_id);
    } else if (assignedClassIds.length > 0) {
      learnersQuery = learnersQuery.eq('school_id', educatorData.school_id).in('school_class_id', assignedClassIds);
    }
  } else {
    learnersQuery = learnersQuery.eq('college_id', educatorData.school_id);
  }

  const { data: learnersData } = await learnersQuery;
  if (!learnersData || learnersData.length === 0) return [];

  const learnerUserIds = learnersData.map(s => s.user_id).filter(Boolean);
  const learnerIds = learnersData.map(s => s.id).filter(Boolean);

  const learnerNameMap: Record<string, string> = {};
  const learnerIdNameMap: Record<string, string> = {};
  learnersData.forEach(l => {
    const name = l.name || `Learner ${l.id.substring(0, 8)}`;
    learnerNameMap[l.user_id] = name;
    learnerIdNameMap[l.id] = name;
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateFilter = thirtyDaysAgo.toISOString();

  const ceilLimit = Math.ceil(limit / 7);

  const universalQueries = [
    safeQuery(supabase.from('projects').select('id, title, description, approval_status, created_at, learner_id').in('learner_id', learnerUserIds).gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(ceilLimit), []),
    safeQuery(supabase.from('trainings').select('id, title, description, approval_status, created_at, learner_id').in('learner_id', learnerUserIds).gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(ceilLimit), []),
    safeQuery(supabase.from('certificates').select('id, title, description, approval_status, created_at, learner_id').in('learner_id', learnerUserIds).gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(ceilLimit), []),
    safeQuery(supabase.from('personal_assessment_results').select('id, stream_id, status, employability_readiness, knowledge_score, created_at, learner_id, grade_level').in('learner_id', learnerUserIds).eq('status', 'completed').gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(ceilLimit), []),
    safeQuery(supabase.from('mentor_notes').select('id, note, category, created_at, learner_id').in('learner_id', learnerIds).gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(ceilLimit), []),
  ];

  if (educatorType === 'school') {
    const attendancePromise = safeQuery(supabase.from('attendance_records').select(`id, date, status, remarks, created_at, learner_id, slot_id, timetable_slots!inner(period_number, subject_name, class_id, school_classes!inner(name, grade, section))`).in('learner_id', learnerIds).gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(ceilLimit), []);
    const assignmentPromise = safeQuery(supabase.from('learner_assignments').select(`learner_assignment_id, status, grade_received, submission_date, updated_date, learner_id, assignments!inner(title, description, assignment_type)`).in('learner_id', learnerIds).in('status', ['submitted', 'graded']).gte('updated_date', dateFilter).order('updated_date', { ascending: false }).limit(ceilLimit), []);
    const timetablesPromise = safeQuery(supabase.from('timetable_slots').select(`id, educator_id, day_of_week, period_number, start_time, end_time, subject_name, room_number, created_at, school_classes!inner(name, grade, section)`).eq('educator_id', educatorData.id).gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(ceilLimit + 1), []);
    const clubsPromise = safeQuery(supabase.from('clubs').select('club_id, name, category, description, is_active, created_at, mentor_educator_id, created_by_educator_id').eq('school_id', educatorData.school_id).or(`mentor_educator_id.eq.${sanitizeFilterValue(educatorData.id)},created_by_educator_id.eq.${sanitizeFilterValue(educatorData.id)}`).eq('is_active', true).gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(ceilLimit + 1), []);
    const competitionsPromise = safeQuery(supabase.from('competitions').select('comp_id, name, description, level, category, competition_date, status, created_at, created_by_educator_id').eq('school_id', educatorData.school_id).in('status', ['active', 'upcoming', 'completed']).gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(ceilLimit + 1), []);
    const coursesPromise = safeQuery(supabase.from('courses').select('course_id, title, code, description, status, enrollment_count, created_at, educator_id').eq('educator_id', educatorData.id).in('status', ['active', 'published']).gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(ceilLimit + 1), []);

    const [projectsData, trainingsData, certificatesData, assessmentData, mentorNotesData, attendanceData, assignmentData, timetablesData, clubsData, competitionsData, coursesData] = await Promise.all([
      ...universalQueries,
      attendancePromise,
      assignmentPromise,
      timetablesPromise,
      clubsPromise,
      competitionsPromise,
      coursesPromise,
    ]);

    const activities: RecentActivity[] = [];

    for (const p of (projectsData || [])) {
      activities.push({ id: `project-${p.id}`, title: p.title, description: p.description || 'Project submission', learnerName: learnerNameMap[p.learner_id] || 'Unknown Learner', category: 'Project', status: p.approval_status || 'pending', submittedDate: p.created_at });
    }
    for (const t of (trainingsData || [])) {
      activities.push({ id: `training-${t.id}`, title: t.title, description: t.description || 'Training completion', learnerName: learnerNameMap[t.learner_id] || 'Unknown Learner', category: 'Training', status: t.approval_status || 'pending', submittedDate: t.created_at });
    }
    for (const c of (certificatesData || [])) {
      activities.push({ id: `certificate-${c.id}`, title: c.title, description: c.description || 'Certificate submission', learnerName: learnerNameMap[c.learner_id] || 'Unknown Learner', category: 'Certificate', status: c.approval_status || 'pending', submittedDate: c.created_at });
    }

    const attendanceBySlot: Record<string, { date: string; period_number: number; subject_name: string; class_name: string; grade: string; section: string; present: number; absent: number; late: number; excused: number; total: number; created_at: string; slot_id: string }> = {};
    for (const a of (attendanceData || [])) {
      const slotKey = `${a.date}-${a.slot_id}`;
      if (!attendanceBySlot[slotKey]) {
        const cls = a.timetable_slots?.school_classes || {};
        attendanceBySlot[slotKey] = { date: a.date, period_number: a.timetable_slots?.period_number || 0, subject_name: a.timetable_slots?.subject_name || 'Unknown Subject', class_name: cls.name || 'Unknown Class', grade: cls.grade || '', section: cls.section || '', present: 0, absent: 0, late: 0, excused: 0, total: 0, created_at: a.created_at, slot_id: a.slot_id };
      }
      const s = attendanceBySlot[slotKey];
      if (a.status === 'present') s.present++;
      else if (a.status === 'absent') s.absent++;
      else if (a.status === 'late') s.late++;
      else if (a.status === 'excused') s.excused++;
      s.total++;
    }
    for (const s of Object.values(attendanceBySlot)) {
      const periodText = s.period_number > 0 ? `Period ${s.period_number}` : 'Period';
      const classDisplay = s.grade && s.section ? `Grade ${s.grade} - ${s.section}` : s.class_name;
      activities.push({ id: `attendance-${s.slot_id}-${s.date}`, title: `${periodText} - ${s.subject_name}`, description: `${classDisplay} • Attendance marked`, learnerName: classDisplay, category: 'Attendance', status: 'sent_to_admin', submittedDate: s.created_at });
    }

    for (const a of (assessmentData || [])) {
      const streamName = a.stream_id?.toUpperCase() || 'General';
      const readinessLevel = a.employability_readiness || 'Not Available';
      const knowledgeScore = a.knowledge_score ? `${a.knowledge_score}%` : 'Not Available';
      activities.push({ id: `assessment-${a.id}`, title: `${streamName} Personal Assessment`, description: `Employability: ${readinessLevel} • Knowledge Score: ${knowledgeScore}`, learnerName: learnerNameMap[a.learner_id] || 'Unknown Learner', category: 'Assessment', status: 'approved', submittedDate: a.created_at });
    }

    for (const a of (assignmentData || [])) {
      const statusMap: Record<string, 'pending' | 'sent_to_admin' | 'approved' | 'rejected'> = { submitted: 'sent_to_admin', graded: 'approved' };
      activities.push({ id: `assignment-${a.learner_assignment_id}`, title: a.assignments?.title || 'Assignment', description: a.assignments?.description || `${a.assignments?.assignment_type || 'Assignment'} submission`, learnerName: learnerIdNameMap[a.learner_id] || 'Unknown Learner', category: 'Assignment', status: statusMap[a.status] || 'sent_to_admin', submittedDate: a.submission_date || a.updated_date });
    }

    for (const n of (mentorNotesData || [])) {
      activities.push({ id: `note-${n.id}`, title: `Mentor Note - ${n.category || 'General'}`, description: n.note.length > 100 ? n.note.substring(0, 100) + '...' : n.note, learnerName: learnerIdNameMap[n.learner_id] || 'Unknown Learner', category: 'Mentor Note', status: 'approved', submittedDate: n.created_at });
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (const slot of (timetablesData || [])) {
      const dayName = dayNames[slot.day_of_week] || 'Unknown Day';
      const timeRange = `${(slot.start_time || '').slice(0, 5)} - ${(slot.end_time || '').slice(0, 5)}`;
      const cls = slot.school_classes || {};
      const className = cls.name || `Grade ${cls.grade} - ${cls.section}`;
      activities.push({ id: `timetable-slot-${slot.id}`, title: `Period ${slot.period_number} - ${slot.subject_name}`, description: `${className} • ${dayName} ${timeRange} • Room ${slot.room_number || 'N/A'}`, learnerName: slot.subject_name || 'Schedule', category: 'Schedule', status: 'sent_to_admin', submittedDate: slot.created_at });
    }

    for (const club of (clubsData || [])) {
      const isMentor = club.mentor_educator_id === educatorData.id;
      const isCreator = club.created_by_educator_id === educatorData.id;
      const role = isMentor && isCreator ? 'Mentor & Creator' : isMentor ? 'Mentor' : 'Creator';
      activities.push({ id: `club-${club.club_id}`, title: `Club: ${club.name}`, description: `${club.category} • ${role}`, learnerName: (club.description || '').substring(0, 50) || 'No description', category: 'Club', status: 'approved', submittedDate: club.created_at });
    }

    for (const comp of (competitionsData || [])) {
      const statusMap: Record<string, 'pending' | 'sent_to_admin' | 'approved' | 'rejected'> = { upcoming: 'pending', active: 'sent_to_admin', completed: 'approved' };
      activities.push({ id: `competition-${comp.comp_id}`, title: `Competition: ${comp.name}`, description: `${comp.level} • ${comp.category} • ${new Date(comp.competition_date).toLocaleDateString()}`, learnerName: (comp.description || '').substring(0, 50) || 'No description', category: 'Competition', status: statusMap[comp.status] || 'pending', submittedDate: comp.created_at });
    }

    for (const course of (coursesData || [])) {
      const statusMap: Record<string, 'pending' | 'sent_to_admin' | 'approved' | 'rejected'> = { draft: 'pending', active: 'sent_to_admin', published: 'approved' };
      activities.push({ id: `course-${course.course_id}`, title: `Course: ${course.title}`, description: `${course.code} • ${course.enrollment_count || 0} enrolled`, learnerName: (course.description || '').substring(0, 50) || 'No description', category: 'Course', status: statusMap[course.status] || 'pending', submittedDate: course.created_at });
    }

    return activities.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()).slice(0, limit);
  }

  const collegeAttendancePromise = safeQuery(supabase.from('college_attendance_records').select(`id, date, status, created_at, learner_id`).in('learner_id', learnerIds).gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(ceilLimit), []);
  const collegeAssignmentPromise = safeQuery(supabase.from('learner_assignments').select(`learner_assignment_id, status, grade_received, submission_date, updated_date, learner_id, assignments!inner(title, description, assignment_type)`).in('learner_id', learnerIds).in('status', ['submitted', 'graded']).gte('updated_date', dateFilter).order('updated_date', { ascending: false }).limit(ceilLimit), []);

  const [projectsData, trainingsData, certificatesData, assessmentData, mentorNotesData, attendanceData, assignmentData] = await Promise.all([
    ...universalQueries,
    collegeAttendancePromise,
    collegeAssignmentPromise,
  ]);

  const activities: RecentActivity[] = [];

  for (const p of (projectsData || [])) {
    activities.push({ id: `project-${p.id}`, title: p.title, description: p.description || 'Project submission', learnerName: learnerNameMap[p.learner_id] || 'Unknown Learner', category: 'Project', status: p.approval_status || 'pending', submittedDate: p.created_at });
  }
  for (const t of (trainingsData || [])) {
    activities.push({ id: `training-${t.id}`, title: t.title, description: t.description || 'Training completion', learnerName: learnerNameMap[t.learner_id] || 'Unknown Learner', category: 'Training', status: t.approval_status || 'pending', submittedDate: t.created_at });
  }
  for (const c of (certificatesData || [])) {
    activities.push({ id: `certificate-${c.id}`, title: c.title, description: c.description || 'Certificate submission', learnerName: learnerNameMap[c.learner_id] || 'Unknown Learner', category: 'Certificate', status: c.approval_status || 'pending', submittedDate: c.created_at });
  }

  for (const a of (attendanceData || [])) {
    activities.push({ id: `college-attendance-${a.id}`, title: 'Attendance', description: `Status: ${a.status} on ${a.date}`, learnerName: learnerIdNameMap[a.learner_id] || 'Unknown Learner', category: 'Attendance', status: 'sent_to_admin', submittedDate: a.created_at });
  }

  for (const a of (assessmentData || [])) {
    const streamName = a.stream_id?.toUpperCase() || 'General';
    const readinessLevel = a.employability_readiness || 'Not Available';
    const knowledgeScore = a.knowledge_score ? `${a.knowledge_score}%` : 'Not Available';
    activities.push({ id: `assessment-${a.id}`, title: `${streamName} Personal Assessment`, description: `Employability: ${readinessLevel} • Knowledge Score: ${knowledgeScore}`, learnerName: learnerNameMap[a.learner_id] || 'Unknown Learner', category: 'Assessment', status: 'approved', submittedDate: a.created_at });
  }

  for (const a of (assignmentData || [])) {
    const statusMap: Record<string, 'pending' | 'sent_to_admin' | 'approved' | 'rejected'> = { submitted: 'sent_to_admin', graded: 'approved' };
    activities.push({ id: `assignment-${a.learner_assignment_id}`, title: a.assignments?.title || 'Assignment', description: a.assignments?.description || `${a.assignments?.assignment_type || 'Assignment'} submission`, learnerName: learnerIdNameMap[a.learner_id] || 'Unknown Learner', category: 'Assignment', status: statusMap[a.status] || 'sent_to_admin', submittedDate: a.submission_date || a.updated_date });
  }

  for (const n of (mentorNotesData || [])) {
    activities.push({ id: `note-${n.id}`, title: `Mentor Note - ${n.category || 'General'}`, description: n.note.length > 100 ? n.note.substring(0, 100) + '...' : n.note, learnerName: learnerIdNameMap[n.learner_id] || 'Unknown Learner', category: 'Mentor Note', status: 'approved', submittedDate: n.created_at });
  }

  return activities.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()).slice(0, limit);
}

async function getSkillAnalytics(supabase: SupabaseClient, educator: EducatorInfo): Promise<SkillAnalytics> {
  const { user, educatorData, educatorType, assignedClassIds } = educator;

  if (educatorType === 'school' && educatorData.role !== 'admin' && !isAdmin(user) && assignedClassIds.length === 0) {
    return { skillParticipation: [], skillDistribution: [] };
  }

  let learnersQuery = supabase.from('learners').select('id, user_id').eq('is_deleted', false);
  if (educatorType === 'school') {
    if (isAdmin(user) || educatorData.role === 'admin') {
      learnersQuery = learnersQuery.eq('school_id', educatorData.school_id);
    } else if (assignedClassIds.length > 0) {
      learnersQuery = learnersQuery.eq('school_id', educatorData.school_id).in('school_class_id', assignedClassIds);
    }
  } else {
    learnersQuery = learnersQuery.eq('college_id', educatorData.school_id);
  }

  const { data: learnersData } = await learnersQuery;
  const learnerUserIds = (learnersData || []).map(s => s.user_id).filter(Boolean);
  if (learnerUserIds.length === 0) return { skillParticipation: [], skillDistribution: [] };

  const [projectsData, trainingsData, certificatesData] = await Promise.all([
    safeQuery(supabase.from('projects').select('tech_stack').in('learner_id', learnerUserIds).not('tech_stack', 'is', null), [] as any[]),
    safeQuery(supabase.from('trainings').select('title, description').in('learner_id', learnerUserIds), [] as any[]),
    safeQuery(supabase.from('certificates').select('title, description').in('learner_id', learnerUserIds), [] as any[]),
  ]);

  const skillCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const commonSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Java', 'C++', 'HTML', 'CSS'];

  for (const p of (projectsData || [])) {
    if (Array.isArray(p.tech_stack)) {
      for (const tech of p.tech_stack) {
        if (tech) { skillCounts[tech] = (skillCounts[tech] || 0) + 1; categoryCounts['Technical Skills'] = (categoryCounts['Technical Skills'] || 0) + 1; }
      }
    }
  }

  for (const t of (trainingsData || [])) {
    if (t.title) {
      for (const skill of commonSkills) {
        if (t.title.toLowerCase().includes(skill.toLowerCase())) { skillCounts[skill] = (skillCounts[skill] || 0) + 1; categoryCounts['Technical Skills'] = (categoryCounts['Technical Skills'] || 0) + 1; }
      }
    }
  }

  for (const c of (certificatesData || [])) {
    if (c.title) {
      for (const skill of commonSkills) {
        if (c.title.toLowerCase().includes(skill.toLowerCase())) { skillCounts[skill] = (skillCounts[skill] || 0) + 1; categoryCounts['Technical Skills'] = (categoryCounts['Technical Skills'] || 0) + 1; }
      }
    }
  }

  const totalActivities = (projectsData || []).length + (trainingsData || []).length + (certificatesData || []).length;

  return {
    skillParticipation: Object.entries(skillCounts).map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    skillDistribution: Object.entries(categoryCounts).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
  };
}

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const path = ((context.params as any).path as string[]) || [];
  const url = new URL(context.request.url);

  if (path.length === 0) {
    return apiError(400, 'VALIDATION_ERROR', 'Path required: kpis, recent-activities, or skill-analytics', context.request);
  }

  const resource = path[0];

  try {
    if (resource === 'kpis') {
      const educator = await getAuthenticatedEducator(supabase, user);
      const data = await getKPIs(supabase, educator);
      return apiSuccess(data, context.request);
    }

    if (resource === 'recent-activities') {
      const educator = await getAuthenticatedEducator(supabase, user);
      const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 50);
      const data = await getRecentActivities(supabase, educator, limit);
      return apiSuccess(data, context.request);
    }

    if (resource === 'skill-analytics') {
      const educator = await getAuthenticatedEducator(supabase, user);
      const data = await getSkillAnalytics(supabase, educator);
      return apiSuccess(data, context.request);
    }

    return apiError(404, 'NOT_FOUND', `Unknown resource: ${resource}`, context.request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('not registered')) {
      return apiError(403, 'EDUCATOR_NOT_REGISTERED', message, context.request);
    }
    return apiError(500, 'INTERNAL_ERROR', message, context.request);
  }
});

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' },
  });
};
