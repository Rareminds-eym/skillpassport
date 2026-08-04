/**
 * StatCard - a single KPI summary card (Total Learners, LMS Courses, etc.).
 *
 * Renders an icon chip, title, large value, and a free-form trend line, matching
 * the top row of the dashboard.
 *
 * Widget-scoped rather than reusing `features/analytics/KPICard`: that card renders
 * the trend as a numeric percentage with a fixed "vs last period" suffix, whereas
 * this design needs free-form trend labels ("4 new this quarter", "88% of total
 * learners active") and a different layout. Extending the shared KPICard (used by
 * ~13 pages) would risk those consumers.
 */

import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { cn } from '@/shared/lib/utils';
import type { KpiMetric } from '@/entities/course-analytics';
import { resolveKpiIcon } from './iconMaps';
import { kpiAccentClasses, kpiTrendTextClasses } from './styleTokens';

interface StatCardProps {
  metric: KpiMetric;
  className?: string;
}

export function StatCard({ metric, className }: StatCardProps) {
  const Icon = resolveKpiIcon(metric.icon);
  // Direction arrow: up/down only; neutral trends show no arrow.
  const TrendArrow =
    metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : null;

  return (
    <Card
      className={cn(
        'flex flex-col rounded-xl border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      {/* Icon chip + title on one row */}
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            kpiAccentClasses[metric.accent],
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <p className="text-[13px] font-medium leading-tight text-slate-500">{metric.title}</p>
      </div>

      {/* Value */}
      <p className="mt-3 text-[26px] font-bold leading-none tracking-tight text-slate-900">
        {metric.value}
      </p>

      {/* Trend */}
      <p
        className={cn(
          'mt-3 flex items-center gap-1 text-xs font-medium',
          kpiTrendTextClasses[metric.trend],
        )}
      >
        {TrendArrow && <TrendArrow className="h-3.5 w-3.5" aria-hidden="true" />}
        {metric.trendLabel}
      </p>
    </Card>
  );
}
