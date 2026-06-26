import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMaintenanceStore } from '@/shared/model/maintenanceStore';
import { useAuthStore } from '@/shared/model/authStore';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { MaintenanceBanner } from '@/app/components/MaintenanceBanner';
import { Loader2 } from 'lucide-react';

const BYPASS_STORAGE_KEY = 'sp_maintenance_bypass';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMaintenanceMode, activeBypassToken, maintenanceLoading } = useMaintenanceStore();
  const { isAuthenticated, user, loading: isAuthLoading } = useAuthStore();

  // Track the locally stored bypass token in React state so changes trigger re-renders
  const [localBypassToken, setLocalBypassToken] = useState<string | null>(() => {
    return localStorage.getItem(BYPASS_STORAGE_KEY);
  });

  console.log('[MaintenanceGuard] State:', {
    maintenanceLoading,
    isAuthLoading,
    isMaintenanceMode,
    activeBypassToken,
    localBypassToken,
    urlBypassParam: searchParams.get('bypass')
  });

  // On mount, check if there's a ?bypass= param in the URL and persist it
  useEffect(() => {
    const urlToken = searchParams.get('bypass');
    if (urlToken) {
      console.log('[MaintenanceGuard] Found bypass param in URL, saving to local storage:', urlToken);
      localStorage.setItem(BYPASS_STORAGE_KEY, urlToken);
      setLocalBypassToken(urlToken); // Triggers re-render so hasBypassAccess recalculates
      // Clean the URL by removing the bypass parameter
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('bypass');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // If the active token is revoked from sp-dash (realtime update sets it to null),
  // clear the local storage and state so the user gets kicked out immediately
  useEffect(() => {
    if (activeBypassToken === null && localBypassToken !== null) {
      console.log('[MaintenanceGuard] Active token revoked, clearing local token');
      localStorage.removeItem(BYPASS_STORAGE_KEY);
      setLocalBypassToken(null);
    }
  }, [activeBypassToken, localBypassToken]);

  // Determine if the browser has a valid bypass token
  const hasBypassAccess = localBypassToken !== null && localBypassToken === activeBypassToken;

  // If we are still checking auth or maintenance status, show a loader
  if (maintenanceLoading || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  // If maintenance mode is OFF, render normally
  if (!isMaintenanceMode) {
    return <>{children}</>;
  }

  // === Maintenance Mode is ON ===

  // Check if the user is a super_admin (they bypass the block)
  const isSuperAdmin = isAuthenticated && user?.roles?.includes('super_admin');

  if (isSuperAdmin) {
    return (
      <>
        <MaintenanceBanner />
        <div className="pt-10">
          {children}
        </div>
      </>
    );
  }

  // Check if the browser has a valid bypass token
  if (hasBypassAccess) {
    return (
      <>
        <MaintenanceBanner />
        <div className="pt-10">
          {children}
        </div>
      </>
    );
  }

  console.log('[MaintenanceGuard] Access denied. Showing maintenance page.');
  // For everyone else, show the maintenance screen
  return <MaintenancePage />;
};
