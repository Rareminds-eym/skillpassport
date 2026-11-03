// @vitest-environment node
import {it,expect,vi} from 'vitest';
vi.mock('../../../../lib/auth',()=>({getContextUser:()=>({id:'user'}),getServiceClient:()=>({})}));
import {handleSavedMaterials} from '../saved-materials';
it('advertises disabled capability and never writes library records while disabled',async()=>{
 const make=(action:string)=>({env:{},request:new Request('https://test',{method:'POST',body:JSON.stringify({action})})}) as never;
 const response=await handleSavedMaterials(make('capabilities'));expect((await response.json() as any).data.enabled).toBe(false);
 expect((await handleSavedMaterials(make('save'))).status).toBe(503);
});
