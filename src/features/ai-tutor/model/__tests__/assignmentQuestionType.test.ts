import { expect, it } from 'vitest';
import { assignmentQuestionType } from '../assignmentQuestionType';
it('uses actual question types before the generation template',()=>{
 expect(assignmentQuestionType([{kind:'multiple_choice'}],'comprehensive')).toBe('Multiple choice');
 expect(assignmentQuestionType([{kind:'short_answer'},{kind:'descriptive'}])).toBe('Mixed question types');
 expect(assignmentQuestionType([{kind:'fill_blank'}])).toBe('Fill in the blank');
});
it('falls back to saved legacy configuration without inventing a type',()=>{
 expect(assignmentQuestionType([{}],'short_answer')).toBe('Short answer');
 expect(assignmentQuestionType([], 'comprehensive')).toBe('Mixed question types');
 expect(assignmentQuestionType([{}])).toBe('Question type unavailable');
});
