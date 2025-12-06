import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== INTERFACES ====================

interface VideoSummaryRequest {
  videoUrl: string;
  lessonId?: string;
  courseId?: string;
  language?: string;
  enableQuiz?: boolean;
  enableFlashcards?: boolean;
}

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: number;
  sentiment?: string;
  sentimentScore?: number;
}

interface Chapter {
  timestamp: number;
  title: string;
  summary: string;
}

interface SentimentData {
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

interface Speaker {
  id: number;
  utterances: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface NotableQuote {
  text: string;
  timestamp: number;
  speaker?: number;
  context?: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  timestamp?: number;
}

interface Flashcard {
  front: string;
  back: string;
  topic?: string;
}


// ==================== HELPER FUNCTIONS ====================

/**
 * Get the correct MIME type based on file extension
 */
function getContentType(url: string): string {
  const urlPath = url.split('?')[0];
  const ext = urlPath.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg',
    'flac': 'audio/flac', 'm4a': 'audio/mp4', 'aac': 'audio/aac',
    'wma': 'audio/x-ms-wma', 'webm': 'audio/webm',
    'mp4': 'video/mp4', 'mov': 'video/quicktime',
    'avi': 'video/x-msvideo', 'mkv': 'video/x-matroska',
  };
  
  return mimeTypes[ext] || 'audio/mpeg';
}

/**
 * Generate SRT subtitle format from transcript segments
 */
function generateSRT(segments: TranscriptSegment[]): string {
  return segments.map((seg, i) => {
    const startTime = formatSRTTime(seg.start);
    const endTime = formatSRTTime(seg.end);
    return `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
  }).join('\n');
}

/**
 * Generate WebVTT subtitle format from transcript segments
 */
function generateVTT(segments: TranscriptSegment[]): string {
  const header = 'WEBVTT\n\n';
  const cues = segments.map((seg, i) => {
    const startTime = formatVTTTime(seg.start);
    const endTime = formatVTTTime(seg.end);
    return `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
  }).join('\n');
  return header + cues;
}

function formatSRTTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function formatVTTTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}


// ==================== TRANSCRIPTION WITH ENHANCEMENTS ====================

/**
 * Enhanced Deepgram transcription with sentiment, diarization
 * Uses URL-based API first (faster), falls back to file upload for signed URLs
 */
