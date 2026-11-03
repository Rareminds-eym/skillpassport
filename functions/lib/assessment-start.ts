import {getServiceClient} from './supabase';
import type {AuthenticatedPagesContext} from './types';
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const grades = ['middle','highschool','higher_secondary','after10','after12','college'];
export const startJson = (body: unknown,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export interface AttemptStartInput {gradeLevel: string; streamId: string|null; reference?: string}
export async function readAttemptStart(request: Request, legacy=false): Promise<AttemptStartInput|Response> {
  try {
    const raw=await request.text();
    if(new TextEncoder().encode(raw).byteLength>65536)return startJson({error:'Request too large'},413);
    const body=JSON.parse(raw);
    if(!body||typeof body!=='object'||Array.isArray(body)
      ||Object.keys(body).some(key=>!(legacy?['gradeLevel','streamId','reference']:['gradeLevel','streamId']).includes(key))
      ||!grades.includes(body.gradeLevel)
      ||(body.streamId!=null&&(typeof body.streamId!=='string'||!body.streamId.length||body.streamId.length>50))
      ||(body.reference!==undefined&&!uuid(body.reference)))return startJson({error:'Invalid start request'},400);
    return {gradeLevel:body.gradeLevel,streamId:body.streamId??null,...(body.reference?{reference:body.reference.toLowerCase()}:{})};
  }catch{return startJson({error:'Invalid JSON'},400);}
}
export async function createOwnedAttempt(context:AuthenticatedPagesContext,body:AttemptStartInput,learnerContext:Record<string,unknown>|null=null,reuse=false) {
  const owner=context.data.user.sub;
  if(!uuid(owner))return startJson({error:'Authentication required'},401);
  try{
    const {data,error}=await getServiceClient(context.env).rpc('start_owned_assessment',{
      p_owner:owner,p_stream:body.streamId,p_grade:body.gradeLevel,p_reference:body.reference??null,p_context:learnerContext,p_reuse:reuse,
    });
    if(error){
      if(['22023','22P02'].includes(error.code))return startJson({error:'Invalid assessment context'},400);
      if(error.code==='42501')return startJson({error:'Assessment access denied'},403);
      if(error.code==='P0001')return startJson({error:'Resume or abandon the existing assessment before starting another'},409);
      return startJson({error:'Assessment start unavailable'},503);
    }
    if(!data)return startJson({error:'Learner record not found'},404);
    if(typeof data!=='object'||Array.isArray(data)||typeof data.created!=='boolean'||(!reuse&&data.created!==true)||!uuid(data.attempt?.id)
      ||!uuid(data.attempt?.learner_id)||data.attempt.status!=='in_progress'||!grades.includes(data.attempt.grade_level)
      ||data.attempt.stream_id!==body.streamId)return startJson({error:'Assessment start confirmation unavailable'},503);
    return startJson(data,data.created?201:200);
  }catch{return startJson({error:'Assessment start unavailable'},503);}
}
export async function handleAttemptCreate(context:AuthenticatedPagesContext){
  const body=await readAttemptStart(context.request,true);
  return body instanceof Response?body:createOwnedAttempt(context,body);
}
