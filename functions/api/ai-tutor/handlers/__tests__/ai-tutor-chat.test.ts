// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  client: { from: vi.fn(), rpc: vi.fn() },
  retrieve: vi.fn(), increment: vi.fn(), guide:vi.fn(), roles: ['college_educator'],
}));
vi.mock('../../../../lib/auth', () => ({
  getContextUser: () => ({ id: 'educator-id', roles: mocks.roles }),
  getServiceClient: () => mocks.client,
}));
vi.mock('../../../shared/ai-config', () => ({
  getAPIKeys: () => ({ openRouter: 'test-key' }),
  AI_MODELS: { GPT_4O_MINI: 'test-model' },
  API_CONFIG: { OPENROUTER: { endpoint: 'https://example.test/chat' } },
}));
vi.mock('../../utils/course-context', () => ({
  buildCourseContext: vi.fn().mockResolvedValue({ courseTitle: 'Time Management' }),
  buildSystemPrompt: () => 'Generate a worksheet',
}));
vi.mock('../../utils/generation-limit', () => ({
  hasReachedLimit: vi.fn().mockResolvedValue(false),
  incrementGenerationCount: mocks.increment,
}));
vi.mock('../../utils/course-index', async importOriginal => ({
  ...await importOriginal<typeof import('../../utils/course-index')>(),
  retrieveCourseEvidence: mocks.retrieve,
}));
vi.mock('../../utils/saved-materials', async original => ({
  ...await original<typeof import('../../utils/saved-materials')>(),
  materialContextFingerprint: vi.fn().mockResolvedValue('context-hash'),
}));
vi.mock('../../utils/guide-evidence',async original=>({...await original<typeof import('../../utils/guide-evidence')>(),loadGuideEvidence:mocks.guide}));
import { handleAiTutorChat } from '../ai-tutor-chat';

