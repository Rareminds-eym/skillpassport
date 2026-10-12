import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ReviewNavigationGuard } from "./ReviewNavigationGuard";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DocumentArrowDownIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import {
  useReviewQueue,
  useReviewDetail,
  useReviewMutations,
} from "../model/hooks";
import { downloadReviewFile, type ReviewDetail } from "../api/reviews";

const button =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const field =
  "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";
const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Awaiting assignment";

export function PendingReviewsWidget() {
  const queue = useReviewQueue();
  if (!queue.data) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Artifact reviews</h2>
        <Link
          className="text-sm font-semibold text-indigo-700"
          to="/educator/reviews"
        >
          Open queue →
        </Link>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {queue.data.items.length}
        {queue.data.hasMore ? "+" : ""} reviews on this page
      </p>
      {queue.data.items.slice(0, 3).map((item) => (
        <Link
          key={item.id}
          to={`/educator/reviews/${item.id}`}
          className="mt-3 block text-sm text-slate-700"
        >
          {item.status.replace(/_/g, " ")} · due {date(item.due_by)}
        </Link>
      ))}
    </section>
  );
}

export default function ReviewWorkspace() {
  const { id } = useParams();
  return id ? <Detail id={id} key={id} /> : <Queue />;
}
function Queue() {
  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState<Array<string | null>>([null]);
  const queue = useReviewQueue(cursors[page - 1] ?? null);
  return (
    <main className="mx-auto max-w-6xl p-6 lg:p-10">
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">
        Teaching workspace
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        Artifact reviews
      </h1>
      <p className="mt-3 max-w-xl text-slate-600">
        Read the learner’s evidence, apply the rubric, and give clear next
        steps.
      </p>
      {queue.isPending && (
        <p role="status" className="mt-8">
          Loading your review queue…
        </p>
      )}
      {queue.error && (
        <p role="alert" className="mt-8 text-red-700">
          {queue.error.message}{" "}
          <button onClick={() => void queue.refetch()} className="underline">
            Retry
          </button>
        </p>
      )}
      {queue.data && (
        <>
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid grid-cols-3 border-b bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Review</span>
              <span>Status</span>
              <span>Due</span>
            </div>
            {queue.data.items.length === 0 ? (
              <p className="p-8 text-slate-600">No reviews waiting here.</p>
            ) : (
              queue.data.items.map((item, index) => (
                <Link
                  key={item.id}
                  to={`/educator/reviews/${item.id}`}
                  className="grid grid-cols-3 items-center gap-3 border-b border-slate-100 px-6 py-5 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-indigo-600"
                >
                  <span className="font-semibold text-slate-900">
                    Artifact {index + 1 + (page - 1) * 25}
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      {item.scope_type === "school_class"
                        ? "School"
                        : "College"}{" "}
                      · rubric v{item.rubric_snapshot.version}
                    </span>
                  </span>
                  <span className="text-sm capitalize text-slate-600">
                    {item.status.replace(/_/g, " ")}
                  </span>
                  <span className="flex items-center justify-between gap-2 text-sm text-slate-600">
                    {date(item.due_by)}
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </Link>
              ))
            )}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <button
              className={button}
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">Page {page}</span>
            <button
              className={button}
              disabled={!queue.data.hasMore}
              onClick={() => {
                setCursors([...cursors.slice(0, page), queue.data.nextCursor]);
                setPage(page + 1);
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}
function Detail({ id }: { id: string }) {
  const detail = useReviewDetail(id);
  if (detail.isPending)
    return (
      <p role="status" className="p-8">
        Loading review…
      </p>
    );
  if (detail.error || !detail.data)
    return (
      <div className="p-8">
        <p role="alert">{detail.error?.message ?? "Review unavailable"}</p>
        <Link to="/educator/reviews" className="mt-4 inline-block underline">
          Back to queue
        </Link>
      </div>
    );
  return <ReviewForm data={detail.data} />;
}
function ReviewForm({ data }: { data: ReviewDetail }) {
  const { review } = data;
  const { start, complete } = useReviewMutations(review.id);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [decision, setDecision] = useState("revise_and_resubmit");
  const [feedback, setFeedback] = useState("");
  const [actions, setActions] = useState("");
  const [rationale, setRationale] = useState("");
  const [critical, setCritical] = useState(false);
  const [fileError, setFileError] = useState("");
  const requestRef = useRef<{ body: string; key: string } | null>(null);
  const dirty =
    !!feedback ||
    !!rationale ||
    !!actions ||
    critical ||
    Object.values(evidence).some(Boolean) ||
    Object.keys(scores).length > 0;
  const terminal = ["completed", "returned"].includes(review.status);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty && !terminal) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty, terminal]);
  const score = Math.round(
    (review.rubric_snapshot.criteria.reduce(
      (sum, c) => sum + (scores[c.id] ?? 0),
      0,
    ) /
      15) *
      100,
  );
  const canPass =
    !critical &&
    review.rubric_snapshot.criteria.every(
      (c) => (scores[c.id] ?? -1) >= 2 && !!evidence[c.id]?.trim(),
    );
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const body = {
      expectedVersion: review.version,
      decision,
      criteria: review.rubric_snapshot.criteria.map((c) => ({
        id: c.id,
        score: scores[c.id],
        evidence: evidence[c.id] ?? "",
      })),
      feedback,
      actionItems: actions
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
      rationale,
      hasCriticalFailure: critical,
    };
    const serialized = JSON.stringify(body);
    if (requestRef.current?.body !== serialized)
      requestRef.current = { body: serialized, key: crypto.randomUUID() };
    complete.mutate({ body, key: requestRef.current.key });
  };
  return (
    <main className="mx-auto max-w-7xl p-6 lg:p-10">
      <ReviewNavigationGuard dirty={dirty && !terminal} />
      <Link
        to="/educator/reviews"
        className="inline-flex items-center gap-2 text-sm text-slate-600"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Review queue
      </Link>
      <header className="my-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">
            Evidence review · attempt {data.submission.attempt_no}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {[data.learner.first_name, data.learner.last_name]
              .filter(Boolean)
              .join(" ") || "Learner artifact"}
          </h1>
        </div>
        <p className="text-sm text-slate-500">Due {date(review.due_by)}</p>
      </header>
      {terminal && (
        <div
          role="status"
          className="mb-6 flex items-center gap-3 rounded-lg bg-emerald-50 p-5 text-emerald-900"
        >
          <CheckBadgeIcon className="h-6 w-6" />
          Review recorded:{" "}
          {review.status === "completed" ? "Passed" : "Revision requested"}.
        </div>
      )}
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section className="space-y-5">
          <h2 className="text-lg font-semibold">Learner evidence</h2>
          {data.questions.map((question) => {
            const answer = data.answers.find(
              (item) => item.question_id === question.id,
            );
            const url = answer?.url_response;
            return (
              <article
                key={question.id}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <h3 className="font-semibold">{question.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                  {question.description}
                </p>
                <details className="mt-3 text-sm">
                  <summary>Instructions</summary>
                  <pre className="mt-2 whitespace-pre-wrap font-sans">
                    {typeof question.instructions === "string"
                      ? question.instructions
                      : JSON.stringify(question.instructions, null, 2)}
                  </pre>
                </details>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-800">
                  {answer?.text_response || "No written response."}
                </p>
                {url && /^https?:\/\//i.test(url) && (
                  <a
                    className="mt-3 inline-block break-all text-sm text-indigo-700 underline"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {url}
                  </a>
                )}
              </article>
            );
          })}
          {data.templates.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold">Original templates</h3>
              {data.templates.map((template) =>
                /^https?:\/\//i.test(template.file_url) ? (
                  <a
                    key={template.id}
                    href={template.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block text-sm text-indigo-700 underline"
                  >
                    {template.file_name}{" "}
                    {template.version ? `(v${template.version})` : ""}
                  </a>
                ) : (
                  <p key={template.id} className="mt-3 text-sm">
                    {template.file_name} — download unavailable
                  </p>
                ),
              )}
            </section>
          )}
          {data.files.map((file) => (
            <button
              key={file.id}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left text-sm"
              onClick={() => {
                setFileError("");
                void downloadReviewFile(review.id, file).catch((error) =>
                  setFileError(error.message),
                );
              }}
            >
              <DocumentArrowDownIcon className="h-5 w-5 text-indigo-600" />
              {file.file_name}
            </button>
          ))}
          {fileError && (
            <p role="alert" className="text-sm text-red-700">
              {fileError}
            </p>
          )}
          {data.evaluations.map((evaluation) => (
            <details
              key={evaluation.stage}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
            >
              <summary className="cursor-pointer text-sm font-semibold">
                {evaluation.stage === "ai"
                  ? "AI reference"
                  : "Recorded staff review"}{" "}
                · {evaluation.score ?? "—"}/100
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {evaluation.feedback}
              </p>
            </details>
          ))}
        </section>
        <form
          onSubmit={submit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-end justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-semibold">Your review</h2>
              <p className="mt-1 text-xs text-slate-500">
                Rubric v{review.rubric_snapshot.version} · evidence required to
                pass
              </p>
            </div>
            <strong className="text-3xl tabular-nums text-slate-900">
              {score}
              <span className="text-sm font-normal text-slate-400"> /100</span>
            </strong>
          </div>
          {review.status === "pending" && (
            <button
              type="button"
              className={`${button} mb-5 w-full`}
              disabled={start.isPending}
              onClick={() => start.mutate(review)}
            >
              Start review
            </button>
          )}
          <fieldset
            disabled={review.status !== "in_progress" || complete.isPending}
            className="space-y-5"
          >
            {review.rubric_snapshot.criteria.map((c) => (
              <div key={c.id}>
                <label className="flex items-center justify-between gap-4 text-sm font-semibold">
                  {c.label}
                  <select
                    required
                    className="rounded-md border border-slate-300 p-2 font-normal"
                    value={scores[c.id] ?? ""}
                    onChange={(event) =>
                      setScores({
                        ...scores,
                        [c.id]: Number(event.target.value),
                      })
                    }
                  >
                    <option value="" disabled>
                      Score
                    </option>
                    {[0, 1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n} / 3
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-2 block text-xs text-slate-500">
                  Evidence / location in artifact
                  <textarea
                    maxLength={4000}
                    className={`${field} mt-1`}
                    rows={2}
                    value={evidence[c.id] ?? ""}
                    onChange={(event) =>
                      setEvidence({ ...evidence, [c.id]: event.target.value })
                    }
                  />
                </label>
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={critical}
                onChange={(event) => setCritical(event.target.checked)}
              />
              Unresolved critical failure
            </label>
            <label className="block text-sm font-semibold">
              Decision
              <select
                className={`${field} mt-2`}
                value={decision}
                onChange={(event) => setDecision(event.target.value)}
              >
                <option value="revise_and_resubmit">Revise and resubmit</option>
                <option value="pass" disabled={!canPass}>
                  Pass
                </option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Feedback
              <textarea
                required
                maxLength={10000}
                className={`${field} mt-2`}
                rows={4}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Next steps{" "}
              <span className="font-normal text-slate-500">(one per line)</span>
              <textarea
                required={decision === "revise_and_resubmit"}
                className={`${field} mt-2`}
                rows={3}
                value={actions}
                onChange={(event) => setActions(event.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Decision rationale
              <textarea
                required
                maxLength={4000}
                className={`${field} mt-2`}
                rows={2}
                value={rationale}
                onChange={(event) => setRationale(event.target.value)}
              />
            </label>
            <button
              className={`${button} w-full`}
              disabled={complete.isPending || (decision === "pass" && !canPass)}
            >
              {complete.isPending ? "Recording review…" : "Submit review"}
            </button>
          </fieldset>
          {(start.error || complete.error) && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {(start.error || complete.error)?.message} Your edits are
              retained. If the assignment changed, reopen it from the queue.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
