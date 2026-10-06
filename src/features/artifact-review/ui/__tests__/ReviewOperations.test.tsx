import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReviewOperations from "../ReviewOperations";

const api = vi.hoisted(() => ({
  fetchReviewOverview: vi.fn(),
  fetchAdminReviewDetail: vi.fn(),
  assignEducator: vi.fn(),
  fetchEvaluationSettings: vi.fn(),
  saveEvaluationMode: vi.fn(),
  fetchScopeReviewers: vi.fn(),
  addScopeReviewer: vi.fn(),
  removeScopeReviewer: vi.fn(),
  REVIEW_VIEWS: ["all", "unassigned", "overdue", "active", "completed", "returned"],
  ReviewApiError: class ReviewApiError extends Error {
    constructor(message: string, readonly status: number) {
      super(message);
    }
  },
}));
vi.mock("../../api/reviews", () => api);
vi.mock("@/shared/model/authStore", () => ({
  useAuthStore: (select: (s: { user: { id: string } }) => unknown) => select({ user: { id: "admin-1" } }),
}));

const SCHOOL = "00000000-0000-4000-8000-000000000003";
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const hours = (n: number) => new Date(Date.now() + n * 3_600_000).toISOString();

const review = (n: number, overrides: Record<string, unknown> = {}) => ({
  id: uuid(100 + n),
  status: "pending",
  version: 2,
  reason: "low_confidence",
  overdue: false,
  scopeId: uuid(5),
  requiredAt: hours(-48),
  assignedAt: hours(-24),
  startedAt: null,
  completedAt: null,
  dueBy: hours(48),
  attemptNo: 1,
  submittedAt: hours(-48),
  artifactType: "final",
  moduleTitle: "Borrower intake",
  levelTitle: "Level 1",
  outcomeDecision: null,
  outcomeScore: null,
  learner: { name: `Learner ${n}`, email: `l${n}@x.test`, scopeName: "BBA", organizationId: SCHOOL },
  reviewer: { id: uuid(50), name: "Dr. Meera", active: true },
  ...overrides,
});
const stats = { total: 4, unassigned: 1, overdue: 1, active: 2, completed: 1, returned: 0, oldestUnassignedAt: hours(-72) };
const overview = (items: unknown[], extra: Record<string, unknown> = {}) => ({
  organizations: [{ id: SCHOOL, name: "Soundarya College", orgType: "college" }],
  educatorCount: 3,
  truncated: false,
  stats,
  items,
  total: items.length,
  page: 1,
  pageSize: 25,
  hasMore: false,
  ...extra,
});
const unassigned = review(1, { status: "unassigned", reviewer: null, dueBy: null, scopeId: null, learner: { name: "Amrutha", email: "a@x.test", scopeName: null, organizationId: SCHOOL }, reason: "human_only_scope" });
const overdue = review(2, { overdue: true, dueBy: hours(-72) });
const inReview = review(3, { status: "in_progress" });
const done = review(4, { status: "completed", completedAt: hours(-5), outcomeScore: 87 });

function Where() {
  const location = useLocation();
  return <output data-testid="where">{location.pathname + location.search}</output>;
}
function renderPage(url = "/college-admin/artifact-reviews") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <ReviewOperations />
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
const where = () => screen.getByTestId("where").textContent;

