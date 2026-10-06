import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import type { ReactElement } from "react";
import type { ReviewStatus } from "../api/reviews";
import { STATUS_META } from "./reviewPresentation";

const TONE: Record<string, string> = {
  amber: "bg-amber-50 text-amber-900 ring-amber-200",
  sky: "bg-sky-50 text-sky-900 ring-sky-200",
  indigo: "bg-indigo-50 text-indigo-900 ring-indigo-200",
  green: "bg-green-50 text-green-900 ring-green-200",
  orange: "bg-orange-50 text-orange-900 ring-orange-200",
};
const ICON: Record<ReviewStatus, ReactElement> = {
  unassigned: <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />,
  pending: <UserIcon className="h-4 w-4" aria-hidden="true" />,
  in_progress: <ClockIcon className="h-4 w-4" aria-hidden="true" />,
  completed: <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />,
  returned: <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />,
};

/** Status is conveyed by icon + text, never colour alone. */
export default function ReviewStatusBadge({
  status,
  overdue,
}: {
  status: ReviewStatus;
  overdue?: boolean;
}) {
  const meta = STATUS_META[status];
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONE[meta.tone]}`}
      >
        {ICON[status]}
        {meta.label}
      </span>
      {overdue && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-900 ring-1 ring-inset ring-red-200">
          <ClockIcon className="h-4 w-4" aria-hidden="true" />
          Overdue
        </span>
      )}
    </span>
  );
}
