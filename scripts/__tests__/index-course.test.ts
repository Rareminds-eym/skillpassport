// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ enqueue: vi.fn(), process: vi.fn(), doc: vi.fn(), text: vi.fn() }));
vi.mock('../../functions/api/ai-tutor/utils/course-index', async original => ({
  ...await original<typeof import('../../functions/api/ai-tutor/utils/course-index')>(),
  enqueueCourseIndex: mocks.enqueue, processCourseIndexBatch: mocks.process,
}));
vi.mock('../../../embedding-worker/src/providers', () => ({ callDocProvider: mocks.doc, callTextProvider: mocks.text, GEMINI_MODEL_ID: 'google/gemini-embedding-2-preview', GEMINI_DIMENSIONS: 1536 }));
import { parseOptions, indexCourse, localEmbeddingService } from '../index-course';
const id = '00000000-0000-4000-8000-000000000001';
afterEach(() => vi.clearAllMocks());
describe('local course index', () => {
  it('requires a course UUID and supports force, help and an explicit environment file', () => {
    expect(() => parseOptions([])).toThrow('course-id');
    expect(() => parseOptions(['--course-id', 'bad'])).toThrow();
    expect(() => parseOptions(['--course-id'])).toThrow('Missing');
    expect(() => parseOptions(['--unknown'])).toThrow('Unknown');
    expect(parseOptions(['--course-id', id, '--force', '--env-file', 'local.env'])).toEqual({ courseId: id, force: true, envFile: 'local.env', help: false });
    expect(parseOptions(['--help']).help).toBe(true);
  });
  it('claims only the requested course and stops when no work remains', async () => {
    const query: any = { select: () => query, eq: () => query, is: () => query, maybeSingle: async () => ({ data: { course_id: id } }), order: () => query, range: async () => ({ data: [{ lesson_id: 'lesson', resource_id: null, version: 1, status: 'ready', is_current: true }] }) };
    mocks.enqueue.mockResolvedValue({ sources: 1 });
    mocks.process.mockResolvedValueOnce({ claimed: 1, processed: 1 }).mockResolvedValueOnce({ claimed: 0, processed: 0 });
    const db = { from: () => query } as never;
    expect(await indexCourse(db, {}, id, false, vi.fn())).toEqual({ sources: 1, completed: 1 });
    expect(mocks.enqueue).toHaveBeenCalledWith(db, null, id, false);
    expect(mocks.process).toHaveBeenCalledTimes(2);
    expect(mocks.process).toHaveBeenCalledWith(db, {}, 1, id);
  });
  it('fails rather than reporting a successful import for failed or stale records', async () => {
    const query: any = { select: () => query, eq: () => query, is: () => query, maybeSingle: async () => ({ data: { course_id: id } }), order: () => query, range: async () => ({ data: [{ lesson_id: 'lesson', version: 1, status: 'failed', is_current: false }] }) };
    mocks.enqueue.mockResolvedValue({ sources: 1 }); mocks.process.mockResolvedValue({ claimed: 0, processed: 0 });
    await expect(indexCourse({ from: () => query } as never, {}, id, true, vi.fn())).rejects.toThrow('incomplete');
  });
  it('reuses independent document embeddings and rejects incompatible vectors', async () => {
    mocks.doc.mockResolvedValue({ embeddings: [{ index: 0, embedding: Array(1536).fill(.1) }, { index: 1, embedding: Array(1536).fill(.2) }] });
    const service = localEmbeddingService('test');
    expect((await service.embedTexts!(['one', 'two'])).embeddings).toHaveLength(2);
    expect(mocks.doc).toHaveBeenCalledWith(['one', 'two'], 'test', 'local-course-index', 'http://localhost');
    mocks.doc.mockResolvedValue({ embeddings: [{ index: 0, embedding: [1] }] });
    await expect(service.embedTexts!(['one'])).rejects.toThrow('Incompatible');
  });
});
