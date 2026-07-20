/**
 * LearnerDirectoryTable - the "Learner Directory" table with pagination.
 *
 * Composes shared primitives (Table, Avatar, Pagination) plus the shared
 * `getPageNumbers` util and `getInitials` formatter. Column widths are locked
 * via <colgroup> (same approach as CoursePerformanceTable) so every header
 * aligns exactly with its cells regardless of row content.
 *
 * Pagination pages are derived from `totalRecords` (as the real API will
 * report them), so the pager renders 1..N like the approved design even while
 * the mock dataset only covers page 1; out-of-range pages show an empty state.
 */

import { useEffect, useState } from 'react';
import { ArrowUpDown, BookOpen, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/shared/ui/Pagination';
import { getPageNumbers } from '@/shared/lib/pagination';
import { getInitials } from '@/shared/lib';
import { cn } from '@/shared/lib/utils';
import type { LearnerDirectoryRow } from '@/entities/course-analytics';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';

interface LearnerDirectoryTableProps {
  /** Rows for the currently active filter (e.g. all learners, or one Section). */
  rows: LearnerDirectoryRow[];
  /** Count of `rows` (drives the count label and page count; caller-supplied
   * so a future API can report a server-side total independent of the page
   * of rows actually returned). */
  totalRecords: number;
  /** Rows shown per page. */
  pageSize?: number;
}

// Locked column grid (sums to 100) so headers and cells always align.
const COLUMN_WIDTHS = {
  learner: '22%',
  course: '15%',
  progress: '20%',
  status: '12%',
  lastActive: '12%',
  lastCourse: '19%',
} as const;

/** Header label with the design's decorative sort glyph (no sorting yet). */
function SortableHead({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      <ArrowUpDown className="h-3 w-3 shrink-0 text-slate-300" aria-hidden="true" />
    </span>
  );
}

export function LearnerDirectoryTable({
  rows,
  totalRecords,
  pageSize = 8,
}: LearnerDirectoryTableProps) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the row set changes (e.g. a Directory Tree
  // Section selection narrows or replaces the list) — otherwise a stale page
  // number could point past the end of a smaller filtered set.
  useEffect(() => {
    setPage(1);
  }, [rows]);

  // Page count reflects the full record set (mirrors future API paging).
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  const pageNumbers = getPageNumbers(page, totalPages);

  const goTo = (next: number) => setPage(Math.min(Math.max(next, 1), totalPages));

  const headerCellClass =
    'h-11 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400';

  return (
    <div className="flex flex-col gap-4">
      <Table className="table-fixed">
        <colgroup>
          <col style={{ width: COLUMN_WIDTHS.learner }} />
          <col style={{ width: COLUMN_WIDTHS.course }} />
          <col style={{ width: COLUMN_WIDTHS.progress }} />
          <col style={{ width: COLUMN_WIDTHS.status }} />
          <col style={{ width: COLUMN_WIDTHS.lastActive }} />
          <col style={{ width: COLUMN_WIDTHS.lastCourse }} />
        </colgroup>

        <TableHeader>
          <TableRow className="border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead className={headerCellClass}>
              <SortableHead label="Learner Details" />
            </TableHead>
            <TableHead className={headerCellClass}>
              <SortableHead label="Enrolled Course" />
            </TableHead>
            <TableHead className={headerCellClass}>
              <SortableHead label="Progress Index" />
            </TableHead>
            <TableHead className={headerCellClass}>Status</TableHead>
            <TableHead className={headerCellClass}>
              <SortableHead label="Last Active" />
            </TableHead>
            <TableHead className={headerCellClass}>Last Course Learned</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {pageRows.map((row) => (
            <TableRow key={row.id} className="border-slate-100 hover:bg-slate-50/60">
              {/* Learner: avatar + name + email */}
              <TableCell className="px-4 py-4">
                <div className="flex items-center gap-3.5">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-indigo-50 text-sm font-semibold text-indigo-600">
                      {getInitials(row.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{row.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{row.email}</p>
                  </div>
                </div>
              </TableCell>

              {/* Enrolled course code chip */}
              <TableCell className="px-4 py-4">
                <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-600">
                  {row.courseCode}
                </span>
              </TableCell>

              {/* Progress: "% complete" + hours on one line, bar below — all
                  inside one fixed-width block so text and bar edges align. */}
              <TableCell className="px-4 py-4">
                <div className="w-44 max-w-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      {row.progress}% complete
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {row.hours} hrs
                    </span>
                  </div>
                  <ProgressBar value={row.progress} className="mt-1.5 w-full" />
                </div>
              </TableCell>

              <TableCell className="px-4 py-4">
                <StatusBadge status={row.status} />
              </TableCell>

              <TableCell className="px-4 py-4 text-sm text-slate-500">{row.lastActive}</TableCell>

              <TableCell className="px-4 py-4">
                <div className="flex min-w-0 items-center gap-2">
                  <BookOpen className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                  <span className="truncate text-sm text-slate-600">{row.lastCourseLearned}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {/* Pages beyond the loaded mock data render an explicit empty state
              instead of a silently blank body. */}
          {pageRows.length === 0 && (
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                No learners to display on this page.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Footer: record count + compact chevron pagination */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-xs text-slate-400">
          Showing {pageRows.length === 0 ? 0 : start + 1} to{' '}
          {pageRows.length === 0 ? 0 : start + pageRows.length} of {totalRecords} entries
        </p>

        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent className="gap-1.5">
            <PaginationItem>
              <PaginationLink
                href="#"
                aria-label="Go to previous page"
                aria-disabled={page === 1}
                className={cn('h-9 w-9', page === 1 && 'pointer-events-none opacity-40')}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(page - 1);
                }}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </PaginationLink>
            </PaginationItem>

            {pageNumbers.map((p, index) =>
              typeof p === 'number' ? (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    className="h-9 w-9 text-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(p);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={`ellipsis-${index}`}>
                  <span className="px-2 text-slate-400">…</span>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationLink
                href="#"
                aria-label="Go to next page"
                aria-disabled={page === totalPages}
                className={cn('h-9 w-9', page === totalPages && 'pointer-events-none opacity-40')}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(page + 1);
                }}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
