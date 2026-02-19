import { createContext, useEffect, useState } from 'react';
import { createMongoAbility, AbilityBuilder } from '@casl/ability';
import { rbacService } from '../services/rbacService';
import { useAuth } from './AuthContext';

export const AbilityContext = createContext();

export const AbilityProvider = ({ children }) => {
  const { user } = useAuth();
  const [ability, setAbility] = useState(() => createMongoAbility([]));
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user permissions from database
  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true);
      
      // Check if in demo mode
      const storedDemoRole = sessionStorage.getItem('demo_role_key');
      
      if (storedDemoRole) {
        // Demo mode active - load demo role permissions
        console.log('[RBAC] Demo mode active:', storedDemoRole);
        await loadDemoPermissions(storedDemoRole);
      } else if (user?.id) {
        // Normal mode - load user's actual permissions from database
        console.log('[RBAC] Loading permissions for user:', user.id);
        await loadUserPermissions(user.id);
      } else {
        // No user - anonymous (no permissions)
        console.log('[RBAC] No user, loading anonymous permissions');
        setAbility(createMongoAbility([]));
        setIsDemoMode(false);
        setDemoRole(null);
      }
      
      setLoading(false);
    };

    loadPermissions();
  }, [user]);

  // Load user permissions from database
  const loadUserPermissions = async (userId) => {
    try {
      const permissions = await rbacService.getUserPermissions(userId);
      const newAbility = buildAbilityFromPermissions(permissions);
      setAbility(newAbility);
      setIsDemoMode(false);
      setDemoRole(null);
      console.log('[RBAC] Loaded', permissions.length, 'permissions for user');
    } catch (error) {
      console.error('[RBAC] Error loading user permissions:', error);
      setAbility(createMongoAbility([]));
    }
  };

  // Load demo role permissions from database
  const loadDemoPermissions = async (roleKey) => {
    try {
      const permissions = await rbacService.getRolePermissions(roleKey);
      const newAbility = buildAbilityFromPermissions(permissions);
      setAbility(newAbility);
      setIsDemoMode(true);
      setDemoRole(roleKey);
      console.log('[RBAC] Loaded', permissions.length, 'permissions for demo role:', roleKey);
    } catch (error) {
      console.error('[RBAC] Error loading demo permissions:', error);
      setAbility(createMongoAbility([]));
    }
  };

  // Build CASL ability from permission list
  const buildAbilityFromPermissions = (permissions) => {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    permissions.forEach(perm => {
      if (perm.is_granted) {
        if (perm.field) {
          can(perm.action, perm.subject, perm.field);
        } else {
          can(perm.action, perm.subject);
        }
      } else {
        if (perm.field) {
          cannot(perm.action, perm.subject, perm.field);
        } else {
          cannot(perm.action, perm.subject);
        }
      }
    });

    return build();
  };

  // Switch to demo mode with a specific role
  const switchToDemo = async (roleKey) => {
    console.log('[RBAC] Switching to demo role:', roleKey);
    sessionStorage.setItem('demo_role_key', roleKey);
    await loadDemoPermissions(roleKey);
  };

  // Exit demo mode and return to user's actual permissions
  const exitDemo = async () => {
    console.log('[RBAC] Exiting demo mode');
    sessionStorage.removeItem('demo_role_key');
    if (user?.id) {
      await loadUserPermissions(user.id);
    } else {
      setAbility(createMongoAbility([]));
      setIsDemoMode(false);
      setDemoRole(null);
    }
  };

  const value = {
    ability,
    isDemoMode,
    demoRole,
    loading,
    switchToDemo,
    exitDemo,
    reloadPermissions: () => {
      if (isDemoMode && demoRole) {
        return loadDemoPermissions(demoRole);
      } else if (user?.id) {
        return loadUserPermissions(user.id);
      }
    }
  };

  return (
    <AbilityContext.Provider value={value}>
      {children}
    </AbilityContext.Provider>
  );
};
