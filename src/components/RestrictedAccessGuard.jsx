import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAbility } from '../rbac/hooks/useAbility';

const RestrictedAccessGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, loading, isDemoMode } = useAbility();
  const [lastCheckedRole, setLastCheckedRole] = useState(null);

  useEffect(() => {
    if (userRole !== lastCheckedRole) {
      setLastCheckedRole(userRole);
    }
    
    if (isDemoMode) return;
    
    if (!loading && userRole === 'demo_restricted' && location.pathname !== '/restricted-access') {
      navigate('/restricted-access', { replace: true });
    }
  }, [userRole, loading, isDemoMode, navigate, location.pathname, lastCheckedRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isDemoMode && userRole === 'demo_restricted') {
    return null;
  }

  return children;
};

export default RestrictedAccessGuard;
