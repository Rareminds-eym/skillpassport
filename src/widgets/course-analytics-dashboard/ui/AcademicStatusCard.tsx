/**
 * AcademicStatusCard - the right-hand "Learner Status Distribution" card.
 *
 * Composes a donut chart (with the active-set total in its center), an Active
 * Learning Index callout, and one status row per learner segment. New composite:
 * no existing component matches this layout.
 */

import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { cn } from '@/shared/lib/utils';
import type { AcademicStatusOverview } from '@/entities/course-analytics';
import { resolveStatusIcon } from './iconMaps';
import { statusToneBadgeClasses, statusToneIconClasses } from './styleTokens';

interface AcademicStatusCardProps {
  data: AcademicStatusOverview;
  /**
   * True while a background refetch (e.g. switching the course dropdown) is
   * in flight and `data` is still the previous course's result (via
   * placeholderData: keepPreviousData in the page). Dims the card slightly
   * instead of unmounting it, so the previous real values stay visible with
   * no flash of mock/empty state.
   */
  isFetching?: boolean;
}

export function AcademicStatusCard({ data, isFetching = false }: AcademicStatusCardProps) {
  const { activeSet, activeLearningIndex, segments } = data;

  // Memoized donut config; recomputes only when segments change.
  const { options, series } = useMemo(() => {
    const chartSeries = segments.map((s) => s.percentage);

    const chartOptions: ApexOptions = {
      chart: { type: 'donut', fontFamily: 'inherit' },
      labels: segments.map((s) => s.label),
      colors: segments.map((s) => s.color),
      stroke: { width: 2, colors: ['#ffffff'] },
      legend: { show: false },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              value: {
                fontSize: '24px',
                fontWeight: 700,
                color: '#0f172a',
                offsetY: 4,
              },
              total: {
                show: true,
                showAlways: true,
                label: 'ACTIVE SET',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                // Center number: the active-set total rather than a sum of %.
                formatter: () => activeSet.toLocaleString(),
              },
            },
          },
        },
      },
      tooltip: { theme: 'light', y: { formatter: (val: number) => `${val}%` } },
    };

    return { options: chartOptions, series: chartSeries };
  }, [segments, activeSet]);

  return (
    <div
      className={cn('flex flex-col gap-6 transition-opacity', isFetching && 'opacity-60')}
      aria-busy={isFetching ? 'true' : 'false'}
    >
      {/* Donut + Active Learning Index */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="w-40 shrink-0">
          <ReactApexChart options={options} series={series} type="donut" width="100%" />
        </div>
        <div className="flex-1 rounded-xl bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Active Learning Index
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{activeLearningIndex}%</p>
          <p className="mt-1 text-xs text-slate-500">Combined complete &amp; current activities.</p>
        </div>
      </div>

      {/* Status rows */}
      <ul className="flex flex-col gap-3">
        {segments.map((segment) => {
          const Icon = resolveStatusIcon(segment.icon);
          return (
            <li
              key={segment.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
            >
              <Icon
                className={cn('h-5 w-5 shrink-0', statusToneIconClasses[segment.tone])}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{segment.label}</p>
                <p className="truncate text-xs text-slate-400">{segment.description}</p>
              </div>
              <span className="text-sm font-semibold text-slate-900">{segment.count}</span>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-xs font-medium',
                  statusToneBadgeClasses[segment.tone],
                )}
              >
                {segment.percentage}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
