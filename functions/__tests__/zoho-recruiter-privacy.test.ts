// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn()}));
vi.mock('../lib/auth',()=>({withAuth:(handler:unknown)=>handler,getContextUser:()=>({id:'recruiter',sub:'recruiter',org_id:'org'})}));
vi.mock('../lib/supabase',()=>({getServiceClient:()=>({from:mocks.from,rpc:mocks.rpc})}));
vi.mock('../lib/org-ownership',()=>({getActiveOrgId:async()=> 'org',getOrgMemberUserIds:async()=>['recruiter'],getOrgOwnedOpportunityIds:async()=>['job'],assertInterviewAccess:vi.fn(),getInterviewRow:vi.fn(),ALLOWED_REQUISITION_STATUSES:['draft','open','closed','on_hold']}));
import {onRequest} from '../api/recruiter/actions';
import {onRequestPost} from '../api/recruiter-copilot';
const legacy={id:'legacy-learner',user_id:'legacy-user',name:'Public Learner',email:'public@fixture.example',contact_number:'123'};
const privateRow={id:'private-learner',user_id:'private-user',name:'Private Learner',email:'private@fixture.example',contact_number:'456'};
let failure=false;
function chain(table:string){
 const q:any={};let key:unknown;
 for(const method of ['select','in','not','limit','order','ilike','update','delete'])q[method]=vi.fn(()=>q);
 q.eq=vi.fn((_column:string,value:unknown)=>{key=value;return q;});
 const value=()=>({data:failure?null:table==='zoho_recruiter_learners'?(key===privateRow.id||key===privateRow.user_id?[]:[legacy]):table==='learners'?[privateRow,legacy]:[],error:failure?{code:'XX000',message:'unavailable'}:null});
 q.then=(resolve:any,reject:any)=>Promise.resolve(value()).then(resolve,reject);
 q.single=q.maybeSingle=async()=>{const r=value();return {...r,data:r.data?.[0]??null};};
 return q;
}
async function request(handler:any,body:unknown){return handler({request:new Request('https://app.fixture.example/api/recruiter/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),env:{},data:{user:{}}});}
beforeEach(()=>{vi.clearAllMocks();failure=false;mocks.from.mockImplementation(chain);mocks.rpc.mockResolvedValue({data:{success:true},error:null});});
describe('private imported candidate discovery',()=>{
 it('lists public profiles using the server-only filtered relation',async()=>{
  const response=await request(onRequest,{action:'list-learners'});
  expect(response.status).toBe(200);const body=await response.json();
  expect(body.data).toEqual([{...legacy,email:null,contact_number:null}]);
  expect(JSON.stringify(body)).not.toContain(privateRow.name);
  expect(mocks.from).not.toHaveBeenCalledWith('learners');
 });
 it.each(['get-learner','unlock-candidate-contact','check-candidate-unlocked'])('never reads or unlocks a private profile via %s',async action=>{
  const response=await request(onRequest,{action,learnerId:privateRow.id,candidateId:privateRow.id});
  expect(response.status).toBe(action==='check-candidate-unlocked'?200:404);
  expect(JSON.stringify(await response.json())).not.toContain(privateRow.name);
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.from).not.toHaveBeenCalledWith('learners');
 });
 it.each(['fetch-learners','fetch-learners-basic','fetch-learners-enriched'])('keeps private profiles out of copilot %s',async action=>{
  const response=await request(onRequestPost,{action});expect(response.status).toBe(200);
  expect((await response.json()).data).toEqual([expect.objectContaining({name:legacy.name})]);
  expect(mocks.from).toHaveBeenCalledWith('zoho_recruiter_learners');
  expect(mocks.from).not.toHaveBeenCalledWith('learners');
 });
 it('fails closed when the filtered relation is unavailable',async()=>{
  failure=true;const response=await request(onRequest,{action:'list-learners'});
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(JSON.stringify(await response.json())).not.toContain(privateRow.email);
  expect(mocks.from).not.toHaveBeenCalledWith('learners');
 });
});

it('rich recruiter discovery retains the filtered parent and locked-contact masking',async()=>{
 const response=await request(onRequest,{action:'list-learners',include_details:true});
 expect(response.status).toBe(200);
 expect((await response.json()).data).toEqual([{...legacy,email:null,contact_number:null}]);
 const index=mocks.from.mock.calls.findIndex(call=>call[0]==='zoho_recruiter_learners');
 const query=mocks.from.mock.results[index].value;
 expect(query.select).toHaveBeenCalledWith(expect.stringContaining('skills!skills_learner_id_fkey'));
 expect(query.select.mock.calls[0][0]).not.toMatch(/guardian|alternate_number|date_of_birth/);
 expect(query.eq).toHaveBeenCalledWith('is_deleted',false);
 expect(query.limit).toHaveBeenCalledWith(500);
 expect(mocks.from).not.toHaveBeenCalledWith('learners');
});
it('rejects an invalid rich-discovery flag',async()=>{
 const response=await request(onRequest,{action:'list-learners',include_details:'true'});
 expect(response.status).toBe(400);
 expect(mocks.from).not.toHaveBeenCalledWith('zoho_recruiter_learners');
});
