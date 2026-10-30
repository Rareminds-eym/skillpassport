// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { enrichCourseResources } from '../course-resource-analysis';
import { formatCourseContextForPrompt, type CourseContext } from '../course-context';
const mocks = vi.hoisted(() => ({ analyze: vi.fn(), cached: vi.fn() }));
vi.mock('../resource-analysis', () => ({ analyzeResource: mocks.analyze, cachedAnalysis: mocks.cached }));
function context(): CourseContext {
  return { courseTitle: 'Any course', courseDescription: 'Course description', courseCode: '', currentModule: null,
    currentLesson: { lessonId: 'lesson', title: 'Lesson', moduleTitle: 'Module', description: '', content: 'x'.repeat(600) + 'Important final paragraph', duration: null, orderIndex: 1 },
    allModules: [], allLessons: [], learnerProgress: { completedLessons: [], currentLessonStatus: null, totalLessons: 1, completionPercentage: 0 },
    videoSummary: { summary: '', keyPoints: [], topics: [], transcript: '00:12 The full transcript evidence.' },
    availableResources: [{ resourceId: 'resource', name: 'Notes.pdf', type: 'pdf', url: 'https://files.test/notes.pdf', content: null }] };
}
function database(authorized = true) {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), update: vi.fn() };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.update.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: authorized ? { id: 'enrollment' } : null, error: null });
  return { from: vi.fn(() => query) } as unknown as SupabaseClient;
}
beforeEach(() => { vi.clearAllMocks(); mocks.cached.mockReturnValue(null); mocks.analyze.mockResolvedValue({ text: 'Page 2: Resource evidence', storedContent: 'cached' }); });
describe('resource-backed course context', () => {
  it('analyzes, caches and includes real evidence plus full lesson/transcript text', async () => {
    const data = context();
    const db = database();
    await enrichCourseResources(data, db, {}, 'course', 'user', false);
    expect(mocks.analyze).toHaveBeenCalledOnce();
    const prompt = formatCourseContextForPrompt(data);
    expect(prompt).toContain('Important final paragraph');
    expect(prompt).toContain('Page 2: Resource evidence');
    expect(prompt).toContain('00:12 The full transcript evidence');
    expect(db.from).toHaveBeenCalledWith('lesson_resources');
  });
  it('reuses cached analysis without another paid model request', async () => {
    mocks.cached.mockReturnValue('Cached PDF evidence');
    const data = context();
    await enrichCourseResources(data, database(), {}, 'course', 'user', false);
    expect(mocks.analyze).not.toHaveBeenCalled();
    expect(data.availableResources[0].content).toBe('Cached PDF evidence');
  });
  it('does not analyze or expose cached data without course access', async () => {
    const data = context(); data.availableResources[0].content = 'private text';
    await enrichCourseResources(data, database(false), {}, 'course', 'user', false);
    expect(mocks.analyze).not.toHaveBeenCalled();
    expect(data.availableResources[0].content).toBeNull();
    expect(data.availableResources[0].analysisError).toContain('access');
  });
  it('reports model failures rather than presenting placeholders as content', async () => {
    mocks.analyze.mockRejectedValue(new Error('Model unavailable'));
    const data = context();
    await enrichCourseResources(data, database(), {}, 'course', 'user', false);
    expect(formatCourseContextForPrompt(data)).toContain('Model unavailable');
    expect(data.availableResources[0].content).toBeNull();
  });
  it('limits new paid analysis to three resources per turn and marks remaining coverage', async () => {
    const data = context(); data.availableResources = Array.from({ length: 4 }, (_, i) => ({ ...data.availableResources[0], resourceId: String(i) }));
    await enrichCourseResources(data, database(), {}, 'course', 'user', false);
    expect(mocks.analyze).toHaveBeenCalledTimes(3);
    expect(data.availableResources[3].analysisError).toContain('budget');
  });
});
