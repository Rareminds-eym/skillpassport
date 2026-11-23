// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), owns: true, messages: [] as unknown[], lookups: [] as {table: string; filters: [string, unknown][]; operation: string; payload?: unknown}[], failJobs: false }));
vi.mock('../lib/supabase', () => ({ createSupabaseAdminClient: () => ({ from: io.from, rpc: io.rpc }) }));
vi.mock('../api/career/utils/rate-limit', () => ({ checkRateLimit: () => true }));
vi.mock('../api/shared/ai-config', () => ({ getAPIKeys: () => ({ openRouter: 'synthetic-key' }), API_CONFIG: { OPENROUTER: { endpoint: 'https://synthetic.invalid/ai', headers: {} } }, MODEL_PROFILES: { chat: { primary: 'synthetic-model', fallbacks: [] } } }));
vi.mock('../api/career/ai/guardrails', () => ({ validateResponse: () => ({ flags: [] }) }));
vi.mock('../api/career/ai/intent-detection', () => ({ detectIntent: () => ({ intent: 'interview-prep', confidence: 'high' }) }));
vi.mock('../api/career/ai/memory', () => ({ compressContext: vi.fn(), buildMemoryContext: vi.fn() }));
vi.mock('../api/career/ai/conversation-phase', () => ({ getConversationPhase: () => 'opening', getPhaseParameters: () => ({ max_tokens: 100, temperature: 0 }) }));
vi.mock('../api/career/ai/prompts/enhanced-system-prompt', () => ({ buildEnhancedSystemPrompt: () => 'synthetic system prompt' }));
vi.mock('../api/career/context/learner', () => ({ buildlearnerContext: async () => ({ name: 'Synthetic', technicalSkills: [] }) }));
vi.mock('../api/career/context/assessment', () => ({ buildAssessmentContext: async () => ({ hasAssessment: false }) }));
vi.mock('../api/career/context/progress', () => ({ buildCareerProgressContext: async () => ({}) }));
vi.mock('../api/career/context/courses', () => ({ buildCourseContext: async () => ({}) }));
vi.mock('../lib/job-recommendations', () => ({ eligibleJobs: (query: unknown) => query, stringSkills: (skills: unknown) => Array.isArray(skills) ? skills : [] }));
import { handleCareerChat } from '../api/career/handlers/chat';
import { handleUpsertFeedback } from '../api/career/handlers/feedback';
import { fetchSmartOpportunities } from '../api/career/context/smart-opportunities';
const conversationId = '11111111-1111-4111-8111-111111111111';
const payload = { conversationId, messageId: 'turn', thumbsUp: true, userMessage: 'forged', aiResponse: 'forged' };
const request = (body: unknown, method = 'POST') => new Request('https://synthetic.invalid/api/career/feedback', { method, body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
beforeEach(() => {
  vi.clearAllMocks(); io.lookups = []; io.owns = true; io.failJobs = false;
  io.messages = [{ id: 'turn', role: 'user', content: 'saved question' }, { id: 'turn', role: 'assistant', content: 'saved answer' }];
  io.rpc.mockResolvedValue({ data: 0, error: { message: 'unavailable' } });
  io.from.mockImplementation((table: string) => {
    const record = { table, filters: [] as [string, unknown][], operation: 'select', payload: undefined as unknown };
    io.lookups.push(record);
    const result = () => table === 'career_ai_conversations'
      ? { data: io.owns && record.filters.some(([key, value]) => key === 'learner_id' && value === 'synthetic-owner') ? { messages: io.messages, updated_at: '2026-01-01' } : null, error: null }
      : table === 'opportunities' ? { data: null, error: io.failJobs ? { message: 'database unavailable' } : null }
      : record.operation === 'select' ? { data: { id: 'evaluation' }, error: null } : { data: null, error: null };
    const chain: Record<string, unknown> = {};
    for (const method of ['select', 'order', 'limit', 'or', 'ilike', 'range']) chain[method] = () => chain;
    chain.eq = (key: string, value: unknown) => { record.filters.push([key, value]); return chain; };
    for (const operation of ['insert', 'update']) chain[operation] = (value: unknown) => { record.operation = operation; record.payload = value; return chain; };
    chain.single = chain.maybeSingle = async () => result();
    chain.then = (resolve: (value: unknown) => void) => Promise.resolve(result()).then(resolve);
    return chain;
  });
});
afterEach(() => vi.unstubAllGlobals());
describe('Career ownership and failures', () => {
  it('rejects a foreign conversation before quota, context or AI access', async () => {
    io.owns = false;
    const response = await handleCareerChat(request({ conversationId, message: 'question' }), {}, 'synthetic-owner');
    expect(response.status).toBe(403); expect(io.rpc).not.toHaveBeenCalled();
    expect(io.lookups[0].filters).toContainEqual(['learner_id', 'synthetic-owner']);
  });
  it('surfaces quota read failures instead of sending an unchecked provider request', async () => {
    const response = await handleCareerChat(request({ message: 'question' }), {}, 'synthetic-owner');
    expect(response.status).toBe(503); expect(await response.text()).toContain('QUOTA_UNAVAILABLE');
  });
  it('rejects feedback for a foreign conversation without touching evaluations', async () => {
    io.owns = false;
    const response = await handleUpsertFeedback({}, 'synthetic-owner', request(payload));
    expect(response.status).toBe(404); expect(io.lookups.map(item => item.table)).toEqual(['career_ai_conversations']);
  });
  it('rejects feedback for a missing assistant message', async () => {
    io.messages = [io.messages[0]];
    expect((await handleUpsertFeedback({}, 'synthetic-owner', request(payload))).status).toBe(400);
  });
  it('scopes evaluation lookup and update to the owner', async () => {
    const response = await handleUpsertFeedback({}, 'synthetic-owner', request({ ...payload, userRating: 3, userFeedback: 'more detail' }));
    expect(response.status).toBe(200);
    for (const evaluation of io.lookups.filter(item => item.table === 'ai_evaluations')) expect(evaluation.filters).toContainEqual(['learner_id', 'synthetic-owner']);
    expect(io.lookups.find(item => item.operation === 'update')?.payload).toMatchObject({ thumbs_up: true, user_rating: 3, user_feedback: 'more detail' });
  });
  it('validates feedback method, booleans and rating before database access', async () => {
    expect((await handleUpsertFeedback({}, 'synthetic-owner', request(payload, 'DELETE'))).status).toBe(405);
    expect((await handleUpsertFeedback({}, 'synthetic-owner', request({ ...payload, thumbsUp: 'positive' }))).status).toBe(400);
    expect((await handleUpsertFeedback({}, 'synthetic-owner', request({ ...payload, userRating: 6 }))).status).toBe(400);
    expect(io.from).not.toHaveBeenCalled();
  });
  it('does not disguise job database failure as an empty match result', async () => {
    io.failJobs = true;
    await expect(fetchSmartOpportunities({ from: io.from } as never, { userMessage: 'find jobs', conversationHistory: [], learnerProfile: { technicalSkills: [] } as never, intent: 'find-jobs', openRouterKey: 'synthetic' })).rejects.toThrow('Unable to load career opportunities');
  });
});

describe('Provider completion and persisted feedback', () => {
  const allowCountAndSave = () => io.rpc.mockImplementation(async (name: string) => name === 'count_career_ai_user_messages'
    ? { data: 0, error: null } : { data: { success: true, conversation_id: conversationId }, error: null });
  it('does not save provider output that ends without a completion event', async () => {
    allowCountAndSave();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n')));
    const response = await handleCareerChat(request({ message: 'question' }), {}, 'synthetic-owner');
    const output = await response.text();
    expect(output).toContain('Stream processing error');
    expect(io.rpc.mock.calls.map(([name]) => name)).toEqual(['count_career_ai_user_messages']);
  });
  it('saves a complete provider stream once and acknowledges the saved turn', async () => {
    allowCountAndSave();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('data: {"choices":[{"delta":{"content":"complete"}}]}\n\ndata: [DONE]')));
    const response = await handleCareerChat(request({ message: 'question' }), {}, 'synthetic-owner');
    const output = await response.text();
    expect(output).toContain('"conversationId":"' + conversationId + '"');
    expect(io.rpc.mock.calls.filter(([name]) => name === 'save_career_ai_message')).toHaveLength(1);
    expect(io.rpc.mock.calls[1][1]).toMatchObject({ p_learner_id: 'synthetic-owner', p_messages: [expect.objectContaining({ role: 'user', content: 'question' }), expect.objectContaining({ role: 'assistant', content: 'complete' })] });
  });
  it('derives new evaluation content from owned saved messages, never the client payload', async () => {
    const from = io.from.getMockImplementation()!;
    io.from.mockImplementation((table: string) => {
      const chain = from(table);
      if (table === 'ai_evaluations') chain.maybeSingle = async () => ({ data: null, error: null });
      return chain;
    });
    const response = await handleUpsertFeedback({}, 'synthetic-owner', request({ ...payload, userRating: null, userFeedback: null }));
    expect(response.status).toBe(200);
    expect(io.lookups.find(item => item.operation === 'insert')?.payload).toMatchObject({ learner_id: 'synthetic-owner', user_message: 'saved question', ai_response: 'saved answer' });
  });
  it('considers older eligible jobs beyond the first database page', async () => {
    const pages: number[] = [];
    const jobs = Array.from({ length: 100 }, (_, index) => ({ id: String(index), title: 'unrelated job', skills_required: [] }));
    const database = { from: () => {
      const chain: Record<string, unknown> = {};
      for (const name of ['select', 'eq', 'order', 'or']) chain[name] = () => chain;
      chain.range = async (offset: number) => { pages.push(offset); return { data: offset === 0 ? jobs : [{ id: 'older-match', title: 'Rust engineer', skills_required: ['Rust'] }], error: null }; };
      return chain;
    } };
    const results = await fetchSmartOpportunities(database as never, { userMessage: 'find jobs', conversationHistory: [], learnerProfile: { technicalSkills: [{ name: 'Rust' }] } as never, intent: 'find-jobs', openRouterKey: 'synthetic' });
    expect(pages).toEqual([0, 100]); expect(results.map(job => job.id)).toContain('older-match');
  });
});

