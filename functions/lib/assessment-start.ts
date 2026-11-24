import {getServiceClient,getAuthToken} from './supabase';
import {z} from 'zod';
import type {AuthenticatedPagesContext} from './types';
import {requireSubscriptionAccess} from '../shared/lib/subscription-access';
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const grades = ['middle','highschool','higher_secondary','after10','after12','college'];
export const startJson = (body: unknown,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export interface AttemptStartInput {gradeLevel: string; streamId: string|null; reference?: string; specialization?: string|null;
  operationId?: string; sourceAttemptId?: string; settlementId?: string}
const reference=z.string().uuid().transform(value=>value.toLowerCase());
const time=z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const retakeProofSchema=z.object({schemaVersion:z.literal(1),actorId:reference,subscriptionId:reference,productId:reference,
  subject:z.object({kind:z.literal('user'),id:reference}).strict(),stateVersion:time.min(1),validUntil:time,
  settlement:z.object({id:reference,quoteId:reference,subscriptionId:reference,productId:reference,
    subject:z.object({kind:z.literal('user'),id:reference}).strict(),purpose:z.literal('retake'),referenceId:reference,
    providerPaymentId:z.string().regex(/^pay_[A-Za-z0-9]+$/),amountMinor:time.min(1),currency:z.string().regex(/^[A-Z]{3}$/),settledAt:time}).strict(),
}).strict();
export async function readAttemptStart(request: Request, legacy=false): Promise<AttemptStartInput|Response> {
  try {
    const raw=await request.text();
    if(new TextEncoder().encode(raw).byteLength>65536)return startJson({error:'Request too large'},413);
    const body=JSON.parse(raw);
    if(!body||typeof body!=='object'||Array.isArray(body)
      ||Object.keys(body).some(key=>!(legacy?['gradeLevel','streamId','reference','operationId','sourceAttemptId','settlementId']:['gradeLevel','streamId','specialization','operationId','sourceAttemptId','settlementId']).includes(key))
      ||!grades.includes(body.gradeLevel)
      ||(body.streamId!=null&&(typeof body.streamId!=='string'||!body.streamId.length||body.streamId.length>50))
      ||(body.reference!==undefined&&!uuid(body.reference))
      ||['operationId','sourceAttemptId','settlementId'].some(key=>body[key]!==undefined&&!uuid(body[key]))
      ||((body.sourceAttemptId!==undefined||body.settlementId!==undefined)&&(!body.sourceAttemptId||!body.settlementId||!body.operationId))
      ||(body.specialization!=null&&(typeof body.specialization!=='string'||body.specialization.trim().length>150
        ||(body.specialization.trim().length>0&&body.specialization.trim().length<2))))return startJson({error:'Invalid start request'},400);
    return {gradeLevel:body.gradeLevel,streamId:body.streamId??null,...(body.reference?{reference:body.reference.toLowerCase()}:{}),
      ...(body.specialization===undefined?{}:{specialization:body.specialization?.trim()||null}),
      ...Object.fromEntries(['operationId','sourceAttemptId','settlementId'].filter(key=>body[key]!==undefined).map(key=>[key,body[key].toLowerCase()]))};
  }catch{return startJson({error:'Invalid JSON'},400);}
}
export async function createOwnedAttempt(context:AuthenticatedPagesContext,body:AttemptStartInput,learnerContext:Record<string,unknown>|null=null,reuse=false) {
  const owner=context.data.user.sub;
  if(!uuid(owner))return startJson({error:'Authentication required'},401);
  if(body.operationId!==undefined&&!uuid(body.operationId))return startJson({error:'Invalid operation reference'},400);
  const retake=body.sourceAttemptId!==undefined;
  if((retake||body.settlementId!==undefined)&&(!uuid(body.sourceAttemptId)||!uuid(body.settlementId)||!uuid(body.operationId)))return startJson({error:'Invalid retake references'},400);
  const access=await requireSubscriptionAccess({env:context.env,request:context.request,actorId:owner,
    subject:{kind:'user',id:owner},mode:'write',actionKey:retake?'assessment.retake':'assessment.start'});
  if(access instanceof Response)return access;
  if(!('binding' in access))return startJson({error:'Assessment subscription configuration unavailable'},503);
  try{
    const operationId=body.operationId??crypto.randomUUID();
    const {state}=access.context;
    const validUntil=Math.min(state.periodEndsAt,access.context.subscriptionEndsAt);
    let proof:z.infer<typeof retakeProofSchema>|null=null;
    if(retake){
      const references=z.object({sourceAttemptId:reference,settlementId:reference,operationId:reference}).parse(body);
      const token=getAuthToken(context.request);
      if(!token||!context.env.SSO_SERVICE||access.binding.paymentRequired!==true)return startJson({error:'Retake payment authority unavailable'},503);
      const rawProof=await context.env.SSO_SERVICE.prepareSubscriptionRetakeSettlement(token,state.productId,
        {subscriptionId:state.id,settlementId:references.settlementId,referenceId:references.sourceAttemptId});
      if(z.object({kind:z.literal('forbidden')}).strict().safeParse(rawProof).success)return startJson({error:'Retake payment access denied'},403);
      proof=retakeProofSchema.parse(rawProof);
      if(proof.actorId!==owner||proof.subject.id!==owner||proof.subscriptionId!==state.id||proof.productId!==state.productId
        ||proof.stateVersion!==state.version||proof.validUntil!==validUntil||proof.settlement.id!==body.settlementId
        ||proof.settlement.subscriptionId!==state.id||proof.settlement.productId!==state.productId||proof.settlement.subject.id!==owner
        ||proof.settlement.referenceId!==body.sourceAttemptId)return startJson({error:'Retake payment scope differs'},403);
    }else if(access.binding.paymentRequired===true)return startJson({error:'Assessment payment configuration unavailable'},503);
    const period=access.binding.quota?.period;
    if(period==='concurrent'||(access.grant.type!=='numeric_limit'&&access.grant.type!=='boolean'))return startJson({error:'Assessment quota configuration unavailable'},503);
    const quota=access.grant.type==='numeric_limit'&&access.binding.quota?{
      operationId,actorId:owner,subject:state.subject,subscriptionId:state.id,productId:state.productId,revisionId:state.revisionId,
      version:state.version,actionKey:access.binding.actionKey,countingEvent:access.binding.quota.countingEvent,
      periodStartsAt:period==='subscription'?access.context.activatedAt:state.periodStartsAt,
      periodEndsAt:period==='subscription'?access.context.subscriptionEndsAt:state.periodEndsAt,
      limit:access.grant.limit.kind==='finite'?access.grant.limit.value:null,
    }:null;
    const {data,error}=await getServiceClient(context.env).rpc('start_subscription_assessment',{
      p_owner:owner,p_stream:body.streamId,p_grade:body.gradeLevel,p_reference:body.reference??null,p_context:learnerContext,p_reuse:reuse,
      p_operation:operationId,p_authorization:{actorId:owner,subject:state.subject,subscriptionId:state.id,productId:state.productId,
        revisionId:state.revisionId,version:state.version,actionKey:access.binding.actionKey,validUntil},
      p_quota:quota,p_source_attempt:body.sourceAttemptId??null,p_retake_proof:proof,
    });
    if(error){
      if(['22023','22P02'].includes(error.code))return startJson({error:'Invalid assessment context'},400);
      if(error.code==='42501')return startJson({error:'Assessment access denied'},403);
      if(error.code==='54000')return startJson({error:'Assessment quota exceeded'},402);
      if(error.code==='P0002')return startJson({error:'A settled payment for the original assessment is required for every retake'},402);
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
