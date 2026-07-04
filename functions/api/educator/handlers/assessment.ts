import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

const getSub = (context: AuthenticatedContext) => getServiceClient(context.env as any);


export async function handleFetchEducatorAssessmentResults(context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const user = getContextUser(context);
  const userEmail = user.email;
  const userId = user.id;

  if (!userEmail || !userId) {
    return apiError(401, 'UNAUTHORIZED', 'User not authenticated', context.request, { startTime });
  }

  try {
    let schoolEducatorData = null;

    const { data: educatorByUserId } = await supabase
      .from('school_educators')
      .select('id, school_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (educatorByUserId) {
      schoolEducatorData = educatorByUserId;
    } else {
      const { data: educatorByEmail } = await supabase
        .from('school_educators')
        .select('id, school_id, role')
        .eq('email', userEmail)
        .maybeSingle();

      if (educatorByEmail) {
        schoolEducatorData = educatorByEmail;
      }
    }

    let learnersQuery = supabase
      .from('learners')
      .select(`
        user_id,
        name,
        email,
        enrollmentNumber,
        grade,
        program_id,
        programs (
          id,
          name
        )
      `)
      .eq('is_deleted', false);

    let schoolId: string | null = null;
    let schoolName = '';

    if (schoolEducatorData?.school_id) {
      schoolId = schoolEducatorData.school_id;

      if (schoolEducatorData.role === 'admin' || schoolEducatorData.role === 'school_admin') {
        learnersQuery = learnersQuery.eq('school_id', schoolId);
      } else {
        const { data: classAssignments } = await supabase
          .from('school_educator_class_assignments')
          .select('class_id')
          .eq('educator_id', schoolEducatorData.id);

        if (classAssignments && classAssignments.length > 0) {
          const assignedClassIds = classAssignments.map(assignment => assignment.class_id);
          learnersQuery = learnersQuery
            .eq('school_id', schoolId)
            .in('school_class_id', assignedClassIds);
        } else {
          return apiSuccess({ results: [], schoolName: '' }, context.request, { startTime });
        }
      }

      const { data: schoolData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', schoolId)
        .maybeSingle();

      schoolName = schoolData?.name || '';
    }

    const { data: learners } = await learnersQuery;

    if (!learners || learners.length === 0) {
      return apiSuccess({ results: [], schoolName }, context.request, { startTime });
    }

    const userIds = learners.map(l => l.user_id).filter(Boolean);
    const { data: results } = await supabase
      .from('assessment_results')
      .select(`
        id,
        learner_id,
        stream_id,
        riasec_code,
        aptitude_overall,
        employability_readiness,
        knowledge_score,
        status,
        created_at,
        career_fit,
        skill_gap,
        gemini_results,
        overall_summary,
        platform_courses,
        roadmap,
        riasec_scores,
        aptitude_scores,
        profile_snapshot
      `)
      .in('learner_id', userIds)
      .order('created_at', { ascending: false });

    const enrichedResults = (results || []).map(result => {
      const learner = learners.find(l => l.user_id === result.learner_id);
      return {
        ...result,
        learner_name: learner?.name,
        learner_email: learner?.email,
        college_id: schoolId,
        college_name: schoolName,
        enrollmentNumber: learner?.enrollmentNumber,
        learner_grade: learner?.grade,
        program_id: learner?.program_id,
        program_name: learner?.programs?.[0]?.name
      };
    });

    return apiSuccess({ results: enrichedResults, schoolName }, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}






