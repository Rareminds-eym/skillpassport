// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ context: vi.fn(), enrich: vi.fn(), allowed: vi.fn() }));
vi.mock('../../../ai-tutor/utils/course-context', () => ({ buildCourseContext: mocks.context }));
vi.mock('../../../ai-tutor/utils/course-resource-analysis', () => ({ enrichCourseResources: mocks.enrich, canAnalyzeCourseResources: mocks.allowed }));
import { handleExtractContent } from '../extract-content';
const id = '00000000-0000-4000-8000-000000000001';
const db = { from: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.allowed.mockResolvedValue(true);
  mocks.context.mockResolvedValue({ availableResources: [{ resourceId: id, content: null }] });
  mocks.enrich.mockImplementation(async context => { context.availableResources[0].content = 'Page 1: Real educational evidence'; });
  db.from.mockImplementation(table => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const method of ['select', 'eq', 'in']) query[method] = vi.fn(() => query);
    query.limit = vi.fn().mockResolvedValue({ data: [{ resource_id: id, lesson_id: id, name: 'Notes.pdf' }], error: null });
    query.maybeSingle = vi.fn().mockResolvedValue({ data: table === 'lessons' ? { module_id: id } : { course_id: id }, error: null });
    return query;
  });
});
function request(body: unknown, user: { id: string } | undefined = { id: 'user' }) {
  return handleExtractContent({ request: new Request('https://app.test/api/storage/extract-content', { method: 'POST', body: JSON.stringify(body) }), user, env: {}, supabaseAdmin: db } as Parameters<typeof handleExtractContent>[0]);
}
describe('authenticated real resource extraction', () => {
  it('processes a stored resource with Gemini integration rather than placeholder text', async () => {
    const response = await request({ resourceId: id });
    expect(response.status).toBe(200);
    expect((await response.json()).data.results[0]).toMatchObject({ status: 'success', contentLength: 33 });
    expect(mocks.enrich).toHaveBeenCalledOnce();
  });
  it('rejects arbitrary caller-provided URLs', async () => {
    expect((await request({ fileUrl: 'http://127.0.0.1/private.pdf' })).status).toBe(400);
    expect(mocks.enrich).not.toHaveBeenCalled();
  });
  it('denies processing without course access', async () => {
    mocks.allowed.mockResolvedValue(false);
    expect((await request({ resourceId: id })).status).toBe(403);
    expect(mocks.context).not.toHaveBeenCalled();
    expect(mocks.enrich).not.toHaveBeenCalled();
  });
  it('rejects oversized batches before processing', async () => {
    expect((await request({ resourceIds: [id, id, id, id] })).status).toBe(400);
    expect(mocks.enrich).not.toHaveBeenCalled();
  });
});
