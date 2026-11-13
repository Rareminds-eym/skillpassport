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
