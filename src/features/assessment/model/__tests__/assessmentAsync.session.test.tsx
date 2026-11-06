import {act,cleanup,renderHook} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({initialize:vi.fn(),next:vi.fn(),complete:vi.fn(),answer:vi.fn(),link:vi.fn(),questions:vi.fn()}));
vi.mock('../../api/adaptiveAptitudeApiService',()=>({default:{initializeTest:mocks.initialize,getNextQuestion:mocks.next,completeTest:mocks.complete,submitAnswer:mocks.answer},linkSessionToAttempt:mocks.link}));
vi.mock('../../api/careerAssessmentAIService',()=>({loadCareerAssessmentQuestions:mocks.questions}));
import {useAdaptiveAptitude} from '../../lib/useAdaptiveAptitude';
import {useAIQuestions} from '../useAIQuestions';
import {useAssessmentStore as store} from '../assessmentStore';
function deferred(){let resolve:any;const promise=new Promise<any>(yes=>resolve=yes);return {promise,resolve};}
const sections=[{id:'interest',name:'interest',questions:[]}];
beforeEach(()=>{vi.clearAllMocks();store.getState().reset();store.getState().initializeAssessment(sections as any,'first','after12','science');});
afterEach(()=>{cleanup();vi.useRealTimers();});
describe('async attempt boundaries',()=>{
 it.each(['startTest','loadNextQuestion','completeTest','submitAnswer'] as const)('ignores late %s results after replacing the attempt',async method=>{
  store.setState({adaptiveSessionId:'adaptive',adaptiveCurrentQuestion:{id:'q1'} as any});
  const pending=deferred();mocks.initialize.mockReturnValue(pending.promise);mocks.next.mockReturnValue(pending.promise);mocks.complete.mockReturnValue(pending.promise);mocks.answer.mockReturnValue(pending.promise);
  const hook=renderHook(()=>useAdaptiveAptitude({learnerId:'learner',gradeLevel:'after12'}));
  let request:any;act(()=>{request=method==='submitAnswer'?hook.result.current.submitAnswer('A'):hook.result.current[method]();});
  act(()=>store.getState().initializeAssessment(sections as any,'replacement','after12','science'));
  await act(async()=>{pending.resolve({session:{id:'late'},firstQuestion:{id:'late'},question:{id:'late'},testComplete:true,isTestComplete:true});await request;});
  expect(store.getState()).toMatchObject({attemptId:'replacement',adaptiveSessionId:null,adaptiveCurrentQuestion:null,adaptiveTestComplete:false,loading:false,error:null});
  expect(mocks.link).not.toHaveBeenCalled();
 });
 it('does not publish an adaptive response after unmount',async()=>{
  const pending=deferred();mocks.initialize.mockReturnValue(pending.promise);
  const hook=renderHook(()=>useAdaptiveAptitude({learnerId:'learner',gradeLevel:'after12'}));
  let request:any;act(()=>{request=hook.result.current.startTest();});hook.unmount();
  await act(async()=>{pending.resolve({session:{id:'late'},firstQuestion:{id:'late'}});await request;});
  expect(store.getState().adaptiveSessionId).toBeNull();
 });
 it('loads the replacement AI context while ignoring an earlier response and cleans timers',async()=>{
  vi.useFakeTimers();const first=deferred(),second=deferred();mocks.questions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const hook=renderHook(({attemptId})=>useAIQuestions({gradeLevel:'after12',learnerStream:'science',learnerId:'learner',attemptId,learnerProgram:null}),{initialProps:{attemptId:'first'}});
  hook.rerender({attemptId:'second'});expect(mocks.questions).toHaveBeenCalledTimes(2);
  await act(async()=>{second.resolve({knowledge:[{id:'new',question:'New'}]});await second.promise;await vi.advanceTimersByTimeAsync(500);});
  expect(hook.result.current.aiQuestions.knowledge?.[0].id).toBe('new');
  await act(async()=>{first.resolve({knowledge:[{id:'old'}]});await first.promise;});
  expect(hook.result.current.aiQuestions.knowledge?.[0].id).toBe('new');
  hook.unmount();expect(vi.getTimerCount()).toBe(0);
 });
 it('cleans progress intervals after an AI failure',async()=>{
  vi.useFakeTimers();mocks.questions.mockRejectedValue(new Error('network'));
  const hook=renderHook(()=>useAIQuestions({gradeLevel:'after12',learnerStream:'science',learnerId:'learner',attemptId:'first',learnerProgram:null}));
  await act(async()=>{await Promise.resolve();});
  expect(hook.result.current.error).toContain('Network');expect(vi.getTimerCount()).toBe(0);
 });
});
