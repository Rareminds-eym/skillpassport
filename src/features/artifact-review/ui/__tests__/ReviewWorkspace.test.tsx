import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  cleanup,
  act,
  waitFor,
} from "@testing-library/react";
import {
  createMemoryRouter,
  createBrowserRouter,
  RouterProvider,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import ReviewWorkspace from "../ReviewWorkspace";

const state = vi.hoisted(() => ({
  detail: null as unknown,
  start: vi.fn(),
  complete: vi.fn(),
}));
vi.mock("../../model/hooks", () => ({
  useReviewQueue: () => ({
    data: { items: [], hasMore: false, nextCursor: null },
    isPending: false,
  }),
  useReviewDetail: () => ({ data: state.detail, isPending: false }),
  useReviewMutations: () => ({
    start: { mutate: state.start, isPending: false },
    complete: {
      mutate: state.complete,
      isPending: false,
      error: new Error("Network interrupted"),
    },
  }),
}));
const labels = [
  "Completeness",
  "Accuracy",
  "Evidence use",
  "Judgement",
  "Next action",
];
const fixture = (status = "in_progress") => ({
  review: {
    id: "00000000-0000-4000-8000-000000000001",
    version: 3,
    status,
    due_by: null,
    rubric_snapshot: {
      version: 1,
      criteria: labels.map((label, index) => ({
        id: String(index),
        label,
        maxScore: 3,
      })),
    },
  },
  submission: { attempt_no: 1 },
  learner: { first_name: "Test", last_name: "Learner" },
  questions: [],
  answers: [],
  files: [],
  templates: [],
  evaluations: [],
});
const reviewPath = "/educator/reviews/00000000-0000-4000-8000-000000000001";
const mount = () => {
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <>
            <Link to="/elsewhere">Sidebar destination</Link>
            <Routes>
              <Route
                path="/educator/reviews/:id"
                element={<ReviewWorkspace />}
              />
              <Route path="*" element={<p>Other page</p>} />
            </Routes>
          </>
        ),
      },
    ],
    { initialEntries: ["/previous", reviewPath], initialIndex: 1 },
  );
  render(<RouterProvider router={router} />);
  return router;
};
describe("review form command safety", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    state.detail = fixture();
  });
  it("requires starting the assignment before editing or completing", () => {
    state.detail = fixture("pending");
    mount();
    expect(screen.getByLabelText("Feedback")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Start review" }));
    expect(state.start).toHaveBeenCalledOnce();
    expect(state.complete).not.toHaveBeenCalled();
  });
  it("retains the same idempotency key and input when retrying an unchanged command", () => {
    mount();
    for (const label of labels)
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: "2" },
      });
    fireEvent.change(screen.getByLabelText("Feedback"), {
      target: { value: "Please provide the missing evidence" },
    });
    fireEvent.change(screen.getByLabelText(/Next steps/), {
      target: { value: "Add supporting evidence" },
    });
    fireEvent.change(screen.getByLabelText("Decision rationale"), {
      target: { value: "Evidence is incomplete" },
    });
    const submit = screen.getByRole("button", { name: "Submit review" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(state.complete).toHaveBeenCalledTimes(2);
    expect(state.complete.mock.calls[0][0]).toEqual(
      state.complete.mock.calls[1][0],
    );
    expect(state.complete.mock.calls[0][0].body).not.toHaveProperty("score");
    expect(screen.getByLabelText("Feedback")).toHaveValue(
      "Please provide the missing evidence",
    );
  });
  it("does not offer pass until every criterion has evidence and a passing score", () => {
    mount();
    expect(screen.getByRole("option", { name: "Pass" })).toBeDisabled();
    for (const label of labels)
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: "2" },
      });
    for (const input of screen.getAllByLabelText(
      "Evidence / location in artifact",
    ))
      fireEvent.change(input, {
        target: { value: "Page 1, submitted evidence" },
      });
    expect(screen.getByRole("option", { name: "Pass" })).toBeEnabled();
    fireEvent.click(screen.getByLabelText("Unresolved critical failure"));
    expect(screen.getByRole("option", { name: "Pass" })).toBeDisabled();
  });
});

describe("unsent review navigation", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    state.detail = fixture();
  });
  it("blocks sidebar navigation, preserves edits on cancel, and leaves only after confirmation", async () => {
    const router = mount();
    fireEvent.change(screen.getByLabelText("Feedback"), {
      target: { value: "Unsent feedback" },
    });
    fireEvent.click(screen.getByText("Sidebar destination"));
    expect(await screen.findByRole("alertdialog")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Stay on review" }),
    ).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Tab" });
    expect(
      screen.getByRole("button", { name: "Discard and leave" }),
    ).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Stay on review" }));
    expect(router.state.location.pathname).toBe(reviewPath);
    expect(screen.getByLabelText("Feedback")).toHaveValue("Unsent feedback");
    fireEvent.click(screen.getByText("Sidebar destination"));
    fireEvent.click(
      await screen.findByRole("button", { name: "Discard and leave" }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/elsewhere"),
    );
  });
  it("blocks Back navigation and cancels it with Escape", async () => {
    const router = mount();
    fireEvent.change(screen.getByLabelText("Feedback"), {
      target: { value: "Keep me" },
    });
    await act(async () => {
      await router.navigate(-1);
    });
    fireEvent.keyDown(await screen.findByRole("alertdialog"), {
      key: "Escape",
    });
    expect(router.state.location.pathname).toBe(reviewPath);
    expect(screen.getByLabelText("Feedback")).toHaveValue("Keep me");
    await act(async () => {
      await router.navigate(-1);
    });
    fireEvent.click(
      await screen.findByRole("button", { name: "Discard and leave" }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/previous"),
    );
  });
  it("allows navigation when the review is untouched or recorded", async () => {
    const router = mount();
    await act(async () => {
      await router.navigate("/elsewhere");
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    cleanup();
    state.detail = fixture("completed");
    const recorded = mount();
    fireEvent.click(screen.getByText("Sidebar destination"));
    await waitFor(() =>
      expect(recorded.state.location.pathname).toBe("/elsewhere"),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
  it("restores the browser history entry when Back is cancelled", async () => {
    window.history.replaceState(null, "", "/previous");
    const router = createBrowserRouter([
      {
        path: "*",
        element: (
          <Routes>
            <Route path="/educator/reviews/:id" element={<ReviewWorkspace />} />
            <Route path="*" element={<p>Previous page</p>} />
          </Routes>
        ),
      },
    ]);
    try {
      render(<RouterProvider router={router} />);
      await act(async () => {
        await router.navigate(reviewPath);
      });
      fireEvent.change(screen.getByLabelText("Feedback"), {
        target: { value: "Keep browser edits" },
      });
      window.history.back();
      fireEvent.click(
        await screen.findByRole("button", { name: "Stay on review" }),
      );
      await waitFor(() => expect(window.location.pathname).toBe(reviewPath));
      expect(screen.getByLabelText("Feedback")).toHaveValue(
        "Keep browser edits",
      );
      window.history.back();
      fireEvent.click(
        await screen.findByRole("button", { name: "Discard and leave" }),
      );
      await waitFor(() => expect(window.location.pathname).toBe("/previous"));
    } finally {
      cleanup();
      router.dispose();
      window.history.replaceState(null, "", "/");
    }
  });
  it("retains the refresh and close warning for dirty reviews", () => {
    mount();
    fireEvent.change(screen.getByLabelText("Feedback"), {
      target: { value: "Unsaved" },
    });
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
