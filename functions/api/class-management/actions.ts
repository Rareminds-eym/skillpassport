import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      case 'add-learners': {
        const { learnerIds, classId } = params as { learnerIds: string[]; classId: string };
        if (!learnerIds?.length || !classId) return apiError(400, 'VALIDATION_ERROR', 'learnerIds and classId are required', context.request, { startTime });

        const { data: classItem, error: classError } = await supabase
          .from('school_classes')
          .select('max_learners, current_learners')
          .eq('id', classId)
          .single();
        if (classError) return apiDbError(classError, context.request, { startTime });
        if (!classItem) return apiError(404, 'NOT_FOUND', 'Class not found', context.request, { startTime });

        if ((classItem.current_learners || 0) >= classItem.max_learners) {
          return apiError(400, 'CAPACITY_EXCEEDED', 'Class is already at full capacity', context.request, { startTime });
        }

        const { error: updateError } = await supabase
          .from('learners')
          .update({ school_class_id: classId })
          .in('id', learnerIds);
        if (updateError) return apiDbError(updateError, context.request, { startTime });

        const { count: newCount, error: countError } = await supabase
          .from('learners')
          .select('id', { count: 'exact', head: true })
          .eq('school_class_id', classId);
        if (countError) return apiDbError(countError, context.request, { startTime });

        if (newCount !== null && newCount > classItem.max_learners) {
          const { error: rollbackError } = await supabase
            .from('learners')
            .update({ school_class_id: null })
            .in('id', learnerIds);
          if (rollbackError) console.error('ROLLBACK FAILED:', rollbackError);
          return apiError(400, 'CAPACITY_EXCEEDED', 'Adding these learners would exceed class capacity', context.request, { startTime });
        }

        const { error: classUpdateError } = await supabase
          .from('school_classes')
          .update({ current_learners: newCount, updated_at: new Date().toISOString() })
          .eq('id', classId);
        if (classUpdateError) return apiDbError(classUpdateError, context.request, { startTime });

        return apiSuccess({ added: learnerIds.length }, context.request, { startTime });
      }

      case 'remove-learner': {
        const { learnerId, classId } = params as { learnerId: string; classId: string };
        if (!learnerId || !classId) return apiError(400, 'VALIDATION_ERROR', 'learnerId and classId are required', context.request, { startTime });

        const { error: removeError } = await supabase
          .from('learners')
          .update({ school_class_id: null })
          .eq('id', learnerId);
        if (removeError) return apiDbError(removeError, context.request, { startTime });

        const { count: newCount, error: countError } = await supabase
          .from('learners')
          .select('id', { count: 'exact', head: true })
          .eq('school_class_id', classId);
        if (countError) return apiDbError(countError, context.request, { startTime });

        const { error: classUpdateError } = await supabase
          .from('school_classes')
          .update({ current_learners: newCount, updated_at: new Date().toISOString() })
          .eq('id', classId);
        if (classUpdateError) return apiDbError(classUpdateError, context.request, { startTime });

        return apiSuccess({ removed: true }, context.request, { startTime });
      }

      case 'fetch-assignments': {
        const { classId } = params as { classId: string };
        if (!classId) return apiError(400, 'VALIDATION_ERROR', 'classId is required', context.request, { startTime });

        const { data, error } = await supabase
          .from('school_educator_class_assignments')
          .select('*, school_educators!inner(id, first_name, last_name, email)')
          .eq('class_id', classId);
        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data, context.request, { startTime });
      }

      case 'assign-educator': {
        const { educatorId, classId, subject, academicYear, isPrimary, assignedBy } = params as {
          educatorId: string; classId: string; subject: string; academicYear: string; isPrimary: boolean; assignedBy: string;
        };
        if (!educatorId || !classId) return apiError(400, 'VALIDATION_ERROR', 'educatorId and classId are required', context.request, { startTime });

        const { data, error } = await supabase
          .from('school_educator_class_assignments')
          .insert({ educator_id: educatorId, class_id: classId, subject, academic_year: academicYear, is_primary: isPrimary, assigned_by: assignedBy })
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data, context.request, { startTime });
      }

      case 'remove-assignment': {
        const { assignmentId } = params as { assignmentId: string };
        if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'assignmentId is required', context.request, { startTime });

        const { error } = await supabase
          .from('school_educator_class_assignments')
          .delete()
          .eq('id', assignmentId);
        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[class-management/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
