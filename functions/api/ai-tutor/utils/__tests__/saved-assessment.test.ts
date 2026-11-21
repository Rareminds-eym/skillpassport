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

const valid=(difficulty='intermediate')=>({kind:'short_answer',prompt:'Calculate discharge',options:[],maxMarks:2,difficulty,skills:[],acceptedAnswers:['8 cubic metres per second'],rubric:'Use area times velocity',explanation:'Multiply area by velocity'});
const modelResponse=(questions:unknown[])=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({questions})}}]});
it('retries a partial multi-difficulty conversion with explicit count guidance',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(modelResponse([valid()])).mockResolvedValueOnce(modelResponse([valid('beginner'),valid()]));vi.stubGlobal('fetch',fetcher);
 try{
  const result=await structureSavedWorksheet([{difficulty:'beginner',studentContent:'Q1',solutions:'A1'},{difficulty:'intermediate',studentContent:'Q2',solutions:'A2'}],{questionCount:1},'test');
  expect(result.questions).toHaveLength(2);expect(result.rules).toHaveLength(2);
  expect(JSON.parse(fetcher.mock.calls[1][1].body).messages[0].content).toContain('exactly 2 questions');
 }finally{vi.unstubAllGlobals();}
});
it('rejects persistent difficulty loss even if the total count is correct',async()=>{
 const fetcher=vi.fn().mockImplementation(async()=>modelResponse([valid(),valid()]));vi.stubGlobal('fetch',fetcher);
 try{await expect(structureSavedWorksheet([{difficulty:'beginner',studentContent:'Q1',solutions:'A1'},{difficulty:'intermediate',studentContent:'Q2',solutions:'A2'}],{questionCount:1},'test')).rejects.toThrow('Worksheet conversion failed validation');expect(fetcher).toHaveBeenCalledTimes(2);}finally{vi.unstubAllGlobals();}
});
it.each([401,402,403,429])('does not blindly retry provider access or quota errors (%s)',async status=>{
 const fetcher=vi.fn().mockImplementation(async()=>new Response('private provider details',{status}));vi.stubGlobal('fetch',fetcher);
 try{await expect(structureSavedWorksheet([{difficulty:'intermediate',studentContent:'Q',solutions:'A'}],{questionCount:1},'test')).rejects.toMatchObject({name:'AssessmentModelError',reason:'provider',status});expect(fetcher).toHaveBeenCalledTimes(1);}finally{vi.unstubAllGlobals();}
});
it('retries an incomplete model answer once',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(Response.json({choices:[{finish_reason:'length',message:{content:'partial'}}]})).mockResolvedValueOnce(modelResponse([valid()]));vi.stubGlobal('fetch',fetcher);
 try{expect((await structureSavedWorksheet([{difficulty:'intermediate',studentContent:'Q',solutions:'A'}],{questionCount:1},'test')).questions).toHaveLength(1);}finally{vi.unstubAllGlobals();}
});
