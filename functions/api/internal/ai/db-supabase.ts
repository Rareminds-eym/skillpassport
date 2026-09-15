/**
 * Supabase implementation of the AI gateway data port. Service-role client,
 * scoped by the action handlers (ownership checks live there, not here).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdaptiveResultRow,
  AdaptiveSessionRow,
  AiDataPort,
  AnalysisReceipt,
  AttemptRow,
  QuestionRow,
  RoleRow,
  SectionRow,
  StreamQuestionSetRow,
} from './db';

const APPLIED_OPS_KEY = '__applied_ops';

type JsonRecord = Record<string, unknown>;

export function createSupabaseAiPort(db: SupabaseClient): AiDataPort {
  return {
    async findLearnerIdByUser(userId: string): Promise<string | null> {
      const { data, error } = await db.from('learners').select('id').or(`user_id.eq.${userId},id.eq.${userId}`).maybeSingle();
      if (error || !data) return null;
      return (data as { id: string }).id;
    },

    async getAttempt(attemptId: string, learnerId: string): Promise<AttemptRow | null> {
      const { data, error } = await db
        .from('personal_assessment_attempts')
        .select('id, learner_id, grade_level, stream_id, adaptive_aptitude_session_id, all_responses, learner_context, updated_at')
        .eq('id', attemptId)
        .eq('learner_id', learnerId)
        .maybeSingle();
      if (error || !data) return null;
      return data as unknown as AttemptRow;
    },

    async getQuestions(ids: string[]): Promise<QuestionRow[]> {
      const { data, error } = await db
        .from('personal_assessment_questions')
        .select('id, section_id, category_mapping, metadata, question_type, question_text, correct_answer')
        .in('id', ids);
      if (error || !data) return [];
      return data as unknown as QuestionRow[];
    },

    async getSections(ids: string[]): Promise<SectionRow[]> {
      const { data, error } = await db
        .from('personal_assessment_sections')
        .select('id, name, response_scale')
        .in('id', ids);
      if (error || !data) return [];
      return data as unknown as SectionRow[];
    },

    async getStreamQuestionSets(streamId: string, gradeLevel: string): Promise<StreamQuestionSetRow[]> {
      const { data, error } = await db
        .from('career_assessment_ai_questions')
        .select('question_type, questions')
        .eq('stream_id', streamId)
        .eq('grade_level', gradeLevel)
        .eq('is_active', true);
      if (error || !data) return [];
      return data as unknown as StreamQuestionSetRow[];
    },

    async getAdaptiveResults(
      sessionId: string,
    ): Promise<{ session: AdaptiveSessionRow; results: AdaptiveResultRow | null } | null> {
      const { data: session, error: sessionError } = await db
        .from('adaptive_aptitude_sessions')
        .select('id, questions_answered, current_difficulty')
        .eq('id', sessionId)
        .maybeSingle();
      if (sessionError || !session) return null;
      const { data: results } = await db
        .from('adaptive_aptitude_results')
        .select(
          'aptitude_level, confidence_tag, tier, total_questions, total_correct, overall_accuracy, accuracy_by_difficulty, accuracy_by_subtag, path_classification, average_response_time_ms',
        )
        .eq('session_id', (session as AdaptiveSessionRow).id)
        .maybeSingle();
      return {
        session: session as unknown as AdaptiveSessionRow,
        results: (results ?? null) as AdaptiveResultRow | null,
      };
    },

    async hybridSearchRoles(args: {
      queryText: string;
      queryEmbedding: number[];
      riasecCode?: string;
      matchCount: number;
      alpha?: number;
    }): Promise<RoleRow[]> {
      const { data, error } = await db.rpc('hybrid_search_roles', {
        query_text: args.queryText,
        query_embedding: `[${args.queryEmbedding.join(',')}]`,
        learner_riasec_code: args.riasecCode ?? null,
        match_count: args.matchCount,
        alpha: args.alpha ?? 0.6,
      });
      if (error || !Array.isArray(data)) return [];
      return (data as unknown[]).filter((r): r is RoleRow => typeof r === 'object' && r !== null);
    },

    async getReport(attemptId: string): Promise<{ results: Record<string, unknown> } | null> {
      const { data, error } = await db
        .from('personal_assessment_results')
        .select('gemini_results')
        .eq('attempt_id', attemptId)
        .maybeSingle();
      if (error || !data) return null;
      const results = (data as { gemini_results?: unknown }).gemini_results;
      return { results: (results ?? {}) as Record<string, unknown> };
    },

    async mergeReport(
      attemptId: string,
      operationId: string,
      patch: Record<string, unknown>,
    ): Promise<{ duplicate: boolean; at: string }> {
      const existing = await this.getReport(attemptId);
      const current = existing?.results ?? {};
      const applied = (current[APPLIED_OPS_KEY] ?? {}) as JsonRecord;
      if (typeof applied[operationId] === 'object' && applied[operationId] !== null) {
        const at = ((applied[operationId] as JsonRecord).at as string) ?? new Date(0).toISOString();
        return { duplicate: true, at };
      }
      const at = new Date().toISOString();
      const merged: JsonRecord = {
        ...current,
        ...patch,
        [APPLIED_OPS_KEY]: { ...applied, [operationId]: { at } },
      };
      if (existing) {
        const { error: updateError } = await db.from('personal_assessment_results').update({ gemini_results: merged }).eq('attempt_id', attemptId);
        if (updateError) {
          throw new Error(`Failed to merge analysis report (attempt ${attemptId}): ${updateError.message}`);
        }
      } else {
        const { error: insertError } = await db.from('personal_assessment_results').insert({ attempt_id: attemptId, gemini_results: merged });
        if (insertError) {
          throw new Error(`Failed to insert analysis report (attempt ${attemptId}): ${insertError.message}`);
        }
      }
      return { duplicate: false, at };
    },
  };
}

export type { AnalysisReceipt };
