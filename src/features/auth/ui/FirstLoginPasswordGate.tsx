import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '@/entities/user';
import { useAuthStore, useUser } from '@/shared/model/authStore';
import { toast } from '@/shared/ui';

/** Password setup precedes subscriptions and teaching routes. Real data APIs enforce the signed flag too. */
export default function FirstLoginPasswordGate({ children,force=false }: { children: ReactNode;force?:boolean }) {
  const user = useUser();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  if (!force&&user?.user_metadata?.must_change_password !== true) return <>{children}</>;

  async function finish() {
    try { await useAuthStore.getState().logout(); navigate('/login', { replace: true }); }
    catch { toast.error('Sign out and sign in again to complete account setup.'); }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow" onSubmit={async event => {
        event.preventDefault();
        if (busy) return;
        if (password !== confirmation) { toast.error('New passwords do not match.'); return; }
        if (password.length < 10 || password.length > 72 ||
            [/[A-Z]/, /[a-z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(pattern => pattern.test(password)).length < 3) {
          toast.error('Use 10–72 characters with at least three of uppercase, lowercase, numbers and symbols.'); return;
        }
        setBusy(true);
        try {
          await updatePassword(password, current);
          setCurrent(''); setPassword(''); setConfirmation('');
          toast.success('Password changed. Sign in with your new password.');
          await finish();
        } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to change password.'); }
        finally { setBusy(false); }
      }}>
        <h1 className="text-xl font-semibold">{force?'Change your educator password':'Set your educator password'}</h1>
        <p className="text-sm text-gray-600">Replace the temporary password before opening your assigned classes.</p>
        <label className="block">{force?'Current password':'Temporary password'}<input type="password" required autoComplete="current-password"
          value={current} onChange={event => setCurrent(event.target.value)} className="mt-1 w-full rounded border p-2" /></label>
        <label className="block">New password<input type="password" required autoComplete="new-password"
          value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded border p-2" /></label>
        <label className="block">Confirm new password<input type="password" required autoComplete="new-password"
          value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-1 w-full rounded border p-2" /></label>
        <button disabled={busy} type="submit" className="w-full rounded bg-indigo-600 p-2 text-white disabled:opacity-50">
          {busy ? 'Changing password…' : 'Change password'}
        </button>
        <button disabled={busy} type="button" onClick={finish} className="w-full rounded border p-2">Sign out</button>
      </form>
    </main>
  );
}
