import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendMessage, getLastConversationId } from '../tutorService';
import { ssoClient } from '@/shared/api/ssoClient';
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: vi.fn() } }));
vi.mock('@/shared/api/apiUtils', () => ({ getApiUrl: () => '/api/ai-tutor' }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ info() {}, warn() {}, error() {} }) }));
const request = { turnId: '11111111-1111-4111-8111-111111111111', courseId: 'course', message: 'Explain cells' };
async function collect() { const result = []; for await (const chunk of sendMessage(request)) result.push(chunk); return result; }
const token = 'event: token\ndata: {"content":"A cell"}\n\n';
const done = 'event: done\ndata: {"conversationId":"conversation","messageId":"answer"}\n\n';
describe('tutor browser stream boundary', () => {
  beforeEach(() => vi.resetAllMocks());
  it('accepts only an explicitly committed done event and preserves the turn id', async () => {
    vi.mocked(ssoClient.fetch).mockResolvedValue(new Response(token + done));
    expect(await collect()).toMatchObject([{ type: 'content', content: 'A cell' }, { type: 'done', conversationId: 'conversation' }]);
    expect(getLastConversationId()).toBe('conversation');
    expect(JSON.parse(vi.mocked(ssoClient.fetch).mock.calls[0]![1]!.body as string).turnId).toBe(request.turnId);
  });
  it('surfaces application save errors instead of treating EOF as success', async () => {
    vi.mocked(ssoClient.fetch).mockResolvedValue(new Response(token + 'event: error\ndata: {"error":"Save requires reconciliation"}\n\n'));
    await expect(collect()).rejects.toThrow('Save requires reconciliation');
    expect(getLastConversationId()).toBeNull();
  });
  it('rejects interrupted, malformed, oversized and post-terminal responses', async () => {
    for (const text of [token, 'data: invalid\n\n', token + done + token, 'x'.repeat(128001)]) {
      vi.mocked(ssoClient.fetch).mockResolvedValue(new Response(text));
      await expect(collect()).rejects.toThrow();
    }
  });
});
