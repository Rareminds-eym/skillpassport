/**
 * TrendBadge - course performance trend pill (Upward / Stable / Audit Risk).
 *
 * Renders a directional arrow icon plus label, colored per trend, matching the
 * "Trend" column of the Course Performance Overview table. No shared trend-badge
 * component exists in the codebase, so this is a new widget-scoped primitive.
 */

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { CourseTrend } from '@/entities/course-analytics';
import { courseTrendConfig } from './styleTokens';

interface TrendBadgeProps {
  trend: CourseTrend;
  className?: string;
}

const directionIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

export function TrendBadge({ trend, className }: TrendBadgeProps) {
  const config = courseTrendConfig[trend];
  const Icon = directionIcon[config.direction];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium',
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}
