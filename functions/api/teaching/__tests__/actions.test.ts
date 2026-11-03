import {beforeEach,describe,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({user:{id:'signed-id',roles:['educator']},rpc:vi.fn()}));
vi.mock('../../../lib/auth',()=>({withAuth:(handler:any)=>handler,getContextUser:()=>f.user}));
vi.mock('../../../lib/supabase',()=>({getServiceClient:()=>({rpc:f.rpc})}));
import {onRequestPost} from '../actions';
const context=(body:any)=>({env:{},request:new Request('https://app.test/api/teaching/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
describe('teaching server actions',()=>{
 beforeEach(()=>{f.user={id:'signed-id',roles:['educator']};f.rpc.mockReset().mockResolvedValue({data:[],error:null});});
 it('uses verified actor and strips spoofed payload fields',async()=>{const response=await onRequestPost(context({action:'learners',payload:{actor:'spoof',collegeId:'spoof'}}));expect(response.status).toBe(200);expect(f.rpc).toHaveBeenCalledWith('external_educator_action',{p_actor:'signed-id',p_action:'learners',p_payload:{}});});
 it('denies admin operations before touching DB',async()=>{const response=await onRequestPost(context({action:'admin_overview'}));expect(response.status).toBe(403);expect(f.rpc).not.toHaveBeenCalled();});
 it('returns safe conflict and refuses unassigned content',async()=>{f.rpc.mockResolvedValue({error:{code:'40001',message:'private data'}});const response=await onRequestPost(context({action:'sessions'}));expect(response.status).toBe(409);expect(JSON.stringify(await response.json())).not.toContain('private data');f.rpc.mockResolvedValue({data:[],error:null});expect((await onRequestPost(context({action:'course_content',payload:{courseId:'00000000-0000-4000-8000-000000000001'}}))).status).toBe(403);});
});
