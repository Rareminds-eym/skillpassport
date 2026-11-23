import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sanitizeLearnerQuestions } from '../../../../../functions/lib/assessment-question-safety';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: mocks.fetch } }));
vi.mock('@/shared/api/apiUtils', () => ({ getApiUrl: () => '/api/question-generation' }));
vi.mock('../assessmentRepository', () => ({ getSavedQuestionsForLearner: vi.fn().mockResolvedValue(null) }));
import { generateAptitudeQuestions, generateStreamKnowledgeQuestions } from '../questionGeneratorService';
import {STREAMS_BY_CATEGORY} from '../../lib/config/config';
import {STREAM_KNOWLEDGE_PROMPTS} from '../../lib/streamPrompts';

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

it.each(Object.values(STREAMS_BY_CATEGORY).flat())('keeps the canonical after12 knowledge identity for $id',async stream=>{
  const questions=sanitizeLearnerQuestions(Array.from({length:20},(_,index)=>({
    id:`knowledge-${index}`,question:`QA knowledge question ${index}`,options:{A:'One',B:'Two',C:'Three',D:'Four'},correct_answer:'A',category:'knowledge',
  })));
  mocks.fetch.mockResolvedValue(Response.json({success:true,data:{questions}}));
  const result=await generateStreamKnowledgeQuestions(stream.id,20,'learner','attempt','after12');
  expect(result).toHaveLength(20);
  const body=JSON.parse(mocks.fetch.mock.calls[0][1].body);
  expect(body).toMatchObject({streamId:stream.id,gradeLevel:'after12',streamName:STREAM_KNOWLEDGE_PROMPTS[stream.id]?.name});
  expect(STREAM_KNOWLEDGE_PROMPTS[stream.id]?.topics.length).toBeGreaterThan(0);
});
