import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/model/authStore";
import {
  fetchAdminScopes,
  fetchAdminBacklog,
  fetchReassignment,
  reassignReview,
} from "../api/reviews";

export default function ReviewOperations() {
  const userId = useAuthStore((state) => state.user?.id);
  const client = useQueryClient();
  const [scopeId, setScopeId] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [reason, setReason] = useState("");
  const scopes = useQuery({
    queryKey: ["review-admin-scopes", userId],
    queryFn: fetchAdminScopes,
    enabled: !!userId,
  });
  const backlog = useQuery({
    queryKey: ["review-admin-backlog", userId, scopeId, page],
    queryFn: () => fetchAdminBacklog(scopeId, page),
    enabled: !!userId && !!scopeId,
    refetchInterval: 30_000,
  });
  const detail = useQuery({
    queryKey: ["review-admin-detail", userId, selected],
    queryFn: () => fetchReassignment(selected),
    enabled: !!userId && !!selected,
  });
  const mutation = useMutation({
    mutationFn: () =>
      reassignReview(selected, {
        expectedVersion: detail.data!.review.version,
        reviewerId,
        reason,
      }),
    onSuccess: async () => {
      setSelected("");
      setReason("");
      setReviewerId("");
      await client.invalidateQueries({ queryKey: ["review-admin-backlog"] });
    },
  });
  const error = scopes.error || backlog.error || detail.error || mutation.error;
  return (
    <main className="mx-auto max-w-5xl p-6 lg:p-10">
      <h1 className="text-3xl font-semibold text-slate-900">
        Artifact review oversight
      </h1>
      <p className="mt-3 text-slate-600">
        Resolve unassigned and overdue work in your institution. Reassignment
        records your reason and requires the new reviewer to start again.
      </p>
      <label className="mt-7 block text-sm font-semibold">
        Program or class
        <select
          className="mt-2 block w-full rounded-lg border p-3"
          value={scopeId}
          onChange={(event) => {
            setScopeId(event.target.value);
            setPage(1);
            setSelected("");
          }}
        >
          <option value="">Choose a program or class</option>
          {scopes.data?.map((scope) => (
            <option key={scope.scopeId} value={scope.scopeId}>
              {scope.name}
            </option>
          ))}
        </select>
      </label>
      {scopes.isPending && (
        <p role="status" className="mt-5">
          Loading your institution…
        </p>
      )}
      {scopes.data?.length === 0 && (
        <p className="mt-5">
          No active college or school administrator scopes are available.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-5 text-red-700">
          {error.message}
        </p>
      )}
      {scopeId && backlog.isPending && (
        <p role="status" className="mt-5">
          Loading reviews…
        </p>
      )}
      {backlog.data && (
        <section className="mt-6 space-y-3">
          <p className="text-sm text-slate-600">{backlog.data.stats.unassigned} unassigned · {backlog.data.stats.overdue} overdue · {backlog.data.stats.pendingEvents} notification events awaiting delivery</p>
          {!backlog.data.items.length && (
            <p>No unresolved reviews in this program or class.</p>
          )}
          {backlog.data.items.map((review, index) => (
            <button
              key={review.id}
              type="button"
              onClick={() => {
                setSelected(review.id);
                setReason("");
                setReviewerId("");
                mutation.reset();
              }}
              className="flex w-full items-center justify-between rounded-lg border bg-white p-5 text-left hover:bg-slate-50"
            >
              <span>
                Review {(page - 1) * 25 + index + 1} ·{" "}
                {review.status.replace(/_/g, " ")}
              </span>
              <span className="text-sm text-slate-600">
                {review.due_by
                  ? `${Date.parse(review.due_by) < Date.now() ? "Overdue · " : "Due "}${new Date(review.due_by).toLocaleDateString()}`
                  : "Awaiting assignment"}
              </span>
            </button>
          ))}
          <div className="flex justify-between">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={!backlog.data.hasMore}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </section>
      )}
      {selected && detail.isPending && (
        <p role="status" className="mt-6">
          Checking educator eligibility…
        </p>
      )}
      {selected && detail.data && (
        <form
          className="mt-8 rounded-xl border bg-white p-6"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <h2 className="text-lg font-semibold">Reassign review</h2>
          <label className="mt-5 block text-sm font-semibold">
            Eligible educator
            <select
              required
              value={reviewerId}
              onChange={(event) => setReviewerId(event.target.value)}
              className="mt-2 block w-full rounded-lg border p-3"
            >
              <option value="">Choose educator</option>
              {detail.data.candidates
                .filter(
                  (candidate) =>
                    candidate.id !== detail.data.review.reviewer_id,
                )
                .map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.label}
                  </option>
                ))}
            </select>
          </label>
          {!detail.data.candidates.length && (
            <p className="mt-3 text-sm">
              No eligible educators. Update the class or program teaching
              assignments first.
            </p>
          )}
          <label className="mt-5 block text-sm font-semibold">
            Reason
            <textarea
              required
              maxLength={2000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="mt-2 block w-full rounded-lg border p-3"
            />
          </label>
          <button
            disabled={mutation.isPending || !reviewerId}
            className="mt-5 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {mutation.isPending ? "Reassigning…" : "Reassign review"}
          </button>
          <button
            type="button"
            className="ml-4 text-sm underline"
            onClick={() => setSelected("")}
          >
            Cancel
          </button>
        </form>
      )}
    </main>
  );
}
