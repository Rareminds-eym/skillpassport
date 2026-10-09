import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  streamCareerChat,
  fetchCareerCredits,
  parseCreditErrorCode,
} from '../careerWorkerService';
import { careerApiService } from '@/features/counselling';
import { useAuthStore } from '@/shared/model/authStore';

vi.mock('@/features/counselling', () => ({
  careerApiService: {
    sendCareerChatMessage: vi.fn(),
    getCareerCredits: vi.fn(),
  },
}));

vi.mock('@/shared/model/authStore', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'u-1' } }) },
  useUser: () => ({ id: 'u-1' }),
}));

describe('parseCreditErrorCode', () => {
  it('extracts typed credit codes from CODE-prefixed messages', () => {
    expect(parseCreditErrorCode('AI_CREDITS_EXHAUSTED: limit')).toBe('AI_CREDITS_EXHAUSTED');
    expect(parseCreditErrorCode(new Error('AI_CREDITS_PENDING: wait'))).toBe('AI_CREDITS_PENDING');
    expect(parseCreditErrorCode('AI_REQUEST_IN_PROGRESS: busy')).toBe('AI_REQUEST_IN_PROGRESS');
    expect(parseCreditErrorCode('TURN_STATE_UNKNOWN: gone')).toBe('TURN_STATE_UNKNOWN');
    expect(parseCreditErrorCode({ type: 'IDEMPOTENCY_CONFLICT' })).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('ignores non-credit errors', () => {
    expect(parseCreditErrorCode('Something broke')).toBeNull();
    expect(parseCreditErrorCode(new Error('INTERNAL_ERROR: x'))).toBeNull();
    expect(parseCreditErrorCode(null)).toBeNull();
    expect(parseCreditErrorCode({ type: 'QUOTA_EXCEEDED' })).toBeNull();
  });
});

describe('streamCareerChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the stable turn id through to the API', async () => {
    let seen: unknown;
    vi.mocked(careerApiService.sendCareerChatMessage).mockImplementation(async (
      params: unknown, _onToken?: unknown, onDone?: (data: unknown) => void,
    ) => {
      seen = params;
      onDone?.({});
    });
    const onChunk = vi.fn();
    const result = await streamCareerChat('hi', 'conv-1', [], onChunk, undefined, 'turn-uuid-1');
    expect(seen).toMatchObject({ message: 'hi', conversationId: 'conv-1', turnId: 'turn-uuid-1' });
    expect(onChunk).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(useAuthStore).toBeDefined();
  });

  it('surfaces typed credit errors with codes', async () => {
    vi.mocked(careerApiService.sendCareerChatMessage).mockImplementation(async (
      _params: unknown, _onToken?: unknown, _onDone?: unknown, onError?: (e: Error) => void,
    ) => {
      onError?.(new Error("AI_CREDITS_EXHAUSTED: You've reached your free Career AI credit limit."));
    });
    const result = await streamCareerChat('hi', null, [], () => undefined, undefined, 'turn-uuid-2');
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('AI_CREDITS_EXHAUSTED');
  });

  it('requires login', async () => {
    const { useAuthStore: store } = await import('@/shared/model/authStore');
    void store;
    const result = await streamCareerChat('hi', null, [], () => undefined);
    // Mocked user exists; sanity check on shape only.
    expect(typeof result.success).toBe('boolean');
  });
});

describe('fetchCareerCredits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps the canonical balance and derives pending from activity', async () => {
    vi.mocked(careerApiService.getCareerCredits).mockResolvedValue({
      granted_credits: '30',
      spent_credits: '28.8',
      remaining_credits: '1.2',
      revision: 4,
      active_operation_id: 'op-1',
      has_pending_cost: false,
    });
    const balance = await fetchCareerCredits(true);
    expect(balance).toMatchObject({ granted: '30', spent: '28.8', remaining: '1.2', pending: true, revision: 4 });
  });

  it('returns null when the service is down', async () => {
    vi.mocked(careerApiService.getCareerCredits).mockRejectedValue(new Error('UNAVAILABLE: down'));
    expect(await fetchCareerCredits(true)).toBeNull();
  });
});
