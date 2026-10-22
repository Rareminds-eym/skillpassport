import { describe, expect, it, vi } from 'vitest';
import { claimVideoJob, freezeVideoInput, videoIdentityHash } from '../video-job';
import { OrchestratorVideoInputSchema } from '@rareminds-eym/ai-protocol';
const jobId = '11111111-1111-4111-8111-111111111111';
const source = () => OrchestratorVideoInputSchema.parse({ jobId, transcript: 'Source', segments: [], enableQuiz: false, enableFlashcards: false,
  prompts: { summary: { id: 'seniorEducator.summarize-video.summary', version: '1.0.0', system: 'App policy', user: 'Source' },
    quotes: { id: 'seniorEducator.summarize-video.quotes', version: '1.0.0', system: 'App quotes policy', user: 'Source' } } });
describe('private video job boundary', () => {
  it('hashes equivalent JSON identities equally and distinguishes options', async () => {
    expect(await videoIdentityHash({ language: 'en', quiz: true })).toBe(await videoIdentityHash({ quiz: true, language: 'en' }));
    expect(await videoIdentityHash({ quiz: true })).not.toBe(await videoIdentityHash({ quiz: false }));
  });
  it('adopts the original frozen source after a lost acknowledgement', async () => {
    const original = source();
    const rpc = vi.fn(async () => ({ data: { input: original, hash: await videoIdentityHash(original) }, error: null }));
    expect(await freezeVideoInput({ rpc } as never, 'owner', { ...original, transcript: 'Later transcription' })).toEqual(original);
  });
  it('rejects corrupt, foreign and unconfirmed source responses', async () => {
    const original = source();
    for (const result of [{ data: { input: original, hash: '0'.repeat(64) }, error: null },
      { data: { input: { ...original, jobId: '22222222-2222-4222-8222-222222222222' }, hash: await videoIdentityHash(original) }, error: null },
      { data: null, error: { code: 'outage' } }]) {
      await expect(freezeVideoInput({ rpc: async () => result } as never, 'owner', original)).rejects.toThrow('DEPENDENCY_UNAVAILABLE');
    }
  });
  it('rejects a claim whose returned summary belongs to a different job', async () => {
    await expect(claimVideoJob({ rpc: async () => ({ data: { created: true, id: jobId,
      summary: { id: '22222222-2222-4222-8222-222222222222', processing_status: 'processing' } }, error: null }) } as never,
    'owner', 'a'.repeat(64), {})).rejects.toThrow('DEPENDENCY_UNAVAILABLE');
  });
});
