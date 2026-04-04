import { APIFunction, Integration } from '@/features/student-profile/model';
import { StoreIntegrator } from './StoreIntegrator';

/**
 * Specialized integrator for subscription API functions with subscription store
 */
export class SubscriptionStoreIntegrator {
  private storeIntegrator: StoreIntegrator;

  constructor() {
    this.storeIntegrator = new StoreIntegrator();
  }

  /**
   * Create enhanced subscription API functions with store integration
   */
  async integrateSubscriptionAPIs(subscriptionFunctions: APIFunction[]): Promise<Map<string, string>> {
    const integratedCode = new Map<string, string>();

    for (const subscriptionFunction of subscriptionFunctions) {
      const code = await this.generateSubscriptionIntegration(subscriptionFunction);
      integratedCode.set(subscriptionFunction.name, code);
    }

    return integratedCode;
  }

  /**
   * Generate store-integrated version of a subscription API function
   */
  private async generateSubscriptionIntegration(subscriptionFunction: APIFunction): Promise<string> {
    const functionName = subscriptionFunction.name;
    const functionNameLower = functionName.toLowerCase();

    let code = `import { useSubscriptionStore, useSubscription, useSubscriptionAccess } from '@/features/subscription/model/subscriptionStore';\n\n`;

    // Generate function based on subscription operation type
    if (functionNameLower.includes('active') && functionNameLower.includes('subscription')) {
      code += this.generateGetActiveSubscriptionIntegration(subscriptionFunction);
    } else if (functionNameLower.includes('user') && functionNameLower.includes('subscription')) {
      code += this.generateGetUserSubscriptionsIntegration(subscriptionFunction);
    } else if (functionNameLower.includes('payment')) {
      code += this.generatePaymentIntegration(subscriptionFunction);
    } else if (functionNameLower.includes('check') && functionNameLower.includes('subscription')) {
      code += this.generateCheckSubscriptionIntegration(subscriptionFunction);
    } else {
      // Generic subscription function integration
      code += this.generateGenericSubscriptionIntegration(subscriptionFunction);
    }

    return code;
  }

