import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({navigate: vi.fn(), read: vi.fn(), close: vi.fn()}));
vi.mock('react-router-dom', () => ({useNavigate: () => mocks.navigate}));
vi.mock('@/features/notifications', async () => ({
  assignmentNotificationTarget: (await import('@/features/notifications/model/assignmentNotificationTarget')).assignmentNotificationTarget,
  useNotifications: () => ({items:[{id:'notice',type:'assignment_allocation_complete',title:'Assignment sent',message:'Planning assigned to 2 learners.',read:false,created_at:new Date().toISOString(),metadata:{course_id:'11111111-1111-4111-8111-111111111111'}}],unreadCount:1,loading:false,markRead:mocks.read,markAllRead:vi.fn()}),
}));
import NotificationPanel from '../NotificationPanel';
afterEach(() => {cleanup(); vi.clearAllMocks();});
it('includes allocation summaries in Assignments and opens the course assignment panel', () => {
  window.history.replaceState({}, '', '/educator/dashboard');
  render(<NotificationPanel isOpen onClose={mocks.close} educatorEmail="teacher@example.test"/>);
  fireEvent.click(screen.getByRole('button',{name:/Assignments/}));
  expect(screen.getByText('Assignment sent')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Open assignment'}));
  expect(mocks.navigate).toHaveBeenCalledWith('/educator/courses/11111111-1111-4111-8111-111111111111/learn?panel=assignments');
  expect(mocks.read).toHaveBeenCalledWith('notice');
  expect(mocks.close).toHaveBeenCalledOnce();
});
