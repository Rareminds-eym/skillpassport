import type { SupabaseClient } from '@supabase/supabase-js';
import { detectGradeLevel, type GradeLevel } from '../ai/prompts/grade-levels';

/** Minimal app policy/display projection. Never loads execution facts or skill levels. */
export async function loadCareerPolicyContext(db: SupabaseClient, actorId: string): Promise<{ gradeLevel: GradeLevel; hasAssessment: boolean } | null> {
  // Only the authenticated user id may resolve a learner. No learner-id fallback.
  const { data: learner, error } = await db.from('learners')
    .select('id, grade, education:profile->education').eq('user_id', actorId).maybeSingle();
  if (error) throw new Error('Career policy lookup unavailable');
  if (!learner) return null;
  const [education, assessment] = await Promise.all([
    db.from('education').select('level').eq('learner_id', learner.id)
      .order('year_of_passing', { ascending: false }).limit(1),
    db.from('personal_assessment_results').select('id').eq('learner_id', learner.id)
      .eq('status', 'completed').limit(1).maybeSingle(),
  ]);
  if (education.error || assessment.error) throw new Error('Career policy metadata unavailable');
  return {
    gradeLevel: detectGradeLevel({ grade: learner.grade, education: education.data ?? learner.education ?? [] }),
    hasAssessment: Boolean(assessment.data),
  };
}

