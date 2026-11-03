// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ db: null as any }));
vi.mock('../../../../lib/auth', () => ({ getServiceClient: () => mocks.db, getContextUser: (context: any) => context.data.user }));
import { handleSavedMaterials } from '../saved-materials';
import { handleAssignmentSubmission } from '../assignment-submission';

const teacher='00000000-0000-4000-8000-000000000001', student='00000000-0000-4000-8000-000000000002';
const course='00000000-0000-4000-8000-000000000003', conversation='00000000-0000-4000-8000-000000000004', message='00000000-0000-4000-8000-000000000005', learner='00000000-0000-4000-8000-000000000006';
let tables: Record<string,any[]>, objects: Map<string,Uint8Array>, failModel: boolean;
function at(row:any,path:string) { return path.split('.').reduce((value,key)=>value?.[key],row); }
function joined(table:string,row:any) {
  if(table==='ai_assignment_learners') {
    const assignment=tables.ai_assignments.find(a=>a.id===row.assignment_id);
    return {...row,assignment:{id:assignment.id,title:assignment.title,course_id:assignment.course_id,content:assignment.content},learner:tables.learners.find(l=>l.id===row.learner_id),submissions:tables.ai_assignment_submissions.filter(s=>s.assignment_learner_id===row.id).map(s=>joined('ai_assignment_submissions',s))};
  }
  if(table==='ai_assignment_submissions') {
    const recipient=tables.ai_assignment_learners.find(a=>a.id===row.assignment_learner_id);
    return {...row,recipient:{...recipient,learner:tables.learners.find(l=>l.id===recipient.learner_id),assignment:tables.ai_assignments.find(a=>a.id===recipient.assignment_id)},results:tables.ai_assignment_results.filter(r=>r.submission_id===row.id)};
  }
  if(table==='ai_assignment_results') {
    const submission=tables.ai_assignment_submissions.find(s=>s.id===row.submission_id);
    const recipient=tables.ai_assignment_learners.find(a=>a.id===submission?.assignment_learner_id);
    return {...row,submission:{...submission,recipient:{...recipient,assignment:tables.ai_assignments.find(a=>a.id===recipient?.assignment_id)}}};
  }
  return row;
}

