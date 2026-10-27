// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { splitWorksheetContent } from '../../utils/worksheet-content';
describe('generated worksheet separation', () => {
  it('keeps generated questions separate from private answers', () => {
    expect(splitWorksheetContent('<!-- STUDENT_WORKSHEET -->\nQuestions\n<!-- PRIVATE_SOLUTIONS -->\nPRIVATE ANSWERS\n<!-- END_WORKSHEET -->'))
      .toEqual({ studentContent: 'Questions', solutions: 'PRIVATE ANSWERS' });
  });
  it('interprets escaped and code-wrapped markers without leaking private answers', () => {
    expect(splitWorksheetContent('```markdown\n`&lt;!-- STUDENT_WORKSHEET --&gt;`\nQuestions\n`<!-- PRIVATE_SOLUTIONS -->`\nPrivate answers\n`<!-- END_WORKSHEET -->`\n```'))
      .toEqual({ studentContent: 'Questions', solutions: 'Private answers' });
  });
  it('accepts empty private content when no answers were requested', () => {
    expect(splitWorksheetContent('<!-- STUDENT_WORKSHEET -->Questions<!-- PRIVATE_SOLUTIONS --><!-- END_WORKSHEET -->').solutions).toBe('');
  });
  it('prepares an existing blank worksheet with a separate Markdown answer key', () => {
    const text = 'Title: Time management\nWord Bank:\n1. goals\n2. tasks\nQuestions:\n1. Set clear ______.\n2. Prioritize your ______.\n\n**Answer Key:**\n1. goals\n2. tasks';
    const split = splitWorksheetContent(text, { templateType: 'fill_in_blank', questionCount: 2, includeAnswerKey: true });
    expect(split.studentContent).toContain('Prioritize your ______.');
    expect(split.studentContent).not.toContain('Answer Key');
    expect(split.solutions).toContain('1. goals');
  });
  it('does not accept inline answers or a mismatched question count in legacy content', () => {
    const options = { templateType: 'fill_in_blank', questionCount: 1, includeAnswerKey: true };
    expect(() => splitWorksheetContent('1. Set ______. Answer: goals\nAnswer Key:\n1. goals', options)).toThrow();
    expect(() => splitWorksheetContent('1. Set ______.\nAnswer Key:\n1. goals', { ...options, questionCount: 2 })).toThrow();
  });
  it('permits verified question-only legacy content only when no answer key was requested', () => {
    expect(splitWorksheetContent('1. Set ______.', { templateType: 'fill_in_blank', questionCount: 1, includeAnswerKey: false }).solutions).toBe('');
    expect(() => splitWorksheetContent('1. Set ______.', { templateType: 'fill_in_blank', questionCount: 1, includeAnswerKey: true })).toThrow();
  });
  it.each(['Questions with mixed answers', '<!-- STUDENT_WORKSHEET --><!-- PRIVATE_SOLUTIONS -->Answers<!-- END_WORKSHEET -->', '<!-- STUDENT_WORKSHEET -->Questions<!-- PRIVATE_SOLUTIONS -->Answers'])('rejects content without reliable separation', content => {
    expect(() => splitWorksheetContent(content)).toThrow();
  });
});
