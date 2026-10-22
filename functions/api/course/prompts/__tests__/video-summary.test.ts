import { describe, expect, it } from 'vitest';
import { buildVideoSummaryMessages, buildNotableQuotesMessages, buildQuizQuestionsMessages, buildFlashcardsMessages, formatMinuteStamp, formatSecondStamp, buildVideoPrompts } from '../video-summary';
const segments = [{ start: 0, text: 'Welcome to photosynthesis.' }, { start: 125.5, text: 'Chlorophyll captures light.' }, { start: 300, text: 'Glucose is produced.' }];
describe("video-summary prompt pack", () => {
  it('serializes dependent subtask prompts without changing their original wording', () => {
    const transcript = 'Transcript text';
    const pack = buildVideoPrompts({ transcript, segments, enableQuiz: true, enableFlashcards: true });
    const slot = { summary: 'Summary text', keyPoints: 'K1\nK2', topics: 'Biology' };
    const render = (parts: NonNullable<typeof pack.quiz>['parts']) => parts.map(part => 'text' in part ? part.text : slot[part.slot as keyof typeof slot]).join('');
    expect(pack.summary.user).toBe(buildVideoSummaryMessages(transcript, segments)[1].content);
    expect(pack.quotes.user).toBe(buildNotableQuotesMessages(segments)[1].content);
    expect(render(pack.quiz!.parts)).toBe(buildQuizQuestionsMessages(transcript, slot.summary, ['K1', 'K2'])[1].content);
    expect(render(pack.flashcards!.parts)).toBe(buildFlashcardsMessages(transcript, ['K1', 'K2'], ['Biology'])[1].content);
  });
  it("formats segment timestamps like the source", () => {
    expect(formatMinuteStamp(0)).toBe("[0:00]");
    expect(formatMinuteStamp(125.5)).toBe("[2:05]");
    expect(formatSecondStamp(125.5)).toBe("[125s]");
  });

  it("bounds summary inputs with the truncation marker", () => {
    const long = "x".repeat(16000);
    const messages = buildVideoSummaryMessages(long, segments);
    expect(messages[1]?.content).toContain("[truncated]");
    expect(messages[1]?.content).toContain("[2:05] Chlorophyll captures light.");
    const short = buildVideoSummaryMessages("short", segments);
    expect(short[1]?.content).not.toContain("[truncated]");
  });

  it("caps quote segments at 100 with second stamps", () => {
    const many = Array.from({ length: 150 }, (_, i) => ({ start: i, text: `line ${i}` }));
    const messages = buildNotableQuotesMessages(many);
    expect(messages[1]?.content).toContain("[0s] line 0");
    expect(messages[1]?.content).toContain("[99s] line 99");
    expect(messages[1]?.content).not.toContain("line 100");
  });

  it("grounds quiz and flashcards in summary outputs", () => {
    const quiz = buildQuizQuestionsMessages("transcript", "summary text", ["kp1"]);
    expect(quiz[1]?.content).toContain("Summary: summary text");
    expect(quiz[1]?.content).toContain("kp1");
    const cards = buildFlashcardsMessages("transcript", ["kp1"], ["Biology"]);
    expect(cards[1]?.content).toContain("Topics: Biology");
  });
});

