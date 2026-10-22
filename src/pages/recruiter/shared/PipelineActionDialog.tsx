import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiPost } from "@/shared/api/apiClient";
import {
  AccessibleModal,
  buttonClass,
  primaryClass,
  inputClass,
  useWorkspaceKey,
} from "./RecruitmentControls";
type Candidate = { id: string; name: string; phone?: string; email?: string };
export type PipelineAction = "email" | "whatsapp" | "assign" | "reject";
export function PipelineActionDialog({
  action,
  candidates,
  onClose,
  onSaved,
}: {
  action: PipelineAction;
  candidates: Candidate[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [subject, setSubject] = useState(""),
    [message, setMessage] = useState(""),
    [assignee, setAssignee] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [results, setResults] = useState<any[]>([]);
  const [requestKey] = useState(() => crypto.randomUUID());
  const members = useQuery({
    queryKey: useWorkspaceKey("pipeline-members"),
    queryFn: async () => {
      const response = await apiPost<any>("/recruiter/pipeline-actions", {
        action: "members",
      });
      if (!response.success)
        throw new Error(response.error?.message || "Team could not be loaded");
      return response.data || [];
    },
    enabled: action === "assign",
  });
  const title = {
    email: "Email candidates",
    whatsapp: "Prepare WhatsApp messages",
    assign: "Assign candidates",
    reject: "Reject candidates",
  }[action];
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await apiPost<any>("/recruiter/pipeline-actions", {
        action,
        ids: candidates.map((c) => c.id),
        assignee: assignee || undefined,
        reason: action === "reject" ? message : undefined,
        subject: subject || undefined,
        message: message || undefined,
        requestKey,
      });
      if (!response.success)
        throw new Error(response.error?.message || "Action failed");
      if (action === "email") setResults(response.data.results);
      else onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AccessibleModal title={title} onClose={onClose} busy={busy}>
      <div className="flex min-h-full items-center justify-center bg-black/40 p-4">
        <section className="max-h-[90dvh] w-full max-w-xl overflow-auto rounded-xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {candidates.length} selected:{" "}
            {candidates.map((c) => c.name).join(", ")}
          </p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            {action === "assign" ? (
              <label className="block text-sm font-medium">
                Team member
                <select
                  className={inputClass}
                  required
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  disabled={members.isLoading || busy}
                >
                  <option value="">Select an active member</option>
                  {(members.data || []).map((member: any) => (
                    <option key={member.id} value={member.id}>
                      {[member.firstName, member.lastName]
                        .filter(Boolean)
                        .join(" ") || member.id}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                {action === "email" && (
                  <label className="block text-sm font-medium">
                    Subject
                    <input
                      required
                      maxLength={200}
                      className={inputClass}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={busy || results.length > 0}
                    />
                  </label>
                )}
                <label className="block text-sm font-medium">
                  {action === "reject" ? "Rejection reason" : "Message"}
                  <textarea
                    required
                    maxLength={action === "reject" ? 2000 : 10000}
                    rows={5}
                    className={inputClass}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={busy || results.length > 0}
                  />
                </label>
              </>
            )}
            {action === "reject" && (
              <p className="text-sm text-red-800">
                This updates the pipeline and linked application status. The
                reason is kept in the activity history.
              </p>
            )}
            {action === "whatsapp" && (
              <>
                <p className="text-sm text-gray-600">
                  Open each draft to review and send it in WhatsApp. Opening a
                  draft does not send a message.
                </p>
                <ul className="space-y-2">
                  {candidates.map((candidate) => {
                    const phone = (candidate.phone || "").replace(/\D/g, "");
                    return (
                      <li key={candidate.id}>
                        {phone.length >= 8 && message.trim() ? (
                          <a
                            className="text-primary-800 underline"
                            href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open draft for {candidate.name}
                          </a>
                        ) : (
                          <span className="text-gray-600">
                            {candidate.name}:{" "}
                            {phone.length < 8
                              ? "phone number unavailable"
                              : "enter a message to prepare draft"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {action === "email" && (
              <p className="text-sm text-gray-600">
                Up to 20 recipients. Each candidate receives a separate email.
                Submission confirms provider acceptance, not delivery.
              </p>
            )}
            {(error || members.isError) && (
              <p role="alert" className="text-sm text-red-800">
                {error || "Team members could not be loaded."}
              </p>
            )}
            {results.length > 0 && (
              <ul role="status" className="space-y-2 text-sm">
                {results.map((result) => (
                  <li key={result.id}>
                    {result.name}:{" "}
                    {result.state === "submitted"
                      ? "Submitted to email service"
                      : "Outcome unconfirmed. Check with support before sending again."}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className={buttonClass}
                disabled={busy}
                onClick={onClose}
              >
                Close
              </button>
              {action !== "whatsapp" && results.length === 0 && (
                <button
                  className={primaryClass}
                  disabled={
                    busy ||
                    !candidates.length ||
                    (action === "assign" && !assignee) ||
                    (action === "email" && candidates.length > 20)
                  }
                >
                  {busy
                    ? "Saving…"
                    : action === "email"
                      ? "Send emails"
                      : action === "assign"
                        ? "Save assignment"
                        : "Confirm rejection"}
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </AccessibleModal>
  );
}
