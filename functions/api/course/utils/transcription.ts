/**
 * Video Transcription Utilities
 * 
 * Functions for transcribing videos using Deepgram (primary) and Groq (fallback)
 */

import type { 
  TranscriptSegment, 
  TranscriptionResult, 
  SentimentData, 
  Speaker 
} from '../types/video';
import { getContentType } from './subtitle-generation';

/**
 * Transcribe video with Deepgram API (primary method)
 * Includes advanced features: sentiment analysis, speaker diarization, summaries
 */
export async function transcribeWithDeepgram(
  deepgramApiKey: string,
  videoUrl: string,
  language: string = 'en'
): Promise<{
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  sentimentData: SentimentData | null;
  speakers: Speaker[];
  deepgramSummary: string | null;
}> {
  if (!deepgramApiKey) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

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

  // Try URL-based API first (faster, no download needed)
  try {
    response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: videoUrl }),
    });

    if (response.ok) {
      usedUrlApi = true;
    }
  } catch (error) {
    // Fall through to file upload method
    console.log('Deepgram URL API failed, trying file upload:', error);
  }

  // Fallback: Download video and upload to Deepgram
  if (!usedUrlApi) {
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download media: ${videoResponse.status}`);
    }
    
    const videoBuffer = await videoResponse.arrayBuffer();
    const contentType = getContentType(videoUrl);
    
    response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
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
      
      const speakerChanged = word.speaker !== currentSegment.speaker;
      const isPunctuation = word.word.match(/[.!?]$/);
      
      // Create new segment on speaker change, punctuation, or after 15 words
      if (wordCount >= 15 || isPunctuation || speakerChanged) {
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
    
    // Add final segment if it has content
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
        score: seg.sentiment_score || 0,
        startWord: seg.start_word || 0,
        endWord: seg.end_word || 0
      }))
    };
  }

  // Parse speaker data
  const speakers: Speaker[] = [];
  if (result.results?.utterances) {
    const speakerMap = new Map<number, Speaker>();
    
    for (const utterance of result.results.utterances) {
      const speakerId = utterance.speaker || 0;
      if (!speakerMap.has(speakerId)) {
        speakerMap.set(speakerId, { id: speakerId, utterances: [] });
      }
      
      speakerMap.get(speakerId)!.utterances.push({
        start: utterance.start || 0,
        end: utterance.end || 0,
        text: utterance.transcript || ''
      });
    }
    
    speakers.push(...Array.from(speakerMap.values()));
  }

  // Get Deepgram's summary if available
  const deepgramSummary = result.results?.summary?.short || null;

  // Calculate duration from last word
  const duration = words.length > 0 ? Math.ceil(words[words.length - 1].end) : 0;

  return {
    transcript,
    segments,
    duration,
    sentimentData,
    speakers,
    deepgramSummary
  };
}

/**
 * Transcribe video with Groq Whisper API (fallback method)
 * Simpler transcription without advanced features
 */
export async function transcribeWithGroqWhisper(
  groqApiKey: string,
  videoUrl: string,
  language: string = 'en'
): Promise<{
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
}> {
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  // Download video
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download media: ${videoResponse.status}`);
  }
  
  const videoBlob = await videoResponse.blob();
  const fileSizeMB = videoBlob.size / 1024 / 1024;
  
  // Groq has a 25MB file size limit
  if (fileSizeMB > 25) {
    throw new Error(`File too large for Groq (${fileSizeMB.toFixed(1)}MB > 25MB limit)`);
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('file', videoBlob, 'media.mp4');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', language);
  formData.append('response_format', 'verbose_json');

  // Call Groq API
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${groqApiKey}` 
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${errorText}`);
  }

  const result = await response.json() as any;
  
  // Parse segments
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
 * Main transcription function with automatic fallback
 * Tries Deepgram first, falls back to Groq if Deepgram fails
 */
export async function transcribeVideo(
  env: Record<string, any>,
  videoUrl: string,
  language: string = 'en'
): Promise<TranscriptionResult> {
  const errors: string[] = [];

  // Try Deepgram first (if API key available)
  if (env.DEEPGRAM_API_KEY) {
    try {
      const result = await transcribeWithDeepgram(
        env.DEEPGRAM_API_KEY,
        videoUrl,
        language
      );
      return { ...result, provider: 'deepgram' };
    } catch (err) {
      const errorMsg = (err as Error).message;
      errors.push(`Deepgram: ${errorMsg}`);
      
      // If no speech detected, don't try fallback
      if (errorMsg.includes('No speech detected')) {
        throw new Error(errorMsg);
      }
    }
  }

  // Fallback to Groq (if API key available)
  if (env.GROQ_API_KEY) {
    try {
      const result = await transcribeWithGroqWhisper(
        env.GROQ_API_KEY,
        videoUrl,
        language
      );
      return { 
        ...result, 
        provider: 'groq',
        sentimentData: null,
        speakers: [],
        deepgramSummary: null
      };
    } catch (err) {
      errors.push(`Groq: ${(err as Error).message}`);
    }
  }

  // Both methods failed
  throw new Error(`Transcription failed. Errors: ${errors.join('; ')}`);
}
