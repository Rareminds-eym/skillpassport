/**
 * CourseAnalyticsDashboard - the composite Course Analytics Dashboard widget.
 *
 * Assembles every section (KPI cards, enrollment chart, academic status, course
 * performance table, learner directory) into the layout from the design. This is
 * the widget's single responsibility: layout + wiring data into presentational
 * children. It is role-agnostic — the same widget serves School / College /
 * University Admin and Educator; only the `data` prop differs.
 */

import { useMemo, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { AnalyticsSkeleton } from '@/shared/ui';
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
  // Department and Academic Year nodes are pure navigation and never touch
  // this state — only selecting a Section (a leaf, `selectable: true` node)
  // sets it. `null` means "no Section chosen", in which case the Learner
  // Directory shows its full unfiltered list.
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const visibleLearners = useMemo(
    () =>
      selectedSectionId
        ? filterLearnersBySection(data.learnerDirectory, selectedSectionId)
        : data.learnerDirectory,
    [data.learnerDirectory, selectedSectionId],
  );

  // Breadcrumb label for the active Section, e.g. "Computer Science / 1st Year
  // / Section A" — purely presentational, derived from the tree + selection.
  const selectedSectionPath = useMemo(
    () =>
      selectedSectionId ? findNodePath(data.directoryTree, selectedSectionId) : null,
    [data.directoryTree, selectedSectionId],
  );

  // Auto-scroll to the Learner Directory as soon as a Section is selected in
  // the Recursive Directory Tree, via DirectoryTreePanel's onSectionApplied
  // (fired synchronously right after that panel closes itself). Deliberately
  // NOT a useEffect keyed on selectedSectionId — this callback fires exactly
  // once per genuine selection, whereas an effect on that value would also
  // (harmlessly, but redundantly) fire on unrelated re-renders that happen
  // to carry the same selectedSectionId. Identical behavior across every
  // role, since this lives once in the shared widget.
  const learnerDirectoryRef = useRef<HTMLDivElement>(null);
  const handleSectionApplied = () => {
    learnerDirectoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return <AnalyticsSkeleton className={className} />;
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Dashboard-level filters row: the Recursive Directory Filter is the
          master filter for the whole dashboard (future phases will drive KPIs,
          charts, and tables from it too), so its trigger lives here rather
          than inside any individual widget like the Learner Directory. */}
      <div className="flex justify-end">
        <DirectoryTreePanel
          tree={data.directoryTree}
          learners={data.learnerDirectory}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
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

          {/* Footer: live-feed status */}
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Active integration feed refreshes every 24 hours.
            </span>
            <span className="font-medium uppercase tracking-wide">Live System Sync Connected</span>
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
