import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useRecommendationSaveBridge } from '@/shared/model/recommendations/useRecommendationQuery';
import { recommendationKeys } from '@/shared/lib/queryKeys/recommendations';

const f = vi.hoisted(() => ({ user: {id:'user-A',orgId:'org-A'} as any, match:vi.fn(), refresh:vi.fn(), profile:vi.fn(), dashboard:vi.fn(), revision:vi.fn() }));
vi.mock('@/shared/model/authStore', () => ({useUser:()=>f.user}));
vi.mock('@/shared/api/recommendationRevision', () => ({ loadRecommendationRevision: (...args:any[]) => f.revision(...args) }));
vi.mock('../../api/aiJobMatchingService', () => ({getJobRecommendations:(profile:any, topN:number, force:boolean, signal:AbortSignal) => force ? f.refresh(profile,topN,signal) : f.match(profile,topN,signal)}));
vi.mock('@/entities/learner/api', () => ({getlearnerByEmail:f.profile}));
vi.mock('@/shared/config/logging', () => ({getLogger:()=>({error:vi.fn()})}));
vi.mock('@/features/learner-profile/api/learnerAIRecommendationsService', () => ({getLearnerRecommendationEnvelope:f.dashboard}));
import { useAIJobMatching } from '../useAIJobMatching';
import { useLearnerDataByEmail } from '@/entities/learner/model/useLearnerDataByEmail';
import { useLearnerAIRecommendations } from '@/features/learner-profile/model/useLearnerAIRecommendations';

function task() { let resolve!: (value:any)=>void; let reject!: (reason:any)=>void; const promise=new Promise<any>((done,fail)=>{resolve=done;reject=fail;});return {promise,resolve,reject}; }
const envelope = (id?:string) => ({schemaVersion:2,state:id?'ready':'no_matches',readiness:{state:'ready',policyVersion:'career-readiness-4',coverage:['skills'],suggestedActions:[]},recommendations:id?[{id}]:[],provenance:'embedding',cached:true,input_revision:'42',computed_at:'2026-10-28T10:00:00Z'});
const jobs=(id?:string)=>({matches:id?[{job_id:id}]:[],envelope:envelope(id)});
let client:QueryClient;
function Wrapper({children}:{children:React.ReactNode}) {useRecommendationSaveBridge(client);return <QueryClientProvider client={client}>{children}</QueryClientProvider>;}
const semanticKey=(learner='A',org='org-A',limit=3)=>recommendationKeys.result('user-A',org,learner,'semantic',{limit,profileRevision:''});
beforeEach(()=>{vi.resetAllMocks();f.revision.mockResolvedValue({ inputRevision: '42', catalogRevision: '7' });f.user={id:'user-A',orgId:'org-A'};client=new QueryClient({defaultOptions:{queries:{retry:1,refetchOnMount:false}}});});
afterEach(()=>{cleanup();client.clear();vi.useRealTimers();});

it('refreshes a server-side approval change using metadata without a browser save event', async () => {
  vi.useFakeTimers();
  f.match.mockResolvedValueOnce(jobs('before')).mockResolvedValue({ matches: [{ job_id: 'after' }], envelope: { ...envelope('after'), input_revision: '43' } });
  f.revision.mockResolvedValueOnce({ inputRevision: '42', catalogRevision: '7' }).mockResolvedValue({ inputRevision: '43', catalogRevision: '7' });
  const r = renderHook(() => useAIJobMatching({ id: 'A' }), { wrapper: Wrapper });
  await tick(1); expect(r.result.current.matchedJobs).toEqual(jobs('before').matches);
  await tick(30000); expect(r.result.current.matchedJobs).toEqual([{ job_id: 'after' }]);
  expect(f.match).toHaveBeenCalledTimes(2);
});

it('does not regenerate unchanged metadata and stops metadata checks when disabled', async () => {
  vi.useFakeTimers(); f.match.mockResolvedValue(jobs('current'));
  const r = renderHook(({ enabled }) => useAIJobMatching({ id: 'A' }, enabled), { initialProps: { enabled: true }, wrapper: Wrapper });
  await tick(1); await tick(90000); expect(f.match).toHaveBeenCalledTimes(1);
  r.rerender({ enabled: false }); const count = f.revision.mock.calls.length;
  await tick(90000); expect(f.revision).toHaveBeenCalledTimes(count);
});

