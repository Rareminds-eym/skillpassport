/**
 * Assessment Snapshot Builder
 * 
 * Industrial-grade service for building comprehensive assessment snapshots
 * with full question/option/answer context.
 * 
 * @module features/assessment/career-test/services/assessmentSnapshotBuilder
 */

import { supabase } from '../../../../utils/supabase';
import type { 
  AssessmentSnapshot,
  QuestionContext,
  SectionBuildContext,
  QuestionSnapshot,
  QuestionOption,
  SectionData,
  AdaptiveReferenceSection,
  SectionTiming
} from '../types/assessmentSnapshot';

// ============================================================================
// CONSTANTS
// ============================================================================

const SCHEMA_VERSION = '2.0' as const;

const SECTION_CONFIGS: Record<string, { title: string; type: string; scale?: any }> = {
  riasec: {
    title: 'Interest Assessment',
    type: 'likert',
    scale: { min: 1, max: 5, labels: ['Dislike', 'Slightly Dislike', 'Neutral', 'Slightly Like', 'Like'] }
  },
  bigfive: {
    title: 'Personality Assessment',
    type: 'accuracy',
    scale: { min: 1, max: 5, labels: ['Very Inaccurate', 'Inaccurate', 'Neutral', 'Accurate', 'Very Accurate'] }
  },
  values: {
    title: 'Work Values',
    type: 'importance',
    scale: { min: 1, max: 5, labels: ['Not Important', 'Slightly', 'Moderately', 'Very', 'Extremely'] }
  },
  aptitude: {
    title: 'Stream Aptitude',
    type: 'mcq'
  },
  employability: {
    title: 'Employability Skills',
    type: 'self_assessment',
    scale: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
  },
  knowledge: {
    title: 'Domain Knowledge',
    type: 'mcq'
  },
  adaptive_aptitude: {
    title: 'Adaptive Aptitude Test',
    type: 'adaptive_mcq'
  }
};

const RIASEC_CATEGORIES: Record<string, string> = {
  r: 'realistic', i: 'investigative', a: 'artistic', 
  s: 'social', e: 'enterprising', c: 'conventional'
};

const BIGFIVE_TRAITS: Record<string, string> = {
  o: 'openness', c: 'conscientiousness', e: 'extraversion',
  a: 'agreeableness', n: 'neuroticism'
};

// ============================================================================
// SNAPSHOT BUILDER CLASS
// ============================================================================

export class AssessmentSnapshotBuilder {
  private attemptId: string;
  private studentId: string;
  private gradeLevel: string;
  private sections: Map<string, SectionBuildContext> = new Map();
  private sectionTimings: Record<string, SectionTiming> = {};
  private metadata: Partial<AssessmentSnapshot['metadata']> = {};
  private startTime: string;
  private deviceInfo: { fingerprint: string; userAgent?: string; screen?: string; timezone?: string };

