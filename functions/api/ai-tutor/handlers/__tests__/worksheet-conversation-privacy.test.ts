// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), eq: vi.fn() }));
vi.mock('../../../../lib/auth', () => ({ withAuth: (handler: unknown) => handler, getContextUser: () => ({ id: 'signed-in-user' }) }));
vi.mock('../../../../lib/supabase', () => ({ getServiceClient: () => ({ from: mocks.from }) }));
import { onRequestPost } from '../actions';
describe('worksheet source conversation privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const query: Record<string, unknown> = {};
    for (const method of ['select', 'delete']) query[method] = vi.fn(() => query);
    mocks.eq.mockImplementation(() => query); query.eq = mocks.eq;
    query.order = vi.fn().mockResolvedValue({ data: [], error: null });
    query.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    mocks.from.mockReturnValue(query);
  });
  it.each(['get-conversations', 'get-conversation', 'delete-conversation'])('%s scopes source material to its owner', async action => {
    await onRequestPost({ request: new Request('https://test/api/ai-tutor/actions', { method: 'POST', body: JSON.stringify({ action, course_id: 'course', id: 'conversation' }) }), env: {} } as never);
    expect(mocks.eq).toHaveBeenCalledWith('learner_id', 'signed-in-user');
    if (action === 'delete-conversation') expect(mocks.from).not.toHaveBeenCalledWith('tutor_feedback');
  });
});