async function transcribeWithDeepgram(videoUrl: string, language: string = 'en'): Promise<{
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  sentimentData: SentimentData | null;
  speakers: Speaker[];
  deepgramSummary: string | null;
}> {
  const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
  if (!deepgramKey) throw new Error('DEEPGRAM_API_KEY not configured');

  // Build query params for Deepgram
  const params = new URLSearchParams({
    model: 'nova-2',
    smart_format: 'true',
    language,
    punctuate: 'true',
    utterances: 'true',
    detect_language: 'true',
    sentiment: 'true',
    diarize: 'true'
  });

  let response: Response;
  let usedUrlApi = false;

  // TRY 1: URL-based API (fastest - Deepgram downloads the file directly)
  // This saves 30-60 seconds by eliminating our download step
  try {
    console.log('Trying URL-based transcription (fastest method)...');
    response = await fetch(
      `https://api.deepgram.com/v1/listen?${params}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${deepgramKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: videoUrl }),
      }
    );

    if (response.ok) {
      usedUrlApi = true;
      console.log('URL-based transcription successful!');
    } else {
      const errorText = await response.text();
      console.log(`URL-based API failed (${response.status}): ${errorText.slice(0, 100)}`);
      console.log('Falling back to file upload method...');
    }
  } catch (err) {
    console.log('URL-based API error:', (err as Error).message);
    console.log('Falling back to file upload method...');
  }

  // TRY 2: Download and upload (fallback for signed URLs that Deepgram can't access)
  if (!usedUrlApi) {
    console.log('Downloading media for upload to Deepgram...');
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) throw new Error(`Failed to download media: ${videoResponse.status}`);
    
    const videoBuffer = await videoResponse.arrayBuffer();
    const fileSizeMB = videoBuffer.byteLength / 1024 / 1024;
    console.log(`Downloaded ${fileSizeMB.toFixed(2)} MB, uploading to Deepgram...`);
    
    const contentType = getContentType(videoUrl);
    
    response = await fetch(
      `https://api.deepgram.com/v1/listen?${params}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${deepgramKey}`,
          'Content-Type': contentType,
        },
        body: videoBuffer,
      }
    );
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepgram API error (${response.status}): ${error}`);
  }

  const result = await response.json();
  console.log('Deepgram transcription complete with enhancements');

  const channel = result.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];
  const transcript = alternative?.transcript || '';
  
  if (!transcript) {
    throw new Error('No speech detected in media. This file may contain only music, background noise, or no audio. AI summarization requires spoken content to generate a transcript.');
  }
  
  // Build segments from words with speaker and sentiment info
  const words = alternative?.words || [];
  const segments: TranscriptSegment[] = [];
  
  if (words.length > 0) {
    let currentSegment: TranscriptSegment = { 
      start: words[0].start, 
      end: 0, 
      text: '',
      speaker: words[0].speaker
    };
    let wordCount = 0;
    
    for (const word of words) {
      currentSegment.text += (currentSegment.text ? ' ' : '') + word.word;
      currentSegment.end = word.end;
      wordCount++;
      
      // Create segment every ~15 words, at punctuation, or speaker change
      const speakerChanged = word.speaker !== currentSegment.speaker;
      if (wordCount >= 15 || word.word.match(/[.!?]$/) || speakerChanged) {
        segments.push({ ...currentSegment });
        currentSegment = { 
          start: word.end, 
          end: 0, 
          text: '',
          speaker: word.speaker
        };
        wordCount = 0;
      }
    }
    
    if (currentSegment.text) {
      segments.push(currentSegment);
    }
  }

  // Parse sentiment data
  let sentimentData: SentimentData | null = null;
  if (result.results?.sentiments) {
    const sentiments = result.results.sentiments;
    sentimentData = {
      overall: sentiments.average?.sentiment || 'neutral',
      overallScore: sentiments.average?.sentiment_score || 0,
      segments: (sentiments.segments || []).map((seg: any) => ({
        text: seg.text,
        sentiment: seg.sentiment,
        score: seg.sentiment_score,
        startWord: seg.start_word,
        endWord: seg.end_word,
      })),
    };
  }

  // Parse speaker data from utterances
  const speakers: Speaker[] = [];
  const utterances = result.results?.utterances || [];
  const speakerMap = new Map<number, Speaker>();
  
  for (const utt of utterances) {
    const speakerId = utt.speaker || 0;
    if (!speakerMap.has(speakerId)) {
      speakerMap.set(speakerId, { id: speakerId, utterances: [] });
    }
    speakerMap.get(speakerId)!.utterances.push({
      start: utt.start,
      end: utt.end,
      text: utt.transcript,
    });
  }
  speakers.push(...speakerMap.values());

  // Get Deepgram's native summary
  const deepgramSummary = result.results?.summary?.short || null;

  return {
    transcript,
    segments,
    duration: Math.ceil(result.metadata?.duration || 0),
    sentimentData,
    speakers,
    deepgramSummary,
  };
}


/**
 * Fallback: Groq Whisper API (no sentiment/diarization)
 */
async function transcribeWithGroqWhisper(videoUrl: string, language: string = 'en'): Promise<{
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
}> {
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  if (!groqApiKey) throw new Error('GROQ_API_KEY not configured');

  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) throw new Error(`Failed to download media: ${videoResponse.status}`);
  
  const videoBlob = await videoResponse.blob();
  const fileSizeMB = videoBlob.size / 1024 / 1024;
  
  if (fileSizeMB > 25) {
    throw new Error(`File too large for Groq (${fileSizeMB.toFixed(1)}MB > 25MB limit)`);
  }

  const formData = new FormData();
  formData.append('file', videoBlob, 'media.mp4');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', language);
  formData.append('response_format', 'verbose_json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqApiKey}` },
    body: formData,
  });

  if (!response.ok) throw new Error(`Groq API error: ${await response.text()}`);

  const result = await response.json();
  const segments: TranscriptSegment[] = (result.segments || []).map((seg: any) => ({
    start: seg.start || 0,
    end: seg.end || 0,
    text: seg.text?.trim() || ''
  }));

  return {
    transcript: result.text || '',
    segments,
    duration: Math.ceil(result.duration || 0),
  };
}

/**
 * Smart transcription with fallback
 */
