import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../curriculum';
const m=vi.hoisted(()=>({from:vi.fn(),eq:vi.fn(),rows:[] as unknown[],error:null as unknown}));
vi.mock('../../../lib/auth',()=>({withAuth:(h:unknown)=>h,getContextUser:()=>({id:'admin'})}));
vi.mock('../../../lib/supabase',()=>({getServiceClient:()=>({from:m.from})}));
vi.mock('../../../lib/entitlements',()=>({hasFeatureEntitlement:vi.fn()}));
beforeEach(()=>{vi.clearAllMocks();m.rows=[];m.error=null;m.from.mockImplementation(()=>{const chain:any={select:()=>chain,eq:(...args:unknown[])=>{m.eq(...args);return chain;},then:(resolve:any)=>Promise.resolve({data:m.rows,error:m.error}).then(resolve)};return chain;});});
async function load(){return await onRequestPost({request:new Request('https://test/api/college-admin/curriculum',{method:'POST',body:JSON.stringify({action:'get-courses',program_id:'program',semester:1})}),env:{}} as never) as Response;}
const mapping={id:'mapping',offering_type:'core',course:{id:'college-course',course_code:'CSE102',course_name:'Mathematics',credits:4,course_type:'theory'}};
describe('curriculum course selector',()=>{
it('returns mapped college courses and never queries the global catalogue',async()=>{m.rows=[mapping,{...mapping,id:'duplicate'},{id:'missing',course:null}];const response=await load();expect(response.status).toBe(200);expect((await response.json()).data).toEqual([expect.objectContaining({id:'college-course',course_code:'CSE102',source:'college_course'})]);expect(m.from).toHaveBeenCalledTimes(1);expect(m.from).toHaveBeenCalledWith('college_course_mappings');expect(m.eq).toHaveBeenCalledWith('program_id','program');expect(m.eq).toHaveBeenCalledWith('semester',1);});
it('returns an empty list when the selected semester has no mappings',async()=>{expect((await (await load()).json()).data).toEqual([]);expect(m.from).not.toHaveBeenCalledWith('courses');});
it('reports mapping failures instead of falling back to unrelated courses',async()=>{m.error={code:'XX000',message:'Unavailable'};expect((await load()).status).toBeGreaterThanOrEqual(400);expect(m.from).not.toHaveBeenCalledWith('courses');});
});