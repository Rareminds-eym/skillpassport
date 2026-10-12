import { describe, expect, it } from "vitest";
import type { AdminReview } from "../../api/reviews";
import {
  artifactLabel,
  duration,
  pageRange,
  reasonText,
  STATUS_META,
  timelineText,
  timingFor,
} from "../reviewPresentation";

const NOW = Date.parse("2026-10-05T12:00:00Z");
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();
const H = 3_600_000;
const D = 24 * H;
const review = (overrides: Partial<AdminReview> = {}): AdminReview => ({
  id: "00000000-0000-4000-8000-000000000001",
  status: "pending",
  version: 1,
  reason: "low_confidence",
  overdue: false,
  scopeId: null,
  requiredAt: iso(-2 * D),
  assignedAt: iso(-D),
  startedAt: null,
  completedAt: null,
  dueBy: iso(2 * D),
  attemptNo: 1,
  submittedAt: iso(-2 * D),
  artifactType: "final",
  moduleTitle: "Borrower intake",
  levelTitle: "Level 1",
  outcomeDecision: null,
  outcomeScore: null,
  learner: { name: "Asha", email: null, scopeName: null, organizationId: null },
  reviewer: null,
  ...overrides,
});

describe("duration", () => {
  it.each([
    [30_000, "1 minute"],
    [5 * 60_000, "5 minutes"],
    [H, "1 hour"],
    [5 * H + 59 * 60_000, "5 hours"],
    [D, "1 day"],
    [3 * D + 20 * H, "3 days"],
    [-5, "1 minute"],
  ])("%d ms -> %s", (ms, text) => expect(duration(ms)).toBe(text));
});

describe("timingFor (how urgent is this review?)", () => {
  it("counts how long an unassigned review has been waiting", () => {
    expect(timingFor(review({ status: "unassigned" }), NOW)).toEqual({ text: "Waiting 2 days", urgency: "normal" });
  });
  it("shows an on-time review as due in N, normal urgency", () => {
    expect(timingFor(review(), NOW)).toEqual({ text: "Due in 2 days", urgency: "normal" });
  });
  it("flags a review due within a day as 'soon'", () => {
    expect(timingFor(review({ dueBy: iso(5 * H) }), NOW)).toEqual({ text: "Due in 5 hours", urgency: "soon" });
  });
  it("flags an overdue review as late", () => {
    expect(timingFor(review({ overdue: true, dueBy: iso(-3 * D) }), NOW)).toEqual({ text: "Overdue by 3 days", urgency: "late" });
  });
  it("trusts the past due date even if the overdue flag is stale", () => {
    expect(timingFor(review({ overdue: false, dueBy: iso(-2 * H) }), NOW).urgency).toBe("late");
  });
  it("shows finished work as done, not urgent", () => {
    expect(timingFor(review({ status: "completed", completedAt: iso(-2 * D) }), NOW)).toEqual({ text: "Finished 2 days ago", urgency: "done" });
    expect(timingFor(review({ status: "returned", completedAt: null }), NOW)).toEqual({ text: "Finished", urgency: "done" });
  });
  it("copes with a missing due date", () => {
    expect(timingFor(review({ dueBy: null }), NOW).text).toBe("No due date");
  });
});

describe("plain-language labels", () => {
  it("has a label for every status", () => {
    for (const status of ["unassigned", "pending", "in_progress", "completed", "returned"] as const)
      expect(STATUS_META[status].label.length).toBeGreaterThan(2);
  });
  it("explains why a review exists, with a safe default", () => {
    expect(reasonText("human_only_scope")).toMatch(/all artifacts to educators/);
    expect(reasonText("low_confidence")).toMatch(/not confident/);
    expect(reasonText("unassessable_evidence")).toMatch(/could not be read/);
    expect(reasonText("something_new")).toBe("Needs an educator's review");
  });
  it("describes the artifact and attempt", () => {
    expect(artifactLabel(review())).toBe("Final artifact · Attempt 1");
    expect(artifactLabel(review({ artifactType: "practice", attemptNo: 3 }))).toBe("Practice artifact · Attempt 3");
    expect(artifactLabel(review({ artifactType: null }))).toBe("Artifact · Attempt 1");
  });
  it("turns audit entries into sentences", () => {
    expect(timelineText({ action: "assigned", actorName: null, reviewerName: "Dr. Meera" })).toBe("Assigned to Dr. Meera");
    expect(timelineText({ action: "reassigned", actorName: "You", reviewerName: "Prof. Nikhil" })).toBe("You assigned Prof. Nikhil");
    expect(timelineText({ action: "scope_reconciled", actorName: null, reviewerName: null })).toMatch(/changed class or program/);
    expect(timelineText({ action: "some_new_action", actorName: null, reviewerName: null })).toBe("some new action");
  });
  it("describes the visible range", () => {
    expect(pageRange(1, 25, 25, 61)).toBe("Showing 1–25 of 61");
    expect(pageRange(3, 25, 11, 61)).toBe("Showing 51–61 of 61");
    expect(pageRange(1, 25, 0, 0)).toBe("No reviews");
  });
});
