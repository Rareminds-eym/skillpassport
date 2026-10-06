import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  addScopeReviewer,
  fetchScopeReviewers,
  removeScopeReviewer,
  type ReviewScopeRef,
} from "../api/reviews";

/**
 * Lets an institution administrator choose which educators of their
 * organization may review this class's/program's artifacts, including when no
 * educator is assigned to teach it. The server re-checks every choice.
 */
export default function ReviewerPicker({
  scope,
  userId,
}: {
  scope: ReviewScopeRef;
  userId: string | undefined;
}) {
  const client = useQueryClient();
  const [filter, setFilter] = useState("");
  const key = ["review-scope-reviewers", userId, scope.scopeId, scope.scopeType];
  const list = useQuery({
    queryKey: key,
    queryFn: () => fetchScopeReviewers(scope),
    enabled: !!userId,
  });
  const toggle = useMutation({
    mutationFn: ({ reviewerId, designate }: { reviewerId: string; designate: boolean }) =>
      designate ? addScopeReviewer(scope, reviewerId) : removeScopeReviewer(scope, reviewerId),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  const data = list.data;
  const needle = filter.trim().toLowerCase();
  const shown =
    data?.educators.filter(
      (e) =>
        !needle ||
        e.name.toLowerCase().includes(needle) ||
        (e.email ?? "").toLowerCase().includes(needle),
    ) ?? [];
  const noReviewers = !!data && data.teachingCount === 0 && data.designatedCount === 0;

  return (
    <fieldset className="mt-6 rounded-xl border bg-white p-5" disabled={toggle.isPending}>
      <legend className="px-1 text-sm font-semibold">Who can review this work?</legend>
      <p className="text-sm text-slate-600">
        Educators assigned to teach this class or program can always review. You can also choose
        any active educator of your organization.
      </p>
      {list.isPending && (
        <p role="status" className="mt-3 text-sm">
          Loading educators…
        </p>
      )}
      {list.error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {list.error.message}
        </p>
      )}
      {noReviewers && (
        <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          No educator is assigned to teach this class or program, and no reviewer is chosen. New
          submissions that need a human review will wait unassigned until you select at least one
          educator below.
        </p>
      )}
      {data && (
        <>
          <label className="mt-4 block text-sm font-semibold">
            Find an educator
            <input
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="mt-2 block w-full rounded-lg border p-2 font-normal"
            />
          </label>
          <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
            {shown.map((educator) => (
              <li key={educator.userId}>
                <label className="flex items-start gap-3 rounded p-1 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={educator.designated}
                    onChange={(event) =>
                      toggle.mutate({
                        reviewerId: educator.userId,
                        designate: event.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">
                    <span className="font-semibold">{educator.name}</span>
                    {educator.email && <span className="text-slate-500"> · {educator.email}</span>}
                    {educator.teaching && (
                      <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs">
                        Teaches this {scope.scopeType === "school_class" ? "class" : "program"}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {!shown.length && <p className="mt-3 text-sm">No matching educators.</p>}
          <p className="mt-4 text-xs text-slate-500">
            Removing an educator does not move reviews already assigned to them. Reassign those
            from the list below.
          </p>
        </>
      )}
      {toggle.error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {toggle.error.message}
        </p>
      )}
    </fieldset>
  );
}
