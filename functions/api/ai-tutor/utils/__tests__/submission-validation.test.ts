// @vitest-environment node
import {beforeEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({extract:vi.fn(),model:vi.fn()}));
vi.mock('../assignment-document',()=>({extractSubmittedDocument:mocks.extract}));
vi.mock('../saved-assessment',()=>({modelJson:mocks.model}));
import {validateAssignmentSubmission,InvalidSubmissionDocument} from '../submission-validation';
const id='00000000-0000-4000-8000-000000000001';
const questions=[{id,kind:'short_answer',prompt:'How do you plan?',options:[],maxMarks:10}];
const valid={matchesAssignment:true,evidence:[{questionId:id,excerpt:'How do you plan?'}],answers:[{questionId:id,answer:'Never plan.'}]};
beforeEach(()=>{vi.resetAllMocks();mocks.extract.mockResolvedValue('How do you plan? Answer: Never plan.');mocks.model.mockResolvedValue(valid);});
it('accepts an identifiable attempt even when its answer is wrong',async()=>{
 expect(await validateAssignmentSubmission(questions,'anything.txt',new Uint8Array([1]),'key')).toEqual(valid.answers);
});
it('rejects a different worksheet rather than grading it',async()=>{
 mocks.model.mockResolvedValue({...valid,matchesAssignment:false});
 await expect(validateAssignmentSubmission(questions,'same-title.docx',new Uint8Array([1]),'key')).rejects.toBeInstanceOf(InvalidSubmissionDocument);
});
it('rejects blank worksheets without answers',async()=>{
 mocks.model.mockResolvedValue({...valid,answers:[{questionId:id,answer:''}]});
 await expect(validateAssignmentSubmission(questions,'blank.txt',new Uint8Array([1]),'key')).rejects.toThrow('No completed answers');
});
it('fails closed when matching evidence is invented',async()=>{
 mocks.model.mockResolvedValue({...valid,evidence:[{questionId:id,excerpt:'Invented evidence'}]});
 await expect(validateAssignmentSubmission(questions,'answer.txt',new Uint8Array([1]),'key')).rejects.toThrow('could not be verified');
});
it('does not mistake provider failure for an invalid document',async()=>{
 mocks.model.mockRejectedValue(new Error('Provider unavailable'));
 await expect(validateAssignmentSubmission(questions,'answer.txt',new Uint8Array([1]),'key')).rejects.toThrow('Provider unavailable');
});
it('rejects duplicate or missing question mappings',async()=>{
 mocks.model.mockResolvedValue({...valid,answers:[]});
 await expect(validateAssignmentSubmission(questions,'answer.txt',new Uint8Array([1]),'key')).rejects.toThrow('mapping incomplete');
});

it('rejects answers invented by the mapper',async()=>{
 mocks.model.mockResolvedValue({...valid,answers:[{questionId:id,answer:'Invented learner response'}]});
 await expect(validateAssignmentSubmission(questions,'answer.txt',new Uint8Array([1]),'key')).rejects.toThrow('Copied answers could not be verified');
});
it('accepts a partially completed worksheet without inventing missing answers',async()=>{
 const second='00000000-0000-4000-8000-000000000002';
 mocks.model.mockResolvedValue({...valid,answers:[...valid.answers,{questionId:second,answer:''}]});
 expect(await validateAssignmentSubmission([...questions,{...questions[0],id:second}],'answer.txt',new Uint8Array([1]),'key')).toHaveLength(2);
});
