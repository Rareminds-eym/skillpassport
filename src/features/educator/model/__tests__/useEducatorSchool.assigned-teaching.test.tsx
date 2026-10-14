import {describe,it,expect,vi} from 'vitest';
import {renderHook} from '@testing-library/react';
const api=vi.hoisted(()=>vi.fn());
vi.mock('@/shared/api/apiClient',()=>({apiPost:api}));
vi.mock('@/shared/model/authStore',()=>({useUser:()=>({id:'trainer',email:'trainer@example.com'})}));
import {useEducatorSchool} from '../useEducatorSchool';
import {AssignedTeachingContext,type TeachingContext} from '@/features/external-teaching/model/teachingContext';
it('uses verified mappings without requesting unrestricted educator records',()=>{
  const context={external:true,delegatedAccess:true,staff:{id:'staff'},mappings:[{section_id:'section'}]} as TeachingContext;
  const {result}=renderHook(useEducatorSchool,{wrapper:({children})=><AssignedTeachingContext.Provider value={context}>{children}</AssignedTeachingContext.Provider>});
  expect(result.current.assignedClassIds).toEqual(['section']);expect(result.current.loading).toBe(false);expect(api).not.toHaveBeenCalled();
});