it('refreshes a changed job catalogue even when the learner revision is unchanged', async () => {
  vi.useFakeTimers();
  f.match.mockResolvedValueOnce({ ...jobs('before'), envelope: { ...envelope('before'), catalog_revision: '7' } }).mockResolvedValue({ ...jobs('after'), envelope: { ...envelope('after'), catalog_revision: '8' } });
  f.revision.mockResolvedValueOnce({ inputRevision: '42', catalogRevision: '7' }).mockResolvedValue({ inputRevision: '42', catalogRevision: '8' });
  const r = renderHook(() => useAIJobMatching({ id: 'A' }), { wrapper: Wrapper });
  await tick(1); await tick(30000); expect(r.result.current.matchedJobs).toEqual(jobs('after').matches);
  expect(f.match).toHaveBeenCalledTimes(2);
});

it('never lets a previous learner overwrite a newer learner and aborts its request',async()=>{
  const a=task(),b=task();f.match.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const r=renderHook(({id})=>useAIJobMatching({id},true),{initialProps:{id:'A'},wrapper:Wrapper});
  const oldSignal=f.match.mock.calls[0][2];r.rerender({id:'B'});
  await act(async()=>b.resolve(jobs('B-job')));await waitFor(()=>expect(r.result.current.matchedJobs).toEqual(jobs('B-job').matches));
  await act(async()=>a.resolve(jobs('A-job')));
  expect(r.result.current.matchedJobs).toEqual(jobs('B-job').matches);expect(oldSignal.aborted).toBe(true);
});
it('keeps disabled results cleared when a pending response completes',async()=>{
  const a=task();f.match.mockReturnValueOnce(a.promise);
  const r=renderHook(({enabled})=>useAIJobMatching({id:'A'},enabled),{initialProps:{enabled:true},wrapper:Wrapper});
  r.rerender({enabled:false});await act(async()=>a.resolve(jobs('A')));
  expect(r.result.current.matchedJobs).toEqual([]);expect(f.match.mock.calls[0][2].aborted).toBe(true);
  await act(async()=>{await r.result.current.refreshMatches();});expect(f.refresh).not.toHaveBeenCalled();
});
it('deduplicates repeated regeneration clicks across observers of the same query',async()=>{
  f.match.mockResolvedValue(jobs('initial'));const pending=task();f.refresh.mockReturnValue(pending.promise);
  const one=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});
  const two=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});
  await waitFor(()=>expect(one.result.current.matchedJobs).toHaveLength(1));
  expect(f.match).toHaveBeenCalledTimes(1);
  let first!:Promise<unknown>,second!:Promise<unknown>;
  act(()=>{first=one.result.current.refreshMatches();second=two.result.current.refreshMatches();});
  expect(second).toBe(first);await waitFor(()=>expect(f.refresh).toHaveBeenCalledTimes(1));
  await act(async()=>{pending.resolve(jobs('new'));await first;});
  await waitFor(()=>expect(two.result.current.matchedJobs).toEqual(jobs('new').matches));
});
it.each(['success','failure'])('does not let an obsolete initial %s overwrite a regenerated result',async completion=>{
  const old=task();f.match.mockReturnValueOnce(old.promise);f.refresh.mockResolvedValueOnce(jobs('new'));
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});
  await act(async()=>{await r.result.current.refreshMatches();});
  await waitFor(()=>expect(r.result.current.matchedJobs).toEqual(jobs('new').matches));
  await act(async()=>completion==='success'?old.resolve(jobs('old')):old.reject(new Error('obsolete')));
  expect(r.result.current.error).toBeNull();expect(r.result.current.matchedJobs).toEqual(jobs('new').matches);
});
it('fetches when a learner_id-only profile arrives later and blocks a known foreign owner',async()=>{
  f.match.mockResolvedValue(jobs('A'));
  const r=renderHook(({profile})=>useAIJobMatching(profile),{initialProps:{profile:undefined as any},wrapper:Wrapper});
  r.rerender({profile:{learner_id:'A',user_id:'foreign'}});expect(f.match).not.toHaveBeenCalled();
  r.rerender({profile:{learner_id:'A',user_id:'user-A'}});await waitFor(()=>expect(r.result.current.matchedJobs).toHaveLength(1));
});
it('isolates profile guidance across authenticated account and organization changes',async()=>{
  f.match.mockResolvedValueOnce({matches:[],envelope:{...envelope(),state:'needs_profile',provenance:'none',cached:false,readiness:{state:'needs_profile',policyVersion:'career-readiness-4',coverage:[],suggestedActions:['add_skill']}}});
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});
  await waitFor(()=>expect(r.result.current.readiness?.state).toBe('needs_profile'));
  const pending=task();f.match.mockReturnValue(pending.promise);f.user={id:'user-A',orgId:'org-B'};r.rerender();
  expect(r.result.current.readiness).toBeNull();expect(r.result.current.envelope).toBeNull();
  f.user={id:'user-B',orgId:'org-B'};r.rerender();expect(r.result.current.envelope).toBeNull();
});
it('isolates account changes even when learner props have not caught up',async()=>{
  const a=task(),b=task();f.match.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});f.user={id:'user-B',orgId:'org-A'};r.rerender();
  await act(async()=>b.resolve(jobs('new-account')));await waitFor(()=>expect(r.result.current.matchedJobs).toEqual(jobs('new-account').matches));
  await act(async()=>a.resolve(jobs('old-account')));expect(r.result.current.matchedJobs).toEqual(jobs('new-account').matches);
});
it('resets only matching learner queries once across multiple observers after a save',async()=>{
  f.match.mockResolvedValueOnce(jobs('old'));const pending=task();
  const one=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});
  const two=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});
  await waitFor(()=>expect(two.result.current.matchedJobs).toHaveLength(1));
  await act(async()=>window.dispatchEvent(new CustomEvent('learner-profile-updated',{detail:{learnerId:'B'}})));expect(f.match).toHaveBeenCalledTimes(1);
  f.match.mockReturnValueOnce(pending.promise);
  await act(async()=>window.dispatchEvent(new CustomEvent('learner-profile-updated',{detail:{learnerId:'A'}})));
  await waitFor(()=>expect(one.result.current.envelope).toBeNull());expect(two.result.current.matchedJobs).toEqual([]);expect(f.match).toHaveBeenCalledTimes(2);
  await act(async()=>pending.resolve(jobs('fresh')));await waitFor(()=>expect(two.result.current.matchedJobs).toEqual(jobs('fresh').matches));
});
it('retains empty envelope metadata and refetches stale data on mount despite global defaults',async()=>{
  f.match.mockResolvedValue(jobs());client.setQueryData(semanticKey(),jobs('stale'),{updatedAt:Date.now()-31000});
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});
  await waitFor(()=>expect(r.result.current.state).toBe('no_matches'));
  expect(r.result.current.cacheInfo).toEqual({cached:true,computedAt:'2026-10-28T10:00:00Z'});expect(r.result.current.envelope?.input_revision).toBe('42');
});
it.each([401,403,429,503])('does not automatically retry status %i',async status=>{
  f.match.mockRejectedValue(Object.assign(new Error('controlled'),{status}));
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await waitFor(()=>expect(r.result.current.error).toBe('controlled'));expect(f.match).toHaveBeenCalledTimes(1);
});
it('restarts a revision conflict once and enforces rate-limit cooldown on manual requests',async()=>{
  f.match.mockRejectedValueOnce(Object.assign(new Error('changed'),{status:409})).mockResolvedValueOnce(jobs('fresh'));
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await waitFor(()=>expect(r.result.current.matchedJobs).toHaveLength(1));expect(f.match).toHaveBeenCalledTimes(2);
  f.refresh.mockRejectedValueOnce(Object.assign(new Error('wait'),{status:429,retryAt:Date.now()+60000}));
  await act(async()=>{await r.result.current.refreshMatches();});await waitFor(()=>expect(r.result.current.error).toBe('wait'));
  await act(async()=>{await r.result.current.refreshMatches();});expect(f.refresh).toHaveBeenCalledTimes(1);
});
it('does not cancel a shared request when one observer is disabled',async()=>{
  const pending=task();f.match.mockReturnValue(pending.promise);
  const one=renderHook(({enabled})=>useAIJobMatching({id:'A'},enabled),{initialProps:{enabled:true},wrapper:Wrapper});
  const two=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});one.rerender({enabled:false});
  expect(f.match.mock.calls[0][2].aborted).toBe(false);await act(async()=>pending.resolve(jobs('shared')));
  await waitFor(()=>expect(two.result.current.matchedJobs).toHaveLength(1));expect(one.result.current.matchedJobs).toEqual([]);
});
it('clears the previous profile immediately and ignores its late response',async()=>{
  const a=task(),b=task();f.profile.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const r=renderHook(({email})=>useLearnerDataByEmail(email,false),{initialProps:{email:'A'},wrapper:Wrapper});r.rerender({email:'B'});
  expect(r.result.current.learnerData).toBeNull();await act(async()=>b.resolve({success:true,data:{id:'B'}}));await act(async()=>a.resolve({success:true,data:{id:'A'}}));expect(r.result.current.learnerData?.id).toBe('B');
});
it('clears profile data when email is removed',async()=>{
  f.profile.mockResolvedValue({success:true,data:{id:'A'}});
  const r=renderHook(({email})=>useLearnerDataByEmail(email,false),{initialProps:{email:'A' as string|undefined},wrapper:Wrapper});await act(async()=>{});
  r.rerender({email:undefined});expect(r.result.current.learnerData).toBeNull();
});
it('isolates dashboard requests across account changes and disablement',async()=>{
  const a=task(),b=task();f.dashboard.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const r=renderHook(({enabled})=>useLearnerAIRecommendations({enabled,learnerId:'A'}),{initialProps:{enabled:true},wrapper:Wrapper});
  f.user={id:'user-B',orgId:'org-A'};r.rerender({enabled:true});await act(async()=>b.resolve(envelope('B')));
  await waitFor(()=>expect(r.result.current.recommendations).toEqual([{id:'B'}]));await act(async()=>a.resolve(envelope('A')));
  r.rerender({enabled:false});expect(r.result.current.recommendations).toEqual([]);
});
it('waits for a resolved dashboard learner and supports manual fetching with autoFetch off',async()=>{
  f.dashboard.mockResolvedValue(envelope('manual'));
  const r=renderHook(({learnerId})=>useLearnerAIRecommendations({learnerId,autoFetch:false}),{initialProps:{learnerId:''},wrapper:Wrapper});
  await act(async()=>{await r.result.current.fetchRecommendations();});expect(f.dashboard).not.toHaveBeenCalled();r.rerender({learnerId:'A'});expect(f.dashboard).not.toHaveBeenCalled();
  await act(async()=>{await r.result.current.fetchRecommendations();});await waitFor(()=>expect(r.result.current.recommendations).toHaveLength(1));
});
it('suppresses both surfaces after an acknowledged save while unrelated caches remain intact',async()=>{
  f.match.mockResolvedValueOnce(jobs('old'));f.dashboard.mockResolvedValueOnce(envelope('old-dashboard'));
  const semantic=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});
  const dashboard=renderHook(()=>useLearnerAIRecommendations({learnerId:'A'}),{wrapper:Wrapper});
  await waitFor(()=>expect(dashboard.result.current.recommendations).toHaveLength(1));await waitFor(()=>expect(semantic.result.current.matchedJobs).toHaveLength(1));
  client.setQueryData(['unrelated'],{keep:true});f.match.mockReturnValueOnce(task().promise);f.dashboard.mockReturnValueOnce(task().promise);
  await act(async()=>window.dispatchEvent(new CustomEvent('learner-profile-updated',{detail:{learnerId:'A'}})));
  await waitFor(()=>expect(dashboard.result.current.recommendations).toEqual([]));expect(semantic.result.current.matchedJobs).toEqual([]);expect(client.getQueryData(['unrelated'])).toEqual({keep:true});
});
it('rejects a pre-save regeneration that resolves after the refreshed profile',async()=>{
  f.match.mockResolvedValueOnce(jobs('before'));const regeneration=task();f.refresh.mockReturnValueOnce(regeneration.promise);
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await waitFor(()=>expect(r.result.current.matchedJobs).toHaveLength(1));
  let refresh!:Promise<unknown>;act(()=>{refresh=r.result.current.refreshMatches();});await waitFor(()=>expect(f.refresh).toHaveBeenCalledTimes(1));
  f.match.mockResolvedValueOnce(jobs('after-save'));
  await act(async()=>window.dispatchEvent(new CustomEvent('learner-profile-updated',{detail:{learnerId:'A'}})));
  await waitFor(()=>expect(r.result.current.matchedJobs).toEqual(jobs('after-save').matches));
  await act(async()=>{regeneration.resolve(jobs('obsolete'));await refresh;});
  expect(r.result.current.matchedJobs).toEqual(jobs('after-save').matches);
});
it('does not begin regeneration if its last observer unmounts before cancellation completes',async()=>{
  f.match.mockResolvedValueOnce(jobs('before'));const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await waitFor(()=>expect(r.result.current.matchedJobs).toHaveLength(1));
  const pending=task();vi.spyOn(client,'cancelQueries').mockReturnValueOnce(pending.promise);
  let refresh!:Promise<unknown>;act(()=>{refresh=r.result.current.refreshMatches();});r.unmount();
  await act(async()=>{pending.resolve(undefined);await refresh;});expect(f.refresh).not.toHaveBeenCalled();
});
it('starts a separate query when known source revisions or normalized limits change',async()=>{
  f.match.mockResolvedValue(jobs('initial'));
  const r=renderHook(({revision,limit})=>useAIJobMatching({id:'A',recommendation_revision:revision},true,limit),{initialProps:{revision:1,limit:3},wrapper:Wrapper});
  await waitFor(()=>expect(r.result.current.matchedJobs).toHaveLength(1));
  const pending=task();f.match.mockReturnValue(pending.promise);r.rerender({revision:2,limit:3});expect(r.result.current.matchedJobs).toEqual([]);
  expect(f.match.mock.calls[1][1]).toBe(3);r.rerender({revision:2,limit:999});expect(f.match.mock.calls[2][1]).toBe(50);
});

