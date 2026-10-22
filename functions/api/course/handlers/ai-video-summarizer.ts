/**
 * AI Video Summarizer Handler
 * 
 * Transcribes and summarizes videos with background processing:
 * - Transcription with Deepgram (primary) and Groq (fallback)
 * - AI-generated summary, key points, chapters, topics
 * - Notable quotes extraction
 * - Quiz questions and flashcards generation
 * - SRT/VTT subtitle generation
 * - Caching and status polling
 * 
 * Requirements: 7.7, 7.8
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import { getContextUser } from '../../../lib/auth';
import { OrchestratorVideoInputSchema } from '@rareminds-eym/ai-protocol';
import { apiSuccess, apiError } from '../../../lib/response';
import { transcribeVideo } from '../utils/transcription';
import { generateSRT, generateVTT } from '../utils/subtitle-generation';
import { getAiWorker } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import { buildVideoPrompts } from '../prompts/video-summary';
import type { OrchestratorRequest, OrchestratorVideoInput } from '@rareminds-eym/ai-protocol';
import { readOrchestratorResult } from '../../ai/lib/orchestrator-result';
import { claimVideoJob, freezeVideoInput, videoIdentityHash } from '../utils/video-job';
import { loadEnrolledCourse, resolveCourseLesson } from '../../internal/lesson-evidence';
import { loadAuthoringCourse } from '../../internal/authoring-course-evidence';

interface VideoSummarizerRequestBody {
  videoUrl?: string;
  lessonId?: string;
  courseId?: string;
  language?: string;
  enableQuiz?: boolean;
  enableFlashcards?: boolean;
}

/**
 * POST /api/course/ai-video-summarizer
 * 
 * Submit a video for transcription and summarization
 * 
 * Request body:
 * - videoUrl: string (required) - URL of the video to process
 * - lessonId: string (optional) - Associated lesson ID
 * - courseId: string (optional) - Associated course ID
 * - language: string (optional, default: 'en') - Language code
 * - enableQuiz: boolean (optional, default: true) - Generate quiz questions
 * - enableFlashcards: boolean (optional, default: true) - Generate flashcards
 * 
 * Response (202 Accepted):
 * - id: string - Processing record ID
 * - video_url: string
 * - processing_status: 'processing'
 * - message: string
 * 
 * Response (200 OK - Cached):
 * - Full video summary data
 */
