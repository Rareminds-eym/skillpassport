// @vitest-environment node
import {it,expect,vi} from 'vitest';
import {gradeObjective,evaluateQuestions,structureSavedWorksheet} from '../saved-assessment';
const q={id:'00000000-0000-4000-8000-000000000001',kind:'multiple_choice',prompt:'Choose',options:['A','B'],max_marks:2,accepted_answers:['B'],rubric:'B earns two',explanation:'B is correct',answer:' b '};
it('grades objective answers deterministically and does not award marks for blanks',()=>{
 expect(gradeObjective(q).marks).toBe(2);expect(gradeObjective({...q,answer:''}).marks).toBe(0);
});
it('rejects descriptive model marks above the rubric maximum',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({results:[{questionId:q.id,marks:99,feedback:'Unsupported',needsReview:false}]})}}]})));
 try{await expect(evaluateQuestions([{...q,kind:'descriptive'}],'test')).rejects.toThrow('outside');}finally{vi.unstubAllGlobals();}
});

it('retries invalid worksheet output and reports conversion failure instead of request validation',async()=>{
 const fetcher=vi.fn().mockImplementation(async()=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({questions:[{kind:'mcq'}]})}}]}));
 vi.stubGlobal('fetch',fetcher);
 try {
   await expect(structureSavedWorksheet([{difficulty:'intermediate',studentContent:'Question',solutions:'Answer'}],{},'test')).rejects.toThrow('Worksheet conversion failed validation');
   expect(fetcher).toHaveBeenCalledTimes(2);
 } finally {vi.unstubAllGlobals();}
});
