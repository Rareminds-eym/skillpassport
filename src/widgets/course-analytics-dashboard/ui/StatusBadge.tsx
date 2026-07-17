/**
 * StatusBadge - learner lifecycle status pill (Completed / In Progress / Not Started).
 *
 * Widget-scoped: the shared `shared/ui/StatusBadge` is hardcoded to
 * verified/approved/pending/rejected, so a separate component avoids changing a
 * shared element used by other features.
 */

import { cn } from '@/shared/lib/utils';
import type { LearnerStatus } from '@/entities/course-analytics';
import { learnerStatusConfig } from './styleTokens';

interface StatusBadgeProps {
  status: LearnerStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = learnerStatusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.className,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} aria-hidden="true" />
      {config.label}
    </span>
  );
}
