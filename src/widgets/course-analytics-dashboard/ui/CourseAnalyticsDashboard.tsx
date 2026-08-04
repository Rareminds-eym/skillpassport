/**
 * CourseAnalyticsDashboard - the composite Course Analytics Dashboard widget.
 *
 * Assembles every section (KPI cards, enrollment chart, academic status, course
 * performance table, learner directory) into the layout from the design. This is
 * the widget's single responsibility: layout + wiring data into presentational
 * children. It is role-agnostic — the same widget serves School / College /
 * University Admin and Educator; only the `data` prop differs.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  AnalyticsSkeleton,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/ui';
import { Card } from '@/shared/ui/Card';
import { cn } from '@/shared/lib/utils';
import { filterLearnersBySection, findNodePath } from '@/entities/course-analytics';
import type { CourseAnalyticsDashboardProps } from '../model/types';
import { StatCard } from './StatCard';
import { EnrollmentChart } from './EnrollmentChart';
import { AcademicStatusCard } from './AcademicStatusCard';
import { CoursePerformanceTable } from './CoursePerformanceTable';
import { LearnerDirectoryTable } from './LearnerDirectoryTable';
import { CourseFilterCombobox } from './CourseFilterCombobox';
import { DirectoryTreePanel } from './DirectoryTreePanel';

/** Small section-header used by the analytics cards. */
function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{eyebrow}</p>
      <h2 className="mt-0.5 text-base font-semibold text-slate-900">{title}</h2>
    </div>
  );
}

