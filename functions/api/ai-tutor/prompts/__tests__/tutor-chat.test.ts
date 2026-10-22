import { describe, expect, it } from 'vitest';
import { buildTutorChatPrompt } from '../tutor-chat';
import type { TutorCourseContext } from '@rareminds-eym/ai-protocol';

const course = { courseTitle: 'Biology 101', courseDescription: 'Intro to cells', currentLesson: null, availableResources: [] } as unknown as TutorCourseContext;
describe('SkillPassport tutor chat prompt ownership', () => {
  it.each([{ count: 0, marker: 'FIRST MESSAGE BEHAVIOR' }, { count: 4, marker: 'EARLY CONVERSATION' }, { count: 5, marker: 'DEEP CONVERSATION' }])('retains product phase wording for history length $count', ({ count, marker }) => {
    const prompt = buildTutorChatPrompt({ course, history: Array.from({ length: count }, () => ({ role: 'user', content: 'prior question' })), message: 'What is a cell?', userRole: 'learner' });
    expect(prompt.id).toBe('seniorEducator.tutor-chat');
    expect(prompt.version).toBe('1.0.0');
    expect(prompt.system).toContain('tutor for learners studying "Biology 101"');
    expect(prompt.system).toContain(marker);
    expect(prompt.user).toBe('What is a cell?');
  });
  it('preserves the lesson excerpt and key-point caps in the product prompt', () => {
    const prompt = buildTutorChatPrompt({ course: { ...course, currentLesson: { title: 'Cells', moduleTitle: 'Biology', content: 'x'.repeat(700) }, videoSummary: { keyPoints: ['A', 'B', 'C', 'D'] } } as TutorCourseContext, history: [], message: 'Explain cells' });
    expect(prompt.system).toContain('x'.repeat(500) + '...');
    expect(prompt.system).not.toContain('x'.repeat(501));
    expect(prompt.system).toContain('- A\n- B\n- C');
    expect(prompt.system).not.toMatch(/^- D$/m);
  });
});