async function transcribeVideo(videoUrl: string, language: string = 'en'): Promise<{
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  provider: string;
  sentimentData: SentimentData | null;
  speakers: Speaker[];
  deepgramSummary: string | null;
}> {
  const errors: string[] = [];

  // Try Deepgram first (has all enhancements)
  if (Deno.env.get('DEEPGRAM_API_KEY')) {
    try {
      console.log('Attempting enhanced transcription with Deepgram...');
      const result = await transcribeWithDeepgram(videoUrl, language);
      return { ...result, provider: 'deepgram' };
    } catch (err) {
      const errorMsg = (err as Error).message;
      errors.push(`Deepgram: ${errorMsg}`);
      console.error('Deepgram failed:', errorMsg);
      
      if (errorMsg.includes('No speech detected')) {
        throw new Error(errorMsg);
      }
    }
  }

  // Fallback to Groq (no enhancements)
  if (Deno.env.get('GROQ_API_KEY')) {
    try {
      console.log('Falling back to Groq Whisper...');
      const result = await transcribeWithGroqWhisper(videoUrl, language);
      return { 
        ...result, 
        provider: 'groq',
        sentimentData: null,
        speakers: [],
        deepgramSummary: null,
      };
    } catch (err) {
      errors.push(`Groq: ${(err as Error).message}`);
    }
  }

  throw new Error(`Transcription failed. Errors: ${errors.join('; ')}`);
}


// ==================== AI GENERATION FUNCTIONS ====================

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('OPENAI_API_KEY');
  if (!openRouterKey) throw new Error('AI service not configured');

  const apiUrl = Deno.env.get('OPENROUTER_API_KEY') 
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${openRouterKey}`,
    'Content-Type': 'application/json',
  };

  if (Deno.env.get('OPENROUTER_API_KEY')) {
    headers['HTTP-Referer'] = Deno.env.get('SUPABASE_URL') || '';
    headers['X-Title'] = 'AI Video Summarizer';
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error(`AI API error: ${await response.text()}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
}

/**
 * Generate comprehensive video summary with key points, chapters, topics
 */
async function generateVideoSummary(transcript: string, segments: TranscriptSegment[]): Promise<{
  summary: string;
  keyPoints: string[];
  chapters: Chapter[];
  topics: string[];
}> {
  const systemPrompt = `You are an expert educational content analyzer. Analyze the video transcript and provide:
1. A comprehensive summary (2-3 paragraphs)
2. Key points (5-8 bullet points)
3. Chapter markers with timestamps and summaries
4. Main topics covered

Return JSON: {"summary": "...", "keyPoints": ["..."], "chapters": [{"timestamp": 0, "title": "...", "summary": "..."}], "topics": ["..."]}`;

  const userPrompt = `Transcript:\n${transcript.slice(0, 15000)}${transcript.length > 15000 ? '\n[truncated]' : ''}\n\nSegments:\n${segments.slice(0, 50).map(s => `[${Math.floor(s.start / 60)}:${Math.floor(s.start % 60).toString().padStart(2, '0')}] ${s.text}`).join('\n')}`;

  try {
    const content = await callAI(systemPrompt, userPrompt);
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || '',
      keyPoints: parsed.keyPoints || [],
      chapters: parsed.chapters || [],
      topics: parsed.topics || []
    };
  } catch {
    return { summary: '', keyPoints: [], chapters: [], topics: [] };
  }
}

/**
 * Extract notable quotes from transcript
 */
async function extractNotableQuotes(transcript: string, segments: TranscriptSegment[]): Promise<NotableQuote[]> {
  const systemPrompt = `Extract 3-5 notable, memorable, or impactful quotes from this transcript. Include the approximate timestamp.

Return JSON: {"quotes": [{"text": "exact quote", "timestamp": seconds, "context": "brief context"}]}`;

  const userPrompt = `Transcript with timestamps:\n${segments.slice(0, 100).map(s => `[${Math.floor(s.start)}s] ${s.text}`).join('\n')}`;

  try {
    const content = await callAI(systemPrompt, userPrompt);
    const parsed = JSON.parse(content);
    return parsed.quotes || [];
  } catch {
    return [];
  }
}

/**
 * Generate quiz questions from content
 */
async function generateQuizQuestions(transcript: string, summary: string, keyPoints: string[]): Promise<QuizQuestion[]> {
  const systemPrompt = `Generate 5 multiple-choice quiz questions to test understanding of this content. Each question should have 4 options with one correct answer.

Return JSON: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Why this is correct"}]}`;

  const userPrompt = `Summary: ${summary}\n\nKey Points:\n${keyPoints.join('\n')}\n\nFull Transcript (first 5000 chars):\n${transcript.slice(0, 5000)}`;

  try {
    const content = await callAI(systemPrompt, userPrompt);
    const parsed = JSON.parse(content);
    return parsed.questions || [];
  } catch {
    return [];
  }
}

