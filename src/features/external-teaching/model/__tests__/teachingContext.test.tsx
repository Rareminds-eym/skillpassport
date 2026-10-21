import {describe,it,expect} from 'vitest';
import {renderHook} from '@testing-library/react';
import {AssignedTeachingContext,useAssignedTeaching,type TeachingContext} from '../teachingContext';
describe('verified assigned teaching context',()=>{
  it('leaves ordinary educators without delegated context',()=>{expect(renderHook(useAssignedTeaching).result.current).toBeNull();});
  it('shares the verified mapping with existing educator components',()=>{
    const context={external:true,delegatedAccess:true,staff:{id:'staff',name:'Hari'},mappings:[]} as TeachingContext;
    const {result}=renderHook(useAssignedTeaching,{wrapper:({children})=><AssignedTeachingContext.Provider value={context}>{children}</AssignedTeachingContext.Provider>});
    expect(result.current).toBe(context);
  });
});
