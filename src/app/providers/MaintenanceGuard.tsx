import { MaintenanceBanner } from '@/app/components/MaintenanceBanner';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { useMaintenanceStore } from '@/shared/model/maintenanceStore';
import { Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';

export const MaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMaintenanceMode, activeBypassToken, localBypassToken, maintenanceLoading } = useMaintenanceStore();

  // If the active token is revoked (realtime update sets it to null),
  // clear local storage so the user gets kicked out immediately
  useEffect(() => {
    if (activeBypassToken === null && localBypassToken !== null) {
      useMaintenanceStore.getState().setLocalBypassToken(null);
    }
  }, [activeBypassToken, localBypassToken]);

  const hasBypassAccess = localBypassToken !== null && localBypassToken === activeBypassToken;

  if (maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isMaintenanceMode) {
    return <>{children}</>;
  }

  // === Maintenance Mode is ON ===
  // Only bypass code grants access

  if (hasBypassAccess) {
    return (
      <>
        <MaintenanceBanner />
        <div className="pt-10">{children}</div>
      </>
    );
  }

  return <MaintenancePage />;
};