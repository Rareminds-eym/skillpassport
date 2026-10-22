import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasFeatureEntitlement } from './entitlements';

export const requirementSchema = z.object({
  levelId: z.string().uuid(), fingerprint: z.string().regex(/^[a-f0-9]{32}$/),
  capabilityName: z.string().max(300), title: z.string().max(500),
  levelNumber: z.number().int().positive(), version: z.number().int().positive(), mandatory: z.boolean(),
}).strict();
export const requirementsSchema = z.array(requirementSchema).max(20).refine(rows => new Set(rows.map(r => r.levelId)).size === rows.length, 'Duplicate learning level');
export type LearningRequirement = z.infer<typeof requirementSchema>;
const levelSchema = z.object({
  levelId: z.string().uuid(), capabilityId: z.string().uuid(), capabilityName: z.string(),
  title: z.string(), code: z.string(), levelNumber: z.number().int().positive(), version: z.number().int().positive(),
  fingerprint: z.string().regex(/^[a-f0-9]{32}$/), approved: z.boolean(),
  evidence: z.array(z.object({ submissionId: z.string().uuid(), reviewId: z.string().uuid().nullable(), reviewVersion: z.number().int().positive().nullable(), reviewedAt: z.string(),evaluationId:z.string().uuid().optional(),evaluationType:z.string().optional() })).max(500),
});
const snapshotSchema = z.object({ schemaVersion: z.literal(1), revision: z.string(),evaluationPolicy:z.enum(['human','ai']).optional(), levels: z.array(levelSchema).max(500) });
export type LearningSnapshot = z.infer<typeof snapshotSchema>;
export class LearningError extends Error {
  constructor(public code: string, message: string, public status = 503) { super(message); }
}

/** Uses the existing path-bound catalogue HMAC; never forwards a browser token. */
export async function learningServiceRequest(env:Record<string,any>,path:string,payload:unknown,timeout=15000):Promise<unknown>{
  const secret = env.LTE_CATALOG_SYNC_SECRET;
  if (typeof secret !== 'string' || secret.length < 32 || !env.LTE_APP_URL)
    throw new LearningError('LEARNING_UNAVAILABLE', 'Learning verification is not configured. Please try again later.');
  const url = new URL(path, env.LTE_APP_URL);
  if (url.protocol !== 'https:' && !['localhost','127.0.0.1','[::1]'].includes(url.hostname)) throw new LearningError('LEARNING_UNAVAILABLE', 'Learning verification is unavailable.');
  const body = JSON.stringify(payload);
  const timestamp = String(Date.now());
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`POST\n${path}\n${timestamp}\n${body}`));
  let response: Response | undefined;
  try {
    response = await fetch(url, { method: 'POST', redirect: 'manual', body, signal: AbortSignal.timeout(timeout), headers: {
      'Content-Type': 'application/json', 'x-lte-timestamp': timestamp,
      'x-lte-signature': [...new Uint8Array(signature)].map(b => b.toString(16).padStart(2,'0')).join(''),
    }});
    if (!response.ok) throw new Error('upstream');
    const raw = await response.text();
    if (raw.length > 2_000_000) throw new Error('size');
    return JSON.parse(raw);
  } catch(error) {
    console.warn('[learning] Authoritative service unavailable', {operation:path,status:response?.status,error:error instanceof Error?error.name:'UnknownError',detail:error instanceof Error?error.message.replace(/https?:\/\/\S+/g,'[service]').slice(0,180):'unavailable'});
    throw new LearningError('LEARNING_UNAVAILABLE', 'Learning evaluation is temporarily unavailable. Please retry.');
  }
}
export async function readLearningSnapshot(env: Record<string, any>, userId: string | null, levelIds: string[] | null,evaluationPolicy:'human'|'ai'='human'): Promise<LearningSnapshot> {
 try{
  const snapshot=snapshotSchema.parse(await learningServiceRequest(env,'/api/v1/internal/learning/qualifications',{userId,levelIds,evaluationPolicy}));
  if((snapshot.evaluationPolicy||'human')!==evaluationPolicy)throw new LearningError('LEARNING_UNAVAILABLE','Evaluation policy changed. Please retry.');
  return snapshot;
 }
 catch(e){if(e instanceof LearningError)throw e;throw new LearningError('LEARNING_UNAVAILABLE','Learning evidence could not be verified.');}
}

