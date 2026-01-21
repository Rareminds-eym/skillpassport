import {
  Bell,
  CheckCircle,
  CheckCircle2,
  Database,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  User,
} from 'lucide-react';
import React, { useEffect, useId, useState } from 'react';
import { SubscriptionSettingsSection } from '../../components/Subscription/SubscriptionSettingsSection';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

/* ---------- UI Primitives ---------- */

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  actions,
}: {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="bg-white border rounded-2xl shadow-sm overflow-hidden">
      <header className="flex items-start justify-between gap-4 p-6 border-b">
        <div className="flex items-center gap-3">
          {Icon ? <Icon className="w-5 h-5 text-blue-600 shrink-0" /> : null}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

/** Accessible, controlled toggle button */
function ToggleSwitch({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  const id = useId();
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        enabled ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  desc,
  defaultChecked = false,
}: {
  icon?: React.ElementType;
  title: string;
  desc?: string;
  defaultChecked?: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between gap-6 p-4 border rounded-xl hover:bg-gray-50 transition">
      <div className="flex items-center gap-3">
        {Icon ? <Icon className="w-5 h-5 text-gray-500" /> : null}
        <div className="flex flex-col">
          <p className="font-medium text-gray-900 leading-tight">{title}</p>
          {desc && <p className="text-sm text-gray-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={setEnabled} label={title} />
    </div>
  );
}

/* ---------- Page ---------- */

export default function SettingsPage() {
  const { user } = useAuth();
  const [recruiter, setRecruiter] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecruiter = async () => {
      if (!user?.email) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('recruiters')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching recruiter:', error.message);
      } else {
        setRecruiter(data);
      }
      setLoading(false);
    };

    fetchRecruiter();
  }, [user]);

  if (loading) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading recruiter info...</p>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          View your recruiter details, notifications, and security preferences.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-16 space-y-10">
        {/* Recruiter Profile */}
        <SectionCard
          icon={User}
          title="Recruiter Profile"
          subtitle="View your recruiter details stored in the system."
          actions={
            recruiter?.verificationstatus === 'approved' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                <CheckCircle className="w-4 h-4" />
                Verified
              </span>
            )
          }
        >
          {!recruiter ? (
            <p className="text-gray-500">No recruiter data found for {user?.email}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={recruiter.name || ''}
                  disabled
                  className="w-full rounded-lg border px-4 py-2.5 bg-gray-50 text-gray-800"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={recruiter.email || ''}
                  disabled
                  className="w-full rounded-lg border px-4 py-2.5 bg-gray-50 text-gray-800"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <div className="relative">
                  <input
                    type="text"
                    value={recruiter.phone || ''}
                    disabled
                    className="w-full rounded-lg border pl-10 pr-4 py-2.5 bg-gray-50 text-gray-800"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={recruiter.state || 'Not specified'}
                  disabled
                  className="w-full rounded-lg border px-4 py-2.5 bg-gray-50 text-gray-800"
                />
              </div>

              {/* Website */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <div className="relative">
                  <input
                    type="text"
                    value={recruiter.website || ''}
                    disabled
                    className="w-full rounded-lg border pl-10 pr-4 py-2.5 bg-gray-50 text-gray-800"
                  />
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          icon={Bell}
          title="Notifications"
          subtitle="Choose what you want to be notified about."
        >
          <div className="space-y-4">
            <ToggleRow
              icon={Mail}
              title="Email notifications"
              desc="Receive email updates about important activity."
              defaultChecked
            />
            <ToggleRow
              icon={Bell}
              title="Real-time alerts"
              desc="Get instant alerts for critical events."
              defaultChecked
            />
            <ToggleRow
              icon={RefreshCw}
              title="Weekly reports"
              desc="A summary of your week delivered every Monday."
            />
          </div>
        </SectionCard>

        {/* Security */}
        <SectionCard
          icon={Lock}
          title="Security"
          subtitle="Keep your account protected with these options."
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication (2FA)</p>
                <p className="text-sm text-gray-600">
                  Add a verification step using an authenticator app.
                </p>
              </div>
              <button className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 transition">
                Enable
              </button>
            </div>

            <div className="p-4 border rounded-xl">
              <p className="font-medium text-gray-900 mb-2">Change Password</p>
              <p className="text-sm text-gray-600 mb-4">
                Use a strong password with at least 12 characters, numbers & symbols.
              </p>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border bg-white hover:bg-gray-100 transition">
                <KeyRound className="w-4 h-4" />
                Update Password
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Subscription & Billing */}
        <SubscriptionSettingsSection />

        {/* System Management (super admin only) */}
        {user?.role === 'super_admin' && (
          <SectionCard
            icon={Database}
            title="System Management"
            subtitle="Admin-only utilities for analytics and data hygiene."
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Update Metrics Snapshot</p>
                  <p className="text-sm text-gray-600">
                    Calculate and save a snapshot in{' '}
                    <code className="px-1 py-0.5 rounded bg-gray-100">metrics_snapshots</code> for
                    trend analysis.
                  </p>
                </div>
              </div>
              <button className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                <RefreshCw className="w-4 h-4" />
                Update Metrics Now
              </button>
            </div>
          </SectionCard>
        )}
      </div>
    </main>
  );
}
