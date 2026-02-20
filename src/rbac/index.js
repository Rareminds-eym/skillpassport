// RBAC System - Centralized exports

// Components
export { PermissionGate } from './components/PermissionGate';
export { RoleSwitcher } from './components/RoleSwitcher';

// Hooks
export { useAbility } from './hooks/useAbility';
export { usePermissions } from './hooks/usePermissions';

// Services
export { rbacService } from './services/rbacService';
export { permissionService } from './services/permissionService';
export { settingsService } from './services/settingsService';

// Context
export { AbilityProvider, AbilityContext, Can } from './context/AbilityContext';
export { PermissionsProvider, usePermissions as usePermissionsContext } from './context/PermissionsContext';

// Types
export * from './types/Permissions';
