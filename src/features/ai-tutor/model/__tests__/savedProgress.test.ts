import { it, expect } from 'vitest';
import { summarizeAssignmentProgress } from '../savedProgress';
it('bases learning gaps on released results only', () => {
  const row = { assignment: { id: 'assignment', content: { questions: [{ id: 'q', prompt: 'Explain', maxMarks: 4, skills: ['Planning'] }] } }, submissions: [{ results: [{ status: 'review_required', total_marks: 4, maximum_marks: 4 }] }] };
  expect(summarizeAssignmentProgress([row]).average).toBeNull();
  const released = { ...row, submissions: [{ results: [{ status: 'released', total_marks: 2, maximum_marks: 4, question_results: { review: [{ questionId: 'q', marks: 2 }] } }] }] };
  expect(summarizeAssignmentProgress([row, released])).toMatchObject({ assigned: 2, submitted: 2, released: 1, average: 50, gaps: [{ question: 'Explain', marks: 2, maximum: 4, responses: 1 }] });
});
