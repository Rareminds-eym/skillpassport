/**
 * Style token maps for the Course Analytics Dashboard (presentation helper).
 *
 * Centralizes Tailwind class lookups for the semantic tones/accents used across
 * cards, badges, and tables. Kept in one place so the palette stays consistent
 * and the class strings remain static (required for Tailwind's JIT scanner —
 * dynamically-built names like `bg-${x}-50` would be purged).
 *
 * Lives in `ui/` because these are pure presentation tokens, not data (`model/`)
 * or domain logic (`lib/`).
 */

import type {
  CourseTrend,
  KpiMetric,
  LearnerStatus,
  LearnerStatusSegment,
} from '@/entities/course-analytics';

/** Icon chip background/foreground classes per KPI accent. */
export const kpiAccentClasses: Record<KpiMetric['accent'], string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  rose: 'bg-rose-50 text-rose-600',
};

/** Trend label text color per KPI trend direction. */
export const kpiTrendTextClasses: Record<KpiMetric['trend'], string> = {
  up: 'text-emerald-600',
  down: 'text-rose-600',
  neutral: 'text-slate-500',
};

/** Icon color per learner-status tone (donut status rows). */
export const statusToneIconClasses: Record<LearnerStatusSegment['tone'], string> = {
  success: 'text-emerald-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
  danger: 'text-rose-500',
};

/** Percentage badge classes per learner-status tone. */
export const statusToneBadgeClasses: Record<LearnerStatusSegment['tone'], string> = {
  success: 'bg-emerald-50 text-emerald-600',
  info: 'bg-blue-50 text-blue-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-rose-50 text-rose-600',
};

/** Learner status badge config: label + color classes + dot color. */
export const learnerStatusConfig: Record<
  LearnerStatus,
  { label: string; dot: string; className: string }
> = {
  completed: {
    label: 'Completed',
    dot: 'bg-emerald-500',
    className: 'bg-emerald-50 text-emerald-700',
  },
  in_progress: {
    label: 'In Progress',
    dot: 'bg-blue-500',
    className: 'bg-blue-50 text-blue-700',
  },
  not_started: {
    label: 'Not Started',
    dot: 'bg-amber-500',
    className: 'bg-amber-50 text-amber-700',
  },
};

/** Course performance trend badge config: label + color classes + arrow. */
export const courseTrendConfig: Record<
  CourseTrend,
  { label: string; className: string; direction: 'up' | 'down' | 'flat' }
> = {
  upward: {
    label: 'Upward',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    direction: 'up',
  },
  stable: {
    label: 'Stable',
    className: 'border-slate-200 bg-white text-slate-500',
    direction: 'flat',
  },
  audit_risk: {
    label: 'Audit Risk',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    direction: 'down',
  },
};

/**
 * Progress bar fill color from a completion percentage, matching the design:
 * green (high), blue (mid), amber (low), grey (zero).
 */
export function progressFillClass(value: number): string {
  if (value >= 90) return 'bg-emerald-500';
  if (value >= 60) return 'bg-blue-500';
  if (value > 0) return 'bg-amber-500';
  return 'bg-slate-300';
}