it('clears cached cards after saves while widgets are disabled or unmounted',async()=>{
  // Keep the provider bridge mounted independently from the widget lifecycle.
  renderHook(()=>useRecommendationSaveBridge(client));
  f.match.mockResolvedValueOnce(jobs('old'));
  const r=renderHook(({enabled})=>useAIJobMatching({id:'A'},enabled),{initialProps:{enabled:true},wrapper:Wrapper});
  await waitFor(()=>expect(r.result.current.matchedJobs).toHaveLength(1));r.rerender({enabled:false});
  await act(async()=>window.dispatchEvent(new CustomEvent('learner-profile-updated',{detail:{learnerId:'A'}})));
  expect(client.getQueryData(semanticKey())).toBeUndefined();expect(f.match).toHaveBeenCalledTimes(1);
  r.unmount();client.setQueryData(semanticKey(),jobs('cached-while-away'));
  await act(async()=>window.dispatchEvent(new CustomEvent('learner-profile-updated',{detail:{learnerId:'A'}})));
  expect(client.getQueryData(semanticKey())).toBeUndefined();
});
it('honors Retry-After across remounts, saved-profile resets and request-option changes',async()=>{
  f.match.mockRejectedValue(Object.assign(new Error('wait'),{status:429,retryAt:Date.now()+60000}));
  const first=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await waitFor(()=>expect(first.result.current.error).toBe('wait'));first.unmount();
  const second=renderHook(({limit})=>useAIJobMatching({id:'A'},true,limit),{initialProps:{limit:3},wrapper:Wrapper});
  await act(async()=>{});expect(f.match).toHaveBeenCalledTimes(1);
  second.rerender({limit:5});await act(async()=>{});expect(f.match).toHaveBeenCalledTimes(1);
  await act(async()=>window.dispatchEvent(new CustomEvent('learner-profile-updated',{detail:{learnerId:'A'}})));
  expect(f.match).toHaveBeenCalledTimes(1);await act(async()=>{await second.result.current.refreshMatches();});expect(f.refresh).not.toHaveBeenCalled();
});
it.each([401,403])('suppresses cached cards and readiness after status %i on both surfaces',async status=>{
  f.match.mockResolvedValueOnce(jobs('old'));f.dashboard.mockResolvedValueOnce(envelope('old-dashboard'));
  const one=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});const two=renderHook(()=>useLearnerAIRecommendations({learnerId:'A'}),{wrapper:Wrapper});
  await waitFor(()=>expect(one.result.current.matchedJobs).toHaveLength(1));await waitFor(()=>expect(two.result.current.recommendations).toHaveLength(1));
  f.refresh.mockRejectedValueOnce(Object.assign(new Error('denied'),{status}));f.dashboard.mockRejectedValueOnce(Object.assign(new Error('denied'),{status}));
  await act(async()=>{await Promise.all([one.result.current.refreshMatches(),two.result.current.refreshRecommendations()]);});
  await waitFor(()=>expect(one.result.current.error).toBe('denied'));expect(two.result.current.error).toBe('denied');
  expect(one.result.current.matchedJobs).toEqual([]);expect(one.result.current.readiness).toBeNull();expect(two.result.current.recommendations).toEqual([]);expect(two.result.current.readiness).toBeNull();
});
it('continues shared regeneration if the initiating widget unmounts before the request starts',async()=>{
  f.match.mockResolvedValue(jobs('initial'));f.refresh.mockResolvedValueOnce(jobs('regenerated'));
  const one=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});const two=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});
  await waitFor(()=>expect(two.result.current.matchedJobs).toHaveLength(1));let first!:Promise<unknown>,second!:Promise<unknown>;
  await act(async()=>{first=one.result.current.refreshMatches();second=two.result.current.refreshMatches();one.unmount();await Promise.all([first,second]);});
  expect(first).toBe(second);expect(f.refresh).toHaveBeenCalledTimes(1);await waitFor(()=>expect(two.result.current.matchedJobs).toEqual(jobs('regenerated').matches));
});
it('allows regeneration after Retry-After expires and restores cards after access is granted',async()=>{
  const now=Date.now();let clock=now;const date=vi.spyOn(Date,'now').mockImplementation(()=>clock);
  try {
    f.match.mockRejectedValueOnce(Object.assign(new Error('wait'),{status:429,retryAt:now+60000}));
    const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await waitFor(()=>expect(r.result.current.error).toBe('wait'));
    clock=now+60001;f.refresh.mockResolvedValueOnce(jobs('after-cooldown'));
    await act(async()=>{await r.result.current.refreshMatches();});await waitFor(()=>expect(r.result.current.matchedJobs).toEqual(jobs('after-cooldown').matches));
    f.refresh.mockRejectedValueOnce(Object.assign(new Error('denied'),{status:403}));await act(async()=>{await r.result.current.refreshMatches();});await waitFor(()=>expect(r.result.current.matchedJobs).toEqual([]));
    f.refresh.mockResolvedValueOnce(jobs('access-restored'));await act(async()=>{await r.result.current.refreshMatches();});
    await waitFor(()=>expect(r.result.current.matchedJobs).toEqual(jobs('access-restored').matches));expect(r.result.current.error).toBeNull();
  } finally {date.mockRestore();}
});
it('isolates cooldowns by authenticated actor and keeps dashboard requests independent',async()=>{
  f.match.mockRejectedValueOnce(Object.assign(new Error('wait'),{status:429,retryAt:Date.now()+60000}));
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await waitFor(()=>expect(r.result.current.error).toBe('wait'));
  f.dashboard.mockResolvedValueOnce(envelope('dashboard'));
  const dashboard=renderHook(()=>useLearnerAIRecommendations({learnerId:'A'}),{wrapper:Wrapper});await waitFor(()=>expect(dashboard.result.current.recommendations).toHaveLength(1));
  f.user={id:'user-B',orgId:'org-A'};f.match.mockResolvedValueOnce(jobs('other-account'));r.rerender();
  await waitFor(()=>expect(r.result.current.matchedJobs).toEqual(jobs('other-account').matches));
});
it('keeps shared regeneration alive for a remaining manual-only dashboard observer',async()=>{
  f.dashboard.mockResolvedValueOnce(envelope('initial')).mockResolvedValueOnce(envelope('regenerated'));
  const one=renderHook(()=>useLearnerAIRecommendations({learnerId:'A'}),{wrapper:Wrapper});
  const two=renderHook(()=>useLearnerAIRecommendations({learnerId:'A',autoFetch:false}),{wrapper:Wrapper});
  await waitFor(()=>expect(two.result.current.recommendations).toEqual([{id:'initial'}]));
  await act(async()=>{const pending=one.result.current.refreshRecommendations();one.unmount();await pending;});
  expect(f.dashboard).toHaveBeenCalledTimes(2);await waitFor(()=>expect(two.result.current.recommendations).toEqual([{id:'regenerated'}]));
});

