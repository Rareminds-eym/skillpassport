import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
const f = vi.hoisted(() => ({patch:vi.fn(),record:vi.fn(),learner:vi.fn(),analyze:vi.fn(),complete:vi.fn(),navigate:vi.fn()}));
vi.mock('react-router-dom', () => ({useNavigate:()=>f.navigate}));
vi.mock('../../api/geminiAssessmentService', () => ({analyzeAssessmentWithGemini:f.analyze}));
vi.mock('../../api/assessmentApiService', () => ({completeAttempt:f.complete}));
vi.mock('../../api/assessmentRecords', () => ({fetchOwnAssessmentRecord:f.record,patchOwnAssessment:f.patch}));
vi.mock('../../api/learnerContext', () => ({getOwnAssessmentLearner:f.learner}));
vi.mock('@/shared/api/apiClient', () => ({apiPost:vi.fn()}));
vi.mock('@/features/assessment', () => ({riasecQuestions:[],bigFiveQuestions:[],workValuesQuestions:[],employabilityQuestions:[],streamKnowledgeQuestions:{}}));
import {useAssessmentSubmission} from '../useAssessmentSubmission';
const options = {
  answers:{'knowledge-q':'B'},sections:[{id:'knowledge',title:'Knowledge',questions:[{id:'knowledge-q',correct:'B'}]}],
  learnerStream:'science_pcm',gradeLevel:'higher_secondary' as const,sectionTimings:{},
  currentAttempt:{id:'owned-attempt'},userId:'owner',timeRemaining:null,elapsedTime:1,
};
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks();
  vi.spyOn(console,'log').mockImplementation(()=>{});
  vi.spyOn(console,'info').mockImplementation(()=>{});
  vi.spyOn(console,'error').mockImplementation(()=>{});
  vi.spyOn(window,'alert').mockImplementation(()=>{});
  f.learner.mockResolvedValue({id:'learner'});
  f.record.mockResolvedValue({learner_context:{rawGrade:'Grade 11'},grade_level:'higher_secondary'});
  f.patch.mockResolvedValue({id:'owned-attempt'});
  f.analyze.mockResolvedValue({careerFit:{},riasec:{},roadmap:{}});
  f.complete.mockResolvedValue({id:'result'});
});
afterEach(() => {cleanup();vi.clearAllTimers();vi.useRealTimers();vi.restoreAllMocks();});
it('awaits the complete final answer snapshot before calling AI or finalizing', async () => {
  let resolve!: ()=>void;
  f.patch.mockReturnValueOnce(new Promise<{id:string}>(yes=>{resolve=()=>yes({id:'owned-attempt'});}));
  const hook=renderHook(()=>useAssessmentSubmission());let request!:Promise<void>;
  await act(async()=>{request=hook.result.current.submit(options);await Promise.resolve();});
  expect(f.patch).toHaveBeenCalledWith('owned-attempt',{allResponses:{'knowledge-q':'B'}});
  expect(f.analyze).not.toHaveBeenCalled();expect(f.complete).not.toHaveBeenCalled();
  await act(async()=>{resolve();await vi.runAllTimersAsync();await request;});
  expect(f.analyze).toHaveBeenCalledTimes(1);expect(f.complete).toHaveBeenCalledTimes(1);
  expect(f.patch.mock.invocationCallOrder[0]).toBeLessThan(f.analyze.mock.invocationCallOrder[0]);
  expect(f.navigate).toHaveBeenCalledWith('/learner/assessment/result?attemptId=owned-attempt');
});
it('surfaces a final snapshot failure without AI generation, finalization or navigation', async () => {
  f.patch.mockRejectedValueOnce(new Error('Final answer snapshot unavailable'));
  const hook=renderHook(()=>useAssessmentSubmission());
  await act(async()=>{await expect(hook.result.current.submit(options)).rejects.toThrow('Final answer snapshot unavailable');});
  expect(hook.result.current.error).toContain('Final answer snapshot unavailable');
  expect(hook.result.current.isSubmitting).toBe(false);
  expect(f.analyze).not.toHaveBeenCalled();expect(f.complete).not.toHaveBeenCalled();expect(f.navigate).not.toHaveBeenCalled();
});
