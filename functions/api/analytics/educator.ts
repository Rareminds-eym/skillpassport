import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError } from '../../lib/response';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from '../../lib/types';

/** Educator scope params, as sent by the frontend's EducatorCourseAnalyticsScope (entities/course-analytics/api/queries.ts) and consumed by every action in this file. */
interface EducatorScopeParams {
  schoolId?: string;
  collegeId?: string;
  educatorType?: 'school' | 'college' | null;
  educatorRole?: string | null;
  assignedClassIds?: string[];
}

async function getFilteredLearnerIds(supabase: SupabaseClient, params: EducatorScopeParams, userId: string): Promise<string[]> {
  const { schoolId, collegeId, educatorType, educatorRole, assignedClassIds } = params;
  if (!schoolId && !collegeId) return [];

  try {
    if (educatorType === 'school' && schoolId) {
      if (educatorRole === 'admin' || educatorRole === 'school_admin') {
        const { data } = await supabase
          .from('learners').select('user_id')
          .eq('school_id', schoolId).eq('is_deleted', false)
          .is('college_id', null).not('learner_id', 'is', null);
        return data?.map((s: any) => s.user_id).filter(Boolean) || [];
      } else if (assignedClassIds?.length > 0) {
        const { data } = await supabase
          .from('learners').select('user_id')
          .eq('school_id', schoolId).in('school_class_id', assignedClassIds)
          .eq('is_deleted', false).is('college_id', null).not('learner_id', 'is', null);
        return data?.map((s: any) => s.user_id).filter(Boolean) || [];
      }
      return [];
    } else if (educatorType === 'college' && collegeId) {
      const { data: programSections } = await supabase
        .from('program_sections')
        .select('program_id, semester, section')
        .eq('faculty_id', userId).eq('status', 'active');

      if (!programSections?.length) return [];

      const orConditions = programSections.map((s: any) =>
        `and(program_id.eq.${s.program_id},semester.eq.${s.semester},section.eq.${s.section})`
      ).join(',');

      const { data: learners } = await supabase
        .from('learners').select('user_id')
        .eq('college_id', collegeId).eq('is_deleted', false)
        .is('school_id', null).not('learner_id', 'is', null)
        .or(orConditions);

      return learners?.filter((s: any) => s.user_id != null).map((s: any) => s.user_id) || [];
    }
    return [];
  } catch (error: any) {
    console.error('[getFilteredLearnerIds] Error:', error?.message || error);
    return [];
  }
}

/**
 * Exported so functions/api/educator/course-analytics.ts can reuse the exact
 * same educator→learner scoping logic (school class assignment / college
 * program_sections.faculty_id) instead of duplicating it.
 */
