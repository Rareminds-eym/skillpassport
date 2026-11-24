import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {renderHook,waitFor,cleanup} from '@testing-library/react';
import type {ReactNode} from 'react';
import {afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({action:vi.fn()}));
vi.mock('../../api/worksheetService',()=>({worksheetAction:mocks.action}));
import {useWorksheetContext} from '../worksheetQueries';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('deduplicates teaching context and never requests old publications',async()=>{
 mocks.action.mockResolvedValue({gradeLevel:'College',learnerCount:8});
 const client=new QueryClient();const wrapper=({children}:{children:ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>;
 const hook=renderHook(()=>[useWorksheetContext('teacher',true),useWorksheetContext('teacher',true)],{wrapper});
 await waitFor(()=>expect(hook.result.current.every(q=>q.isSuccess)).toBe(true));
 expect(mocks.action).toHaveBeenCalledExactlyOnceWith('context');
});
it('does not request context for an anonymous or inactive panel',()=>{
 const client=new QueryClient();const wrapper=({children}:{children:ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>;
 renderHook(()=>[useWorksheetContext('',true),useWorksheetContext('teacher',false)],{wrapper});
 expect(mocks.action).not.toHaveBeenCalled();
});
