import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth, getContextUser } from '../../lib/auth';
import { apiDbError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';


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
        const { department, course, semester, section } = body;

        // First, get program_id from programs table
        const { data: programData, error: programError } = await supabase
          .from('programs')
          .select('id')
          .eq('name', course)
          .maybeSingle();

        if (programError) return apiDbError(programError, context.request, { startTime });

        if (!programData) {
          return apiSuccess({ learners: [] }, context.request, { startTime });
        }

        const programId = programData.id;

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
