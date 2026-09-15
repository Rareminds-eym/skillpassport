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
import { apiSuccess, apiError } from '../../../lib/response';
import { transcribeVideo } from '../utils/transcription';
import { generateSRT, generateVTT } from '../utils/subtitle-generation';
import { getAiWorker } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import type { EducatorRequest } from '@rareminds-eym/ai-protocol';

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
    if (!videoUrl) {
      return apiError(400, 'VALIDATION_ERROR', 'Video URL is required', request);
    }

    // Create Supabase admin client for database operations
    const supabase = createSupabaseAdminClient(env);

    // Check cache for existing completed summary
    const { data: existing } = await supabase
      .from('video_summaries')
      .select('*')
      .eq('video_url', videoUrl)
      .eq('processing_status', 'completed')
      .maybeSingle();

    if (existing) {
      return apiSuccess(existing, request);
    }

    // Check if already processing
    const { data: inProgress } = await supabase
      .from('video_summaries')
      .select('*')
      .eq('video_url', videoUrl)
      .eq('processing_status', 'processing')
      .maybeSingle();

    if (inProgress) {
      return apiSuccess(
        { 
          ...inProgress, 
          message: 'Video is being processed. Poll for status updates.' 
        }, 
        request,
        202
      );
    }

    // Create processing record
    const { data: record, error: insertError } = await supabase
      .from('video_summaries')
      .insert({
        video_url: videoUrl,
        lesson_id: lessonId || null,
        course_id: courseId || null,
        language,
        processing_status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create processing record:', insertError);
      return apiError(500, 'INTERNAL_ERROR', `Failed to create record: ${insertError.message}`, request);
    }

    const recordId = record.id;

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

        // Step 2+3: Single RPC for all AI generation (summary + quotes + quiz + flashcards)
        // Replaces 4 direct OpenRouter calls (video-processing.ts). Transcription stays in Pages.
        // Worker mirrors the same orchestration: summary first, then quotes/quiz/flashcards in parallel,
        // each degrading to [] on failure — never throws. enableQuiz/enableFlashcards are passed
        // through so worker can skip those calls (source parity: .catch → []).
        const userId = ((context as unknown) as { data?: { user?: { sub?: string } } }).data?.user?.sub ?? 'unknown';
        const videoResult = await callVideoWorker(
          env as unknown as Record<string, string>,
          userId,
          {
            transcript: transcript.slice(0, 20000),
            segments: segments.slice(0, 128),
            enableQuiz,
            enableFlashcards,
          }
        );
        if (!videoResult.ok) throw new Error(`${videoResult.code}: ${videoResult.message}`);
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
        const errorMessage = (processingError as Error).message;
        console.error(`Video processing failed for record ${recordId}:`, errorMessage);
        
        // Update record with error status
        await supabase
          .from('video_summaries')
          .update({
            processing_status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', recordId);
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
    console.error('AI video summarizer error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }
};

type VideoRpcRequest = Extract<EducatorRequest, { feature: 'summarize-video' }>;

async function callVideoWorker(
  env: Record<string, string>,
  userId: string,
  input: { transcript: string; segments: unknown[]; enableQuiz: boolean; enableFlashcards: boolean },
): Promise<
  | { ok: true; data: { summary: string; keyPoints: string[]; chapters: unknown[]; topics: string[]; quotes: unknown[]; quiz: unknown[]; flashcards: unknown[] } }
  | { ok: false; code: string; message: string }
> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'seniorEducator.summarize-video',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: VideoRpcRequest = {
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: crypto.randomUUID(),
    executionAssertion: assertion,
    actor: { actorId: userId, product: 'skillpassport', goals: [], responsibilities: [], permissions: [], capabilities: ['career_ai'], resourceScope: [], relevantContext: [] },
    feature: 'summarize-video',
    input: {
      transcript: input.transcript,
      segments: input.segments as never,
      enableQuiz: input.enableQuiz,
      enableFlashcards: input.enableFlashcards,
    },
  };
  const result = await worker.seniorEducator(request);
  if (result && typeof result === 'object' && 'duplicate' in (result as Record<string, unknown>)) {
    return { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'duplicate execution' };
  }
  if (result instanceof Response) throw new Error('INTERNAL_ERROR: unexpected stream for summarize-video');
  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true, data: result.data as never };
}
