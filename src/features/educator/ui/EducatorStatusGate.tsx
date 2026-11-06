import React, { useEffect, useState, type ReactNode } from 'react';
import AccountDeactivatedScreen from './AccountDeactivatedScreen';
import { useUser } from '@/shared/model/authStore';
import { apiPost } from '@/shared/api/apiClient';

interface EducatorStatusGateProps {
  children: ReactNode;
}

export const EducatorStatusGate: React.FC<EducatorStatusGateProps> = ({ children }) => {
  const user = useUser();
  const [isDeactivated, setIsDeactivated] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('account_deactivated') === 'true';
  });
  const [deactivatedMessage, setDeactivatedMessage] = useState<string>(() => {
    return (typeof window !== 'undefined' && sessionStorage.getItem('account_deactivated_message')) || '';
  });

  useEffect(() => {
    const handleDeactivated = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setIsDeactivated(true);
      const msg = customEvent.detail || 'Your account has been deactivated. Please contact your administrator.';
      setDeactivatedMessage(msg);
      sessionStorage.setItem('account_deactivated', 'true');
      sessionStorage.setItem('account_deactivated_message', msg);
    };

    window.addEventListener('account_deactivated', handleDeactivated);

    // Initial check on mount for college educators
    const isEducator = user?.roles?.includes('college_educator') || user?.role === 'college_educator';
    if (isEducator && user?.email) {
      apiPost('/educator/actions', {
        action: 'fetch-educator-school-info',
        email: user.email,
        userId: user.id,
      }).catch((err) => {
        if (err?.code === 'ACCOUNT_INACTIVE' || err?.message?.toLowerCase().includes('deactivated')) {
          setIsDeactivated(true);
          const msg = err.message || 'Your account has been deactivated. Please contact your administrator.';
          setDeactivatedMessage(msg);
          sessionStorage.setItem('account_deactivated', 'true');
          sessionStorage.setItem('account_deactivated_message', msg);
        }
      });
    }

    return () => {
      window.removeEventListener('account_deactivated', handleDeactivated);
    };
  }, [user?.email, user?.id]);

  // If account is deactivated, completely block the dashboard and modules
  if (isDeactivated) {
    return <AccountDeactivatedScreen message={deactivatedMessage || undefined} />;
  }

  return <>{children}</>;
};

export default EducatorStatusGate;
