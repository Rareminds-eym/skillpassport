// @vitest-environment node
import {it,expect} from 'vitest';
import {materialRequestFingerprint,materialContextFingerprint,savedAssignmentMarkdown} from '../saved-materials';
it('matches normalized requests and settings but separates changed contexts',async()=>{
 expect(await materialRequestFingerprint('  Make Questions ',{b:2,a:1},null)).toBe(await materialRequestFingerprint('make questions',{a:1,b:2},null));
 expect(await materialRequestFingerprint('make questions',{a:2},null)).not.toBe(await materialRequestFingerprint('make questions',{a:1},null));
});
it('keeps private solutions behind protocol delimiters',()=>{
 const output=savedAssignmentMarkdown({questions:[{position:1,prompt:'Question',options:['A','B'],difficulty:'beginner'}]},[{questionId:'q',acceptedAnswers:['B'],rubric:'Correct'}]);
 expect(output.split('<!-- PRIVATE_SOLUTIONS -->')[0]).not.toContain('Correct');
 expect(output).toContain('<!-- END_WORKSHEET -->');
});

it('invalidates reuse for changed course descriptions or video evidence, not cache refresh timestamps',async()=>{
 let description='Original',transcript='Video one',timestamp='2026-11-01';
 const db={from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,in:()=>q,order:()=>q,single:async()=>({data:{course_id:'course',description}}),then:(resolve:(v:unknown)=>void)=>resolve({data:table==='course_modules'?[{module_id:'module'}]:table==='lessons'?[{lesson_id:'lesson'}]:table==='video_summaries'?[{lesson_id:'lesson',transcript}]:table==='lesson_resources'?[{content:'[COURSE_RESOURCE_ANALYSIS_V1]\n'+JSON.stringify({model:'model',url:'url',text:'Evidence',analyzedAt:timestamp})}]:[],error:null})};return q;}};
 const first=await materialContextFingerprint(db as never,'course');timestamp='2026-11-03';
 expect(await materialContextFingerprint(db as never,'course')).toBe(first);
 transcript='Updated video';expect(await materialContextFingerprint(db as never,'course')).not.toBe(first);
 transcript='Video one';description='Changed';expect(await materialContextFingerprint(db as never,'course')).not.toBe(first);
});
