import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

interface SchoolLearner { user_id: string | null; }

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const startTime = Date.now();

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, schoolId } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  try {
    switch (action) {
      case 'get-kpi-data': {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

        // Step 1: get learner IDs for this school so fee_payments can be filtered by school
        let schoolLearnerIds: string[] = [];
        if (schoolId) {
          const { data: schoolLearners } = await supabase
            .from('learners')
            .select('user_id')
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .not('user_id', 'is', null);
          schoolLearnerIds = ((schoolLearners || []) as SchoolLearner[]).map((l) => l.user_id).filter((id): id is string => id !== null && id !== undefined);
        }

        // Step 2: run all KPI queries in parallel
        const [learnersRes, attendanceRes, examsRes, assessmentsRes, dailyFeesRes, weeklyFeesRes, monthlyFeesRes, libraryRes] = await Promise.all([
          schoolId
            ? supabase.from('learners').select('*', { count: 'exact', head: true }).eq('school_id', schoolId)
            : { count: 0, error: null },
          (() => {
            let q = supabase.from('attendance_records').select('status').eq('date', today);
            if (schoolId) q = q.eq('school_id', schoolId);
            return q;
          })(),
          (() => {
            let q = supabase.from('exam_timetable').select('*', { count: 'exact', head: true }).gte('exam_date', today);
            if (schoolId) q = q.eq('school_id', schoolId);
            return q;
          })(),
          (() => {
            let q = supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('is_published', false);
            if (schoolId) q = q.eq('school_id', schoolId);
            return q;
          })(),
          // fee_payments has no school_id — filter via learner_id instead
          schoolLearnerIds.length > 0
            ? supabase.from('fee_payments').select('amount').eq('status', 'completed').in('learner_id', schoolLearnerIds).eq('payment_date', today)
            : { data: [], error: null },
          schoolLearnerIds.length > 0
            ? supabase.from('fee_payments').select('amount').eq('status', 'completed').in('learner_id', schoolLearnerIds).gte('payment_date', weekAgo)
            : { data: [], error: null },
          schoolLearnerIds.length > 0
            ? supabase.from('fee_payments').select('amount').eq('status', 'completed').in('learner_id', schoolLearnerIds).gte('payment_date', monthAgo)
            : { data: [], error: null },
          (() => {
            let q = supabase.from('library_book_issues_school').select('*', { count: 'exact', head: true }).lt('due_date', today).is('return_date', null);
            if (schoolId) q = q.eq('school_id', schoolId);
            return q;
          })(),
        ]);

        let totalLearners = 0;
        if (!learnersRes.error) totalLearners = (learnersRes as any).count || 0;

        let attendancePercentage = 0;
        if (!attendanceRes.error && attendanceRes.data) {
          const present = attendanceRes.data.filter((a: any) => a.status === 'present').length;
          attendancePercentage = Math.round((present / (attendanceRes.data.length || 1)) * 100);
        }

        let examsScheduled = 0;
        if (!examsRes.error) examsScheduled = (examsRes as any).count || 0;

        let pendingAssessments = 0;
        if (!assessmentsRes.error) pendingAssessments = (assessmentsRes as any).count || 0;

        const dailyTotal = !dailyFeesRes.error && dailyFeesRes.data ? dailyFeesRes.data.reduce((s: number, f: any) => s + (f.amount || 0), 0) : 0;
        const weeklyTotal = !weeklyFeesRes.error && weeklyFeesRes.data ? weeklyFeesRes.data.reduce((s: number, f: any) => s + (f.amount || 0), 0) : 0;
        const monthlyTotal = !monthlyFeesRes.error && monthlyFeesRes.data ? monthlyFeesRes.data.reduce((s: number, f: any) => s + (f.amount || 0), 0) : 0;

        let libraryOverdue = 0;
        if (!libraryRes.error) libraryOverdue = (libraryRes as any).count || 0;

        return apiSuccess({
          totalLearners,
          attendancePercentage,
          examsScheduled,
          pendingAssessments,
          dailyTotal,
          weeklyTotal,
          monthlyTotal,
          libraryOverdue,
        }, context.request, { startTime });
      }

      case 'get-kpi-data-advanced': {
        const { grade, section } = body;
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

        // Step 1: get learner IDs for this school so fee_payments can be filtered by school
        let schoolLearnerIds: string[] = [];
        if (schoolId) {
          const { data: schoolLearners } = await supabase
            .from('learners')
            .select('user_id')
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .not('user_id', 'is', null);
          schoolLearnerIds = ((schoolLearners || []) as SchoolLearner[]).map((l) => l.user_id).filter((id): id is string => id !== null && id !== undefined);
        }

        // Step 2: run all KPI queries in parallel
        const [learnersRes, attendanceRes, examsRes, assessmentsRes, dailyFeesRes, weeklyFeesRes, monthlyFeesRes, libraryRes] = await Promise.all([
          (() => {
            let q = supabase.from('learners').select('*', { count: 'exact', head: true }).eq('status', 'active');
            if (schoolId) q = q.eq('school_id', schoolId);
            if (grade) q = q.eq('grade', grade);
            if (section) q = q.eq('section', section);
            return q;
          })(),
          (() => {
            let q = supabase.from('attendance_records').select('status, learner_id').eq('date', today);
            if (schoolId) q = q.eq('school_id', schoolId);
            return q;
          })(),
          (() => {
            let q = supabase.from('exam_timetable').select('*', { count: 'exact', head: true }).gte('exam_date', today);
            if (schoolId) q = q.eq('school_id', schoolId);
            return q;
          })(),
          (() => {
            let q = supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('is_published', false);
            if (schoolId) q = q.eq('school_id', schoolId);
            return q;
          })(),
          // fee_payments has no school_id — filter via learner_id instead
          schoolLearnerIds.length > 0
            ? supabase.from('fee_payments').select('amount').eq('status', 'completed').in('learner_id', schoolLearnerIds).gte('payment_date', today)
            : { data: [], error: null },
          schoolLearnerIds.length > 0
            ? supabase.from('fee_payments').select('amount').eq('status', 'completed').in('learner_id', schoolLearnerIds).gte('payment_date', weekAgo)
            : { data: [], error: null },
          schoolLearnerIds.length > 0
            ? supabase.from('fee_payments').select('amount').eq('status', 'completed').in('learner_id', schoolLearnerIds).gte('payment_date', monthAgo)
            : { data: [], error: null },
          (() => {
            let q = supabase.from('library_book_issues_school').select('*', { count: 'exact', head: true }).lt('due_date', today).is('return_date', null);
            if (schoolId) q = q.eq('school_id', schoolId);
            return q;
          })(),
        ]);

        let totalLearners = 0;
        if (!learnersRes.error) totalLearners = (learnersRes as any).count || 0;

        let attendancePercentage = 0;
        if (!attendanceRes.error && attendanceRes.data) {
          const present = attendanceRes.data.filter((a: any) => a.status === 'present').length;
          attendancePercentage = Math.round((present / (attendanceRes.data.length || 1)) * 100);
        }

        let examsScheduled = 0;
        if (!examsRes.error) examsScheduled = (examsRes as any).count || 0;

        let pendingAssessments = 0;
        if (!assessmentsRes.error) pendingAssessments = (assessmentsRes as any).count || 0;

        const dailyTotal = !dailyFeesRes.error && dailyFeesRes.data ? dailyFeesRes.data.reduce((s: number, f: any) => s + (f.amount || 0), 0) : 0;
        const weeklyTotal = !weeklyFeesRes.error && weeklyFeesRes.data ? weeklyFeesRes.data.reduce((s: number, f: any) => s + (f.amount || 0), 0) : 0;
        const monthlyTotal = !monthlyFeesRes.error && monthlyFeesRes.data ? monthlyFeesRes.data.reduce((s: number, f: any) => s + (f.amount || 0), 0) : 0;

        let libraryOverdue = 0;
        if (!libraryRes.error) libraryOverdue = (libraryRes as any).count || 0;

        return apiSuccess({
          totallearners: totalLearners,
          attendanceToday: attendancePercentage,
          examsScheduled,
          pendingAssessments,
          feeCollection: { daily: dailyTotal, weekly: weeklyTotal, monthly: monthlyTotal },
          careerReadinessIndex: 0,
          libraryOverdue,
        }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[kpi-dashboard/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
