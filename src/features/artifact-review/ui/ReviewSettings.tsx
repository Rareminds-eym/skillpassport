import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchEvaluationSettings } from "../api/reviews";
import EvaluationModeSwitch from "./EvaluationModeSwitch";
import ReviewerPicker from "./ReviewerPicker";

/** Configuration, kept apart from the day-to-day work queue. */
export default function ReviewSettings({ userId }: { userId: string | undefined }) {
  const [scopeId, setScopeId] = useState("");
  const settings = useQuery({
    queryKey: ["review-evaluation-settings", userId],
    queryFn: fetchEvaluationSettings,
    enabled: !!userId,
  });
  const scope = settings.data?.scopes.find((s) => s.scopeId === scopeId);
  return (
    <div className="space-y-10">
      {settings.isPending && (
        <p role="status" className="text-sm text-slate-600">
          Loading settings…
        </p>
      )}
      {settings.error && (
        <div role="alert" className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-200">
          <p className="flex-1">{settings.error.message}</p>
          <button type="button" className="rounded-lg bg-red-800 px-3 py-1.5 font-semibold text-white" onClick={() => void settings.refetch()}>
            Try again
          </button>
        </div>
      )}
      {settings.data?.organizations.length === 0 && (
        <p className="text-sm text-slate-700">No active college or school administrator role was found for your account.</p>
      )}

      {!!settings.data?.organizations.length && (
        <section aria-labelledby="eval-heading">
          <h2 id="eval-heading" className="text-lg font-semibold text-slate-900">
            How work is evaluated
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            One choice for your whole organization. It covers every learner and every course.
          </p>
          {settings.data.organizations.map((org) => (
            <EvaluationModeSwitch
              key={org.organizationId}
              organizationId={org.organizationId}
              name={org.name}
              value={org.evaluationMode}
            />
          ))}
        </section>
      )}

      {!!settings.data?.scopes.length && (
        <section aria-labelledby="pool-heading">
          <h2 id="pool-heading" className="text-lg font-semibold text-slate-900">
            Preferred educators for automatic assignment
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            When a review is assigned automatically, the educators who teach the class or program come first, plus
            anyone you choose here. You can always assign any educator by hand from the Reviews tab.
          </p>
          <label className="mt-4 block text-sm font-semibold text-slate-900">
            Program or class
            <select
              className="mt-2 block w-full max-w-xl rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal"
              value={scopeId}
              onChange={(event) => setScopeId(event.target.value)}
            >
              <option value="">Choose a program or class</option>
              {settings.data.scopes.map((item) => (
                <option key={item.scopeId} value={item.scopeId}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          {scope && (
            <ReviewerPicker
              key={`${scope.scopeType}:${scope.scopeId}`}
              scope={{ scopeId: scope.scopeId, scopeType: scope.scopeType }}
              userId={userId}
            />
          )}
        </section>
      )}
    </div>
  );
}
