import { getServiceClient } from './supabase';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Client references narrow the verified owner; they never select another owner. */
export async function ownQuestionLearner(context: any, reference: unknown, attemptId?: unknown) {
  const subject = context.data?.user?.sub;
  if (typeof subject !== 'string' || !uuid.test(subject)) throw new Error('QUESTION_OWNER_REQUIRED');
  const owner = subject.toLowerCase();
  if (typeof reference === 'string' && uuid.test(reference)) reference = reference.toLowerCase();
  const db = getServiceClient(context.env);
  const result = await db.from('learners').select('id,user_id').eq('user_id', owner).maybeSingle();
  if (result.error || !result.data) throw new Error('QUESTION_OWNER_UNAVAILABLE');
  if (reference !== undefined && reference !== null && reference !== result.data.id && reference !== owner) throw new Error('QUESTION_OWNER_MISMATCH');
  if (attemptId !== undefined && attemptId !== null) {
    if (typeof attemptId !== 'string' || !uuid.test(attemptId)) throw new Error('QUESTION_ATTEMPT_INVALID');
    const attempt = await db.from('personal_assessment_attempts').select('id').eq('id', attemptId.toLowerCase()).eq('learner_id', result.data.id).maybeSingle();
    if (attempt.error || !attempt.data) throw new Error('QUESTION_OWNER_MISMATCH');
  }
  return result.data.id as string;
}