export function CourseAnalyticsDashboard({
  data,
  loading = false,
  className,
  selectedCourseId: controlledCourseId,
  onSelectedCourseIdChange,
  academicStatusFetching = false,
  selectedSectionId: controlledSectionId,
  onSelectedSectionChange,
  coursePerformancePage: controlledCoursePerformancePage,
  onCoursePerformancePageChange,
  coursePerformanceTotalCount = 0,
  coursePerformancePageSize = 6,
}: CourseAnalyticsDashboardProps) {
  const courseFilter = data.filters.find((f) => f.id === 'course');

  // Single source of truth for the selected course. Defaults to "all" (the
  // aggregate). Uncontrolled by default (mock lookup below); pages that fetch
  // real `get-academic-status` data pass `selectedCourseId` +
  // `onSelectedCourseIdChange` to control this instead — see the prop docs.
  const [uncontrolledCourseId, setUncontrolledCourseId] = useState(
    () => courseFilter?.options[0]?.value ?? 'all',
  );
  const isControlled = controlledCourseId !== undefined;
  const selectedCourseId = isControlled ? controlledCourseId : uncontrolledCourseId;
  const setSelectedCourseId = isControlled ? (onSelectedCourseIdChange ?? (() => {})) : setUncontrolledCourseId;

  const academicStatus = useMemo(
    () => data.academicStatusByCourse[selectedCourseId] ?? data.academicStatusByCourse.all,
    [data.academicStatusByCourse, selectedCourseId],
  );

  // Single source of truth for the Recursive Directory Tree's selection.
  // Department, Academic Year, and Section nodes are all selectable now —
  // `selectedNode` carries both the id (for the tree's own highlight state
  // and breadcrumb lookup) and level (so callers know whether to filter the
  // Learner Directory by department, academic year, or section). `null`
  // means "nothing chosen", in which case the Learner Directory shows its
  // full unfiltered list. Uncontrolled by default (mock filterLearnersBySection
  // below); pages that fetch a real `get-learner-directory` result pass
  // `selectedSectionId` + `onSelectedSectionChange` to control this instead —
  // same controlled/uncontrolled pattern already used for selectedCourseId.
  const [uncontrolledNode, setUncontrolledNode] = useState<{ id: string; level: string } | null>(null);
  const isSectionControlled = controlledSectionId !== undefined;
  const selectedSectionId = isSectionControlled ? controlledSectionId : uncontrolledNode?.id ?? null;
  const handleSelectNode = (node: { id: string; level: string } | null) => {
    if (isSectionControlled) {
      onSelectedSectionChange?.(node);
    } else {
      setUncontrolledNode(node);
    }
  };

  // Uncontrolled (mock) roles keep filtering client-side by Section only, via
  // the existing entity helper — Department/Academic Year selection has no
  // effect for them until their own backend exists, same as before this
  // change. Controlled (real-backend) roles pass already-filtered rows
  // straight through: the page's query already scoped them server-side.
  const visibleLearners = useMemo(
    () =>
      isSectionControlled
        ? data.learnerDirectory
        : selectedSectionId
          ? filterLearnersBySection(data.learnerDirectory, selectedSectionId)
          : data.learnerDirectory,
    [data.learnerDirectory, selectedSectionId, isSectionControlled],
  );

  // Breadcrumb label for the active Section, e.g. "Computer Science / 1st Year
  // / Section A" — purely presentational, derived from the tree + selection.
  const selectedSectionPath = useMemo(
    () =>
      selectedSectionId ? findNodePath(data.directoryTree, selectedSectionId) : null,
    [data.directoryTree, selectedSectionId],
  );

  // Auto-scroll to the Learner Directory once a Section selection is applied
  // AND the row data it will show is actually ready. `onSectionApplied`
  // (fired by DirectoryTreePanel right when the panel closes) only ARMS a
  // pending-scroll flag rather than scrolling immediately — for
  // uncontrolled/mock roles `data.learnerDirectory` is synchronous, so the
  // effect below fires on the very next render (same visible tick, no
  // regression from the old click-time behavior). For controlled roles
  // (e.g. College Admin), `data.learnerDirectory` comes from an async
  // useQuery in the page: scrolling at click time would land on whatever
  // was on screen before the new rows arrived, and the table's height then
  // changing when the real (or momentary mock-fallback) data swapped in
  // would leave the viewport pointed at the wrong spot. Waiting for
  // `visibleLearners` to actually change avoids that layout-shift-after-scroll
  // race without any backend or filtering changes.
  const learnerDirectoryRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef(false);
  const handleSectionApplied = () => {
    pendingScrollRef.current = true;
  };
  useEffect(() => {
    if (pendingScrollRef.current) {
      pendingScrollRef.current = false;
      learnerDirectoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Re-run whenever the actual rows change — that's the real signal that
    // the Learner Directory is ready to be scrolled to, not the click event.
  }, [visibleLearners]);

  // Single source of truth for the Course Performance Overview table's
  // current page (1-indexed). Defaults to page 1. Uncontrolled by default (no
  // pagination control renders — the original mock-only, single-page
  // behavior); pages that fetch a real, paginated `get-course-performance`
  // result pass `coursePerformancePage` + `onCoursePerformancePageChange` +
  // `coursePerformanceTotalCount` to control this instead — same
  // controlled/uncontrolled pattern already used for selectedCourseId /
  // selectedSectionId. Pagination STATE lives at the page level, not here —
  // this widget only renders the current page's rows and reports clicks
  // upward.
  const [uncontrolledCoursePerformancePage, setUncontrolledCoursePerformancePage] = useState(1);
  const isCoursePerformanceControlled = controlledCoursePerformancePage !== undefined;
  const coursePerformancePage = isCoursePerformanceControlled
    ? controlledCoursePerformancePage
    : uncontrolledCoursePerformancePage;
  const handleCoursePerformancePageChange = isCoursePerformanceControlled
    ? (onCoursePerformancePageChange ?? (() => {}))
    : setUncontrolledCoursePerformancePage;
  const coursePerformanceTotalPages = isCoursePerformanceControlled
    ? Math.max(1, Math.ceil(coursePerformanceTotalCount / coursePerformancePageSize))
    : 1;

  if (loading) {
    return <AnalyticsSkeleton className={className} />;
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Page heading: title + short description on the left, the Recursive
          Directory Filter trigger on the right — same responsive row pattern
          used by other dashboard pages (e.g. Attendance Tracking). This is
          the same role-agnostic dashboard body every page (College/School/
          University Admin, Educator) renders through, so this appears
          identically for all four roles from one change. The filter is still
          the master filter for the whole dashboard (future phases will drive
          KPIs, charts, and tables from it too); only its position moved. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Course Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track enrollment, performance, and learner progress across your courses.
          </p>
        </div>
        <DirectoryTreePanel
          tree={data.directoryTree}
          learners={data.learnerDirectory}
          selectedSectionId={selectedSectionId}
          onSelectSection={handleSelectNode}
          onSectionApplied={handleSectionApplied}
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data.kpis.map((metric) => (
          <StatCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Enrollment analytics + academic status. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col rounded-xl border-gray-200 p-6 lg:col-span-2">
          {/* Header: eyebrow + live dot, title, and a three-dot menu affordance */}
          <div className="flex items-start justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Enrollment Analytics
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-slate-900">
                Course Enrollment Overview
              </h2>
            </div>
            <MoreHorizontal className="h-5 w-5 text-slate-300" aria-hidden="true" />
          </div>

          {/* Legend: segmented rounded container below the title */}
          <div className="mt-3 inline-flex w-fit items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-200" /> Total Learners
            </span>
            <span className="h-3 w-px bg-slate-200" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> Completion Rate %
            </span>
          </div>

          {/* flex-1 + min-h-0 lets this fill the remaining card height (the card
              is stretched to match Academic Status by the grid above), while
              min-h-0 allows it to shrink correctly inside the flex column. The
              chart renders at 100% to fill whatever height this resolves to. */}
          <div className="mt-2 min-h-0 flex-1">
            <EnrollmentChart data={data.enrollment} height="100%" />
          </div>
        </Card>

        <Card className="rounded-xl border-gray-200 p-6">
          <div className="mb-4 flex items-start justify-between gap-2">
            <SectionHeader
              eyebrow="Learner Status Distribution"
              title="Academic Status & Retention"
            />
            {courseFilter && (
              <CourseFilterCombobox
                options={courseFilter.options}
                value={selectedCourseId}
                onChange={setSelectedCourseId}
              />
            )}
          </div>
          <AcademicStatusCard data={academicStatus} isFetching={academicStatusFetching} />
        </Card>
      </div>

      {/* Course performance */}
      <Card className="rounded-xl border-gray-200 p-6">
        <div className="mb-4">
          <SectionHeader eyebrow="Performance Metrics" title="Course Performance Overview" />
        </div>
        <CoursePerformanceTable rows={data.coursePerformance} />
        {isCoursePerformanceControlled && coursePerformanceTotalPages > 1 && (
          <Pagination className="mt-4 justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={coursePerformancePage <= 1}
                  className={cn(coursePerformancePage <= 1 && 'pointer-events-none opacity-50')}
                  onClick={(e) => {
                    e.preventDefault();
                    if (coursePerformancePage > 1) handleCoursePerformancePageChange(coursePerformancePage - 1);
                  }}
                />
              </PaginationItem>
              {Array.from({ length: coursePerformanceTotalPages }, (_, i) => i + 1).map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    isActive={pageNumber === coursePerformancePage}
                    onClick={(e) => {
                      e.preventDefault();
                      handleCoursePerformancePageChange(pageNumber);
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={coursePerformancePage >= coursePerformanceTotalPages}
                  className={cn(coursePerformancePage >= coursePerformanceTotalPages && 'pointer-events-none opacity-50')}
                  onClick={(e) => {
                    e.preventDefault();
                    if (coursePerformancePage < coursePerformanceTotalPages) handleCoursePerformancePageChange(coursePerformancePage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </Card>

      {/* Learner directory */}
      <Card ref={learnerDirectoryRef} className="rounded-xl border-gray-200 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Learner Directory</h2>
            {selectedSectionPath && (
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {selectedSectionPath.map((node) => node.label).join(' / ')}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs text-slate-400">
            Total Records Match: {visibleLearners.length}
          </span>
        </div>
        <LearnerDirectoryTable
          rows={visibleLearners}
          totalRecords={visibleLearners.length}
        />
      </Card>
    </div>
  );
}
