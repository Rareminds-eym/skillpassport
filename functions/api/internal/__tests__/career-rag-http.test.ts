import {beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('../../../lib/supabase',()=>({createSupabaseAdminClient:vi.fn()}));
vi.mock('../../career/context/evidence',()=>({buildCareerEvidence:vi.fn()}));
import {createSupabaseAdminClient} from '../../../lib/supabase';
import {buildCareerEvidence} from '../../career/context/evidence';
import {onRequestPost} from '../evidence';
import {signEvidenceBody,sha256Hex} from '../evidence-auth';
const secret='career-rag-http-test-secret-at-least-32-chars';
function setup(){
 const actor='11111111-1111-4111-8111-111111111111';
 const embedText=vi.fn().mockResolvedValue({embedding:Array(1536).fill(0.1),dimensions:1536,model:'google/gemini-embedding-2-preview',task_type:'RETRIEVAL_QUERY'});
 const rpc=vi.fn().mockResolvedValue({data:{status:'no_matches',items:[]},error:null});
 vi.mocked(createSupabaseAdminClient).mockReturnValue({rpc,from:()=>({insert:async()=>({error:null})})} as never);
 vi.mocked(buildCareerEvidence).mockResolvedValue({learnerId:'own',forbiddenResources:[],bundle:{evidence:[
  {kind:'learner.profile',reference:'learner:own',text:'Profile',source:'learners'},
  {kind:'learner.skills',reference:'skill:own',text:'SQL',source:'skills'},
 ],sources:['learners','skills'],missing:[],absent:[],invalid:[],stale:[],gatheredAt:new Date().toISOString()}});
 const body={audience:'skillpassport.evidence',product:'skillpassport',actorId:actor,task:'career-talent-strategist.chat',
  query:'Find courses for data analysis',kinds:['learner.profile','learner.skills','courses.recommended'],resources:[],
  expiresAt:new Date(Date.now()+30000).toISOString(),nonce:crypto.randomUUID()};
 const env={EVIDENCE_SHARED_SECRET:secret,EMBEDDING_SERVICE:{embedText}};
 const send=async(value:Record<string,unknown>=body)=>{
  const text=JSON.stringify(value);return onRequestPost({env,request:new Request('http://local/api/internal/evidence',{method:'POST',
   headers:{'x-evidence-signature':await signEvidenceBody(secret,text),'x-evidence-request-hash':await sha256Hex(text)},body:text})} as never);
 };
 return {actor,embedText,rpc,body,env,send};
}
beforeEach(()=>vi.clearAllMocks());
describe('signed Career RAG HTTP boundary',()=>{
 it('forwards signed query and actor into retrieval, returning a genuine no-match projection',async()=>{
  const s=setup();const response=await s.send();expect(response.status).toBe(200);
  expect(s.rpc).toHaveBeenCalledWith('rag_search',expect.objectContaining({p_actor_id:s.actor,p_source:'catalog.courses',p_query_text:s.body.query}));
  const payload=await response.json();expect(JSON.parse(payload.data.evidence.at(-1).text).status).toBe('no_matches');
 });
 it.each(['tenant','task','resource'])('rejects forged %s scope before database/embedding access',async mode=>{
  const s=setup();const body={...s.body,...(mode==='tenant'?{tenantId:'foreign'}:mode==='task'?{task:'senior-educator.tutor-chat'}:{resources:[{kind:'course',id:'foreign'}]})};
  expect((await s.send(body)).status).toBe(403);expect(createSupabaseAdminClient).not.toHaveBeenCalled();expect(s.embedText).not.toHaveBeenCalled();
 });
 it('does not produce an embedding when its service binding is missing',async()=>{
  const s=setup();delete s.env.EMBEDDING_SERVICE;expect((await s.send()).status).toBe(503);expect(s.embedText).not.toHaveBeenCalled();
 });
});