/**
 * Generate flashcards for learning
 */
async function generateFlashcards(transcript: string, keyPoints: string[], topics: string[]): Promise<Flashcard[]> {
  const systemPrompt = `Create 5-8 flashcards for studying this content. Each flashcard should have a question/term on the front and the answer/definition on the back.

Return JSON: {"flashcards": [{"front": "Question or term", "back": "Answer or definition", "topic": "Related topic"}]}`;

  const userPrompt = `Topics: ${topics.join(', ')}\n\nKey Points:\n${keyPoints.join('\n')}\n\nTranscript excerpt:\n${transcript.slice(0, 5000)}`;

  try {
    const content = await callAI(systemPrompt, userPrompt);
    const parsed = JSON.parse(content);
    return parsed.flashcards || [];
  } catch {
    return [];
  }
}


// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Server configuration error');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { 
      videoUrl, 
      lessonId, 
      courseId, 
      language = 'en',
      enableQuiz = true,
      enableFlashcards = true 
    }: VideoSummaryRequest = await req.json();

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: 'Video URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing video: ${videoUrl.slice(0, 100)}...`);

    // Check cache first
    const { data: existing } = await supabase
      .from('video_summaries')
      .select('*')
      .eq('video_url', videoUrl)
      .eq('processing_status', 'completed')
      .single();

    if (existing) {
      console.log('Returning cached summary');
      return new Response(JSON.stringify(existing), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if already processing
    const { data: inProgress } = await supabase
      .from('video_summaries')
      .select('*')
      .eq('video_url', videoUrl)
      .eq('processing_status', 'processing')
      .single();

    if (inProgress) {
      return new Response(JSON.stringify({
        ...inProgress,
        message: 'Video is being processed. Poll for status updates.'
      }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create record with 'processing' status
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

    if (insertError) throw new Error(`Failed to create record: ${insertError.message}`);

    const recordId = record.id;
    console.log(`Created record ${recordId}, starting enhanced processing...`);

    try {
      // Step 1: Transcribe with enhancements
      console.log('Step 1: Transcribing with sentiment & diarization...');
      const { 
        transcript, 
        segments, 
        duration, 
        provider,
        sentimentData,
        speakers,
        deepgramSummary 
      } = await transcribeVideo(videoUrl, language);
      
      console.log(`Transcription via ${provider}: ${transcript.length} chars, ${duration}s`);
      console.log(`Sentiment: ${sentimentData?.overall || 'N/A'}, Speakers: ${speakers.length}`);

      // Step 2: Run ALL AI generation tasks IN PARALLEL for speed
      console.log('Step 2: Running AI generation tasks in parallel...');
      const startTime = Date.now();
      
      const [
        summaryResult,
        notableQuotes,
        quizQuestions,
        flashcards
      ] = await Promise.all([
        // Task 1: Generate summary, key points, chapters, topics
        generateVideoSummary(transcript, segments),
        // Task 2: Extract notable quotes
        extractNotableQuotes(transcript, segments),
        // Task 3: Generate quiz questions (if enabled)
        enableQuiz 
          ? generateQuizQuestions(transcript, '', []).catch(() => [])
          : Promise.resolve([]),
        // Task 4: Generate flashcards (if enabled)
        enableFlashcards 
          ? generateFlashcards(transcript, [], []).catch(() => [])
          : Promise.resolve([])
      ]);
      
      const { summary, keyPoints, chapters, topics } = summaryResult;
      console.log(`AI generation completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

      // Step 3: Generate subtitle formats (fast, no AI needed)
      console.log('Step 3: Generating subtitles...');
      const srtContent = generateSRT(segments);
      const vttContent = generateVTT(segments);

      // Save all results
      const { data: updatedRecord, error: updateError } = await supabase
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
        .eq('id', recordId)
        .select()
        .single();

      if (updateError) throw new Error(`Failed to save: ${updateError.message}`);

      console.log(`✅ Enhanced video processing complete for ${recordId}`);
      
      return new Response(JSON.stringify(updatedRecord), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (processingError) {
      console.error(`❌ Processing failed for ${recordId}:`, processingError);
      
      const errorMessage = (processingError as Error).message;
      await supabase
        .from('video_summaries')
        .update({
          processing_status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      return new Response(JSON.stringify({
        id: recordId,
        video_url: videoUrl,
        processing_status: 'failed',
        error_message: errorMessage
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
