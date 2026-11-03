// @vitest-environment jsdom
import {StrictMode,type PropsWithChildren} from 'react';
import {act,cleanup,renderHook,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({
 user:{id:'owner-a'} as {id:string}|null,
 learner:vi.fn(),sections:vi.fn(),streams:vi.fn(),inProgress:vi.fn(),create:vi.fn(),questions:vi.fn(),save:vi.fn(),
}));
vi.mock('@/shared/model/authStore',()=>({useUser:()=>mocks.user}));
vi.mock('../../api/learnerContext',()=>({getOwnAssessmentLearner:mocks.learner}));
vi.mock('../../api/assessmentService',()=>({fetchSections:mocks.sections,fetchStreams:mocks.streams,
 getInProgressAttempt:mocks.inProgress,createAttempt:mocks.create,fetchAllQuestions:mocks.questions,saveResponse:mocks.save}));
import {useAssessment} from '../useAssessment';
function deferred<T>(){let resolve!:(value:T)=>void;let reject!:(error:Error)=>void;
 const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
const profile=(owner:string)=>({id:'record-'+owner,user_id:owner});
const attempt={id:'attempt-a',stream_id:'stream',grade_level:'after12',all_responses:{q:'answer'},responses:[]};
async function switchOwner(hook:{rerender:()=>void},id:string|null){await act(async()=>{mocks.user=id?{id}:null;hook.rerender();});}
beforeEach(()=>{
 vi.resetAllMocks();mocks.user={id:'owner-a'};
 mocks.learner.mockImplementation(async(id:string)=>profile(id));
 mocks.sections.mockResolvedValue([{id:'section',name:'Section'}]);mocks.streams.mockResolvedValue([{id:'stream'}]);
 mocks.inProgress.mockResolvedValue(null);mocks.create.mockResolvedValue(attempt);
 mocks.questions.mockResolvedValue({Section:[{id:'q'}]});mocks.save.mockResolvedValue(undefined);
});
afterEach(cleanup);
describe('assessment owner lifecycle',()=>{
 it('loads questions using the stored catalog grade and stream returned by creation',async()=>{
  mocks.create.mockResolvedValue({...attempt,stream_id:'catalog-stream',grade_level:'college'});
  const hook=renderHook(()=>useAssessment());await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-a'));
  await act(async()=>{await hook.result.current.startAssessment('requested-stream','after12');});
  expect(mocks.questions).toHaveBeenCalledWith('catalog-stream','college');
 });
 it('loads the new owner after a mounted account switch',async()=>{
  const hook=renderHook(()=>useAssessment());await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-a'));
  await switchOwner(hook,'owner-b');await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-b'));
  expect(mocks.learner).toHaveBeenCalledWith('owner-b');
 });
 it('ignores an earlier owner initialization that resolves after the new owner',async()=>{
  const old=deferred<any>();mocks.learner.mockImplementation((id:string)=>id==='owner-a'?old.promise:Promise.resolve(profile(id)));
  const hook=renderHook(()=>useAssessment());await waitFor(()=>expect(mocks.learner).toHaveBeenCalledWith('owner-a'));
  await switchOwner(hook,'owner-b');await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-b'));
  await act(async()=>{old.resolve(profile('owner-a'));await old.promise;});
  expect(hook.result.current.learnerRecordId).toBe('record-owner-b');expect(hook.result.current.error).toBeNull();
 });
 it('clears the learner, attempt, questions and responses on sign-out',async()=>{
  const hook=renderHook(()=>useAssessment());await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-a'));
  await act(async()=>{await hook.result.current.startAssessment('stream','after12');});
  await act(async()=>{await hook.result.current.saveResponse('Section','q','answer');});
  expect(hook.result.current.currentAttempt?.id).toBe('attempt-a');expect(hook.result.current.responses).toEqual({Section_q:'answer'});
  const retainedStart=hook.result.current.startAssessment;
  await switchOwner(hook,null);
  expect(hook.result.current).toMatchObject({learnerRecordId:null,currentAttempt:null,questions:{},responses:{},sections:[],streams:[],loading:false,error:null});
  await expect(retainedStart('stream','after12')).rejects.toThrow('Assessment owner changed');expect(mocks.create).toHaveBeenCalledTimes(1);
 });
 it('rejects an in-flight old-owner action before follow-up reads or state writes',async()=>{
  const pending=deferred<any>();mocks.create.mockReturnValue(pending.promise);
  const hook=renderHook(()=>useAssessment());await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-a'));
  let observed!:Promise<unknown>;
  act(()=>{observed=hook.result.current.startAssessment('stream','after12').catch(error=>error);});
  await switchOwner(hook,'owner-b');await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-b'));
  await act(async()=>{pending.resolve(attempt);expect(await observed).toMatchObject({message:'Assessment owner changed'});});
  expect(hook.result.current.currentAttempt).toBeNull();expect(hook.result.current.questions).toEqual({});
  expect(mocks.questions).not.toHaveBeenCalled();expect(hook.result.current.error).toBeNull();
 });
 it('ignores stale errors and finally handlers while the new owner is still loading',async()=>{
  const old=deferred<any>();const current=deferred<any>();
  mocks.learner.mockImplementation((id:string)=>id==='owner-a'?old.promise:current.promise);
  const hook=renderHook(()=>useAssessment());await switchOwner(hook,'owner-b');
  await act(async()=>{old.reject(new Error('Old owner failure'));await Promise.resolve();});
  expect(hook.result.current.loading).toBe(true);expect(hook.result.current.error).toBeNull();
  await act(async()=>{current.resolve(profile('owner-b'));});
  await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-b'));
 });
 it('uses a new generation when returning to the same account',async()=>{
  const first=deferred<any>();let count=0;
  mocks.learner.mockImplementation((id:string)=>id==='owner-a'&&++count===1?first.promise:Promise.resolve({...profile(id),id:'fresh-'+id}));
  const hook=renderHook(()=>useAssessment());await waitFor(()=>expect(mocks.learner).toHaveBeenCalledWith('owner-a'));
  await switchOwner(hook,'owner-b');await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('fresh-owner-b'));
  await switchOwner(hook,'owner-a');await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('fresh-owner-a'));
  await act(async()=>{first.resolve({...profile('owner-a'),id:'stale-owner-a'});});
  expect(hook.result.current.learnerRecordId).toBe('fresh-owner-a');
 });
 it('does not return a previous owner attempt after delayed response restoration',async()=>{
  const restoration=deferred<any>();mocks.sections.mockResolvedValueOnce([]).mockReturnValueOnce(restoration.promise).mockResolvedValue([]);
  mocks.inProgress.mockResolvedValue(attempt);
  const hook=renderHook(()=>useAssessment());await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-a'));
  let observed!:Promise<unknown>;
  act(()=>{observed=hook.result.current.checkInProgressAttempt();});await waitFor(()=>expect(mocks.sections).toHaveBeenCalledTimes(2));
  await switchOwner(hook,'owner-b');await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-b'));
  await act(async()=>{restoration.resolve([]);expect(await observed).toBeNull();});
  expect(hook.result.current.currentAttempt).toBeNull();expect(hook.result.current.responses).toEqual({});
 });
 it('rejects an action completion after unmount before follow-up reads',async()=>{
  const pending=deferred<any>();mocks.create.mockReturnValue(pending.promise);
  const hook=renderHook(()=>useAssessment());await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-a'));
  let observed!:Promise<unknown>;
  act(()=>{observed=hook.result.current.startAssessment('stream','after12').catch(error=>error);});
  hook.unmount();
  await act(async()=>{pending.resolve(attempt);expect(await observed).toMatchObject({message:'Assessment owner changed'});});
  expect(mocks.questions).not.toHaveBeenCalled();
 });
 it('ignores a cancelled StrictMode initialization even when its owner is unchanged',async()=>{
  const old=deferred<any>();mocks.learner.mockReturnValueOnce(old.promise).mockResolvedValue(profile('owner-a'));
  const hook=renderHook(()=>useAssessment(),{wrapper:({children}:PropsWithChildren)=><StrictMode>{children}</StrictMode>});
  await waitFor(()=>expect(hook.result.current.learnerRecordId).toBe('record-owner-a'));
  await act(async()=>{old.resolve({...profile('owner-a'),id:'cancelled'});});
  expect(hook.result.current.learnerRecordId).toBe('record-owner-a');
 });
});
