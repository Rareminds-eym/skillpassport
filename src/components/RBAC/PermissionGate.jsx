import { useAbility } from '../../hooks/useAbility';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

export const PermissionGate = ({ 
  action, 
  subject, 
  field,
  children, 
  fallback,
  showDenied = true 
}) => {
  const navigate = useNavigate();
  const { can } = useAbility();

  const allowed = can(action, subject, field);

  if (fallback) {
    return allowed ? children : fallback;
  }

  if (allowed) return children;
  
  if (!showDenied) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-red-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h2>
      <p className="text-gray-600 text-center max-w-md mb-8">
        You don't have permission to access this feature. This may be due to your account type or subscription level.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Go Back
      </button>
    </div>
  );
};
