/**
 * EnrollmentChart - responsive stacked column chart for the Course Enrollment
 * Overview card.
 *
 * Thin wrapper around the project's `react-apexcharts` (no shared chart wrapper
 * exists in the codebase; charts are configured inline per page).
 *
 * Design intent: the dark "Completion Rate" reads as the filled portion nested
 * inside the light "Total Learners" column. Implemented as a single true stacked
 * column (perfectly aligned by construction — no overlay drift):
 *   - bottom segment (dark)  = completion rate
 *   - top segment   (light)  = total learners minus completion rate
 * so the full column height equals total learners and the dark base equals
 * completion. This relies on Total Learners >= Completion Rate in the data
 * (completion cannot exceed enrollment).
 */

import type { EnrollmentDatum } from '@/entities/course-analytics';
import type { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

interface EnrollmentChartProps {
  data: EnrollmentDatum[];
  /** Chart height: a px number, or a CSS value like "100%" to fill the parent. */
  height?: number | string;
}

/** Course titles in this dataset run long (e.g. full LMS course names) — truncate to keep x-axis labels on one line instead of overlapping/wrapping. The full title is still available via ApexCharts' own hover tooltip (shared: true above shows it per bar). */
const MAX_LABEL_LENGTH = 14;

function truncateLabel(label: string): string {
  return label.length > MAX_LABEL_LENGTH ? `${label.slice(0, MAX_LABEL_LENGTH - 1)}…` : label;
}

export function EnrollmentChart({ data, height = 300 }: EnrollmentChartProps) {
  // Memoized so ApexCharts only re-renders when the underlying data changes.
  const { options, series } = useMemo(() => {
    const categories = data.map((d) => truncateLabel(d.label));

    // Series order matters for stacking (first = bottom). Dark completion is the
    // nested base; the light remainder stacks on top to reach total learners.
    const chartSeries = [
      { name: 'Completion Rate %', data: data.map((d) => d.completionRate) },
      {
        name: 'Total Learners',
        data: data.map((d) => Math.max(d.totalLearners - d.completionRate, 0)),
      },
    ];

    const chartOptions: ApexOptions = {
      chart: {
        type: 'bar',
        stacked: true,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      // Colors match series order: [dark completion base, light total remainder].
      colors: ['#2563eb', '#dbeafe'],
      plotOptions: {
        bar: {
          // Narrow columns to match the reference visual weight.
          columnWidth: '26%',
          // Rounded top edge on the columns.
          borderRadius: 4,
          // Round only the outer (top) of the whole stacked column.
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
        },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
        // Trim bottom padding so bars sit closer to the x-axis labels and the
        // plot fills more of the card's vertical space.
        padding: { top: 0, right: 8, bottom: -8, left: 8 },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        // Truncated in `categories` above (long full course titles otherwise
        // overlap/wrap) — rotate:0 + trim keeps every label on one line; the
        // full title is still available via the tooltip's x.formatter below.
        labels: {
          style: { colors: '#64748b', fontSize: '12px' },
          rotate: 0,
          trim: true,
        },
      },
      yaxis: {
        // Fixed 0-100 axis, tickAmount:3 always yields exactly 4 evenly-spaced
        // gridlines: 0, 33.3, 66.7, 100. ApexCharts' y-axis formatter doesn't
        // reliably expose a tick index (its `opts` shape is undocumented for
        // this callback), so each computed value is snapped to the nearest of
        // the reference's exact labels [0, 30, 60, 100] for display.
        min: 0,
        max: 100,
        tickAmount: 3,
        labels: {
          style: { colors: '#94a3b8', fontSize: '12px' },
          formatter: (value: number) => {
            const referenceTicks = [0, 30, 60, 100];
            const nearest = referenceTicks.reduce((closest, tick) =>
              Math.abs(tick - value) < Math.abs(closest - value) ? tick : closest,
            );
            return `${nearest}%`;
          },
        },
      },
      tooltip: {
        theme: 'light',
        shared: true,
        intersect: false,
        // The x-axis category is truncated (see `categories` above) — show
        // the full, untruncated course title here instead, since the
        // tooltip has room for it.
        x: {
          formatter: (_value: number, opts?: { dataPointIndex?: number }) =>
            data[opts?.dataPointIndex ?? -1]?.label ?? '',
        },
        // Report the true values (not the derived remainder) per bar.
        y: {
          formatter: (value: number, opts) => {
            const point = data[opts?.dataPointIndex ?? -1];
            if (!point) return `${value}%`;
            return opts?.seriesIndex === 0
              ? `${point.completionRate}% completion`
              : `${point.totalLearners} total learners`;
          },
        },
      },
      // No hover recolor: keep each column strictly two-tone at all times so it
      // never appears to have a third shade.
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } },
      },
    };

    return { options: chartOptions, series: chartSeries };
  }, [data]);

  return (
    <ReactApexChart options={options} series={series} type="bar" height={height} width="100%" />
  );
}