describe('Recheck provider transport termination', () => {
  it('acknowledges DONE without waiting for the provider transport to close', async () => {
    io.rpc.mockImplementation(async (name: string) => name === 'count_career_ai_user_messages'
      ? { data: 0, error: null } : { data: { success: true, conversation_id: conversationId }, error: null });
    let provider!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({ start(controller) {
      provider = controller;
      controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"complete"}}]}\n\ndata: [DONE]\n\n'));
    } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream)));
    const response = await handleCareerChat(request({ message: 'question' }), {}, 'synthetic-owner');
    const output = response.text();
    try {
      await vi.waitFor(() => expect(io.rpc.mock.calls.filter(([name]) => name === 'save_career_ai_message')).toHaveLength(1), { timeout: 150 });
    } finally {
      try { provider.close(); } catch { /* The fixed handler may already have cancelled this synthetic stream. */ }
      await output;
    }
  });
  it('cancels an unfinished provider reader when the downstream response is cancelled', async () => {
    io.rpc.mockResolvedValue({ data: 0, error: null });
    const cancelled = vi.fn();
    const stream = new ReadableStream<Uint8Array>({ start(controller) {
      controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'));
    }, cancel: cancelled });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream)));
    const response = await handleCareerChat(request({ message: 'question' }), {}, 'synthetic-owner');
    const reader = response.body!.getReader();
    expect((await reader.read()).done).toBe(false);
    await reader.cancel('synthetic client cancellation');
    await vi.waitFor(() => expect(cancelled).toHaveBeenCalledTimes(1));
    expect(io.rpc.mock.calls.map(([name]) => name)).toEqual(['count_career_ai_user_messages']);
  });

});
