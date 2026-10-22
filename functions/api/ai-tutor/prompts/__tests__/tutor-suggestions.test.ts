import { describe, expect, it } from 'vitest';
import { buildTutorSuggestionsMessages, buildTutorSuggestionsPrompt } from '../tutor-suggestions';

describe('SkillPassport tutor-suggestions prompt ownership', () => {
  it('preserves the original single user-message template', () => {
    const input = { lessonTitle: 'Fractions', moduleTitle: 'Arithmetic', lessonContent: 'A fraction is a part.' };
    const prompt = buildTutorSuggestionsPrompt(input);
    expect(prompt).toMatchObject({ id: 'seniorEducator.suggest', version: '1.0.0' });
    expect(prompt.system).toBeUndefined();
    expect(prompt.user).toContain('## Lesson: Fractions');
    expect(prompt.user).toContain('## Module: Arithmetic');
    expect(prompt.user).toContain('Connect this lesson to broader course themes');
    expect(prompt.user).toContain('["Question 1?", "Question 2?", "Question 3?"]');
    expect(buildTutorSuggestionsMessages(input)).toEqual([{ role: 'user', content: prompt.user }]);
  });
});