  constructor(
    attemptId: string,
    studentId: string,
    gradeLevel: string,
    deviceInfo?: { userAgent?: string; screen?: string; timezone?: string }
  ) {
    this.attemptId = attemptId;
    this.studentId = studentId;
    this.gradeLevel = gradeLevel;
    this.startTime = new Date().toISOString();
    
    // Generate device fingerprint
    const ua = deviceInfo?.userAgent || navigator.userAgent;
    this.deviceInfo = {
      fingerprint: this.generateDeviceFingerprint(ua, deviceInfo?.screen),
      userAgent: ua,
      screen: deviceInfo?.screen,
      timezone: deviceInfo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private generateDeviceFingerprint(userAgent: string, screen?: string): string {
    const base = `${userAgent}_${screen || 'unknown'}`;
    // Simple hash for fingerprinting
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      const char = base.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `web_${Math.abs(hash).toString(16).substring(0, 8)}`;
  }

  // ============================================================================
  // SECTION BUILDING
  // ============================================================================

  startSection(sectionId: string, sectionData?: { questions?: any[]; title?: string; description?: string }): void {
    const config = SECTION_CONFIGS[sectionId];
    if (!config) {
      console.warn(`[SnapshotBuilder] No config found for section: ${sectionId}`);
      return;
    }

    console.log(`[SnapshotBuilder] Starting section: ${sectionId} with ${sectionData?.questions?.length || 0} questions`);

    // Pre-populate questions from section data if provided
    // CRITICAL: Use fully qualified question IDs (e.g., "riasec_r1", "bigfive_o1")
    const initialQuestions: QuestionContext[] = [];
    if (sectionData?.questions && Array.isArray(sectionData.questions)) {
      sectionData.questions.forEach((q, idx) => {
        // Use fully qualified ID directly - no extraction needed
        const questionId = q.id || `${sectionId}_q${idx}`;
        
        console.log(`[SnapshotBuilder] Pre-populating question: ${questionId}`);
        
        initialQuestions.push({
          questionId,
          question: q,
          sectionId,
          sequence: idx + 1,
          answer: null,
          answeredAt: '',
          timeSpentSeconds: 0
        });
      });
    }

    this.sections.set(sectionId, {
      sectionId,
      title: sectionData?.title || config.title,
      type: config.type,
      startedAt: new Date().toISOString(),
      questions: initialQuestions
    });

    this.sectionTimings[sectionId] = {
      started_at: new Date().toISOString(),
      duration_seconds: 0
    };
    
    console.log(`[SnapshotBuilder] Section ${sectionId} started with ${initialQuestions.length} pre-populated questions`);
  }

  addQuestion(sectionId: string, context: QuestionContext): void {
    const section = this.sections.get(sectionId);
    if (!section) {
      console.warn(`[SnapshotBuilder] addQuestion: Section ${sectionId} not found`);
      return;
    }

    // Check if question already exists (by questionId)
    const existingIndex = section.questions.findIndex(q => q.questionId === context.questionId);
    
    console.log(`[SnapshotBuilder] addQuestion: section=${sectionId}, qId=${context.questionId}, existing=${existingIndex >= 0}, answer=`, context.answer, `totalQuestions=${section.questions.length}`);
    
    if (existingIndex >= 0) {
      // UPDATE existing question with new answer data
      const existing = section.questions[existingIndex];
      existing.answer = context.answer;
      existing.answeredAt = context.answeredAt;
      existing.timeSpentSeconds = context.timeSpentSeconds;
      console.log(`[SnapshotBuilder] Updated question ${context.questionId} with answer:`, context.answer);
    } else {
      // ADD new question
      section.questions.push(context);
      console.log(`[SnapshotBuilder] Added new question ${context.questionId}, total now: ${section.questions.length}`);
    }
  }

  completeSection(sectionId: string, durationSeconds: number): void {
    const section = this.sections.get(sectionId);
    if (!section) return;

    section.completedAt = new Date().toISOString();
    
    if (this.sectionTimings[sectionId]) {
      this.sectionTimings[sectionId].ended_at = new Date().toISOString();
      this.sectionTimings[sectionId].duration_seconds = durationSeconds;
    }
  }

  // ============================================================================
  // SNAPSHOT CONSTRUCTION
  // ============================================================================

  async buildSnapshot(
    adaptiveSessionId?: string,
    adaptiveResults?: { 
      questionsAnswered: number; 
      correctAnswers: number; 
      estimatedAbility: number;
      phasesCompleted: string[];
      finalPhase: string;
      reliability: number;
    }
  ): Promise<AssessmentSnapshot> {
    const completedAt = new Date().toISOString();
    const totalDuration = this.calculateTotalDuration();

    // Calculate section scores
    const sections: AssessmentSnapshot['sections'] = {};

    for (const [sectionId, context] of this.sections) {
      const sectionData = this.buildSectionData(context, sectionId);
      if (sectionData) {
        sections[sectionId as keyof AssessmentSnapshot['sections']] = sectionData as any;
      }
    }

    // Add adaptive aptitude section if applicable
    if (adaptiveSessionId && adaptiveResults) {
      sections.adaptive_aptitude = this.buildAdaptiveSection(adaptiveSessionId, adaptiveResults);
    }

    const completedSectionsCount = Object.values(sections).filter(s => 
      'completed_at' in s && s.completed_at
    ).length;

    return {
      schema_version: SCHEMA_VERSION,
      attempt_id: this.attemptId,
      student_id: this.studentId,
      grade_level: 'college',
      metadata: {
        device_fingerprint: this.deviceInfo.fingerprint,
        user_agent: this.deviceInfo.userAgent,
        screen_resolution: this.deviceInfo.screen,
        timezone: this.deviceInfo.timezone,
        started_at: this.startTime,
        completed_at: completedAt,
        total_duration_seconds: totalDuration,
        session_timings: this.sectionTimings
      },
      sections,
      summary: {
        total_sections: 7,
        completed_sections: completedSectionsCount,
        overall_completion_percentage: Math.round((completedSectionsCount / 7) * 100),
        ai_analysis_requested: true
      }
    };
  }

  private buildSectionData(context: SectionBuildContext, sectionId: string): SectionData | null {
    const config = SECTION_CONFIGS[sectionId];
    if (!config) return null;

    const baseSection = {
      section_id: sectionId,
      title: config.title,
      type: config.type,
      started_at: context.startedAt,
      completed_at: context.completedAt,
      duration_seconds: this.sectionTimings[sectionId]?.duration_seconds || 0,
      questions: context.questions.map((q, idx) => this.buildQuestionSnapshot(q, idx + 1, sectionId))
    };

    // Add scale for appropriate types
    if (config.scale) {
      (baseSection as any).scale = config.scale;
    }

    // Add AI-specific fields for MCQ sections
    if (sectionId === 'aptitude' || sectionId === 'knowledge') {
      (baseSection as any).stream_id = context.streamId || '';
      (baseSection as any).stream_name = context.streamName || '';
      (baseSection as any).difficulty = 'adaptive';
      (baseSection as any).ai_generated = true;
    }

    // Calculate and add scoring
    const scoring = this.calculateSectionScoring(sectionId, context.questions);
    if (scoring) {
      (baseSection as any).scoring = scoring;
    }

    return baseSection as SectionData;
  }

  private buildQuestionSnapshot(
    context: QuestionContext, 
    sequence: number, 
    sectionId: string
  ): QuestionSnapshot {
    const question = context.question;
    
    // Build options array for MCQ questions
    let options: QuestionOption[] | undefined;
    if (question.options && Array.isArray(question.options)) {
      options = question.options.map((opt: any, idx: number) => ({
        id: typeof opt === 'string' ? String.fromCharCode(65 + idx) : opt.id || String.fromCharCode(65 + idx),
        text: typeof opt === 'string' ? opt : opt.text || opt,
        is_correct: question.correct !== undefined 
          ? (Array.isArray(question.correct) 
              ? question.correct.includes(typeof opt === 'string' ? String.fromCharCode(65 + idx) : opt.id)
              : (typeof opt === 'string' ? String.fromCharCode(65 + idx) : opt.id) === question.correct)
          : undefined
      }));
    }

    // Determine category/trait based on question ID
    let category: string | undefined;
    let trait: string | undefined;
    let skillTested: string | undefined;
    
    if (sectionId === 'riasec') {
      // Extract letter from fully qualified ID like "riasec_r1" -> "r"
      const parts = context.questionId.split('_');
      const letter = parts.length >= 2 ? parts[1].charAt(0).toLowerCase() : '';
      category = RIASEC_CATEGORIES[letter] || letter;
    } else if (sectionId === 'bigfive') {
      // Extract letter from fully qualified ID like "bigfive_o1" -> "o"
      const parts = context.questionId.split('_');
      const letter = parts.length >= 2 ? parts[1].charAt(0).toLowerCase() : '';
      trait = BIGFIVE_TRAITS[letter] || letter;
    } else if (sectionId === 'aptitude' || sectionId === 'knowledge') {
      skillTested = question.skillTested || question.topic || 'general';
    }

    return {
      question_id: context.questionId,
      sequence,
      question_text: question.text || question.question_text || '',
      options,
      category,
      trait,
      skill_tested: skillTested,
      topic: question.topic,
      difficulty: question.difficulty,
      ai_generated: sectionId === 'aptitude' || sectionId === 'knowledge',
      ai_generated_at: question.ai_generated_at,
      reverse_scored: question.reverseScored || false,
      scale_type: this.getScaleType(sectionId),
      answer: {
        value: context.answer,
        selected_at: context.answeredAt,
        time_spent_seconds: context.timeSpentSeconds,
        is_correct: question.isCorrect,
        confidence: question.confidence
      }
    };
  }

  private getScaleType(sectionId: string): string {
    const scaleTypes: Record<string, string> = {
      riasec: 'likert_5',
      bigfive: 'accuracy_5',
      values: 'importance_5',
      employability: 'agreement_5',
      aptitude: 'mcq',
      knowledge: 'mcq'
    };
    return scaleTypes[sectionId] || 'unknown';
  }

  private buildAdaptiveSection(
    sessionId: string, 
    results: { 
      questionsAnswered: number; 
      correctAnswers: number; 
      estimatedAbility: number;
      phasesCompleted: string[];
      finalPhase: string;
      reliability: number;
    }
  ): AdaptiveReferenceSection {
    return {
      section_id: 'adaptive_aptitude',
      title: 'Adaptive Aptitude Test',
      type: 'adaptive_mcq',
      session_id: sessionId,
      reference_only: true,
      questions_count: results.questionsAnswered,
      correct_answers: results.correctAnswers,
      estimated_ability: results.estimatedAbility,
      session_reference: {
        table: 'adaptive_aptitude_sessions',
        session_id: sessionId
      },
      summary: {
        phases_completed: results.phasesCompleted,
        final_phase: results.finalPhase,
        reliability: results.reliability
      }
    };
  }

  // ============================================================================
  // SCORING CALCULATIONS
  // ============================================================================

  private calculateSectionScoring(
    sectionId: string, 
    questions: QuestionContext[]
  ): any {
    switch (sectionId) {
      case 'riasec':
        return this.calculateRIASECScoring(questions);
      case 'bigfive':
        return this.calculateBigFiveScoring(questions);
      case 'values':
        return this.calculateValuesScoring(questions);
      case 'aptitude':
        return this.calculateAptitudeScoring(questions);
      case 'knowledge':
        return this.calculateKnowledgeScoring(questions);
      case 'employability':
        return this.calculateEmployabilityScoring(questions);
      default:
        return null;
    }
  }

  private calculateRIASECScoring(questions: QuestionContext[]) {
    const scores: Record<string, number[]> = {
      realistic: [], investigative: [], artistic: [],
      social: [], enterprising: [], conventional: []
    };

    questions.forEach(q => {
      // Extract letter from fully qualified ID like "riasec_r1" -> "r"
      const parts = q.questionId.split('_');
      const letter = parts.length >= 2 ? parts[1].charAt(0).toLowerCase() : '';
      const category = RIASEC_CATEGORIES[letter];
      if (category && typeof q.answer === 'number') {
        scores[category].push(q.answer);
      }
    });

    const averages: Record<string, number> = {};
    Object.entries(scores).forEach(([key, values]) => {
      averages[key] = values.length > 0 
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 20) 
        : 0;
    });

    // Calculate primary code
    const sorted = Object.entries(averages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([key]) => key.charAt(0).toUpperCase())
      .join('');

    return { ...averages, primary_code: sorted };
  }

  private calculateBigFiveScoring(questions: QuestionContext[]) {
    const scores: Record<string, number[]> = {
      openness: [], conscientiousness: [], extraversion: [],
      agreeableness: [], neuroticism: []
    };

    questions.forEach(q => {
      // Extract letter from fully qualified ID like "bigfive_o1" -> "o"
      const parts = q.questionId.split('_');
      const letter = parts.length >= 2 ? parts[1].charAt(0).toLowerCase() : '';
      const trait = BIGFIVE_TRAITS[letter];
      if (trait && typeof q.answer === 'number') {
        // Handle reverse scoring
        const isReverse = q.question?.reverseScored || false;
        const value = isReverse ? (6 - q.answer) : q.answer;
        scores[trait].push(value);
      }
    });

    const averages: Record<string, number> = {};
    Object.entries(scores).forEach(([key, values]) => {
      averages[key] = values.length > 0 
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 20) 
        : 0;
    });

    return averages;
  }