const waitingJobs = (seconds=3, retryAt?:number) => ({matches:[],envelope:{...envelope(),state:'index_building',provenance:'none',cached:false,retry_after_seconds:seconds,retry_at:retryAt}});
async function tick(ms:number) {await act(async()=>{await vi.advanceTimersByTimeAsync(ms);});}
it('waits for the advertised interval then publishes a terminal result',async()=>{
  vi.useFakeTimers();f.match.mockResolvedValueOnce(waitingJobs()).mockResolvedValueOnce(jobs('done'));
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await tick(1);
  expect(r.result.current.processing).toBe('index_building');expect(r.result.current.matchedJobs).toEqual([]);
  await tick(2998);expect(f.match).toHaveBeenCalledTimes(1);await tick(2);await tick(1);
  expect(f.match).toHaveBeenCalledTimes(2);expect(r.result.current.matchedJobs).toEqual(jobs('done').matches);expect(r.result.current.processing).toBeNull();
  await tick(30000);expect(f.match).toHaveBeenCalledTimes(2);
});
it('retains the polling budget across remounts and stops after five pending responses',async()=>{
  vi.useFakeTimers();f.match.mockResolvedValue(waitingJobs());
  const first=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await tick(1);first.unmount();
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await tick(1000);expect(f.match).toHaveBeenCalledTimes(1);
  await tick(60000);expect(f.match).toHaveBeenCalledTimes(5);expect(r.result.current.error).toContain('taking longer');expect(r.result.current.processing).toBeNull();expect(r.result.current.loading).toBe(false);
  f.refresh.mockResolvedValueOnce(jobs('manual-retry'));await act(async()=>{await r.result.current.refreshMatches();});await tick(1);expect(r.result.current.matchedJobs).toEqual(jobs('manual-retry').matches);
});
it('respects a long Retry-After without requesting past the two-minute deadline',async()=>{
  vi.useFakeTimers();f.match.mockResolvedValue(waitingJobs(3,Date.now()+180000));
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await tick(1);await tick(120001);
  expect(f.match).toHaveBeenCalledTimes(1);expect(r.result.current.error).toContain('taking longer');
});
it('aborts a hanging poll at the deadline and rejects its late success',async()=>{
  vi.useFakeTimers();const hanging=task();f.match.mockResolvedValueOnce(waitingJobs(60)).mockReturnValueOnce(hanging.promise);
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await tick(1);await tick(60001);
  expect(f.match).toHaveBeenCalledTimes(2);const signal=f.match.mock.calls[1][2];expect(signal.aborted).toBe(false);
  await tick(60001);expect(signal.aborted).toBe(true);expect(r.result.current.error).toContain('taking longer');
  await act(async()=>hanging.resolve(jobs('obsolete')));expect(r.result.current.matchedJobs).toEqual([]);
});
it('uses ordinary polling after forced regeneration and ignores refresh clicks while waiting',async()=>{
  vi.useFakeTimers();f.match.mockResolvedValueOnce(jobs('initial')).mockResolvedValueOnce(jobs('done'));f.refresh.mockResolvedValueOnce(waitingJobs());
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await tick(1);
  await act(async()=>{await r.result.current.refreshMatches();});await tick(1);expect(r.result.current.processing).toBe('index_building');
  await act(async()=>{await r.result.current.refreshMatches();});expect(f.refresh).toHaveBeenCalledTimes(1);
  await tick(3001);expect(f.match).toHaveBeenCalledTimes(2);expect(f.refresh).toHaveBeenCalledTimes(1);expect(r.result.current.matchedJobs).toEqual(jobs('done').matches);
});
it('stops polling after disablement and allows explicit recovery from a poll failure',async()=>{
  vi.useFakeTimers();f.match.mockResolvedValueOnce(waitingJobs()).mockRejectedValueOnce(Object.assign(new Error('dependency unavailable'),{status:503}));
  const r=renderHook(({enabled})=>useAIJobMatching({id:'A'},enabled),{initialProps:{enabled:true},wrapper:Wrapper});await tick(1);
  r.rerender({enabled:false});await tick(10000);expect(f.match).toHaveBeenCalledTimes(1);
  r.rerender({enabled:true});await tick(2);expect(r.result.current.error).toBe('dependency unavailable');await tick(20000);expect(f.match).toHaveBeenCalledTimes(2);
  f.refresh.mockResolvedValueOnce(jobs('recovered'));await act(async()=>{await r.result.current.refreshMatches();});await tick(1);expect(r.result.current.matchedJobs).toEqual(jobs('recovered').matches);
});

