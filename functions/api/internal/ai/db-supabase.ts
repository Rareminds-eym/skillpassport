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
        .select('id, learner_id, grade_level, stream_id, adaptive_aptitude_session_id, all_responses, learner_context, updated_at, started_at')
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
      // Fix 9: distinguish retrieval failure vs empty (worker retries on failure)
      if (error) {
        const msg = (error as { message?: string })?.message ?? String(error);
        const code = (error as { code?: string })?.code ?? "UNKNOWN";
        throw new Error(`hybrid_search_roles failed [${code}]: ${msg}`);
      }
      if (!Array.isArray(data)) {
        throw new Error(`hybrid_search_roles returned non-array`);
      }
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
      expectedUpdatedAt?: string,
    ): Promise<{ duplicate: boolean; at: string }> {
      const existing = await this.getReport(attemptId);
      const current = existing?.results ?? {};
      const applied = (current[APPLIED_OPS_KEY] ?? {}) as JsonRecord;
      if (typeof applied[operationId] === 'object' && applied[operationId] !== null) {
        const at = ((applied[operationId] as JsonRecord).at as string) ?? new Date(0).toISOString();
        return { duplicate: true, at };
      }
      const at = new Date().toISOString();
      // Compact AI narrative bundle in gemini_results + structured snapshot in profile_snapshot
      const rawAnalysis = (patch as Record<string, unknown>).analysis as Record<string, unknown> | undefined;
      let patchForMerge: Record<string, unknown> = patch as Record<string, unknown>;
      if (rawAnalysis && (rawAnalysis as { gradeLevel?: string }).gradeLevel === 'college') {
        const synthesis = (rawAnalysis.synthesis ?? {}) as Record<string, unknown>;
        const careerFitRaw = (rawAnalysis.careerFit ?? null) as unknown as Record<string, unknown> | null;
        const filteredCurrent: JsonRecord = { ...current };
        delete filteredCurrent.analysis;
        const allowedCacheKeys = new Set(["strengthsGrowthPlan", "roleOverviews", "courseRecommendations", "skillGapCourses"]);
        for (const k of Object.keys(filteredCurrent)) {
          if (k !== "careerFit" && k !== "profileNarrative" && k !== APPLIED_OPS_KEY && !allowedCacheKeys.has(k)) {
            if (k.startsWith("analysis") || k === "overallSummary") delete filteredCurrent[k];
          }
        }
        const nextGemini: JsonRecord = { ...filteredCurrent };
        if (careerFitRaw && typeof careerFitRaw === 'object') {
          const cf: Record<string, unknown> = {};
          if (Array.isArray(careerFitRaw.clusters)) cf.clusters = careerFitRaw.clusters;
          if (careerFitRaw.specificOptions && typeof careerFitRaw.specificOptions === 'object') cf.specificOptions = careerFitRaw.specificOptions as Record<string, unknown>;
          if (Object.keys(cf).length > 0) nextGemini.careerFit = cf;
        }
        if (typeof synthesis.profileNarrative === 'string') nextGemini.profileNarrative = synthesis.profileNarrative;
        patchForMerge = nextGemini;
      }
      const merged: JsonRecord =
        rawAnalysis && (rawAnalysis as { gradeLevel?: string }).gradeLevel === 'college'
          ? { ...patchForMerge, [APPLIED_OPS_KEY]: { ...applied, [operationId]: { at } } }
          : { ...current, ...patch, [APPLIED_OPS_KEY]: { ...applied, [operationId]: { at } } };
      // Derive denormalized columns from worker AnalyzeOutput — explicit per-column mapping, trigger-aware
      const analysis = rawAnalysis as Record<string, unknown> | undefined;
      const extra: Record<string, unknown> = {};
      if (analysis && typeof analysis === 'object') {
        const grade = analysis.gradeLevel as string | undefined;
        if (grade === 'college') {
          const scores = (analysis.scores ?? {}) as Record<string, unknown>;
          const synthesis = (analysis.synthesis ?? {}) as Record<string, unknown>;
          const careerFit = (analysis.careerFit ?? null) as unknown;
          const adaptiveSessionId = analysis.adaptiveAptitudeSessionId as string | null | undefined;
          const aptitudeScores = analysis.aptitudeScores as Record<string, unknown> | null | undefined;
          const aptitudeOverall = analysis.aptitudeOverall as number | null | undefined;
          const streamDetails = analysis.streamAptitudeDetails as Record<string, unknown> | null | undefined;
          const knowledgeDetails = analysis.knowledgeDetails as Record<string, unknown> | null | undefined;
          const profileSnapshot = analysis.profileSnapshot as Record<string, unknown> | null | undefined;
          if (scores && typeof scores === 'object') {
            if (scores.riasecScores) extra.riasec_scores = scores.riasecScores;
            else if (scores.riasecPercentages) extra.riasec_scores = scores.riasecPercentages;
            if (typeof scores.riasecCode === 'string') extra.riasec_code = scores.riasecCode;
            if (scores.bigFive) extra.bigfive_scores = scores.bigFive;
            if (scores.values) extra.work_values_scores = scores.values;
            if (scores.employability) extra.employability_scores = scores.employability;
          }
          extra.aptitude_scores = aptitudeScores && typeof aptitudeScores === 'object' ? aptitudeScores : null;
          if (typeof aptitudeOverall === 'number') extra.aptitude_overall = String(aptitudeOverall);
          else extra.aptitude_overall = null;
          if (typeof adaptiveSessionId === 'string' && adaptiveSessionId) extra.adaptive_aptitude_session_id = adaptiveSessionId;
          else extra.adaptive_aptitude_session_id = null;
          const streamScore = scores.streamAptitudeScore as number | null | undefined;
          if (typeof streamScore === 'number') extra.stream_aptitude_score = streamScore;
          else extra.stream_aptitude_score = null;
          extra.stream_aptitude_details = streamDetails && typeof streamDetails === 'object' ? streamDetails : null;
          extra.knowledge_details = knowledgeDetails && typeof knowledgeDetails === 'object' ? knowledgeDetails : null;
          if (typeof scores.knowledgeScore === 'number') extra.knowledge_score = scores.knowledgeScore;
          else extra.knowledge_score = null;
          if (synthesis && typeof synthesis === 'object') {
            const employability = (synthesis.employability ?? {}) as Record<string, unknown>;
            if (typeof employability.overallReadiness === 'string') extra.employability_readiness = employability.overallReadiness;
            else extra.employability_readiness = null;
            extra.skill_gap = (synthesis as Record<string, unknown>).skillGap ?? null;
            extra.roadmap = (synthesis as Record<string, unknown>).roadmap ?? null;
            extra.final_note = (synthesis as Record<string, unknown>).finalNote ?? null;
          } else {
            extra.employability_readiness = null;
            extra.skill_gap = null;
            extra.roadmap = null;
            extra.final_note = null;
          }
          if (profileSnapshot && typeof profileSnapshot === 'object') extra.profile_snapshot = profileSnapshot;
          else extra.profile_snapshot = null;
          const clusterSummary = (careerFit as { overallSummary?: unknown } | null)?.overallSummary;
          if (typeof clusterSummary === 'string' && clusterSummary.trim()) {
            extra.overall_summary = String(clusterSummary).slice(0, 4000);
          } else {
            throw new Error(`Missing cluster overallSummary for college grade — worker must return careerFit.overallSummary`);
          }
          if (careerFit && typeof careerFit === 'object') extra.career_fit = careerFit;
          else throw new Error(`Missing careerFit for college grade`);
          extra.status = 'completed';
        } else if (grade === 'middle') {
          const reports = (analysis.reports ?? {}) as Record<string, unknown>;
          const capabilityWheel = (analysis.capabilityWheel ?? null) as unknown;
          if (reports && typeof reports === 'object') {
            const summary = (reports as Record<string, unknown>).assessmentReport as string | undefined;
            if (summary) extra.overall_summary = String(summary).slice(0, 4000);
            if (capabilityWheel) extra.aptitude_scores = { capabilityWheel, reports };
          }
          extra.status = 'completed';
        }
      }
      // Trigger-aware: populate_result_columns_from_gemini fills null columns from JSON on INSERT/UPDATE when gemini_results changes.
      // We explicitly set columns (including null to clear stale), so trigger will not repopulate them from old JSON.
      const updatePayload: Record<string, unknown> = { gemini_results: merged, updated_at: at, ...extra };
      if (existing) {
        let upd: ReturnType<typeof db.from> = db.from('personal_assessment_results').update(updatePayload).eq('attempt_id', attemptId) as unknown as ReturnType<typeof db.from>;
        if (expectedUpdatedAt) upd = (upd as unknown as { eq: (c: string, v: string) => ReturnType<typeof db.from> }).eq('updated_at', expectedUpdatedAt) as unknown as ReturnType<typeof db.from>;
        const { error: updateError, data: updData } = await (upd as unknown as { select: () => Promise<{ error: { message: string; code?: string } | null; data: unknown[] | null }> }).select();
        if (updateError) throw new Error(`Failed to merge analysis report (attempt ${attemptId}): ${updateError.message}`);
        if (Array.isArray(updData) && updData.length === 0 && expectedUpdatedAt) throw new Error(`STALE_REVISION: Attempt ${attemptId} changed since analysis started`);
      } else {
        const { error: insertError } = await db.from('personal_assessment_results').insert({ attempt_id: attemptId, gemini_results: merged, ...extra, created_at: at, updated_at: at });
        if (insertError) throw new Error(`Failed to insert analysis report (attempt ${attemptId}): ${insertError.message}`);
      }
      return { duplicate: false, at };
    },
  };
}

export type { AnalysisReceipt };
