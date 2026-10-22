import { PlatformPromptSchema, PlatformPromptTemplateSchema, type VideoSegment, type SummarizeVideoInput } from '@rareminds-eym/ai-protocol';
type ChatMessage = { role: 'system' | 'user'; content: string };

/**
 * Video-summary prompt pack (v1, skillpassport).
 *
 * Verbatim port of the four system prompts and message-assembly bounds in
 * SkillPassport `functions/api/course/utils/video-processing.ts`. The
 * transcript/segment slice bounds double as spend guards; Pages truncates
 * identically-sized inputs at cutover (wire maxima match). Transcription
 * (Deepgram/Groq), cache/processing records, SRT/VTT and the `waitUntil`
 * orchestration stay in Pages.
 */

export function formatMinuteStamp(start: number): string {
  return `[${Math.floor(start / 60)}:${Math.floor(start % 60)
    .toString()
    .padStart(2, "0")}]`;
}

export function formatSecondStamp(start: number): string {
  return `[${Math.floor(start)}s]`;
}

export function buildVideoSummaryMessages(transcript: string, segments: VideoSegment[]): ChatMessage[] {
  const systemPrompt = `You are an expert educational content analyzer. Analyze the video transcript and provide:
1. A comprehensive summary (2-3 paragraphs)
2. Key points (5-8 bullet points)
3. Chapter markers with timestamps and summaries
4. Main topics covered

Return JSON: {"summary": "...", "keyPoints": ["..."], "chapters": [{"timestamp": 0, "title": "...", "summary": "..."}], "topics": ["..."]}`;
  const userPrompt = `Transcript:\n${transcript.slice(0, 15000)}${transcript.length > 15000 ? "\n[truncated]" : ""}\n\nSegments:\n${segments
    .slice(0, 50)
    .map((s) => `${formatMinuteStamp(s.start)} ${s.text}`)
    .join("\n")}`;
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

export function buildNotableQuotesMessages(segments: VideoSegment[]): ChatMessage[] {
  const systemPrompt = `Extract 3-5 notable, memorable, or impactful quotes from this transcript. Include the approximate timestamp.
Return JSON: {"quotes": [{"text": "exact quote", "timestamp": seconds, "context": "brief context"}]}`;
  const userPrompt = `Transcript with timestamps:\n${segments
    .slice(0, 100)
    .map((s) => `${formatSecondStamp(s.start)} ${s.text}`)
    .join("\n")}`;
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

export function buildQuizQuestionsMessages(
  transcript: string,
  summary: string,
  keyPoints: string[],
): ChatMessage[] {
  const systemPrompt = `Generate 5 multiple-choice quiz questions to test understanding of this content. Each question should have 4 options with one correct answer.
Return JSON: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Why this is correct"}]}`;
  const userPrompt = `Summary: ${summary}\n\nKey Points:\n${keyPoints.join("\n")}\n\nTranscript (first 5000 chars):\n${transcript.slice(0, 5000)}`;
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

export function buildFlashcardsMessages(
  transcript: string,
  keyPoints: string[],
  topics: string[],
): ChatMessage[] {
  const systemPrompt = `Create 5-8 flashcards for studying this content. Each flashcard should have a question/term on the front and the answer/definition on the back.
Return JSON: {"flashcards": [{"front": "Question or term", "back": "Answer or definition", "topic": "Related topic"}]}`;
  const userPrompt = `Topics: ${topics.join(", ")}\n\nKey Points:\n${keyPoints.join("\n")}\nTranscript excerpt:\n${transcript.slice(0, 5000)}`;
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

export function buildVideoPrompts(input: Pick<SummarizeVideoInput, 'transcript' | 'segments' | 'enableQuiz' | 'enableFlashcards'>): NonNullable<SummarizeVideoInput['prompts']> {
  const version = '1.0.0', root = 'seniorEducator.summarize-video';
  const plain = (id: string, messages: ChatMessage[]) => PlatformPromptSchema.parse({ id: `${root}.${id}`, version, system: messages[0].content, user: messages[1].content });
  return {
    summary: plain('summary', buildVideoSummaryMessages(input.transcript, input.segments)),
    quotes: plain('quotes', buildNotableQuotesMessages(input.segments)),
    ...(input.enableQuiz ? { quiz: PlatformPromptTemplateSchema.parse({ id: `${root}.quiz`, version, system: buildQuizQuestionsMessages('', '', [])[0].content, parts: [
      { text: 'Summary: ' }, { slot: 'summary' }, { text: '\n\nKey Points:\n' }, { slot: 'keyPoints' }, { text: `\n\nTranscript (first 5000 chars):\n${input.transcript.slice(0, 5000)}` },
    ] }) } : {}),
    ...(input.enableFlashcards ? { flashcards: PlatformPromptTemplateSchema.parse({ id: `${root}.flashcards`, version, system: buildFlashcardsMessages('', [], [])[0].content, parts: [
      { text: 'Topics: ' }, { slot: 'topics' }, { text: '\n\nKey Points:\n' }, { slot: 'keyPoints' }, { text: `\nTranscript excerpt:\n${input.transcript.slice(0, 5000)}` },
    ] }) } : {}),
  };
}