describe('tutor conversation persistence', () => {
  let saveResult: { data: { id: string } | null; error: { message: string } | null };
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.roles = ['college_educator'];
    saveResult = { data: { id: 'saved-conversation' }, error: null };
    mocks.client.from.mockImplementation((table: string) => {
      const query: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'insert', 'order']) query[method] = vi.fn(() => query);
      query.limit = vi.fn().mockResolvedValue({ data: [], error: null });
      query.maybeSingle = vi.fn().mockResolvedValue({
        data: table === 'learners' ? null : { messages: [] }, error: null,
      });
      query.single = vi.fn(() => Promise.resolve(saveResult));
      return query;
    });
    mocks.client.rpc.mockResolvedValue({ error: null });
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(
      'data: {"choices":[{"delta":{"content":"Generated worksheet"}}]}\n\ndata: [DONE]\n\n',
      { status: 200 },
    )));
  });

  async function generate(conversationId?: string, difficultyLevels = ['medium'], questionCount = 10, chat = false) {
    const response = await handleAiTutorChat({
      request: new Request('https://example.test/api/ai-tutor/chat', {
        method: 'POST', body: JSON.stringify({
          courseId: 'course-id', conversationId, message: chat ? 'Is that assigned to all the learners?' : 'Generate a worksheet',
          ...(chat ? {} : { worksheetConfig: { templateType: 'multiple_choice', difficulty: 'medium', difficultyLevels, questionCount } }),
        }),
      }),
      env: { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test' },
    } as Parameters<typeof handleAiTutorChat>[0]);
    return response.text();
  }

  it('adds server-loaded submission evidence to the model prompt and persists only its reference',async()=>{
    mocks.guide.mockResolvedValue('\nVERIFIED RESPONSE: Learner wrote Plan tasks. Rubric: prioritize.');
    const id='00000000-0000-4000-8000-000000000001';
    const response=await handleAiTutorChat({request:new Request('https://example.test/chat',{method:'POST',body:JSON.stringify({courseId:'course-id',message:'Give feedback on this response',guideSubmissionId:id,facilitatorMode:'mentor-and-guide'})}),env:{SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test'}} as Parameters<typeof handleAiTutorChat>[0]);
    await response.text();
    expect(mocks.guide).toHaveBeenCalledWith(mocks.client,expect.anything(),'educator-id','course-id',id);
    const call=vi.mocked(fetch).mock.calls.find(([,init])=>String(init?.body).includes('VERIFIED RESPONSE'));
    expect(call).toBeDefined();
    const request=JSON.parse(String(call![1]!.body));expect(request.messages[0].content).toContain('Learner wrote Plan tasks');
    const query=mocks.client.from.mock.results.find(result=>result.value.insert.mock.calls.length)?.value;
    const saved=query.insert.mock.calls[0][0].messages;
    expect(saved[0]).toMatchObject({guideSubmissionId:id,role:'user'});
    expect(saved[0].content).not.toContain('VERIFIED RESPONSE');
  });
  it('rejects learner attempts to fetch another learner evidence through chat',async()=>{
    mocks.roles=['learner'];
    const response=await handleAiTutorChat({request:new Request('https://example.test/chat',{method:'POST',body:JSON.stringify({courseId:'course-id',message:'Guide',guideSubmissionId:'00000000-0000-4000-8000-000000000001'})}),env:{SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test'}} as Parameters<typeof handleAiTutorChat>[0]);
    expect(response.status).toBe(403);expect(mocks.guide).not.toHaveBeenCalled();
  });
  it('reloads the selected submission for a mentor follow-up',async()=>{
    const id='00000000-0000-4000-8000-000000000001';mocks.guide.mockResolvedValue('\nVERIFIED FOLLOW-UP EVIDENCE');
    const original=mocks.client.from.getMockImplementation()!;
    mocks.client.from.mockImplementation((table:string)=>{const query=original(table);if(table==='tutor_conversations')query.maybeSingle.mockResolvedValue({data:{messages:[{id:'prior',role:'user',content:'Guide this learner',guideSubmissionId:id}]},error:null});return query;});
    const response=await handleAiTutorChat({request:new Request('https://example.test/chat',{method:'POST',body:JSON.stringify({conversationId:'existing',courseId:'course-id',message:'What should they practise next?',facilitatorMode:'mentor-and-guide'})}),env:{SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test'}} as Parameters<typeof handleAiTutorChat>[0]);
    await response.text();expect(mocks.guide).toHaveBeenCalledWith(mocks.client,expect.anything(),'educator-id','course-id',id);
  });
  it('treats the actual Guide prompt containing an assignment title as feedback, never worksheet generation',async()=>{
    mocks.guide.mockResolvedValue('\nVERIFIED learner response and rubric');
    const response=await handleAiTutorChat({request:new Request('https://example.test/chat',{method:'POST',body:JSON.stringify({courseId:'course-id',message:'Guide me on Anusha — Intermediate - 10 questions. Use the saved learner response and grading criteria to give targeted feedback and one next step.',guideSubmissionId:'00000000-0000-4000-8000-000000000001',facilitatorMode:'mentor-and-guide',worksheetConfig:{templateType:'multiple_choice',difficulty:'medium',difficultyLevels:['medium'],questionCount:10}})}),env:{SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test',AI_ASSIGNMENTS_ENABLED:'true'}} as Parameters<typeof handleAiTutorChat>[0]);
    const stream=await response.text();
    expect(stream).toContain('"facilitator":"mentor-and-guide"');
    expect(stream).not.toContain('"worksheetAvailable":true');
    expect(mocks.guide).toHaveBeenCalled();
    expect(mocks.client.rpc.mock.calls.some(([name])=>name==='ai_worksheet_context')).toBe(false);
    const call=vi.mocked(fetch).mock.calls.find(([,init])=>String(init?.body).includes('VERIFIED learner'));
    const prompt=JSON.parse(String(call![1]!.body)).messages[0].content;
    expect(prompt).toContain('Do not reproduce the worksheet');
    const query=mocks.client.from.mock.results.find(result=>result.value.insert.mock.calls.length)?.value;
    expect(query.insert.mock.calls[0][0].messages.at(-1).worksheetConfig).toBeUndefined();
  });

  it('routes a typed generation request and persists its selected persona', async () => {
    mocks.client.rpc.mockImplementation(async name => name === 'ai_worksheet_context' ? { data: { gradeLevel: 'College/University' }, error: null } : { error: null });
    const response = await handleAiTutorChat({ request: new Request('https://example.test/chat', { method: 'POST', body: JSON.stringify({ courseId: 'course-id', message: 'Create a worksheet with 15 questions', facilitatorMode: 'organizer' }) }), env: { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test' } } as Parameters<typeof handleAiTutorChat>[0]);
    const stream = await response.text();
    expect(stream).toContain('"facilitator":"organizer"');
    expect(stream).toContain('"worksheetAvailable":true');
    const query = mocks.client.from.mock.results.find(result => result.value.insert.mock.calls.length)?.value;
    expect(query.insert.mock.calls[0][0].messages.at(-1)).toMatchObject({ facilitatorMode: 'organizer', worksheetConfig: { questionCount: 15 } });
  });
  it('generates assignable question variants after a clarification reply', async () => {
    const original = mocks.client.from.getMockImplementation()!;
    mocks.client.from.mockImplementation((table: string) => {
      const query = original(table);
      if (table === 'tutor_conversations') query.maybeSingle.mockResolvedValue({ data: { messages: [
        { id: 'request', role: 'user', content: 'I need a worksheet with 5 multiple-choice questions for beginner and intermediate levels' },
        { id: 'clarification', role: 'assistant', content: 'I need to clarify. Do you want specific topics?', facilitatorMode: 'auto', facilitator: 'facilitator-of-learning' },
      ] }, error: null });
      return query;
    });
    mocks.client.rpc.mockImplementation(async name => name === 'ai_worksheet_context' ? { data: { gradeLevel: 'College/University' }, error: null } : { error: null });
    const response = await handleAiTutorChat({ request: new Request('https://example.test/chat', { method: 'POST', body: JSON.stringify({ courseId: 'course-id', conversationId: 'conversation', message: 'it can general', facilitatorMode: 'auto' }) }), env: { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test' } } as Parameters<typeof handleAiTutorChat>[0]);
    const stream = await response.text();
    expect(stream).toContain('"facilitator":"resource-provider"');
    expect(stream).toContain('"worksheetAvailable":true');
    expect(stream).toContain('event: done');
    const saved = mocks.client.rpc.mock.calls.find(call => call[0] === 'append_tutor_messages')?.[1].p_new_messages.at(-1);
    expect(saved.worksheetVariants.map((variant: { difficulty: string }) => variant.difficulty)).toEqual(['beginner', 'intermediate']);
    expect(saved.worksheetConfig).toMatchObject({ questionCount: 5, templateType: 'multiple_choice' });
  });
  it('routes assignment requests to an existing source without publishing', async () => {
    const original = mocks.client.from.getMockImplementation()!;
    mocks.client.from.mockImplementation((table: string) => {
      const query = original(table);
      if (table === 'tutor_conversations') query.maybeSingle.mockResolvedValue({ data: { messages: [{ id: 'source-worksheet', role: 'assistant', content: 'Questions', worksheetConfig: { difficulty: 'medium', questionCount: 10 }, worksheetVariants: [{}] }] }, error: null });
      return query;
    });
    const response = await handleAiTutorChat({ request: new Request('https://example.test/chat', { method: 'POST', body: JSON.stringify({ courseId: 'course-id', conversationId: 'conversation', message: 'Assign this to my learners' }) }), env: { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test' } } as Parameters<typeof handleAiTutorChat>[0]);
    const stream = await response.text();
    expect(stream).toContain('"assignmentSourceId":"source-worksheet"');
    expect(stream).toContain('Review the learner details below');
    expect(fetch).not.toHaveBeenCalled();
    expect(stream).toContain('"worksheetAvailable":false');
    expect(mocks.client.rpc.mock.calls.map(call => call[0])).toEqual(['append_tutor_messages']);
  });
  it.each([
    ['learner','college_educator'],
    ['college_admin','school_educator'],
    ['college_admin','educator'],
  ])('accepts verified educator roles regardless of order: %j', async (...roles) => {
    mocks.roles = roles;
    const stream = await generate('existing-conversation');
    expect(stream).toContain('event: done');
    expect(fetch).toHaveBeenCalled();
  });
  it.each(['learner','college_admin','not_an_educator'])('denies teaching generation for non-educator role %s', async role => {
    mocks.roles=[role];
    const response=await handleAiTutorChat({request:new Request('https://example.test/chat',{method:'POST',body:JSON.stringify({courseId:'course-id',message:'Generate a worksheet',worksheetConfig:{difficulty:'medium',difficultyLevels:['medium'],questionCount:5}})}),env:{SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test'}} as Parameters<typeof handleAiTutorChat>[0]);
    expect(response.status).toBe(403);expect(fetch).not.toHaveBeenCalled();
  });
  it('blocks learner access to educator persona controls', async () => {
    mocks.roles = ['learner'];
    const response = await handleAiTutorChat({ request: new Request('https://example.test/chat', { method: 'POST', body: JSON.stringify({ courseId: 'course-id', message: 'Hello', facilitatorMode: 'organizer' }) }), env: { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test' } } as Parameters<typeof handleAiTutorChat>[0]);
    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('allows typed generation without a mapped teaching level', async () => {
    mocks.client.rpc.mockResolvedValue({data:null,error:null});
    const response=await handleAiTutorChat({request:new Request('https://example.test/chat',{method:'POST',body:JSON.stringify({courseId:'course-id',message:'Create a worksheet'})}),env:{SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test'}} as Parameters<typeof handleAiTutorChat>[0]);
    expect(response.status).toBe(200);await response.text();
    expect(mocks.client.rpc.mock.calls.some(([name])=>name==='ai_worksheet_context')).toBe(false);
  });
  it('preserves the selected grade when generating a worksheet',async()=>{
    const response=await handleAiTutorChat({request:new Request('https://example.test/chat',{method:'POST',body:JSON.stringify({courseId:'course-id',message:'Generate a worksheet',worksheetConfig:{difficulty:'medium',difficultyLevels:['medium'],questionCount:5,gradeLevel:'Grade 3'}})}),env:{SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test'}} as Parameters<typeof handleAiTutorChat>[0]);
    expect(response.status).toBe(200);await response.text();
    const query=mocks.client.from.mock.results.find(result=>result.value.insert.mock.calls.length)?.value;
    expect(query.insert.mock.calls[0][0].messages.at(-1).worksheetConfig.gradeLevel).toBe('Grade 3');
    expect(mocks.client.rpc.mock.calls.some(([name])=>name==='ai_worksheet_context')).toBe(false);
  });
  it('rejects invalid persona IDs before calling the provider', async () => {
    const response = await handleAiTutorChat({ request: new Request('https://example.test/chat', { method: 'POST', body: JSON.stringify({ courseId: 'course-id', message: 'Hello', facilitatorMode: '__proto__' }) }), env: { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test' } } as Parameters<typeof handleAiTutorChat>[0]);
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('completes only after saving a new educator conversation', async () => {
    const stream = await generate();
    expect(stream).toContain('event: done');
    expect(stream).toContain('saved-conversation');
    expect(stream).not.toContain('event: error');
    expect(stream).toContain('"worksheetAvailable":true');
    const conversationQuery = mocks.client.from.mock.results.find(result => result.value.insert.mock.calls.length)?.value;
    const saved = conversationQuery.insert.mock.calls[0][0].messages.at(-1);
    expect(saved.worksheetVariants).toEqual([{ difficulty: 'intermediate', content: 'Generated worksheet' }]);
  });

  it('reports an insert failure instead of claiming success', async () => {
    saveResult = { data: null, error: { message: 'Foreign key violation' } };
    const stream = await generate();
    expect(stream).toContain('Generated worksheet');
    expect(stream).toContain('could not be saved');
    expect(stream).not.toContain('event: done');
    expect(mocks.increment).not.toHaveBeenCalled();
  });

  it('reports an append failure instead of claiming success', async () => {
    mocks.client.rpc.mockResolvedValue({ error: { message: 'Database unavailable' } });
    const stream = await generate('existing-conversation');
    expect(stream).toContain('could not be saved');
    expect(stream).not.toContain('event: done');
  });
  it('generates the selected count separately for each checked level', async () => {
    const stream = await generate(undefined, ['low', 'high'], 15);
    expect(stream).toContain('Beginner');
    expect(stream).toContain('Advanced');
    expect(stream).toContain('event: done');
    const requests = vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init?.body))).filter(body => body.stream);
    expect(requests).toHaveLength(2);
    expect(requests[0].messages.at(-1).content).toContain('exactly 15 questions at Beginner difficulty only');
    expect(requests[1].messages.at(-1).content).toContain('exactly 15 questions at Advanced difficulty only');
    expect(requests[0].max_tokens).toBeGreaterThan(2000);
  });

  it('rejects no difficulty selection without calling the provider', async () => {
    const stream = await generate(undefined, []);
    expect(stream).toContain('VALIDATION_ERROR');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not report completion when the provider truncates the material', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('data: {"choices":[{"delta":{"content":"Partial material"},"finish_reason":"length"}]}\n\n'));
    const stream = await generate();
    expect(stream).toContain('response limit');
    expect(stream).not.toContain('event: done');
  });

  it('aborts the provider and never starts the next difficulty after client cancellation', async () => {
    let providerSignal: AbortSignal | undefined;
    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      providerSignal = init?.signal as AbortSignal;
      return new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"First questions"}}]}\n\n'));
          providerSignal!.addEventListener('abort', () => controller.error(providerSignal!.reason), { once: true });
        },
      }));
    });
    const response = await handleAiTutorChat({
      request: new Request('https://example.test/api/ai-tutor/chat', { method: 'POST', body: JSON.stringify({
        courseId: 'course', message: 'Generate', worksheetConfig: {
          templateType: 'multiple_choice', difficulty: 'low', difficultyLevels: ['low', 'high'], questionCount: 10,
        },
      }) }),
      env: { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test' },
    } as Parameters<typeof handleAiTutorChat>[0]);
    await response.body!.cancel();
    // Flush the rejected provider read and the server's cancellation handler.
    await Promise.resolve();
    await Promise.resolve();
    expect(providerSignal?.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
    expect(mocks.client.rpc).not.toHaveBeenCalled();
    expect(mocks.increment).not.toHaveBeenCalled();
  });

  it('answers educator questions without regenerating and supplies verified assignment counts', async () => {
    const original = mocks.client.from.getMockImplementation()!;
    const eq = vi.fn();
    mocks.client.from.mockImplementation((table: string) => {
      if (table !== 'ai_assignment_learners') return original(table);
      const query: Record<string, ReturnType<typeof vi.fn>> = {};
      query.select = vi.fn(() => query); query.eq = eq.mockImplementation(() => query); query.order = vi.fn(() => query);
      query.limit = vi.fn().mockResolvedValue({ data: [...Array.from({length:8},()=>({assignment_id:'saved-material',assignment:{title:'Time worksheet',generation_config:{difficultyLevels:['beginner','intermediate','advanced']}}}))], error: null });
      return query;
    });
    const stream = await generate('existing-conversation', ['medium'], 10, true);
    expect(stream).toContain('event: done');
    expect(stream).toContain('"worksheetAvailable":false');
    expect(stream).not.toContain('Intermediate -');
    const payload = vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init?.body))).find(body => body.stream);
    expect(payload.messages[0].content).toContain('"count":8');
    expect(payload.messages[0].content).toContain('Verified course assignments');
    expect(payload.messages.at(-1).content).toBe('Is that assigned to all the learners?');
    expect(eq).toHaveBeenCalledWith('assigned_by', 'educator-id');
    expect(eq).toHaveBeenCalledWith('assignment.course_id', 'course-id');
    expect(mocks.client.from).not.toHaveBeenCalledWith('ai_worksheet_sets');
    expect(mocks.increment).not.toHaveBeenCalled();
  });

  it('passes retrieved course passages to the chat model and persists source references', async () => {
    const evidence = { chunk_id: 'chunk-1', analysis_id: 'analysis-1', lesson_id: 'lesson-2', resource_id: 'resource-1', content: 'Verified lesson evidence', source_location: { name: 'Course PDF' }, similarity: .9 };
    mocks.retrieve.mockResolvedValue([evidence]);
    const response = await handleAiTutorChat({ request: new Request('https://example.test/chat', { method: 'POST', body: JSON.stringify({ courseId: 'course-id', message: 'Explain the lesson' }) }), env: { SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test', COURSE_INDEX_ENABLED: 'true' } } as Parameters<typeof handleAiTutorChat>[0]);
    const stream = await response.text();
    expect(stream).toContain('event: done');
    expect(stream).toContain('"chunkId":"chunk-1"');
    const payload = vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init?.body))).find(body => body.stream);
    expect(payload.messages[0].content).toContain('Verified lesson evidence');
    expect(payload.messages[0].content).toContain('Course PDF');
    expect(mocks.retrieve).toHaveBeenCalledWith(mocks.client, expect.objectContaining({ COURSE_INDEX_ENABLED: 'true' }), 'educator-id', 'course-id', 'Explain the lesson', undefined, false);
    const savedQuery = mocks.client.from.mock.results.find(result => result.value.insert.mock.calls.length)?.value;
    expect(savedQuery.insert.mock.calls[0][0].messages.at(-1).citations[0].chunkId).toBe('chunk-1');
  });

  it('reuses a saved worksheet without making a new generation call', async () => {
    const original = mocks.client.from.getMockImplementation()!;
    mocks.client.rpc.mockImplementation(async (name: string) => name==='ai_worksheet_context' ? {data:{gradeLevel:'College/University'},error:null}:{error:null});
    mocks.client.from.mockImplementation((table:string)=>{
      const query:any=original(table);
      if(table==='ai_assignments')query.maybeSingle=vi.fn().mockResolvedValue({data:{id:'saved-material',content:{questions:[{id:'q1',position:1,prompt:'Saved question',options:['Plan','Delay'],difficulty:'beginner'}]},grading_rules:[{questionId:'q1',acceptedAnswers:['Plan'],rubric:'Correct'}]},error:null});
      return query;
    });
    const response=await handleAiTutorChat({request:new Request('https://example.test/chat',{method:'POST',body:JSON.stringify({courseId:'course-id',conversationId:'existing',message:'Generate a worksheet',worksheetConfig:{templateType:'multiple_choice',difficulty:'low',difficultyLevels:['low'],questionCount:5}})}),env:{SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test',AI_ASSIGNMENTS_ENABLED:'true'}} as Parameters<typeof handleAiTutorChat>[0]);
    const stream=await response.text();
    expect(stream).toContain('Saved question');expect(stream).toContain('event: done');
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.increment).not.toHaveBeenCalled();
  });

});
