import { beforeEach, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn()}));
vi.mock('../lib/auth',()=>({withAuth:(handler:any)=>handler,getContextUser:()=>({id:'admin'})}));
vi.mock('../lib/supabase',()=>({getServiceClient:()=>mock}));
import { onRequestPost } from '../api/college-admin/attendance';
function chain(data:any){const query:any={}; for(const key of ['select','eq','order','in','ilike'])query[key]=()=>query; query.maybeSingle=async()=>({data,error:null});query.then=(resolve:any)=>Promise.resolve({data,error:null}).then(resolve);return query;}
async function request(body:any){return onRequestPost({env:{},request:new Request('https://example.test/api/college-admin/attendance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})} as any);}
beforeEach(()=>{vi.clearAllMocks();mock.rpc.mockResolvedValue({data:true,error:null});});
it('lists both academic and mapped trainer sessions in the existing import selector',async()=>{
 mock.from.mockImplementation((table:string)=>chain(table==='programs'?[{id:'program',name:'MBA',code:'MBA'}]:[{id:'legacy',program_id:'program',subject_name:'Finance',instructor_source:'legacy_college'},{id:'training',program_id:'program',subject_name:'Python',instructor_source:'platform_staff'}]));
 const response=await request({action:'get-import-sessions',college_id:'college'});
 expect(response.status).toBe(200);
 const body:any=await response.json();
 expect(body.data.sessions.map((session:any)=>session.id)).toEqual(['legacy','training']);
 expect(mock.rpc).toHaveBeenCalledWith('external_teaching_college_admin',{p_actor:'admin',p_college:'college'});
});
it('rejects another college before reading its sessions',async()=>{
 mock.rpc.mockResolvedValue({data:false,error:null});
 const response=await request({action:'get-import-sessions',college_id:'other'});
 expect(response.status).toBe(403);expect(mock.from).not.toHaveBeenCalled();
});
it('downloads only the saved trainer roster rather than the whole class',async()=>{
 mock.from.mockImplementation((table:string)=>chain(table==='college_attendance_sessions'?{id:'training',college_id:'college',program_id:'program',semester:4,section:'A',date:'2026-10-14',instructor_source:'platform_staff'}:table==='college_attendance_records'?[{learner_id:'learner',learner_name:'Anu',roll_number:'1'}]:[{id:'learner',email:'anu@example.test'}]));
 const response=await request({action:'download-attendance-template',college_id:'college',session_id:'training'});
 expect(response.status).toBe(200);
 const body:any=await response.json();expect(body.data.rosterSize).toBe(1);expect(body.data.csv).toContain('1,Anu,anu@example.test');
});
