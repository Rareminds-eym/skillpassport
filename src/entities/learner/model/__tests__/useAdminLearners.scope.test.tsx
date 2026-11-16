import {beforeEach, expect, it, vi} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
const f = vi.hoisted(() => ({post: vi.fn(), user: {id: 'qa-school-owner', role: 'school_admin', schoolId: 'qa-school'}}));
vi.mock('@/shared/api/apiClient', () => ({apiPost: f.post}));
vi.mock('@/shared/model/authStore', () => ({useAuthStore: {getState: () => ({user: f.user})}}));
import {useAdminLearners} from '../useAdminLearners';

it.each([
  {name: 'canonical only', row: {contactNumber: '+919000000001'}, expected: '+919000000001'},
  {name: 'conflicting legacy fields', row: {contactNumber: '+919000000001', contact_number: '9000000002', contact_dial_code: '91', profile: {contact_number: '9000000003'}}, expected: '+919000000001'},
  {name: 'canonical whitespace', row: {contactNumber: ' 9000000001 '}, expected: '9000000001'},
  {name: 'legacy only', row: {contact_number: '9000000002'}, expected: undefined},
  {name: 'profile and alternate only', row: {profile: {contact_number: '9000000003'}, alternate_number: '9000000004'}, expected: undefined},
  {name: 'empty canonical', row: {contactNumber: '  ', contact_number: '9000000002'}, expected: undefined},
  {name: 'null canonical', row: {contactNumber: null, contact_number: '9000000002'}, expected: undefined},
])('uses canonical phone without substitution: $name', async ({row, expected}) => {
  f.post.mockImplementation(async (_path, input) => ({data: input.action === 'fetch-learner-count' ? {count: 1} : [{id: 'qa-phone-learner', name: 'QA learner', ...row}]}));
  const {result} = renderHook(() => useAdminLearners());
  await waitFor(() => expect(result.current.learners).toHaveLength(1));
  expect(result.current.learners[0].phone).toBe(expected);
  expect(result.current.learners[0].contactNumber).toBe(expected);
});
beforeEach(() => {
  vi.clearAllMocks();
  f.post.mockImplementation(async (_path, input) => {
    const body = JSON.parse(JSON.stringify(input));
    if (body.schoolId !== 'qa-school' || 'collegeId' in body || 'universityId' in body) {
      throw new Error('Profile access denied');
    }
    return {data: input.action === 'fetch-learner-count' ? {count: 0} : []};
  });
});
it('loads the school list/count without conflicting absent institution selectors', async () => {
  const {result} = renderHook(() => useAdminLearners());
  await waitFor(() => expect(f.post).toHaveBeenCalled());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBeNull();
  expect(result.current.totalCount).toBe(0);
  expect(f.post.mock.calls.map(([, input]) => input.action)).toEqual(['fetch-learner-count', 'fetch-learners-admin']);
});

it('loads all filter learners through server-sized pages without truncation', async () => {
  f.post.mockImplementation(async (_path, input) => {
    if (input.action === 'fetch-learner-count') return {data: {count: 501}};
    if (input.pageSize > 500) throw new Error('Invalid page size');
    return {data: Array.from({length: input.page === 1 ? 500 : 1}, (_, i) => ({id: `${input.page}-${i}`, name: 'QA learner', skills: []}))};
  });
  const {result} = renderHook(() => useAdminLearners({loadAll: true}));
  await waitFor(() => expect(result.current.learners).toHaveLength(501));
  expect(result.current.error).toBeNull();
  const reads=f.post.mock.calls.map(([, input])=>input).filter(x=>x.action==='fetch-learners-admin');
  expect(reads.map(x=>[x.page,x.pageSize,x.useSimple])).toEqual([[1,500,false],[2,500,false]]);
});
it('surfaces a later filter-page failure without returning partial data or another reader', async () => {
  f.post.mockImplementation(async (_path, input) => {
    if (input.action === 'fetch-learner-count') return {data:{count:501}};
    if (input.page===2) throw new Error('QA second page unavailable');
    return {data:Array.from({length:500},(_,i)=>({id:String(i),name:'QA learner',skills:[]}))};
  });
  const {result}=renderHook(()=>useAdminLearners({loadAll:true}));
  await waitFor(()=>expect(result.current.error).toContain('QA second page unavailable'));
  expect(result.current.learners).toHaveLength(0);
  expect(f.post.mock.calls.map(([,input])=>input).filter(x=>x.useSimple===true)).toHaveLength(0);
});

it('does not fetch a list page when the authoritative count is zero', async () => {
  const {result}=renderHook(()=>useAdminLearners({loadAll:true}));
  await waitFor(()=>expect(f.post).toHaveBeenCalled());
  await waitFor(()=>expect(result.current.loading).toBe(false));
  expect(result.current.error).toBeNull();
  expect(f.post.mock.calls.map(([,input])=>input.action)).toEqual(['fetch-learner-count']);
});
it('rejects incomplete pages instead of presenting them as the complete filter data', async () => {
  f.post.mockImplementation(async (_path,input)=>({data:input.action==='fetch-learner-count'?{count:2}:[{id:'only-one',name:'QA learner'}]}));
  const {result}=renderHook(()=>useAdminLearners({loadAll:true}));
  await waitFor(()=>expect(result.current.error).toContain('Learner list changed'));
  expect(result.current.learners).toHaveLength(0);
});
