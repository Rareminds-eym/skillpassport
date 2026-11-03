import React from 'react';
import { ShieldAlert, LogOut, PhoneCall } from 'lucide-react';
import { useAuthStore } from '@/shared/model/authStore';

interface AccountDeactivatedScreenProps {
  message?: string;
}

export const AccountDeactivatedScreen: React.FC<AccountDeactivatedScreenProps> = ({
  message = 'Your account has been deactivated. Please contact your college administrator.',
}) => {
  const logout = useAuthStore((state) => state.logout);

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('account_deactivated');
        sessionStorage.removeItem('account_deactivated_message');
      }
      await logout();
    } catch {
      // Ignore cleanup error on sign out
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        {/* Warning Icon Badge */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Account Deactivated
        </h2>

        {/* Subtitle / Reason */}
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
          {message}
        </p>

        {/* Info Box */}
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-4 text-xs text-amber-900 text-left mb-6 space-y-1.5">
          <p className="font-semibold flex items-center gap-1.5">
            <PhoneCall className="h-3.5 w-3.5 text-amber-700" /> Need access restored?
          </p>
          <p className="text-amber-800">
            Reach out to your college portal administrator. Once your administrator reactivates your account, you will be able to sign in and view your modules again.
          </p>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          type="button"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          style={{
            background: 'linear-gradient(90deg, #4f46e5, #4338ca)',
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default AccountDeactivatedScreen;