  private calculateValuesScoring(questions: QuestionContext[]) {
    // Simplified - would need category mapping similar to RIASEC
    return {
      intrinsic: 0, extrinsic: 0, social: 0, prestige: 0
    };
  }

  private calculateAptitudeScoring(questions: QuestionContext[]) {
    const total = questions.length;
    const answered = questions.filter(q => q.answer !== null && q.answer !== undefined).length;
    const correct = questions.filter(q => q.question?.isCorrect === true).length;
    
    // Calculate skill breakdown
    const skillScores: Record<string, number[]> = {};
    questions.forEach(q => {
      const skill = q.question?.skillTested || q.question?.topic || 'general';
      if (!skillScores[skill]) skillScores[skill] = [];
      if (q.question?.isCorrect) skillScores[skill].push(1);
      else skillScores[skill].push(0);
    });

    const skillBreakdown: Record<string, number> = {};
    Object.entries(skillScores).forEach(([skill, scores]) => {
      skillBreakdown[skill] = Math.round(
        (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
      );
    });

    return {
      total_questions: total,
      answered,
      correct,
      accuracy_percentage: answered > 0 ? Math.round((correct / answered) * 100) : 0,
      estimated_ability_theta: 0, // Would come from IRT calculation
      skill_breakdown: skillBreakdown
    };
  }

  private calculateKnowledgeScoring(questions: QuestionContext[]) {
    const total = questions.length;
    const answered = questions.filter(q => q.answer !== null && q.answer !== undefined).length;
    const correct = questions.filter(q => q.question?.isCorrect === true).length;

    return {
      total_questions: total,
      answered,
      correct,
      accuracy_percentage: answered > 0 ? Math.round((correct / answered) * 100) : 0
    };
  }

  private calculateEmployabilityScoring(questions: QuestionContext[]) {
    // Simplified - would need skill mapping
    return {
      communication: 0, teamwork: 0, problem_solving: 0, leadership: 0, adaptability: 0
    };
  }

  private calculateTotalDuration(): number {
    return Object.values(this.sectionTimings).reduce((total, timing) => {
      return total + (timing.duration_seconds || 0);
    }, 0);
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  async saveToDatabase(snapshot: AssessmentSnapshot, authToken?: string): Promise<void> {
    try {
      const updateResult = await supabase
        .from('personal_assessment_attempts')
        .update({
          assessment_snapshot_v2: snapshot,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.attemptId)
        .select('*')
        .setHeader('Authorization', authToken ? `Bearer ${authToken}` : '');

      if (updateResult.error) {
        throw updateResult.error;
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * Build and save incremental snapshot for in-progress assessment
   * This is called at every progress save for college students
   * Unlike buildSnapshot(), this doesn't require final adaptive results
   */
  async buildAndSaveIncrementalSnapshot(
    currentSectionIndex: number,
    currentQuestionIndex: number,
    isComplete: boolean = false,
    adaptiveSessionId?: string,
    adaptiveResults?: {
      questionsAnswered: number;
      correctAnswers: number;
      estimatedAbility: number;
      phasesCompleted: string[];
      finalPhase: string;
      reliability: number;
    },
    authToken?: string
  ): Promise<AssessmentSnapshot | null> {
    try {
      const now = new Date().toISOString();
      const totalDuration = this.calculateTotalDuration();

      // Calculate section scores for all sections with data
      const sections: AssessmentSnapshot['sections'] = {};

      for (const [sectionId, context] of this.sections) {
        const sectionData = this.buildSectionData(context, sectionId);
        if (sectionData) {
          sections[sectionId as keyof AssessmentSnapshot['sections']] = sectionData as any;
        }
      }

      // Add adaptive aptitude section if applicable and we have results
      if (adaptiveSessionId && adaptiveResults) {
        sections.adaptive_aptitude = this.buildAdaptiveSection(adaptiveSessionId, adaptiveResults);
      }

      const completedSectionsCount = Object.values(sections).filter(s => 
        'completed_at' in s && s.completed_at
      ).length;

      const snapshot: AssessmentSnapshot = {
        schema_version: SCHEMA_VERSION,
        attempt_id: this.attemptId,
        student_id: this.studentId,
        grade_level: 'college',
        metadata: {
          device_fingerprint: this.deviceInfo.fingerprint,
          user_agent: this.deviceInfo.userAgent,
          screen_resolution: this.deviceInfo.screen,
          timezone: this.deviceInfo.timezone,
          started_at: this.startTime,
          completed_at: isComplete ? now : undefined,
          total_duration_seconds: totalDuration,
          session_timings: this.sectionTimings,
          // Add current position info for recovery
          current_section_index: currentSectionIndex,
          current_question_index: currentQuestionIndex,
          last_updated_at: now
        },
        sections,
        summary: {
          total_sections: 7,
          completed_sections: completedSectionsCount,
          overall_completion_percentage: Math.round((completedSectionsCount / 7) * 100),
          ai_analysis_requested: isComplete,
          is_in_progress: !isComplete
        }
      };

      // Save to database immediately
      await this.saveToDatabase(snapshot, authToken);
      
      return snapshot;
    } catch (err) {
      return null;
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const createSnapshotBuilder = (
  attemptId: string,
  studentId: string,
  gradeLevel: string,
  deviceInfo?: { userAgent?: string; screen?: string; timezone?: string }
): AssessmentSnapshotBuilder => {
  return new AssessmentSnapshotBuilder(attemptId, studentId, gradeLevel, deviceInfo);
};

export const loadSnapshotFromDatabase = async (
  attemptId: string
): Promise<AssessmentSnapshot | null> => {
  try {
    const { data, error } = await supabase
      .from('personal_assessment_attempts')
      .select('assessment_snapshot_v2')
      .eq('id', attemptId)
      .single();

    if (error) {
      return null;
    }

    return data?.assessment_snapshot_v2 || null;
  } catch (err) {
    return null;
  }
};

export default AssessmentSnapshotBuilder;
