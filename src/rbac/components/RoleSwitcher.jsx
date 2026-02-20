import { useState, useEffect } from 'react';
import { useAbility } from '../hooks/useAbility';
import { rbacService } from '../services/rbacService';
import { Users, X, ChevronDown } from 'lucide-react';

export const RoleSwitcher = () => {
  const { isDemoMode, demoRole, switchToDemo, exitDemo } = useAbility();
  const [showDropdown, setShowDropdown] = useState(false);
  const [demoRoles, setDemoRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load demo roles from database
  useEffect(() => {
    const loadDemoRoles = async () => {
      setLoading(true);
      const roles = await rbacService.getAllRoles({ roleType: 'demo' });
      setDemoRoles(roles);
      setLoading(false);
    };

    loadDemoRoles();
  }, []);

  // Only show in development or when explicitly enabled
  if (import.meta.env.PROD && !import.meta.env.VITE_ENABLE_DEMO_MODE) {
    return null;
  }

  const currentRole = isDemoMode 
    ? demoRoles.find(r => r.role_key === demoRole)
    : null;

  return (
    <>
      {/* Demo Mode Banner */}
      {isDemoMode && currentRole && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 text-center z-50 shadow-lg">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentRole.icon}</span>
              <span className="font-semibold">
                Demo Mode: {currentRole.name}
              </span>
            </div>
            <button
              onClick={exitDemo}
              className="px-4 py-1.5 bg-white text-amber-600 rounded-md text-sm font-medium hover:bg-amber-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Exit Demo
            </button>
          </div>
        </div>
      )}

      {/* Role Switcher Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          disabled={loading}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">
            {loading ? 'Loading...' : (isDemoMode && currentRole ? currentRole.name : 'Demo Mode')}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {showDropdown && !loading && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Demo Roles</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Switch roles to test different access levels
                </p>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                {demoRoles.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No demo roles available
                  </div>
                ) : (
                  demoRoles.map(role => (
                    <button
                      key={role.id}
                      onClick={() => {
                        switchToDemo(role.role_key);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        demoRole === role.role_key
                          ? 'bg-indigo-50 border-2 border-indigo-500'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{role.icon}</span>
                            <span className="font-semibold text-gray-900">{role.name}</span>
                            {demoRole === role.role_key && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 ml-7">{role.description}</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
