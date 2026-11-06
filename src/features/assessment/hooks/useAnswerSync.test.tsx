import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({
  store: {answers: {} as Record<string, string>, sections: [], currentSectionIndex: 0, currentQuestionIndex: 0, generation:0, sectionTimings:{} as Record<string,number>},
  update: vi.fn(),
}));
vi.mock('../model/assessmentStore', () => ({useAssessmentStore: () => mocks.store}));
vi.mock('../api/assessmentApiService', () => ({updateProgress: mocks.update}));
vi.mock('@/shared/config/logging', () => ({getLogger: () => ({warn: vi.fn(), error: vi.fn()})}));
vi.mock('react-hot-toast', () => ({default: {success: vi.fn(), error: vi.fn()}}));
import {useAnswerSync} from './useAnswerSync';
function deferred() {
  let resolve!: (value: {success: boolean}) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<{success: boolean}>((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
}
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); mocks.store.answers = {};
  mocks.store.currentQuestionIndex = 0; mocks.store.generation=0;mocks.store.sections=[];mocks.store.sectionTimings={}; mocks.update.mockResolvedValue({success: true});
});
afterEach(() => {cleanup(); vi.clearAllTimers(); vi.useRealTimers();});
describe('answer sync acknowledgements', () => {
  it('does not resubmit hydrated answers and adds saved section timing to new elapsed time',async()=>{
    mocks.store.answers={q1:'A'};mocks.store.sections=[{name:'interest'}] as any;mocks.store.sectionTimings={interest:20};
    const hook=renderHook(()=>useAnswerSync('attempt',false));
    await act(async()=>{await vi.advanceTimersByTimeAsync(2000);});
    expect(mocks.update).not.toHaveBeenCalled();
    expect(hook.result.current.getElapsedSecondsForSection(0)).toBe(22);
    act(()=>{mocks.store.answers={q1:'A',q2:'B'};hook.rerender();});
    await act(async()=>{await vi.advanceTimersByTimeAsync(2000);});
    expect(mocks.update.mock.calls[0][0]).toMatchObject({answers:{q2:'B'},sectionTimings:{interest:24}});
  });
  it('invalidates an in-flight save when the same attempt is rehydrated',async()=>{
    const first=deferred();mocks.update.mockReturnValueOnce(first.promise);
    const hook=renderHook(()=>useAnswerSync('attempt'));
    act(()=>{mocks.store={...mocks.store,answers:{q1:'A'}};hook.rerender();});
    await act(async()=>{await vi.advanceTimersByTimeAsync(2000);});
    act(()=>{mocks.store={...mocks.store,generation:1,answers:{q2:'B'}};hook.rerender();});
    await act(async()=>{first.resolve({success:true});await first.promise;});
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(hook.result.current.canProceedToNextQuestion).toBe(false);
    expect(hook.result.current.hasPendingAnswers).toBe(false);
  });

  it('cancels a pending debounce when the assessment hook unmounts', async () => {
    const hook = renderHook(() => useAnswerSync('attempt'));
    act(() => {mocks.store.answers = {q1: 'A'}; hook.rerender();});
    hook.unmount();
    await act(async () => {await vi.advanceTimersByTimeAsync(10000);});
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('drains answers added during an in-flight save without acknowledging them early', async () => {
    const first = deferred(); const second = deferred();
    mocks.update.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const hook = renderHook(() => useAnswerSync('attempt'));
    act(() => {mocks.store.answers = {q1: 'A'}; hook.rerender();});
    await act(async () => {await vi.advanceTimersByTimeAsync(2000);});
    expect(mocks.update.mock.calls[0][0].answers).toEqual({q1: 'A'});
    act(() => {mocks.store.currentQuestionIndex = 1; mocks.store.answers = {q1: 'A', q2: 'B'}; hook.rerender();});
    await act(async () => {first.resolve({success: true}); await first.promise;});
    expect(mocks.update).toHaveBeenCalledTimes(2);
    expect(mocks.update.mock.calls[1][0]).toMatchObject({questionIndex: 1, answers: {q2: 'B'}});
    expect(hook.result.current.canProceedToNextQuestion).toBe(false);
    await act(async () => {second.resolve({success: true}); await second.promise;});
    expect(hook.result.current.hasPendingAnswers).toBe(false);
    expect(hook.result.current.canProceedToNextQuestion).toBe(true);
    await act(async () => {await vi.advanceTimersByTimeAsync(10000);});
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });
  it.each(['B', 'A'])('keeps a newer version of the same question, including a change back to %s', async final => {
    const first = deferred(); mocks.update.mockReturnValueOnce(first.promise);
    const hook = renderHook(() => useAnswerSync('attempt'));
    act(() => {mocks.store.answers = {q1: 'A'}; hook.rerender();});
    await act(async () => {await vi.advanceTimersByTimeAsync(2000);});
    act(() => {mocks.store.answers = {q1: 'B'}; hook.rerender();});
    if (final === 'A') act(() => {mocks.store.answers = {q1: 'A'}; hook.rerender();});
    await act(async () => {first.resolve({success: true}); await first.promise;});
    expect(mocks.update).toHaveBeenCalledTimes(2);
    expect(mocks.update.mock.calls[1][0].answers).toEqual({q1: final});
    expect(hook.result.current.hasPendingAnswers).toBe(false);
  });
  it('retries with the current pending versions after an earlier batch fails', async () => {
    const first = deferred(); mocks.update.mockReturnValueOnce(first.promise);
    const hook = renderHook(() => useAnswerSync('attempt'));
    act(() => {mocks.store.answers = {q1: 'A'}; hook.rerender();});
    await act(async () => {await vi.advanceTimersByTimeAsync(2000);});
    act(() => {mocks.store.answers = {q1: 'B', q2: 'C'}; hook.rerender();});
    await act(async () => {first.reject(new Error('offline')); await Promise.resolve();});
    await act(async () => {await vi.advanceTimersByTimeAsync(1000);});
    expect(mocks.update.mock.calls[1][0].answers).toEqual({q1: 'B', q2: 'C'});
    expect(hook.result.current.hasPendingAnswers).toBe(false);
  });
  it('does not send a new attempt queue through an old in-flight callback', async () => {
    const old = deferred(); const current = deferred();
    mocks.update.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    const hook = renderHook(({id}) => useAnswerSync(id), {initialProps: {id: 'old'}});
    act(() => {mocks.store.answers = {q1: 'A'}; hook.rerender({id: 'old'});});
    await act(async () => {await vi.advanceTimersByTimeAsync(2000);});
    act(() => {mocks.store.answers = {}; hook.rerender({id: 'new'});});
    act(() => {mocks.store.answers = {q2: 'B'}; hook.rerender({id: 'new'});});
    await act(async () => {await vi.advanceTimersByTimeAsync(2000);});
    await act(async () => {old.resolve({success: true}); await old.promise;});
    expect(mocks.update).toHaveBeenCalledTimes(2);
    expect(mocks.update.mock.calls[1][0]).toMatchObject({attemptId: 'new', answers: {q2: 'B'}});
    expect(hook.result.current.canProceedToNextQuestion).toBe(false);
    await act(async () => {current.resolve({success: true}); await current.promise;});
    expect(hook.result.current.hasPendingAnswers).toBe(false);
  });
});
