import { XMarkIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import ManageEducatorsLink from "./ManageEducatorsLink";
import { type AdminReview, assignEducator, fetchAdminReviewDetail, ReviewApiError } from "../api/reviews";
import ReviewStatusBadge from "./ReviewStatusBadge";
import { artifactLabel, formatReviewDate, reasonText, timelineText, timingFor } from "./reviewPresentation";

const REASON_SUGGESTIONS = ["Balancing workload", "Educator unavailable", "Subject expertise"];

/**
 * Side panel for one review. The administrator sees who, what and when, and
 * assigns an educator. There is deliberately no review content and no scoring
 * here: educators do the reviewing.
 */
export default function ReviewDetailDrawer({
  initial,
  userId,
  onClose,
  onAssigned,
}: {
  /** The row the administrator clicked: titles the drawer instantly while details load. */
  initial: AdminReview;
  userId: string | undefined;
  onClose: () => void;
  onAssigned: (message: string) => void;
}) {
  const client = useQueryClient();
  const reviewId = initial.id;
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [reviewerId, setReviewerId] = useState("");
  const [reason, setReason] = useState("");
  const detail = useQuery({
    queryKey: ["admin-review-detail", userId, reviewId],
    queryFn: () => fetchAdminReviewDetail(reviewId),
    enabled: !!userId,
  });
  const assign = useMutation({
    mutationFn: () =>
      assignEducator(reviewId, {
        expectedVersion: detail.data!.review.version,
        reviewerId,
        reason: reason.trim(),
      }),
    onSuccess: async () => {
      const name = detail.data?.candidates.find((c) => c.id === reviewerId)?.name ?? "the educator";
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-review-overview"] }),
        client.invalidateQueries({ queryKey: ["admin-review-detail"] }),
      ]);
      onAssigned(`Assigned to ${name}. They will see it in their review queue.`);
    },
    onError: (error) => {
      // A 409 means someone else changed the review: show the fresh state.
      if (error instanceof ReviewApiError && error.status === 409)
        void client.invalidateQueries({ queryKey: ["admin-review-detail", userId, reviewId] });
    },
  });

  const data = detail.data;
  const review = data?.review;
  const timing = review ? timingFor(review) : null;
  const canSubmit = !!reviewerId && reason.trim().length > 0 && !assign.isPending;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-900/40" />
        <Dialog.Content
          aria-modal="true"
          onOpenAutoFocus={(event) => { event.preventDefault(); closeRef.current?.focus(); }}
          className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-xl flex-col overflow-hidden bg-white shadow-xl"
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 p-5">
            <div className="min-w-0">
              <Dialog.Title className="break-words text-lg font-semibold text-slate-900">
                {(review ?? initial).learner.name}
              </Dialog.Title>
              <Dialog.Description className="mt-1 break-words text-sm text-slate-600">
                {(review ?? initial).moduleTitle ?? "Artifact"} · {artifactLabel(review ?? initial)}
              </Dialog.Description>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5">
            {detail.isPending && (
              <p role="status" className="text-sm text-slate-600">
                Loading review…
              </p>
            )}
            {detail.error && (
              <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-900">
                {detail.error.message}{" "}
                <button type="button" className="font-semibold underline" onClick={() => void detail.refetch()}>
                  Try again
                </button>
              </div>
            )}

            {data && review && timing && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <ReviewStatusBadge status={review.status} overdue={review.overdue} />
                  <span
                    className={`text-sm font-medium ${
                      timing.urgency === "late"
                        ? "text-red-700"
                        : timing.urgency === "soon"
                          ? "text-amber-800"
                          : "text-slate-600"
                    }`}
                  >
                    {timing.text}
                  </span>
                </div>

                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <Fact label="Learner" value={review.learner.name} hint={review.learner.email} />
                  <Fact label="Class or program" value={review.learner.scopeName ?? "Not set"} />
                  <Fact label="Module" value={review.moduleTitle ?? "—"} hint={review.levelTitle} />
                  <Fact
                    label="Submitted"
                    value={formatReviewDate(review.submittedAt)}
                  />
                  <Fact label="Why it needs an educator" value={reasonText(review.reason)} wide />
                  <Fact
                    label="Educator"
                    value={
                      review.reviewer
                        ? `${review.reviewer.name}${review.reviewer.active ? "" : " (no longer active)"}`
                        : "Not assigned yet"
                    }
                  />
                  {review.dueBy && (
                    <Fact label="Due" value={formatReviewDate(review.dueBy)} />
                  )}
                  {review.status === "completed" || review.status === "returned" ? (
                    <Fact
                      label="Outcome"
                      value={`${review.status === "completed" ? "Passed" : "Revision requested"}${
                        review.outcomeScore !== null ? ` · score ${Math.round(review.outcomeScore)}` : ""
                      }`}
                    />
                  ) : null}
                </dl>

                {data.assignable ? (
                  <form
                    className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (canSubmit) assign.mutate();
                    }}
                  >
                    <h3 className="text-sm font-semibold text-slate-900">
                      {review.reviewer ? "Reassign to another educator" : "Assign an educator"}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Educators do the reviewing. The one you choose will see this in their review queue.
                    </p>
                    {data.candidates.length === 0 ? (
                      <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                        {review.reviewer
                          ? "There are no other active educators in your organization."
                          : "There are no active educators available to assign in your organization."}
                        {" "}Add an educator first.
                        <span className="mt-3 block"><ManageEducatorsLink /></span>
                      </p>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-slate-900">
                          Educator
                          <select
                            required
                            value={reviewerId}
                            onChange={(event) => setReviewerId(event.target.value)}
                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                          >
                            <option value="">Choose an educator</option>
                            {data.candidates.map((candidate) => (
                              <option key={candidate.id} value={candidate.id}>
                                {candidate.name} ·{" "}
                                {candidate.openReviews === 0
                                  ? "no open reviews"
                                  : `${candidate.openReviews} open review${candidate.openReviews === 1 ? "" : "s"}`}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div>
                          <label className="block text-sm font-medium text-slate-900">
                            Reason
                            <textarea
                              required
                              maxLength={2000}
                              rows={3}
                              value={reason}
                              onChange={(event) => setReason(event.target.value)}
                              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                            />
                          </label>
                          <div className="mt-2 flex flex-wrap gap-2" aria-label="Suggested reasons">
                            {REASON_SUGGESTIONS.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => setReason(suggestion)}
                                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                        {assign.error && (
                          <p role="alert" className="text-sm text-red-700">
                            {assign.error instanceof ReviewApiError && assign.error.status === 409
                              ? "This review just changed. The latest details are shown; please try again."
                              : assign.error.message}
                          </p>
                        )}
                        <button
                          type="submit"
                          disabled={!canSubmit}
                          className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
                        >
                          {assign.isPending ? "Assigning…" : review.reviewer ? "Reassign educator" : "Assign educator"}
                        </button>
                      </>
                    )}
                  </form>
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                    This review is finished, so it can no longer be reassigned.
                  </p>
                )}
                <section aria-labelledby={`${titleId}-history`}>
                  <h3 id={`${titleId}-history`} className="text-sm font-semibold text-slate-900">
                    History
                  </h3>
                  <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">
                    <TimelineItem
                      text={`Sent for human review`}
                      at={review.requiredAt}
                      detail={reasonText(review.reason)}
                    />
                    {data.timeline.map((entry, index) => (
                      <TimelineItem
                        key={`${entry.action}-${entry.at}-${index}`}
                        text={timelineText(entry)}
                        at={entry.at}
                        detail={entry.reason ? `Reason: ${entry.reason}` : undefined}
                      />
                    ))}
                  </ol>
                </section>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Fact({
  label,
  value,
  hint,
  wide,
}: {
  label: string;
  value: string;
  hint?: string | null;
  wide?: boolean;
}) {
  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-slate-900">
        {value}
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </dd>
    </div>
  );
}

function TimelineItem({ text, at, detail }: { text: string; at: string; detail?: string }) {
  return (
    <li className="relative text-sm">
      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
      <p className="text-slate-900">{text}</p>
      {detail && <p className="text-xs text-slate-600">{detail}</p>}
      <time dateTime={at} className="text-xs text-slate-500">
        {formatReviewDate(at)}
      </time>
    </li>
  );
}
