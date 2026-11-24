import { describe, expect, it } from 'vitest';
import { compactVoiceContext, isContextOverflow } from '../voice-context';

describe('voice context recovery', () => {
  it('bounds long history while preserving instructions, current question and stored input', () => {
    const messages = [{ role: 'system', content: 'Course evidence and instructions' }, ...Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x'.repeat(10000) })), { role: 'user', content: 'Explain that again' }];
    const before = JSON.stringify(messages);
    const result = compactVoiceContext(messages, 24000);
    expect(result[0]).toEqual(messages[0]);
    expect(result.at(-1)).toEqual(messages.at(-1));
    expect(result.reduce((n, item) => n + item.content.length, 0)).toBeLessThanOrEqual(24000);
    expect(JSON.stringify(messages)).toBe(before);
  });
  it('recognizes context errors without retrying quota or rate limits', () => {
    expect(isContextOverflow(400, 'context_length_exceeded')).toBe(true);
    expect(isContextOverflow(400, 'maximum context length exceeded')).toBe(true);
    expect(isContextOverflow(402, 'context limit')).toBe(false);
    expect(isContextOverflow(429, 'too many tokens')).toBe(false);
    expect(isContextOverflow(400, 'Invalid model')).toBe(false);
  });
});
