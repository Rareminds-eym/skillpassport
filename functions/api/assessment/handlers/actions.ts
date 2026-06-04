import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';
import { notifyRealtime } from '../../../lib/realtime';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      case 'get-adaptive-session-status': {
        const { sessionId } = params;
        if (!sessionId) return apiError(400, 'VALIDATION_ERROR', 'Missing sessionId', context.request, { startTime });
        const { data, error } = await supabase
          .from('adaptive_aptitude_sessions')
          .select('status, questions_answered')
          .eq('id', sessionId)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-attempt-data': {
        const { attemptId } = params;
        if (!attemptId) return apiError(400, 'VALIDATION_ERROR', 'Missing attemptId', context.request, { startTime });
        const { data, error } = await supabase
          .from('personal_assessment_attempts')
          .select('all_responses, section_timings')
          .eq('id', attemptId)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      // ── CRUD: Sections ──

      case 'fetch-sections': {
        const { gradeLevel } = params;
        let query = supabase
          .from('personal_assessment_sections')
          .select('*')
          .eq('is_active', true);
        if (gradeLevel) {
          const dbGradeLevel = gradeLevel === 'higher_secondary' ? 'highschool' : gradeLevel;
          query = query.eq('grade_level', dbGradeLevel);
        }
        const { data, error } = await query.order('order_number');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── CRUD: Streams ──

      case 'fetch-streams': {
        const { data, error } = await supabase
          .from('personal_assessment_streams')
          .select('*')
          .eq('is_active', true);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── CRUD: Questions by section ──

      case 'fetch-questions-by-section': {
        const { sectionId, streamId } = params;
        if (!sectionId) return apiError(400, 'VALIDATION_ERROR', 'Missing sectionId', context.request, { startTime });
        let query = supabase
          .from('personal_assessment_questions')
          .select('*')
          .eq('section_id', sectionId)
          .eq('is_active', true)
          .order('order_number');
        if (streamId) {
          query = query.eq('stream_id', streamId);
        } else {
          query = query.is('stream_id', null);
        }
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── CRUD: Attempt ──

      case 'create-attempt': {
        const { learnerId, streamId, gradeLevel } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        if (!streamId) return apiError(400, 'VALIDATION_ERROR', 'Missing streamId', context.request, { startTime });
        if (!gradeLevel) return apiError(400, 'VALIDATION_ERROR', 'Missing gradeLevel', context.request, { startTime });
        const { data, error } = await supabase
          .from('personal_assessment_attempts')
          .insert({
            learner_id: learnerId,
            stream_id: streamId,
            grade_level: gradeLevel,
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── CRUD: Update attempt progress (with merge of section_timings and all_responses) ──

      case 'update-attempt-progress': {
        const { attemptId, progress } = params;
        if (!attemptId) return apiError(400, 'VALIDATION_ERROR', 'Missing attemptId', context.request, { startTime });
        if (!progress) return apiError(400, 'VALIDATION_ERROR', 'Missing progress', context.request, { startTime });

        const { data: existingAttempt, error: fetchError } = await supabase
          .from('personal_assessment_attempts')
          .select('section_timings, all_responses')
          .eq('id', attemptId)
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        const mergedSectionTimings = {
          ...(existingAttempt?.section_timings || {}),
          ...(progress.sectionTimings || {}),
        };

        const updateData: Record<string, any> = {
          current_section_index: progress.sectionIndex,
          current_question_index: progress.questionIndex,
          section_timings: mergedSectionTimings,
          updated_at: new Date().toISOString(),
        };

        if (progress.timerRemaining !== undefined && progress.timerRemaining !== null) {
          updateData.timer_remaining = progress.timerRemaining;
        }
        if (progress.elapsedTime !== undefined && progress.elapsedTime !== null) {
          updateData.elapsed_time = progress.elapsedTime;
        }
        if (progress.aptitudeQuestionTimer !== undefined && progress.aptitudeQuestionTimer !== null) {
          updateData.aptitude_question_timer = progress.aptitudeQuestionTimer;
        }
        if (progress.adaptiveAptitudeSessionId) {
          updateData.adaptive_aptitude_session_id = progress.adaptiveAptitudeSessionId;
        }
        if (progress.allResponses) {
          updateData.all_responses = {
            ...(existingAttempt?.all_responses || {}),
            ...progress.allResponses,
          };
        }

        const { data: updatedData, error: updateError } = await supabase
          .from('personal_assessment_attempts')
          .update(updateData)
          .eq('id', attemptId)
          .select()
          .single();
        if (updateError) return apiDbError(updateError, context.request, { startTime });
        return apiSuccess(updatedData, context.request, { startTime });
      }

      // ── CRUD: Save all responses ──

      case 'save-all-responses': {
        const { attemptId, allResponses } = params;
        if (!attemptId) return apiError(400, 'VALIDATION_ERROR', 'Missing attemptId', context.request, { startTime });
        if (!allResponses) return apiError(400, 'VALIDATION_ERROR', 'Missing allResponses', context.request, { startTime });
        const { data, error } = await supabase
          .from('personal_assessment_attempts')
          .update({
            all_responses: allResponses,
            updated_at: new Date().toISOString(),
          })
          .eq('id', attemptId)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── CRUD: Save response ──

      case 'save-response': {
        const { attemptId, questionId, responseValue, isCorrect } = params;
        if (!attemptId) return apiError(400, 'VALIDATION_ERROR', 'Missing attemptId', context.request, { startTime });
        if (!questionId) return apiError(400, 'VALIDATION_ERROR', 'Missing questionId', context.request, { startTime });
        const sanitizedValue = responseValue === null || responseValue === undefined ? '' : responseValue;
        const { data, error } = await supabase
          .from('personal_assessment_responses')
          .upsert({
            attempt_id: attemptId,
            question_id: questionId,
            response_value: sanitizedValue,
            is_correct: isCorrect ?? null,
            responded_at: new Date().toISOString(),
          }, { onConflict: 'attempt_id,question_id' })
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── CRUD: Get attempt responses ──

      case 'get-attempt-responses': {
        const { attemptId } = params;
        if (!attemptId) return apiError(400, 'VALIDATION_ERROR', 'Missing attemptId', context.request, { startTime });
        const { data, error } = await supabase
          .from('personal_assessment_responses')
          .select('*, question:personal_assessment_questions(*)')
          .eq('attempt_id', attemptId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── CRUD: Complete attempt (multi-step) ──

      case 'complete-attempt': {
        const { attemptId, learnerId, streamId, gradeLevel, geminiResults, sectionTimings } = params;
        if (!attemptId) return apiError(400, 'VALIDATION_ERROR', 'Missing attemptId', context.request, { startTime });
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        if (!geminiResults) return apiError(400, 'VALIDATION_ERROR', 'Missing geminiResults', context.request, { startTime });

        const isSimplified = gradeLevel === 'middle' || gradeLevel === 'highschool';

        const { data: attemptData, error: attemptFetchError } = await supabase
          .from('personal_assessment_attempts')
          .select('adaptive_aptitude_session_id')
          .eq('id', attemptId)
          .single();
        if (attemptFetchError) return apiDbError(attemptFetchError, context.request, { startTime });

        let validatedAdaptiveSessionId: string | null = null;
        if (attemptData?.adaptive_aptitude_session_id) {
          const { data: adaptiveResults } = await supabase
            .from('adaptive_aptitude_results')
            .select('session_id')
            .eq('session_id', attemptData.adaptive_aptitude_session_id)
            .maybeSingle();
          if (adaptiveResults) {
            validatedAdaptiveSessionId = attemptData.adaptive_aptitude_session_id;
          }
        }

        const dataToInsert: Record<string, any> = {
          attempt_id: attemptId,
          learner_id: learnerId,
          grade_level: gradeLevel,
          stream_id: streamId,
          status: 'completed',
          adaptive_aptitude_session_id: validatedAdaptiveSessionId,
          riasec_scores: geminiResults.riasec?.scores || null,
          riasec_code: geminiResults.riasec?.code || null,
          aptitude_scores: geminiResults.aptitude?.scores || null,
          aptitude_overall: geminiResults.aptitude?.overallScore ?? null,
          bigfive_scores: geminiResults.bigFive || null,
          work_values_scores: isSimplified ? null : (geminiResults.workValues?.scores || null),
          employability_scores: isSimplified ? null : (geminiResults.employability?.skillScores || null),
          employability_readiness: isSimplified ? null : (geminiResults.employability?.overallReadiness || null),
          knowledge_score: isSimplified ? null : (geminiResults.knowledge?.score ?? null),
          knowledge_details: isSimplified ? null : (geminiResults.knowledge || null),
          career_fit: geminiResults.careerFit || null,
          skill_gap: geminiResults.skillGap || null,
          skill_gap_courses: geminiResults.skillGapCourses || null,
          platform_courses: geminiResults.platformCourses || null,
          courses_by_type: geminiResults.coursesByType || null,
          roadmap: geminiResults.roadmap || null,
          profile_snapshot: geminiResults.profileSnapshot || null,
          timing_analysis: geminiResults.timingAnalysis || null,
          final_note: geminiResults.finalNote || null,
          overall_summary: geminiResults.overallSummary || null,
          gemini_results: geminiResults,
        };

        const { data: results, error: resultsError } = await supabase
          .from('personal_assessment_results')
          .upsert(dataToInsert, { onConflict: 'attempt_id', ignoreDuplicates: false })
          .select()
          .single();
        if (resultsError) return apiDbError(resultsError, context.request, { startTime });

        const { error: attemptError } = await supabase
          .from('personal_assessment_attempts')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            section_timings: sectionTimings || null,
          })
          .eq('id', attemptId);
        if (attemptError) {
          console.error(`[complete-attempt] Results saved but attempt update failed: ${attemptError.message}`);
        }

        const { data: learnerData } = await supabase
          .from('learners')
          .select('user_id')
          .eq('id', learnerId)
          .single();

        if (learnerData?.user_id) {
          const gradeLabels: Record<string, string> = {
            middle: 'Middle School',
            highschool: 'High School',
            after10: 'After 10th',
            after12: 'After 12th',
            college: 'College',
          };
          const gradeLabel = gradeLabels[gradeLevel] || gradeLevel;
          const { data: insertedNotification, error: notifError } = await supabase.from('notifications').insert({
            recipient_id: learnerData.user_id,
            type: 'assessment_completed',
            title: 'Career Assessment Completed',
            message: `Your ${gradeLabel} career assessment has been completed. View your personalized results and career recommendations.`,
            assessment_id: attemptId,
            read: false,
            created_at: new Date().toISOString(),
          }).select().single();
          
          if (!notifError && insertedNotification) {
            context.waitUntil(notifyRealtime(env as any, 'notifications', 'INSERT', insertedNotification));
          }
        }

        return apiSuccess(results, context.request, { startTime });
      }

      // ── CRUD: Get learner attempts ──

      case 'get-learner-attempts': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('personal_assessment_attempts')
          .select('*')
          .eq('learner_id', learnerId)
          .order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── CRUD: Get attempt with results ──

      case 'get-attempt-with-results': {
        const { attemptId } = params;
        if (!attemptId) return apiError(400, 'VALIDATION_ERROR', 'Missing attemptId', context.request, { startTime });
        const { data, error } = await supabase
          .from('personal_assessment_attempts')
          .select('*, results:personal_assessment_results(*)')
          .eq('id', attemptId)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── CRUD: Get latest result ──

      case 'get-latest-result': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });

        let { data, error } = await supabase
          .from('personal_assessment_results')
          .select('*')
          .eq('learner_id', learnerId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });

        if (!data) {
          const { data: learner } = await supabase
            .from('learners')
            .select('id')
            .eq('user_id', learnerId)
            .maybeSingle();
          if (learner) {
            const result = await supabase
              .from('personal_assessment_results')
              .select('*')
              .eq('learner_id', learner.id)
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            data = result.data;
            error = result.error;
            if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
          }
        }

        if (data?.adaptive_aptitude_session_id) {
          const { data: adaptiveResults } = await supabase
            .from('adaptive_aptitude_results')
            .select('*')
            .eq('session_id', data.adaptive_aptitude_session_id)
            .single()
            .catch(() => ({ data: null }));
          if (adaptiveResults && data.gemini_results) {
            (data.gemini_results as any).adaptiveAptitudeResults = adaptiveResults;
          }
        }

        return apiSuccess(data || null, context.request, { startTime });
      }

      // ── CRUD: Can take assessment ──

      case 'can-take-assessment': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('personal_assessment_results')
          .select('created_at')
          .eq('learner_id', learnerId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });

        if (!data) {
          return apiSuccess({ canTake: true, lastAttemptDate: null, nextAvailableDate: null }, context.request, { startTime });
        }

        const lastAttemptDate = new Date(data.created_at);
        const sixMonthsLater = new Date(lastAttemptDate);
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        const now = new Date();
        const canTake = now >= sixMonthsLater;

        return apiSuccess({
          canTake,
          lastAttemptDate: lastAttemptDate.toISOString(),
          nextAvailableDate: canTake ? null : sixMonthsLater.toISOString(),
        }, context.request, { startTime });
      }

      // ── CRUD: Get in-progress attempt ──

      case 'get-in-progress-attempt': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });

        let { data, error } = await supabase
          .from('personal_assessment_attempts')
          .select('*, responses:personal_assessment_responses(*)')
          .eq('learner_id', learnerId)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });

        if (!data) {
          const { data: learner } = await supabase
            .from('learners')
            .select('id')
            .eq('user_id', learnerId)
            .maybeSingle();
          if (learner) {
            const result = await supabase
              .from('personal_assessment_attempts')
              .select('*, responses:personal_assessment_responses(*)')
              .eq('learner_id', learner.id)
              .eq('status', 'in_progress')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            data = result.data;
            error = result.error;
            if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
          }
        }

        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'save-generated-assessment': {
        const { courseName, courseId, assessment } = params;
        if (!courseName || !courseId || !assessment) return apiError(400, 'VALIDATION_ERROR', 'Missing courseName, courseId, or assessment', context.request, { startTime });
        const { data, error } = await supabase.from('generated_external_assessment').insert({
          certificate_name: courseName, course_id: courseId, assessment_level: assessment.level,
          total_questions: assessment.questions?.length || 0, questions: assessment.questions, generated_by: 'AI',
        }).select().maybeSingle();
        if (error) {
          if (error.code === '23505') return apiSuccess({ alreadyExists: true, data: null }, context.request, { startTime });
          return apiDbError(error, context.request, { startTime });
        }
        return apiSuccess({ alreadyExists: false, data }, context.request, { startTime });
      }

      case 'load-generated-assessment': {
        const { courseName } = params;
        if (!courseName) return apiError(400, 'VALIDATION_ERROR', 'Missing courseName', context.request, { startTime });
        const result = await supabase.from('generated_external_assessment').select('*').eq('certificate_name', courseName).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (result.error && result.error.code !== 'PGRST116') return apiDbError(result.error, context.request, { startTime });
        return apiSuccess(result.data || null, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[assessment/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
