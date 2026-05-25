/**
 * Question Loader Utility
 *
 * Handles loading assessment questions from database based on grade level and filters
 */

import type { AssessmentSection, AssessmentQuestion, ResponseScale } from '../types';

/**
 * Loads sections and questions for a given grade level
 *
 * @param supabase - Supabase client
 * @param gradeLevel - Grade level
 * @param streamId - Optional stream ID
 * @returns Array of sections with questions
 */
export async function loadSectionsWithQuestions(
  supabase: any,
  gradeLevel: string,
  streamId?: string | null
): Promise<AssessmentSection[]> {
  const gradeSpecificGrades = ['middle', 'highschool', 'higher_secondary'];
  const useGeneralSections = ['after10', 'after12', 'college'].includes(gradeLevel);

  let allSections: any[] = [];


  // === FETCH SECTIONS IN PARALLEL ===
  const fetchSectionsPromise = (async () => {
    if (gradeSpecificGrades.includes(gradeLevel)) {
      const { data: gradeSections, error: gradeError } = await supabase
        .from('personal_assessment_sections')
        .select('*')
        .eq('is_active', true)
        .eq('grade_level', gradeLevel)
        .not('name', 'like', 'adaptive_aptitude%');

      if (gradeError) throw gradeError;
      return gradeSections || [];
    } else {
      let standardQuery = supabase
        .from('personal_assessment_sections')
        .select('*')
        .eq('is_active', true)
        .in('name', ['riasec', 'bigfive', 'employability']);

      if (useGeneralSections) {
        standardQuery = standardQuery.eq('grade_level', 'general');
      }

      const { data: standardSections, error: standardError } = await standardQuery;
      if (standardError) throw standardError;
      return standardSections || [];
    }
  })();

  const fetchAdaptivePromise = loadAdaptiveSections(supabase, gradeLevel);

  // === WAIT FOR BOTH SECTION FETCHES IN PARALLEL ===
  const [basicSections, adaptiveSections] = await Promise.all([
    fetchSectionsPromise,
    fetchAdaptivePromise
  ]);

  allSections = [...basicSections, ...adaptiveSections];

  // === BATCH FETCH ALL QUESTIONS ===
  const sectionIds = allSections.map((s: any) => s.id);

  if (sectionIds.length === 0) {
    return [];
  }

  const { data: allQuestions, error: questionsError } = await supabase
    .from('personal_assessment_questions')
    .select('*')
    .in('section_id', sectionIds)
    .eq('is_active', true)
    .order('order_number', { ascending: true });

  if (questionsError) throw questionsError;


  // === BUILD SECTIONS WITH QUESTIONS ===
  const sectionsWithQuestions = allSections.map((section: any) => {
    const sectionQuestions = (allQuestions || []).filter((q: any) => q.section_id === section.id);
    const filteredQuestions = filterQuestionsByGrade(sectionQuestions, gradeLevel);
    const responseScale = parseResponseScale(section.response_scale);

    // Generate default response scale if needed
    const finalResponseScale = responseScale.length === 0 && filteredQuestions.some((q: any) => q.question_type === 'rating')
      ? getDefaultResponseScale()
      : responseScale;

    return {
      id: section.id,
      name: section.name,
      title: section.title,
      description: section.description,
      icon: section.icon,
      color: section.color,
      instruction: section.instruction,
      responseScale: finalResponseScale,
      isTimed: section.is_timed,
      timeLimitSeconds: section.time_limit_seconds,
      questions: mapQuestions(filteredQuestions)
    };
  });

  // === FETCH AI-GENERATED SECTIONS ===
  const aiSections = await loadAISections(supabase, streamId, gradeLevel);

  return [...sectionsWithQuestions, ...aiSections];
}

/**
 * Load adaptive aptitude sections for grade level
 */
async function loadAdaptiveSections(supabase: any, gradeLevel: string): Promise<AssessmentSection[]> {
  const sections: AssessmentSection[] = [];

  try {
    let query;

    if (gradeLevel === 'college') {
      query = supabase
        .from('personal_assessment_sections')
        .select('*')
        .eq('is_active', true)
        .eq('grade_level', 'college')
        .in('name', ['Adaptive Aptitude Test - UG', 'Adaptive Aptitude Test - PG']);
    } else if (gradeLevel === 'middle') {
      query = supabase
        .from('personal_assessment_sections')
        .select('*')
        .eq('is_active', true)
        .eq('grade_level', 'middle')
        .eq('name', 'adaptive_aptitude_middleschool')
        .maybeSingle();
    } else if (gradeLevel === 'highschool') {
      query = supabase
        .from('personal_assessment_sections')
        .select('*')
        .eq('is_active', true)
        .eq('grade_level', 'highschool')
        .eq('name', 'adaptive_aptitude_high')
        .maybeSingle();
    } else if (gradeLevel === 'higher_secondary') {
      query = supabase
        .from('personal_assessment_sections')
        .select('*')
        .eq('is_active', true)
        .eq('grade_level', 'higher_secondary')
        .eq('name', 'adaptive_aptitude_higher_secondary')
        .maybeSingle();
    }

    if (query) {
      const { data: adaptiveData, error: adaptiveError } = await query;

      if (adaptiveError) throw adaptiveError;

      if (adaptiveData) {
        const section = Array.isArray(adaptiveData) ? adaptiveData[0] : adaptiveData;
        if (section) {
          sections.push({
            id: section.id,
            name: 'adaptive_aptitude',
            title: 'Adaptive Aptitude Test',
            description: section.description,
            icon: section.icon,
            color: section.color,
            instruction: section.instruction,
            questions: [] // Questions loaded dynamically by adaptive API
          });
        }
      }
    }
  } catch (error) {
    console.error('[QuestionLoader] Error loading adaptive sections:', error);
  }

  return sections;
}

