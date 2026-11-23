// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { broadcastAssignmentNotifications } from '../assignment-notifications';
vi.mock('../../../../lib/realtime', () => ({ notifyRealtime: vi.fn() }));
import { notifyRealtime } from '../../../../lib/realtime';

it('broadcasts only committed rows scoped to the event and request time', async () => {
  const row = { id: 'notification', recipient_id: 'learner' };
  const query: any = { select: vi.fn(() => query), contains: vi.fn(() => query), gte: vi.fn(async () => ({data: [row]})) };
  await broadcastAssignmentNotifications({from: () => query} as never, {}, 'submission_id', 'submission', 'start');
  expect(query.contains).toHaveBeenCalledWith('metadata', {submission_id: 'submission'});
  expect(query.gte).toHaveBeenCalledWith('created_at', 'start');
  expect(notifyRealtime).toHaveBeenCalledWith({}, 'notifications', 'INSERT', row);
});
it('does not fail a saved submission when realtime lookup is unavailable', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await expect(broadcastAssignmentNotifications({from: () => {throw new Error('offline');}} as never, {}, 'assignment_id', 'assignment', 'start')).resolves.toBeUndefined();
  warning.mockRestore();
});
