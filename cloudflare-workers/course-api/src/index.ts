/**
 * Cloudflare Worker - Course API
 * Complete implementation of all course-related edge functions:
 * - /get-file-url - Generate presigned URLs for R2 files
 * - /ai-tutor-suggestions - Generate suggested questions for lessons
 * - /ai-tutor-chat - AI tutor chat with streaming (with conversation phases)
 * - /ai-tutor-feedback - Submit feedback on AI responses
 * - /ai-tutor-progress - Track student progress
 * - /ai-video-summarizer - Transcribe and summarize videos (with all enhancements)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AwsClient } from 'aws4fetch';

export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_OPENROUTER_API_KEY: string;
  DEEPGRAM_API_KEY?: string;
  GROQ_API_KEY?: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_BUCKET: R2Bucket;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ==================== TYPES ====================

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: number;
}

interface VideoChapter {
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
  utterances: Array<{ start: number; end: number; text: string }>;
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
}

interface Flashcard {
  front: string;
  back: string;
  topic?: string;
}

interface ModuleContext {
  moduleId: string;
  title: string;
  description: string | null;
  orderIndex: number;
}

interface LessonContext {
  lessonId: string;
  title: string;
  description: string | null;
  content: string | null;
  duration: string | null;
  orderIndex: number;
  moduleTitle: string;
}

interface ResourceContext {
  resourceId: string;
  name: string;
  type: string;
  url: string;
  content: string | null;
}

interface VideoSummaryContext {
  summary: string;
  keyPoints: string[];
  topics: string[];
  transcript: string;
}

interface ProgressContext {
  completedLessons: string[];
  currentLessonStatus: string | null;
  totalLessons: number;
  completionPercentage: number;
}

interface CourseContext {
  courseTitle: string;
  courseDescription: string;
  courseCode: string;
  currentModule: ModuleContext | null;
  currentLesson: LessonContext | null;
  availableResources: ResourceContext[];
  studentProgress: ProgressContext;
  allModules: ModuleContext[];
  allLessons: { title: string; lessons: { title: string; lessonId: string }[] }[];
  videoSummary: VideoSummaryContext | null;
}

type ConversationPhase = 'opening' | 'exploring' | 'deep_dive';

// ==================== HELPERS ====================

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function authenticateUser(request: Request, env: Env): Promise<{ user: any; supabase: SupabaseClient; supabaseAdmin: SupabaseClient } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  return { user, supabase, supabaseAdmin };
}

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

function generateSRT(segments: TranscriptSegment[]): string {
  return segments.map((seg, i) => {
    const startTime = formatSRTTime(seg.start);
    const endTime = formatSRTTime(seg.end);
    return `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
  }).join('\n');
}

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

// ==================== CONVERSATION PHASE SYSTEM ====================

function getConversationPhase(messageCount: number): ConversationPhase {
  if (messageCount === 0) return 'opening';
  if (messageCount <= 4) return 'exploring';
  return 'deep_dive';
}

function getPhaseParameters(phase: ConversationPhase): { max_tokens: number; temperature: number; verbosity: string } {
  const params: Record<ConversationPhase, { max_tokens: number; temperature: number; verbosity: string }> = {
    opening: { max_tokens: 250, temperature: 0.8, verbosity: 'low' },
    exploring: { max_tokens: 1500, temperature: 0.7, verbosity: 'medium' },
    deep_dive: { max_tokens: 3000, temperature: 0.6, verbosity: 'high' }
  };
  return params[phase];
}

function getPhaseInstructions(phase: ConversationPhase): string {
  const instructions: Record<ConversationPhase, string> = {
    opening: `
## FIRST MESSAGE BEHAVIOR
This is the VERY FIRST message. Keep response SHORT and CONVERSATIONAL.
- Maximum 150 words, 4-5 sentences
- NO bullet points or numbered lists
- Acknowledge warmly, give brief teaser answer, ask ONE follow-up question`,
    exploring: `
## EARLY CONVERSATION (Messages 2-4)
- Provide moderate depth (200-400 words)
- Build on previous context naturally
- Start introducing specific details
- End with a question or offer to explore deeper`,
    deep_dive: `
## DEEP CONVERSATION (Message 5+)
- Provide comprehensive explanations
- Include specific citations and references
- Use structured formatting when helpful
- Go as deep as the topic requires`
  };
  return instructions[phase];
}


// ==================== COURSE CONTEXT BUILDER ====================

async function buildCourseContext(
  supabase: SupabaseClient,
  courseId: string,
  lessonId: string | null,
  studentId: string | null
): Promise<CourseContext> {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('course_id, title, description, code')
    .eq('course_id', courseId)
    .single();

  if (courseError || !course) {
    throw new Error(`Course not found: ${courseId}`);
  }

  const { data: modules } = await supabase
    .from('course_modules')
    .select('module_id, title, description, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const allModules: ModuleContext[] = (modules || []).map((m: any) => ({
    moduleId: m.module_id,
    title: m.title,
    description: m.description,
    orderIndex: m.order_index
  }));

  const { data: lessons } = await supabase
    .from('lessons')
    .select('lesson_id, title, description, content, duration, order_index, module_id')
    .in('module_id', allModules.length > 0 ? allModules.map(m => m.moduleId) : [''])
    .order('order_index', { ascending: true });

  const moduleMap = new Map<string, { title: string; lessons: { title: string; lessonId: string }[] }>();
  for (const module of allModules) {
    moduleMap.set(module.moduleId, { title: module.title, lessons: [] });
  }
  for (const lesson of lessons || []) {
    const entry = moduleMap.get(lesson.module_id);
    if (entry) {
      entry.lessons.push({ title: lesson.title, lessonId: lesson.lesson_id });
    }
  }
  const allLessons = Array.from(moduleMap.values());

  let currentLesson: LessonContext | null = null;
  let currentModule: ModuleContext | null = null;
  let availableResources: ResourceContext[] = [];

  if (lessonId) {
    const lessonData = (lessons || []).find((l: any) => l.lesson_id === lessonId);
    if (lessonData) {
      const module = allModules.find(m => m.moduleId === lessonData.module_id);
      currentLesson = {
        lessonId: lessonData.lesson_id,
        title: lessonData.title,
        description: lessonData.description,
        content: lessonData.content,
        duration: lessonData.duration,
        orderIndex: lessonData.order_index,
        moduleTitle: module?.title || ''
      };
      currentModule = module || null;

      const { data: resources } = await supabase
        .from('lesson_resources')
        .select('resource_id, name, type, url, content')
        .eq('lesson_id', lessonId);

      availableResources = (resources || []).map((r: any) => ({
        resourceId: r.resource_id,
        name: r.name,
        type: r.type,
        url: r.url,
        content: r.content || null
      }));
    }
  }

  let completedLessons: string[] = [];
  let currentLessonProgress: { status: string } | null = null;
  
  if (studentId) {
    const { data: progress } = await supabase
      .from('student_course_progress')
      .select('lesson_id, status')
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    completedLessons = (progress || []).filter((p: any) => p.status === 'completed').map((p: any) => p.lesson_id);
    currentLessonProgress = lessonId ? (progress || []).find((p: any) => p.lesson_id === lessonId) || null : null;
  }

  const totalLessons = (lessons || []).length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

  // Fetch video summary if available
  let videoSummary: VideoSummaryContext | null = null;
  if (lessonId) {
    const { data: videoData } = await supabase
      .from('video_summaries')
      .select('summary, key_points, topics, transcript')
      .eq('lesson_id', lessonId)
      .eq('processing_status', 'completed')
      .maybeSingle();

    if (videoData) {
      videoSummary = {
        summary: videoData.summary || '',
        keyPoints: videoData.key_points || [],
        topics: videoData.topics || [],
        transcript: videoData.transcript || ''
      };
    }
  }

  return {
    courseTitle: course.title,
    courseDescription: course.description || '',
    courseCode: course.code,
    currentModule,
    currentLesson,
    availableResources,
    studentProgress: { completedLessons, currentLessonStatus: currentLessonProgress?.status || null, totalLessons, completionPercentage },
    allModules,
    allLessons,
    videoSummary
  };
}

function formatCourseContextForPrompt(context: CourseContext): string {
  let prompt = `## Course Information
- **Course**: ${context.courseTitle} (${context.courseCode})
- **Description**: ${context.courseDescription}

## Course Structure
`;
  for (const moduleGroup of context.allLessons) {
    prompt += `### ${moduleGroup.title}\n`;
    for (const lesson of moduleGroup.lessons) {
      const isCompleted = context.studentProgress.completedLessons.includes(lesson.lessonId);
      const isCurrent = context.currentLesson?.lessonId === lesson.lessonId;
      const status = isCurrent ? '📍 Current' : isCompleted ? '✅' : '○';
      prompt += `  ${status} ${lesson.title}\n`;
    }
  }

  if (context.currentLesson) {
    prompt += `
## Current Lesson: ${context.currentLesson.title}
**Module**: ${context.currentLesson.moduleTitle}
**Description**: ${context.currentLesson.description || 'No description'}

### Lesson Content
${context.currentLesson.content || 'No content available'}
`;
    if (context.availableResources.length > 0) {
      prompt += `\n### Available Resources\n`;
      for (const resource of context.availableResources) {
        prompt += `- ${resource.name} (${resource.type})\n`;
      }
      const resourcesWithContent = context.availableResources.filter(r => r.content);
      if (resourcesWithContent.length > 0) {
        prompt += `\n### Resource Content\n`;
        for (const resource of resourcesWithContent) {
          prompt += `\n#### ${resource.name}\n`;
          const truncatedContent = resource.content!.length > 50000 
            ? resource.content!.slice(0, 50000) + '\n... [content truncated]'
            : resource.content;
          prompt += `${truncatedContent}\n`;
        }
      }
    }
  }

  if (context.videoSummary) {
    prompt += `
## Video Content Summary
**AI-Generated Summary:** ${context.videoSummary.summary}
**Key Points:** ${context.videoSummary.keyPoints.map(p => `- ${p}`).join('\n')}
**Topics:** ${context.videoSummary.topics.join(', ')}
**Transcript (excerpt):** ${context.videoSummary.transcript.slice(0, 10000)}${context.videoSummary.transcript.length > 10000 ? '\n... [truncated]' : ''}
`;
  }

  prompt += `
## Student Progress
- Completed: ${context.studentProgress.completedLessons.length}/${context.studentProgress.totalLessons} lessons (${context.studentProgress.completionPercentage}%)
`;
  return prompt;
}

function buildSystemPrompt(context: CourseContext, phase: ConversationPhase): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  return `You are an expert AI Course Tutor for "${context.courseTitle}". You combine deep subject matter expertise with exceptional pedagogical skills.

## YOUR IDENTITY
- Patient, encouraging tutor who genuinely cares about student success
- Master of all course materials including PDFs, lessons, and resources
- Balance high-level concepts with granular details based on student needs

## TEACHING APPROACH
- Guide students toward understanding rather than giving direct answers
- Use the Socratic method when appropriate
- Break complex problems into smaller pieces
- Adapt to student's progress level (${context.studentProgress.completionPercentage}% complete)

## RESPONSE RULES
- Write in flowing, natural paragraphs
- Use conversational transitions
- Include relevant examples and analogies
- End with engaging questions when appropriate
- Reference course materials with specific citations

${courseContextStr}

${getPhaseInstructions(phase)}`;
}


// ==================== AI HELPER FUNCTIONS ====================

async function callAI(env: Env, systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.OPENROUTER_API_KEY) throw new Error('AI service not configured');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.SUPABASE_URL || '',
      'X-Title': 'Course API Worker'
    },
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
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '{}';
}

async function generateVideoSummary(env: Env, transcript: string, segments: TranscriptSegment[]): Promise<{
  summary: string;
  keyPoints: string[];
  chapters: VideoChapter[];
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
    const content = await callAI(env, systemPrompt, userPrompt);
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

async function extractNotableQuotes(env: Env, segments: TranscriptSegment[]): Promise<NotableQuote[]> {
  const systemPrompt = `Extract 3-5 notable, memorable, or impactful quotes from this transcript. Include the approximate timestamp.
Return JSON: {"quotes": [{"text": "exact quote", "timestamp": seconds, "context": "brief context"}]}`;

  const userPrompt = `Transcript with timestamps:\n${segments.slice(0, 100).map(s => `[${Math.floor(s.start)}s] ${s.text}`).join('\n')}`;

  try {
    const content = await callAI(env, systemPrompt, userPrompt);
    const parsed = JSON.parse(content);
    return parsed.quotes || [];
  } catch {
    return [];
  }
}

async function generateQuizQuestions(env: Env, transcript: string, summary: string, keyPoints: string[]): Promise<QuizQuestion[]> {
  const systemPrompt = `Generate 5 multiple-choice quiz questions to test understanding of this content. Each question should have 4 options with one correct answer.
Return JSON: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Why this is correct"}]}`;

  const userPrompt = `Summary: ${summary}\n\nKey Points:\n${keyPoints.join('\n')}\n\nTranscript (first 5000 chars):\n${transcript.slice(0, 5000)}`;

  try {
    const content = await callAI(env, systemPrompt, userPrompt);
    const parsed = JSON.parse(content);
    return parsed.questions || [];
  } catch {
    return [];
  }
}

async function generateFlashcards(env: Env, transcript: string, keyPoints: string[], topics: string[]): Promise<Flashcard[]> {
  const systemPrompt = `Create 5-8 flashcards for studying this content. Each flashcard should have a question/term on the front and the answer/definition on the back.
Return JSON: {"flashcards": [{"front": "Question or term", "back": "Answer or definition", "topic": "Related topic"}]}`;

  const userPrompt = `Topics: ${topics.join(', ')}\n\nKey Points:\n${keyPoints.join('\n')}\n\nTranscript excerpt:\n${transcript.slice(0, 5000)}`;

  try {
    const content = await callAI(env, systemPrompt, userPrompt);
    const parsed = JSON.parse(content);
    return parsed.flashcards || [];
  } catch {
    return [];
  }
}

// ==================== TRANSCRIPTION FUNCTIONS ====================

async function transcribeWithDeepgram(env: Env, videoUrl: string, language: string = 'en'): Promise<{
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  sentimentData: SentimentData | null;
  speakers: Speaker[];
  deepgramSummary: string | null;
}> {
  if (!env.DEEPGRAM_API_KEY) throw new Error('DEEPGRAM_API_KEY not configured');

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

  // Try URL-based API first (faster)
  try {
    response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: videoUrl }),
    });

    if (response.ok) {
      usedUrlApi = true;
    }
  } catch {
    // Fall through to file upload
  }

  // Fallback: Download and upload
  if (!usedUrlApi) {
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) throw new Error(`Failed to download media: ${videoResponse.status}`);
    
    const videoBuffer = await videoResponse.arrayBuffer();
    const contentType = getContentType(videoUrl);
    
    response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${env.DEEPGRAM_API_KEY}`,
        'Content-Type': contentType,
      },
      body: videoBuffer,
    });
  }

  if (!response!.ok) {
    const error = await response!.text();
    throw new Error(`Deepgram API error (${response!.status}): ${error}`);
  }

  const result = await response!.json() as any;
  const channel = result.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];
  const transcript = alternative?.transcript || '';
  
  if (!transcript) {
    throw new Error('No speech detected in media.');
  }
  
  // Build segments from words
  const words = alternative?.words || [];
  const segments: TranscriptSegment[] = [];
  
  if (words.length > 0) {
    let currentSegment: TranscriptSegment = { start: words[0].start, end: 0, text: '', speaker: words[0].speaker };
    let wordCount = 0;
    
    for (const word of words) {
      currentSegment.text += (currentSegment.text ? ' ' : '') + word.word;
      currentSegment.end = word.end;
      wordCount++;
      
      const speakerChanged = word.speaker !== currentSegment.speaker;
      if (wordCount >= 15 || word.word.match(/[.!?]$/) || speakerChanged) {
        segments.push({ ...currentSegment });
        currentSegment = { start: word.end, end: 0, text: '', speaker: word.speaker };
        wordCount = 0;
      }
    }
    if (currentSegment.text) segments.push(currentSegment);
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

  // Parse speaker data
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

  return {
    transcript,
    segments,
    duration: Math.ceil(result.metadata?.duration || 0),
    sentimentData,
    speakers,
    deepgramSummary: result.results?.summary?.short || null,
  };
}

async function transcribeWithGroqWhisper(env: Env, videoUrl: string, language: string = 'en'): Promise<{
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
}> {
  if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');

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
    headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}` },
    body: formData,
  });

  if (!response.ok) throw new Error(`Groq API error: ${await response.text()}`);

  const result = await response.json() as any;
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

async function transcribeVideo(env: Env, videoUrl: string, language: string = 'en'): Promise<{
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  provider: string;
  sentimentData: SentimentData | null;
  speakers: Speaker[];
  deepgramSummary: string | null;
}> {
  const errors: string[] = [];

  // Try Deepgram first
  if (env.DEEPGRAM_API_KEY) {
    try {
      const result = await transcribeWithDeepgram(env, videoUrl, language);
      return { ...result, provider: 'deepgram' };
    } catch (err) {
      const errorMsg = (err as Error).message;
      errors.push(`Deepgram: ${errorMsg}`);
      if (errorMsg.includes('No speech detected')) throw new Error(errorMsg);
    }
  }

  // Fallback to Groq
  if (env.GROQ_API_KEY) {
    try {
      const result = await transcribeWithGroqWhisper(env, videoUrl, language);
      return { ...result, provider: 'groq', sentimentData: null, speakers: [], deepgramSummary: null };
    } catch (err) {
      errors.push(`Groq: ${(err as Error).message}`);
    }
  }

  throw new Error(`Transcription failed. Errors: ${errors.join('; ')}`);
}


// ==================== HANDLER: GET FILE URL ====================

async function handleGetFileUrl(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await request.json() as { fileKey?: string };
  const { fileKey } = body;
  if (!fileKey) {
    return jsonResponse({ error: 'fileKey is required' }, 400);
  }

  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_R2_ACCESS_KEY_ID || !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    return jsonResponse({ error: 'R2 credentials not configured' }, 500);
  }

  const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
  const r2 = new AwsClient({
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  });

  const endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const expiresIn = 3600; // 1 hour
  const expiration = Math.floor(Date.now() / 1000) + expiresIn;

  // Generate presigned URL
  const url = new URL(`${endpoint}/${bucketName}/${fileKey}`);
  url.searchParams.set('X-Amz-Expires', expiresIn.toString());

  const signedRequest = await r2.sign(
    new Request(url.toString(), { method: 'GET' }),
    { aws: { signQuery: true } }
  );

  return jsonResponse({
    url: signedRequest.url,
    expiresAt: new Date(expiration * 1000).toISOString(),
  });
}

// ==================== HANDLER: AI TUTOR SUGGESTIONS ====================

async function handleAiTutorSuggestions(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const body = await request.json() as { lessonId?: string };
  const { lessonId } = body;

  if (!lessonId) {
    return jsonResponse({ error: 'Missing required field: lessonId' }, 400);
  }

  // Fetch lesson with module info
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('lesson_id, title, content, module_id')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    return jsonResponse({ error: 'Lesson not found' }, 404);
  }

  // Get module title
  const { data: module } = await supabase
    .from('course_modules')
    .select('title')
    .eq('module_id', lesson.module_id)
    .maybeSingle();

  const moduleTitle = module?.title || 'Unknown Module';

  if (!env.OPENROUTER_API_KEY) {
    // Return default questions if AI not configured
    return jsonResponse({
      questions: [
        `What are the key concepts in "${lesson.title}"?`,
        `Can you explain the main points of this lesson?`,
        `How does this lesson connect to the rest of the course?`
      ],
      lessonId,
      lessonTitle: lesson.title
    });
  }

  const prompt = `Based on the following lesson, generate 3-5 helpful questions that a student might want to ask to better understand the material.

## Lesson: ${lesson.title}
## Module: ${moduleTitle}

### Content:
${lesson.content || 'No content available'}

Generate questions that:
1. Help clarify key concepts from the lesson
2. Explore practical applications of the material
3. Connect this lesson to broader course themes
4. Address common points of confusion

Return ONLY a JSON array of question strings, like:
["Question 1?", "Question 2?", "Question 3?"]`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    return jsonResponse({ error: 'AI service error' }, 500);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content || '[]';

  let questions: string[] = [];
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) questions = JSON.parse(jsonMatch[0]);
  } catch {
    questions = content.split('\n').filter((q: string) => q.trim().endsWith('?')).slice(0, 5);
  }

  questions = questions.slice(0, 5);
  if (questions.length < 3) {
    questions = [
      `What are the key concepts in "${lesson.title}"?`,
      `Can you explain the main points of this lesson?`,
      `How does this lesson connect to the rest of the course?`
    ];
  }

  return jsonResponse({ questions, lessonId, lessonTitle: lesson.title });
}

// ==================== HANDLER: AI TUTOR CHAT ====================

async function handleAiTutorChat(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await authenticateUser(request, env);
  const studentId = auth?.user?.id || null;
  const supabase = auth?.supabase || createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const supabaseAdmin = auth?.supabaseAdmin || createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const body = await request.json() as { conversationId?: string; courseId?: string; lessonId?: string; message?: string };
  const { conversationId, courseId, lessonId, message } = body;

  if (!courseId || !message) {
    return jsonResponse({ error: 'Missing required fields: courseId and message' }, 400);
  }

  if (!env.OPENROUTER_API_KEY) {
    return jsonResponse({ error: 'AI service not configured' }, 500);
  }

  // Fetch existing messages
  let currentConversationId = conversationId;
  let existingMessages: StoredMessage[] = [];

  if (conversationId && studentId) {
    const { data: conversation } = await supabase
      .from('tutor_conversations')
      .select('messages')
      .eq('id', conversationId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (conversation) {
      existingMessages = conversation.messages || [];
    }
  }

  // Determine conversation phase
  const messageCount = existingMessages.length;
  const conversationPhase = getConversationPhase(messageCount);
  const phaseParams = getPhaseParameters(conversationPhase);

  // Build course context and system prompt
  const courseContext = await buildCourseContext(supabase, courseId, lessonId || null, studentId);
  const systemPrompt = buildSystemPrompt(courseContext, conversationPhase);

  const turnId = crypto.randomUUID();
  const userMessage: StoredMessage = {
    id: turnId,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  };

  const aiMessages = [
    { role: 'system', content: systemPrompt },
    ...existingMessages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  const encoder = new TextEncoder();
  let fullResponse = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.SUPABASE_URL || '',
            'X-Title': 'AI Course Tutor'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: aiMessages,
            stream: true,
            max_tokens: phaseParams.max_tokens,
            temperature: phaseParams.temperature
          })
        });

        if (!response.ok) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'AI service error' })}\n\n`));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'No response stream' })}\n\n`));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content })}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
        }

        const assistantMessage: StoredMessage = {
          id: turnId,
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString()
        };

        const updatedMessages = [...existingMessages, userMessage, assistantMessage];

        // Save conversation
        if (studentId) {
          if (currentConversationId) {
            // Re-fetch latest to avoid race condition
            const { data: latestConv } = await supabaseAdmin
              .from('tutor_conversations')
              .select('messages')
              .eq('id', currentConversationId)
              .maybeSingle();
            
            const latestMessages: StoredMessage[] = latestConv?.messages || existingMessages;
            const finalMessages = [...latestMessages, userMessage, assistantMessage];
            
            await supabaseAdmin.from('tutor_conversations').update({
              messages: finalMessages,
              updated_at: new Date().toISOString()
            }).eq('id', currentConversationId).eq('student_id', studentId);
          } else {
            // Generate title
            let title = message.slice(0, 50);
            try {
              const titleResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'openai/gpt-4o-mini',
                  messages: [{ role: 'user', content: `Generate a short title (max 50 chars) for a tutoring conversation about "${courseContext.courseTitle}" starting with: "${message}"` }],
                  max_tokens: 60,
                  temperature: 0.5
                })
              });
              if (titleResponse.ok) {
                const titleData = await titleResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
                title = titleData.choices?.[0]?.message?.content?.trim() || title;
              }
            } catch { /* use default */ }

            const { data: newConv } = await supabaseAdmin.from('tutor_conversations').insert({
              student_id: studentId,
              course_id: courseId,
              lesson_id: lessonId || null,
              title: title.slice(0, 255),
              messages: updatedMessages
            }).select('id').single();

            if (newConv) currentConversationId = newConv.id;
          }
        }

        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
          conversationId: currentConversationId,
          messageId: assistantMessage.id
        })}\n\n`));
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
  });
}


// ==================== HANDLER: AI TUTOR FEEDBACK ====================

async function handleAiTutorFeedback(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { user, supabase } = auth;
  const studentId = user.id;
  const body = await request.json() as { conversationId?: string; messageIndex?: number; rating?: number; feedbackText?: string };
  const { conversationId, messageIndex, rating, feedbackText } = body;

  if (!conversationId || messageIndex === undefined || rating === undefined) {
    return jsonResponse({ error: 'Missing required fields: conversationId, messageIndex, rating' }, 400);
  }

  if (rating !== 1 && rating !== -1) {
    return jsonResponse({ error: 'Invalid rating. Must be 1 (thumbs up) or -1 (thumbs down)' }, 400);
  }

  // Verify conversation ownership
  const { data: conversation, error: convError } = await supabase
    .from('tutor_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (convError || !conversation) {
    return jsonResponse({ error: 'Conversation not found or access denied' }, 404);
  }

  // Check for existing feedback
  const { data: existingFeedback } = await supabase
    .from('tutor_feedback')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('message_index', messageIndex)
    .maybeSingle();

  if (existingFeedback) {
    const { error: updateError } = await supabase
      .from('tutor_feedback')
      .update({ rating, feedback_text: feedbackText || null })
      .eq('id', existingFeedback.id);

    if (updateError) {
      return jsonResponse({ error: 'Failed to update feedback' }, 500);
    }
    return jsonResponse({ success: true, message: 'Feedback updated' });
  }

  const { error: insertError } = await supabase
    .from('tutor_feedback')
    .insert({
      conversation_id: conversationId,
      message_index: messageIndex,
      rating,
      feedback_text: feedbackText || null
    });

  if (insertError) {
    return jsonResponse({ error: 'Failed to submit feedback' }, 500);
  }

  return jsonResponse({ success: true, message: 'Feedback submitted' });
}

// ==================== HANDLER: AI TUTOR PROGRESS ====================

async function handleAiTutorProgress(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { user, supabase } = auth;
  const studentId = user.id;

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');

    if (!courseId) {
      return jsonResponse({ error: 'Missing courseId parameter' }, 400);
    }

    const { data: progress, error: progressError } = await supabase
      .from('student_course_progress')
      .select('lesson_id, status, last_accessed, completed_at, time_spent_seconds')
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (progressError) {
      return jsonResponse({ error: 'Failed to fetch progress' }, 500);
    }

    const { data: lessons } = await supabase
      .from('lessons')
      .select('lesson_id, course_modules!inner(course_id)')
      .eq('course_modules.course_id', courseId);

    const totalLessons = lessons?.length || 0;
    const completedLessons = (progress || []).filter((p: any) => p.status === 'completed').length;
    const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const lastAccessed = (progress || [])
      .filter((p: any) => p.last_accessed)
      .sort((a: any, b: any) => new Date(b.last_accessed!).getTime() - new Date(a.last_accessed!).getTime())[0];

    return jsonResponse({
      courseId,
      totalLessons,
      completedLessons,
      completionPercentage,
      lastAccessedLessonId: lastAccessed?.lesson_id || null,
      lastAccessedAt: lastAccessed?.last_accessed || null,
      progress: progress || []
    });
  }

  if (request.method === 'POST') {
    const body = await request.json() as { courseId?: string; lessonId?: string; status?: string };
    const { courseId, lessonId, status } = body;

    if (!courseId || !lessonId || !status) {
      return jsonResponse({ error: 'Missing required fields: courseId, lessonId, status' }, 400);
    }

    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      return jsonResponse({ error: 'Invalid status. Must be: not_started, in_progress, or completed' }, 400);
    }

    const now = new Date().toISOString();
    const updateData: any = {
      student_id: studentId,
      course_id: courseId,
      lesson_id: lessonId,
      status,
      last_accessed: now,
      updated_at: now
    };

    if (status === 'completed') {
      updateData.completed_at = now;
    }

    const { data: result, error: upsertError } = await supabase
      .from('student_course_progress')
      .upsert(updateData, { onConflict: 'student_id,course_id,lesson_id' })
      .select()
      .single();

    if (upsertError) {
      return jsonResponse({ error: 'Failed to update progress' }, 500);
    }

    return jsonResponse({ success: true, progress: result });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

// ==================== HANDLER: AI VIDEO SUMMARIZER ====================

async function handleAiVideoSummarizer(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const body = await request.json() as { 
    videoUrl?: string; 
    lessonId?: string; 
    courseId?: string; 
    language?: string;
    enableQuiz?: boolean;
    enableFlashcards?: boolean;
  };
  const { 
    videoUrl, 
    lessonId, 
    courseId, 
    language = 'en',
    enableQuiz = true,
    enableFlashcards = true 
  } = body;

  if (!videoUrl) {
    return jsonResponse({ error: 'Video URL is required' }, 400);
  }

  // Check cache first
  const { data: existing } = await supabase
    .from('video_summaries')
    .select('*')
    .eq('video_url', videoUrl)
    .eq('processing_status', 'completed')
    .maybeSingle();

  if (existing) {
    return jsonResponse(existing);
  }

  // Check if already processing
  const { data: inProgress } = await supabase
    .from('video_summaries')
    .select('*')
    .eq('video_url', videoUrl)
    .eq('processing_status', 'processing')
    .maybeSingle();

  if (inProgress) {
    return jsonResponse({ ...inProgress, message: 'Video is being processed. Poll for status updates.' }, 202);
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

  if (insertError) {
    return jsonResponse({ error: `Failed to create record: ${insertError.message}` }, 500);
  }

  const recordId = record.id;

  // Process in background using waitUntil
  ctx.waitUntil((async () => {
    try {
      // Step 1: Transcribe with enhancements
      const { 
        transcript, 
        segments, 
        duration, 
        sentimentData,
        speakers,
        deepgramSummary 
      } = await transcribeVideo(env, videoUrl, language);

      // Step 2: Run AI generation tasks in parallel
      const [summaryResult, notableQuotes, quizQuestions, flashcards] = await Promise.all([
        generateVideoSummary(env, transcript, segments),
        extractNotableQuotes(env, segments),
        enableQuiz ? generateQuizQuestions(env, transcript, '', []).catch(() => []) : Promise.resolve([]),
        enableFlashcards ? generateFlashcards(env, transcript, [], []).catch(() => []) : Promise.resolve([])
      ]);
      
      const { summary, keyPoints, chapters, topics } = summaryResult;

      // Step 3: Generate subtitle formats
      const srtContent = generateSRT(segments);
      const vttContent = generateVTT(segments);

      // Save all results
      await supabase
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

    } catch (processingError) {
      const errorMessage = (processingError as Error).message;
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

  // Return immediately with processing status
  return jsonResponse({
    id: recordId,
    video_url: videoUrl,
    processing_status: 'processing',
    message: 'Video processing started. Poll for status updates.'
  }, 202);
}

// ==================== MAIN HANDLER ====================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/get-file-url':
          return await handleGetFileUrl(request, env);
        case '/ai-tutor-suggestions':
          return await handleAiTutorSuggestions(request, env);
        case '/ai-tutor-chat':
          return await handleAiTutorChat(request, env);
        case '/ai-tutor-feedback':
          return await handleAiTutorFeedback(request, env);
        case '/ai-tutor-progress':
          return await handleAiTutorProgress(request, env);
        case '/ai-video-summarizer':
          return await handleAiVideoSummarizer(request, env, ctx);
        case '/health':
          return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
        default:
          return jsonResponse({ error: 'Not found' }, 404);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: (error as Error).message || 'Internal server error' }, 500);
    }
  },
};
