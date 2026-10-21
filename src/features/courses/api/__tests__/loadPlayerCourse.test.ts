import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ apiPost: vi.fn(), teaching: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: mocks.apiPost }));
vi.mock('@/features/external-teaching/api/teachingApi', () => ({ teaching: mocks.teaching }));
import { loadPlayerCourse } from '../loadPlayerCourse';
beforeEach(() => vi.resetAllMocks());
it('loads mapped course lessons and resources without the blocked learner endpoint', async () => {
 const modules = [{ module_id: 'module', lessons: [{ lesson_id: 'lesson', lesson_resources: [{ type: 'youtube', url: 'https://youtu.be/example' }] }] }];
 mocks.teaching.mockResolvedValueOnce([{ course_id: 'course', title: 'AI Tools' }]).mockResolvedValueOnce(modules);
 expect(await loadPlayerCourse('course', true)).toEqual({ course_id: 'course', title: 'AI Tools', modules });
 expect(mocks.teaching).toHaveBeenCalledWith('course_content', { courseId: 'course' });
 expect(mocks.apiPost).not.toHaveBeenCalled();
});
it('rejects unmapped courses without falling back to general access', async () => {
 mocks.teaching.mockResolvedValue([]);
 await expect(loadPlayerCourse('other', true)).rejects.toThrow('not assigned');
 expect(mocks.teaching).toHaveBeenCalledTimes(1);
 expect(mocks.apiPost).not.toHaveBeenCalled();
});
it('keeps the existing ordinary course lookup', async () => {
 mocks.apiPost.mockResolvedValue({ data: { course_id: 'course', modules: [] } });
 expect(await loadPlayerCourse('course', false)).toEqual({ course_id: 'course', modules: [] });
 expect(mocks.apiPost).toHaveBeenCalledWith('/learner-pages/actions', { action: 'fetch-course-full', courseId: 'course' });
 expect(mocks.teaching).not.toHaveBeenCalled();
});
