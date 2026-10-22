import { useId, useState, type ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  MapPinIcon,
  PencilIcon,
  RocketLaunchIcon,
  SparklesIcon,
  TrashIcon,
  UserGroupIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import type { Opportunity } from "../Requisitions";
import { ActionButton } from "../shared/RecruitmentControls";
import { formatSalary } from "./RequisitionDialogs";

interface RequisitionCardProps {
  requisition: Opportunity;
  busy: boolean;
  permissions: {
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  onView: (job: Opportunity) => void;
  onEdit: (job: Opportunity) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void | Promise<void>;
  onViewApplications: (job: Opportunity) => void;
  onBoost: (job: Opportunity) => void;
  onGenerateShortlist: (job: Opportunity) => void;
  getStatusBadge: (status: string) => string;
  getStatusIcon: (status: string) => ReactNode;
}

const menuItem =
  "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50";
const count = (value: number | undefined) =>
  Number.isFinite(value) ? Math.max(0, value!) : 0;

export function RequisitionCard({
  requisition: job,
  busy,
  permissions,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onViewApplications,
  onBoost,
  onGenerateShortlist,
  getStatusBadge,
  getStatusIcon,
}: RequisitionCardProps) {
  const headingId = useId();
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const title = job.job_title || job.title || "Untitled requisition";
  const company = job.company_name?.trim() || "Company not specified";
  const initials = (
    company.includes(" ")
      ? company
          .split(/\s+/)
          .map((word) => word[0])
          .join("")
      : company
  )
    .slice(0, 2)
    .toUpperCase();
  const applications = count(job.applications_count);
  const views = count(job.views_count);
  const posted = new Date(job.posted_date || job.created_at);
  const hasDate = !Number.isNaN(posted.getTime());
  const formattedDate = hasDate
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(posted)
    : null;
  const activeUntil = (date?: string) =>
    !!date && new Date(date).getTime() > Date.now();
  const level = job.experience_level
    ? `${job.experience_level}${/level$/i.test(job.experience_level) ? "" : " level"}`
    : "Not specified";
  const editReason = busy
    ? "An update is in progress"
    : !permissions.edit
      ? "You do not have permission to edit this requisition"
      : undefined;
  const deleteReason = busy
    ? "An update is in progress"
    : !permissions.delete
      ? "Deleting requisitions requires an organization administrator"
      : undefined;

  return (
    <article
      aria-labelledby={headingId}
      aria-busy={busy}
      className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-slate-300 hover:shadow-md motion-reduce:transition-none"
    >
      <div className="flex flex-1 flex-col p-4 pb-3">
        <header className="flex items-start gap-2 text-xs leading-5">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-blue-100 bg-blue-50 text-sm font-semibold tracking-tight text-blue-800"
          >
            {job.company_logo && failedLogo !== job.company_logo ? (
              <img
                src={job.company_logo}
                alt=""
                className="h-full w-full bg-white object-contain p-1"
                onError={() => setFailedLogo(job.company_logo!)}
              />
            ) : job.company_name?.trim() ? (
              initials
            ) : (
              <BriefcaseIcon className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3
              id={headingId}
              className="line-clamp-2 break-words text-base font-semibold leading-6 tracking-tight text-slate-950"
            >
              {title}
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-600">
              <span className="break-words font-medium text-slate-700">
                {company}
              </span>
              {job.department && (
                <>
                  <span aria-hidden="true" className="text-slate-400">
                    /
                  </span>
                  <span className="break-words">{job.department}</span>
                </>
              )}
            </p>
          </div>
          <Tooltip.Provider delayDuration={150}>
            <DropdownMenu.Root>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      aria-label={`More actions for ${title}`}
                      disabled={busy}
                      className="-mr-1.5 -mt-1.5 flex h-11 w-11 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      <EllipsisVerticalIcon
                        aria-hidden="true"
                        className="h-5 w-5"
                      />
                    </button>
                  </DropdownMenu.Trigger>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    sideOffset={5}
                    className="z-[80] rounded-md bg-slate-950 px-3 py-2 text-xs text-white shadow-lg"
                  >
                    More actions
                    <Tooltip.Arrow className="fill-slate-950" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  collisionPadding={12}
                  aria-label={`Actions for ${title}`}
                  className="z-50 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                >
                  <DropdownMenu.Label className="px-3 py-2 text-[11px] font-medium text-slate-600">
                    Opening status
                  </DropdownMenu.Label>
                  {job.status === "draft" && (
                    <DropdownMenu.Item
                      disabled={busy || !permissions.edit}
                      className={menuItem}
                      onSelect={() => void onStatusChange(job.id, "open")}
                    >
                      <CheckCircleIcon aria-hidden="true" className="h-4 w-4" />
                      Publish opening
                    </DropdownMenu.Item>
                  )}
                  {job.status === "open" && (
                    <>
                      <DropdownMenu.Item
                        disabled={busy || !permissions.edit}
                        className={menuItem}
                        onSelect={() => void onStatusChange(job.id, "on_hold")}
                      >
                        <ClockIcon aria-hidden="true" className="h-4 w-4" />
                        Put on hold
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        disabled={busy || !permissions.edit}
                        className={menuItem}
                        onSelect={() => void onStatusChange(job.id, "closed")}
                      >
                        <XCircleIcon aria-hidden="true" className="h-4 w-4" />
                        Close opening
                      </DropdownMenu.Item>
                    </>
                  )}
                  {(job.status === "closed" || job.status === "on_hold") && (
                    <DropdownMenu.Item
                      disabled={busy || !permissions.edit}
                      className={menuItem}
                      onSelect={() => void onStatusChange(job.id, "open")}
                    >
                      <CheckCircleIcon aria-hidden="true" className="h-4 w-4" />
                      {job.status === "on_hold"
                        ? "Resume opening"
                        : "Reopen opening"}
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
                  <DropdownMenu.Label className="px-3 py-2 text-[11px] font-medium text-slate-600">
                    Promotion & discovery
                  </DropdownMenu.Label>
                  {job.status === "open" && (
                    <DropdownMenu.Item
                      disabled={busy}
                      className={menuItem}
                      onSelect={() => onBoost(job)}
                    >
                      <RocketLaunchIcon
                        aria-hidden="true"
                        className="h-4 w-4"
                      />
                      Boost job{" "}
                      <span className="ml-auto text-xs text-slate-500">
                        1 credit
                      </span>
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Item
                    disabled={busy}
                    className={menuItem}
                    onSelect={() => onGenerateShortlist(job)}
                  >
                    <SparklesIcon aria-hidden="true" className="h-4 w-4" />
                    Generate AI Shortlist
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </Tooltip.Provider>
        </header>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${getStatusBadge(job.status)}`}
          >
            <span aria-hidden="true">{getStatusIcon(job.status)}</span>
            <span className="capitalize">
              {job.status?.replace("_", " ") || "Unknown"}
            </span>
          </span>
          {job.mode && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-700">
              {job.mode}
            </span>
          )}
          {activeUntil(job.boosted_until) && (
            <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-800">
              <RocketLaunchIcon aria-hidden="true" className="h-3.5 w-3.5" />
              Boosted
            </span>
          )}
          {activeUntil(job.featured_until) && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              <SparklesIcon aria-hidden="true" className="h-3.5 w-3.5" />
              Featured
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-slate-600">
          <p className="flex items-start gap-2 text-xs leading-5">
            <MapPinIcon
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
            />
            <span className="min-w-0 break-words">
              {job.location || "Location not specified"}
            </span>
          </p>
          <p className="flex items-start gap-2 text-xs leading-5">
            <BriefcaseIcon
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
            />
            <span>
              {job.employment_type || "Employment type not specified"}
            </span>
          </p>
        </div>

        <dl className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
          <div className="min-w-0">
            <dt className="text-[11px] font-medium text-slate-600">
              Salary range
            </dt>
            <dd
              className={`mt-0.5 break-words text-[13px] font-semibold leading-5 tracking-tight ${job.salary_range_min == null && job.salary_range_max == null ? "text-slate-600" : "text-slate-900"}`}
            >
              {formatSalary(job)}
            </dd>
          </div>
          <div className="min-w-0 border-l border-slate-200 pl-3">
            <dt className="text-[11px] font-medium text-slate-600">
              Experience
            </dt>
            <dd className="mt-0.5 text-[13px] font-medium leading-5 text-slate-800">
              {level}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarIcon aria-hidden="true" className="h-3.5 w-3.5" />
            {hasDate ? (
              <time dateTime={posted.toISOString()}>
                Posted {formattedDate}
              </time>
            ) : (
              "Posting date unavailable"
            )}
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <EyeIcon aria-hidden="true" className="h-4 w-4" />
            <span className="tabular-nums">
              {views.toLocaleString("en-IN")} {views === 1 ? "view" : "views"}
            </span>
          </p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 rounded-b-xl border-t border-slate-100 bg-slate-50/50 px-4 py-2">
        <button
          type="button"
          onClick={() => onViewApplications(job)}
          aria-label={`View ${applications} ${applications === 1 ? "application" : "applications"} for ${title}`}
          className="group inline-flex min-h-11 sm:min-h-9 items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-2 text-xs text-blue-800 outline-none transition-colors hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <UserGroupIcon aria-hidden="true" className="h-4 w-4" />
          <span>
            <span className="font-semibold tabular-nums">
              {applications.toLocaleString("en-IN")}
            </span>{" "}
            {applications === 1 ? "application" : "applications"}
          </span>
          <ArrowRightIcon aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <div
          className="ml-auto flex items-center gap-1.5"
          role="group"
          aria-label={`Actions for ${title}`}
        >
          <ActionButton
            compact
            label={`View ${title}`}
            icon={EyeIcon}
            onClick={() => onView(job)}
          />
          <ActionButton
            compact
            label={`Edit ${title}`}
            icon={PencilIcon}
            onClick={() => onEdit(job)}
            disabled={busy || !permissions.edit}
            explanation={editReason}
          />
          <ActionButton
            compact
            label={`Delete ${title}`}
            icon={TrashIcon}
            onClick={() => onDelete(job.id)}
            disabled={busy || !permissions.delete}
            danger
            explanation={deleteReason}
          />
        </div>
      </footer>
    </article>
  );
}
