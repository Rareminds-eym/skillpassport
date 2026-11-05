// @vitest-environment node
import {beforeEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({access:vi.fn(),extract:vi.fn(),get:vi.fn(),row:{} as any}));
vi.mock('../course-index',()=>({requireCourseAccess:mocks.access}));
vi.mock('../assignment-document',()=>({SUBMISSION_MAX_BYTES:5242880,extractSubmittedDocument:mocks.extract}));
import {loadGuideEvidence} from '../guide-evidence';
const id='00000000-0000-4000-8000-000000000001';
const query:any={select:()=>query,eq:()=>query,single:async()=>({data:mocks.row,error:null})};
const db={from:()=>query} as any;
const env={AI_ASSIGNMENTS_ENABLED:'true',R2_BUCKET:{get:mocks.get}} as any;
beforeEach(()=>{vi.clearAllMocks();mocks.access.mockResolvedValue(true);mocks.extract.mockResolvedValue('My submitted answer: plan tasks.');mocks.get.mockResolvedValue({size:30,arrayBuffer:async()=>new ArrayBuffer(1)});mocks.row={id,file_key:'private/key',file_name:'response.txt',recipient:{assigned_by:'teacher',learner:{name:'Alex'},assignment:{course_id:'course',title:'Planning',content:{questions:[{prompt:'Explain planning'}]},grading_rules:[{rubric:'Prioritize tasks'}]}},results:{status:'released',total_marks:2}};});
it('loads the actual submitted response, rubric and saved evaluation',async()=>{
 const result=await loadGuideEvidence(db,env,'teacher','course',id);
 expect(result).toContain('My submitted answer: plan tasks.');expect(result).toContain('Prioritize tasks');expect(result).toContain('"total_marks":2');expect(result).toContain('untrusted evidence');
});
it.each(['other-educator','other-course'])('rejects %s before accessing private storage',async(kind)=>{
 if(kind==='other-educator')mocks.row.recipient.assigned_by='other';else mocks.row.recipient.assignment.course_id='other';
 await expect(loadGuideEvidence(db,env,'teacher','course',id)).rejects.toMatchObject({status:403});expect(mocks.get).not.toHaveBeenCalled();
});
it('rejects course access failure and invalid selection',async()=>{
 mocks.access.mockResolvedValue(false);await expect(loadGuideEvidence(db,env,'teacher','course',id)).rejects.toMatchObject({status:403});
 await expect(loadGuideEvidence(db,env,'teacher','course','invalid')).rejects.toMatchObject({status:400});expect(mocks.get).not.toHaveBeenCalled();
});
it('reports an unreadable response instead of fabricating evidence',async()=>{
 mocks.extract.mockRejectedValue(new Error('unreadable'));await expect(loadGuideEvidence(db,env,'teacher','course',id)).rejects.toMatchObject({status:422});
});
