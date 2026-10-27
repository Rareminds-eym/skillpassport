import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const f = vi.hoisted(() => ({ user: {id:'user-A'}, match:vi.fn(), refresh:vi.fn(), profile:vi.fn(), dashboard:vi.fn() }));
vi.mock('@/shared/model/authStore', () => ({useUser:()=>f.user}));
vi.mock('@/features/opportunities', () => ({matchJobsWithAI:f.match,refreshJobMatches:f.refresh}));
vi.mock('@/entities/learner/api', () => ({getlearnerByEmail:f.profile}));
vi.mock('@/shared/config/logging', () => ({getLogger:()=>({error:vi.fn()})}));
vi.mock('@/features/learner-profile/api/learnerAIRecommendationsService', () => ({getLearnerAIRecommendations:f.dashboard}));
import { useAIJobMatching } from '../useAIJobMatching';
import { useLearnerDataByEmail } from '@/entities/learner/model/useLearnerDataByEmail';
import { useLearnerAIRecommendations } from '@/features/learner-profile/model/useLearnerAIRecommendations';

function task() { let resolve!: (value:any)=>void; let reject!: (reason:any)=>void; const promise=new Promise<any>((done,fail)=>{resolve=done;reject=fail;});return {promise,resolve,reject}; }
const jobs=(id:string)=>[{job_id:id}];
beforeEach(()=>{vi.clearAllMocks();f.user={id:'user-A'};});
afterEach(cleanup);

it('never lets a previous learner overwrite a newer learner',async()=>{
  const a=task(),b=task();f.match.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const r=renderHook(({id})=>useAIJobMatching({id},true),{initialProps:{id:'A'}});
  r.rerender({id:'B'});
  await act(async()=>b.resolve(jobs('B-job')));await act(async()=>a.resolve(jobs('A-job')));
  expect(r.result.current.matchedJobs).toEqual(jobs('B-job'));
});
it('keeps disabled results cleared when a pending response completes',async()=>{
  const a=task();f.match.mockReturnValueOnce(a.promise);
  const r=renderHook(({enabled})=>useAIJobMatching({id:'A'},enabled),{initialProps:{enabled:true}});
  r.rerender({enabled:false});await act(async()=>a.resolve(jobs('A')));
  expect(r.result.current.matchedJobs).toEqual([]);
  await act(async()=>{await r.result.current.refreshMatches();});expect(f.refresh).not.toHaveBeenCalled();
});
it('keeps the newest refresh when an older successful response completes last',async()=>{
  f.match.mockResolvedValueOnce(jobs('initial'));const a=task(),b=task();f.refresh.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const r=renderHook(()=>useAIJobMatching({id:'A'},true));await act(async()=>{});
  let slow!:Promise<any>,fast!:Promise<any>;
  act(()=>{slow=r.result.current.refreshMatches();});act(()=>{fast=r.result.current.refreshMatches();});
  await act(async()=>{b.resolve(jobs('new'));await fast;});await act(async()=>{a.resolve(jobs('old'));await slow;});
  expect(r.result.current.matchedJobs).toEqual(jobs('new'));expect(r.result.current.loading).toBe(false);
});
it('does not let an obsolete failure clear a newer result or loading state',async()=>{
  f.match.mockResolvedValueOnce(jobs('initial'));const a=task(),b=task();f.refresh.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const r=renderHook(()=>useAIJobMatching({id:'A'},true));await act(async()=>{});
  let slow!:Promise<any>,fast!:Promise<any>;
  act(()=>{slow=r.result.current.refreshMatches();});act(()=>{fast=r.result.current.refreshMatches();});
  await act(async()=>{b.resolve(jobs('new'));await fast;});
  await act(async()=>{a.reject(new Error('obsolete failure'));await slow;});
  expect(r.result.current.matchedJobs).toEqual(jobs('new'));expect(r.result.current.error).toBeNull();expect(r.result.current.loading).toBe(false);
});
it('fetches when a learner_id-only profile arrives later',async()=>{
  f.match.mockResolvedValue(jobs('A'));const r=renderHook(({profile})=>useAIJobMatching(profile,true),{initialProps:{profile:undefined as any}});
  r.rerender({profile:{learner_id:'A'}});await act(async()=>{});expect(f.match).toHaveBeenCalledTimes(1);
});
it('isolates a changed authenticated account even when the learner prop has not caught up',async()=>{
  const a=task(),b=task();f.match.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const r=renderHook(()=>useAIJobMatching({id:'A'},true));f.user={id:'user-B'};r.rerender();
  await act(async()=>b.resolve(jobs('new-account')));await act(async()=>a.resolve(jobs('old-account')));
  expect(r.result.current.matchedJobs).toEqual(jobs('new-account'));
});
it('refetches on the saved-profile event only for its learner',async()=>{
  f.match.mockResolvedValue(jobs('A'));f.refresh.mockResolvedValue(jobs('fresh'));
  const r=renderHook(()=>useAIJobMatching({id:'A'},true));await act(async()=>{});
  await act(async()=>window.dispatchEvent(new CustomEvent('learner-profile-updated',{detail:{learnerId:'B'}})));
  expect(f.refresh).not.toHaveBeenCalled();
  await act(async()=>{window.dispatchEvent(new CustomEvent('learner-profile-updated',{detail:{learnerId:'A'}}));await new Promise(resolve=>setTimeout(resolve,0));});
  expect(r.result.current.matchedJobs).toEqual(jobs('fresh'));
});
it('clears the previous profile immediately and ignores its late response',async()=>{
  const a=task(),b=task();f.profile.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const r=renderHook(({email})=>useLearnerDataByEmail(email,false),{initialProps:{email:'A'}});r.rerender({email:'B'});
  expect(r.result.current.learnerData).toBeNull();
  await act(async()=>b.resolve({success:true,data:{id:'B'}}));await act(async()=>a.resolve({success:true,data:{id:'A'}}));
  expect(r.result.current.learnerData?.id).toBe('B');
});
it('clears profile data when email is removed',async()=>{
  f.profile.mockResolvedValue({success:true,data:{id:'A'}});
  const r=renderHook(({email})=>useLearnerDataByEmail(email,false),{initialProps:{email:'A' as string|undefined}});await act(async()=>{});
  r.rerender({email:undefined});expect(r.result.current.learnerData).toBeNull();expect(r.result.current.loading).toBe(false);
});
it('isolates dashboard requests across account changes and disablement',async()=>{
  const a=task(),b=task();f.dashboard.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const r=renderHook(({enabled})=>useLearnerAIRecommendations({enabled}),{initialProps:{enabled:true}});
  f.user={id:'user-B'};r.rerender({enabled:true});
  await act(async()=>b.resolve({success:true,data:{recommendations:[{id:'B'}]}}));
  await act(async()=>a.resolve({success:true,data:{recommendations:[{id:'A'}]}}));
  expect(r.result.current.recommendations).toEqual([{id:'B'}]);r.rerender({enabled:false});expect(r.result.current.recommendations).toEqual([]);
});
