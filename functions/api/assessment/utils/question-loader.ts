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
      // For grade-specific levels (middle, highschool, higher_secondary):
      // Fetch their specific sections from database
      const { data: gradeSections, error: gradeError } = await supabase
        .from('personal_assessment_sections')
        .select('*')
        .eq('is_active', true)
        .eq('grade_level', gradeLevel)
        .not('name', 'like', 'adaptive_aptitude%');

      if (gradeError) throw gradeError;
      logger.info('Fetched grade-specific sections', { count: gradeSections?.length || 0, gradeLevel });
      
      // CRITICAL FIX: For higher_secondary, also fetch standard sections (riasec, bigfive, values, employability)
      // if they don't exist in grade-specific sections
      if (gradeLevel === 'higher_secondary') {
        const existingSectionNames = (gradeSections || []).map((s: any) => s.name);
        const standardSectionNames = ['riasec', 'bigfive', 'values', 'employability'];
        const missingSections = standardSectionNames.filter(name => !existingSectionNames.includes(name));
        
        if (missingSections.length > 0) {
          logger.info('Fetching missing standard sections for higher_secondary', { missingSections });
          
          const { data: standardSections, error: standardError } = await supabase
            .from('personal_assessment_sections')
            .select('*')
            .eq('is_active', true)
            .eq('grade_level', 'general')
            .in('name', missingSections);
          
          if (standardError) {
            logger.error('Error fetching standard sections', { error: standardError });
          } else if (standardSections && standardSections.length > 0) {
            logger.info('Adding standard sections to higher_secondary', { 
              count: standardSections.length,
              sections: standardSections.map((s: any) => s.name)
            });
            return [...(gradeSections || []), ...standardSections];
          }
        }
      }
      
      return gradeSections || [];
    } else {
      // For after10, after12, college: fetch standard sections (riasec, bigfive, values, employability)
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
      logger.info('Fetched standard sections for college/after10/after12', { 
        count: standardSections?.length || 0, 
        sections: standardSections?.map((s: any) => s.name),
        gradeLevel 
      });
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

    logger.info('Building section', {
      sectionName: section.name,
      sectionId: section.id,
      totalQuestions: sectionQuestions.length,
      filteredQuestions: filteredQuestions.length,
      hasResponseScale: finalResponseScale.length > 0
    });

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
      timeLimit: section.time_limit_seconds, // Map timeLimitSeconds to timeLimit for frontend
      timeLimitSeconds: section.time_limit_seconds, // Keep for backward compatibility
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
    allSectionNames: [...sectionsWithQuestions.map((s: any) => s.name), ...aiSections.map((s: any) => s.name)],
    gradeLevel,
    streamId,
    hasStreamId: !!streamId
  });

  const finalSections = [...sectionsWithQuestions, ...aiSections];
  
  logger.info('Returning sections', {
    count: finalSections.length,
    sectionDetails: finalSections.map((s: any) => ({
      name: s.name,
      title: s.title,
      questionCount: s.questions?.length || 0,
      isTimed: s.isTimed,
      timeLimit: s.timeLimit
    }))
  });

  return finalSections;
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
 * Always returns section placeholders - questions will be generated on-demand when user reaches the stage
 */
async function loadAISections(supabase: any, streamId?: string | null, gradeLevel?: string, env?: any): Promise<AssessmentSection[]> {
  const sections: AssessmentSection[] = [];

  // AI questions are used for after10, after12, higher_secondary, and college
  const usesAIQuestions = gradeLevel === 'after10' || gradeLevel === 'after12' || gradeLevel === 'higher_secondary' || gradeLevel === 'college';
  
  logger.info('[loadAISections] Starting AI section load', { 
    streamId, 
    gradeLevel, 
    usesAIQuestions,
    hasStreamId: !!streamId,
    hasEnv: !!env
  });
  
  // CRITICAL FIX: For higher_secondary, we MUST have streamId to load AI sections
  // If streamId is missing, log error but don't fail silently
  if (!streamId && usesAIQuestions) {
    logger.error('[loadAISections] CRITICAL: Missing streamId for grade level that requires AI questions', { 
      gradeLevel,
      usesAIQuestions,
      message: 'AI sections (aptitude & knowledge) will NOT be loaded without streamId'
    });
    return sections;
  }
  
  if (!usesAIQuestions) {
    logger.info('[loadAISections] Grade level does not use AI questions', { gradeLevel });
    return sections;
  }

  try {
    // === ALWAYS ADD APTITUDE SECTION (questions generated on-demand) ===
    logger.info('[loadAISections] Adding Stream Based Aptitude section placeholder', { streamId, gradeLevel });
    
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
      timeLimit: 15 * 60, // 15 minutes fallback - mapped for frontend
      timeLimitSeconds: 15 * 60, // 15 minutes fallback
      individualTimeLimit: 60, // 1 minute per question
      questions: [] // Empty - will be generated when user reaches this stage
    });

    // === ALWAYS ADD KNOWLEDGE SECTION (questions generated on-demand) ===
    logger.info('[loadAISections] Adding Stream Knowledge section placeholder', { streamId, gradeLevel });
    
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
      timeLimit: 30 * 60, // 30 minutes - mapped for frontend
      timeLimitSeconds: 30 * 60, // 30 minutes
      individualTimeLimit: 60, // 1 minute per question
      questions: [] // Empty - will be generated when user reaches this stage
    });

  } catch (error) {
    logger.error('[loadAISections] Error creating AI section placeholders', { error, streamId, gradeLevel });
  }

  logger.info('[loadAISections] AI sections loaded successfully', { 
    count: sections.length, 
    sectionNames: sections.map(s => s.name),
    streamId,
    gradeLevel
  });
  
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
    let categoryMapping = q.category_mapping;
    let metadata = q.metadata;

    if (q.metadata) {
      try {
        metadata = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
        maxSelections = metadata.max_selections || metadata.maxSelections;
      } catch (e) {
        // Continue without maxSelections
      }
    }

    if (typeof categoryMapping === 'string') {
      try {
        categoryMapping = JSON.parse(categoryMapping);
      } catch (e) {
        categoryMapping = null;
      }
    }

    const mappingType = categoryMapping?.type;
    const riasecType = ['R', 'I', 'A', 'S', 'E', 'C'].includes(mappingType) ? mappingType : undefined;

    return {
      id: q.id,
      text: q.question_text,
      type: q.question_type,
      order: q.order_number,
      options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [],
      maxSelections,
      categoryMapping,
      riasecType,
      metadata
    };
  });
}
