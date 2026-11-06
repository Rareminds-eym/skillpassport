import {withAuth, getContextUser} from '../lib/auth';
import type {AuthenticatedPagesContext} from '../lib/types';
import {getServiceClient} from '../lib/supabase';
import {apiDbError, apiError, apiSuccess} from '../lib/response';

const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const label=(v:unknown)=>typeof v==='string'&&/^[\p{L}\p{N} ._-]{1,32}$/u.test(v);
const fields='id, name, email, roll_number, admission_number, grade, section, school_id, college_id';

/** Read-only academic roster; SSO scope and live membership precede every read. */
export const onRequestPost=withAuth(async(context:AuthenticatedPagesContext)=>{
 const user=getContextUser(context);
 const adminRole=user.roles?.some((r:string)=>['school_admin','college_admin','admin','owner'].includes(r));
 const educatorRole=user.roles?.some((r:string)=>['educator','school_educator','college_educator'].includes(r));
 if(!uuid(user.org_id)||(!adminRole&&!educatorRole))
  return apiError(403,'FORBIDDEN','Academic administrator access required',context.request);
 let input:any;
 try{const raw=await context.request.text();if(new TextEncoder().encode(raw).byteLength>8192)throw new Error();input=JSON.parse(raw);}catch{return apiError(400,'VALIDATION_ERROR','Invalid roster request',context.request);}
 const keys=['schoolId','collegeId','classIds','grade','section','cursor'];
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k))||
  (input.schoolId!==undefined&&!uuid(input.schoolId))||(input.collegeId!==undefined&&!uuid(input.collegeId))||
  (input.schoolId&&input.collegeId)||(input.cursor!==undefined&&!uuid(input.cursor))||
  (input.grade!==undefined&&!label(input.grade))||(input.section!==undefined&&!label(input.section))||
  (input.classIds!==undefined&&(!Array.isArray(input.classIds)||input.classIds.length<1||input.classIds.length>100||!input.classIds.every(uuid))))
  return apiError(400,'VALIDATION_ERROR','Invalid roster filters',context.request);
 if((input.schoolId&&input.schoolId!==user.org_id)||(input.collegeId&&input.collegeId!==user.org_id))
  return apiError(403,'FORBIDDEN','Organization does not match your active context',context.request);
 const db=getServiceClient(context.env);
 const member=await db.from('organization_members').select('id, role').eq('user_id',user.id).eq('organization_id',user.org_id)
  .eq('status','active').maybeSingle();
 if(member.error)return apiDbError(member.error,context.request);
 if(!member.data)return apiError(403,'FORBIDDEN','Active academic administrator membership required',context.request);
 const organization=await db.from('organizations').select('organization_type').eq('id',user.org_id).maybeSingle();
 if(organization.error)return apiDbError(organization.error,context.request);
 const kind=organization.data?.organization_type;
 if(!['school','college'].includes(kind)||(input.schoolId&&kind!=='school')||(input.collegeId&&kind!=='college'))
  return apiError(403,'FORBIDDEN','Academic organization required',context.request);
 let classIds:string[]|undefined=input.classIds?[...new Set(input.classIds)] as string[]:undefined;
 let assignmentYears:Map<string,Set<string>>|undefined;
 const administrator=adminRole&&['owner','admin'].includes(member.data.role);
 if(!administrator){
  if(!educatorRole)return apiError(403,'FORBIDDEN','Administrator membership required',context.request);
  const school=kind==='school';
  const staff=await db.from(school?'school_educators':'college_lecturers').select('id').eq('user_id',user.id)
   .eq(school?'school_id':'collegeId',user.org_id).eq(school?'account_status':'accountStatus','active').maybeSingle();
  if(staff.error)return apiDbError(staff.error,context.request);
  if(!staff.data)return apiError(403,'FORBIDDEN','Active teaching assignment required',context.request);
  let assignments=db.from(school?'school_educator_class_assignments':'college_faculty_class_assignments')
   .select('class_id, academic_year').eq(school?'educator_id':'faculty_id',staff.data.id);
  if(classIds)assignments=assignments.in('class_id',classIds);
  const assigned=await assignments.limit(101);
  if(assigned.error)return apiDbError(assigned.error,context.request);
  const allowed=[...new Set((assigned.data??[]).map((r:any)=>r.class_id))] as string[];
  assignmentYears=new Map();
  for(const row of assigned.data??[]){
   if(!assignmentYears.has(row.class_id))assignmentYears.set(row.class_id,new Set());
   if(typeof row.academic_year==='string')assignmentYears.get(row.class_id)!.add(row.academic_year);
  }
  if((assigned.data?.length??0)>100)return apiError(400,'VALIDATION_ERROR','Select at most 100 assigned classes',context.request);
  if(classIds&&classIds.some(id=>!allowed.includes(id)))return apiError(403,'FORBIDDEN','Teaching assignment required for every class',context.request);
  classIds=classIds??allowed;
  if(classIds.length===0){const empty=apiSuccess({learners:[],nextCursor:null},context.request);empty.headers.set('Cache-Control','no-store');return empty;}
 }
 if(classIds){
  const classes=await db.from(kind==='school'?'school_classes':'college_classes').select('id, academic_year').eq(kind+'_id',user.org_id).in('id',classIds);
  if(classes.error)return apiDbError(classes.error,context.request);
  if(classes.data?.length!==classIds.length)return apiError(403,'FORBIDDEN','Class is outside your organization',context.request);
  if(assignmentYears&&classes.data.some((c:any)=>!assignmentYears!.get(c.id)?.has(c.academic_year)))
   return apiError(403,'FORBIDDEN','Current academic-year teaching assignment required',context.request);
 }
 let query=db.from('zoho_recruiter_learners').select(fields).or('is_deleted.is.null,is_deleted.eq.false').eq(kind+'_id',user.org_id);
 if(classIds)query=query.in(kind+'_class_id',classIds);
 if(input.grade)query=query.eq('grade',input.grade);
 if(input.section)query=query.or(`section.eq.${input.section},section.is.null`);
 if(input.cursor)query=query.gt('id',input.cursor);
 const {data,error}=await query.order('id',{ascending:true}).limit(201);
 if(error)return apiDbError(error,context.request);
 const rows=data??[];const learners=rows.slice(0,200);
 const response=apiSuccess({learners,nextCursor:rows.length>200?learners[learners.length-1].id:null},context.request);
 response.headers.set('Cache-Control','no-store');return response;
});
