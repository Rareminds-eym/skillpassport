import type { SupabaseClient } from '@supabase/supabase-js';
import { CONTEXT_MAX_BYTES, CONTEXT_MAX_ITEMS, type ContextItem } from '@rareminds-eym/ai-protocol';
import { buildCareerEvidence, type CareerEvidenceInput, type CareerEvidenceResult } from './evidence';
import type { PagesEnv } from '../../../lib/types';

import { retrieveCatalog, verifyCatalogReferences } from '../../internal/retrieval/skillpassport';
export const RAG_KINDS = ['roles.recommended', 'courses.recommended'] as const;
/** No process-global private-vector cache and no provider retry after uncertain RPC dispatch. */
export async function buildCareerRagEvidence(
  db: SupabaseClient, input: CareerEvidenceInput & {deadlineMs?:number;catalogPins?: Array<{kind:'role'|'course';id:string;revision:string}>}, nowMs: number,
  env: Pick<PagesEnv, 'EMBEDDING_SERVICE'>, signal: AbortSignal,
  baseProjection = buildCareerEvidence,
): Promise<CareerEvidenceResult> {
  const requested = input.kinds.filter(kind => (RAG_KINDS as readonly string[]).includes(kind));
  const base = await baseProjection(db, { ...input, kinds: input.kinds.filter(kind => !requested.includes(kind)) }, nowMs);
  // Existing authorization always precedes embedding or catalog reads.
  if (!requested.length || base.forbiddenResources.length || !base.learnerId) return base;
  if(input.catalogPins !== undefined) {
    if(signal.aborted) throw new Error('Catalog replay authorization is unavailable');
    await verifyCatalogReferences(db,{product:'skillpassport',task:'career-talent-strategist.chat',actorId:input.actorId},input.catalogPins.map(pin=>({sourceKey:pin.kind==='role'?'catalog.roles':'catalog.courses',id:pin.id,revision:pin.revision})),signal);
    return base;
  }
  if (!base.bundle.evidence.some(item => item.kind === 'learner.profile') ||
      !base.bundle.evidence.some(item => item.kind === 'learner.skills')) return {
    ...base, bundle: { ...base.bundle, missing: [...new Set([...base.bundle.missing, ...requested])] },
  };
  if (!env.EMBEDDING_SERVICE) throw new Error('Career retrieval is unavailable');
  if (signal.aborted) throw new Error('Career retrieval timed out');
  const question = input.query?.trim().slice(0,1000);
  if (!question) throw new Error('Career retrieval query is missing');
  const skills = base.bundle.evidence.filter(item => item.kind === 'learner.skills').slice(0,8).map(item => item.text.slice(0,120));
  // Names, email, institution and full profile are deliberately excluded.
  const query = `Career learning search: ${question}\nExisting skills: ${skills.join('; ')}`.slice(0,2200);
  const retrieved=await retrieveCatalog(db,env.EMBEDDING_SERVICE,{product:'skillpassport',task:'career-talent-strategist.chat',actorId:input.actorId},{version:1,sourceKeys:requested.map(kind=>kind==='roles.recommended'?'catalog.roles':'catalog.courses'),query,deadlineMs:Math.min(input.deadlineMs ?? nowMs+4000,nowMs+3500),limit:3},signal,async()=>Boolean(base.learnerId)&&!base.forbiddenResources.length,question);
  const rows = await Promise.all(requested.map(async (kind,index) => {
    const checked={data:retrieved[index]!.result};
    const expectedKind = kind === 'roles.recommended' ? 'role' : 'course';
    const items = checked.data.items.map(hit => ({
      id: hit.id, title: hit.title.slice(0,160), description: hit.description.slice(0,450),
      ...(hit.requirements ? { requirements: hit.requirements.slice(0,200) } : {}),
      ...(hit.outcomes ? { outcomes: hit.outcomes.slice(0,200) } : {}),
      revision: hit.revision, indexedAt: hit.indexed_at,
      similarity: hit.similarity, model: hit.model, indexVersion: hit.index_version,
      ...(hit.kind === 'course' ? { catalogUrl: '/learner/courses' } : {}),
    }));
    const payload = { status: checked.data.status, items,
      limitations: 'Relevance suggestions only. Eligibility, prerequisites and enrollment are not established. Initial scope excludes institution-specific courses and mandatory-degree roles.' };
    while (JSON.stringify(payload).length > 4000 && items.length > 1) items.pop();
    const text = JSON.stringify(payload);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return { kind, reference: `catalog:${expectedKind}`, text,
      source: `skillpassport:career-rag:${expectedKind}`, gatheredAt: new Date(nowMs).toISOString(),
      revision: Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2,'0')).join('') } satisfies ContextItem;
  }));
  const bundle = { ...base.bundle, evidence: [...base.bundle.evidence, ...rows],
    missing: base.bundle.missing.filter(kind => !requested.includes(kind)), sources: [...base.bundle.sources] };
  // RAG has priority over unrelated optional evidence, never over required learner evidence.
  const trim = () => {
    const index = bundle.evidence.findIndex(item => !['learner.profile','learner.skills',...RAG_KINDS].includes(item.kind));
    if (index < 0) throw new Error('Career retrieval evidence exceeds its budget');
    const [removed] = bundle.evidence.splice(index,1);
    if (removed && !bundle.evidence.some(item => item.kind === removed.kind)) bundle.missing.push(removed.kind);
  };
  bundle.sources = [...new Set(bundle.evidence.map(item => item.source))];
  while (bundle.evidence.length > CONTEXT_MAX_ITEMS || new TextEncoder().encode(JSON.stringify(bundle)).byteLength > CONTEXT_MAX_BYTES) {
    trim(); bundle.sources = [...new Set(bundle.evidence.map(item => item.source))];
  }
  return { ...base, bundle };
}
