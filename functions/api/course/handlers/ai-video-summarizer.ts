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

import type { PagesFunction, PagesEnv } from '../../../../src/functions-lib/types';
import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { transcribeVideo } from '../utils/transcription';
import { 
  generateVideoSummary, 
  extractNotableQuotes, 
  generateQuizQuestions, 
  generateFlashcards 
} from '../utils/video-processing';
import { generateSRT, generateVTT } from '../utils/subtitle-generation';

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
export const onRequestPost: PagesFunction<PagesEnv> = async (context) => {
  try {
    const { request, env, waitUntil } = context;

    // Parse request body
    let body: VideoSummarizerRequestBody;
    try {
      body = await request.json() as VideoSummarizerRequestBody;
    } catch (error) {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
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
      return jsonResponse({ error: 'Video URL is required' }, 400);
    }

    // Create Supabase admin client (no auth required for this endpoint)
    const supabase = createSupabaseAdminClient(env);

    // Check cache for existing completed summary
    const { data: existing } = await supabase
      .from('video_summaries')
      .select('*')
      .eq('video_url', videoUrl)
      .eq('processing_status', 'completed')
      .maybeSingle();

    if (existing) {
      return jsonResponse(existing, 200);
    }

    // Check if already processing
    const { data: inProgress } = await supabase
      .from('video_summaries')
      .select('*')
      .eq('video_url', videoUrl)
      .eq('processing_status', 'processing')
      .maybeSingle();

    if (inProgress) {
      return jsonResponse(
        { 
          ...inProgress, 
          message: 'Video is being processed. Poll for status updates.' 
        }, 
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
      return jsonResponse(
        { error: `Failed to create record: ${insertError.message}` }, 
        500
      );
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

        // Step 2: Run AI generation tasks in parallel
        const [summaryResult, notableQuotes, quizQuestions, flashcards] = await Promise.all([
          generateVideoSummary(env as unknown as Record<string, any>, transcript, segments),
          extractNotableQuotes(env as unknown as Record<string, any>, segments),
          enableQuiz 
            ? generateQuizQuestions(env as unknown as Record<string, any>, transcript, '', []).catch(() => [])
            : Promise.resolve([]),
          enableFlashcards 
            ? generateFlashcards(env as unknown as Record<string, any>, transcript, [], []).catch(() => [])
            : Promise.resolve([])
        ]);
        
        const { summary, keyPoints, chapters, topics } = summaryResult;

        console.log(`AI generation complete: ${keyPoints.length} key points, ${chapters.length} chapters`);

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
    return jsonResponse(
      {
        id: recordId,
        video_url: videoUrl,
        processing_status: 'processing',
        message: 'Video processing started. Poll for status updates.'
      },
      202
    );

  } catch (error) {
    console.error('AI video summarizer error:', error);
    return jsonResponse(
      { error: 'Internal server error' },
      500
    );
  }
};
