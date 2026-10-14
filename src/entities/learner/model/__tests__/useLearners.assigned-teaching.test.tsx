import {it,expect,vi} from 'vitest';
import {renderHook,waitFor} from '@testing-library/react';
const api=vi.hoisted(()=>vi.fn());
vi.mock('@/shared/api/apiClient',()=>({apiPost:api}));
vi.mock('@/shared/api/collegeAcademicApi',()=>({getProgramSectionlearners:api}));
import {useLearners} from '../useLearners';
it('renders assigned learner rows through the existing learner hook without unrestricted queries',async()=>{
  const loadRows=vi.fn().mockResolvedValue([{id:'learner',name:'Anu',roll_number:'42',semester:4,section:'A',specialization:'Analytics'}]);
  const {result}=renderHook(()=>useLearners({loadRows}));
  await waitFor(()=>expect(result.current.loading).toBe(false));
  expect(result.current.learners[0]).toMatchObject({id:'learner',name:'Anu',roll_number:'42'});
  expect(loadRows).toHaveBeenCalledOnce();expect(api).not.toHaveBeenCalled();
});
