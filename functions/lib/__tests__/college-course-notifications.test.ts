import { describe, expect, it, vi } from 'vitest';
import { publishCollegeCourseNotifications } from '../college-course-notifications';
import { notifyRealtime } from '../realtime';
vi.mock('../realtime', () => ({ notifyRealtime: vi.fn().mockResolvedValue(undefined) }));

describe('curriculum notification broadcast', () => {
  it('broadcasts only the saved rows for the request and event', async () => {
    const rows = [{ id: 'notification', recipient_id: 'admin' }];
    const filter = vi.fn().mockResolvedValue({ data: rows, error: null });
    const request = vi.fn().mockReturnValue({ eq: filter });
    const db = { from: vi.fn().mockReturnValue({ select: () => ({ eq: request }) }) };
    await publishCollegeCourseNotifications(db as never, {}, 'proposal', 'curriculum_change_submitted');
    expect(request).toHaveBeenCalledWith('curriculum_change_id', 'proposal');
    expect(filter).toHaveBeenCalledWith('type', 'curriculum_change_submitted');
    expect(notifyRealtime).toHaveBeenCalledWith({}, 'notifications', 'INSERT', rows[0]);
  });
  it('does not fail the successful submission if broadcast lookup fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const db = { from: () => ({ select: () => ({ eq: () => ({ eq: async () => ({ error: new Error('offline') }) }) }) }) };
    await expect(publishCollegeCourseNotifications(db as never, {}, 'proposal', 'curriculum_change_submitted')).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
