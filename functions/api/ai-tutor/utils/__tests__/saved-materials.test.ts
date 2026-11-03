// @vitest-environment node
import {it,expect} from 'vitest';
import {materialRequestFingerprint,savedAssignmentMarkdown} from '../saved-materials';
it('matches normalized requests and settings but separates changed contexts',async()=>{
 expect(await materialRequestFingerprint('  Make Questions ',{b:2,a:1},null)).toBe(await materialRequestFingerprint('make questions',{a:1,b:2},null));
 expect(await materialRequestFingerprint('make questions',{a:2},null)).not.toBe(await materialRequestFingerprint('make questions',{a:1},null));
});
it('keeps private solutions behind protocol delimiters',()=>{
 const output=savedAssignmentMarkdown({questions:[{position:1,prompt:'Question',options:['A','B'],difficulty:'beginner'}]},[{questionId:'q',acceptedAnswers:['B'],rubric:'Correct'}]);
 expect(output.split('<!-- PRIVATE_SOLUTIONS -->')[0]).not.toContain('Correct');
 expect(output).toContain('<!-- END_WORKSHEET -->');
});
