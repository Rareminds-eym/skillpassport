import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  PencilLine,
  Trash2,
  Plus,
  FileText,
  CheckCircle,
} from "lucide-react";
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
type Project = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  deadline: string | null;
  updated_at: string;
  proposals?: { count: number }[];
  milestones?: { count: number }[];
};
type Permissions = {
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean;
};
type RecordItem = {
  id: string;
  updated_at: string;
  status: string;
  title?: string;
  description?: string;
  amount?: number | null;
  due_date?: string | null;
  learner_id?: string;
  learner?: { name: string };
  cover_letter?: string;
};
async function call<T>(body: unknown) {
  const r = await apiPost<{ data: T }>("/recruiter/projects", body);
  return r.data;
}
const amount = (v: number | null | undefined) =>
  v == null
    ? "Not specified"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(v);
export default function ProjectHiring() {
  const key = useWorkspaceKey("projects"),
    client = useQueryClient();
  const [search, setSearch] = useState(""),
    [tab, setTab] = useState("all"),
    [editing, setEditing] = useState<Project | "new" | null>(null),
    [view, setView] = useState<string | null>(null),
    [deleting, setDeleting] = useState<Project | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      call<{ projects: Project[]; permissions: Permissions }>({
        action: "list",
      }),
  });
  const permissions = query.data?.permissions || {
    create: false,
    edit: false,
    delete: false,
    manage: false,
  };
  const projects = (query.data?.projects || []).filter(
    (p) =>
      `${p.title} ${p.description}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (tab === "all" ||
        (tab === "contracts" && p.status === "in_progress") ||
        (tab === "proposals" && !!p.proposals?.[0]?.count) ||
        (tab === "milestones" && !!p.milestones?.[0]?.count)),
  );
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await call({ action: "delete", projectId: deleting.id });
      setDeleting(null);
      toast.success("Draft project deleted");
      void client.invalidateQueries({ queryKey: key });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Project could not be deleted");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">
            Delivery workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            Project hiring
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Manage project briefs, candidate proposals, and delivery milestones.
          </p>
        </div>
        <button
          type="button"
          className={primaryClass}
          disabled={!permissions.create}
          onClick={() => setEditing("new")}
        >
          <Plus className="h-4 w-4" />
          Create project
        </button>
      </header>
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Project views"
          className="flex flex-wrap gap-2"
        >
          {[
            ["all", "All projects"],
            ["contracts", "Active contracts"],
            ["proposals", "Proposals"],
            ["milestones", "Milestones"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={
                buttonClass +
                (tab === value
                  ? " border-primary-300 bg-primary-50 text-primary-800"
                  : "")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <label className="sm:w-72">
          <span className="sr-only">Search projects</span>
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project briefs"
          />
        </label>
      </div>
      <LoadState
        loading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
      />
      {!query.isLoading &&
        !query.error &&
        (projects.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {projects.map((p) => (
              <article
                key={p.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {p.title}
                  </h2>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                    {p.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-gray-600">
                  {p.description || "No description supplied."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-primary-50 px-2 py-1 text-xs text-primary-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
                  <div>
                    <dt className="text-gray-600">Budget</dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {amount(p.budget_min)}
                      {p.budget_max != null ? " – " + amount(p.budget_max) : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Deadline</dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {p.deadline || "Not specified"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-600">
                    {p.proposals?.[0]?.count || 0} proposals ·{" "}
                    {p.milestones?.[0]?.count || 0} milestones
                  </p>
                  <div className="flex gap-2">
                    <ActionButton
                      label={`View ${p.title}`}
                      icon={Eye}
                      onClick={() => setView(p.id)}
                    />
                    <ActionButton
                      label={`Edit ${p.title}`}
                      icon={PencilLine}
                      disabled={!permissions.edit}
                      onClick={() => setEditing(p)}
                      explanation={
                        !permissions.edit
                          ? "Project editing permission is required"
                          : undefined
                      }
                    />
                    <ActionButton
                      label={`Delete ${p.title}`}
                      icon={Trash2}
                      danger
                      disabled={
                        !permissions.delete ||
                        p.status !== "draft" ||
                        !!p.proposals?.[0]?.count
                      }
                      explanation={
                        !permissions.delete
                          ? "Organization administrator permission is required"
                          : p.status !== "draft"
                            ? "Cancel active projects to retain their history"
                            : undefined
                      }
                      onClick={() => setDeleting(p)}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-gray-500" />
            <h2 className="mt-4 font-semibold text-gray-900">
              No matching projects
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Create a project brief to start collecting proposals and tracking
              delivery.
            </p>
          </section>
        ))}
      {editing && (
        <ProjectEditor
          project={editing === "new" ? null : editing}
          close={() => setEditing(null)}
          saved={() => {
            setEditing(null);
            void client.invalidateQueries({ queryKey: key });
          }}
        />
      )}
      {view && (
        <ProjectDetails
          projectId={view}
          permissions={permissions}
          close={() => {
            setView(null);
            void client.invalidateQueries({ queryKey: key });
          }}
        />
      )}
      {deleting && (
        <Frame
          title="Delete draft project?"
          description={deleting.title}
          busy={busy}
          onClose={() => setDeleting(null)}
          small
        >
          <div className="space-y-5 p-6">
            <p className="text-sm text-gray-700">
              This removes the draft and its planning milestones. Projects with
              proposals are retained for hiring history.
            </p>
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className={buttonClass}
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={buttonClass + " border-red-300 text-red-700"}
                disabled={busy}
                onClick={() => void remove()}
              >
                {busy ? "Deleting…" : "Delete draft"}
              </button>
            </div>
          </div>
        </Frame>
      )}
    </div>
  );
}
function ProjectEditor({
  project,
  close,
  saved,
}: {
  project: Project | null;
  close: () => void;
  saved: () => void;
}) {
  const [form, setForm] = useState({
      title: project?.title || "",
      description: project?.description || "",
      skills: project?.skills.join(", ") || "",
      budget_min: project?.budget_min?.toString() || "",
      budget_max: project?.budget_max?.toString() || "",
      status: project?.status || "draft",
      deadline: project?.deadline || "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await call({
        action: "save",
        project: {
          ...form,
          id: project?.id,
          skills: [
            ...new Set(
              form.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            ),
          ],
          budget_min: form.budget_min ? Number(form.budget_min) : null,
          budget_max: form.budget_max ? Number(form.budget_max) : null,
          deadline: form.deadline || null,
          expectedUpdatedAt: project?.updated_at,
        },
      });
      toast.success(project ? "Project updated" : "Project created");
      saved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Project could not be saved");
    } finally {
      setBusy(false);
    }
  }
  const field = (key: keyof typeof form, label: string, type = "text") => (
    <label className="block text-sm font-medium text-gray-800">
      {label}
      <input
        type={type}
        className={inputClass + " mt-2"}
        required={key === "title"}
        maxLength={key === "title" ? 200 : undefined}
        min={type === "number" ? 0 : undefined}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <Frame
      title={project ? "Edit project" : "Create project"}
      description="Define the work, budget, and delivery expectations."
      onClose={close}
      busy={busy}
    >
      <form onSubmit={save} className="space-y-5 overflow-y-auto p-6">
        {field("title", "Project title")}
        <label className="block text-sm font-medium text-gray-800">
          Project brief
          <textarea
            rows={5}
            maxLength={20000}
            className={inputClass + " mt-2"}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        {field("skills", "Skills, separated by commas")}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("budget_min", "Minimum budget (INR)", "number")}
          {field("budget_max", "Maximum budget (INR)", "number")}
          {field("deadline", "Delivery deadline", "date")}
          <label className="block text-sm font-medium text-gray-800">
            Status
            <select
              className={inputClass + " mt-2"}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {["draft", "open", "in_progress", "completed", "cancelled"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button className={primaryClass} disabled={busy}>
            {busy ? "Saving…" : "Save project"}
          </button>
        </div>
      </form>
    </Frame>
  );
}
function ProjectDetails({
  projectId,
  permissions,
  close,
}: {
  projectId: string;
  permissions: Permissions;
  close: () => void;
}) {
  const key = useWorkspaceKey("project-" + projectId),
    client = useQueryClient();
  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      call<{
        project: Project;
        proposals: RecordItem[];
        milestones: RecordItem[];
      }>({ action: "detail", projectId }),
  });
  const [editing, setEditing] = useState<{
      kind: "proposal" | "milestone";
      record: RecordItem | null;
    } | null>(null),
    [removing, setRemoving] = useState<{
      kind: string;
      record: RecordItem;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function remove() {
    if (!removing) return;
    setBusy(true);
    setError("");
    try {
      await call({
        action: removing.kind + "-delete",
        projectId,
        id: removing.record.id,
        expectedUpdatedAt: removing.record.updated_at,
      });
      setRemoving(null);
      void client.invalidateQueries({ queryKey: key });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Record could not be deleted");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Frame
      title={query.data?.project.title || "Project details"}
      description="Proposals, agreed work, and delivery milestones."
      onClose={close}
    >
      <div className="space-y-7 overflow-y-auto p-6">
        <LoadState
          loading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        />
        {query.data && (
          <>
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {query.data.project.description || "No brief supplied."}
            </p>
            {(["proposal", "milestone"] as const).map((kind) => (
              <section key={kind}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {kind === "proposal"
                      ? "Candidate proposals"
                      : "Delivery milestones"}
                  </h2>
                  <button
                    type="button"
                    disabled={!permissions.manage}
                    className={buttonClass}
                    onClick={() => setEditing({ kind, record: null })}
                  >
                    <Plus className="h-4 w-4" />
                    Add {kind}
                  </button>
                </div>
                <div className="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200">
                  {query.data[
                    kind === "proposal" ? "proposals" : "milestones"
                  ].map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-start justify-between gap-3 p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {r.title || r.learner?.name || "Candidate"}
                          {r.status === "accepted" && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-800">
                              <CheckCircle className="h-3 w-3" />
                              Active contract
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {r.status} · {amount(r.amount)}
                          {r.due_date ? " · Due " + r.due_date : ""}
                        </p>
                        <p className="mt-2 max-w-xl whitespace-pre-wrap text-sm text-gray-700">
                          {r.description || r.cover_letter}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <ActionButton
                          label={`Edit ${kind}`}
                          icon={PencilLine}
                          disabled={
                            !permissions.manage ||
                            ["accepted", "approved"].includes(r.status)
                          }
                          explanation={
                            ["accepted", "approved"].includes(r.status)
                              ? "Agreed work is retained in project history"
                              : undefined
                          }
                          onClick={() => setEditing({ kind, record: r })}
                        />
                        <ActionButton
                          label={`Delete ${kind}`}
                          icon={Trash2}
                          danger
                          disabled={
                            !permissions.manage ||
                            ["accepted", "approved"].includes(r.status)
                          }
                          onClick={() => {
                            setError("");
                            setRemoving({ kind, record: r });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {!query.data[kind === "proposal" ? "proposals" : "milestones"]
                    .length && (
                    <p className="p-5 text-sm text-gray-600">
                      No {kind}s recorded.
                    </p>
                  )}
                </div>
              </section>
            ))}
          </>
        )}
        {editing && (
          <RecordEditor
            projectId={projectId}
            {...editing}
            close={() => setEditing(null)}
            saved={() => {
              setEditing(null);
              void client.invalidateQueries({ queryKey: key });
            }}
          />
        )}
        {removing && (
          <Frame
            title={`Delete ${removing.kind}?`}
            description="This removes the selected project record."
            onClose={() => setRemoving(null)}
            busy={busy}
            small
          >
            <div className="space-y-4 p-6">
              {error && (
                <p role="alert" className="text-red-700">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={busy}
                  onClick={() => setRemoving(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={buttonClass + " text-red-700"}
                  disabled={busy}
                  onClick={() => void remove()}
                >
                  Delete
                </button>
              </div>
            </div>
          </Frame>
        )}
      </div>
    </Frame>
  );
}
function RecordEditor({
  projectId,
  kind,
  record,
  close,
  saved,
}: {
  projectId: string;
  kind: "proposal" | "milestone";
  record: RecordItem | null;
  close: () => void;
  saved: () => void;
}) {
  const [form, setForm] = useState({
      title: record?.title || "",
      description: record?.description || "",
      amount: record?.amount?.toString() || "",
      due_date: record?.due_date || "",
      learner_id: record?.learner_id || "",
      cover_letter: record?.cover_letter || "",
      status: record?.status || (kind === "proposal" ? "submitted" : "planned"),
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const candidates = useQuery({
    queryKey: useWorkspaceKey("proposal-candidates"),
    enabled: kind === "proposal",
    queryFn: async () => {
      const r = await apiPost<{ data: { id: string; name: string }[] }>(
        "/recruiter/actions",
        { action: "list-learners" },
      );
      return r.data || [];
    },
  });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values =
        kind === "milestone"
          ? {
              id: record?.id,
              title: form.title,
              description: form.description,
              amount: form.amount ? Number(form.amount) : null,
              due_date: form.due_date || null,
              status: form.status,
            }
          : {
              id: record?.id,
              learner_id: form.learner_id,
              cover_letter: form.cover_letter,
              amount: form.amount ? Number(form.amount) : null,
              status: form.status,
            };
      await call({ action: kind + "-save", projectId, record: { ...values, expectedUpdatedAt: record?.updated_at } });
      toast.success("Project record saved");
      saved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Record could not be saved");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Frame
      title={`${record ? "Edit" : "Add"} ${kind}`}
      description={
        kind === "proposal"
          ? "Record a candidate’s proposal. Accepting it starts the contract."
          : "Define a delivery outcome and track its approval."
      }
      onClose={close}
      busy={busy}
      small
    >
      <form onSubmit={save} className="space-y-5 overflow-y-auto p-6">
        {kind === "proposal" ? (
          <label className="block text-sm font-medium text-gray-800">
            Candidate
            <select
              required
              className={inputClass + " mt-2"}
              value={form.learner_id}
              onChange={(e) => setForm({ ...form, learner_id: e.target.value })}
            >
              <option value="">Choose a candidate</option>
              {candidates.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block text-sm font-medium text-gray-800">
            Milestone title
            <input
              required
              maxLength={200}
              className={inputClass + " mt-2"}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
        )}
        <label className="block text-sm font-medium text-gray-800">
          {kind === "proposal" ? "Proposal details" : "Description"}
          <textarea
            rows={4}
            className={inputClass + " mt-2"}
            value={kind === "proposal" ? form.cover_letter : form.description}
            onChange={(e) =>
              setForm({
                ...form,
                [kind === "proposal" ? "cover_letter" : "description"]:
                  e.target.value,
              })
            }
          />
        </label>
        <label className="block text-sm font-medium text-gray-800">
          Amount (INR)
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass + " mt-2"}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </label>
        {kind === "milestone" && (
          <label className="block text-sm font-medium text-gray-800">
            Due date
            <input
              type="date"
              className={inputClass + " mt-2"}
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </label>
        )}
        <label className="block text-sm font-medium text-gray-800">
          Status
          <select
            className={inputClass + " mt-2"}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {(kind === "proposal"
              ? [
                  "submitted",
                  "shortlisted",
                  ...(record ? ["accepted"] : []),
                  "rejected",
                  "withdrawn",
                ]
              : ["planned", "in_progress", "submitted", "approved"]
            ).map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button className={primaryClass} disabled={busy}>
            {busy ? "Saving…" : "Save " + kind}
          </button>
        </div>
      </form>
    </Frame>
  );
}
