import { useAuthStore } from '@/shared/model/authStore';
import { ssoClient } from '@/shared/api/ssoClient';
import { apiPost } from '@/shared/api/apiClient';
import { getApiUrl } from '@/shared/api/apiUtils';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('video-summarizer');

// ==================== API URL CONFIGURATION ====================
const API_URL = getApiUrl('course');

// ==================== INTERFACES ====================

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: number;
  sentiment?: string;
  sentimentScore?: number;
}

export interface VideoChapter {
  timestamp: number;
  title: string;
  summary: string;
}

export interface SentimentData {
  overall: string;
  overallScore: number;
  segments: Array<{
    text: string;
    sentiment: string;
    score: number;
    startWord: number;
    endWord: number;
  }>;
}

export interface Speaker {
  id: number;
  utterances: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface NotableQuote {
  text: string;
  timestamp: number;
  speaker?: number;
  context?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  timestamp?: number;
}

export interface Flashcard {
  front: string;
  back: string;
  topic?: string;
}


export interface VideoSummary {
  id: string;
  lessonId?: string;
  courseId?: string;
  videoUrl: string;
  videoType?: 'youtube' | 'uploaded' | 'vimeo';
  transcript: string;
  transcriptSegments: TranscriptSegment[];
  summary: string;
  keyPoints: string[];
  chapters: VideoChapter[];
  topics: string[];
  durationSeconds: number;
  language: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  // New enhanced fields
  sentimentData?: SentimentData;
  speakers?: Speaker[];
  deepgramSummary?: string;
  notableQuotes?: NotableQuote[];
  quizQuestions?: QuizQuestion[];
  flashcards?: Flashcard[];
  srtContent?: string;
  vttContent?: string;
  createdAt: string;
  processedAt?: string;
}

interface ProcessVideoRequest {
  videoUrl: string;
  lessonId?: string;
  courseId?: string;
  language?: string;
  enableQuiz?: boolean;
  enableFlashcards?: boolean;
}

// Transform database record to frontend format
function transformVideoSummary(record: any): VideoSummary {
  return {
    id: record.id,
    lessonId: record.lesson_id,
    courseId: record.course_id,
    videoUrl: record.video_url,
    videoType: record.video_type,
    transcript: record.transcript || '',
    transcriptSegments: record.transcript_segments || [],
    summary: record.summary || '',
    keyPoints: record.key_points || [],
    chapters: record.chapters || [],
    topics: record.topics || [],
    durationSeconds: record.duration_seconds || 0,
    language: record.language || 'en',
    processingStatus: record.processing_status,
    errorMessage: record.error_message,
    // New enhanced fields
    sentimentData: record.sentiment_data,
    speakers: record.speakers || [],
    deepgramSummary: record.deepgram_summary,
    notableQuotes: record.notable_quotes || [],
    quizQuestions: record.quiz_questions || [],
    flashcards: record.flashcards || [],
    srtContent: record.srt_content,
    vttContent: record.vtt_content,
    createdAt: record.created_at,
    processedAt: record.processed_at,
  };
}


// ==================== MAIN FUNCTIONS ====================

/**
 * Process a video and generate AI summary with enhancements
 */
export async function processVideo(
  request: ProcessVideoRequest,
  onProgress?: (step: string, progress: number) => void
): Promise<VideoSummary> {
  const POLL_INTERVAL_MS = 3000;
  const MAX_POLL_TIME_MS = 300000;

  logger.info('Starting enhanced video processing', { videoUrl: request.videoUrl });
  onProgress?.('Connecting to AI service...', 5);

  const user = useAuthStore.getState().user;

  try {
    onProgress?.('Starting video analysis...', 10);

    const response = await ssoClient.fetch(
      `${API_URL}/ai-video-summarizer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
                  },
        body: JSON.stringify({
          ...request,
          enableQuiz: request.enableQuiz ?? true,
          enableFlashcards: request.enableFlashcards ?? true,
        }),
      }
    );

    if (!response.ok && response.status !== 202) {
      let errorMessage = 'Failed to start video processing';
      let errorDetails = '';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || error.error_message || errorMessage;
        errorDetails = error.error_message || error.details || '';
      } catch {
        errorDetails = `HTTP ${response.status} - ${response.statusText || 'Unknown error'}`;
      }
      throw new Error(errorDetails ? `${errorMessage}\n\nDetails: ${errorDetails}` : errorMessage);
    }

    const data = await response.json();

    if (data.processing_status === 'completed') {
      onProgress?.('Complete!', 100);
      return transformVideoSummary(data);
    }

    const jobId = data.id;
    onProgress?.('Processing started...', 15);

    const startTime = Date.now();
    let pollCount = 0;

    while (Date.now() - startTime < MAX_POLL_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      pollCount++;

      const elapsed = Date.now() - startTime;
      const estimatedProgress = Math.min(15 + (elapsed / MAX_POLL_TIME_MS) * 80, 90);

      const steps = [
        'Downloading media...',
        'Transcribing with AI...',
        'Analyzing sentiment...',
        'Identifying speakers...',
        'Generating summary...',
        'Creating quiz questions...',
        'Building flashcards...',
        'Generating subtitles...',
      ];
      const stepIndex = Math.floor(pollCount / 2) % steps.length;
      onProgress?.(steps[stepIndex], estimatedProgress);

      const { status, summary } = await checkProcessingStatus(jobId);

      if (status === 'completed' && summary) {
        onProgress?.('Complete!', 100);
        return summary;
      }

      if (status === 'failed') {
        const failedRes = await apiPost('/ai-tutor/actions', { action: 'get-failed-record', id: jobId });
        const dbError = failedRes?.data?.error_message || 'Video processing failed (no details available)';
        throw new Error(`Processing failed\n\nDatabase error_message: ${dbError}`);
      }

      if (status === 'not_found') {
        throw new Error('Processing job not found');
      }
    }

    throw new Error('Processing is taking longer than expected. Please try again later.');

  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Connection issue. Please check your internet and try again.');
    }
    throw error;
  }
}

export async function getVideoSummaryByLesson(lessonId: string): Promise<VideoSummary | null> {
  try {
    const response = await apiPost('/ai-tutor/actions', { action: 'get-video-summary-by-lesson', lesson_id: lessonId });
    return response?.data ? transformVideoSummary(response.data) : null;
  } catch (err) {
    logger.warn('Exception querying video_summaries by lesson_id', { err, lessonId });
    return null;
  }
}

/**
 * Get video summary with robust error handling and fallback strategies
 */
export async function getVideoSummaryRobust(lessonId?: string, videoUrl?: string): Promise<VideoSummary | null> {
  try {
    const response = await apiPost('/ai-tutor/actions', { action: 'get-video-summary-robust', lesson_id: lessonId, video_url: videoUrl });
    const data = response?.data;
    if (!data) return null;
    if (data.processing_status === 'completed' || data.processing_status === 'failed' || data.processing_status === 'processing') {
      return transformVideoSummary(data);
    }
    return null;
  } catch (err) {
    logger.warn('getVideoSummaryRobust failed', { err, lessonId });
    return null;
  }
}

export async function getVideoSummaryByUrl(videoUrl: string): Promise<VideoSummary | null> {
  try {
    const response = await apiPost('/ai-tutor/actions', { action: 'get-video-summary-by-url', video_url: videoUrl });
    return response?.data ? transformVideoSummary(response.data) : null;
  } catch (err) {
    logger.warn('Exception querying video_summaries by video_url', { err, videoUrl });
    return null;
  }
}

export async function getVideoSummary(id: string): Promise<VideoSummary | null> {
  try {
    const response = await apiPost('/ai-tutor/actions', { action: 'get-video-summary', id });
    return response?.data ? transformVideoSummary(response.data) : null;
  } catch (err) {
    logger.warn('Exception querying video_summaries by id', { err, id });
    return null;
  }
}

export async function deleteVideoSummary(id: string): Promise<void> {
  try {
    await apiPost('/ai-tutor/actions', { action: 'delete-video-summary', id });
  } catch (err) {
    logger.warn('Exception deleting video summary', { err, id });
  }
}

export async function checkProcessingStatus(id: string): Promise<{
  status: string;
  summary?: VideoSummary;
}> {
  try {
    const response = await apiPost('/ai-tutor/actions', { action: 'check-processing-status', id });
    const result = response?.data;
    if (!result) return { status: 'not_found' };
    return {
      status: result.status,
      summary: result.status === 'completed' && result.summary ? transformVideoSummary(result.summary) : undefined,
    };
  } catch (err) {
    logger.warn('Exception checking processing status', { err, id });
    return { status: 'not_found' };
  }
}


// ==================== UTILITY FUNCTIONS ====================

/**
 * Extract the file key from a presigned URL or regular R2 URL
 * This helps match video summaries regardless of URL format (presigned vs direct)
 */
function extractFileKey(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Handle R2 URLs: https://account.r2.cloudflarestorage.com/bucket/path/file.ext
    if (urlObj.hostname.includes('r2.cloudflarestorage.com')) {
      const pathParts = urlObj.pathname.split('/');
      // Remove empty first element and bucket name
      return pathParts.slice(2).join('/');
    }
    
    // Handle public R2 URLs: https://pub-account.r2.dev/path/file.ext
    if (urlObj.hostname.includes('r2.dev')) {
      return urlObj.pathname.substring(1); // Remove leading slash
    }
    
    // For other URLs, return the full URL as fallback
    return url;
  } catch {
    return url;
  }
}

/**
 * Check if two URLs refer to the same file by comparing their file keys
 */
function isSameFile(url1: string, url2: string): boolean {
  const key1 = extractFileKey(url1);
  const key2 = extractFileKey(url2);
  return key1 === key2;
}

export function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function findSegmentAtTime(segments: TranscriptSegment[], time: number): TranscriptSegment | null {
  return segments.find(s => time >= s.start && time <= s.end) || null;
}

export function getTranscriptContext(segments: TranscriptSegment[], time: number, windowSeconds: number = 30): string {
  const relevantSegments = segments.filter(
    s => s.start >= time - windowSeconds && s.end <= time + windowSeconds
  );
  return relevantSegments.map(s => s.text).join(' ');
}

/**
 * Get sentiment color based on sentiment type
 */
export function getSentimentColor(sentiment: string): string {
  switch (sentiment?.toLowerCase()) {
    case 'positive': return '#22c55e';
    case 'negative': return '#ef4444';
    default: return '#6b7280';
  }
}

/**
 * Get sentiment emoji
 */
export function getSentimentEmoji(sentiment: string): string {
  switch (sentiment?.toLowerCase()) {
    case 'positive': return '😊';
    case 'negative': return '😔';
    default: return '😐';
  }
}

/**
 * Download SRT subtitles
 */
export function downloadSRT(srtContent: string, filename: string = 'subtitles.srt'): void {
  const blob = new Blob([srtContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download VTT subtitles
 */
export function downloadVTT(vttContent: string, filename: string = 'subtitles.vtt'): void {
  const blob = new Blob([vttContent], { type: 'text/vtt' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get speaker label
 */
export function getSpeakerLabel(speakerId: number): string {
  return `Speaker ${speakerId + 1}`;
}

/**
 * Format quiz question for display
 */
export function formatQuizOption(index: number): string {
  return String.fromCharCode(65 + index); // A, B, C, D...
}
