import { APIFunction, Integration } from '../types';
import { StoreIntegrator } from './StoreIntegrator';

/**
 * Specialized integrator for authentication API functions with auth store
 */
export class AuthStoreIntegrator {
  private storeIntegrator: StoreIntegrator;

  constructor() {
    this.storeIntegrator = new StoreIntegrator();
  }

  /**
   * Create enhanced authentication API functions with store integration
   */
  async integrateAuthAPIs(authFunctions: APIFunction[]): Promise<Map<string, string>> {
    const integratedCode = new Map<string, string>();

    for (const authFunction of authFunctions) {
      const code = await this.generateAuthIntegration(authFunction);
      integratedCode.set(authFunction.name, code);
    }

    return integratedCode;
  }

  /**
   * Generate store-integrated version of an auth API function
   */
  private async generateAuthIntegration(authFunction: APIFunction): Promise<string> {
    const functionName = authFunction.name;
    const functionNameLower = functionName.toLowerCase();

    let code = `import { useAuthActions, useUser, useSession, useIsAuthenticated } from '@/features/auth/model/authStore';\n\n`;

    // Generate function based on auth operation type
    if (functionNameLower.includes('signin') || functionNameLower.includes('login')) {
      code += this.generateSignInIntegration(authFunction);
    } else if (functionNameLower.includes('signout') || functionNameLower.includes('logout')) {
      code += this.generateSignOutIntegration(authFunction);
    } else if (functionNameLower.includes('signup') || functionNameLower.includes('register')) {
      code += this.generateSignUpIntegration(authFunction);
    } else if (functionNameLower.includes('refresh')) {
      code += this.generateRefreshIntegration(authFunction);
    } else if (functionNameLower.includes('update') && functionNameLower.includes('user')) {
      code += this.generateUpdateUserIntegration(authFunction);
    } else if (functionNameLower.includes('password') && functionNameLower.includes('reset')) {
      code += this.generatePasswordResetIntegration(authFunction);
    } else if (functionNameLower.includes('check') && functionNameLower.includes('auth')) {
      code += this.generateCheckAuthIntegration(authFunction);
    } else {
      // Generic auth function integration
      code += this.generateGenericAuthIntegration(authFunction);
    }

    return code;
  }

