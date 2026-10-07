import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from './helpers/fake-supabase';
import { facultyLoginUrl, generateFacultyPassword, requireFacultyAdmin, resendFacultyCredentials, sendFacultyCredentials } from '../faculty-credentials';
import { handleCreateCollegeStaff } from '../../api/user/handlers/authenticated';
import type { PagesEnv } from '../types';

let db: FakeSupabase;
const resolveOrg = vi.hoisted(()=>vi.fn());
vi.mock('../resolve-organization',()=>({resolveUserOrganization:resolveOrg}));
vi.mock('../supabase',()=>({createSupabaseAdminClient:()=>db}));
const actor={id:'admin',email:'admin@example.test',org_id:'sso-college'};
const active=(roles:string[],org_id='sso-college')=>({org_id,roles,status:'active'});
let sso: Record<string, ReturnType<typeof vi.fn>>;
let email: ReturnType<typeof vi.fn>;
let env: PagesEnv;
beforeEach(()=>{
 db=new FakeSupabase();
 db.seed('college_lecturers',[{id:'faculty',user_id:'educator',collegeId:'college',accountStatus:'active',first_name:'Ada',last_name:'Lovelace',credentials_email_attempted_at:null}]);
 const from=db.from.bind(db);
 db.from=(table:string)=>{
  const builder=from(table);
  builder.or=(expression:string)=>{
   const single=builder.maybeSingle;
   builder.maybeSingle=()=>{
    const cutoff=expression.split('.lt.')[1];
    const row=db.rows(table).find(row=>row.id==='faculty');
    if(row?.credentials_email_attempted_at && row.credentials_email_attempted_at>=cutoff)return Promise.resolve({data:null,error:null});
    return single();
   };
   return builder;
  };
  return builder;
 };
 resolveOrg.mockResolvedValue({organizationId:'college'});
 sso={
  getUserByEmail:vi.fn().mockResolvedValue(null),
  getUserById:vi.fn(async id=>({id,email:id+'@example.test',is_blocked:false,is_email_verified:true})),
  getUserMemberships:vi.fn(async id=>({memberships:[active([id==='admin'?'college_admin':'college_educator'])]})),
  adminResetPassword:vi.fn().mockResolvedValue({success:true}),
  createMember:vi.fn().mockResolvedValue({user_id:'new-educator'}),
 };
 email=vi.fn().mockResolvedValue({success:true});
 env={SSO_SERVICE:sso,EMAIL_SERVICE:{sendEmail:email}} as unknown as PagesEnv;
});

describe('faculty credential email',()=>{
 it('generates distinct passwords without using Math.random',()=>{
  const a=generateFacultyPassword(),b=generateFacultyPassword();
  expect(a).not.toBe(b);expect(a).toMatch(/[A-Z]/);expect(a).toMatch(/[a-z]/);expect(a).toMatch(/[0-9]/);expect(a.length).toBeGreaterThanOrEqual(20);
 });
 it('rotates then emails the authoritative address without returning or storing the password',async()=>{
  const result=await resendFacultyCredentials(env,db as never,actor,'faculty');
  const password=sso.adminResetPassword.mock.calls[0][0].new_password;
  expect(email.mock.calls[0][0]).toMatchObject({to:'educator@example.test'});
  expect(email.mock.calls[0][0].text).toContain(password);
  expect(sso.adminResetPassword.mock.invocationCallOrder[0]).toBeLessThan(email.mock.invocationCallOrder[0]);
  expect(JSON.stringify(result)).not.toContain(password);
  expect(JSON.stringify(db.accesses)).not.toContain(password);
  expect(result.emailStatus).toBe('sent');
  expect(db.rows('college_lecturers')[0].credentials_email_status).toBe('sent');
 });
 it('reports delivery failure after rotation without rolling back the account',async()=>{
  email.mockResolvedValue({success:false,error:'provider rejected'});
  expect(await resendFacultyCredentials(env,db as never,actor,'faculty')).toMatchObject({emailStatus:'failed',passwordChanged:true});
  expect(db.rows('college_lecturers')[0].accountStatus).toBe('active');
 });
 it('does not rotate when email service is missing',async()=>{
  delete env.EMAIL_SERVICE;
  await expect(resendFacultyCredentials(env,db as never,actor,'faculty')).rejects.toMatchObject({status:503});
  expect(sso.adminResetPassword).not.toHaveBeenCalled();
 });
 it('rejects non-admin and cross-organization targets before rotation',async()=>{
  sso.getUserMemberships.mockResolvedValue({memberships:[active(['college_educator'])]});
  await expect(requireFacultyAdmin(env,db as never,actor)).rejects.toMatchObject({status:403});
  sso.getUserMemberships.mockImplementation(async id=>({memberships:[active([id==='admin'?'college_admin':'college_educator'],id==='admin'?'sso-college':'other')]}));
  await expect(resendFacultyCredentials(env,db as never,actor,'faculty')).rejects.toMatchObject({status:403});
  expect(sso.adminResetPassword).not.toHaveBeenCalled();expect(email).not.toHaveBeenCalled();
 });
 it('rejects a faculty record belonging to another app college',async()=>{
  db.rows('college_lecturers')[0].collegeId='other-college';
  await expect(resendFacultyCredentials(env,db as never,actor,'faculty')).rejects.toMatchObject({status:404});
  expect(sso.adminResetPassword).not.toHaveBeenCalled();
 });
 it('rejects a repeated attempt during the cooldown',async()=>{
  await resendFacultyCredentials(env,db as never,actor,'faculty');
  await expect(resendFacultyCredentials(env,db as never,actor,'faculty')).rejects.toMatchObject({status:429});
  expect(sso.adminResetPassword).toHaveBeenCalledTimes(1);
 });
 it('does not email if password rotation fails',async()=>{
  sso.adminResetPassword.mockRejectedValue(new Error('unavailable'));
  await expect(resendFacultyCredentials(env,db as never,actor,'faculty')).rejects.toMatchObject({status:503});
  expect(email).not.toHaveBeenCalled();
 });
 it('does not reflect provider errors containing secrets',async()=>{
  email.mockRejectedValue(new Error('secret-password'));
  expect(await sendFacultyCredentials(env,'a@example.test','<script>name</script>','secret-password')).toBe('failed');
  expect(email.mock.calls[0][0].html).not.toContain('<script>');
 });
});

