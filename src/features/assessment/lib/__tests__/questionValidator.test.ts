import { describe, expect, it } from 'vitest';
import { validateQuestion } from '../questionValidator';

const question = () => ({ text: 'Choose the correct value', options: ['One', 'Two', 'Three', 'Four'] });
const learnerDelivery = { requireCorrectAnswer: false };

describe('learner question validation', () => {
  it('accepts keyless learner questions while retaining strict answer validation by default', () => {
    expect(validateQuestion(question(), 'knowledge', learnerDelivery).isValid).toBe(true);
    expect(validateQuestion(question(), 'knowledge').errors).toContain('Missing correct answer');
  });
  it('accepts keyless Same/Different clerical questions', () => {
    expect(validateQuestion({ text: 'Compare ABC123 and ABC123', options: ['Same', 'Different'] }, 'aptitude', learnerDelivery).isValid).toBe(true);
  });
  it.each([
    { ...question(), text: '' },
    { ...question(), options: ['One'] },
    { ...question(), options: ['One', '', 'Three', 'Four'] },
    { ...question(), options: ['One', null, 'Three', 'Four'] },
  ])('still rejects malformed display content', input => {
    expect(validateQuestion(input, 'knowledge', learnerDelivery).isValid).toBe(false);
  });
});
