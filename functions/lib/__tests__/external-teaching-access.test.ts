import {beforeEach,describe,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({row:null as any,error:null as any,chain:{} as any}));
vi.mock('../supabase',()=>({getServiceClient:()=>({from:()=>f.chain})}));
import {guardExternalTeachingRequest} from '../external-teaching-access';
describe('external teaching authorization boundary',()=>{
 beforeEach(()=>{f.row={id:'staff',account_status:'active',metadata:{teaching_access_enabled:true}};f.error=null;f.chain={select:vi.fn(()=>f.chain),eq:vi.fn(()=>f.chain),maybeSingle:vi.fn(async()=>({data:f.row,error:f.error}))};});
 const user={sub:'signed-actor',roles:['educator'],user_metadata:{portal_mode:'assigned_trainer'}} as any;
 it('allows only scoped teaching and denies unrelated educator modules',async()=>{
  expect(await guardExternalTeachingRequest(user,{},new Request('https://app.test/api/teaching/actions'))).toBeNull();
  expect((await guardExternalTeachingRequest(user,{},new Request('https://app.test/api/educator/actions')))?.status).toBe(403);
  expect(f.chain.eq).toHaveBeenCalledWith('user_id','signed-actor');
 });
 it('denies revoked grants and inactive profiles even with old signed metadata',async()=>{
  f.row.account_status='inactive';expect((await guardExternalTeachingRequest(user,{},new Request('https://app.test/api/teaching/actions')))?.status).toBe(403);
  f.row.account_status='active';f.row.metadata.teaching_access_enabled=false;
  expect((await guardExternalTeachingRequest(user,{},new Request('https://app.test/api/teaching/actions',{method:'POST',body:JSON.stringify({action:'learners'})})))?.status).toBe(403);
  expect(await guardExternalTeachingRequest(user,{},new Request('https://app.test/api/teaching/actions',{method:'POST',body:JSON.stringify({action:'context'})}))).toBeNull();
 });
 it('fails closed on missing external profile or DB failure, preserves ordinary educators',async()=>{
  f.row=null;expect((await guardExternalTeachingRequest(user,{},new Request('https://app.test/api/teaching/actions')))?.status).toBe(403);
  expect(await guardExternalTeachingRequest({...user,user_metadata:{}},{},new Request('https://app.test/api/educator/actions'))).toBeNull();
  f.error={code:'missing'};expect((await guardExternalTeachingRequest(user,{},new Request('https://app.test/api/teaching/actions')))?.status).toBe(503);
 });
});
