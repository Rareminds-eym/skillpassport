import type { ContextWithUser } from '@rareminds-eym/auth-core';
import { getContextUser, requireAdmin, withAuth } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

// Admin-gated learner actions (approve/reject/promote/graduate). The caller
// authorization is the shared admin role group, enforced by `requireAdmin`
// (replaces the prior inline `['admin','company_admin',...]` literal — bug §7.1).
export const onRequestPost = withAuth(requireAdmin(async (context: ContextWithUser) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const startTime = Date.now();

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request, { startTime });
  }

  const { action, learnerId } = body;
  if (!action || !learnerId) {
    return apiError(400, 'VALIDATION_ERROR', 'action and learnerId are required', context.request, { startTime });
  }

  try {
    switch (action) {
      case 'approve':
      case 'reject': {
        const { data: learnerRecord } = await supabase.from('learners').select('enrollmentDate, metadata').eq('id', learnerId).single();
        const updateData: any = {
          approval_status: action === 'approve' ? 'approved' : 'rejected',
          updated_at: new Date().toISOString(),
        };

        if (action === 'approve' && !learnerRecord?.enrollmentDate) {
          updateData.enrollmentDate = new Date().toISOString().split('T')[0];
        }

        if (body.reason) {
          updateData.metadata = {
            ...(learnerRecord?.metadata || {}),
            approval_reason: body.reason,
            approval_date: new Date().toISOString(),
          };
        }

        const { error } = await supabase.from('learners').update(updateData).eq('id', learnerId);
        if (error) throw error;
        return apiSuccess({ status: action === 'approve' ? 'approved' : 'rejected' }, context.request, { startTime });
      }

      case 'promote': {
        const currentSem = body.currentSemester || 1;
        const nextSem = currentSem + 1;
        const totalSems = body.totalSemesters || 8;

        if (nextSem > totalSems) {
          return apiError(400, 'VALIDATION_ERROR', 'Learner is already in final semester', context.request, { startTime });
        }

        const { data: learner } = await supabase.from('learners').select('*').eq('id', learnerId).single();
        if (!learner) {
          return apiError(404, 'NOT_FOUND', 'Learner not found', context.request, { startTime });
        }

        const admissionYear = learner.admission_academic_year || `${new Date().getFullYear()}`;
        const yearsProgressed = Math.floor((currentSem - 1) / 2);
        const startYearNum = parseInt(admissionYear.split('-')[0]) + yearsProgressed;
        const academicYear = `${startYearNum}-${(startYearNum + 1).toString().slice(-2)}`;

        const promotionData: any = {
          learner_id: learnerId,
          academic_year: academicYear,
          from_grade: currentSem.toString(),
          to_grade: nextSem.toString(),
          school_id: learner.school_id || null,
          college_id: learner.college_id || null,
          is_passed: true,
          is_promoted: true,
          promotion_date: new Date().toISOString().split('T')[0],
        };

        if (body.remarks) promotionData.remarks = body.remarks;
        if (body.overallPercentage) promotionData.overall_percentage = body.overallPercentage;
        if (body.overallGrade) promotionData.overall_grade = body.overallGrade;
        if (body.overallGradePoint) promotionData.overall_grade_point = body.overallGradePoint;
        if (body.promotedBy) promotionData.promoted_by = body.promotedBy;

        const { error: promError } = await supabase.from('learner_promotions').insert(promotionData);
        if (promError && promError.code !== '23503') {
          if (promError.code === '23505') {
            return apiError(400, 'VALIDATION_ERROR', `Learner already has a promotion record for academic year ${academicYear}`, context.request, { startTime });
          }
          // Log foreign key errors but continue
        }

        const { error: updateError } = await supabase.from('learners').update({
          semester: nextSem,
          updated_at: new Date().toISOString(),
        }).eq('id', learnerId);

        if (updateError) throw updateError;

        return apiSuccess({ fromSemester: currentSem, toSemester: nextSem, academicYear }, context.request, { startTime });
      }

      case 'graduate': {
        const graduationDate = new Date().toISOString();
        const { data: learner } = await supabase.from('learners').select('*').eq('id', learnerId).single();
        if (!learner) {
          return apiError(404, 'NOT_FOUND', 'Learner not found', context.request, { startTime });
        }

        const updateData: any = {
          updated_at: graduationDate,
          metadata: {
            ...(learner.metadata || {}),
            graduation_date: graduationDate,
            graduated_by: body.graduatedBy || user.id || 'current_admin',
            final_semester: body.currentSemester || learner.semester || 1,
            final_cgpa: body.finalCgpa || learner.currentCgpa || (learner.profile?.education?.[0]?.cgpa) || null,
          },
        };

        if (!learner.expectedGraduationDate) {
          updateData.expectedGraduationDate = graduationDate.split('T')[0];
        }

        if (learner.school_id) {
          updateData.grade = (body.totalSemesters || 12).toString();
        }

        const { error } = await supabase.from('learners').update(updateData).eq('id', learnerId);
        if (error) throw error;

        return apiSuccess({ graduated: true, graduationDate }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error) {
    console.error('[Actions] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request, { startTime });
  }
}));
