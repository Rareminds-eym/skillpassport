import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({update: vi.fn()}));
vi.mock('../api/assessmentApiService', () => ({updateProgress: mocks.update}));
vi.mock('@/shared/config/logging', () => ({getLogger: () => ({warn: vi.fn(), error: vi.fn()})}));
vi.mock('react-hot-toast', () => ({default: {success: vi.fn(), error: vi.fn()}}));
import {useAssessmentStore as store, type AssessmentSection} from '../model/assessmentStore';
import {useAnswerSync} from './useAnswerSync';
const sections: AssessmentSection[] = [
  {id:'interest',name:'interest',questions:[{id:'interest-q'}]},
  {id:'adaptive',name:'adaptive_aptitude',questions:[]},
  {id:'knowledge',name:'knowledge',questions:[{id:'knowledge-q'}]},
];
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); store.getState().reset();
  mocks.update.mockResolvedValue({success:true});
});
afterEach(() => {cleanup(); vi.clearAllTimers(); vi.useRealTimers();});
it.each(['middle','highschool','higher_secondary','after10','after12','college'])(
  'persists later responses after adaptive completion for %s', async grade => {
    act(() => store.getState().initializeAssessment(sections,'owned-attempt',grade,'science_pcm'));
    renderHook(() => {
      const state = store();
      return useAnswerSync(state.status === 'inProgress' ? state.attemptId : null, false);
    });
    act(() => {
      store.getState().setAdaptiveTestComplete(true);
      store.getState().setCurrentQuestion(2,0);
      store.getState().saveAnswer('knowledge-q','B');
    });
    await act(async () => {await vi.advanceTimersByTimeAsync(2000);});
    expect(store.getState()).toMatchObject({status:'inProgress',adaptiveTestComplete:true});
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      attemptId:'owned-attempt',sectionIndex:2,questionIndex:0,answers:{'knowledge-q':'B'},
    }));
  },
);
it('disconnects pending synchronization after explicit final submission', async () => {
  act(() => store.getState().initializeAssessment(sections,'owned-attempt','after12','science_pcm'));
  renderHook(() => {
    const state = store();
    return useAnswerSync(state.status === 'inProgress' ? state.attemptId : null, false);
  });
  act(() => store.getState().saveAnswer('knowledge-q','B'));
  act(() => store.getState().setStatus('submitting'));
  await act(async () => {await vi.advanceTimersByTimeAsync(6000);});
  expect(mocks.update).not.toHaveBeenCalled();
  expect(store.getState().status).toBe('submitting');
});
