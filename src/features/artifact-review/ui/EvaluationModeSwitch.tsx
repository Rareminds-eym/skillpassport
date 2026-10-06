import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type EvaluationMode, saveEvaluationMode } from "../api/reviews";

const OPTIONS = [
  [
    "ai_first",
    "AI first",
    "AI evaluates each submission. Uncertain or unreadable work goes to a human reviewer.",
  ],
  [
    "human_only",
    "Human review only",
    "AI is not used. Every submission goes straight to an educator and is not sent to any AI service.",
  ],
] as const;

/**
 * One switch for the whole organization (school or college). It applies to every
 * learner, whatever the course, class or program.
 */
export default function EvaluationModeSwitch({
  organizationId,
  name,
  value,
}: {
  organizationId: string;
  name: string;
  value: EvaluationMode;
}) {
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (evaluationMode: EvaluationMode) =>
      saveEvaluationMode({ organizationId, evaluationMode }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["review-evaluation-settings"] }),
  });
  return (
    <fieldset className="mt-6 rounded-xl border bg-white p-5" disabled={save.isPending}>
      <legend className="px-1 text-sm font-semibold">
        How should learner artifacts be evaluated at {name}?
      </legend>
      {OPTIONS.map(([mode, label, help]) => (
        <label key={mode} className="mt-3 flex items-start gap-3">
          <input
            type="radio"
            name={`evaluation-mode-${organizationId}`}
            className="mt-1"
            checked={value === mode}
            onChange={() => save.mutate(mode)}
          />
          <span>
            <span className="block text-sm font-semibold">{label}</span>
            <span className="block text-sm text-slate-600">{help}</span>
          </span>
        </label>
      ))}
      <p className="mt-4 text-xs text-slate-500">
        Applies to every learner and every course, for new submissions only. Reviews already in
        progress are not changed.
      </p>
      {save.isPending && (
        <p role="status" className="mt-2 text-sm">
          Saving…
        </p>
      )}
      {save.error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {save.error.message}
        </p>
      )}
    </fieldset>
  );
}
