import { expect, it } from 'vitest';
import { assignmentScores } from '../assignmentScores';
it('preserves the AI total after repeated educator adjustments including zero', () => {
  expect(assignmentScores({ status:'released', total_marks:0, maximum_marks:100, reviewed_by:'teacher', question_results:{ ai:[{marks:40},{marks:40}], educator_override:{marks:0} } })).toEqual({ai:80,educator:0,final:0,maximum:100});
});
it('shows unreviewed AI marks without inventing educator marks', () => {
  expect(assignmentScores({status:'released',total_marks:80,maximum_marks:100})).toEqual({ai:80,educator:null,final:80,maximum:100});
});
it('handles older nested reviews and unavailable original marks', () => {
  expect(assignmentScores({status:'released',total_marks:90,maximum_marks:100,reviewed_by:'teacher',question_results:{ai:{ai:[{marks:75}]}}})?.ai).toBe(75);
  expect(assignmentScores({status:'released',total_marks:90,maximum_marks:100,reviewed_by:'teacher'})?.ai).toBeNull();
  expect(assignmentScores({status:'evaluating',total_marks:90,maximum_marks:100})).toBeNull();
});
