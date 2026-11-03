import type { AdminReview, ReviewStatus, ReviewView } from "../api/reviews";

/** Plain-language status. Never rely on colour alone: every status has a label. */
export const STATUS_META: Record<
  ReviewStatus,
  { label: string; tone: "amber" | "sky" | "indigo" | "green" | "orange" }
> = {
  unassigned: { label: "Needs an educator", tone: "amber" },
  pending: { label: "Assigned", tone: "sky" },
  in_progress: { label: "In review", tone: "indigo" },
  completed: { label: "Passed", tone: "green" },
  returned: { label: "Revision requested", tone: "orange" },
};

export const VIEW_LABELS: Record<ReviewView, string> = {
  all: "All reviews",
  unassigned: "Needs an educator",
  overdue: "Overdue",
  active: "In review",
  completed: "Completed",
  returned: "Revision requested",
};

/** Why the work needs a person (the `reason` stored with the review). */
export function reasonText(reason: string): string {
  switch (reason) {
    case "human_only_scope":
      return "Your organization sends all artifacts to educators";
    case "low_confidence":
      return "The AI was not confident enough to decide";
    case "unassessable_evidence":
      return "The submitted files could not be read by the AI";
    case "evaluation_unavailable":
      return "The AI evaluation was unavailable";
    case "human_revision_followup":
      return "Follow-up after an earlier revision request";
    case "reconciliation":
    case "scope_reconciliation":
      return "Re-queued automatically";
    default:
      return "Needs an educator's review";
  }
}

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

/** "3 days", "5 hours", "12 minutes" (always positive, rounded down, min 1 minute). */
export function duration(ms: number): string {
  const value = Math.max(0, ms);
  if (value >= DAY) {
    const n = Math.floor(value / DAY);
    return `${n} day${n === 1 ? "" : "s"}`;
  }
  if (value >= HOUR) {
    const n = Math.floor(value / HOUR);
    return `${n} hour${n === 1 ? "" : "s"}`;
  }
  const n = Math.max(1, Math.floor(value / MINUTE));
  return `${n} minute${n === 1 ? "" : "s"}`;
}

export interface Timing {
  text: string;
  /** Urgency for styling: `late` is overdue, `soon` is due within a day. */
  urgency: "late" | "soon" | "normal" | "done";
}

/** The one line that tells an administrator how urgent a review is. */
export function timingFor(review: AdminReview, now: number = Date.now()): Timing {
  const at = (iso: string | null) => (iso ? Date.parse(iso) : Number.NaN);
  if (review.status === "completed" || review.status === "returned") {
    const done = at(review.completedAt);
    return {
      text: Number.isNaN(done) ? "Finished" : `Finished ${duration(now - done)} ago`,
      urgency: "done",
    };
  }
  if (review.status === "unassigned") {
    const since = at(review.requiredAt);
    return {
      text: Number.isNaN(since) ? "Waiting for an educator" : `Waiting ${duration(now - since)}`,
      urgency: "normal",
    };
  }
  const due = at(review.dueBy);
  if (Number.isNaN(due)) return { text: "No due date", urgency: "normal" };
  if (review.overdue || due < now) return { text: `Overdue by ${duration(now - due)}`, urgency: "late" };
  return {
    text: `Due in ${duration(due - now)}`,
    urgency: due - now <= DAY ? "soon" : "normal",
  };
}

export function artifactLabel(review: AdminReview): string {
  const kind =
    review.artifactType === "final" ? "Final artifact" : review.artifactType === "practice" ? "Practice artifact" : "Artifact";
  return `${kind} · Attempt ${review.attemptNo}`;
}

const TIMELINE: Record<string, (entry: { reviewerName: string | null; actorName: string | null }) => string> = {
  assigned: (e) => `Assigned to ${e.reviewerName ?? "an educator"}`,
  reassigned: (e) =>
    `${e.actorName ? `${e.actorName} assigned` : "Assigned"} ${e.reviewerName ?? "an educator"}`,
  started: () => "Educator started the review",
  completed: () => "Review completed",
  scope_reconciled: () => "Moved because the learner changed class or program",
};

export function timelineText(entry: {
  action: string;
  actorName: string | null;
  reviewerName: string | null;
}): string {
  return (TIMELINE[entry.action] ?? (() => entry.action.replace(/_/g, " ")))(entry);
}

export function pageRange(page: number, pageSize: number, shown: number, total: number) {
  if (!total || !shown) return "No reviews";
  const from = (page - 1) * pageSize + 1;
  return `Showing ${from}–${from + shown - 1} of ${total}`;
}

/** Named months avoid ambiguous numeric dates; times use the viewer's local timezone. */
export function formatReviewDate(iso: string | null): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short",
  }).format(new Date(iso));
}
