/**
 * Minimal data-access port for the AI internal gateway. Handlers depend on
 * this narrow interface (faked in tests); `index.ts` wires the Supabase
 * implementation. No handler touches a raw client or arbitrary tables.
 */

export interface AttemptRow {
  id: string;
  learner_id: string;
  grade_level: string;
  stream_id: string | null;
  adaptive_aptitude_session_id: string | null;
  all_responses: Record<string, unknown>;
  /** Free-form attempt context (program/stream/degree for college). Nullable until selected. */
  learner_context?: unknown;
  /** Row revision token for optimistic-concurrency apply checks. */
  updated_at?: string | null;
  started_at?: string | null;
}

export interface QuestionRow {
  id: string;
  section_id: string | null;
  category_mapping: unknown;
  metadata: unknown;
  question_type: string | null;
  question_text: string | null;
  /** Expected answer for graded (aptitude/knowledge) questions. Nullable until selected. */
  correct_answer?: unknown;
}

export interface SectionRow {
  id: string;
  name: string;
  /** Rating scale options; present on Likert sections (middle-school scale maxes). */
  response_scale?: unknown;
}

export interface StreamQuestionSetRow {
  question_type: string;
  questions: unknown;
}

export interface AdaptiveSessionRow {
  id: string;
  questions_answered: unknown;
  current_difficulty: unknown;
}

export interface AdaptiveResultRow {
  aptitude_level: unknown;
  confidence_tag: unknown;
  tier: unknown;
  total_questions: unknown;
  total_correct: unknown;
  overall_accuracy: unknown;
  accuracy_by_difficulty: unknown;
  accuracy_by_subtag: unknown;
  path_classification: unknown;
  average_response_time_ms: unknown;
}

export interface RoleRow {
  role_id: string;
  role_family_role_id: string;
  role_code: string;
  role_name: string;
  hybrid_score: number;
  semantic_similarity: number | null;
  /** Rich hybrid_search_roles columns for deterministic match scoring (all optional). */
  riasec_codes?: string[];
  riasec_alignment?: number;
  description?: string;
  degree_gate?: string;
  domain_name?: string;
  direct_degree_mapping?: string;
  aptitude_profile?: unknown;
  big_five_profile?: unknown;
  work_values_profile?: unknown;
}

export interface AnalysisReceipt {
  applied: boolean;
  duplicate: boolean;
  attemptId: string;
  at: string;
}

export interface AiDataPort {
  findLearnerIdByUser(userId: string): Promise<string | null>;
  getAttempt(attemptId: string, learnerId: string): Promise<AttemptRow | null>;
  getQuestions(ids: string[]): Promise<QuestionRow[]>;
  getSections(ids: string[]): Promise<SectionRow[]>;
  getStreamQuestionSets(streamId: string, gradeLevel: string): Promise<StreamQuestionSetRow[]>;
  getAdaptiveResults(sessionId: string): Promise<{ session: AdaptiveSessionRow; results: AdaptiveResultRow | null } | null>;
  hybridSearchRoles(args: {
    queryText: string;
    queryEmbedding: number[];
    riasecCode?: string;
    matchCount: number;
    /** Hybrid rank weight; source passes 0.6 explicitly (parity, not RPC default). */
    alpha?: number;
  }): Promise<RoleRow[]>;
  getReport(attemptId: string): Promise<{ results: Record<string, unknown> } | null>;
  mergeReport(attemptId: string, operationId: string, patch: Record<string, unknown>, expectedUpdatedAt?: string): Promise<{ duplicate: boolean; at: string }>;
}