export async function refreshLearningCatalog(db: SupabaseClient, snapshot: LearningSnapshot) {
  if (!snapshot.levels.length) return;
  const { error } = await db.from('job_learning_catalog').upsert(snapshot.levels.map(l => ({
    level_id: l.levelId, capability_id: l.capabilityId, capability_name: l.capabilityName,
    title: l.title, level_number: l.levelNumber, version: l.version, fingerprint: l.fingerprint, synced_at: new Date().toISOString(),
  })), { onConflict: 'level_id' });
  if (error) throw new LearningError('LEARNING_UNAVAILABLE', 'Learning catalog could not be verified.');
}

export async function validateLearningRequirements(db: SupabaseClient, env: Record<string, any>, value: unknown): Promise<LearningRequirement[]> {
  const parsed = requirementsSchema.safeParse(value);
  if (!parsed.success) throw new LearningError('INVALID_LEARNING_REQUIREMENTS', 'Select up to 20 distinct published learning levels.', 400);
  if (!parsed.data.length) return [];
  const snapshot = await readLearningSnapshot(env, null, parsed.data.map(r => r.levelId));
  const levels = new Map(snapshot.levels.map(l => [l.levelId,l]));
  for (const requirement of parsed.data) {
    const level = levels.get(requirement.levelId);
    if (!level || level.fingerprint !== requirement.fingerprint)
      throw new LearningError('CATALOG_CHANGED', 'A selected learning level changed. Reload the learning catalog before saving.', 409);
  }
  await refreshLearningCatalog(db,snapshot);
  return parsed.data.map(r => { const l=levels.get(r.levelId)!; return { levelId:l.levelId, fingerprint:l.fingerprint,
    capabilityName:l.capabilityName, title:l.title, levelNumber:l.levelNumber, version:l.version, mandatory:r.mandatory }; });
}

export function evaluateLearning(requirements: LearningRequirement[], snapshot: LearningSnapshot, equivalents: any[] = []) {
  const levels = new Map(snapshot.levels.map(l => [l.levelId,l]));
  const criteria = requirements.map(r => {
    const l = levels.get(r.levelId);
    const equivalent = equivalents.find(e => e.level_id===r.levelId && e.fingerprint===r.fingerprint && e.status==='approved' && (e.evaluation_type!=='ai'||snapshot.evaluationPolicy==='ai'));
    const status = !l || l.fingerprint!==r.fingerprint ? 'unknown' : l.approved || equivalent ? 'eligible' : 'not_yet_eligible';
    return { ...r, status, reason: status==='unknown' ? 'CATALOG_CHANGED' : status==='eligible' ? equivalent ? equivalent.evaluation_type==='ai'?'AI_EVALUATED_EQUIVALENT':'APPROVED_EQUIVALENT' : l?.evidence.some(e=>e.evaluationType==='ai')?'AI_EVALUATED':'REVIEWER_APPROVED' : snapshot.evaluationPolicy==='ai'?'AI_EVALUATION_REQUIRED':'REVIEWER_APPROVAL_REQUIRED',
      evidence: status==='eligible' ? equivalent ? [{ equivalencyId:equivalent.id, version:equivalent.version, reviewedAt:equivalent.reviewed_at }] : l!.evidence : [],
    };
  });
  const mandatory = criteria.filter(c=>c.mandatory);
  const state = !requirements.length ? 'requirements_unspecified' : mandatory.some(c=>c.status==='not_yet_eligible') ? 'not_yet_eligible' : mandatory.some(c=>c.status==='unknown') ? 'unknown' : 'eligible';
  return { state, canApply:state==='eligible'||state==='requirements_unspecified', criteria,evaluationPolicy:snapshot.evaluationPolicy||'human', evidenceRevision:snapshot.revision, evaluatorVersion:'evaluated-learning-v2' };
}

export async function learningEvaluationPolicy(db:SupabaseClient,userId:string,learnerId:string):Promise<'human'|'ai'>{
 const {data,error}=await db.rpc('job_learning_evaluation_policy',{p_learner:learnerId,p_user:userId});
 if(error||!['human','ai'].includes(data))throw new LearningError('LEARNING_UNAVAILABLE','Your evaluation policy could not be verified.');
 return data;
}