export async function getFilteredLearnerRecordIds(supabase: SupabaseClient, params: EducatorScopeParams, userId: string): Promise<string[]> {
  const { schoolId, collegeId, educatorType, educatorRole, assignedClassIds } = params;
  if (!schoolId && !collegeId) return [];

  try {
    if (educatorType === 'school' && schoolId) {
      if (educatorRole === 'admin' || educatorRole === 'school_admin') {
        const { data } = await supabase
          .from('learners').select('id')
          .eq('school_id', schoolId).eq('is_deleted', false)
          .is('college_id', null).not('learner_id', 'is', null);
        return data?.map((s: any) => s.id).filter(Boolean) || [];
      } else if (assignedClassIds?.length > 0) {
        const { data } = await supabase
          .from('learners').select('id')
          .eq('school_id', schoolId).in('school_class_id', assignedClassIds)
          .eq('is_deleted', false).is('college_id', null).not('learner_id', 'is', null);
        return data?.map((s: any) => s.id).filter(Boolean) || [];
      }
      return [];
    } else if (educatorType === 'college' && collegeId) {
      const { data: programSections } = await supabase
        .from('program_sections')
        .select('program_id, semester, section')
        .eq('faculty_id', userId).eq('status', 'active');

      if (!programSections?.length) return [];

      const orConditions = programSections.map((s: any) =>
        `and(program_id.eq.${s.program_id},semester.eq.${s.semester},section.eq.${s.section})`
      ).join(',');

      const { data: learners } = await supabase
        .from('learners').select('id')
        .eq('college_id', collegeId).eq('is_deleted', false)
        .is('school_id', null).not('learner_id', 'is', null)
        .or(orConditions);

      return learners?.map((s: any) => s.id).filter(Boolean) || [];
    }
    return [];
  } catch (error: any) {
    console.error('[getFilteredLearnerRecordIds] Error:', error?.message || error);
    return [];
  }
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const supabase = getServiceClient(context.env as unknown as PagesEnv);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      case 'get-kpi-data': {
        const learnerIds = await getFilteredLearnerIds(supabase, params, user.id);
        if (!learnerIds.length) {
          return apiSuccess({
            activelearners: 0, totalVerifiedActivities: 0, pendingVerifications: 0,
            avgSkillsPerLearner: 0, attendanceRate: 0, engagementRate: 0
          }, context.request, { startTime });
        }

        const buildCountQuery = (table: string) =>
          supabase.from(table).select('id', { count: 'exact', head: true }).in('learner_id', learnerIds);

        const buildDataQuery = (table: string, select: string) =>
          supabase.from(table).select(select).in('learner_id', learnerIds);

        const [
          { count: approvedProjects }, { count: approvedCerts }, { count: approvedTrainings },
          { count: sentToAdminProjects }, { count: sentToAdminCerts }, { count: sentToAdminTrainings },
          { count: pendingProjects }, { count: pendingCerts }, { count: pendingTrainings },
          { data: allSkills }, { data: projectLearners }, { data: certLearners }, { data: trainingLearners },
        ] = await Promise.all([
          buildCountQuery('projects').eq('approval_status', 'approved'),
          buildCountQuery('certificates').eq('approval_status', 'approved'),
          buildCountQuery('trainings').eq('approval_status', 'approved'),
          buildCountQuery('projects').eq('approval_status', 'sent_to_admin'),
          buildCountQuery('certificates').eq('approval_status', 'sent_to_admin'),
          buildCountQuery('trainings').eq('approval_status', 'sent_to_admin'),
          buildCountQuery('projects').eq('approval_status', 'pending'),
          buildCountQuery('certificates').eq('approval_status', 'pending'),
          buildCountQuery('trainings').eq('approval_status', 'pending'),
          buildDataQuery('skills', 'learner_id').eq('enabled', true),
          buildDataQuery('projects', 'learner_id'),
          buildDataQuery('certificates', 'learner_id'),
          buildDataQuery('trainings', 'learner_id'),
        ]);

        const activeLearnerSet = new Set<string>();
        (allSkills as Array<{ learner_id: string }> | null)?.forEach(s => s.learner_id && activeLearnerSet.add(s.learner_id));
        (projectLearners as Array<{ learner_id: string }> | null)?.forEach(p => p.learner_id && activeLearnerSet.add(p.learner_id));
        (certLearners as Array<{ learner_id: string }> | null)?.forEach(c => c.learner_id && activeLearnerSet.add(c.learner_id));
        (trainingLearners as Array<{ learner_id: string }> | null)?.forEach(t => t.learner_id && activeLearnerSet.add(t.learner_id));

        const activelearners = activeLearnerSet.size;
        const totalApproved = (approvedProjects || 0) + (approvedCerts || 0) + (approvedTrainings || 0);
        const totalSentToAdmin = (sentToAdminProjects || 0) + (sentToAdminCerts || 0) + (sentToAdminTrainings || 0);
        const totalVerified = totalApproved + totalSentToAdmin;
        const totalPending = (pendingProjects || 0) + (pendingCerts || 0) + (pendingTrainings || 0);
        const avgSkills = activelearners ? (allSkills?.length || 0) / activelearners : 0;

        let attendanceRate = 0;
        let engagementRate = 0;

        if ((params.educatorType === 'school' || params.educatorType === 'college') && learnerIds.length > 0) {
          const learnerRecordIds = await getFilteredLearnerRecordIds(supabase, params, user.id);
          const table = params.educatorType === 'school' ? 'attendance_records' : 'college_attendance_records';
          const idField = params.educatorType === 'school' ? 'school_id' : 'college_id';
          const entityId = params.educatorType === 'school' ? params.schoolId : params.collegeId;

          if (learnerRecordIds.length > 0 && entityId) {
            const { data: records } = await supabase
              .from(table).select('status, learner_id')
              .eq(idField, entityId).in('learner_id', learnerRecordIds);

            if (records?.length) {
              const presentCount = records.filter((r: any) => r.status === 'present' || r.status === 'late').length;
              attendanceRate = Math.round((presentCount / records.length) * 100);
            }
          }
        }

        if (activelearners > 0) {
          engagementRate = Math.min(100, Math.round(((totalVerified + totalPending) / activelearners) * 10));
        }

        return apiSuccess({
          activelearners, totalVerifiedActivities: totalVerified, pendingVerifications: totalPending,
          avgSkillsPerLearner: Math.round(avgSkills * 10) / 10, attendanceRate, engagementRate,
        }, context.request, { startTime });
      }

      case 'get-skill-summary': {
        const learnerIds = await getFilteredLearnerIds(supabase, params, user.id);
        if (!learnerIds.length) return apiSuccess([], context.request, { startTime });

        const { data: skills } = await supabase
          .from('skills').select('type, verified, level, learner_id, enabled')
          .eq('enabled', true).in('learner_id', learnerIds);

        if (!skills) return apiSuccess([], context.request, { startTime });

        const totallearners = learnerIds.length;
        const categoryMap: Record<string, { total: number; verified: number; totalLevels: number; learnerSet: Set<string> }> = {};

        skills.forEach((skill: any) => {
          const category = skill.type || 'Other';
          if (!categoryMap[category]) categoryMap[category] = { total: 0, verified: 0, totalLevels: 0, learnerSet: new Set() };
          categoryMap[category].total++;
          if (skill.verified === true) categoryMap[category].verified++;
          categoryMap[category].totalLevels += skill.level || 0;
          categoryMap[category].learnerSet.add(skill.learner_id);
        });

        const summary = Object.entries(categoryMap)
          .map(([category, data]) => ({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            totalActivities: data.total,
            verifiedActivities: data.verified,
            participationRate: totallearners ? Math.round((data.learnerSet.size / totallearners) * 100) : 0,
            avgScore: data.total ? Math.round((data.totalLevels / data.total) * 20) : 0,
          }))
          .sort((a, b) => b.totalActivities - a.totalActivities);

        return apiSuccess(summary, context.request, { startTime });
      }

      case 'get-attendance-data': {
        const learnerIds = await getFilteredLearnerIds(supabase, params, user.id);
        if (!learnerIds.length) return apiSuccess([], context.request, { startTime });

        const months: Array<{ label: string; startDate: string; endDate: string }> = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            label: date.toLocaleDateString('en-US', { month: 'short' }),
            startDate: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
            endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString(),
          });
        }

        const attendancePromises = months.map(async (month) => {
          let attendanceRecords: Array<{ status: string; date: string; learner_id: string }> = [];

          if (params.educatorType === 'school' && params.schoolId) {
            const learnerRecordIds = await getFilteredLearnerRecordIds(supabase, params, user.id);
            const { data } = await supabase
              .from('attendance_records').select('status, date, learner_id')
              .eq('school_id', params.schoolId).in('learner_id', learnerRecordIds)
              .gte('date', month.startDate).lte('date', month.endDate);
            attendanceRecords = data || [];
          } else if (params.educatorType === 'college' && params.collegeId) {
            const learnerRecordIds = await getFilteredLearnerRecordIds(supabase, params, user.id);
            const { data } = await supabase
              .from('college_attendance_records').select('status, date, learner_id')
              .eq('college_id', params.collegeId).in('learner_id', learnerRecordIds)
              .gte('date', month.startDate).lte('date', month.endDate);
            attendanceRecords = data || [];
          }

          return {
            month: month.label,
            present: attendanceRecords.filter(r => r.status === 'present').length,
            absent: attendanceRecords.filter(r => r.status === 'absent').length,
            late: attendanceRecords.filter(r => r.status === 'late').length,
          };
        });

        const data = await Promise.all(attendancePromises);
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-skill-growth': {
        const learnerIds = await getFilteredLearnerIds(supabase, params, user.id);
        if (!learnerIds.length) return apiSuccess([], context.request, { startTime });

        const months: Array<{ label: string; startDate: string; endDate: string }> = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            label: date.toLocaleDateString('en-US', { month: 'short' }),
            startDate: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
            endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString(),
          });
        }

        const growthPromises = months.map(async (month) => {
          const { data: skills } = await supabase
            .from('skills').select('type, level')
            .lte('created_at', month.endDate).eq('enabled', true)
            .eq('approval_status', 'approved').in('learner_id', learnerIds);

          const technical = skills?.filter((s: any) => s.type === 'technical') || [];
          const softSkills = skills?.filter((s: any) => s.type === 'soft') || [];

          const avgTechnical = technical.length
            ? Math.round((technical.reduce((sum: number, s: any) => sum + (s.level || 0), 0) / technical.length) * 20) : 0;
          const avgSoft = softSkills.length
            ? Math.round((softSkills.reduce((sum: number, s: any) => sum + (s.level || 0), 0) / softSkills.length) * 20) : 0;

          return { month: month.label, technical: avgTechnical, communication: avgSoft, leadership: Math.max(0, avgSoft - 5), creativity: Math.max(0, avgTechnical - 10) };
        });

        const rawData = await Promise.all(growthPromises);

        const filledData = rawData.map((current, index) => {
          if (current.technical === 0 && current.communication === 0) {
            let prevIndex = index - 1;
            while (prevIndex >= 0 && rawData[prevIndex].technical === 0) prevIndex--;
            let nextIndex = index + 1;
            while (nextIndex < rawData.length && rawData[nextIndex].technical === 0) nextIndex++;

            if (prevIndex >= 0 && nextIndex < rawData.length) {
              const progress = (index - prevIndex) / (nextIndex - prevIndex);
              const interpolate = (a: number, b: number) => Math.round(a + (b - a) * progress);
              return {
                month: current.month,
                technical: interpolate(rawData[prevIndex].technical, rawData[nextIndex].technical),
                communication: interpolate(rawData[prevIndex].communication, rawData[nextIndex].communication),
                leadership: interpolate(rawData[prevIndex].leadership, rawData[nextIndex].leadership),
                creativity: interpolate(rawData[prevIndex].creativity, rawData[nextIndex].creativity),
              };
            } else if (prevIndex >= 0) return { ...rawData[prevIndex], month: current.month };
            else if (nextIndex < rawData.length) return { ...rawData[nextIndex], month: current.month };
          }
          return current;
        });

        return apiSuccess(filledData, context.request, { startTime });
      }

      case 'get-leaderboard': {
        const { schoolId, collegeId, educatorType, educatorRole, assignedClassIds } = params;
        let learnersQuery: any;

        if (educatorType === 'school' && schoolId) {
          if (educatorRole === 'admin' || educatorRole === 'school_admin') {
            learnersQuery = supabase.from('learners').select('id, user_id, name, learner_id')
              .eq('school_id', schoolId).eq('is_deleted', false)
              .is('college_id', null).not('learner_id', 'is', null);
          } else if (assignedClassIds?.length) {
            learnersQuery = supabase.from('learners').select('id, user_id, name, learner_id')
              .eq('school_id', schoolId).in('school_class_id', assignedClassIds)
              .eq('is_deleted', false).is('college_id', null).not('learner_id', 'is', null);
          } else {
            return apiSuccess([], context.request, { startTime });
          }
        } else if (educatorType === 'college' && collegeId) {
          const { data: programSections } = await supabase
            .from('program_sections').select('program_id, semester, section')
            .eq('faculty_id', user.id).eq('status', 'active');

          if (!programSections?.length) return apiSuccess([], context.request, { startTime });

          const orConditions = programSections.map((s: any) =>
            `and(program_id.eq.${s.program_id},semester.eq.${s.semester},section.eq.${s.section})`
          ).join(',');

          learnersQuery = supabase.from('learners').select('id, user_id, name, learner_id')
            .eq('college_id', collegeId).eq('is_deleted', false)
            .is('school_id', null).not('learner_id', 'is', null)
            .or(orConditions);
        } else {
          return apiSuccess([], context.request, { startTime });
        }

        const { data: learners } = await learnersQuery;
        if (!learners?.length) return apiSuccess([], context.request, { startTime });

        const learnerUserIds = learners.map((s: any) => s.user_id || s.id).filter(Boolean);

        const [projectsResult, certificatesResult, trainingsResult] = await Promise.all([
          supabase.from('projects').select('learner_id, approval_status').in('learner_id', learnerUserIds).eq('enabled', true),
          supabase.from('certificates').select('learner_id, approval_status').in('learner_id', learnerUserIds).eq('enabled', true),
          supabase.from('trainings').select('learner_id, approval_status').in('learner_id', learnerUserIds).eq('enabled', true),
        ]);

        const activityMap: Record<string, { total: number; verified: number }> = {};
        learners.forEach((s: any) => { const key = s.user_id || s.id; activityMap[key] = { total: 0, verified: 0 }; });

        [...(projectsResult.data || []), ...(certificatesResult.data || []), ...(trainingsResult.data || [])].forEach((activity: any) => {
          if (activity && activityMap[activity.learner_id]) {
            activityMap[activity.learner_id].total++;
            if (activity.approval_status === 'sent_to_admin' || activity.approval_status === 'approved') {
              activityMap[activity.learner_id].verified++;
            }
          }
        });

        const leaderboardData = learners
          .map((learner: any) => {
            const key = learner.user_id || learner.id;
            const { total, verified } = activityMap[key] || { total: 0, verified: 0 };
            return {
              learnerId: learner.learner_id || learner.id, learnerName: learner.name || 'Unknown Learner',
              totalActivities: total, verifiedActivities: verified, awards: Math.floor(verified / 5),
              progress: total > 0 ? Math.round((verified / total) * 100) : 0,
            };
          })
          .sort((a: any, b: any) => b.verifiedActivities !== a.verifiedActivities ? b.verifiedActivities - a.verifiedActivities : b.totalActivities - a.totalActivities)
          .map((entry: any, index: number) => ({ ...entry, rank: index + 1 }));

        return apiSuccess(leaderboardData, context.request, { startTime });
      }

      case 'get-activity-heatmap': {
        const learnerIds = await getFilteredLearnerIds(supabase, params, user.id);
        if (!learnerIds.length) return apiSuccess([], context.request, { startTime });

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const startDate = ninetyDaysAgo.toISOString();

        const [projectsResult, certificatesResult, trainingsResult] = await Promise.all([
          supabase.from('projects').select('created_at').gte('created_at', startDate).in('learner_id', learnerIds),
          supabase.from('certificates').select('created_at').gte('created_at', startDate).in('learner_id', learnerIds),
          supabase.from('trainings').select('created_at').gte('created_at', startDate).in('learner_id', learnerIds),
        ]);

        const dateCountMap: Record<string, number> = {};
        [...(projectsResult.data || []), ...(certificatesResult.data || []), ...(trainingsResult.data || [])].forEach((activity: any) => {
          const date = activity.created_at?.split('T')[0];
          if (date) dateCountMap[date] = (dateCountMap[date] || 0) + 1;
        });

        const heatmapData: Array<{ date: string; count: number }> = [];
        const now = new Date();
        for (let i = 89; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          heatmapData.push({ date: dateStr, count: dateCountMap[dateStr] || 0 });
        }

        return apiSuccess(heatmapData, context.request, { startTime });
      }

      case 'get-certificate-stats': {
        const learnerIds = await getFilteredLearnerIds(supabase, params, user.id);
        if (!learnerIds.length) return apiSuccess([], context.request, { startTime });

        const { data: certificates } = await supabase
          .from('certificates').select('created_at, approval_status').in('learner_id', learnerIds);

        if (!certificates) return apiSuccess([], context.request, { startTime });

        const monthlyStats = new Map<string, { issued: number; pending: number; rejected: number }>();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach(m => monthlyStats.set(m, { issued: 0, pending: 0, rejected: 0 }));

        certificates.forEach((cert: any) => {
          const monthName = new Date(cert.created_at).toLocaleDateString('en-US', { month: 'short' });
          if (monthlyStats.has(monthName)) {
            const stats = monthlyStats.get(monthName)!;
            if (cert.approval_status === 'approved') stats.issued++;
            else if (cert.approval_status === 'pending') stats.pending++;
            else if (cert.approval_status === 'rejected') stats.rejected++;
          }
        });

        const result = Array.from(monthlyStats.entries())
          .map(([month, stats]) => ({ month, ...stats }))
          .slice(-6);

        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-assignment-stats': {
        const learnerIds = await getFilteredLearnerIds(supabase, params, user.id);
        if (!learnerIds.length) return apiSuccess([], context.request, { startTime });

        const { data: learnerAssignments } = await supabase
          .from('learner_assignments').select('status, submission_date, is_deleted')
          .eq('is_deleted', false).in('learner_id', learnerIds);

        if (!learnerAssignments) return apiSuccess([], context.request, { startTime });

        const now = new Date();
        const monthlyStats = new Map<string, { pending: number; submitted: number; graded: number }>();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthlyStats.set(date.toLocaleDateString('en-US', { month: 'short' }), { pending: 0, submitted: 0, graded: 0 });
        }

        learnerAssignments.forEach((assignment: any) => {
          const monthName = new Date(assignment.submission_date || now).toLocaleDateString('en-US', { month: 'short' });
          if (monthlyStats.has(monthName)) {
            const stats = monthlyStats.get(monthName)!;
            if (assignment.status === 'todo' || assignment.status === 'in-progress') stats.pending++;
            else if (assignment.status === 'submitted') stats.submitted++;
            else if (assignment.status === 'graded') stats.graded++;
          }
        });

        return apiSuccess(Array.from(monthlyStats.entries()).map(([month, stats]) => ({ month, ...stats })), context.request, { startTime });
      }

      case 'get-assignment-details': {
        const learnerIds = await getFilteredLearnerIds(supabase, params, user.id);
        if (!learnerIds.length) return apiSuccess([], context.request, { startTime });

        const { data: assignments } = await supabase
          .from('assignments').select('assignment_id, title, is_deleted').eq('is_deleted', false);

        if (!assignments?.length) return apiSuccess([], context.request, { startTime });

        const assignmentIds = assignments.map((a: any) => a.assignment_id);
        const { data: learnerAssignments } = await supabase
          .from('learner_assignments').select('assignment_id, status, grade_percentage, is_deleted')
          .in('assignment_id', assignmentIds).eq('is_deleted', false).in('learner_id', learnerIds);

        if (!learnerAssignments) return apiSuccess([], context.request, { startTime });

        const detailsMap: Record<string, { title: string; total: number; submitted: number; graded: number; pending: number; totalGrade: number; gradeCount: number }> = {};
        assignments.forEach((a: any) => {
          detailsMap[a.assignment_id] = { title: a.title || 'Untitled', total: 0, submitted: 0, graded: 0, pending: 0, totalGrade: 0, gradeCount: 0 };
        });

        learnerAssignments.forEach((sa: any) => {
          if (detailsMap[sa.assignment_id]) {
            const d = detailsMap[sa.assignment_id];
            d.total++;
            if (sa.status === 'todo' || sa.status === 'in-progress') d.pending++;
            else if (sa.status === 'submitted') d.submitted++;
            else if (sa.status === 'graded') { d.graded++; if (sa.grade_percentage != null) { d.totalGrade += sa.grade_percentage; d.gradeCount++; } }
          }
        });

        const result = assignments
          .map((a: any) => ({
            assignmentId: a.assignment_id, title: detailsMap[a.assignment_id].title,
            total: detailsMap[a.assignment_id].total, submitted: detailsMap[a.assignment_id].submitted,
            graded: detailsMap[a.assignment_id].graded, pending: detailsMap[a.assignment_id].pending,
            averageGrade: detailsMap[a.assignment_id].gradeCount > 0 ? Math.round(detailsMap[a.assignment_id].totalGrade / detailsMap[a.assignment_id].gradeCount) : 0,
          }))
          .sort((a: any, b: any) => b.total - a.total);

        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-top-skills': {
        const learnerIds = await getFilteredLearnerIds(supabase, params, user.id);
        if (!learnerIds.length) return apiSuccess([], context.request, { startTime });

        const { data: skills } = await supabase
          .from('skills').select('name, learner_id, level, enabled')
          .eq('enabled', true).in('learner_id', learnerIds);

        if (!skills?.length) return apiSuccess([], context.request, { startTime });

        const skillMap = new Map<string, { count: number; totalLevel: number }>();
        skills.forEach((skill: any) => {
          if (!skillMap.has(skill.name)) skillMap.set(skill.name, { count: 0, totalLevel: 0 });
          const data = skillMap.get(skill.name)!;
          data.count++; data.totalLevel += skill.level || 0;
        });

        const result = Array.from(skillMap.entries())
          .map(([name, data]) => ({ skillName: name, learnerCount: data.count, averageLevel: Math.round((data.totalLevel / data.count) * 100) / 100 }))
          .sort((a, b) => b.learnerCount - a.learnerCount)
          .slice(0, 8);

        return apiSuccess(result, context.request, { startTime });
      }

      default:
        return apiError(400, 'INVALID_ACTION', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    return apiDbError(error, context.request, { startTime });
  }
});