/** In-memory query adapter exercises the real handlers/evaluator; SQL RPC semantics are tested separately in Postgres. */
function query(table:string) {
  const filters: Array<(row:any)=>boolean>=[];let operation='read',payload:any;
  const run=()=>{
    if(operation==='insert') {
      const row={id:crypto.randomUUID(),...payload};tables[table].push(row);return [row];
    }
    const matching=(tables[table]||[]).filter(row=>filters.every(filter=>filter(joined(table,row))));
    if(operation==='update')for(const row of matching)Object.assign(row,payload);
    // A real REST response is a separate object; client-side privacy projection must not mutate stored results.
    return JSON.parse(JSON.stringify(matching.map(row=>joined(table,row))));
  };
  const q:any={select:()=>q,order:()=>q,limit:()=>q,eq:(key:string,value:unknown)=>{filters.push(row=>at(row,key)===value);return q;},in:(key:string,values:any[])=>{filters.push(row=>values.includes(at(row,key)));return q;},insert:(value:any)=>{operation='insert';payload=value;return q;},update:(value:any)=>{operation='update';payload=value;return q;},
    single:async()=>{const rows=run();return rows.length?{data:rows[0],error:null}:{data:null,error:{code:'PGRST116'}};},maybeSingle:async()=>({data:run()[0]||null,error:null}),then:(resolve:(value:any)=>void)=>resolve({data:run(),error:null})};
  return q;
}
function context(userId:string,request:Request) {
  return {request,data:{user:{id:userId}},env:{AI_ASSIGNMENTS_ENABLED:'true',OPENROUTER_API_KEY:'test-only',R2_BUCKET:{
    put:vi.fn(async(key:string,bytes:Uint8Array)=>{objects.set(key,bytes);}),delete:vi.fn(async(key:string)=>{objects.delete(key);}),get:vi.fn(async(key:string)=>{const bytes=objects.get(key);return bytes?{size:bytes.length,body:bytes,arrayBuffer:async()=>bytes.slice().buffer}:null;})}}} as never;
}
async function action(userId:string,name:string,data:Record<string,unknown>={}) {
  const response=await handleSavedMaterials(context(userId,new Request('https://test/materials',{method:'POST',body:JSON.stringify({action:name,courseId:course,...data})})));
  return {response,body:await response.json() as any};
}
beforeEach(()=>{
  objects=new Map();failModel=false;
  tables={users:[{id:teacher,role:'college_educator'},{id:student,role:'learner'}],learners:[{id:learner,user_id:student,name:'Synthetic learner'}],tutor_conversations:[{id:conversation,learner_id:teacher,course_id:course,messages:[{id:'request',role:'user',content:'Generate questions'},{id:message,role:'assistant',materialRequestFingerprint:'request',materialContextFingerprint:'context',content:'Synthetic worksheet',worksheetConfig:{questionCount:2},worksheetVariants:[{difficulty:'beginner',content:'<!-- STUDENT_WORKSHEET -->\n1. Choose a time management strategy.\nA) Plan\nB) Delay\n2. Explain planning.\n<!-- PRIVATE_SOLUTIONS -->\n1. Plan\n2. Prioritize and allocate time.\n<!-- END_WORKSHEET -->'}]}]}],ai_assignments:[],ai_lesson_plans:[],ai_assignment_learners:[],ai_assignment_submissions:[],ai_assignment_results:[]};
  mocks.db={from:query,rpc:vi.fn(async(name:string,p:any)=>{
    if(name==='can_access_course_ai')return {data:p.p_user_id===teacher,error:null};
    if(name==='set_ai_material_choice'){const source=tables.tutor_conversations.find(c=>c.id===p.p_conversation&&c.learner_id===p.p_user);if(!source)return {data:false};source.messages.find((m:any)=>m.id===p.p_message).materialChoice=p.p_choice;return {data:true};}
    if(name==='allocate_saved_ai_assignment'){
      for(const id of p.p_learners)if(!tables.ai_assignment_learners.some(r=>r.assignment_id===p.p_assignment&&r.learner_id===id))tables.ai_assignment_learners.push({id:crypto.randomUUID(),assignment_id:p.p_assignment,learner_id:id,assigned_by:p.p_user,due_at:p.p_due});
      return {data:p.p_learners.length,error:null};
    }
    if(name==='commit_ai_submission'){
      tables.ai_assignment_submissions.push({id:p.p_id,assignment_learner_id:p.p_recipient,file_key:p.p_key,file_name:p.p_name,mime_type:p.p_mime});
      tables.ai_assignment_results.push({id:crypto.randomUUID(),submission_id:p.p_id,status:'pending',question_results:[]});return {data:p.p_id,error:null};
    }
    if(name==='release_saved_ai_result'){
      const result=tables.ai_assignment_results.find(r=>r.id===p.p_result);
      result.question_results={ai:result.question_results,review:p.p_results};result.total_marks=p.p_results.reduce((sum:number,r:any)=>sum+r.marks,0);result.status='released';result.feedback=p.p_feedback;result.released_at=new Date().toISOString();return {data:null,error:null};
    }
    throw new Error(`Unexpected RPC ${name}`);
  })};
  vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{
    const body=JSON.parse(String(init?.body)),prompt=body.messages[0].content,input=JSON.parse(body.messages[1].content);
    let result:any;
    if(prompt.startsWith('Convert'))result={questions:[{kind:'multiple_choice',prompt:'Choose a strategy',options:['Plan','Delay'],maxMarks:2,difficulty:'beginner',skills:['Planning'],acceptedAnswers:['Plan'],rubric:'Plan earns two',explanation:'Planning is effective'},{kind:'descriptive',prompt:'Explain planning',options:[],maxMarks:2,difficulty:'beginner',skills:['Planning'],acceptedAnswers:[],rubric:'Prioritizing and allocating time',explanation:'Both help'}]};
    else if(prompt.startsWith('Copy')){if(failModel)return new Response('Unavailable',{status:503});result={answers:input.questions.map((q:any,i:number)=>({questionId:q.id,answer:i===0?'A':'Prioritize tasks and allocate time'}))};}
    else if(prompt.startsWith('Evaluate'))result={results:input.map((q:any)=>({questionId:q.id,marks:1,feedback:'Add detail',needsReview:true}))};
    else throw new Error('Unexpected model request');
    return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]});
  }));
});
afterEach(()=>vi.unstubAllGlobals());
async function saveAndAllocate() {
  const saved=await action(teacher,'save',{conversationId:conversation,messageId:message});expect(saved.response.status).toBe(200);
  const assignmentId=saved.body.data.id;
  const again=await action(teacher,'save',{conversationId:conversation,messageId:message});expect(again.body.data.id).toBe(assignmentId);expect(tables.ai_assignments).toHaveLength(1);
  const allocation=await action(teacher,'allocate',{assignmentId,learnerIds:[learner],dueAt:'2099-01-01T00:00:00.000Z',reviewed:true});expect(allocation.response.status).toBe(200);
  expect(tables.ai_assignment_learners).toHaveLength(1);
  return tables.ai_assignment_learners[0].id;
}
async function submit(recipientId:string) {
  const form=new FormData();form.set('recipientId',recipientId);form.set('file',new File(['1. A\n2. Prioritize tasks and allocate time'],'completed.txt',{type:'text/plain'}));
  return handleAssignmentSubmission(context(student,new Request('https://test/submission',{method:'POST',body:form})));
}
it('persists generated material, allocation, R2 file reference and evaluation, then releases reviewed feedback',async()=>{
  const recipientId=await saveAndAllocate();
  const response=await submit(recipientId);expect(response.status).toBe(200);
  expect(tables.ai_assignment_submissions).toHaveLength(1);expect(objects.size).toBe(1);
  expect(tables.ai_assignment_submissions[0].file_name).toBe('completed.txt');
  expect(objects.has(tables.ai_assignment_submissions[0].file_key)).toBe(true);
  expect(tables.ai_assignment_results[0]).toMatchObject({status:'review_required',total_marks:3,maximum_marks:4});
  expect(tables.ai_assignment_results[0].question_results).toHaveLength(2);
  const hidden=await action(student,'deliveries');expect(hidden.body.data[0].submissions[0].results[0]).not.toHaveProperty('total_marks');
  const result=tables.ai_assignment_results[0];
  const release=await action(teacher,'release',{resultId:result.id,results:tables.ai_assignments[0].content.questions.map((q:any)=>({questionId:q.id,marks:2,reason:'Reviewed original document'})),feedback:'Well done'});
  expect(release.response.status).toBe(200);
  const visible=await action(student,'deliveries');expect(visible.body.data[0].submissions[0].results[0]).toMatchObject({status:'released',total_marks:4,feedback:'Well done'});
  expect((await submit(recipientId)).status).toBe(200);expect(tables.ai_assignment_submissions).toHaveLength(1);expect(objects.size).toBe(1);
});
it('stores failed evaluation state and keeps the submitted document when the model fails',async()=>{
  const recipientId=await saveAndAllocate();failModel=true;
  expect((await submit(recipientId)).status).toBe(200);
  expect(tables.ai_assignment_results[0].status).toBe('failed');
  expect(tables.ai_assignment_submissions).toHaveLength(1);expect(objects.size).toBe(1);
});
