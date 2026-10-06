import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { fetchReviewOverview, type AdminReview, type ReviewView } from "../api/reviews";
import ReviewDetailDrawer from "./ReviewDetailDrawer";
import ReviewStatusBadge from "./ReviewStatusBadge";
import {
  artifactLabel,
  duration,
  pageRange,
  reasonText,
  timingFor,
  VIEW_LABELS,
} from "./reviewPresentation";

export interface BoardQuery {
  view: ReviewView;
  q: string;
  page: number;
}

const KPI: Array<{ view: ReviewView; key: "total" | "unassigned" | "overdue" | "active" | "completed" | "returned"; hint: string }> = [
  { view: "all", key: "total", hint: "Every review in your organization" },
  { view: "unassigned", key: "unassigned", hint: "Waiting for you to assign an educator" },
  { view: "overdue", key: "overdue", hint: "Past the due date" },
  { view: "active", key: "active", hint: "An educator is on it" },
  { view: "completed", key: "completed", hint: "Passed" },
  { view: "returned", key: "returned", hint: "Sent back to the learner" },
];

const URGENCY_TEXT = {
  late: "text-red-700 font-semibold",
  soon: "text-amber-800 font-medium",
  normal: "text-slate-600",
  done: "text-slate-600",
} as const;

export default function ReviewsBoard({
  userId,
  query,
  onQuery,
}: {
  userId: string | undefined;
  query: BoardQuery;
  onQuery: (next: Partial<BoardQuery>) => void;
}) {
  const [text, setText] = useState(query.q);
  const [opened, setOpened] = useState<AdminReview | null>(null);
  const [notice, setNotice] = useState("");
  const opener = useRef<HTMLElement | null>(null);

  const overview = useQuery({
    queryKey: ["admin-review-overview", userId, query.view, query.q, query.page],
    queryFn: () => fetchReviewOverview(query),
    enabled: !!userId,
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });

  // Debounced search: typing never fires a request per keystroke.
  useEffect(() => {
    if (text.trim() === query.q) return;
    const timer = setTimeout(() => onQuery({ q: text.trim(), page: 1 }), 300);
    return () => clearTimeout(timer);
  }, [text, query.q, onQuery]);
  useEffect(() => setText(query.q), [query.q]);

  const data = overview.data;
  const stats = data?.stats;
  const filtered = query.view !== "all" || query.q !== "";
  const open = (review: AdminReview, trigger: HTMLElement) => {
    opener.current = trigger;
    setNotice("");
    setOpened(review);
  };
  const close = () => {
    setOpened(null);
    // Give focus back to where the administrator was.
    setTimeout(() => opener.current?.focus(), 0);
  };

  return (
    <div className="space-y-5">
      {notice && (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-900 ring-1 ring-green-200">
          {notice}
        </p>
      )}

      {stats && (stats.unassigned > 0 || stats.overdue > 0) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="flex-1">
            {stats.unassigned > 0 && (
              <>
                <strong>{stats.unassigned}</strong> review{stats.unassigned === 1 ? "" : "s"} need an educator
                {stats.oldestUnassignedAt && (
                  <> (the oldest has waited {duration(Date.now() - Date.parse(stats.oldestUnassignedAt))})</>
                )}
                .{" "}
              </>
            )}
            {stats.overdue > 0 && (
              <>
                <strong>{stats.overdue}</strong> {stats.overdue === 1 ? "is" : "are"} overdue.
              </>
            )}
          </p>
          <div className="flex gap-2">
            {stats.unassigned > 0 && (
              <button type="button" className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white" onClick={() => onQuery({ view: "unassigned", page: 1 })}>
                Show reviews needing an educator
              </button>
            )}
            {stats.overdue > 0 && (
              <button type="button" className="rounded-lg border border-amber-900 px-3 py-1.5 text-xs font-semibold text-amber-950" onClick={() => onQuery({ view: "overdue", page: 1 })}>
                Show overdue
              </button>
            )}
          </div>
        </div>
      )}
      {data && data.educatorCount === 0 && (
        <p role="status" className="rounded-xl bg-slate-100 p-4 text-sm text-slate-800">
          Your organization has no active educators yet. Add educators so reviews can be assigned to them.
        </p>
      )}
      {data?.truncated && (
        <p role="status" className="rounded-xl bg-slate-100 p-4 text-sm text-slate-800">
          Your organization is very large, so only the first 5,000 learners are included here.
        </p>
      )}

      <section aria-label="Review summary">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {KPI.map(({ view, key, hint }) => {
            const active = query.view === view;
            const count = stats?.[key];
            const attention = (view === "unassigned" || view === "overdue") && !!count;
            return (
              <li key={view}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onQuery({ view, page: 1 })}
                  className={`h-full w-full rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 ${
                    active
                      ? "border-indigo-700 bg-indigo-50 ring-1 ring-indigo-700"
                      : attention
                        ? "border-amber-300 bg-white hover:bg-amber-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-xs font-medium uppercase tracking-wide text-slate-600">
                    {VIEW_LABELS[view]}
                  </span>
                  <span className="mt-1 block text-3xl font-semibold text-slate-900">
                    {count ?? <span className="text-slate-300">–</span>}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">{hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <label className="relative block min-w-[16rem] flex-1 text-sm font-medium text-slate-900">
          Search learners
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-[2.1rem] h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Name or email"
            maxLength={100}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm font-normal"
          />
        </label>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setText("");
              onQuery({ view: "all", q: "", page: 1 });
            }}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}
        <button
          type="button"
          onClick={() => void overview.refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${overview.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {overview.isPending && (
        <div role="status" aria-label="Loading reviews" className="space-y-2">
          <span className="sr-only">Loading reviews…</span>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      )}

      {overview.isError && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-200">
          <p className="flex-1">{overview.error.message}</p>
          <button type="button" className="rounded-lg bg-red-800 px-3 py-1.5 font-semibold text-white" onClick={() => void overview.refetch()}>
            Try again
          </button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <InboxIcon className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
          {filtered ? (
            <>
              <h2 className="mt-3 text-base font-semibold text-slate-900">No reviews match</h2>
              <p className="mt-1 text-sm text-slate-600">
                Nothing matches {query.view !== "all" ? `“${VIEW_LABELS[query.view]}”` : "your search"}
                {query.q ? ` for “${query.q}”` : ""}.
              </p>
              <button
                type="button"
                className="mt-4 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  setText("");
                  onQuery({ view: "all", q: "", page: 1 });
                }}
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-base font-semibold text-slate-900">No reviews yet</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
                When a learner submits an artifact that needs an educator (because your organization sends
                everything to educators, or the AI is not sure), it appears here so you can assign someone.
              </p>
            </>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <p aria-live="polite" className="text-sm text-slate-600">
            {pageRange(data.page, data.pageSize, data.items.length, data.total)}
          </p>
          <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${overview.isFetching ? "opacity-70" : ""}`}>
            <table role="table" className="block w-full text-left text-sm md:table">
              <caption className="sr-only">Artifact reviews in your organization, most urgent first</caption>
              <thead role="rowgroup" className="hidden bg-slate-50 text-xs uppercase tracking-wide text-slate-600 md:table-header-group">
                <tr role="row">
                  {["Learner", "Artifact", "Status", "Educator", "Timing", ""].map((heading, index) => (
                    <th key={index} role="columnheader" scope="col" className="px-4 py-3 font-semibold">
                      {heading || <span className="sr-only">Action</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody role="rowgroup" className="block divide-y divide-slate-100 md:table-row-group">
                {data.items.map((review) => {
                  const timing = timingFor(review);
                  const unresolved = ["unassigned", "pending", "in_progress"].includes(review.status);
                  const action = review.status === "unassigned" ? "Assign educator" : unresolved ? "Reassign" : "View";
                  return (
                    <tr
                      key={review.id}
                      role="row"
                      className="block space-y-2 p-4 hover:bg-slate-50 md:table-row md:space-y-0 md:p-0"
                    >
                      <Cell label="Learner">
                        <button
                          type="button"
                          onClick={(event) => open(review, event.currentTarget)}
                          className="text-left font-semibold text-slate-900 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700"
                        >
                          {review.learner.name}
                        </button>
                        <span className="block text-xs text-slate-500">
                          {review.learner.scopeName ?? "No class or program"}
                        </span>
                      </Cell>
                      <Cell label="Artifact">
                        <span className="block text-slate-900">{review.moduleTitle ?? "Artifact"}</span>
                        <span className="block text-xs text-slate-500">{artifactLabel(review)}</span>
                        <span className="block text-xs text-slate-500">{reasonText(review.reason)}</span>
                      </Cell>
                      <Cell label="Status">
                        <ReviewStatusBadge status={review.status} overdue={review.overdue} />
                      </Cell>
                      <Cell label="Educator">
                        {review.reviewer ? (
                          <span className={review.reviewer.active ? "text-slate-900" : "text-red-700"}>
                            {review.reviewer.name}
                            {!review.reviewer.active && <span className="block text-xs">No longer active</span>}
                          </span>
                        ) : (
                          <span className="text-slate-500">Not assigned</span>
                        )}
                      </Cell>
                      <Cell label="Timing">
                        <span className={URGENCY_TEXT[timing.urgency]}>{timing.text}</span>
                      </Cell>
                      <Cell label="">
                        <button
                          type="button"
                          aria-label={`${action} for ${review.learner.name}`}
                          onClick={(event) => open(review, event.currentTarget)}
                          className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 ${
                            review.status === "unassigned"
                              ? "bg-indigo-700 text-white hover:bg-indigo-800"
                              : "border border-slate-300 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          {action}
                        </button>
                      </Cell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <nav aria-label="Pagination" className="flex items-center justify-between">
            <button
              type="button"
              disabled={query.page <= 1}
              onClick={() => onQuery({ page: query.page - 1 })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {data.page} of {Math.max(1, Math.ceil(data.total / data.pageSize))}
            </span>
            <button
              type="button"
              disabled={!data.hasMore}
              onClick={() => onQuery({ page: query.page + 1 })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </>
      )}

      {opened && (
        <ReviewDetailDrawer
          key={opened.id}
          initial={opened}
          userId={userId}
          onClose={close}
          onAssigned={(message) => {
            setNotice(message);
            close();
          }}
        />
      )}
    </div>
  );
}

/** One cell: a real table cell on desktop, a labelled row on mobile. */
function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <td
      role="cell"
      data-label={label}
      className={`block md:table-cell md:px-4 md:py-3 md:align-top ${
        label ? "before:mb-0.5 before:block before:text-[11px] before:font-medium before:uppercase before:tracking-wide before:text-slate-500 before:content-[attr(data-label)] md:before:hidden" : ""
      }`}
    >
      {children}
    </td>
  );
}
