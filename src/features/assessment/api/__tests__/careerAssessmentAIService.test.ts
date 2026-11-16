import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ aptitude: vi.fn(), knowledge: vi.fn() }));
vi.mock('../assessmentRepository', () => ({ getSavedQuestionsForLearner: vi.fn().mockResolvedValue(null), clearSavedQuestionsForLearner: vi.fn() }));
vi.mock('../questionGeneratorService.js', () => ({ generateAptitudeQuestions: mocks.aptitude, generateStreamKnowledgeQuestions: mocks.knowledge, generateWithValidation: vi.fn() }));
import { loadCareerAssessmentQuestions } from '../careerAssessmentAIService';

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => vi.useRealTimers());

describe('empty generation results', () => {
  it('reports exhausted aptitude generation as an error', async () => {
    mocks.aptitude.mockResolvedValue(null);
    await expect(loadCareerAssessmentQuestions('bca', 'college')).rejects.toThrow('Failed to load aptitude questions');
    expect(mocks.knowledge).not.toHaveBeenCalled();
  });
  it('reports exhausted knowledge generation as an error', async () => {
    mocks.aptitude.mockResolvedValue([{ id: 'aptitude' }]);
    mocks.knowledge.mockResolvedValue(null);
    const assertion = expect(loadCareerAssessmentQuestions('bca', 'college')).rejects.toThrow('Failed to load knowledge questions');
    await vi.runAllTimersAsync();
    await assertion;
  });
});

it('binds both sections to the selected attempt stream even when the profile course differs', async () => {
  mocks.aptitude.mockResolvedValue([{ id: 'aptitude' }]);
  mocks.knowledge.mockResolvedValue([{ id: 'knowledge' }]);
  const result = loadCareerAssessmentQuestions('bca', 'college', 'learner', 'attempt', 'B.Com');
  await vi.runAllTimersAsync();
  await result;
  expect(mocks.aptitude).toHaveBeenCalledWith('bca', 50, 'learner', 'attempt', 'college');
  expect(mocks.knowledge).toHaveBeenCalledWith('bca', 20, 'learner', 'attempt', 'college');
});

it('finishes after10 after aptitude without requesting a knowledge section', async () => {
  mocks.aptitude.mockResolvedValue([{ id: 'aptitude' }]);
  await expect(loadCareerAssessmentQuestions('general', 'after10', 'learner', 'attempt')).resolves.toMatchObject({ aptitude: [{ id: 'aptitude' }], knowledge: null });
  expect(mocks.knowledge).not.toHaveBeenCalled();
});

it('preserves the catalog after10 stream identity for generation', async () => {
  mocks.aptitude.mockResolvedValue([{id:'aptitude'}]);
  await expect(loadCareerAssessmentQuestions('science_pcm_after10','after10','learner','attempt')).resolves.toMatchObject({knowledge:null});
  expect(mocks.aptitude).toHaveBeenCalledWith('science_pcm_after10',50,'learner','attempt','after10');
  expect(mocks.knowledge).not.toHaveBeenCalled();
});