const request=()=>new Request('http://localhost/api/user/create-college-staff',{method:'POST',body:JSON.stringify({collegeId:'college',staff:{name:'New Educator',email:'new@example.test',roles:['Lecturer']}})});
describe('direct faculty creation',()=>{
 it.each([true,false])('sends credentials on creation and returns delivery status (delivery=%s)',async success=>{
  email.mockResolvedValue({success});
  const response=await handleCreateCollegeStaff(request(),env,actor);
  const body=await response.json() as any;
  expect(response.status).toBe(200);
  const password=sso.createMember.mock.calls[0][0].password;
  expect(body.data.emailStatus).toBe(success?'sent':'failed');
  expect(body.data).not.toHaveProperty('password');
  expect(JSON.stringify(body)).not.toContain(password);
  expect(JSON.stringify(db.accesses)).not.toContain(password);
  expect(email).toHaveBeenCalledTimes(1);
  expect(db.rows('users')).toHaveLength(1);
 });
});

describe('credential recovery regressions',()=>{
 it.each(['users','college_lecturers'])('recovers after %s insert failure without creating another SSO account',async table=>{
  db.injected.push({table,op:'insert',error:{message:'unavailable'}});
  expect((await handleCreateCollegeStaff(request(),env,actor)).status).toBe(503);
  expect(email).not.toHaveBeenCalled();
  db.injected=[];
  sso.getUserByEmail.mockResolvedValue({id:'new-educator',email:'new@example.test'});
  expect((await handleCreateCollegeStaff(request(),env,actor)).status).toBe(200);
  expect(sso.createMember).toHaveBeenCalledTimes(1);
  expect(sso.adminResetPassword).toHaveBeenCalledTimes(1);
  expect(db.rows('users')).toHaveLength(1);
  expect(db.rows('college_lecturers').filter(r=>r.user_id==='new-educator')).toHaveLength(1);
  expect(email).toHaveBeenCalledTimes(1);
 });
 it('refuses to recover an account from another SSO college',async()=>{
  sso.getUserByEmail.mockResolvedValue({id:'foreign',email:'new@example.test'});
  sso.getUserMemberships.mockImplementation(async id=>({memberships:[active([id==='admin'?'college_admin':'college_educator'],id==='admin'?'sso-college':'other')]}));
  expect((await handleCreateCollegeStaff(request(),env,actor)).status).toBe(409);
  expect(sso.adminResetPassword).not.toHaveBeenCalled();expect(email).not.toHaveBeenCalled();
 });
 it('does not overwrite a completed faculty account',async()=>{
  sso.getUserByEmail.mockResolvedValue({id:'educator',email:'new@example.test'});
  expect((await handleCreateCollegeStaff(request(),env,actor)).status).toBe(409);
  expect(sso.adminResetPassword).not.toHaveBeenCalled();
 });
 it.each([false,true])('keeps successful delivery when status persistence fails (throw=%s)',async throws=>{
  email.mockImplementation(async()=>{
   db.injected.push({table:'college_lecturers',op:'update',...(throws?{throws:new Error('offline')}:{error:{message:'offline'}})});
   return {success:true};
  });
  expect(await resendFacultyCredentials(env,db as never,actor,'faculty')).toMatchObject({emailStatus:'sent',passwordChanged:true,statusSaved:false});
 });
 it('preserves the SSO reset rate limit and sends no email',async()=>{
  sso.adminResetPassword.mockRejectedValue(new Error('Rate limit exceeded'));
  await expect(resendFacultyCredentials(env,db as never,actor,'faculty')).rejects.toMatchObject({status:429,code:'RESET_RATE_LIMITED'});
  expect(email).not.toHaveBeenCalled();
 });
 it('uses trusted configuration or loopback origin for email links',()=>{
  expect(facultyLoginUrl(env,'http://localhost:8788/api/test')).toBe('http://localhost:8788/login');
  expect(facultyLoginUrl(env,'https://attacker.example/api/test')).toBe('https://skillpassport.rareminds.in/login');
  expect(facultyLoginUrl({...env,APP_URL:'https://preview.example/app'},'http://localhost:8788')).toBe('https://preview.example/login');
  expect(()=>facultyLoginUrl({...env,APP_URL:'javascript:alert(1)'})).toThrow();
 });
 it('creates an email with the local login link',async()=>{
  await handleCreateCollegeStaff(request(),env,actor);
  expect(email.mock.calls[0][0].text).toContain('http://localhost/login');
 });
});
