// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock('../../../../lib/auth', () => ({ getContextUser: () => ({ id: 'current-user' }), getServiceClient: () => mocks }));
import { handleWorksheets, publicationSchema } from '../worksheets';
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const valid = () => ({ organizationId: id(1), conversationId: id(2), messageId: id(3), groupId: id(4), title: 'Worksheet', instructions: '', dueAt: null, reviewed: true,
  variants: [{ difficulty: 'beginner', studentContent: 'Question one', solutions: 'Answer one', learnerIds: [id(5)] }] });
describe('worksheet publication validation', () => {
  it('requires educator review and recipients, without client-authored worksheet content', () => {
    expect(publicationSchema.safeParse(valid()).success).toBe(true);
    expect(publicationSchema.safeParse({ ...valid(), reviewed: false }).success).toBe(false);
    const input = valid(); input.variants[0].learnerIds = [];
    expect(publicationSchema.safeParse(input).success).toBe(false);
  });
  it('rejects one learner assigned to multiple levels and duplicate levels', () => {
    const input = valid(); input.variants.push({ ...input.variants[0], difficulty: 'advanced' });
    expect(publicationSchema.safeParse(input).success).toBe(false);
    input.variants[1].learnerIds = [id(6)]; input.variants[1].difficulty = 'beginner';
    expect(publicationSchema.safeParse(input).success).toBe(false);
  });
});
describe('worksheet access', () => {
  it('restores a saved Not now choice only from the owned worksheet message', async () => {
    const eq = vi.fn();
    mocks.from.mockImplementation((table: string) => {
      const query: Record<string, ReturnType<typeof vi.fn>> = {};
      for (const method of ['select', 'order', 'limit']) query[method] = vi.fn(() => query);
      query.eq = vi.fn((...args) => { eq(...args); return query; });
      query.single = vi.fn().mockResolvedValue({ data: { role: 'college_educator' }, error: null });
      query.maybeSingle = vi.fn().mockResolvedValue({ data: table === 'tutor_conversations' ? {
        messages: [{ id: id(3), role: 'assistant', worksheetVariants: [{}], assignmentDeferred: true }],
      } : null, error: null });
      return query;
    });
    mocks.rpc.mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { organization_id: id(9) }, error: null }) });
    const response = await request({ action: 'status', conversationId: id(2), messageId: id(3) });
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ published: false, learnerCount: 0, deferred: true });
    expect(eq).toHaveBeenCalledWith('learner_id', 'current-user');
  });
  it('restores publication status from owned persisted assignments without republishing', async () => {
    const eq = vi.fn();
    mocks.from.mockImplementation((table: string) => {
      const query: Record<string, ReturnType<typeof vi.fn>> = {};
      for (const method of ['select', 'order', 'limit']) query[method] = vi.fn(() => query);
      query.eq = vi.fn((...args) => { eq(...args); return query; });
      query.single = vi.fn().mockResolvedValue({ data: { role: 'college_educator' }, error: null });
      query.maybeSingle = vi.fn().mockResolvedValue({ data: table === 'ai_worksheet_sets' ? { id: id(4), recipients: [{ count: 8 }] } : null, error: null });
      return query;
    });
    mocks.rpc.mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { organization_id: id(9) }, error: null }) });
    const response = await request({ action: 'status', conversationId: id(2), messageId: id(3) });
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ published: true, learnerCount: 8 });
    expect(eq).toHaveBeenCalledWith('educator_user_id', 'current-user');
    expect(eq).toHaveBeenCalledWith('organization_id', id(9));
    expect(eq).toHaveBeenCalledWith('source_message_id', id(3));
    expect(mocks.rpc.mock.calls.map(call => call[0])).not.toContain('publish_ai_worksheet_bundle');
  });

  beforeEach(() => vi.clearAllMocks());
  const request = (body: unknown) => handleWorksheets({ request: new Request('https://test/api/ai-tutor/worksheets', { method: 'POST', body: JSON.stringify(body) }), env: {} } as unknown as Parameters<typeof handleWorksheets>[0]);
  it('rejects educator actions for a learner even with a supplied educator role', async () => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {}; for (const method of ['select', 'eq']) query[method] = vi.fn(() => query);
    query.single = vi.fn().mockResolvedValue({ data: { role: 'learner' }, error: null }); mocks.from.mockReturnValue(query);
    expect((await request({ action: 'publish', role: 'educator', ...valid() })).status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('never opens another learner delivery or fetches private solutions', async () => {
    mocks.from.mockImplementation((table: string) => {
      const query: Record<string, ReturnType<typeof vi.fn>> = {}; for (const method of ['select', 'eq']) query[method] = vi.fn(() => query);
      query.maybeSingle = vi.fn().mockResolvedValue({ data: table === 'learners' ? { id: id(5) } : null, error: null });
      return query;
    });
    expect((await request({ action: 'open', recipientId: id(7), courseId: id(8) })).status).toBe(404);
    expect(mocks.from.mock.calls.flat()).not.toContain('ai_worksheet_solutions');
  });
  it('denies an assigned learner whose organization membership ended', async () => {
    const tables: Record<string, unknown> = { learners: { id: id(5) }, ai_worksheet_recipients: { id: id(7), worksheet: { organization_id: id(1), student_content: 'Questions' } }, organization_members: null };
    mocks.from.mockImplementation((table: string) => {
      const query: Record<string, ReturnType<typeof vi.fn>> = {}; for (const method of ['select', 'eq']) query[method] = vi.fn(() => query);
      query.maybeSingle = vi.fn().mockResolvedValue({ data: tables[table], error: null });
      return query;
    });
    expect((await request({ action: 'open', recipientId: id(7), courseId: id(8) })).status).toBe(403);
    expect(mocks.from.mock.calls.flat()).not.toContain('ai_worksheet_solutions');
  });
  it('filters active organizations before paginating learner deliveries', async () => {
    const range = vi.fn(); const orgFilter = vi.fn(); const eq = vi.fn(); const projections: string[] = [];
    mocks.from.mockImplementation((table: string) => {
      const query: Record<string, ReturnType<typeof vi.fn>> = {};
      query.select = vi.fn((projection: string) => { projections.push(projection); return query; });
      query.eq = eq.mockImplementation(() => query);
      query.order = vi.fn(() => query);
      query.in = orgFilter.mockImplementation(() => query);
      query.range = range.mockResolvedValue({ data: [], error: null });
      query.maybeSingle = vi.fn().mockResolvedValue({ data: { id: id(5) }, error: null });
      query.then = vi.fn((resolve: (_value: unknown) => void) => resolve({ data: table === 'organization_members' ? [{ organization_id: id(1) }] : [], error: null }));
      return query;
    });
    expect((await request({ action: 'list', page: 2, courseId: id(8) })).status).toBe(200);
    expect(eq).toHaveBeenCalledWith('worksheet.course_id', id(8));
    expect(orgFilter).toHaveBeenCalledWith('worksheet.organization_id', [id(1)]);
    expect(range).toHaveBeenCalledWith(50, 74);
    expect(projections.join(' ')).not.toMatch(/solutions|student_content/);
  });
  it('requires an explicit course when listing assignments', async () => {
    expect((await request({ action: 'list' })).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('publishes authoritative generated content and ignores supplied college/content overrides', async () => {
    mocks.from.mockImplementation((table: string) => {
      const query: Record<string, ReturnType<typeof vi.fn>> = {}; for (const method of ['select', 'eq']) query[method] = vi.fn(() => query);
      query.single = vi.fn().mockResolvedValue({ data: { role: 'college_educator' }, error: null });
      query.maybeSingle = vi.fn().mockResolvedValue({ data: table === 'tutor_conversations' ? { messages: [{ id: id(3), role: 'assistant', worksheetVariants: [{ difficulty: 'beginner', content: '<!-- STUDENT_WORKSHEET -->Generated questions<!-- PRIVATE_SOLUTIONS -->Private answers<!-- END_WORKSHEET -->' }] }] } : null, error: null });
      return query;
    });
    mocks.rpc.mockImplementation((name: string) => name === 'ai_worksheet_educator_scope'
      ? { single: vi.fn().mockResolvedValue({ data: { organization_id: id(9), organization_name: 'Assigned College' }, error: null }) }
      : Promise.resolve({ data: id(4), error: null }));
    const response = await request({ action: 'publish', ...valid(), organizationId: id(10) });
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('publish_ai_worksheets', expect.objectContaining({ p_organization_id: id(9), p_user_id: 'current-user', p_variants: [{ difficulty: 'beginner', studentContent: 'Generated questions', solutions: 'Private answers', learnerIds: [id(5)] }] }));
  });
  it('uses the authenticated educator mapping for learner search', async () => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {}; for (const method of ['select', 'eq']) query[method] = vi.fn(() => query);
    query.single = vi.fn().mockResolvedValue({ data: { role: 'college_educator' }, error: null });
    mocks.from.mockReturnValue(query);
    const mapped: Record<string, ReturnType<typeof vi.fn>> = {}; mapped.order = vi.fn(() => mapped); mapped.range = vi.fn().mockResolvedValue({ data: [], error: null });
    mocks.rpc.mockImplementation((name: string) => name === 'ai_worksheet_educator_scope' ? { single: vi.fn().mockResolvedValue({ data: { organization_id: id(9) }, error: null }) } : mapped);
    expect((await request({ action: 'learners', organizationId: id(10), userId: 'someone-else' })).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('ai_worksheet_eligible_learners', { p_user_id: 'current-user' });
  });
  it('returns legacy source metadata without blocking the learner picker, but rejects publication', async () => {
    mocks.from.mockImplementation(() => {
      const query: Record<string, ReturnType<typeof vi.fn>> = {}; for (const method of ['select', 'eq']) query[method] = vi.fn(() => query);
      query.single = vi.fn().mockResolvedValue({ data: { role: 'college_educator' }, error: null });
      query.maybeSingle = vi.fn().mockResolvedValue({ data: { messages: [{ id: id(3), role: 'assistant', worksheetVariants: [{ difficulty: 'beginner', content: 'Old questions and answers' }] }] }, error: null });
      return query;
    });
    mocks.rpc.mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { organization_id: id(9), organization_name: 'College' }, error: null }) });
    const response = await request({ action: 'source', conversationId: id(2), messageId: id(3) });
    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({ assignmentReady: false, organization: { id: id(9) }, variants: [{ difficulty: 'beginner', content: 'Old questions and answers' }] });
    expect((await request({ action: 'publish', ...valid() })).status).toBe(409);
    expect(mocks.rpc.mock.calls.some(([name]) => name === 'publish_ai_worksheets')).toBe(false);
  });
  it('enables publication of an existing blank worksheet and stores its key privately', async () => {
    mocks.from.mockImplementation(() => {
      const query: Record<string, ReturnType<typeof vi.fn>> = {}; for (const method of ['select', 'eq']) query[method] = vi.fn(() => query);
      query.single = vi.fn().mockResolvedValue({ data: { role: 'college_educator' }, error: null });
      query.maybeSingle = vi.fn().mockResolvedValue({ data: { messages: [{ id: id(3), role: 'assistant', worksheetConfig: { templateType: 'fill_in_blank', questionCount: 1, includeAnswerKey: true }, worksheetVariants: [{ difficulty: 'beginner', content: '1. Set clear ______.\n**Answer Key:**\n1. goals' }] }] }, error: null });
      return query;
    });
    mocks.rpc.mockImplementation((name: string) => name === 'ai_worksheet_educator_scope' ? { single: vi.fn().mockResolvedValue({ data: { organization_id: id(9), organization_name: 'College' }, error: null }) } : Promise.resolve({ data: id(4), error: null }));
    const source = await request({ action: 'source', conversationId: id(2), messageId: id(3) });
    expect((await source.json()).data).toMatchObject({ assignmentReady: true, variants: [{ difficulty: 'beginner', content: '1. Set clear ______.' }] });
    expect((await request({ action: 'publish', ...valid() })).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('publish_ai_worksheets', expect.objectContaining({ p_variants: [{ difficulty: 'beginner', studentContent: '1. Set clear ______.', solutions: '**Answer Key:**\n1. goals', learnerIds: [id(5)] }] }));
  });
  it('assigns all authoritative difficulties with server-selected recipients', async () => {
    mocks.from.mockImplementation(() => {
      const query: Record<string, ReturnType<typeof vi.fn>> = {}; for (const method of ['select', 'eq']) query[method] = vi.fn(() => query);
      query.single = vi.fn().mockResolvedValue({ data: { role: 'college_educator' }, error: null });
      query.maybeSingle = vi.fn().mockResolvedValue({ data: { messages: [{ id: id(3), role: 'assistant', worksheetVariants: ['beginner', 'intermediate', 'advanced'].map(difficulty => ({ difficulty, content: `<!-- STUDENT_WORKSHEET -->${difficulty} questions<!-- PRIVATE_SOLUTIONS -->${difficulty} answers<!-- END_WORKSHEET -->` })) }] }, error: null });
      return query;
    });
    mocks.rpc.mockImplementation((name: string) => name === 'ai_worksheet_educator_scope'
      ? { single: vi.fn().mockResolvedValue({ data: { organization_id: id(9) }, error: null }) }
      : Promise.resolve({ data: { groupId: id(4), learnerCount: 62 }, error: null }));
    const response = await request({ action: 'publish-all', ...valid(), learnerIds: [id(10)], organizationId: id(10) });
    expect(response.status).toBe(200);
    const args = mocks.rpc.mock.calls.find(([name]) => name === 'publish_ai_worksheet_bundle')?.[1];
    expect(args.p_variants).toEqual(['beginner', 'intermediate', 'advanced'].map(difficulty => ({ difficulty, studentContent: `${difficulty} questions`, solutions: `${difficulty} answers` })));
    expect(args).not.toHaveProperty('learnerIds');
    expect(args).not.toHaveProperty('p_organization_id');
    expect(args.p_variants[0]).not.toHaveProperty('learnerIds');
    expect((await response.json()).data.learnerCount).toBe(62);
  });
  it('gets grade context only for the authenticated educator', async () => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {}; for (const method of ['select', 'eq']) query[method] = vi.fn(() => query);
    query.single = vi.fn().mockResolvedValue({ data: { role: 'college_educator' }, error: null }); mocks.from.mockReturnValue(query);
    mocks.rpc.mockImplementation((name: string) => name === 'ai_worksheet_educator_scope'
      ? { single: vi.fn().mockResolvedValue({ data: { organization_id: id(9) }, error: null }) }
      : Promise.resolve({ data: { gradeLevel: 'College/University', learnerCount: 8 }, error: null }));
    const response = await request({ action: 'context', userId: 'someone-else' });
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('ai_worksheet_context', { p_user_id: 'current-user' });
    expect((await response.json()).data.gradeLevel).toBe('College/University');
  });

});
