import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const isAdmin = user.roles?.some((r: string) =>
    ['admin', 'company_admin', 'owner', 'college_admin', 'university_admin', 'school_admin'].includes(r)
  );

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request, { startTime });
  }

  const { action, ...params } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request, { startTime });
  }

  try {
    switch (action) {

      // ============= ADMISSION WORKFLOW =============
      case 'create-application': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { schoolId, data } = params;
        const { data: application, error } = await supabase
          .from('admission_applications')
          .insert({ ...data, school_id: schoolId, status: 'pending' })
          .select()
          .single();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ application }, context.request, { startTime });
      }

      case 'generate-admission-receipt': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { applicationId } = params;
        const receiptUrl = `/receipts/admission/${applicationId}`;
        const { data: app, error: fetchError } = await supabase.from('admission_applications').select('documents').eq('id', applicationId).single();
        if (fetchError) return apiError(500, 'DB_ERROR', fetchError.message, context.request, { startTime });
        const { error: updateError } = await supabase.from('admission_applications').update({ documents: { ...(app?.documents || {}), admissionReceipt: receiptUrl } }).eq('id', applicationId);
        if (updateError) return apiError(500, 'DB_ERROR', updateError.message, context.request, { startTime });
        return apiSuccess({ receiptUrl }, context.request, { startTime });
      }

      case 'get-applications': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { schoolId, status, appliedFor } = params;
        let query = supabase.from('admission_applications').select('*').eq('school_id', schoolId).order('applied_date', { ascending: false });
        if (status) query = query.eq('status', status);
        if (appliedFor) query = query.eq('applied_for', appliedFor);
        const { data, error } = await query;
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ applications: data }, context.request, { startTime });
      }

      case 'update-application-status': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { applicationId, status, verifiedBy, remarks } = params;
        const updateData: any = { status, updated_at: new Date().toISOString() };
        if (status === 'approved') { updateData.verified_by = verifiedBy; updateData.verified_date = new Date().toISOString(); }
        if (remarks) updateData.remarks = remarks;
        const { data, error } = await supabase.from('admission_applications').update(updateData).eq('id', applicationId).select().single();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ application: data }, context.request, { startTime });
      }

      case 'approve-and-enroll': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { applicationId, academicYear, schoolId } = params;
        const { data: application, error: appError } = await supabase.from('admission_applications').select('*').eq('id', applicationId).single();
        if (appError || !application) return apiError(404, 'NOT_FOUND', 'Application not found', context.request, { startTime });
        const { data: enrollmentData, error: enrollError } = await supabase.rpc('generate_enrollment_number', { p_school_id: schoolId, p_academic_year: academicYear });
        if (enrollError) return apiError(500, 'DB_ERROR', enrollError.message, context.request, { startTime });
        const { error: updateError } = await supabase.from('admission_applications').update({ status: 'approved', enrollment_number: enrollmentData, verified_date: new Date().toISOString() }).eq('id', applicationId);
        if (updateError) return apiError(500, 'DB_ERROR', updateError.message, context.request, { startTime });
        return apiSuccess({ enrollmentNumber: enrollmentData }, context.request, { startTime });
      }

      case 'record-fee-payment': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { applicationId, amount } = params;
        const { data: application } = await supabase.from('admission_applications').select('fee_amount, fee_paid').eq('id', applicationId).single();
        if (!application) return apiError(404, 'NOT_FOUND', 'Application not found', context.request, { startTime });
        const newFeePaid = (application.fee_paid || 0) + amount;
        const feeStatus = newFeePaid >= (application.fee_amount || 0) ? 'paid' : 'partial';
        const { data, error } = await supabase.from('admission_applications').update({ fee_paid: newFeePaid, fee_status: feeStatus }).eq('id', applicationId).select().single();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ application: data }, context.request, { startTime });
      }

      case 'generate-application-number': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { schoolId } = params;
        const year = new Date().getFullYear().toString().slice(-2);
        const { count } = await supabase.from('admission_applications').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
        const sequence = (count || 0) + 1;
        return apiSuccess({ applicationNumber: `APP${year}${sequence.toString().padStart(5, '0')}` }, context.request, { startTime });
      }

      // ============= LEARNER PROFILE MANAGEMENT =============
      case 'create-extended-profile': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { data } = params;
        const { data: record, error } = await supabase.from('learner_management_records').insert(data).select().single();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ record }, context.request, { startTime });
      }

      case 'get-learner-profile': {
        const { learnerId } = params;
        const { data, error } = await supabase.from('learners').select('*, extended:learner_management_records(*), attendance:attendance_records(*)').eq('id', learnerId).single();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        const attendanceRecords = data.attendance || [];
        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter((r: any) => r.status === 'present').length;
        const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        return apiSuccess({ ...data, attendanceTrend: { totalDays, presentDays, absentDays: totalDays - presentDays, percentage, isAtRisk: percentage < 75 } }, context.request, { startTime });
      }

      case 'update-profile': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { learnerId, updates } = params;
        const { data, error } = await supabase.from('learner_management_records').update(updates).eq('learner_id', learnerId).select().single();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ record: data }, context.request, { startTime });
      }

      case 'get-school-learners': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { schoolId, filters } = params;
        let query = supabase.from('learner_management_records').select('*, learner:learners(*)').eq('school_id', schoolId);
        if (filters?.class) query = query.eq('class', filters.class);
        if (filters?.section) query = query.eq('section', filters.section);
        if (filters?.status) query = query.eq('status', filters.status);
        const { data, error } = await query.order('enrollment_number', { ascending: true });
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ learners: data }, context.request, { startTime });
      }

      // ============= ATTENDANCE MANAGEMENT =============
      case 'mark-attendance': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { records, markedBy } = params;
        const attendanceData = records.map((r: any) => ({
          learner_id: r.learnerId, school_id: r.schoolId, date: r.date || new Date().toISOString().split('T')[0],
          status: r.status, mode: 'manual', marked_by: markedBy, remarks: r.remarks,
        }));
        const { data: result, error } = await supabase.from('attendance_records').upsert(attendanceData, { onConflict: 'learner_id,date' }).select();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        await supabase.rpc('check_attendance_alerts');
        return apiSuccess({ records: result }, context.request, { startTime });
      }

      case 'check-attendance-alerts': {
        const { error } = await supabase.rpc('check_attendance_alerts');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'check-duplicate-attendance': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { learnerId, date } = params;
        const { data } = await supabase.from('attendance_records').select('id').eq('learner_id', learnerId).eq('date', date).eq('status', 'present').limit(1);
        return apiSuccess({ isDuplicate: (data && data.length > 0) || false }, context.request, { startTime });
      }

      case 'get-attendance': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { schoolId, startDate, endDate } = params;
        const { data, error } = await supabase.from('attendance_records').select('*, learner:learners(*, extended:learner_management_records(*))').eq('school_id', schoolId).gte('date', startDate).lte('date', endDate).order('date', { ascending: false });
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ records: data }, context.request, { startTime });
      }

      case 'get-learner-attendance-summary': {
        const { learnerId, startDate, endDate } = params;
        const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('attendance_records').select('*').eq('learner_id', learnerId).gte('date', start).lte('date', end);
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        const totalDays = data.length;
        const presentDays = data.filter((r: any) => r.status === 'present').length;
        const absentDays = data.filter((r: any) => r.status === 'absent').length;
        const lateDays = data.filter((r: any) => r.status === 'late').length;
        const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        return apiSuccess({ totalDays, presentDays, absentDays, lateDays, percentage, isAtRisk: percentage < 75, records: data }, context.request, { startTime });
      }

      case 'mark-attendance-mobile': {
        const { learnerId, schoolId, date, status, mode, timeIn, otpVerified } = params;
        const { data, error } = await supabase.from('attendance_records').insert({ learner_id: learnerId, school_id: schoolId, date: date || new Date().toISOString().split('T')[0], status: status || 'present', mode: mode || 'mobile', time_in: timeIn, otp_verified: otpVerified || false }).select().single();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ record: data }, context.request, { startTime });
      }

      case 'get-attendance-alerts': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { schoolId, unnotifiedOnly } = params;
        let query = supabase.from('attendance_alerts').select('*, learner:learners(*, extended:learner_management_records(*))').eq('school_id', schoolId);
        if (unnotifiedOnly) query = query.eq('parent_notified', false);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ alerts: data }, context.request, { startTime });
      }

      case 'mark-alert-notified': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { alertId } = params;
        const { error } = await supabase.from('attendance_alerts').update({ parent_notified: true, notified_date: new Date().toISOString() }).eq('id', alertId);
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ============= COLLEGE ATTENDANCE =============
      case 'create-attendance-session': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { sessionData } = params;
        const { data, error } = await supabase.from('college_attendance_sessions').insert({
          date: sessionData.date, start_time: sessionData.startTime, end_time: sessionData.endTime,
          subject_name: sessionData.subjectName, subject_code: sessionData.subjectCode,
          course_type: sessionData.courseType || 'theory', faculty_id: sessionData.facultyId,
          faculty_name: sessionData.facultyName, department_name: sessionData.departmentName,
          program_name: sessionData.programName, program_code: sessionData.programCode,
          semester: sessionData.semester, section: sessionData.section,
          room_number: sessionData.roomNumber, academic_year: sessionData.academicYear || '2024-25',
          status: 'scheduled', created_by: sessionData.createdBy, college_id: sessionData.collegeId,
        }).select().single();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ session: data }, context.request, { startTime });
      }

      case 'mark-college-attendance': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { records } = params;
        const { data, error } = await supabase.from('college_attendance_records').insert(records.map((r: any) => ({
          session_id: r.sessionId, learner_id: r.learnerId, learner_name: r.learnerName,
          roll_number: r.rollNumber, department_name: r.departmentName, program_name: r.programName,
          semester: r.semester, section: r.section, date: r.date, status: r.status,
          time_in: r.timeIn, time_out: r.timeOut, subject_name: r.subjectName,
          subject_code: r.subjectCode, faculty_id: r.facultyId, faculty_name: r.facultyName,
          location: r.location, remarks: r.remarks, marked_by: r.markedBy,
          marked_at: new Date().toISOString(), college_id: r.collegeId,
        }))).select();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ records: data }, context.request, { startTime });
      }

      case 'get-faculty-attendance-sessions': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { facultyId, collegeId, date } = params;
        let query = supabase.from('college_attendance_sessions').select('*').eq('faculty_id', facultyId).eq('college_id', collegeId);
        if (date) query = query.eq('date', date);
        const { data, error } = await query.order('date', { ascending: false }).order('start_time');
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ sessions: data }, context.request, { startTime });
      }

      case 'get-session-attendance-records': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { sessionId } = params;
        const { data, error } = await supabase.from('college_attendance_records').select('*').eq('session_id', sessionId).order('roll_number');
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ records: data }, context.request, { startTime });
      }

      case 'get-college-learner-attendance-summary': {
        const { learnerId, collegeId, startDate, endDate } = params;
        const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('college_attendance_records').select('*').eq('learner_id', learnerId).eq('college_id', collegeId).gte('date', start).lte('date', end);
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        const totalClasses = data.length;
        const presentClasses = data.filter((r: any) => r.status === 'present').length;
        const absentClasses = data.filter((r: any) => r.status === 'absent').length;
        const lateClasses = data.filter((r: any) => r.status === 'late').length;
        const excusedClasses = data.filter((r: any) => r.status === 'excused').length;
        const percentage = totalClasses > 0 ? ((presentClasses + lateClasses + excusedClasses) / totalClasses) * 100 : 0;
        return apiSuccess({ totalClasses, presentClasses, absentClasses, lateClasses, excusedClasses, percentage, isAtRisk: percentage < 75, records: data }, context.request, { startTime });
      }

      case 'get-college-attendance-analytics': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { collegeId, facultyId, startDate, endDate } = params;
        const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];
        let query = supabase.from('college_attendance_sessions').select('*').eq('college_id', collegeId).gte('date', start).lte('date', end);
        if (facultyId) query = query.eq('faculty_id', facultyId);
        const { data: sessions, error } = await query;
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter((s: any) => s.status === 'completed').length;
        const avgAttendance = sessions.length > 0 ? sessions.reduce((sum: number, s: any) => sum + (s.attendance_percentage || 0), 0) / sessions.length : 0;
        return apiSuccess({ totalSessions, completedSessions, pendingSessions: totalSessions - completedSessions, avgAttendance: Math.round(avgAttendance * 100) / 100, sessions }, context.request, { startTime });
      }

      // ============= LEARNER REPORTS =============
      case 'create-report': {
        const { reportData } = params;
        const { data, error } = await supabase.from('learner_reports').insert({
          learner_id: reportData.learnerId, school_id: reportData.schoolId,
          report_type: reportData.reportType, title: reportData.title,
          academic_year: reportData.academicYear, term: reportData.term,
          data: reportData.data, generated_by: user.id,
          has_school_logo: true, is_parent_friendly: true,
        }).select().single();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ report: data }, context.request, { startTime });
      }

      case 'get-learner-reports': {
        const { learnerId, reportType } = params;
        let query = supabase.from('learner_reports').select('*').eq('learner_id', learnerId);
        if (reportType) query = query.eq('report_type', reportType);
        const { data, error } = await query.order('generated_date', { ascending: false });
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ reports: data }, context.request, { startTime });
      }

      case 'get-learner-assessments': {
        const { learnerId, schoolId } = params;
        let query = supabase.from('skill_assessments').select('*').eq('learner_id', learnerId);
        if (schoolId) query = query.eq('school_id', schoolId);
        const { data, error } = await query;
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ assessments: data }, context.request, { startTime });
      }

      case 'get-monthly-attendance': {
        const { learnerId } = params;
        const { data } = await supabase.from('attendance_records').select('date, status').eq('learner_id', learnerId).gte('date', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]);
        const monthlyData: any = {};
        data?.forEach((record: any) => {
          const month = record.date.substring(0, 7);
          if (!monthlyData[month]) monthlyData[month] = { present: 0, absent: 0, total: 0 };
          monthlyData[month].total++;
          if (record.status === 'present') monthlyData[month].present++;
          if (record.status === 'absent') monthlyData[month].absent++;
        });
        return apiSuccess({ monthlyData }, context.request, { startTime });
      }

      case 'get-learner-alerts': {
        const { learnerId } = params;
        const { data } = await supabase.from('attendance_alerts').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }).limit(10);
        return apiSuccess({ alerts: data }, context.request, { startTime });
      }

      case 'storage-upload': {
        const { bucket, path, file_base64, content_type } = params;
        const buffer = Uint8Array.from(atob(file_base64), c => c.charCodeAt(0));
        const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(path, buffer, { contentType: content_type, upsert: true });
        if (uploadError) return apiError(500, 'STORAGE_ERROR', uploadError.message, context.request, { startTime });
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        return apiSuccess({ url: publicUrl, path }, context.request, { startTime });
      }

      case 'check-duplicate-learner': {
        if (!isAdmin) return apiError(403, 'FORBIDDEN', 'Admin only', context.request, { startTime });
        const { name, dateOfBirth, parentPhone } = params;
        const { data } = await supabase.from('admission_applications').select('id').eq('learner_name', name).eq('date_of_birth', dateOfBirth).eq('phone', parentPhone).limit(1);
        return apiSuccess({ isDuplicate: (data && data.length > 0) || false }, context.request, { startTime });
      }

      // ============= LEARNER PROGRESS & ENROLLMENTS =============
      case 'get-learner-progress': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('learner_course_progress')
          .select('*')
          .eq('learner_id', learnerId);
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-learner-enrollments': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('learner_id', learnerId);
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-assessment-recommendations': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('personal_assessment_results')
          .select('gemini_results')
          .eq('learner_id', learnerId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error) {
    console.error('[Management] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request, { startTime });
  }
});
