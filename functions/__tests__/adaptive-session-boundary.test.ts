import {beforeEach,describe,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({handler:vi.fn(),queries:[] as any[],unavailable:false}));
const owner='10000000-0000-4000-8000-000000000001',learner='20000000-0000-4000-8000-000000000001',session='30000000-0000-4000-8000-000000000001',foreign='40000000-0000-4000-8000-000000000001';
vi.mock('../lib/auth',()=>({withAuth:(handler:any)=>(context:any)=>handler({...context,data:{user:{sub:owner}}})}));
vi.mock('../lib/supabase',()=>({getServiceClient:()=>({rpc:async()=>({data:null}),from:(table:string)=>{
 const filters:Record<string,unknown>={};const query={select:()=>query,eq:(key:string,value:unknown)=>{filters[key]=value;return query;},maybeSingle:async()=>{
  m.queries.push({table,filters:{...filters}});
  if(table==='learners')return {data:filters.user_id===owner?{id:learner,user_id:owner}:null};
  if(m.unavailable)return {error:{code:'offline'}};
  return {data:filters.id===session&&filters.learner_id===learner?{id:session}:null};
 }};return query;
}})}));
vi.mock('../api/adaptive-session/handlers/initialize',()=>({initializeHandler:m.handler}));
vi.mock('../api/adaptive-session/handlers/next-question',()=>({nextQuestionHandler:m.handler}));
vi.mock('../api/adaptive-session/handlers/submit-answer',()=>({submitAnswerHandler:m.handler}));
vi.mock('../api/adaptive-session/handlers/complete',()=>({completeHandler:m.handler}));
vi.mock('../api/adaptive-session/handlers/results',()=>({getResultsHandler:m.handler,getlearnerResultsHandler:m.handler}));
vi.mock('../api/adaptive-session/handlers/resume',()=>({resumeHandler:m.handler,findInProgressHandler:m.handler}));
vi.mock('../api/adaptive-session/handlers/abandon',()=>({abandonHandler:m.handler}));
vi.mock('../api/adaptive-session/link-to-attempt',()=>({onRequestPost:m.handler}));
import {onRequest} from '../api/adaptive-session/[[path]]';
const context=(path:string,method='GET',body?:unknown)=>({env:{},data:{},request:new Request(`https://fixture.invalid/api/adaptive-session${path}`,{method,...(body===undefined?{}:{body:JSON.stringify(body)})})}) as any;
beforeEach(()=>{vi.clearAllMocks();m.queries.length=0;m.unavailable=false;m.handler.mockImplementation(async()=>Response.json({data:{
 question:{id:'q',text:'Choose',options:{A:'One',B:'Two'},correctAnswer:'A',explanation:'secret'},
 session:{correctAnswers:2,currentPhaseQuestions:[{id:'q',correctAnswer:'B',explanation:'secret'}]},
 results:{totalCorrect:2,accuracyByDifficulty:{1:{correct:2,total:3}}},responses:[{questionId:'answered',isCorrect:true}],
}}));});
describe('adaptive learner capability boundary',()=>{
 it.each(['next-question','resume','results'])('requires live ownership before %s reads',async endpoint=>{
  const response=await onRequest(context(`/${endpoint}/${foreign}`));expect(response.status).toBe(404);expect(m.handler).not.toHaveBeenCalled();
  expect(m.queries).toContainEqual({table:'adaptive_aptitude_sessions',filters:{id:foreign,learner_id:learner}});
 });
 it.each(['complete','abandon'])('requires live ownership before %s mutations',async endpoint=>{
  expect((await onRequest(context(`/${endpoint}/${foreign}`,'POST'))).status).toBe(404);expect(m.handler).not.toHaveBeenCalled();
 });
 it('checks the submit body session and forwards authenticated context with an unread request',async()=>{
  const body={sessionId:session,questionId:'q',selectedAnswer:'A',responseTimeMs:100};
  const response=await onRequest(context('/submit-answer','POST',body));expect(response.status).toBe(200);
  const forwarded=m.handler.mock.calls[0][0];expect(forwarded.data.user.sub).toBe(owner);expect(await forwarded.request.json()).toEqual(body);
  m.handler.mockClear();expect((await onRequest(context('/submit-answer','POST',{...body,sessionId:foreign}))).status).toBe(404);expect(m.handler).not.toHaveBeenCalled();
 });
 it.each(['results/learner','find-in-progress'])('rejects foreign learner enumeration through %s',async endpoint=>{
  expect((await onRequest(context(`/${endpoint}/${foreign}`))).status).toBe(404);expect(m.handler).not.toHaveBeenCalled();
  expect((await onRequest(context(`/${endpoint}/${owner}`))).status).toBe(200);
  expect(new URL(m.handler.mock.calls[0][0].request.url).pathname).toBe(`/api/adaptive-session/${endpoint}/${learner}`);
 });
 it('rejects a foreign initialize reference rather than forwarding it',async()=>{
  expect((await onRequest(context('/initialize','POST',{learnerId:foreign,gradeLevel:'high_school'}))).status).toBe(404);expect(m.handler).not.toHaveBeenCalled();
  expect((await onRequest(context('/initialize','POST',{learnerId:learner,gradeLevel:'high_school'}))).status).toBe(200);expect(m.handler.mock.calls[0][0].data.user.sub).toBe(owner);
 });
 it('removes keys from questions and session pools while preserving result counts and submitted-answer feedback',async()=>{
  const response=await onRequest(context(`/resume/${session}`));const body=await response.json();
  expect(response.headers.get('Cache-Control')).toBe('no-store');expect(body.data.question).toEqual({id:'q',text:'Choose',options:{A:'One',B:'Two'}});
  expect(body.data.session).toEqual({correctAnswers:2,currentPhaseQuestions:[{id:'q'}]});
  expect(body.data.results).toEqual({totalCorrect:2,accuracyByDifficulty:{1:{correct:2,total:3}}});expect(body.data.responses[0].isCorrect).toBe(true);
 });
 it('fails closed on authority outage and invalid IDs before invoking a handler',async()=>{
  m.unavailable=true;expect((await onRequest(context(`/next-question/${session}`))).status).toBe(503);expect(m.handler).not.toHaveBeenCalled();
  m.queries.length=0;expect((await onRequest(context('/next-question/not-a-uuid'))).status).toBe(400);expect(m.queries).toEqual([]);
 });
});