export async function readLearningEquivalents(db:SupabaseClient,learnerId:string,policy:'human'|'ai'){
 const items:any[]=[];
 for(let offset=0;;offset+=200){
  if(offset>100000)throw new LearningError('LEARNING_UNAVAILABLE','Equivalent evidence exceeds the verification page budget.');
  const {data,error}=await db.rpc('approved_learning_equivalencies',{p_learner:learnerId,p_policy:policy,p_offset:offset});
  if(error)throw new LearningError('LEARNING_UNAVAILABLE','Equivalent evidence could not be verified.');
  items.push(...(data||[]));if((data||[]).length<200)return items;
 }
}

export async function learningDecisions(db: SupabaseClient, env: Record<string, any>, userId: string, learnerId: string, jobs: any[]) {
  const structured = jobs.filter(j=>Array.isArray(j.learning_requirements)&&j.learning_requirements.length);
  if (!structured.length) return jobs;
  if (!await hasFeatureEntitlement(db,userId,'ai_job_matching')) return jobs.map(j=>j.learning_requirements?.length ? {...j,learning_eligibility:{state:'subscription_required',canApply:false,criteria:[]}} : j);
  try {
    const ids = [...new Set<string>(structured.flatMap(j=>j.learning_requirements.map((r:LearningRequirement)=>r.levelId)))];
    if (ids.length>100) throw new LearningError('LEARNING_UNAVAILABLE','Too many levels in this request.');
    const policy=await learningEvaluationPolicy(db,userId,learnerId);
    const snapshot=await readLearningSnapshot(env,userId,ids,policy);
    const equivalents=await readLearningEquivalents(db,learnerId,policy);
    return jobs.map(j=>j.learning_requirements?.length ? {...j,learning_eligibility:evaluateLearning(requirementsSchema.parse(j.learning_requirements),snapshot,equivalents||[])} : j);
  } catch { return jobs.map(j=>j.learning_requirements?.length ? {...j,learning_eligibility:{state:'unknown',canApply:false,criteria:[]}} : j); }
}

export async function verifyLearningApplication(db: SupabaseClient, env: Record<string, any>, userId: string, learnerId: string, job: any): Promise<string | null> {
  if (!job.learning_requirements?.length) return null;
  if (!await hasFeatureEntitlement(db,userId,'ai_job_matching')) throw new LearningError('FEATURE_ACCESS_DENIED','Your subscription does not include learning-based job applications.',403);
  const policy=await learningEvaluationPolicy(db,userId,learnerId);
  const snapshot=await readLearningSnapshot(env,userId,job.learning_requirements.map((r:LearningRequirement)=>r.levelId),policy);
  const equivalents=await readLearningEquivalents(db,learnerId,policy);
  const decision=evaluateLearning(requirementsSchema.parse(job.learning_requirements),snapshot,equivalents||[]);
  if(!decision.canApply) throw new LearningError(decision.state==='unknown'?'LEARNING_UNAVAILABLE':'REQUIRED_LEVEL_NOT_APPROVED',decision.state==='unknown'?'The required learning content changed or cannot be verified. Please retry after the employer updates the requirements.':policy==='ai'?'Complete the required learning and pass AI evaluation, or submit equivalent evidence for AI evaluation.':'Complete the required levels and obtain reviewer approval, or submit equivalent evidence for review.',decision.state==='unknown'?503:403);
  const {data,error:proofError}=await db.from('job_application_verifications').insert({learner_id:learnerId,user_id:userId,opportunity_id:job.id,requirements_version:job.learning_requirements_version,evidence:decision}).select('id').single();
  if(proofError||!data) throw new LearningError('LEARNING_UNAVAILABLE','Application evidence could not be recorded.');
  return data.id;
}

export async function decorateLearningForActor(db: SupabaseClient, env: Record<string, any>, user: any, jobs: any[]) {
  if (!user.roles?.includes('learner') || !jobs.some(j=>j.learning_requirements?.length)) return jobs;
  const {data,error}=await db.from('learners').select('id').eq('user_id',user.id).maybeSingle();
  if(error||!data) return jobs.map(j=>j.learning_requirements?.length ? {...j,learning_eligibility:{state:'unknown',canApply:false,criteria:[]}} : j);
  return learningDecisions(db,env,user.id,data.id,jobs);
}
