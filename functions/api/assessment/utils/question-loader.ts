/**
 * Question Loader Utility
 *
 * Handles loading assessment questions from database based on grade level and filters
 */

import type { AssessmentSection, AssessmentQuestion, ResponseScale } from '../types';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('QuestionLoader');

/**
 * Loads sections and questions for a given grade level
 *
 * @param supabase - Supabase client
 * @param gradeLevel - Grade level
 * @param streamId - Optional stream ID
 * @param env - Environment variables (for Cloudflare Workers)
 * @returns Array of sections with questions
 */
export async function loadSectionsWithQuestions(
  supabase: any,
  gradeLevel: string,
  streamId?: string | null,
  env?: any
): Promise<AssessmentSection[]> {
  logger.info('Loading sections', { gradeLevel, streamId, hasEnv: !!env });
  
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
      logger.info('Fetched grade-specific sections', { count: gradeSections?.length || 0, gradeLevel });
      return gradeSections || [];
    } else {
      let standardQuery = supabase
        .from('personal_assessment_sections')
        .select('*')
        .eq('is_active', true)
        .in('name', ['riasec', 'bigfive', 'values', 'employability']);

      if (useGeneralSections) {
        standardQuery = standardQuery.eq('grade_level', 'general');
      }

      const { data: standardSections, error: standardError } = await standardQuery;
      if (standardError) throw standardError;
      logger.info('Fetched standard sections', { count: standardSections?.length || 0, sections: standardSections?.map((s: any) => s.name) });
      return standardSections || [];
    }
  })();

  const fetchAdaptivePromise = loadAdaptiveSections(supabase, gradeLevel);

  // === WAIT FOR BOTH SECTION FETCHES IN PARALLEL ===
  const [basicSections, adaptiveSections] = await Promise.all([
    fetchSectionsPromise,
    fetchAdaptivePromise
  ]);

  logger.info('Fetched basic and adaptive sections', { 
    basicCount: basicSections.length, 
    adaptiveCount: adaptiveSections.length 
  });

  allSections = [...basicSections, ...adaptiveSections];

  // === BATCH FETCH ALL QUESTIONS ===
  const sectionIds = allSections.map((s: any) => s.id);

  if (sectionIds.length === 0) {
    logger.warn('No sections found', { gradeLevel, streamId });
    return [];
  }

  logger.info('Fetching questions for sections', { sectionCount: sectionIds.length });

  const { data: allQuestions, error: questionsError } = await supabase
    .from('personal_assessment_questions')
    .select('*')
    .in('section_id', sectionIds)
    .eq('is_active', true)
    .order('order_number', { ascending: true });

  if (questionsError) throw questionsError;

  logger.info('Fetched questions', { questionCount: allQuestions?.length || 0 });


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

  logger.info('Built sections with questions', { 
    sectionCount: sectionsWithQuestions.length,
    sections: sectionsWithQuestions.map((s: any) => ({ name: s.name, questionCount: s.questions.length }))
  });

  // === FETCH AI-GENERATED SECTIONS ===
  const aiSections = await loadAISections(supabase, streamId, gradeLevel, env);

  logger.info('Final section count', { 
    staticSections: sectionsWithQuestions.length,
    aiSections: aiSections.length,
    totalSections: sectionsWithQuestions.length + aiSections.length,
    allSectionNames: [...sectionsWithQuestions.map((s: any) => s.name), ...aiSections.map((s: any) => s.name)]
  });

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
          logger.info('Loaded adaptive section', { gradeLevel, sectionName: section.name });
        }
      } else {
        logger.warn('No adaptive section found', { gradeLevel });
      }
    }
  } catch (error) {
    logger.error('Error loading adaptive sections', { error, gradeLevel });
  }

  return sections;
}

/**
 * Load AI-generated sections for stream
 * Generates questions on-the-fly if they don't exist in the database
 */
