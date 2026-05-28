/**
 * Start Assessment Handler
 *
 * Handles POST /api/assessment/start
 * Starts a new assessment attempt and loads sections/questions
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { StartAssessmentOptions, StartAssessmentResult } from '../types';
import { validateStartAssessmentRequest, validateLearnerData, validateAttemptData } from '../utils/validation';
import { dbAttemptToAssessmentAttempt } from '../utils/converters';
import { loadSectionsWithQuestions } from '../utils/question-loader';
import { createLogger } from '../../../lib/logger';
import { normalizeStreamId } from '../utils/streamNormalizer';
import { ensureStreamExists } from '../utils/ensureStreamExists';

const logger = createLogger('StartHandler');

export async function startHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const body = (await context.request.json()) as StartAssessmentOptions;

    const validation = validateStartAssessmentRequest(body);
    if (!validation.isValid) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const { gradeLevel, streamId } = body;
    
    logger.info('Starting assessment', { 
      userId: user.sub, 
      gradeLevel, 
      originalStreamId: streamId,
      hasEnv: !!env,
      hasQuestionGenUrl: !!env?.QUESTION_GENERATION_API_URL
    });

    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select(`
        id,
        grade,
        branch_field,
        course_name,
        program_id,
        learner_type,
        programs (
          name,
          code,
          degree_level
        )
      `)
      .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
      .maybeSingle();

    if (learnerError) {
      return Response.json({ error: 'Learner lookup failed', message: learnerError.message }, { status: 400 });
    }

    const learnerValidation = validateLearnerData(learnerData);
    if (!learnerValidation.isValid) {
      return Response.json({ error: learnerValidation.message }, { status: 400 });
    }

    const learnerId = learnerData!.id;
    
    // **CRITICAL: Get the actual program name from learner profile for normalization**
    // This ensures postgraduate programs like "Master of Technology in Computer Science" 
    // are correctly normalized to "mtech_cse" instead of "btech_cse"
    const actualProgramName = (learnerData.programs as any)?.name || 
                              (learnerData.programs as any)?.code || 
                              learnerData.course_name || 
                              learnerData.branch_field ||
                              streamId; // Fallback to frontend streamId if no program in profile
    
    logger.info('Program information', {
      actualProgramName,
      programFromDB: (learnerData.programs as any)?.name,
      courseName: learnerData.course_name,
      branchField: learnerData.branch_field,
      frontendStreamId: streamId
    });
    
    // Normalize using the ACTUAL program name from database, not the frontend streamId
    const normalizedStreamId = actualProgramName ? normalizeStreamId(actualProgramName) : null;
    
    logger.info('Stream ID normalization', { 
      originalStreamId: streamId,
      actualProgramName,
      normalizedStreamId
    });
    
    // **CRITICAL: Ensure the normalized stream ID exists in the database**
    // This prevents foreign key constraint violations by auto-creating missing streams
    if (normalizedStreamId) {
      const streamExists = await ensureStreamExists(supabase, normalizedStreamId);
      if (!streamExists) {
        logger.error('Failed to ensure stream exists', { normalizedStreamId });
        return Response.json(
          { 
            error: 'Failed to initialize assessment stream', 
            message: 'Could not create or verify stream record in database' 
          }, 
          { status: 500 }
        );
      }
      logger.info('Stream verified/created successfully', { normalizedStreamId });
    }

    // **CRITICAL: Check for existing in-progress attempt BEFORE creating new one**
    const { data: existingAttempts, error: existingError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, grade_level, stream_id, status, all_responses, current_section_index, current_question_index')
      .eq('learner_id', learnerId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1);

    let attempt = null;

    // If in-progress attempt exists for same grade/stream, reuse it
    if (existingAttempts && existingAttempts.length > 0) {
      const existingAttempt = existingAttempts[0];
      const sameGrade = existingAttempt.grade_level === gradeLevel;
      const sameStream = existingAttempt.stream_id === normalizedStreamId || (normalizedStreamId === null && existingAttempt.stream_id === null);

      if (sameGrade && sameStream) {
        attempt = existingAttempt;
      } else {
        return Response.json(
          {
            error: 'You have an in-progress assessment for a different grade/stream level. Please abandon it first or resume it.',
            existingAttemptId: existingAttempt.id,
            existingGradeLevel: existingAttempt.grade_level,
            existingStreamId: existingAttempt.stream_id
          },
          { status: 409 } // 409 Conflict
        );
      }
    }

    // Only create NEW attempt if no matching in-progress one exists
    if (!attempt) {
      const { data: newAttempt, error: insertError } = await supabase
        .from('personal_assessment_attempts')
        .insert({
          learner_id: learnerId,
          grade_level: gradeLevel,
          stream_id: normalizedStreamId || null,
          status: 'in_progress',
          all_responses: {},
          timer_remaining: null,
          elapsed_time: 0,
          current_section_index: 0,
          current_question_index: 0
        })
        .select('*')
        .single();

      if (insertError || !newAttempt) {
        return Response.json({ error: 'Failed to create assessment attempt', message: insertError?.message }, { status: 500 });
      }

      attempt = newAttempt;
      
      // Build and save learner context immediately
      try {
        logger.info('Building learner context', { learnerId, gradeLevel, normalizedStreamId });
        
        // We already have learnerData from above, no need to fetch again
        let learnerContext: any = {};
        
        if (learnerData) {
          // Extract program information (already fetched above)
          const programName = (learnerData.programs as any)?.name || 
                            (learnerData.programs as any)?.code || 
                            learnerData.course_name || 
                            learnerData.branch_field;
          const programCode = (learnerData.programs as any)?.code || normalizedStreamId;
          const programDegreeLevel = (learnerData.programs as any)?.degree_level;
          
          // Determine degree level
          let degreeLevel: string | null = programDegreeLevel;
          if (!degreeLevel && programName) {
            const programLower = programName.toLowerCase();
            if (programLower.includes('bachelor') || programLower.includes('b.tech') || programLower.includes('btech') || 
                programLower.includes('bca') || programLower.includes('b.sc') || programLower.includes('b.com') || programLower.includes('bba')) {
              degreeLevel = 'undergraduate';
            } else if (programLower.includes('master') || programLower.includes('m.tech') || programLower.includes('mtech') || 
                       programLower.includes('mca') || programLower.includes('mba') || programLower.includes('m.sc')) {
              degreeLevel = 'postgraduate';
            } else if (programLower.includes('diploma')) {
              degreeLevel = 'diploma';
            }
          }
          
          // Build enhanced grade
          let rawGrade = learnerData.grade || 'Learner';
          if (gradeLevel === 'college' && programName) {
            if (degreeLevel === 'undergraduate') {
              rawGrade = `UG - ${programName}`;
            } else if (degreeLevel === 'postgraduate') {
              rawGrade = `PG - ${programName}`;
            } else {
              rawGrade = programName;
            }
          } else if (gradeLevel === 'middle') {
            rawGrade = 'Grade 6-8';
          } else if (gradeLevel === 'highschool') {
            rawGrade = 'Grade 9-10';
          } else if (gradeLevel === 'higher_secondary') {
            rawGrade = 'Grade 11-12';
          } else if (gradeLevel === 'after10') {
            rawGrade = 'After 10th';
          } else if (gradeLevel === 'after12') {
            rawGrade = 'After 12th';
          }
          
          // Determine learner type
          let learnerType = 'general';
          if (programName || degreeLevel || (learnerData as any).program_id) {
            learnerType = 'college';
          } else if ((learnerData as any).learner_type === 'school' || (learnerData as any).school_id) {
            learnerType = 'school';
          }
          
          learnerContext = {
            rawGrade,
            grade: learnerDetails.grade,
            programName: programName || undefined,
            programCode: programCode || undefined,
            degreeLevel,
            selectedStream: normalizedStreamId,
            selectedCategory: null,
            learnerType
          };
        } else {
          // Fallback context
          let rawGrade = 'Learner';
          if (gradeLevel === 'middle') rawGrade = 'Grade 6-8';
          else if (gradeLevel === 'highschool') rawGrade = 'Grade 9-10';
          else if (gradeLevel === 'higher_secondary') rawGrade = 'Grade 11-12';
          else if (gradeLevel === 'after10') rawGrade = 'After 10th';
          else if (gradeLevel === 'after12') rawGrade = 'After 12th';
          else if (gradeLevel === 'college') rawGrade = 'College';
          
          learnerContext = {
            rawGrade,
            selectedStream: normalizedStreamId,
            selectedCategory: null,
            learnerType: gradeLevel === 'college' ? 'college' : 'general'
          };
        }
        
        logger.info('Learner context built', { learnerContext });
        
        // Save learner context to attempt
        const { error: contextError } = await supabase
          .from('personal_assessment_attempts')
          .update({ learner_context: learnerContext })
          .eq('id', attempt.id);
        
        if (contextError) {
          logger.error('Failed to save learner context', { error: contextError });
        } else {
          logger.info('Learner context saved successfully');
        }
      } catch (contextErr) {
        logger.error('Error building learner context', { error: contextErr });
        // Non-fatal - continue
      }
    }

    let sections;
    try {
      sections = await loadSectionsWithQuestions(supabase, gradeLevel, normalizedStreamId, env);
      logger.info('Sections loaded successfully', { 
        sectionCount: sections?.length || 0,
        sectionNames: sections?.map((s: any) => s.name) || []
      });
    } catch (loadError) {
      logger.error('Failed to load sections', { error: loadError, gradeLevel, normalizedStreamId });
      return Response.json(
        { error: 'Failed to load assessment sections', message: loadError instanceof Error ? loadError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!sections || sections.length === 0) {
      logger.warn('No sections available', { gradeLevel, streamId });
      return Response.json({ error: 'No assessment sections available for this grade level' }, { status: 404 });
    }

    const attemptValidation = validateAttemptData(attempt);
    if (!attemptValidation.isValid) {
      return Response.json({ error: attemptValidation.message }, { status: 400 });
    }

    const result: StartAssessmentResult = {
      success: true,
      attemptId: attempt.id,
      attempt: dbAttemptToAssessmentAttempt(attempt),
      sections
    };

    logger.info('Assessment started successfully', { 
      attemptId: attempt.id, 
      sectionCount: sections.length,
      gradeLevel,
      originalStreamId: streamId,
      normalizedStreamId
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    logger.error('Failed to start assessment', { error });
    return Response.json(
      {
        error: 'Failed to start assessment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
