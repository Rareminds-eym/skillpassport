import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, KeyRound, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { apiGet, apiPost } from "@/shared/api/apiClient";
import { useUser } from "@/shared/model/authStore";
import { useOrgContext } from "@/entities/recruitment/model/useOrgContext";
import { SubscriptionSettingsSection } from "@/features/subscription";
import { PASSWORD_MIN } from "@/shared/constants";
import { Frame } from "./components/RequisitionDialogs";
import {
  LoadState,
  inputClass,
  buttonClass,
  primaryClass,
  useWorkspaceKey,
} from "./shared/RecruitmentControls";
type Preferences = {
  emailNotifications: boolean;
  realtimeAlerts: boolean;
  weeklyReports: boolean;
};
export default function SettingsPage() {
  const user = useUser(),
    { organizationName } = useOrgContext(),
    key = useWorkspaceKey("preferences"),
    client = useQueryClient();
  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const r = await apiGet<{
        data: {
          preferences: Preferences;
          security: { mfaAvailable: boolean; mfaManagedBy: string };
        };
      }>("/recruiter/preferences");
      return r.data;
    },
  });
  const [form, setForm] = useState<Preferences>({
      emailNotifications: true,
      realtimeAlerts: true,
      weeklyReports: false,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [password, setPassword] = useState(false);
  useEffect(() => {
    if (query.data) setForm(query.data.preferences);
  }, [query.data]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiPost("/recruiter/preferences", form);
      await client.invalidateQueries({ queryKey: key });
      toast.success("Notification preferences saved");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Preferences could not be saved",
      );
    } finally {
      setBusy(false);
    }
  }
  const fields = [
    ["Full name", user?.name || "Not provided"],
    ["Email", user?.email || "Not provided"],
    ["Organization", organizationName || "Not available"],
    ["Phone", "Not provided"],
  ];
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">
          Workspace preferences
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage recruitment notifications and account security.
        </p>
      </header>
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Recruiter profile
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-600">
                {label}
              </dt>
              <dd className="mt-2 break-words text-sm text-gray-900">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Bell className="h-5 w-5" />
          Notifications
        </h2>
        <LoadState
          loading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        />
        {query.data && (
          <form className="mt-4 space-y-4" onSubmit={save}>
            {(
              [
                [
                  "emailNotifications",
                  "Email notifications",
                  "Updates about your recruitment activity.",
                ],
                [
                  "realtimeAlerts",
                  "Real-time alerts",
                  "New activity and candidate updates.",
                ],
                [
                  "weeklyReports",
                  "Weekly reports",
                  "A summary of your recruitment activity.",
                ],
              ] as const
            ).map(([field, label, description]) => (
              <label
                key={field}
                className="flex cursor-pointer items-center justify-between gap-5 rounded-lg border border-gray-200 p-4"
              >
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm text-gray-600">
                    {description}
                  </span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  className="h-5 w-5 shrink-0 accent-primary-700"
                  checked={form[field]}
                  disabled={busy}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.checked })
                  }
                />
              </label>
            ))}
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <button
                disabled={
                  busy ||
                  JSON.stringify(form) ===
                    JSON.stringify(query.data.preferences)
                }
                className={primaryClass}
              >
                {busy ? "Saving…" : "Save preferences"}
              </button>
            </div>
          </form>
        )}
      </section>
      <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <ShieldCheck className="h-5 w-5" />
          Security
        </h2>
        <div className="rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900">
            Two-factor authentication
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Additional sign-in verification is managed by your identity
            provider. This sign-in service does not currently expose
            authenticator enrollment in the recruitment workspace.
          </p>
          <p className="mt-2 text-xs font-medium text-gray-700">
            Provider-managed · enrollment unavailable here
          </p>
        </div>
        <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Password</h3>
            <p className="mt-1 text-sm text-gray-600">
              Change your password using your current credentials.
            </p>
          </div>
          <button
            type="button"
            className={buttonClass}
            onClick={() => setPassword(true)}
          >
            <KeyRound className="h-4 w-4" />
            Update password
          </button>
        </div>
      </section>
      <SubscriptionSettingsSection />
      {password && <PasswordDialog close={() => setPassword(false)} />}
    </div>
  );
}
function PasswordDialog({ close }: { close: () => void }) {
  const [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setError("The new passwords do not match");
      return;
    }
    if (next === current) {
      setError("Choose a password different from your current password");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiPost("/auth/change-password", {
        current_password: current,
        new_password: next,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password updated");
      close();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Password could not be changed",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Frame
      title="Update password"
      description={`Use at least ${PASSWORD_MIN} characters. Your identity provider verifies the current password.`}
      onClose={close}
      busy={busy}
      small
    >
      <form onSubmit={save} className="space-y-5 p-6">
        <label className="block text-sm font-medium text-gray-800">
          Current password
          <input
            autoComplete="current-password"
            type="password"
            required
            className={inputClass + " mt-2"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-gray-800">
          New password
          <input
            autoComplete="new-password"
            type="password"
            required
            minLength={PASSWORD_MIN}
            maxLength={128}
            className={inputClass + " mt-2"}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-gray-800">
          Confirm new password
          <input
            autoComplete="new-password"
            type="password"
            required
            className={inputClass + " mt-2"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          <button className={primaryClass} disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </Frame>
  );
}
