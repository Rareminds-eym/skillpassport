import { beforeEach, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: post }));
vi.mock('@/shared/api/collegeAcademicApi', () => ({ getProgramSectionlearners: vi.fn() }));
import { loadRecruiterTalentRows } from '../talentPoolService';
import { useLearners } from '@/entities/learner/model/useLearners';
beforeEach(() => vi.clearAllMocks());
it('loads mapped recruiter candidates and preserves server-masked contacts without academic queries', async () => {
  post.mockResolvedValue({ success: true, data: [{ id: 'candidate', name: 'Public candidate', email: null, contact_number: null,
    university: 'QA University', branch_field: 'Computing', skills: [{ id: 'skill', name: 'TypeScript', enabled: true }],
    projects: [{ id: 'project', title: 'Example' }] }] });
  const { result } = renderHook(() => useLearners({ loadRows: loadRecruiterTalentRows }));
  await waitFor(() => expect(result.current.learners).toHaveLength(1));
  expect(result.current.learners[0]).toMatchObject({ id: 'candidate', name: 'Public candidate', email: null,
    university: 'QA University', dept: 'Computing', skills: [{ name: 'TypeScript' }], projects: [{ title: 'Example' }] });
  expect(result.current.learners[0].phone).toBeUndefined();
  expect(post).toHaveBeenCalledExactlyOnceWith('/recruiter/actions', { action: 'list-learners', include_details: true });
});
it('surfaces discovery failure without trying the academic endpoint or fabricating candidates', async () => {
  post.mockRejectedValue(new Error('Discovery unavailable'));
  const { result } = renderHook(() => useLearners({ loadRows: loadRecruiterTalentRows }));
  await waitFor(() => expect(result.current.error).toBe('Discovery unavailable'));
  expect(result.current.learners).toEqual([]);
  expect(post).toHaveBeenCalledTimes(1);
});
it('accepts a genuine empty discovery result', async () => {
  post.mockResolvedValue({ success: true, data: [] });
  await expect(loadRecruiterTalentRows()).resolves.toEqual([]);
});
it.each([{ success: false, data: [] }, { success: true, data: null }, { success: true, data: [{}] }])(
  'rejects malformed discovery rather than reporting an empty success: %j', async response => {
    post.mockResolvedValue(response);
    await expect(loadRecruiterTalentRows()).rejects.toThrow('invalid response');
  });
