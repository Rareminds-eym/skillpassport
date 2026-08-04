/**
 * CoursePerformanceTable - the "Course Performance Overview" table.
 *
 * Composes the shared Table primitives (shared/ui/table) with this design's
 * columns: rank + course, learners, active learners, a completion progress bar,
 * and a trend badge. New because no existing table matches these columns.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { BookOpen } from 'lucide-react';
import type { CoursePerformanceRow } from '@/entities/course-analytics';
import { ProgressBar } from './ProgressBar';
import { TrendBadge } from './TrendBadge';

interface CoursePerformanceTableProps {
  rows: CoursePerformanceRow[];
}

// Fixed column widths (percentages sum to 100) so every header aligns exactly
// with the cells beneath it and the grid stays identical across rows. Applied
// via <colgroup>, the only reliable way to lock column widths on a native
// <table> regardless of each row's content length.
//
// Ratios are tuned so the CONTENT anchors are evenly spaced: Trend is narrow
// (its badge is right-aligned, so extra column width would just appear as a
// gap after Completion), and the freed width nudges the numeric/completion
// columns rightward for a consistent ~220px rhythm between columns.
const COLUMN_WIDTHS = {
  course: '44%',
  learners: '14%',
  activeLearners: '14%',
  completion: '18%',
  trend: '9%',
} as const;

export function CoursePerformanceTable({ rows }: CoursePerformanceTableProps) {
  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: COLUMN_WIDTHS.course }} />
        <col style={{ width: COLUMN_WIDTHS.learners }} />
        <col style={{ width: COLUMN_WIDTHS.activeLearners }} />
        <col style={{ width: COLUMN_WIDTHS.completion }} />
        <col style={{ width: COLUMN_WIDTHS.trend }} />
      </colgroup>
      <TableHeader>
        <TableRow className="border-slate-100 hover:bg-transparent">
          <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Course
          </TableHead>
          <TableHead className="px-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            Learners
          </TableHead>
          <TableHead className="px-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            Active Learners
          </TableHead>
          <TableHead className="px-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            Completion
          </TableHead>
          <TableHead className="px-6 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            Trend
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="border-slate-100 hover:bg-slate-50/60">
            {/* Course: bordered rank badge, bare book icon, title + subtitle.
                min-w-0 + truncate let the text use the full column width and
                only ellipsize when space genuinely runs out. */}
            <TableCell className="px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-500">
                  #{row.rank}
                </span>
                <BookOpen className="h-[18px] w-[18px] shrink-0 text-slate-400" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{row.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{row.category}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="px-4 py-4 text-center text-sm font-semibold tabular-nums text-slate-800">
              {row.learners}
            </TableCell>
            <TableCell className="px-4 py-4 text-center text-sm font-semibold tabular-nums text-slate-800">
              {row.activeLearners}
            </TableCell>
            {/* Completion: percentage stacked above a thin fixed-width bar,
                centered in the column so every bar starts at the same x. */}
            <TableCell className="px-4 py-4">
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-bold tabular-nums text-slate-900">
                    {row.completion}%
                  </span>
                  <ProgressBar value={row.completion} className="h-1 w-20" />
                </div>
              </div>
            </TableCell>
            {/* Trend: right-aligned badges (hugging the table's right edge to
                avoid trailing dead space) with a consistent minimum width so
                every badge starts at the same x regardless of label length. */}
            <TableCell className="px-4 py-4">
              <div className="flex justify-end">
                <TrendBadge trend={row.trend} className="min-w-[80px] justify-center" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
