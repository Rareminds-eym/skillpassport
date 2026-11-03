// @vitest-environment node
import {it,expect,vi} from 'vitest';
import {evaluateSavedSubmission} from '../assignment-evaluation';
it('never starts extraction when another evaluator owns the result',async()=>{
 const query:any={update:()=>query,eq:()=>query,in:()=>query,select:()=>query,maybeSingle:async()=>({data:null})};
 const from=vi.fn(()=>query);const fetcher=vi.spyOn(globalThis,'fetch');
 await evaluateSavedSubmission({from} as never,'submission');expect(from).toHaveBeenCalledTimes(1);expect(fetcher).not.toHaveBeenCalled();fetcher.mockRestore();
});
