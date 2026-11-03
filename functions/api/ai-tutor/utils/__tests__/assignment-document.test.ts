// @vitest-environment node
import {it,expect,vi} from 'vitest';
import {validateSubmissionDocument,submissionPath,extractSubmittedDocument} from '../assignment-document';
const id='00000000-0000-4000-8000-000000000001';
it('validates signatures, rejects legacy Office and restricts storage identities',()=>{
 expect(validateSubmissionDocument('a.pdf','application/pdf',new TextEncoder().encode('%PDF-1.7')).ext).toBe('pdf');
 expect(()=>validateSubmissionDocument('a.pdf','application/pdf',new TextEncoder().encode('MZexecutable'))).toThrow();
 expect(()=>validateSubmissionDocument('a.doc','application/msword',new Uint8Array([1]))).toThrow();
 expect(()=>submissionPath('../path',id,id,id,'pdf')).toThrow();
 expect(submissionPath(id,id,id,id,'pdf')).toMatch(/^courses\/.*\/ai-assignments\/.*\/submissions\//);
});
it('uses exact uploaded text without asking a model to solve it',async()=>{
 const fetcher=vi.spyOn(globalThis,'fetch');
 expect(await extractSubmittedDocument('answer.txt',new TextEncoder().encode('1. My answer'))).toBe('1. My answer');
 expect(fetcher).not.toHaveBeenCalled();fetcher.mockRestore();
});