async function loadAISections(supabase: any, streamId?: string | null, gradeLevel?: string, env?: any): Promise<AssessmentSection[]> {
  const sections: AssessmentSection[] = [];

  // AI questions are used for after10, after12, higher_secondary, and college
  const usesAIQuestions = gradeLevel === 'after10' || gradeLevel === 'after12' || gradeLevel === 'higher_secondary' || gradeLevel === 'college';
  
  logger.info('Loading AI sections', { streamId, gradeLevel, usesAIQuestions });
  
  if (!streamId || !usesAIQuestions) {
    logger.info('Skipping AI sections', { hasStreamId: !!streamId, usesAIQuestions });
    return sections;
  }

  try {
    // === FETCH APTITUDE QUESTIONS ===
    let { data: aptitudeData, error: aptitudeError } = await supabase
      .from('career_assessment_ai_questions')
      .select('*')
      .eq('stream_id', streamId)
      .eq('question_type', 'aptitude')
      .eq('is_active', true)
      .maybeSingle();

    // If aptitude questions don't exist, generate them on-the-fly
    if (!aptitudeData && !aptitudeError) {
      logger.info('No aptitude questions found, generating', { streamId });
      aptitudeData = await generateAptitudeQuestionsOnTheFly(supabase, streamId, gradeLevel, env);
    }

    if (!aptitudeError && aptitudeData) {
      const questions = Array.isArray(aptitudeData.questions) ? aptitudeData.questions : [];
      logger.info('Loaded aptitude questions', { streamId, questionCount: questions.length });

      sections.push({
        id: `aptitude-${streamId}`,
        name: 'aptitude',
        title: 'Stream Based Aptitude',
        description: `Measure your cognitive strengths across verbal, numerical, logical, spatial, and clerical domains.`,
        icon: 'trending-up',
        color: 'amber',
        instruction: 'Choose the correct answer. You have 1 minute per question.',
        responseScale: [],
        isTimed: true,
        timeLimitSeconds: 15 * 60, // 15 minutes fallback
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
    } else if (aptitudeError) {
      logger.error('Error fetching aptitude questions', { error: aptitudeError, streamId });
    }

    // === FETCH KNOWLEDGE QUESTIONS ===
    let { data: knowledgeData, error: knowledgeError } = await supabase
      .from('career_assessment_ai_questions')
      .select('*')
      .eq('stream_id', streamId)
      .eq('question_type', 'knowledge')
      .eq('is_active', true)
      .maybeSingle();

    // If knowledge questions don't exist, generate them on-the-fly
    if (!knowledgeData && !knowledgeError) {
      logger.info('No knowledge questions found, generating', { streamId });
      knowledgeData = await generateKnowledgeQuestionsOnTheFly(supabase, streamId, gradeLevel, env);
    }

    if (!knowledgeError && knowledgeData) {
      const questions = Array.isArray(knowledgeData.questions) ? knowledgeData.questions : [];
      logger.info('Loaded knowledge questions', { streamId, questionCount: questions.length });

      sections.push({
        id: `knowledge-${streamId}`,
        name: 'knowledge',
        title: 'Stream Knowledge',
        description: `Test your understanding of core concepts in your field.`,
        icon: 'book',
        color: 'blue',
        instruction: 'Choose the best answer for each question. You have 1 minute per question.',
        responseScale: [],
        isTimed: true,
        timeLimitSeconds: 30 * 60, // 30 minutes
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
    } else if (knowledgeError) {
      logger.error('Error fetching knowledge questions', { error: knowledgeError, streamId });
    }
  } catch (error) {
    logger.error('Error loading AI sections', { error, streamId, gradeLevel });
  }

  logger.info('AI sections loaded', { count: sections.length, sectionNames: sections.map(s => s.name) });
  return sections;
}

/**
 * Generate aptitude questions on-the-fly and save to database
 */
async function generateAptitudeQuestionsOnTheFly(supabase: any, streamId: string, gradeLevel?: string, env?: any): Promise<any | null> {
  try {
    logger.info('Generating aptitude questions', { streamId, gradeLevel });
    
    // Get the question generation API URL from environment
    const apiUrl = env?.QUESTION_GENERATION_API_URL;
    if (!apiUrl) {
      logger.error('QUESTION_GENERATION_API_URL not configured');
      return null;
    }
    
    // Call the question generation API
    const response = await fetch(`${apiUrl}/career-assessment/generate-aptitude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamId,
        questionCount: 50,
        gradeLevel
      })
    });

    if (!response.ok) {
      logger.error('API error generating aptitude questions', { 
        status: response.status, 
        statusText: response.statusText,
        streamId 
      });
      return null;
    }

    const data = await response.json();
    
    if (!data.questions || data.questions.length === 0) {
      logger.error('No questions returned from API', { streamId });
      return null;
    }

    // Save to database for future use
    const { data: savedData, error: saveError } = await supabase
      .from('career_assessment_ai_questions')
      .insert({
        stream_id: streamId,
        question_type: 'aptitude',
        questions: data.questions,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      logger.error('Error saving aptitude questions', { error: saveError, streamId });
      // Return the generated questions even if save fails
      return { questions: data.questions };
    }

    logger.info('Successfully generated and saved aptitude questions', { 
      streamId, 
      questionCount: data.questions.length 
    });
    return savedData;
  } catch (error) {
    logger.error('Error generating aptitude questions', { error, streamId });
    return null;
  }
}

/**
 * Generate knowledge questions on-the-fly and save to database
 */
async function generateKnowledgeQuestionsOnTheFly(supabase: any, streamId: string, gradeLevel?: string, env?: any): Promise<any | null> {
  try {
    logger.info('Generating knowledge questions', { streamId, gradeLevel });
    
    // Get the question generation API URL from environment
    const apiUrl = env?.QUESTION_GENERATION_API_URL;
    if (!apiUrl) {
      logger.error('QUESTION_GENERATION_API_URL not configured');
      return null;
    }
    
    // Call the question generation API
    const response = await fetch(`${apiUrl}/career-assessment/generate-knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamId,
        streamName: streamId, // Use streamId as name for college programs
        questionCount: 20,
        gradeLevel,
        isCollegeLearner: gradeLevel === 'college' || gradeLevel === 'higher_secondary'
      })
    });

    if (!response.ok) {
      logger.error('API error generating knowledge questions', { 
        status: response.status, 
        statusText: response.statusText,
        streamId 
      });
      return null;
    }

    const data = await response.json();
    
    if (!data.questions || data.questions.length === 0) {
      logger.error('No questions returned from API', { streamId });
      return null;
    }

    // Save to database for future use
    const { data: savedData, error: saveError } = await supabase
      .from('career_assessment_ai_questions')
      .insert({
        stream_id: streamId,
        question_type: 'knowledge',
        questions: data.questions,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      logger.error('Error saving knowledge questions', { error: saveError, streamId });
      // Return the generated questions even if save fails
      return { questions: data.questions };
    }

    logger.info('Successfully generated and saved knowledge questions', { 
      streamId, 
      questionCount: data.questions.length 
    });
    return savedData;
  } catch (error) {
    logger.error('Error generating knowledge questions', { error, streamId });
    return null;
  }
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