  /**
   * Generate sign-in integration
   */
  private generateSignInIntegration(authFunction: APIFunction): string {
    return `
/**
 * Enhanced ${authFunction.name} with auth store integration
 * Connects with useAuthActions, useUser, and replaces legacy context patterns
 */
export const ${authFunction.name}Enhanced = async (email: string, password: string) => {
  const { login, showErrorNotification, dismissErrorNotification } = useAuthActions();
  
  try {
    // Dismiss any previous error notifications
    dismissErrorNotification();
    
    // Call original auth service
    const result = await originalAuthService.${authFunction.name}(email, password);
    
    // Update auth store with successful login
    if (result.user && result.session) {
      login(result.user, result.session);
    }
    
    return result;
  } catch (error) {
    // Show error notification in store
    showErrorNotification(error.message || 'Login failed');
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${authFunction.name.charAt(0).toUpperCase() + authFunction.name.slice(1)} = () => {
  const { login, showErrorNotification, dismissErrorNotification } = useAuthActions();
  
  return async (email: string, password: string) => {
    try {
      dismissErrorNotification();
      const result = await originalAuthService.${authFunction.name}(email, password);
      
      if (result.user && result.session) {
        login(result.user, result.session);
      }
      
      return result;
    } catch (error) {
      showErrorNotification(error.message || 'Login failed');
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate sign-out integration
   */
  private generateSignOutIntegration(authFunction: APIFunction): string {
    return `
/**
 * Enhanced ${authFunction.name} with auth store integration
 */
export const ${authFunction.name}Enhanced = async () => {
  const { logout, showErrorNotification } = useAuthActions();
  
  try {
    // Call original auth service
    await originalAuthService.${authFunction.name}();
    
    // Clear auth store
    logout();
    
    return { success: true };
  } catch (error) {
    showErrorNotification(error.message || 'Logout failed');
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${authFunction.name.charAt(0).toUpperCase() + authFunction.name.slice(1)} = () => {
  const { logout, showErrorNotification } = useAuthActions();
  
  return async () => {
    try {
      await originalAuthService.${authFunction.name}();
      logout();
      return { success: true };
    } catch (error) {
      showErrorNotification(error.message || 'Logout failed');
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate sign-up integration
   */
  private generateSignUpIntegration(authFunction: APIFunction): string {
    return `
/**
 * Enhanced ${authFunction.name} with auth store integration
 */
export const ${authFunction.name}Enhanced = async (email: string, password: string, userData: any = {}) => {
  const { login, showErrorNotification, dismissErrorNotification } = useAuthActions();
  
  try {
    dismissErrorNotification();
    
    // Call original auth service
    const result = await originalAuthService.${authFunction.name}(email, password, userData);
    
    // Update auth store if user is immediately logged in
    if (result.user && result.session) {
      login(result.user, result.session);
    }
    
    return result;
  } catch (error) {
    showErrorNotification(error.message || 'Registration failed');
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${authFunction.name.charAt(0).toUpperCase() + authFunction.name.slice(1)} = () => {
  const { login, showErrorNotification, dismissErrorNotification } = useAuthActions();
  
  return async (email: string, password: string, userData: any = {}) => {
    try {
      dismissErrorNotification();
      const result = await originalAuthService.${authFunction.name}(email, password, userData);
      
      if (result.user && result.session) {
        login(result.user, result.session);
      }
      
      return result;
    } catch (error) {
      showErrorNotification(error.message || 'Registration failed');
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate session refresh integration
   */
  private generateRefreshIntegration(authFunction: APIFunction): string {
    return `
/**
 * Enhanced ${authFunction.name} with auth store integration
 */
export const ${authFunction.name}Enhanced = async () => {
  const { refreshSession, showErrorNotification } = useAuthActions();
  
  try {
    // Use store's refresh session method which handles the API call
    await refreshSession();
    return { success: true };
  } catch (error) {
    showErrorNotification(error.message || 'Session refresh failed');
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${authFunction.name.charAt(0).toUpperCase() + authFunction.name.slice(1)} = () => {
  const { refreshSession, showErrorNotification } = useAuthActions();
  
  return async () => {
    try {
      await refreshSession();
      return { success: true };
    } catch (error) {
      showErrorNotification(error.message || 'Session refresh failed');
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate update user integration
   */
  private generateUpdateUserIntegration(authFunction: APIFunction): string {
    return `
/**
 * Enhanced ${authFunction.name} with auth store integration
 */
export const ${authFunction.name}Enhanced = async (metadata: any) => {
  const { updateUser, showErrorNotification, dismissErrorNotification } = useAuthActions();
  const currentUser = useUser();
  
  try {
    dismissErrorNotification();
    
    // Call original auth service
    const result = await originalAuthService.${authFunction.name}(metadata);
    
    // Update user in store with new metadata
    if (result.user || currentUser) {
      const updatedUser = result.user || { ...currentUser, ...metadata };
      updateUser(updatedUser);
    }
    
    return result;
  } catch (error) {
    showErrorNotification(error.message || 'User update failed');
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${authFunction.name.charAt(0).toUpperCase() + authFunction.name.slice(1)} = () => {
  const { updateUser, showErrorNotification, dismissErrorNotification } = useAuthActions();
  const currentUser = useUser();
  
  return async (metadata: any) => {
    try {
      dismissErrorNotification();
      const result = await originalAuthService.${authFunction.name}(metadata);
      
      if (result.user || currentUser) {
        const updatedUser = result.user || { ...currentUser, ...metadata };
        updateUser(updatedUser);
      }
      
      return result;
    } catch (error) {
      showErrorNotification(error.message || 'User update failed');
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate password reset integration
   */
  private generatePasswordResetIntegration(authFunction: APIFunction): string {
    return `
/**
 * Enhanced ${authFunction.name} with auth store integration
 */
export const ${authFunction.name}Enhanced = async (...args: any[]) => {
  const { showErrorNotification, dismissErrorNotification } = useAuthActions();
  
  try {
    dismissErrorNotification();
    
    // Call original auth service
    const result = await originalAuthService.${authFunction.name}(...args);
    
    return result;
  } catch (error) {
    showErrorNotification(error.message || 'Password reset failed');
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${authFunction.name.charAt(0).toUpperCase() + authFunction.name.slice(1)} = () => {
  const { showErrorNotification, dismissErrorNotification } = useAuthActions();
  
  return async (...args: any[]) => {
    try {
      dismissErrorNotification();
      const result = await originalAuthService.${authFunction.name}(...args);
      return result;
    } catch (error) {
      showErrorNotification(error.message || 'Password reset failed');
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate check authentication integration
   */
  private generateCheckAuthIntegration(authFunction: APIFunction): string {
    return `
/**
 * Enhanced ${authFunction.name} with auth store integration
 */
export const ${authFunction.name}Enhanced = async () => {
  const { initialize } = useAuthActions();
  const isAuthenticated = useIsAuthenticated();
  
  try {
    // Use store's initialize method which handles auth checking
    await initialize();
    return { isAuthenticated: useAuthStore.getState().isAuthenticated };
  } catch (error) {
    console.error('Auth check failed:', error);
    return { isAuthenticated: false };
  }
};

/**
 * Hook-based version for React components
 */
export const use${authFunction.name.charAt(0).toUpperCase() + authFunction.name.slice(1)} = () => {
  const { initialize } = useAuthActions();
  const isAuthenticated = useIsAuthenticated();
  
  return async () => {
    try {
      await initialize();
      return { isAuthenticated: useAuthStore.getState().isAuthenticated };
    } catch (error) {
      console.error('Auth check failed:', error);
      return { isAuthenticated: false };
    }
  };
};
`;
  }

  /**
   * Generate generic auth integration
   */
  private generateGenericAuthIntegration(authFunction: APIFunction): string {
    return `
/**
 * Enhanced ${authFunction.name} with auth store integration
 */
export const ${authFunction.name}Enhanced = async (...args: any[]) => {
  const { showErrorNotification, dismissErrorNotification } = useAuthActions();
  
  try {
    dismissErrorNotification();
    
    // Call original auth service
    const result = await originalAuthService.${authFunction.name}(...args);
    
    return result;
  } catch (error) {
    showErrorNotification(error.message || 'Authentication operation failed');
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${authFunction.name.charAt(0).toUpperCase() + authFunction.name.slice(1)} = () => {
  const { showErrorNotification, dismissErrorNotification } = useAuthActions();
  
  return async (...args: any[]) => {
    try {
      dismissErrorNotification();
      const result = await originalAuthService.${authFunction.name}(...args);
      return result;
    } catch (error) {
      showErrorNotification(error.message || 'Authentication operation failed');
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate a complete auth API file with all integrations
   */
  async generateAuthAPIFile(authFunctions: APIFunction[]): Promise<string> {
    let code = `// Enhanced authentication API with Zustand store integration
// This file replaces legacy context patterns with store-based state management

import { useAuthActions, useUser, useSession, useIsAuthenticated, useAuthStore } from '@/features/auth/model/authStore';
import * as originalAuthService from '@/features/auth';

`;

    // Generate all auth function integrations
    const integrations = await this.integrateAuthAPIs(authFunctions);
    
    for (const [functionName, functionCode] of integrations) {
      code += functionCode + '\n';
    }

    // Add utility functions
    code += `
// Utility functions for auth state management

/**
 * Check if user has required role
 */
export const useCheckUserRole = () => {
  const { role } = useUser() || {};
  
  return (requiredRole: string) => {
    return role === requiredRole;
  };
};

/**
 * Get current user with reactive updates
 */
export const useCurrentUser = () => {
  return useUser();
};

/**
 * Get authentication status with reactive updates
 */
export const useAuthStatus = () => {
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const session = useSession();
  
  return {
    isAuthenticated,
    user,
    session,
    isLoading: useAuthStore((state) => state.loading)
  };
};

// Export original service for backward compatibility
export { originalAuthService };
`;

    return code;
  }
}