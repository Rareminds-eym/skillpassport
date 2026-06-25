import React from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useAuthStore } from '@/shared/model/authStore';

const BYPASS_STORAGE_KEY = 'sp_maintenance_bypass';

export const MaintenanceBanner: React.FC = () => {
  const { logout, isAuthenticated } = useAuthStore();

  const handleExit = () => {
    // Clear the bypass token so the user gets sent back to the maintenance screen
    localStorage.removeItem(BYPASS_STORAGE_KEY);
    if (isAuthenticated) {
      logout();
    } else {
      // Force reload to re-evaluate the guard
      window.location.reload();
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full z-[9999] bg-orange-600/90 backdrop-blur-sm text-white px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
      <AlertTriangle className="h-5 w-5 animate-pulse text-orange-200" />
      <span className="font-semibold tracking-wide text-sm md:text-base">
        Maintenance Mode Active
      </span>
      <span className="hidden md:inline text-orange-100/80 text-sm">
        — Public access is currently restricted. You have bypass access.
      </span>
      <button
        onClick={handleExit}
        className="ml-4 flex items-center gap-1.5 px-3 py-1 text-sm font-semibold bg-white/20 hover:bg-white/30 rounded-md transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        Exit Bypass
      </button>
    </div>
  );
};
