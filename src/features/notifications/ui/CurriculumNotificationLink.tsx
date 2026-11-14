import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export function CurriculumNotificationLink({ notification, markRead, onClose }: {
  notification: { id: string; type: string; action_url?: string | null; read: boolean };
  markRead: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const submitted = notification.type === 'curriculum_change_submitted';
  const decision = ['curriculum_change_approved', 'curriculum_change_rejected'].includes(notification.type);
  const path = submitted ? '/college-admin/academics/curriculum?' : '/educator/browse-courses?';
  if ((!submitted && !decision) || !notification.action_url?.startsWith(path)) return null;
  return <Link to={notification.action_url} className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-sm !border-0 !bg-transparent !p-0 !text-sm !font-medium !text-indigo-700 !shadow-none underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    onClick={() => {
      if (!notification.read) void markRead(notification.id).catch(() => console.error('Could not mark curriculum notification as read.'));
      onClose();
    }}>{submitted ? 'Review change' : 'View review decision'}<ArrowRightIcon aria-hidden="true" className="h-3.5 w-3.5" /></Link>;
}
