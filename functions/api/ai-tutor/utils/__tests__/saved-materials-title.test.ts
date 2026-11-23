// @vitest-environment node
import { expect, it } from 'vitest';
import { assignmentDisplayTitle } from '../saved-materials';
it('uses all saved questions and levels instead of the first section heading',()=>{
 const questions=['beginner','intermediate','advanced'].flatMap(difficulty=>Array.from({length:5},()=>({difficulty})));
 expect(assignmentDisplayTitle('Intermediate - 5 questions',questions)).toBe('Mixed difficulty - 15 questions');
});
it('uses the actual single-level count and singular wording',()=>{
 expect(assignmentDisplayTitle('Intermediate - 5 questions',[{difficulty:'intermediate'}])).toBe('Intermediate - 1 question');
});
it('preserves custom titles and empty legacy content',()=>{
 expect(assignmentDisplayTitle('River hydraulics practice',[{difficulty:'advanced'}])).toBe('River hydraulics practice');
 expect(assignmentDisplayTitle('Intermediate - 5 questions',[])).toBe('Intermediate - 5 questions');
});
