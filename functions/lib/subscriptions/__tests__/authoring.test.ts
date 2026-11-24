import { describe, expect, it, vi } from 'vitest';
import { DraftRequestError, readDraftRequest } from '../authoring';

function streamed(chunks: Uint8Array[], cancel = vi.fn()) {
  let index = 0;
  return new Request('https://admin.example.invalid/api/admin/subscriptions/authoring/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
    body: new ReadableStream({ pull(controller) { if (index < chunks.length) controller.enqueue(chunks[index++]); else controller.close(); }, cancel }),
    duplex: 'half',
  } as RequestInit);
}

describe('bounded draft request reader', () => {
  it('decodes valid UTF-8 split across transport chunks', async () => {
    const bytes = new TextEncoder().encode('{"name":"₹"}');
    expect(await readDraftRequest(streamed([bytes.slice(0, 10), bytes.slice(10, 11), bytes.slice(11)]))).toEqual({ name: '₹' });
  });
  it('cancels an oversized stream and rejects instead of parsing a partial prefix', async () => {
    const cancel = vi.fn();
    await expect(readDraftRequest(streamed([new Uint8Array(262144), new Uint8Array(1), new Uint8Array(1)], cancel)))
      .rejects.toMatchObject({ status: 413 }); expect(cancel).toHaveBeenCalledTimes(1);
  });
  it('rejects malformed UTF-8 instead of replacing bytes', async () => {
    await expect(readDraftRequest(streamed([new Uint8Array([123, 34, 120, 34, 58, 34, 255, 34, 125])])))
      .rejects.toBeInstanceOf(DraftRequestError);
  });
  it('accepts valid JSON at the exact byte budget', async () => {
    const bytes = new TextEncoder().encode('{}' + ' '.repeat(262142));
    expect(await readDraftRequest(streamed([bytes]))).toEqual({});
  });
  it('propagates a transport read failure instead of substituting an empty request', async () => {
    const error = new Error('Synthetic stream failure');
    const request = new Request('https://admin.example.invalid', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: new ReadableStream({ start(controller) { controller.error(error); } }), duplex: 'half' } as RequestInit);
    await expect(readDraftRequest(request)).rejects.toBe(error);
  });
});
