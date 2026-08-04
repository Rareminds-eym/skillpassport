/**
 * ProgressBar - value-adaptive progress indicator for the Course Analytics tables.
 *
 * The fill color adapts to the value (green / blue / amber) to match the design.
 * A widget-scoped component because the shared `Progress` uses a fixed primary
 * color and editing it would affect its existing consumers.
 */

import { cn } from '@/shared/lib/utils';
import { progressFillClass } from './styleTokens';

interface ProgressBarProps {
  /** Completion percentage, 0-100 (clamped). */
  value: number;
  className?: string;
  /** Explicit fill color class; overrides the value-based default. */
  fillClassName?: string;
}

export function ProgressBar({ value, className, fillClassName }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-all', fillClassName ?? progressFillClass(clamped))}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