describe("Artifact reviews (administrator)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchReviewOverview.mockResolvedValue(overview([unassigned, overdue, inReview, done]));
    api.fetchAdminReviewDetail.mockResolvedValue({
      review: unassigned,
      assignable: true,
      timeline: [],
      candidates: [
        { id: uuid(60), name: "Prof. Nikhil", email: "n@x.test", openReviews: 0 },
        { id: uuid(61), name: "Dr. Meera", email: "m@x.test", openReviews: 3 },
      ],
    });
    api.assignEducator.mockResolvedValue({});
    api.fetchEvaluationSettings.mockResolvedValue({
      organizations: [{ organizationId: SCHOOL, orgType: "college", name: "Soundarya College", evaluationMode: "human_only" }],
      scopes: [{ scopeId: uuid(5), scopeType: "college_program", name: "BBA" }],
    });
    api.fetchScopeReviewers.mockResolvedValue({ teachingCount: 0, designatedCount: 0, educators: [] });
  });
  afterEach(cleanup);

  describe("overview", () => {
    it("shows every review in the organization, most urgent first, with plain-language status", async () => {
      renderPage();
      const table = await screen.findByRole("table", { name: /artifact reviews in your organization/i });
      const rows = within(table).getAllByRole("row").slice(1);
      expect(rows).toHaveLength(4);
      expect(within(rows[0]!).getByText("Needs an educator")).toBeInTheDocument();
      expect(within(rows[0]!).getByText("Not assigned")).toBeInTheDocument();
      expect(within(rows[0]!).getByText("Your organization sends all artifacts to educators")).toBeInTheDocument();
      expect(within(rows[1]!).getByText("Overdue")).toBeInTheDocument();
      expect(within(rows[1]!).getByText(/Overdue by 3 days/)).toBeInTheDocument();
      expect(within(rows[3]!).getByText("Passed")).toBeInTheDocument();
      expect(within(rows[3]!).getByText(/Finished 5 hours ago/)).toBeInTheDocument();
    });

    it("shows learners who have no class or program, so none are invisible", async () => {
      renderPage();
      const row = (await screen.findAllByRole("row")).find((r) => within(r).queryByText("Amrutha"))!;
      expect(within(row).getByText("No class or program")).toBeInTheDocument();
    });

    it("summarises the organization in KPI cards that act as filters", async () => {
      renderPage();
      const needs = await screen.findByRole("button", { name: /needs an educator.*1/i });
      expect(needs).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(needs);
      await waitFor(() => expect(where()).toContain("view=unassigned"));
      await waitFor(() => expect(api.fetchReviewOverview).toHaveBeenLastCalledWith({ view: "unassigned", q: "", page: 1 }));
      expect(screen.getByRole("button", { name: /needs an educator.*1/i })).toHaveAttribute("aria-pressed", "true");
    });

    it("calls out what needs attention and jumps straight to it", async () => {
      renderPage();
      expect(await screen.findByText(/need an educator/i, { selector: "p" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /show overdue/i }));
      await waitFor(() => expect(where()).toContain("view=overdue"));
    });

    it("restores filters from the URL so a view can be bookmarked", async () => {
      renderPage("/college-admin/artifact-reviews?view=overdue&q=asha&page=2");
      await waitFor(() => expect(api.fetchReviewOverview).toHaveBeenCalledWith({ view: "overdue", q: "asha", page: 2 }));
      expect(screen.getByLabelText("Search learners")).toHaveValue("asha");
    });

    it("ignores an invalid filter in the URL instead of breaking", async () => {
      renderPage("/x?view=hacked&page=-4&q=" + "a".repeat(300));
      await waitFor(() => expect(api.fetchReviewOverview).toHaveBeenCalled());
      const call = api.fetchReviewOverview.mock.calls[0]![0];
      expect(call.view).toBe("all");
      expect(call.page).toBe(1);
      expect(call.q.length).toBeLessThanOrEqual(100);
    });

    it("debounces search: typing does not request on every key", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        renderPage();
        await screen.findByRole("table");
        api.fetchReviewOverview.mockClear();
        const box = screen.getByLabelText("Search learners");
        fireEvent.change(box, { target: { value: "a" } });
        fireEvent.change(box, { target: { value: "am" } });
        fireEvent.change(box, { target: { value: "amr" } });
        expect(api.fetchReviewOverview).not.toHaveBeenCalled();
        await act(async () => { await vi.advanceTimersByTimeAsync(350); });
        await waitFor(() => expect(where()).toContain("q=amr"));
        expect(api.fetchReviewOverview).toHaveBeenCalledTimes(1);
        expect(api.fetchReviewOverview).toHaveBeenCalledWith({ view: "all", q: "amr", page: 1 });
      } finally {
        vi.useRealTimers();
      }
    });

    it("pages through results", async () => {
      api.fetchReviewOverview.mockResolvedValue(overview([unassigned], { total: 60, hasMore: true }));
      renderPage();
      expect(await screen.findByText("Showing 1–1 of 60")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await waitFor(() => expect(where()).toContain("page=2"));
    });

    it("tells the administrator when nothing matches and offers to clear filters", async () => {
      api.fetchReviewOverview.mockResolvedValue(overview([], { total: 0 }));
      renderPage("/x?view=overdue");
      expect(await screen.findByText("No reviews match")).toBeInTheDocument();
      fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]!);
      await waitFor(() => expect(where()).not.toContain("view="));
    });

    it("explains how reviews arise when there are none yet", async () => {
      api.fetchReviewOverview.mockResolvedValue(overview([], { total: 0, stats: { ...stats, total: 0, unassigned: 0, overdue: 0, active: 0, completed: 0 } }));
      renderPage();
      expect(await screen.findByText("No reviews yet")).toBeInTheDocument();
      expect(screen.getByText(/appears here so you can assign someone/)).toBeInTheDocument();
    });

    it("shows a loading state, then a recoverable error", async () => {
      api.fetchReviewOverview.mockRejectedValue(new api.ReviewApiError("Review service unavailable", 503));
      renderPage();
      expect(screen.getByRole("status", { name: /loading reviews/i })).toBeInTheDocument();
      expect(await screen.findByRole("alert")).toHaveTextContent("Review service unavailable");
      api.fetchReviewOverview.mockResolvedValue(overview([unassigned]));
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(await screen.findByRole("table")).toBeInTheDocument();
    });

    it("warns when the organization has no educators to assign", async () => {
      api.fetchReviewOverview.mockResolvedValue(overview([unassigned], { educatorCount: 0 }));
      renderPage();
      expect(await screen.findByText(/no active educators yet/i)).toBeInTheDocument();
    });

    it("warns about a very large organization instead of silently truncating", async () => {
      api.fetchReviewOverview.mockResolvedValue(overview([unassigned], { truncated: true }));
      renderPage();
      expect(await screen.findByText(/only the first 5,000 learners/i)).toBeInTheDocument();
    });
  });

  describe("assigning an educator (the administrator never reviews)", () => {
    const open = async () => {
      renderPage();
      fireEvent.click(await screen.findByRole("button", { name: "Assign educator for Amrutha" }));
      const dialog = await screen.findByRole("dialog");
      // Wait for the details (and the assign form) to finish loading.
      await within(dialog).findByText("Assign an educator");
      return dialog;
    };

    it("opens details with the assign form, and no review or scoring controls", async () => {
      const dialog = await open();
      expect(within(dialog).getByRole("heading", { name: "Amrutha" })).toBeInTheDocument();
      expect(within(dialog).getByText("Assign an educator")).toBeInTheDocument();
      expect(within(dialog).queryByText(/score|rubric|pass|complete review/i, { selector: "button, label" })).toBeNull();
      expect(within(dialog).queryByRole("button", { name: /start review|open review/i })).toBeNull();
    });

    it("offers any educator of the organization with their current workload, least loaded first", async () => {
      const dialog = await open();
      const options = within(dialog).getAllByRole("option").map((o) => o.textContent);
      expect(options).toEqual([
        "Choose an educator",
        "Prof. Nikhil · no open reviews",
        "Dr. Meera · 3 open reviews",
      ]);
    });

    it("requires an educator and a reason before assigning", async () => {
      const dialog = await open();
      const submit = within(dialog).getByRole("button", { name: "Assign educator" });
      expect(submit).toBeDisabled();
      fireEvent.change(within(dialog).getByLabelText("Educator"), { target: { value: uuid(60) } });
      expect(submit).toBeDisabled();
      fireEvent.click(within(dialog).getByRole("button", { name: "Balancing workload" }));
      expect(submit).toBeEnabled();
    });

    it("assigns with the review version, refreshes the list, and confirms", async () => {
      const dialog = await open();
      fireEvent.change(within(dialog).getByLabelText("Educator"), { target: { value: uuid(60) } });
      fireEvent.change(within(dialog).getByLabelText("Reason"), { target: { value: "  Subject expertise " } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Assign educator" }));
      await waitFor(() =>
        expect(api.assignEducator).toHaveBeenCalledWith(unassigned.id, {
          expectedVersion: 2,
          reviewerId: uuid(60),
          reason: "Subject expertise",
        }),
      );
      expect(await screen.findByText(/Assigned to Prof\. Nikhil/)).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).toBeNull();
      await waitFor(() => expect(api.fetchReviewOverview.mock.calls.length).toBeGreaterThan(1));
    });

    it("explains a conflict in plain words and keeps the drawer open", async () => {
      api.assignEducator.mockRejectedValue(new api.ReviewApiError("This review changed.", 409));
      const dialog = await open();
      fireEvent.change(within(dialog).getByLabelText("Educator"), { target: { value: uuid(60) } });
      fireEvent.change(within(dialog).getByLabelText("Reason"), { target: { value: "x" } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Assign educator" }));
      expect(await within(dialog).findByText(/just changed/i)).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("shows a reassign form for assigned reviews and history including the reason", async () => {
      api.fetchAdminReviewDetail.mockResolvedValue({
        review: overdue,
        assignable: true,
        timeline: [{ action: "reassigned", at: hours(-10), actorName: "You", reason: "Workload", reviewerName: "Dr. Meera" }],
        candidates: [{ id: uuid(60), name: "Prof. Nikhil", email: null, openReviews: 1 }],
      });
      renderPage();
      fireEvent.click(await screen.findByRole("button", { name: "Reassign for Learner 2" }));
      const dialog = await screen.findByRole("dialog");
      expect(await within(dialog).findByText("Reassign to another educator")).toBeInTheDocument();
      expect(within(dialog).getByText("You assigned Dr. Meera")).toBeInTheDocument();
      expect(within(dialog).getByText("Reason: Workload")).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: "Reassign educator" })).toBeInTheDocument();
    });

    it("does not allow changing a finished review", async () => {
      api.fetchAdminReviewDetail.mockResolvedValue({ review: done, assignable: false, timeline: [], candidates: [] });
      renderPage();
      fireEvent.click(await screen.findByRole("button", { name: "View for Learner 4" }));
      const dialog = await screen.findByRole("dialog");
      expect(await within(dialog).findByText(/already be reassigned|no longer be reassigned/i)).toBeInTheDocument();
      expect(within(dialog).queryByRole("button", { name: /assign/i })).toBeNull();
      expect(within(dialog).getByText(/Passed · score 87/)).toBeInTheDocument();
    });

    it("says so when there is no other educator to assign", async () => {
      api.fetchAdminReviewDetail.mockResolvedValue({ review: unassigned, assignable: true, timeline: [], candidates: [] });
      const dialog = await open();
      expect(await within(dialog).findByText(/no other active educators/i)).toBeInTheDocument();
    });

    it("closes with Escape and returns focus to where the administrator was", async () => {
      const dialog = await open();
      const trigger = screen.getByRole("button", { name: "Assign educator for Amrutha" });
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(trigger).toHaveFocus());
      expect(dialog).not.toBeInTheDocument();
    });

    it("is titled with the learner immediately, before details finish loading", async () => {
      api.fetchAdminReviewDetail.mockReturnValue(new Promise(() => {}));
      renderPage();
      fireEvent.click(await screen.findByRole("button", { name: "Assign educator for Amrutha" }));
      const dialog = await screen.findByRole("dialog");
      expect(dialog).toHaveAccessibleName("Amrutha");
      expect(within(dialog).getByText(/Borrower intake · Final artifact · Attempt 1/)).toBeInTheDocument();
      expect(within(dialog).getByRole("status")).toHaveTextContent("Loading review");
    });

    it("labels the dialog and moves focus into it", async () => {
      const dialog = await open();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAccessibleName("Amrutha");
      expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus();
    });
  });

  describe("tabs and settings", () => {
    it("uses an accessible tab list and switches with the keyboard", async () => {
      renderPage();
      const reviews = screen.getByRole("tab", { name: "Reviews" });
      expect(reviews).toHaveAttribute("aria-selected", "true");
      reviews.focus();
      fireEvent.keyDown(reviews, { key: "ArrowRight" });
      await waitFor(() => expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true"));
      expect(where()).toContain("tab=settings");
      expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();
      expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "review-tab-settings");
    });

    it("keeps settings out of the work queue, and shows the organization-wide mode", async () => {
      renderPage("/x?tab=settings");
      const human = await screen.findByRole("radio", { name: /Human review only/ });
      expect((human as HTMLInputElement).checked).toBe(true);
      expect(screen.queryByRole("table")).toBeNull();
      expect(screen.getByText(/at Soundarya College/)).toBeInTheDocument();
    });

    it("saves one organization-level choice", async () => {
      api.saveEvaluationMode.mockResolvedValue({});
      renderPage("/x?tab=settings");
      fireEvent.click(await screen.findByRole("radio", { name: /AI first/ }));
      await waitFor(() => expect(api.saveEvaluationMode).toHaveBeenCalledWith({ organizationId: SCHOOL, evaluationMode: "ai_first" }));
    });

    it("lets the administrator pick preferred educators for a class or program", async () => {
      renderPage("/x?tab=settings");
      await screen.findByRole("heading", { name: "Preferred educators for automatic assignment" });
      fireEvent.change(await screen.findByLabelText("Program or class"), { target: { value: uuid(5) } });
      expect(await screen.findByText("Who can review this work?")).toBeInTheDocument();
    });

    it("explains when the account has no administrator role", async () => {
      api.fetchEvaluationSettings.mockResolvedValue({ organizations: [], scopes: [] });
      renderPage("/x?tab=settings");
      expect(await screen.findByText(/No active college or school administrator role/)).toBeInTheDocument();
      expect(screen.queryByRole("radio")).toBeNull();
    });

    it("still shows settings when the review service is down", async () => {
      api.fetchReviewOverview.mockRejectedValue(new api.ReviewApiError("Review service unavailable", 503));
      renderPage("/x?tab=settings");
      expect(await screen.findByRole("radio", { name: /AI first/ })).toBeInTheDocument();
    });
  });
});