  /**
   * Generate get active subscription integration
   */
  private generateGetActiveSubscriptionIntegration(subscriptionFunction: APIFunction): string {
    return `
/**
 * Enhanced ${subscriptionFunction.name} with subscription store integration
 * Connects with useSubscriptionStore actions
 */
export const ${subscriptionFunction.name}Enhanced = async () => {
  const subscriptionStore = useSubscriptionStore();
  
  try {
    // Call original subscription service
    const result = await originalSubscriptionService.${subscriptionFunction.name}();
    
    // Update subscription store with active subscription
    if (result.subscription) {
      // Update the store state directly since we don't have exposed actions
      subscriptionStore.setState((state) => ({
        ...state,
        subscription: result.subscription,
        loading: false,
        error: null
      }));
    }
    
    return result;
  } catch (error) {
    // Update store with error state
    subscriptionStore.setState((state) => ({
      ...state,
      loading: false,
      error: error.message || 'Failed to fetch active subscription'
    }));
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${subscriptionFunction.name.charAt(0).toUpperCase() + subscriptionFunction.name.slice(1)} = () => {
  const subscriptionStore = useSubscriptionStore();
  
  return async () => {
    // Set loading state
    subscriptionStore.setState((state) => ({
      ...state,
      loading: true,
      error: null
    }));
    
    try {
      const result = await originalSubscriptionService.${subscriptionFunction.name}();
      
      if (result.subscription) {
        subscriptionStore.setState((state) => ({
          ...state,
          subscription: result.subscription,
          loading: false,
          error: null
        }));
      }
      
      return result;
    } catch (error) {
      subscriptionStore.setState((state) => ({
        ...state,
        loading: false,
        error: error.message || 'Failed to fetch active subscription'
      }));
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate get user subscriptions integration
   */
  private generateGetUserSubscriptionsIntegration(subscriptionFunction: APIFunction): string {
    return `
/**
 * Enhanced ${subscriptionFunction.name} with subscription store integration
 */
export const ${subscriptionFunction.name}Enhanced = async (includeAll: boolean = false) => {
  const subscriptionStore = useSubscriptionStore();
  
  try {
    // Call original subscription service
    const result = await originalSubscriptionService.${subscriptionFunction.name}(includeAll);
    
    // Update subscription store with user subscriptions
    if (result.subscriptions && result.subscriptions.length > 0) {
      // Find the active subscription and update store
      const activeSubscription = result.subscriptions.find(sub => sub.status === 'active');
      if (activeSubscription) {
        subscriptionStore.setState((state) => ({
          ...state,
          subscription: activeSubscription,
          loading: false,
          error: null
        }));
      }
    }
    
    return result;
  } catch (error) {
    subscriptionStore.setState((state) => ({
      ...state,
      loading: false,
      error: error.message || 'Failed to fetch user subscriptions'
    }));
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${subscriptionFunction.name.charAt(0).toUpperCase() + subscriptionFunction.name.slice(1)} = () => {
  const subscriptionStore = useSubscriptionStore();
  
  return async (includeAll: boolean = false) => {
    subscriptionStore.setState((state) => ({
      ...state,
      loading: true,
      error: null
    }));
    
    try {
      const result = await originalSubscriptionService.${subscriptionFunction.name}(includeAll);
      
      if (result.subscriptions && result.subscriptions.length > 0) {
        const activeSubscription = result.subscriptions.find(sub => sub.status === 'active');
        if (activeSubscription) {
          subscriptionStore.setState((state) => ({
            ...state,
            subscription: activeSubscription,
            loading: false,
            error: null
          }));
        }
      }
      
      return result;
    } catch (error) {
      subscriptionStore.setState((state) => ({
        ...state,
        loading: false,
        error: error.message || 'Failed to fetch user subscriptions'
      }));
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate payment integration
   */
  private generatePaymentIntegration(subscriptionFunction: APIFunction): string {
    return `
/**
 * Enhanced ${subscriptionFunction.name} with subscription store integration
 */
export const ${subscriptionFunction.name}Enhanced = async (...args: any[]) => {
  const subscriptionStore = useSubscriptionStore();
  
  try {
    // Call original subscription service
    const result = await originalSubscriptionService.${subscriptionFunction.name}(...args);
    
    // Payment operations don't directly update subscription state
    // but we can clear any previous errors
    subscriptionStore.setState((state) => ({
      ...state,
      error: null
    }));
    
    return result;
  } catch (error) {
    subscriptionStore.setState((state) => ({
      ...state,
      error: error.message || 'Payment operation failed'
    }));
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${subscriptionFunction.name.charAt(0).toUpperCase() + subscriptionFunction.name.slice(1)} = () => {
  const subscriptionStore = useSubscriptionStore();
  
  return async (...args: any[]) => {
    try {
      const result = await originalSubscriptionService.${subscriptionFunction.name}(...args);
      
      subscriptionStore.setState((state) => ({
        ...state,
        error: null
      }));
      
      return result;
    } catch (error) {
      subscriptionStore.setState((state) => ({
        ...state,
        error: error.message || 'Payment operation failed'
      }));
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate check subscription integration
   */
  private generateCheckSubscriptionIntegration(subscriptionFunction: APIFunction): string {
    return `
/**
 * Enhanced ${subscriptionFunction.name} with subscription store integration
 */
export const ${subscriptionFunction.name}Enhanced = async () => {
  const subscriptionStore = useSubscriptionStore();
  
  try {
    // Call original subscription service
    const result = await originalSubscriptionService.${subscriptionFunction.name}();
    
    // Update subscription store with check result
    if (result.subscription) {
      subscriptionStore.setState((state) => ({
        ...state,
        subscription: result.subscription,
        loading: false,
        error: null
      }));
    } else if (result.hasActiveSubscription !== undefined) {
      // If we only get a boolean result, update accordingly
      subscriptionStore.setState((state) => ({
        ...state,
        subscription: result.hasActiveSubscription ? state.subscription : null,
        loading: false,
        error: null
      }));
    }
    
    return result;
  } catch (error) {
    subscriptionStore.setState((state) => ({
      ...state,
      loading: false,
      error: error.message || 'Subscription check failed'
    }));
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${subscriptionFunction.name.charAt(0).toUpperCase() + subscriptionFunction.name.slice(1)} = () => {
  const subscriptionStore = useSubscriptionStore();
  
  return async () => {
    subscriptionStore.setState((state) => ({
      ...state,
      loading: true,
      error: null
    }));
    
    try {
      const result = await originalSubscriptionService.${subscriptionFunction.name}();
      
      if (result.subscription) {
        subscriptionStore.setState((state) => ({
          ...state,
          subscription: result.subscription,
          loading: false,
          error: null
        }));
      } else if (result.hasActiveSubscription !== undefined) {
        subscriptionStore.setState((state) => ({
          ...state,
          subscription: result.hasActiveSubscription ? state.subscription : null,
          loading: false,
          error: null
        }));
      }
      
      return result;
    } catch (error) {
      subscriptionStore.setState((state) => ({
        ...state,
        loading: false,
        error: error.message || 'Subscription check failed'
      }));
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate generic subscription integration
   */
  private generateGenericSubscriptionIntegration(subscriptionFunction: APIFunction): string {
    return `
/**
 * Enhanced ${subscriptionFunction.name} with subscription store integration
 */
export const ${subscriptionFunction.name}Enhanced = async (...args: any[]) => {
  const subscriptionStore = useSubscriptionStore();
  
  try {
    // Call original subscription service
    const result = await originalSubscriptionService.${subscriptionFunction.name}(...args);
    
    // Clear any previous errors on successful operation
    subscriptionStore.setState((state) => ({
      ...state,
      error: null
    }));
    
    return result;
  } catch (error) {
    subscriptionStore.setState((state) => ({
      ...state,
      error: error.message || 'Subscription operation failed'
    }));
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${subscriptionFunction.name.charAt(0).toUpperCase() + subscriptionFunction.name.slice(1)} = () => {
  const subscriptionStore = useSubscriptionStore();
  
  return async (...args: any[]) => {
    try {
      const result = await originalSubscriptionService.${subscriptionFunction.name}(...args);
      
      subscriptionStore.setState((state) => ({
        ...state,
        error: null
      }));
      
      return result;
    } catch (error) {
      subscriptionStore.setState((state) => ({
        ...state,
        error: error.message || 'Subscription operation failed'
      }));
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate a complete subscription API file with all integrations
   */
  async generateSubscriptionAPIFile(subscriptionFunctions: APIFunction[]): Promise<string> {
    let code = `// Enhanced subscription API with Zustand store integration
// This file connects subscription operations with store state management

import { useSubscriptionStore, useSubscription, useSubscriptionAccess } from '@/features/subscription/model/subscriptionStore';
import * as originalSubscriptionService from '@/shared/api/Subscriptions/subscriptionService';

`;

    // Generate all subscription function integrations
    const integrations = await this.integrateSubscriptionAPIs(subscriptionFunctions);
    
    for (const [functionName, functionCode] of integrations) {
      code += functionCode + '\n';
    }

    // Add utility functions
    code += `
// Utility functions for subscription state management

/**
 * Get current subscription with reactive updates
 */
export const useCurrentSubscription = () => {
  return useSubscription();
};

/**
 * Get subscription access information with reactive updates
 */
export const useSubscriptionAccessInfo = () => {
  return useSubscriptionAccess();
};

/**
 * Check if user has active subscription
 */
export const useHasActiveSubscription = () => {
  const subscription = useSubscription();
  return subscription && subscription.status === 'active';
};

/**
 * Get subscription status with loading and error states
 */
export const useSubscriptionStatus = () => {
  const subscription = useSubscription();
  const store = useSubscriptionStore();
  
  return {
    subscription,
    loading: store.loading || false,
    error: store.error || null,
    hasActiveSubscription: subscription && subscription.status === 'active'
  };
};

// Export original service for backward compatibility
export { originalSubscriptionService };
`;

    return code;
  }
}