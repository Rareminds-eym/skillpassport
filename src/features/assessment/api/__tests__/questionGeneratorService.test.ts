import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sanitizeLearnerQuestions } from '../../../../../functions/lib/assessment-question-safety';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: mocks.fetch } }));
vi.mock('@/shared/api/apiUtils', () => ({ getApiUrl: () => '/api/question-generation' }));
vi.mock('../assessmentRepository', () => ({ getSavedQuestionsForLearner: vi.fn().mockResolvedValue(null) }));
import { generateAptitudeQuestions, generateStreamKnowledgeQuestions } from '../questionGeneratorService';

beforeEach(() => vi.clearAllMocks());

describe('learner question generation contract', () => {
  it.each(['aptitude', 'knowledge'] as const)('accepts sanitized %s questions without retrying or inventing keys', async type => {
    const count = type === 'aptitude' ? 50 : 20;
    const questions = sanitizeLearnerQuestions(Array.from({ length: count }, (_, index) => ({
      id: `question-${index}`, question: `Choose the right value for problem ${index}`,
      options: { D: 'Four', B: 'Two', A: 'One', C: 'Three' },
      correct_answer: 'B', explanation: 'Private answer explanation', category: 'numerical',
    })));
    mocks.fetch.mockResolvedValue(Response.json({ success: true, data: { questions } }));
    const generate = type === 'aptitude' ? generateAptitudeQuestions : generateStreamKnowledgeQuestions;
    const result = await generate('bca', count, 'learner', 'attempt', 'college');
    expect(result).toHaveLength(count);
    expect(result?.[0].options).toEqual(['One', 'Two', 'Three', 'Four']);
    expect(result?.[0]).not.toHaveProperty('correct');
    expect(result?.[0]).not.toHaveProperty('correct_answer');
    expect(result?.[0]).not.toHaveProperty('explanation');
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
});
