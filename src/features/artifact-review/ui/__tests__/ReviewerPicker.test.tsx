import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReviewerPicker from "../ReviewerPicker";

const api = vi.hoisted(() => ({
  fetchScopeReviewers: vi.fn(),
  addScopeReviewer: vi.fn(),
  removeScopeReviewer: vi.fn(),
}));
vi.mock("../../api/reviews", () => api);

const SCOPE = {
  scopeId: "00000000-0000-4000-8000-000000000005",
  scopeType: "school_class" as const,
};
const educator = (n: number, name: string, extra: Record<string, unknown> = {}) => ({
  userId: `00000000-0000-4000-8000-0000000000${n}`,
  name,
  email: `${name.toLowerCase().replace(/\s/g, ".")}@example.test`,
  designated: false,
  teaching: false,
  ...extra,
});
const payload = (overrides: Record<string, unknown> = {}) => ({
  teachingCount: 0,
  designatedCount: 0,
  educators: [educator(10, "Asha Rao"), educator(11, "Bilal Khan"), educator(12, "Chen Li")],
  ...overrides,
});
function renderPicker() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ReviewerPicker scope={SCOPE} userId="admin-1" />
    </QueryClientProvider>,
  );
}

describe("ReviewerPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchScopeReviewers.mockResolvedValue(payload());
    api.addScopeReviewer.mockResolvedValue({});
    api.removeScopeReviewer.mockResolvedValue({});
  });
  afterEach(cleanup);

  it("warns when nobody teaches the class and no reviewer is chosen", async () => {
    renderPicker();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /No educator is assigned to teach this class or program/,
    );
  });

  it("does not warn once a teaching educator exists", async () => {
    api.fetchScopeReviewers.mockResolvedValue(
      payload({ teachingCount: 1, educators: [educator(10, "Asha Rao", { teaching: true })] }),
    );
    renderPicker();
    expect(await screen.findByText(/Teaches this class/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("does not warn once a reviewer has been chosen", async () => {
    api.fetchScopeReviewers.mockResolvedValue(
      payload({ designatedCount: 1, educators: [educator(10, "Asha Rao", { designated: true })] }),
    );
    renderPicker();
    expect(await screen.findByRole("checkbox", { name: /Asha Rao/ })).toBeChecked();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("lets the admin pick any educator of the organization", async () => {
    renderPicker();
    fireEvent.click(await screen.findByRole("checkbox", { name: /Bilal Khan/ }));
    await waitFor(() =>
      expect(api.addScopeReviewer).toHaveBeenCalledWith(SCOPE, "00000000-0000-4000-8000-000000000011"),
    );
    expect(api.removeScopeReviewer).not.toHaveBeenCalled();
  });

  it("removes a designated educator when unchecked and refetches", async () => {
    api.fetchScopeReviewers.mockResolvedValue(
      payload({ designatedCount: 1, educators: [educator(10, "Asha Rao", { designated: true })] }),
    );
    renderPicker();
    fireEvent.click(await screen.findByRole("checkbox", { name: /Asha Rao/ }));
    await waitFor(() =>
      expect(api.removeScopeReviewer).toHaveBeenCalledWith(SCOPE, "00000000-0000-4000-8000-000000000010"),
    );
    await waitFor(() => expect(api.fetchScopeReviewers.mock.calls.length).toBeGreaterThan(1));
  });

  it("filters educators by name or email", async () => {
    renderPicker();
    await screen.findByRole("checkbox", { name: /Asha Rao/ });
    fireEvent.change(screen.getByLabelText("Find an educator"), { target: { value: "chen" } });
    expect(screen.getByRole("checkbox", { name: /Chen Li/ })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Asha Rao/ })).toBeNull();
    fireEvent.change(screen.getByLabelText("Find an educator"), { target: { value: "zzz" } });
    expect(screen.getByText("No matching educators.")).toBeInTheDocument();
  });

  it("shows the server message when a change is rejected", async () => {
    api.addScopeReviewer.mockRejectedValue(
      new Error("Choose an active educator of your organization."),
    );
    renderPicker();
    fireEvent.click(await screen.findByRole("checkbox", { name: /Chen Li/ }));
    expect(
      await screen.findByText("Choose an active educator of your organization."),
    ).toBeInTheDocument();
  });

  it("shows an error when the educator list cannot be loaded", async () => {
    api.fetchScopeReviewers.mockRejectedValue(new Error("Unable to update reviewers. Try again."));
    renderPicker();
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to update reviewers");
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});