/**
 * Load AI-generated sections for stream
 */
async function loadAISections(supabase: any, streamId?: string | null, gradeLevel?: string): Promise<AssessmentSection[]> {
  const sections: AssessmentSection[] = [];

  if (!streamId || gradeLevel !== 'college') return sections;

  try {
    // === FETCH APTITUDE QUESTIONS ===
    const { data: aptitudeData, error: aptitudeError } = await supabase
      .from('career_assessment_ai_questions')
      .select('*')
      .eq('stream_id', streamId)
      .eq('question_type', 'aptitude')
      .eq('is_active', true)
      .maybeSingle();

    if (!aptitudeError && aptitudeData) {
      const questions = Array.isArray(aptitudeData.questions) ? aptitudeData.questions : [];

      sections.push({
        id: `aptitude-${streamId}`,
        name: 'aptitude',
        title: 'Aptitude Assessment',
        description: `Assess your aptitude in ${streamId}`,
        icon: 'trending-up',
        color: 'purple',
        instruction: 'Answer the following aptitude questions based on your understanding.',
        responseScale: [],
        questions: questions.map((q: any, idx: number) => ({
          id: `${q.id || idx}`,
          text: q.question,
          type: q.type || 'mcq',
          order: idx + 1,
          options: q.options,
          correctAnswer: q.correct_answer,
          metadata: q
        }))
      });
    }

    // === FETCH KNOWLEDGE QUESTIONS ===
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('career_assessment_ai_questions')
      .select('*')
      .eq('stream_id', streamId)
      .eq('question_type', 'knowledge')
      .eq('is_active', true)
      .maybeSingle();

    if (!knowledgeError && knowledgeData) {
      const questions = Array.isArray(knowledgeData.questions) ? knowledgeData.questions : [];

      sections.push({
        id: `knowledge-${streamId}`,
        name: 'knowledge',
        title: 'Knowledge Assessment',
        description: `Test your knowledge in ${streamId}`,
        icon: 'book',
        color: 'indigo',
        instruction: 'Answer the following knowledge-based questions.',
        responseScale: [],
        questions: questions.map((q: any, idx: number) => ({
          id: `${q.id || idx}`,
          text: q.question,
          type: q.type || 'mcq',
          order: idx + 1,
          options: q.options,
          correctAnswer: q.correct_answer,
          metadata: q
        }))
      });
    }
  } catch (error) {
    console.error('[QuestionLoader] Error loading AI sections:', error);
  }

  return sections;
}

/**
 * Filter questions by grade level from metadata
 */
function filterQuestionsByGrade(questions: any[], gradeLevel: string): any[] {
  return questions.filter((q: any) => {
    if (!q.metadata) return true;

    try {
      const metadata = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
      if (metadata.grade) {
        return metadata.grade === parseInt(gradeLevel.replace(/\D/g, '')) || !metadata.grade;
      }
    } catch (e) {
      // If parsing fails, include the question
    }
    return true;
  });
}

/**
 * Parse response scale from section
 */
function parseResponseScale(responseScale: any): ResponseScale[] {
  if (!responseScale) return [];

  try {
    const parsed = typeof responseScale === 'string' ? JSON.parse(responseScale) : responseScale;
    return Array.isArray(parsed) ? parsed : parsed?.values || [];
  } catch (e) {
    return [];
  }
}

/**
 * Get default response scale for rating questions
 */
function getDefaultResponseScale(): ResponseScale[] {
  return [
    { value: 1, label: 'Not like me' },
    { value: 2, label: 'Sometimes' },
    { value: 3, label: 'Mostly me' },
    { value: 4, label: 'Very me' }
  ];
}

/**
 * Map database questions to AssessmentQuestion type
 */
function mapQuestions(questions: any[]): AssessmentQuestion[] {
  return questions.map((q: any) => {
    let maxSelections: number | undefined;
    if (q.metadata) {
      try {
        const metadata = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
        maxSelections = metadata.max_selections || metadata.maxSelections;
      } catch (e) {
        // Continue without maxSelections
      }
    }

    return {
      id: q.id,
      text: q.question_text,
      type: q.question_type,
      order: q.order_number,
      options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [],
      maxSelections,
      categoryMapping: q.category_mapping,
      metadata: q.metadata
    };
  });
}