export const onRequestPost = async (context: AuthenticatedContext) => {
  const { request, env, waitUntil } = context as unknown as { request: Request; env: Record<string, unknown>; waitUntil: (p: Promise<unknown>) => void };
  try {

    const authenticatedUser = getContextUser(context as unknown as Parameters<typeof getContextUser>[0]);
    if (!authenticatedUser.id) return apiError(401, 'UNAUTHORIZED', 'Authentication required', request);
    if (env.VIDEO_JOBS_ENABLED !== 'true') return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Video generation is reserved for a future release.', request);

    // Parse request body
    let body: VideoSummarizerRequestBody;
    try {
      body = await request.json() as VideoSummarizerRequestBody;
    } catch (error) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', request);
    }

    const { 
      videoUrl, 
      lessonId, 
      courseId, 
      language = 'en',
      enableQuiz = true,
      enableFlashcards = true 
    } = body;

    // Validate required fields
    if (typeof videoUrl !== 'string' || !videoUrl.trim() || videoUrl.length > 4096) {
      return apiError(400, 'VALIDATION_ERROR', 'Video URL is required', request);
    }

    // Create Supabase admin client for database operations
    const supabase = createSupabaseAdminClient(env);

    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if ((courseId !== undefined && (typeof courseId !== 'string' || !uuid.test(courseId))) ||
        (lessonId !== undefined && (typeof lessonId !== 'string' || !uuid.test(lessonId) || !courseId)) ||
        typeof language !== 'string' || language.length > 32 || typeof enableQuiz !== 'boolean' || typeof enableFlashcards !== 'boolean') {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid video processing options', request);
    }
    if (courseId) {
      const course = await loadEnrolledCourse(supabase, authenticatedUser.id, courseId) ?? await loadAuthoringCourse(supabase, authenticatedUser.id, courseId);
      if (!course || (lessonId && !await resolveCourseLesson(supabase, courseId, lessonId))) return apiError(403, 'FORBIDDEN', 'Course access is required', request);
    }
    const requestHash = await videoIdentityHash({ videoUrl, courseId: courseId ?? null, lessonId: lessonId ?? null, language, enableQuiz, enableFlashcards });
    const claim = await claimVideoJob(supabase, authenticatedUser.id, requestHash, {
      video_url: videoUrl, course_id: courseId ?? null, lesson_id: lessonId ?? null, language,
    });
    if (!claim.created) {
      if (claim.summary.processing_status !== 'completed') {
        const saved = await supabase.from('ai_video_jobs').select('source_input').eq('id', claim.id).eq('actor_id', authenticatedUser.id).maybeSingle();
        if (saved.error) return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Video recovery is temporarily unavailable', request);
        const frozen = OrchestratorVideoInputSchema.safeParse(saved.data?.source_input);
        if (frozen.success && frozen.data.jobId === claim.id) {
          // A recovery-only call cannot create a root or invoke another model.
          const recovered = await callVideoWorker(env as Record<string, string>, authenticatedUser.id, claim.id, frozen.data, true);
          if (recovered.ok) {
            const output = recovered.data;
            const applied = await supabase.from('video_summaries').update({ summary: output.summary, key_points: output.keyPoints,
              chapters: output.chapters, topics: output.topics, notable_quotes: output.quotes,
              quiz_questions: output.quiz, flashcards: output.flashcards, processing_status: 'completed',
              error_message: null, processed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            }).eq('id', claim.id).select('*').single();
            if (applied.error || !applied.data) return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Video result application requires reconciliation', request);
            return apiSuccess(applied.data, request);
          }
        }
      }
      if (claim.summary.processing_status === 'failed') return apiError(409, 'DEPENDENCY_UNAVAILABLE', 'The previous video execution requires reconciliation before retrying.', request);
      return apiSuccess(claim.summary, request, claim.summary.processing_status === 'completed' ? 200 : 202);
    }
    const recordId = claim.id;

    // Start background processing
    waitUntil((async () => {
      try {
        console.log(`Starting video processing for record ${recordId}`);

        // Step 1: Transcribe video
        const { 
          transcript, 
          segments, 
          duration, 
          sentimentData,
          speakers,
          deepgramSummary 
        } = await transcribeVideo(env as unknown as Record<string, any>, videoUrl, language);

        console.log(`Transcription complete: ${segments.length} segments, ${duration}s duration`);
        // Preserve non-model outputs before inference so a confirmed worker
        // result can be reapplied without repeating transcription or generation.
        const staged = await supabase.from('video_summaries').update({ transcript, transcript_segments: segments,
          duration_seconds: duration, sentiment_data: sentimentData, speakers, deepgram_summary: deepgramSummary,
          srt_content: generateSRT(segments), vtt_content: generateVTT(segments), updated_at: new Date().toISOString(),
        }).eq('id', recordId);
        if (staged.error) throw new Error('DEPENDENCY_UNAVAILABLE: Video source staging could not be confirmed');

        // Step 2+3: Single RPC for all AI generation (summary + quotes + quiz + flashcards)
        // Replaces 4 direct OpenRouter calls (video-processing.ts). Transcription stays in Pages.
        // Worker mirrors the same orchestration: summary first, then quotes/quiz/flashcards in parallel,
        // each degrading to [] on failure — never throws. enableQuiz/enableFlashcards are passed
        // through so worker can skip those calls (source parity: .catch → []).
        const source = {
          transcript: transcript.slice(0, 20000),
          segments: segments.slice(0, 128).map(segment => ({ start: segment.start, text: segment.text.slice(0, 4000) })),
          enableQuiz, enableFlashcards,
        };
        const frozen = await freezeVideoInput(supabase, authenticatedUser.id, OrchestratorVideoInputSchema.parse({
          ...source, jobId: recordId, prompts: buildVideoPrompts(source),
        }));
        const videoResult = await callVideoWorker(env as unknown as Record<string, string>, authenticatedUser.id, recordId, frozen);
        if (videoResult.ok === false) throw new Error(`${videoResult.code}: ${videoResult.message}`);
        const { summary, keyPoints, chapters, topics, quotes: notableQuotes, quiz: quizQuestions, flashcards } = videoResult.data;

        console.log(`AI summary complete: ${keyPoints.length} key points, ${chapters.length} chapters`);
        console.log(`Quiz and flashcards complete: ${quizQuestions.length} questions, ${flashcards.length} cards`);

        // Step 3: Generate subtitle formats
        const srtContent = generateSRT(segments);
        const vttContent = generateVTT(segments);

        // Step 4: Save all results to database
        const { error: updateError } = await supabase
          .from('video_summaries')
          .update({
            transcript,
            transcript_segments: segments,
            summary,
            key_points: keyPoints,
            chapters,
            topics,
            duration_seconds: duration,
            sentiment_data: sentimentData,
            speakers,
            deepgram_summary: deepgramSummary,
            notable_quotes: notableQuotes,
            quiz_questions: quizQuestions,
            flashcards,
            srt_content: srtContent,
            vtt_content: vttContent,
            processing_status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', recordId);

        if (updateError) {
          console.error('Failed to save results:', updateError);
          throw updateError;
        }

        console.log(`Video processing complete for record ${recordId}`);

      } catch (processingError) {
        const errorMessage = 'Video execution did not complete. Reconciliation is required before retrying.';
        console.error(`Video processing failed for record ${recordId}`);
        
        // Update record with error status
        await supabase
          .from('video_summaries')
          .update({
            processing_status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', recordId)
          .eq('processing_status', 'processing');
      }
    })());

    // Return immediately with 202 Accepted
    return apiSuccess(
      {
        id: recordId,
        video_url: videoUrl,
        processing_status: 'processing',
        message: 'Video processing started. Poll for status updates.'
      },
      request,
      202
    );

  } catch (error) {
    if (error instanceof Error && error.message.startsWith('DEPENDENCY_UNAVAILABLE:')) {
      return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Video processing is temporarily unavailable.', request);
    }
    console.error('AI video summarizer request failed');
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }
};


export async function callVideoWorker(
  env: Record<string, string>,
  userId: string,
  jobId: string,
  input: Pick<OrchestratorVideoInput, 'transcript' | 'segments' | 'enableQuiz' | 'enableFlashcards'> & Partial<Pick<OrchestratorVideoInput, 'prompts' | 'jobId'>>,
  replayOnly = false,
): Promise<
  | { ok: true; data: { summary: string; keyPoints: string[]; chapters: unknown[]; topics: string[]; quotes: unknown[]; quiz: unknown[]; flashcards: unknown[] } }
  | { ok: false; code: string; message: string }
> {
  if (!userId || userId === 'unknown' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) throw new Error('INVALID_INPUT: video job identity is required');
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  if (input.jobId !== undefined && input.jobId !== jobId) throw new Error('INVALID_INPUT: frozen video job identity changed');
  const canonical = OrchestratorVideoInputSchema.parse({ ...input, jobId, prompts: input.prompts ?? buildVideoPrompts(input) });
  const prompts = canonical.prompts;
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'orchestration.assist',
    promptPayload: { prompts },
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: OrchestratorRequest = {
    ...(replayOnly ? { replayOnly: true } : {}),
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: jobId,
    executionAssertion: assertion,
    actor: { actorId: userId, product: 'skillpassport', goals: [], responsibilities: [], permissions: [], capabilities: ['career_ai'], resourceScope: [], relevantContext: [] },
    input: { kind: 'task', task: { action: 'seniorEducator.summarize-video', input: canonical } },
  };
  try {
    const result = await readOrchestratorResult(await worker.orchestrator(request), 300000);
    if (result.kind !== 'video-summary') return { ok: false, code: 'DEPENDENCY_UNAVAILABLE', message: 'Video worker returned an unexpected result' };
    return { ok: true, data: result.data };
  } catch (error) {
    const raw = error instanceof Error ? error.message : '';
    return { ok: false, code: /^([A-Z_]+):/.exec(raw)?.[1] ?? 'DEPENDENCY_UNAVAILABLE', message: 'Video execution did not produce a confirmed result' };
  }
}
