import { expect, it } from 'vitest';
import { answerExplanation } from '../answerExplanation';

it('hides repeated plain and formatted answers', () => {
  expect(answerExplanation('Correct answer is Laminar flow.', ['Laminar flow'])).toBe('');
  expect(answerExplanation(String.raw`Correct answer is \(Q = A \times v\).`, [String.raw`\(Q = A \times v\)`])).toBe('');
  expect(answerExplanation('**Answer:** Laminar flow.', ['Laminar flow'])).toBe('');
});

it('preserves useful explanations and rubric-only guidance', () => {
  const rubric = 'Correct answer is Laminar flow. Award a mark for explaining the flow pattern.';
  expect(answerExplanation(rubric, ['Laminar flow'])).toBe(rubric);
  expect(answerExplanation('Award marks for the correct method.')).toBe('Award marks for the correct method.');
  expect(answerExplanation(undefined)).toBe('');
});
