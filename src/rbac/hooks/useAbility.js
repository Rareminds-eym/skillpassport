import { useContext } from 'react';
import { AbilityContext } from '../context/AbilityContext';

export const useAbility = () => {
  const context = useContext(AbilityContext);

  if (!context) {
    throw new Error('useAbility must be used within AbilityProvider');
  }

  const ability = context.ability;

  // Safe wrappers that handle undefined ability
  const can = (action, subject, field) => {
    if (!ability || typeof ability.can !== 'function') return false;
    return ability.can(action, subject, field);
  };

  const cannot = (action, subject, field) => {
    if (!ability || typeof ability.cannot !== 'function') return true;
    return ability.cannot(action, subject, field);
  };

  return {
    ability,
    can,
    cannot,
    isDemoMode: context.isDemoMode,
    demoRole: context.demoRole,
    userRole: context.userRole,
    loading: context.loading,
    switchToDemo: context.switchToDemo,
    exitDemo: context.exitDemo,
    reloadPermissions: context.reloadPermissions
  };
};