it('follows a manually started dashboard preparation without auto-fetching beforehand',async()=>{
  vi.useFakeTimers();f.dashboard.mockResolvedValueOnce(waitingJobs().envelope).mockResolvedValueOnce(envelope('done'));
  const r=renderHook(()=>useLearnerAIRecommendations({learnerId:'A',autoFetch:false}),{wrapper:Wrapper});await tick(1);expect(f.dashboard).not.toHaveBeenCalled();
  await act(async()=>{await r.result.current.refreshRecommendations();});await tick(1);expect(r.result.current.processing).toBe('index_building');
  await tick(3001);expect(f.dashboard).toHaveBeenCalledTimes(2);expect(r.result.current.recommendations).toEqual([{id:'done'}]);
});
it('does not carry polling across authenticated account changes',async()=>{
  vi.useFakeTimers();f.match.mockResolvedValueOnce(waitingJobs()).mockResolvedValueOnce(jobs('new-account'));
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await tick(1);f.user={id:'user-B',orgId:'org-A'};r.rerender();await tick(1);
  await tick(30000);expect(f.match).toHaveBeenCalledTimes(2);expect(r.result.current.matchedJobs).toEqual(jobs('new-account').matches);
});
it('cancels a pre-save poll and cannot resurrect its budget from a late response',async()=>{
  vi.useFakeTimers();const old=task();f.match.mockResolvedValueOnce(waitingJobs()).mockReturnValueOnce(old.promise).mockResolvedValueOnce(jobs('after-save'));
  const r=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});await tick(1);await tick(3001);const oldSignal=f.match.mock.calls[1][2];
  await act(async()=>window.dispatchEvent(new CustomEvent('learner-profile-updated',{detail:{learnerId:'A'}})));await tick(1);expect(oldSignal.aborted).toBe(true);
  await act(async()=>old.resolve(waitingJobs()));await tick(30000);expect(r.result.current.matchedJobs).toEqual(jobs('after-save').matches);expect(r.result.current.processing).toBeNull();expect(f.match).toHaveBeenCalledTimes(3);
});

it('shares pending reads across observers without duplicate network polling',async()=>{
  vi.useFakeTimers();f.match.mockResolvedValueOnce(waitingJobs()).mockResolvedValueOnce(jobs('shared-ready'));
  const one=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});const two=renderHook(()=>useAIJobMatching({id:'A'}),{wrapper:Wrapper});
  await tick(1);expect(f.match).toHaveBeenCalledTimes(1);await tick(3001);expect(f.match).toHaveBeenCalledTimes(2);expect(one.result.current.matchedJobs).toEqual(jobs('shared-ready').matches);expect(two.result.current.matchedJobs).toEqual(jobs('shared-ready').matches);
});
