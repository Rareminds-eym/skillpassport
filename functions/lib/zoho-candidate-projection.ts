import { readZohoProjectionConfig, ZOHO_PROJECTION_DEFAULTS } from './zoho-config';
import { verifyWebhookSecret } from './sync-auth';
import { createDb } from './db';
import type { PagesEnv } from './types';

const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const hash = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v,k));
export function candidateProjectionReference(v: unknown): v is { operationId: string; sourceHash: string; emailPolicy: 'forbidden' } {
  return object(v) && exact(v,['operationId','sourceHash','emailPolicy']) && uuid(v.operationId) && hash(v.sourceHash) && v.emailPolicy === 'forbidden';
}
async function bounded<T>(work: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([Promise.resolve().then(work), new Promise<never>((_, reject) => {
    timer=setTimeout(() => reject(new Error('Dependency unavailable')),ZOHO_PROJECTION_DEFAULTS.dependencyTimeoutMs);
  })]); } finally { if (timer !== undefined) clearTimeout(timer); }
}
async function body(request: Request): Promise<unknown> {
  const reader=request.body?.getReader(); if (!reader) throw new Error('Body required');
  let size=0; const chunks: Uint8Array[]=[];
  try { for (;;) { const {done,value}=await reader.read(); if(done) break;
    size+=value.byteLength; if(size>ZOHO_PROJECTION_DEFAULTS.maxRequestBytes) { await reader.cancel(); throw new Error('Body limit'); } chunks.push(value);
  } } finally { reader.releaseLock(); }
  const bytes=new Uint8Array(size); let offset=0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset+=chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
/** Authenticated dependency probe only. Write flags remain independent. */
export async function handleCandidateProjectionReadiness(context: {request: Request; env: PagesEnv}, database=createDb): Promise<Response> {
  const {request,env}=context;
  const reply=(status: number, value: unknown) => Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
  const auth=await verifyWebhookSecret(request,env.INTERNAL_WEBHOOK_SECRET);
  if (!auth.ok) return reply(auth.status,{success:false});
  try {
    const source=env.ZOHO_CANDIDATE_SOURCE;
    if (typeof source?.getSubjectSyncPolicy !== 'function' || typeof source.getProjectionSnapshot !== 'function' ||
        typeof source.confirmProjection !== 'function') throw new Error('Canonical dependency unavailable');
    // Fixed non-personal reference; no caller-selected identity or operation.
    const [policy,projection]=await bounded(() => Promise.all([
      source.getSubjectSyncPolicy!({userId:'00000000-0000-4000-8000-000000000000'}),
      database(env).rpc('zoho_candidate_projection_ready',{}),
    ]));
    if (!object(policy) || !exact(policy,['version','genericSyncAllowed']) || policy.version!==1 ||
        typeof policy.genericSyncAllowed!=='boolean' || projection.error || projection.data!==true)
      throw new Error('Projection dependencies unavailable');
    return reply(200,{version:1,dependenciesReady:true,readOnly:true,emailPolicy:'forbidden',
      deliveryEnabled:readZohoProjectionConfig(env).projectionDelivery});
  } catch { return reply(503,{success:false}); }
}
/** No generic sync/admission, notification, email or caller-selected data capabilities. */
export async function handleCandidateProjection(context: {request: Request; env: PagesEnv}, database=createDb): Promise<Response> {
  const {request,env}=context;
  const reply=(status: number, value: unknown) => Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
  if (!readZohoProjectionConfig(env).projectionDelivery) return reply(503,{success:false});
  const auth=await verifyWebhookSecret(request,env.INTERNAL_WEBHOOK_SECRET);
  if (!auth.ok) return reply(auth.status,{success:false});
  let reference: {operationId:string;sourceHash:string;emailPolicy:'forbidden'};
  try {
    const input=await body(request);
    if(!object(input)||!exact(input,['action','data'])||input.action!=='project'||!candidateProjectionReference(input.data)) throw new Error('Invalid reference');
    reference=input.data;
  } catch { return reply(400,{success:false}); }
  try {
    const source=env.ZOHO_CANDIDATE_SOURCE;
    if (!source) throw new Error('Canonical authority unavailable');
    const envelope=await bounded(() => source.getProjectionSnapshot(reference));
    if (!object(envelope)||!exact(envelope,['operationId','sourceHash','targetId','projectionHash','snapshot'])||
      envelope.operationId!==reference.operationId||envelope.sourceHash!==reference.sourceHash||!uuid(envelope.targetId)||
      !hash(envelope.projectionHash)||typeof envelope.snapshot!=='string'||new TextEncoder().encode(envelope.snapshot).byteLength>131072) throw new Error('Snapshot unavailable');
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(envelope.snapshot))))
      .map(v=>v.toString(16).padStart(2,'0')).join('');
    if (digest!==envelope.projectionHash) throw new Error('Snapshot digest mismatch');
    const snapshot=JSON.parse(envelope.snapshot);
    if (!object(snapshot)||snapshot.operationId!==reference.operationId||snapshot.sourceHash!==reference.sourceHash||
      snapshot.targetId!==envelope.targetId||snapshot.emailPolicy!=='forbidden') throw new Error('Snapshot reference mismatch');
    const db=database(env);
    // Preserve original PostgreSQL text, including numeric encoding, through SQL.
    const {data,error}=await bounded(async () => db.rpc('zoho_apply_candidate_projection',{p_snapshot:envelope.snapshot,p_projection_hash:envelope.projectionHash}));
    if(error||!object(data)||!exact(data,['operationId','sourceHash','projectionHash','projectionReceiptId','emailPolicy'])||
      data.operationId!==reference.operationId||data.sourceHash!==reference.sourceHash||data.projectionHash!==envelope.projectionHash||
      !uuid(data.projectionReceiptId)||data.emailPolicy!=='forbidden') throw new Error('Projection unavailable');
    const result=await bounded(() => source.confirmProjection(data));
    if(!object(result)||result.state!=='completed'||result.operationId!==reference.operationId||result.sourceHash!==reference.sourceHash||
      result.targetId!==envelope.targetId||!uuid(result.receiptId)||result.emailPolicy!=='forbidden') throw new Error('Confirmation unavailable');
    return reply(200,{success:true,data:{...reference,completed:true}});
  } catch { return reply(503,{success:false}); }
}
