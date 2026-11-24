import type { SupabaseClient } from '@supabase/supabase-js';
import type { R2Bucket } from '@cloudflare/workers-types';
import { validateAssignmentSubmission, type SubmissionAnswers } from './submission-validation';
import { EVALUATION_MODEL, evaluateQuestions, type GradingQuestion } from './saved-assessment';

export async function evaluateSavedSubmission(db: SupabaseClient, submissionId: string, apiKey?: string, bytes?: Uint8Array, bucket?: R2Bucket, validatedAnswers?: SubmissionAnswers) {
  const timestamp = new Date().toISOString();
  const claim = await db.from('ai_assignment_results').update({ status: 'evaluating', updated_at: timestamp }).eq('submission_id', submissionId).in('status', ['pending','failed']).select('id').maybeSingle();
  if (claim.error) throw new Error('Evaluation unavailable');
  if (!claim.data) return;
  try {
    const source = await db.from('ai_assignment_submissions').select('*,recipient:ai_assignment_learners!inner(assignment:ai_assignments!inner(content,grading_rules))').eq('id', submissionId).single();
    if (source.error || !source.data) throw new Error('Submitted document unavailable');
    if (!bytes) {
      const object = await bucket?.get(source.data.file_key);
      if (!object || object.size > 5 * 1024 * 1024) throw new Error('Stored document unavailable');
      bytes = new Uint8Array(await object.arrayBuffer());
    }
    const assignment = source.data.recipient.assignment;
    const questions = assignment.content.questions as Array<{id:string;kind:string;prompt:string;options:string[];maxMarks:number}>;
    const answers = validatedAnswers || await validateAssignmentSubmission(questions, source.data.file_name, bytes, apiKey);
    const inputs: GradingQuestion[] = questions.map(q => {
      const rule = assignment.grading_rules.find((r: { questionId: string }) => r.questionId === q.id);
      if (!rule) throw new Error('Grading rules unavailable');
      let answer = answers.find(a => a.questionId === q.id)!.answer.trim();
      if (q.kind === 'multiple_choice' && /^[A-H][).]?$/i.test(answer)) answer = q.options[answer.charAt(0).toUpperCase().charCodeAt(0) - 65] || answer;
      return { ...q, max_marks: q.maxMarks, accepted_answers: rule.acceptedAnswers, rubric: rule.rubric, explanation: rule.explanation, answer };
    });
    const results = await evaluateQuestions(inputs, apiKey);
    const saved = await db.rpc('complete_ai_assignment_evaluation', { p_result: claim.data.id, p_claim: timestamp, p_results: results, p_model: EVALUATION_MODEL });
    if (saved.error) throw new Error('Evaluation save failed');
  } catch {
    const failed = await db.from('ai_assignment_results').update({ status: 'failed', feedback: 'Document evaluation could not complete. The submission is saved; an educator can retry evaluation.', updated_at: new Date().toISOString() }).eq('id', claim.data.id).eq('status', 'evaluating').eq('updated_at', timestamp);
    if (failed.error) throw new Error('Unable to record evaluation failure');
  }
}
