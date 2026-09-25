/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth, getContextUser } from '../../lib/auth';
import { apiDbError, apiError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';


const IMPORT_STATUSES = ['present', 'absent', 'late', 'excused'];
const MAX_IMPORT_ROWS = 2000;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface ImportRowError { row: number; field?: string; message: string; }

/**
 * Session-first strict validation for bulk attendance import.
 * The session is picked from a list by id (never re-matched by names),
 * so duplicate program names cannot misroute an import.
 * Never writes — the import action reuses this, then calls the atomic RPC.
 */
export async function validateAttendanceImport(supabase: any, body: any): Promise<{
  ok: boolean;
  fatal?: { status: number; code: string; message: string };
  errors: ImportRowError[];
  summary?: { total: number; present: number; absent: number; late: number; excused: number; rosterSize: number };
  session?: any;
  sessionInfo?: { id: string; subject: string; date: string; status: string };
  program?: any;
  recordsJson?: any[];
}> {
  const { college_id, session_id, rows } = body;
  const errors: ImportRowError[] = [];
  const fail = (status: number, code: string, message: string) =>
    ({ ok: false as const, fatal: { status, code, message }, errors });

  if (!college_id || !session_id) {
    return fail(400, 'VALIDATION_ERROR', 'college_id and session_id are required');
  }

  // ── Session by id, scoped to the college ──
  const { data: session, error: sessionError } = await supabase
    .from('college_attendance_sessions')
    .select('*')
    .eq('id', session_id)
    .eq('college_id', college_id)
    .maybeSingle();
  if (sessionError) return fail(503, 'CATALOG_UNAVAILABLE', 'Unable to look up attendance session');
  if (!session) return fail(404, 'NOT_FOUND', 'Attendance session not found');

  // ── Session state: single-write-once, re-upload is never allowed ──
  if (session.status === 'cancelled') {
    return fail(400, 'VALIDATION_ERROR', 'This session is cancelled — attendance cannot be imported into it');
  }
  if (session.status === 'completed') {
    return fail(409, 'CONFLICT', 'Attendance already marked for this session — re-upload is not allowed');
  }
  {
    const { count: existingCount, error: existingError } = await supabase
      .from('college_attendance_records')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id)
      .eq('date', session.date);
    if (existingError) return fail(503, 'CATALOG_UNAVAILABLE', 'Unable to check existing attendance');
    if ((existingCount || 0) > 0) {
      return fail(409, 'CONFLICT', 'Attendance already exists for this session — re-upload is not allowed');
    }
  }
  if (session.date && DATE_RE.test(String(session.date))) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (String(session.date) > todayStr) {
      return fail(400, 'VALIDATION_ERROR', 'Attendance cannot be marked for a future session date');
    }
  }

  // ── Program: exact id first; legacy name fallback for pre-backfill sessions ──
  let program: any = null;
  if (session.program_id) {
    const { data, error } = await supabase
      .from('programs')
      .select('id, name, code')
      .eq('id', session.program_id)
      .maybeSingle();
    if (error) return fail(503, 'CATALOG_UNAVAILABLE', 'Unable to verify program');
    program = data;
  } else {
    const { data, error } = await supabase
      .from('programs')
      .select('id, name, code')
      .eq('name', session.program_name)
      .limit(2);
    if (error) return fail(503, 'CATALOG_UNAVAILABLE', 'Unable to verify program');
    if (!data || data.length === 0) return fail(404, 'NOT_FOUND', `Program '${session.program_name}' not found`);
    if (data.length > 1) {
      return fail(409, 'CONFLICT', `Multiple programs named '${session.program_name}' exist — recreate this session from Program & Sections so it links exactly, then import`);
    }
    program = data[0];
  }
  if (!program) return fail(404, 'NOT_FOUND', 'Program not found for this session');

  const semesterInt = parseInt(session.semester, 10);
  if (Number.isNaN(semesterInt)) {
    return fail(400, 'VALIDATION_ERROR', 'Session has an invalid semester');
  }

  // ── Retroactive window ──
  {
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: settings } = await supabase
      .from('college_attendance_settings')
      .select('allow_retroactive_marking, retroactive_days_limit')
      .eq('college_id', college_id)
      .maybeSingle();
    if (settings && String(session.date) < todayStr) {
      if (settings.allow_retroactive_marking === false) {
        return fail(400, 'VALIDATION_ERROR', 'Retroactive attendance marking is disabled for this college');
      }
      const limit = settings.retroactive_days_limit;
      if (typeof limit === 'number') {
        const diffDays = Math.floor((Date.parse(`${todayStr}T00:00:00Z`) - Date.parse(`${session.date}T00:00:00Z`)) / 86400000);
        if (diffDays > limit) {
          return fail(400, 'VALIDATION_ERROR', `Attendance can only be marked up to ${limit} day(s) back (this session is ${diffDays} days ago)`);
        }
      }
    }
  }

  // ── Roster ──
  const { data: roster, error: rosterError } = await supabase
    .from('learners')
    .select('id, name, roll_number, email')
    .eq('is_deleted', false)
    .eq('program_id', program.id)
    .eq('semester', semesterInt)
    .eq('section', session.section)
    .order('roll_number');
  if (rosterError) return fail(503, 'CATALOG_UNAVAILABLE', 'Unable to load class roster');
  if (!roster || roster.length === 0) {
    return fail(404, 'NOT_FOUND', 'No students enrolled in this session\'s program, semester and section');
  }

  // ── Student-list integrity: records.roll_number is NOT NULL, so a student
  // without a roll number would pass matching (via email) and then crash the
  // RPC with a cryptic 23502. Fail fast with an actionable message instead. ──
  {
    const missing = (roster as any[]).filter((l: any) => !String(l.roll_number || '').trim());
    if (missing.length > 0) {
      const sample = missing.slice(0, 5).map((l: any) => l.name || l.email || l.id).join(', ');
      return fail(
        400, 'VALIDATION_ERROR',
        `${missing.length} student(s) in this class have no roll numbers (e.g. ${sample}) — backfill roll numbers first, then import`,
      );
    }
  }

  // ── File shape ──
  if (!Array.isArray(rows) || rows.length === 0) {
    return fail(400, 'VALIDATION_ERROR', 'The file has no data rows');
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    return fail(400, 'VALIDATION_ERROR', `Too many rows (${rows.length}) — maximum is ${MAX_IMPORT_ROWS}`);
  }

  const byRoll = new Map((roster as any[]).map((l: any) => [String(l.roll_number || '').trim().toLowerCase(), l]));
  const byEmail = new Map((roster as any[]).filter((l: any) => l.email).map((l: any) => [String(l.email).trim().toLowerCase(), l]));
  const seen = new Map<string, number>();
  const matchedIds = new Set<string>();
  const recordsJson: any[] = [];
  let present = 0, absent = 0, late = 0, excused = 0;

  rows.forEach((raw: any, idx: number) => {
    const fileRow = idx + 2; // +1 header, +1 one-indexed
    const roll = String(raw?.roll_number ?? '').trim();
    const email = String(raw?.email ?? '').trim().toLowerCase();
    const status = String(raw?.status ?? '').trim().toLowerCase();
    const timeIn = String(raw?.time_in ?? '').trim();
    const remarks = String(raw?.remarks ?? '').trim();

    if (!roll && !email && !status && !timeIn && !remarks) return; // skip blank lines

    let learner: any = null;
    if (roll) learner = byRoll.get(roll.toLowerCase()) || null;
    if (!learner && email) learner = byEmail.get(email) || null;
    if (!roll && !email) {
      errors.push({ row: fileRow, field: 'roll_number', message: `Row ${fileRow}: roll_number or email is required` });
      return;
    }
    if (!learner) {
      errors.push({ row: fileRow, field: 'roll_number', message: `Row ${fileRow}: '${roll || email}' is not a student of this class` });
      return;
    }
    if (seen.has(learner.id)) {
      errors.push({ row: fileRow, field: 'roll_number', message: `Row ${fileRow}: duplicate of row ${seen.get(learner.id)} ('${roll || email}')` });
      return;
    }
    seen.set(learner.id, fileRow);

    if (!status) {
      errors.push({ row: fileRow, field: 'status', message: `Row ${fileRow}: status is required (present/absent/late/excused)` });
      return;
    }
    if (!IMPORT_STATUSES.includes(status)) {
      errors.push({ row: fileRow, field: 'status', message: `Row ${fileRow}: status must be present, absent, late or excused (got '${raw?.status}')` });
      return;
    }
    if (status === 'late' && !timeIn) {
      errors.push({ row: fileRow, field: 'time_in', message: `Row ${fileRow}: time_in (HH:MM) is required for late` });
      return;
    }
    if (timeIn && !TIME_RE.test(timeIn)) {
      errors.push({ row: fileRow, field: 'time_in', message: `Row ${fileRow}: time_in must be HH:MM (got '${raw?.time_in}')` });
      return;
    }
    if (status === 'excused' && !remarks) {
      errors.push({ row: fileRow, field: 'remarks', message: `Row ${fileRow}: remarks are required for excused` });
      return;
    }

    if (status === 'present') present += 1;
    else if (status === 'absent') absent += 1;
    else if (status === 'late') late += 1;
    else excused += 1;
    matchedIds.add(learner.id);
    recordsJson.push({
      learner_id: learner.id,
      learner_name: learner.name,
      roll_number: learner.roll_number,
      department_name: session.department_name,
      program_name: program.name,
      program_code: program.code || session.program_code || null,
      program_id: program.id,
      semester: semesterInt,
      section: session.section,
      status,
      time_in: timeIn || null,
      time_out: null,
      subject_name: session.subject_name,
      subject_code: session.subject_code || null,
      faculty_id: session.faculty_id,
      faculty_name: session.faculty_name,
      location: session.room_number || null,
      remarks: remarks || null,
      college_id,
    });
  });

  for (const l of roster as any[]) {
    if (!matchedIds.has(l.id)) {
      errors.push({ row: 0, field: 'roll_number', message: `Missing from file: ${l.roll_number || '(no roll)'} — ${l.name || 'Unknown'}` });
    }
  }

  const summary = { total: matchedIds.size, present, absent, late, excused, rosterSize: (roster as any[]).length };
  if (errors.length > 0) {
    return { ok: false as const, errors, summary };
  }
  return {
    ok: true as const,
    errors: [],
    summary,
    session,
    sessionInfo: { id: session.id, subject: session.subject_name, date: session.date, status: session.status },
    program,
    recordsJson,
  };
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const body: any = await context.request.json();
  const { action } = body;
  const startTime = Date.now();

  try {
    switch (action) {
      // ─────────────────────────────────────────────────
      // Resolve college ID from authenticated user
      // ─────────────────────────────────────────────────
      case 'resolve-college-id': {
        const user = getContextUser(context);

        const { data: lecturerData } = await supabase
          .from('college_lecturers')
          .select('collegeId')
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        let collegeId = lecturerData?.collegeId;

        if (!collegeId) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('id')
            .eq('admin_id', user.id)
            .eq('organization_type', 'college')
            .maybeSingle();

          collegeId = orgData?.id;
        }

        return apiSuccess({ collegeId: collegeId || null }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Fetch subject groups with filters, search, pagination
      // ─────────────────────────────────────────────────
      case 'get-subject-groups': {
        const { collegeId, searchQuery, filters, dateRange, currentPage, itemsPerPage } = body;

        let query = supabase
          .from('college_subject_attendance_summary')
          .select('*', { count: 'exact' })
          .eq('college_id', collegeId);

        if (searchQuery) {
          query = query.or(
            `subject.ilike.%${searchQuery}%,faculty.ilike.%${searchQuery}%,department.ilike.%${searchQuery}%`
          );
        }

        if (filters) {
          if (filters.departments?.length > 0) {
            query = query.in('department', filters.departments);
          }
          if (filters.courses?.length > 0) {
            query = query.in('course', filters.courses);
          }
          if (filters.semesters?.length > 0) {
            query = query.in('semester', filters.semesters);
          }
          if (filters.sections?.length > 0) {
            query = query.in('section', filters.sections);
          }
          if (filters.statuses?.length > 0) {
            query = query.in('latest_status', filters.statuses);
          }
          if (filters.faculty?.length > 0) {
            query = query.in('faculty', filters.faculty);
          }
        }

        if (dateRange) {
          if (dateRange.from && dateRange.to) {
            query = query.gte('first_date', dateRange.from).lte('last_date', dateRange.to);
          } else if (dateRange.from) {
            query = query.gte('first_date', dateRange.from);
          } else if (dateRange.to) {
            query = query.lte('last_date', dateRange.to);
          }
        }

        if (currentPage && itemsPerPage) {
          const startIndex = (currentPage - 1) * itemsPerPage;
          query = query.range(startIndex, startIndex + itemsPerPage - 1);
        }

        const { data, error, count } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const transformedGroups = (data || []).map((item: any) => ({
          subject: item.subject,
          department: item.department,
          course: item.course,
          semester: item.semester,
          section: item.section,
          faculty: item.faculty,
          sessions: [],
          totalSessions: item.total_sessions,
          avgAttendancePercentage: item.avg_attendance_percentage,
          totallearners: item.total_learners,
          totalPresentCount: item.total_present_count,
          totalAbsentCount: item.total_absent_count,
          totalLateCount: item.total_late_count,
          totalExcusedCount: item.total_excused_count,
          dateRange: { first: item.first_date, last: item.last_date },
          latestStatus: item.latest_status,
        }));

        return apiSuccess({ groups: transformedGroups, totalCount: count }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Analytics for last 30 days
      // ─────────────────────────────────────────────────
      case 'get-analytics': {
        const { collegeId } = body;

        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('college_attendance_sessions')
          .select('id,status,attendance_percentage,total_learners,present_count,absent_count')
          .eq('college_id', collegeId)
          .gte('date', last30Days);

        if (error) return apiDbError(error, context.request, { startTime });

        const sessions = data || [];
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter((s: any) => s.status === 'completed').length;
        const avgAttendance = sessions.length > 0
          ? (sessions.reduce((acc: number, s: any) => acc + (s.attendance_percentage || 0), 0) / sessions.length).toFixed(1)
          : '0';
        
        // Get unique learner count from attendance records
        const { data: recordsData } = await supabase
          .from('college_attendance_records')
          .select('learner_id')
          .eq('college_id', collegeId)
          .gte('date', last30Days);
        
        const uniqueLearnerIds = new Set((recordsData || []).map((r: any) => r.learner_id));
        const totallearners = uniqueLearnerIds.size;
        
        const totalPresent = sessions.reduce((acc: number, s: any) => acc + (s.present_count || 0), 0);
        const totalAbsent = sessions.reduce((acc: number, s: any) => acc + (s.absent_count || 0), 0);
        const lowAttendanceSessions = sessions.filter((s: any) => (s.attendance_percentage || 0) < 75).length;

        return apiSuccess({
          totalSessions,
          completedSessions,
          avgAttendance,
          totallearners,
          totalPresent,
          totalAbsent,
          lowAttendanceSessions,
        }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Get department-wise attendance statistics
      // ─────────────────────────────────────────────────
      case 'get-department-stats': {
        const { collegeId } = body;

        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('college_attendance_sessions')
          .select('department_name, attendance_percentage, status')
          .eq('college_id', collegeId)
          .eq('status', 'completed')
          .gte('date', last30Days);

        if (error) return apiDbError(error, context.request, { startTime });

        // Group by department and calculate average
        const departmentMap = new Map<string, { total: number; count: number }>();
        
        (data || []).forEach((session: any) => {
          const dept = session.department_name;
          if (!dept) return;
          
          if (!departmentMap.has(dept)) {
            departmentMap.set(dept, { total: 0, count: 0 });
          }
          
          const stats = departmentMap.get(dept)!;
          stats.total += session.attendance_percentage || 0;
          stats.count += 1;
        });

        // Calculate averages and format for chart
        const departmentStats = Array.from(departmentMap.entries()).map(([dept, stats]) => ({
          department: dept,
          avgAttendance: stats.count > 0 ? Math.round(stats.total / stats.count) : 0,
        })).sort((a, b) => b.avgAttendance - a.avgAttendance); // Sort by attendance (highest first)

        return apiSuccess({ departmentStats }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Get weekly attendance trend (always Mon-Sun sequential)
      // ─────────────────────────────────────────────────
      case 'get-weekly-trend': {
        const { collegeId } = body;

        // Always show current week Monday-Sunday
        const today = new Date();
        const currentDayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const mondayOffset = currentDayOfWeek === 0 ? -6 : -(currentDayOfWeek - 1);
        
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weekData = weekDays.map((dayName, index) => {
          const date = new Date(today);
          date.setDate(date.getDate() + mondayOffset + index);
          return {
            date: date.toISOString().split('T')[0],
            dayName,
          };
        });

        const dateStrings = weekData.map(d => d.date);

        const { data, error } = await supabase
          .from('college_attendance_sessions')
          .select('date, attendance_percentage, status')
          .eq('college_id', collegeId)
          .in('date', dateStrings);

        if (error) return apiDbError(error, context.request, { startTime });

        // Group by date and calculate average
        const dateMap = new Map<string, { total: number; count: number }>();
        
        (data || []).forEach((session: any) => {
          if (session.status !== 'completed') return;
          
          if (!dateMap.has(session.date)) {
            dateMap.set(session.date, { total: 0, count: 0 });
          }
          
          const stats = dateMap.get(session.date)!;
          stats.total += session.attendance_percentage || 0;
          stats.count += 1;
        });

        // Build trend data in Mon-Sun order
        const weeklyTrend = weekData.map(({ date, dayName }) => {
          const stats = dateMap.get(date);
          return {
            date,
            dayName,
            avgAttendance: stats && stats.count > 0 ? Math.round(stats.total / stats.count) : 0,
          };
        });

        return apiSuccess({ weeklyTrend }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Fetch filter options (departments, courses, faculty, etc.)
      // ─────────────────────────────────────────────────
      case 'get-filter-options': {
        const { collegeId } = body;

        const [departmentsResult, programsResult, semestersResult, sectionsResult, facultyResult, subjectsResult] =
          await Promise.all([
            supabase.from('program_sections_view')
              .select('department_name, department_id')
              .eq('status', 'active')
              .not('department_name', 'is', null),
            supabase.from('program_sections_view')
              .select('program_name, program_id')
              .eq('status', 'active')
              .not('program_name', 'is', null),
            supabase.from('program_sections_view')
              .select('semester')
              .eq('status', 'active')
              .not('semester', 'is', null),
            supabase.from('program_sections_view')
              .select('section')
              .eq('status', 'active')
              .not('section', 'is', null),
            supabase.from('college_lecturers')
              .select('id,first_name,last_name,email,department,"collegeId",metadata')
              .eq('"accountStatus"', 'active')
              .eq('"collegeId"', collegeId),
            supabase.from('college_courses')
              .select('course_name, course_code, id, college_id')
              .eq('is_active', true)
              .eq('college_id', collegeId),
          ]);

        const departmentsMap = new Map<string, string>();
        (departmentsResult.data || []).forEach((d: any) => {
          if (d.department_name) departmentsMap.set(d.department_name, d.department_id);
        });

        const uniqueDepartments = Array.from(departmentsMap.keys());
        const uniquePrograms = [...new Set((programsResult.data || []).map((p: any) => p.program_name))];
        const uniqueSemesters = [...new Set((semestersResult.data || []).map((s: any) => s.semester))].sort((a: number, b: number) => a - b);
        const uniqueSections = [...new Set((sectionsResult.data || []).map((s: any) => s.section))].sort();

        const facultyOptions = (facultyResult.data || []).map((f: any) => {
          const metadata = f.metadata || {};
          const firstName = metadata.first_name || '';
          const lastName = metadata.last_name || '';
          const displayName = firstName && lastName ? `${firstName} ${lastName}` : f.email;
          return { value: f.id, label: `${displayName} (${f.department || 'No Dept'})` };
        });

        return apiSuccess({
          departments: uniqueDepartments,
          courses: uniquePrograms,
          semesters: uniqueSemesters,
          sections: uniqueSections,
          faculty: facultyOptions,
          subjects: subjectsResult.data || [],
        }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Fetch attendance records by subject name
      // ─────────────────────────────────────────────────
      case 'get-attendance-records': {
        const { subjectName } = body;

        const { data, error } = await supabase
          .from('college_attendance_records')
          .select('*')
          .eq('subject_name', subjectName);

        if (error) return apiDbError(error, context.request, { startTime });

        const records = (data || []).map((record: any) => ({
          id: record.id,
          learnerId: record.learner_id,
          learnerName: record.learner_name,
          rollNumber: record.roll_number,
          department: record.department_name,
          course: record.program_name,
          semester: record.semester,
          section: record.section,
          date: record.date,
          status: record.status,
          timeIn: record.time_in,
          timeOut: record.time_out,
          subject: record.subject_name,
          facultyId: record.faculty_id,
          facultyName: record.faculty_name,
          location: record.location,
          remarks: record.remarks,
          sessionId: record.session_id,
        }));

        return apiSuccess({ records }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Get learner count for a specific class
      // ─────────────────────────────────────────────────
      case 'get-learner-count': {
        const { department, course, semester, section } = body;

        const { data, error } = await supabase
          .from('program_sections_view')
          .select('max_learners')
          .eq('department_name', department)
          .eq('program_name', course)
          .eq('semester', parseInt(semester))
          .eq('section', section)
          .eq('status', 'active');

        if (error) return apiDbError(error, context.request, { startTime });

        const count = data && data.length > 0 ? data[0].max_learners || 0 : 0;
        return apiSuccess({ count }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Get sessions for a subject group (handleViewDetails)
      // ─────────────────────────────────────────────────
      case 'get-sessions': {
        const { subjectGroup } = body;

        const { data, error } = await supabase
          .from('college_attendance_sessions')
          .select('*')
          .eq('subject_name', subjectGroup.subject)
          .eq('department_name', subjectGroup.department)
          .eq('program_name', subjectGroup.course)
          .eq('semester', subjectGroup.semester)
          .eq('section', subjectGroup.section)
          .order('date', { ascending: false });

        if (error) return apiDbError(error, context.request, { startTime });

        const sessions = (data || []).map((session: any) => ({
          id: session.id,
          date: session.date,
          startTime: session.start_time,
          endTime: session.end_time,
          subject: session.subject_name,
          faculty: session.faculty_name,
          department: session.department_name,
          course: session.program_name,
          semester: session.semester,
          section: session.section,
          totallearners: session.total_learners,
          presentCount: session.present_count,
          absentCount: session.absent_count,
          lateCount: session.late_count,
          excusedCount: session.excused_count,
          attendancePercentage: session.attendance_percentage,
          status: session.status,
        }));

        return apiSuccess({ sessions }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Get learners for a specific subject group
      // ─────────────────────────────────────────────────
      case 'get-subject-learners': {
        const { department, course, semester, section, program_id: programIdParam, session_id: sessionIdParam } = body;

        // Prefer an exact program_id (duplicate program names exist when
        // specializations differ — a name lookup hits maybeSingle PGRST116).
        let programId = typeof programIdParam === 'string' && programIdParam ? programIdParam : null;
        if (!programId && typeof sessionIdParam === 'string' && sessionIdParam) {
          // Pre-linkage sessions: recover the program from the session row,
          // else from its imported records (which snapshot program_id).
          const { data: sess } = await supabase
            .from('college_attendance_sessions')
            .select('program_id')
            .eq('id', sessionIdParam)
            .maybeSingle();
          if (sess && (sess as any).program_id) {
            programId = (sess as any).program_id;
          } else {
            const { data: recProgs } = await supabase
              .from('college_attendance_records')
              .select('program_id')
              .eq('session_id', sessionIdParam)
              .not('program_id', 'is', null)
              .limit(2);
            const ids = Array.from(new Set(((recProgs || []) as any[]).map((r: any) => r.program_id).filter(Boolean)));
            if (ids.length === 1) programId = ids[0] as string;
          }
        }
        if (!programId) {
          const { data: programRows, error: programError } = await supabase
            .from('programs')
            .select('id')
            .eq('name', course)
            .limit(2);

          if (programError) return apiDbError(programError, context.request, { startTime });

          if (!programRows || programRows.length === 0) {
            return apiSuccess({ learners: [] }, context.request, { startTime });
          }
          if (programRows.length > 1) {
            return apiError(409, 'CONFLICT', `Multiple programs named '${course}' exist — open the session from a recreated (program-linked) session so the roster resolves exactly`, context.request, { startTime });
          }

          programId = programRows[0].id;
        }

        // Fetch learners matching the criteria
        const { data: learnersData, error: learnersError } = await supabase
          .from('learners')
          .select('id, name, roll_number, program_id, semester, section')
          .eq('is_deleted', false)
          .eq('program_id', programId)
          .eq('semester', parseInt(semester))
          .eq('section', section)
          .order('roll_number');

        if (learnersError) return apiDbError(learnersError, context.request, { startTime });

        const learners = (learnersData || []).map((learner: any) => ({
          id: learner.id,
          name: learner.name,
          rollNumber: learner.roll_number,
          department: department,
          course: course,
          semester: learner.semester,
          section: learner.section,
        }));

        return apiSuccess({ learners }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Delete sessions for a subject group
      // ─────────────────────────────────────────────────
      case 'delete-sessions': {
        const { subjectGroup } = body;

        const { error } = await supabase
          .from('college_attendance_sessions')
          .delete()
          .eq('subject_name', subjectGroup.subject)
          .eq('department_name', subjectGroup.department)
          .eq('program_name', subjectGroup.course)
          .eq('semester', subjectGroup.semester)
          .eq('section', subjectGroup.section);

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Get faculty member data for session creation
      // ─────────────────────────────────────────────────
      case 'get-faculty': {
        const { facultyId } = body;

        const { data, error } = await supabase
          .from('college_lecturers')
          .select('collegeId, first_name, last_name, metadata')
          .eq('id', facultyId)
          .single();

        if (error) return apiDbError(error, context.request, { startTime });
        if (!data) {
          return apiSuccess({ faculty: null }, context.request, { startTime });
        }

        const metadata = data.metadata || {};
        const firstName = metadata.first_name || '';
        const lastName = metadata.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';

        return apiSuccess({
          faculty: {
            collegeId: data.collegeId,
            firstName,
            lastName,
            fullName,
          },
        }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Create a new attendance session
      // ─────────────────────────────────────────────────
      case 'create-session': {
        const { sessionData, departmentName, programName, subjectName, facultyName, collegeId, createdBy } = body;

        const { error } = await supabase
          .from('college_attendance_sessions')
          .insert({
            date: sessionData.date,
            start_time: sessionData.startTime,
            end_time: sessionData.endTime,
            subject_name: subjectName,
            faculty_id: sessionData.faculty,
            faculty_name: facultyName,
            department_name: departmentName,
            program_name: programName,
            program_code: sessionData.programCode || body.programCode || null,
            program_id: sessionData.programId || body.program_id || body.programId || null,
            semester: parseInt(sessionData.semester),
            section: sessionData.section,
            room_number: sessionData.roomNumber,
            remarks: sessionData.remarks,
            status: 'scheduled',
            college_id: collegeId,
            created_by: createdBy,
          })
          .select()
          .single();

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ created: true }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Bulk import: list sessions available for import (session-picker flow)
      // ─────────────────────────────────────────────────
      case 'get-import-sessions': {
        const { college_id, department_name, program_id, subject_query, date } = body;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        // select * (never the new program_id by name): this list must keep
        // working on DBs where the bulk-import migration hasn't applied yet.
        let query = supabase
          .from('college_attendance_sessions')
          .select('*')
          .eq('college_id', college_id)
          .order('date', { ascending: false })
          .order('start_time', { ascending: false });

        if (department_name) query = query.eq('department_name', department_name);
        if (subject_query) query = query.ilike('subject_name', `%${subject_query}%`);
        if (date) query = query.eq('date', date);

        const { data: sessions, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        let list = (sessions || []) as any[];
        // program_id filter applied in code: pre-migration rows simply have
        // no program_id, so they are excluded only when a filter is active.
        if (program_id) {
          list = list.filter((s: any) => s.program_id === program_id);
        }

        // Program labels (CODE - specs) merged in code — no FK-join, so this
        // works with and without the migration applied.
        const ids = Array.from(new Set(
          list.map((s: any) => s.program_id).filter((id: unknown) => typeof id === 'string' && id),
        )) as string[];
        let byId: Record<string, any> = {};
        if (ids.length > 0) {
          const { data: progs, error: progError } = await supabase
            .from('programs')
            .select('id, name, code, specializations')
            .in('id', ids);
          if (progError) return apiDbError(progError, context.request, { startTime });
          byId = Object.fromEntries(((progs || []) as any[]).map((p: any) => [p.id, p]));
        }
        const withLabels = list.map((s: any) => ({
          ...s,
          programs: s.program_id && byId[s.program_id] ? byId[s.program_id] : null,
        }));

        return apiSuccess({ sessions: withLabels }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Bulk import: download a roster-prefilled CSV template for one session
      // ─────────────────────────────────────────────────
      case 'download-attendance-template': {
        const { college_id, session_id } = body;
        if (!college_id || !session_id) {
          return apiError(400, 'VALIDATION_ERROR', 'college_id and session_id are required', context.request, { startTime });
        }

        const { data: session, error: sessionError } = await supabase
          .from('college_attendance_sessions')
          .select('*')
          .eq('id', session_id)
          .eq('college_id', college_id)
          .maybeSingle();
        if (sessionError) return apiDbError(sessionError, context.request, { startTime });
        if (!session) return apiError(404, 'NOT_FOUND', 'Attendance session not found');

        let programId = session.program_id;
        if (!programId) {
          const { data: byName } = await supabase
            .from('programs')
            .select('id')
            .eq('name', session.program_name)
            .limit(2);
          if (!byName || byName.length !== 1) {
            return apiError(409, 'CONFLICT', 'This session is not linked to a single program — recreate it from Program & Sections, then download the template');
          }
          programId = (byName as any[])[0].id;
        }

        const { data: roster, error } = await supabase
          .from('learners')
          .select('roll_number, name, email')
          .eq('is_deleted', false)
          .eq('program_id', programId)
          .eq('semester', parseInt(session.semester, 10))
          .eq('section', session.section)
          .order('roll_number');

        if (error) return apiDbError(error, context.request, { startTime });
        if (!roster || roster.length === 0) {
          return apiError(404, 'NOT_FOUND', 'No students enrolled in this session\'s program, semester and section');
        }

        const esc = (v: unknown) => {
          const s = String(v ?? '');
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines = ['roll_number,name,email,status,time_in,remarks'];
        for (const l of roster as any[]) {
          lines.push([esc(l.roll_number), esc(l.name), esc(l.email), '', '', ''].join(','));
        }

        return apiSuccess({
          filename: `attendance-${String(session.date)}-${String(session.section).replace(/\s+/g, '')}.csv`,
          csv: lines.join('\n'),
          rosterSize: roster.length,
          session: { id: session.id, subject: session.subject_name, date: session.date, status: session.status },
        }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Bulk import: dry-run validation (no writes)
      // ─────────────────────────────────────────────────
      case 'validate-attendance-import': {
        const result = await validateAttendanceImport(supabase, body);
        if (!result.ok) {
          if (result.fatal) return apiError(result.fatal.status, result.fatal.code, result.fatal.message, context.request, { startTime });
          return apiSuccess({ valid: false, errors: result.errors, summary: result.summary }, context.request, { startTime });
        }
        return apiSuccess({ valid: true, errors: [], summary: result.summary, session: result.sessionInfo }, context.request, { startTime });
      }

      // ─────────────────────────────────────────────────
      // Bulk import: all-or-nothing write via atomic RPC
      // ─────────────────────────────────────────────────
      case 'import-attendance': {
        const result = await validateAttendanceImport(supabase, body);
        if (!result.ok) {
          if (result.fatal) return apiError(result.fatal.status, result.fatal.code, result.fatal.message, context.request, { startTime });
          return apiError(422, 'VALIDATION_ERROR', `Import blocked: ${result.errors.length} row error(s). Fix the file and retry — nothing was written.`, context.request, { startTime });
        }

        const user = getContextUser(context);
        const { error: rpcError, data: rpcData } = await supabase.rpc('import_college_attendance_records', {
          p_session_id: result.session!.id,
          p_records: result.recordsJson,
          p_marked_by: user?.id || null,
        });

        if (rpcError) return apiDbError(rpcError, context.request, { startTime });
        return apiSuccess({ imported: true, ...(rpcData as Record<string, unknown> || {}) }, context.request, { startTime });
      }

      default:
        return apiSuccess({}, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[attendance POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
