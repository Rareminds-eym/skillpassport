/**
 * Start Assessment Handler
 *
 * Handles POST /api/assessment/start
 * Starts a new assessment attempt and loads sections/questions
 */

import { getServiceClient } from '../../../lib/supabase';
import type {AuthenticatedPagesContext} from '../../../lib/types';
import {readAttemptStart,createOwnedAttempt,startJson} from '../../../lib/assessment-start';
import type { StartAssessmentResult } from '../types';
import { validateLearnerData, validateAttemptData } from '../utils/validation';
import { dbAttemptToAssessmentAttempt } from '../utils/converters';
import { loadSectionsWithQuestions } from '../utils/question-loader';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('StartHandler');

/**
 * Infer UG/PG/diploma from any available text signal: program name, code, course name,
 * branch, or grade. College learners often have grade=null and no linked program row, so
 * the program/course NAME ("Bachelor of Computer Applications") is the most reliable source.
 */
function deriveDegreeLevel(...signals: Array<string | null | undefined>): string | null {
  const text = signals.filter(Boolean).join(' ').toLowerCase();
  if (!text) return null;
  if (/(\bpg\b|postgraduate|post[-\s]?graduate|\bmaster|m\.?tech|mtech|mca|mba|m\.?sc|msc|m\.?com|mcom|\bma\b|\bm\.?a\b)/.test(text)) return 'postgraduate';
  if (/(\bug\b|undergraduate|under[-\s]?graduate|\bbachelor|b\.?tech|btech|bca|b\.?sc|bsc|b\.?com|bcom|bba|\bba\b|\bb\.?a\b)/.test(text)) return 'undergraduate';
  if (text.includes('diploma')) return 'diploma';
  return null;
}

function buildLearnerContext(
  learner: any,
  streamId: string | null
): Record<string, unknown> | null {
  const programs = learner?.programs;
  const programName =
    programs?.name || programs?.code || learner?.course_name || learner?.branch_field || null;
  const programCode = programs?.code || null;
  const degreeLevel =
    programs?.degree_level ||
    deriveDegreeLevel(
      programs?.name,
      programs?.code,
      learner?.course_name,
      learner?.branch_field,
      learner?.grade
    );

  if (!programName && !streamId && !learner?.grade) return null;

  return {
    rawGrade: learner?.grade || null,
    programName: programName || null,
    programCode,
    degreeLevel,
    selectedStream: streamId || null,
  };
}

export async function startHandler(context: AuthenticatedPagesContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const body=await readAttemptStart(context.request);
    if(body instanceof Response)return body;
    const {streamId}=body;
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select(`
        id,
        grade,
        course_name,
        branch_field,
        program_id,
        programs ( name, code, degree_level )
      `)
      .eq('user_id', user.sub)
      .maybeSingle();

    if (learnerError) {
      return startJson({error:'Learner lookup unavailable'},503);
    }

    const learnerValidation = validateLearnerData(learnerData);
    if (!learnerValidation.isValid) {
      return startJson({error:learnerValidation.message},404);
    }

    const response=await createOwnedAttempt(context,{...body,reference:learnerData!.id},buildLearnerContext(learnerData,streamId),true);
    if(!response.ok)return response;
    const {attempt,created}=await response.json() as {attempt:any;created:boolean};
    const gradeLevel=attempt.grade_level;
    const effectiveStreamId=attempt.stream_id;

    let sections;
    try {
      sections = await loadSectionsWithQuestions(supabase, gradeLevel, effectiveStreamId, env);
      logger.info('Sections loaded successfully', { 
        sectionCount: sections?.length || 0,
        sectionNames: sections?.map((s: any) => s.name) || []
      });
    } catch (loadError) {
      logger.error('Failed to load sections', { error: loadError, gradeLevel, streamId });
      return startJson(
        { error: 'Failed to load assessment sections', message: 'Assessment sections unavailable' },
        500
      );
    }

    if (!sections || sections.length === 0) {
      logger.warn('No sections available', { gradeLevel, streamId });
      return startJson({ error: 'No assessment sections available for this grade level' }, 404);
    }

    const attemptValidation = validateAttemptData(attempt);
    if (!attemptValidation.isValid) {
      return startJson({ error: attemptValidation.message }, 400);
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
      streamId
    });

    return startJson({...result,isResumed:!created},created?201:200);
  } catch (error) {
    logger.error('Failed to start assessment', { error });
    return startJson(
      {
        error: 'Failed to start assessment',
        message: 'Assessment start unavailable'
      },
      500
    );
  }
}
