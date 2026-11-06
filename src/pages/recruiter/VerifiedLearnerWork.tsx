import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, PencilLine, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { apiPost } from "@/shared/api/apiClient";
import { Frame } from "./components/RequisitionDialogs";
import {
  ActionButton,
  LoadState,
  inputClass,
  buttonClass,
  primaryClass,
  useWorkspaceKey,
} from "./shared/RecruitmentControls";
type Review = {
  id: string;
  status: "pending" | "verified" | "rejected";
  note: string;
  updated_at: string;
  reviewed_by: string;
};
type Work = {
  id: string;
  title: string;
  description: string;
  learnerName: string;
  created_at: string;
  demo_link?: string;
  github_link?: string;
  review: Review | null;
};
const safeUrl = (value?: string) => {
  try {
    const u = new URL(value || "");
    return ["http:", "https:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
};
export default function VerifiedLearnerWork() {
  const key = useWorkspaceKey("work-reviews"),
    client = useQueryClient();
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [view, setView] = useState<Work | null>(null),
    [edit, setEdit] = useState<Work | null>(null);
  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const r = await apiPost<{ data: { work: Work[]; canReview: boolean } }>(
        "/recruiter/work-reviews",
        { action: "list" },
      );
      return r.data;
    },
  });
  const items = (query.data?.work || []).filter(
    (w) =>
      (status === "all" || (w.review?.status || "pending") === status) &&
      `${w.title} ${w.learnerName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">
          Candidate evidence
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">
          Verified learner work
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          Review work submitted by candidates in your organization’s hiring
          pipeline. Decisions belong to your organization and preserve the
          institution’s original approval.
        </p>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Search learner work</span>
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work or candidate"
          />
        </label>
        <label>
          <span className="sr-only">Review status</span>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {["pending", "verified", "rejected"].map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <LoadState
        loading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
      />
      {!query.isLoading &&
        !query.error &&
        (items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((w) => (
              <article
                key={w.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5"
              >
                <p className="text-xs font-medium text-gray-600">
                  {w.learnerName}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-gray-900">
                  {w.title}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-gray-600">
                  {w.description || "No description supplied."}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${w.review?.status === "verified" ? "bg-green-50 text-green-800" : w.review?.status === "rejected" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}
                  >
                    {w.review?.status || "Pending review"}
                  </span>
                  <div className="flex gap-2">
                    <ActionButton
                      label={`View ${w.title}`}
                      icon={Eye}
                      onClick={() => setView(w)}
                    />
                    <ActionButton
                      label={`Review ${w.title}`}
                      icon={PencilLine}
                      disabled={!query.data?.canReview}
                      explanation={
                        !query.data?.canReview
                          ? "Candidate management permission is required"
                          : undefined
                      }
                      onClick={() => setEdit(w)}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h2 className="font-semibold text-gray-900">No matching work</h2>
            <p className="mt-2 text-sm text-gray-600">
              Candidate project submissions will appear here when they are
              available in your hiring pool.
            </p>
          </div>
        ))}
      {view && (
        <Frame
          title={view.title}
          description={view.learnerName}
          onClose={() => setView(null)}
        >
          <div className="space-y-5 overflow-y-auto p-6">
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {view.description || "No description supplied."}
            </p>
            {[view.demo_link, view.github_link].map(
              (url, i) =>
                safeUrl(url) && (
                  <a
                    key={i}
                    href={safeUrl(url)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open {i ? "source code" : "submitted project"}
                  </a>
                ),
            )}
            <section className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-medium text-gray-900">Organization review</h3>
              <p className="mt-2 text-sm text-gray-700">
                {view.review?.note ||
                  "This work has not been reviewed by your organization."}
              </p>
              {view.review && (
                <p className="mt-2 text-xs text-gray-600">
                  Reviewed {new Date(view.review.updated_at).toLocaleString()}
                </p>
              )}
            </section>
          </div>
        </Frame>
      )}
      {edit && (
        <ReviewEditor
          work={edit}
          close={() => setEdit(null)}
          saved={() => {
            void client.invalidateQueries({ queryKey: key });
            setEdit(null);
          }}
        />
      )}
    </div>
  );
}
function ReviewEditor({
  work,
  close,
  saved,
}: {
  work: Work;
  close: () => void;
  saved: () => void;
}) {
  const [status, setStatus] = useState(work.review?.status || "pending"),
    [note, setNote] = useState(work.review?.note || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiPost("/recruiter/work-reviews", {
        action: "review",
        projectId: work.id,
        status,
        note,
        expectedUpdatedAt: work.review?.updated_at || null,
      });
      toast.success("Work review saved");
      saved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review could not be saved");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Frame
      title="Review learner work"
      description={`${work.learnerName} · ${work.title}`}
      onClose={close}
      busy={busy}
      small
    >
      <form onSubmit={save} className="space-y-5 overflow-y-auto p-6">
        <label className="block text-sm font-medium text-gray-800">
          Decision
          <select
            className={inputClass + " mt-2"}
            value={status}
            onChange={(e) => setStatus(e.target.value as Review["status"])}
          >
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-800">
          Review reason
          <textarea
            required
            maxLength={2000}
            rows={4}
            className={inputClass + " mt-2"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            className={buttonClass}
            onClick={close}
          >
            Cancel
          </button>
          <button disabled={busy || !note.trim()} className={primaryClass}>
            {busy ? "Saving…" : "Save review"}
          </button>
        </div>
      </form>
    </Frame>
  );
}
