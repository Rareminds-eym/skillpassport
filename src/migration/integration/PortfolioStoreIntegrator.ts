import { APIFunction, Integration } from '../types';
import { StoreIntegrator } from './StoreIntegrator';

/**
 * Specialized integrator for portfolio API functions with portfolio store
 */
export class PortfolioStoreIntegrator {
  private storeIntegrator: StoreIntegrator;

  constructor() {
    this.storeIntegrator = new StoreIntegrator();
  }

  /**
   * Create enhanced portfolio API functions with store integration
   */
  async integratePortfolioAPIs(portfolioFunctions: APIFunction[]): Promise<Map<string, string>> {
    const integratedCode = new Map<string, string>();

    for (const portfolioFunction of portfolioFunctions) {
      const code = await this.generatePortfolioIntegration(portfolioFunction);
      integratedCode.set(portfolioFunction.name, code);
    }

    return integratedCode;
  }

  /**
   * Generate store-integrated version of a portfolio API function
   */
  private async generatePortfolioIntegration(portfolioFunction: APIFunction): Promise<string> {
    const functionName = portfolioFunction.name;
    const functionNameLower = functionName.toLowerCase();

    let code = `import { usePortfolioActions, usePortfolioStore, usePortfolio } from '@/stores/portfolioStore';\n\n`;

    // Generate function based on portfolio operation type
    if (functionNameLower.includes('student') && functionNameLower.includes('portfolio')) {
      code += this.generateGetStudentPortfolioIntegration(portfolioFunction);
    } else if (functionNameLower.includes('update') && functionNameLower.includes('portfolio')) {
      code += this.generateUpdatePortfolioIntegration(portfolioFunction);
    } else if (functionNameLower.includes('settings')) {
      code += this.generatePortfolioSettingsIntegration(portfolioFunction);
    } else {
      // Generic portfolio function integration
      code += this.generateGenericPortfolioIntegration(portfolioFunction);
    }

    return code;
  }

  /**
   * Generate get student portfolio integration
   */
  private generateGetStudentPortfolioIntegration(portfolioFunction: APIFunction): string {
    return `
/**
 * Enhanced ${portfolioFunction.name} with portfolio store integration
 * Connects with usePortfolioActions
 */
export const ${portfolioFunction.name}Enhanced = async (email: string) => {
  const { setPortfolio, setLoading, setError } = usePortfolioActions();
  
  try {
    // Set loading state
    setLoading(true);
    
    // Call original portfolio service
    const result = await originalPortfolioService.${portfolioFunction.name}(email);
    
    // Update portfolio store with fetched portfolio
    if (result.portfolio) {
      setPortfolio(result.portfolio);
    }
    
    setLoading(false);
    return result;
  } catch (error) {
    // Update store with error state
    setError(error.message || 'Failed to fetch student portfolio');
    setLoading(false);
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${portfolioFunction.name.charAt(0).toUpperCase() + portfolioFunction.name.slice(1)} = () => {
  const { setPortfolio, setLoading, setError } = usePortfolioActions();
  
  return async (email: string) => {
    try {
      setLoading(true);
      
      const result = await originalPortfolioService.${portfolioFunction.name}(email);
      
      if (result.portfolio) {
        setPortfolio(result.portfolio);
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      setError(error.message || 'Failed to fetch student portfolio');
      setLoading(false);
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate update portfolio integration
   */
  private generateUpdatePortfolioIntegration(portfolioFunction: APIFunction): string {
    return `
/**
 * Enhanced ${portfolioFunction.name} with portfolio store integration
 */
export const ${portfolioFunction.name}Enhanced = async (portfolioData: any) => {
  const { setPortfolio, setLoading, setError } = usePortfolioActions();
  const currentPortfolio = usePortfolio();
  
  try {
    setLoading(true);
    
    // Call original portfolio service
    const result = await originalPortfolioService.${portfolioFunction.name}(portfolioData);
    
    // Update portfolio store with updated portfolio
    if (result.portfolio) {
      setPortfolio(result.portfolio);
    } else {
      // If no portfolio returned, merge with current
      const updatedPortfolio = { ...currentPortfolio, ...portfolioData };
      setPortfolio(updatedPortfolio);
    }
    
    setLoading(false);
    return result;
  } catch (error) {
    setError(error.message || 'Failed to update portfolio');
    setLoading(false);
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${portfolioFunction.name.charAt(0).toUpperCase() + portfolioFunction.name.slice(1)} = () => {
  const { setPortfolio, setLoading, setError } = usePortfolioActions();
  const currentPortfolio = usePortfolio();
  
  return async (portfolioData: any) => {
    try {
      setLoading(true);
      
      const result = await originalPortfolioService.${portfolioFunction.name}(portfolioData);
      
      if (result.portfolio) {
        setPortfolio(result.portfolio);
      } else {
        const updatedPortfolio = { ...currentPortfolio, ...portfolioData };
        setPortfolio(updatedPortfolio);
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      setError(error.message || 'Failed to update portfolio');
      setLoading(false);
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate portfolio settings integration
   */
  private generatePortfolioSettingsIntegration(portfolioFunction: APIFunction): string {
    return `
/**
 * Enhanced ${portfolioFunction.name} with portfolio store integration
 */
export const ${portfolioFunction.name}Enhanced = async (settings: any) => {
  const { updatePortfolioSettings, setLoading, setError } = usePortfolioActions();
  
  try {
    setLoading(true);
    
    // Call original portfolio service
    const result = await originalPortfolioService.${portfolioFunction.name}(settings);
    
    // Update portfolio store with new settings
    if (result.settings) {
      updatePortfolioSettings(result.settings);
    } else {
      updatePortfolioSettings(settings);
    }
    
    setLoading(false);
    return result;
  } catch (error) {
    setError(error.message || 'Failed to update portfolio settings');
    setLoading(false);
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${portfolioFunction.name.charAt(0).toUpperCase() + portfolioFunction.name.slice(1)} = () => {
  const { updatePortfolioSettings, setLoading, setError } = usePortfolioActions();
  
  return async (settings: any) => {
    try {
      setLoading(true);
      
      const result = await originalPortfolioService.${portfolioFunction.name}(settings);
      
      if (result.settings) {
        updatePortfolioSettings(result.settings);
      } else {
        updatePortfolioSettings(settings);
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      setError(error.message || 'Failed to update portfolio settings');
      setLoading(false);
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate generic portfolio integration
   */
  private generateGenericPortfolioIntegration(portfolioFunction: APIFunction): string {
    return `
/**
 * Enhanced ${portfolioFunction.name} with portfolio store integration
 */
export const ${portfolioFunction.name}Enhanced = async (...args: any[]) => {
  const { setError } = usePortfolioActions();
  
  try {
    // Call original portfolio service
    const result = await originalPortfolioService.${portfolioFunction.name}(...args);
    
    // Clear any previous errors on successful operation
    setError(null);
    
    return result;
  } catch (error) {
    setError(error.message || 'Portfolio operation failed');
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${portfolioFunction.name.charAt(0).toUpperCase() + portfolioFunction.name.slice(1)} = () => {
  const { setError } = usePortfolioActions();
  
  return async (...args: any[]) => {
    try {
      const result = await originalPortfolioService.${portfolioFunction.name}(...args);
      setError(null);
      return result;
    } catch (error) {
      setError(error.message || 'Portfolio operation failed');
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate a complete portfolio API file with all integrations
   */
  async generatePortfolioAPIFile(portfolioFunctions: APIFunction[]): Promise<string> {
    let code = `// Enhanced portfolio API with Zustand store integration
// This file connects portfolio operations with usePortfolioActions

import { usePortfolioActions, usePortfolioStore, usePortfolio } from '@/stores/portfolioStore';
import * as originalPortfolioService from '@/features/digital-portfolio';

`;

    // Generate all portfolio function integrations
    const integrations = await this.integratePortfolioAPIs(portfolioFunctions);
    
    for (const [functionName, functionCode] of integrations) {
      code += functionCode + '\n';
    }

    // Add utility functions
    code += `
// Utility functions for portfolio state management

/**
 * Get current portfolio with reactive updates
 */
export const useCurrentPortfolio = () => {
  return usePortfolio();
};

/**
 * Get portfolio status with loading and error states
 */
export const usePortfolioStatus = () => {
  const portfolio = usePortfolio();
  const store = usePortfolioStore();
  
  return {
    portfolio,
    loading: store.loading || false,
    error: store.error || null,
    hasPortfolio: !!portfolio
  };
};

/**
 * Update portfolio with store integration
 */
export const useUpdatePortfolio = () => {
  const { setPortfolio, setLoading, setError } = usePortfolioActions();
  
  return async (portfolioData: any) => {
    try {
      setLoading(true);
      // This would call the actual portfolio update API
      // const result = await portfolioAPI.update(portfolioData);
      // setPortfolio(result.portfolio);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setError(error.message || 'Failed to update portfolio');
      setLoading(false);
      throw error;
    }
  };
};

// Export original service for backward compatibility
export { originalPortfolioService };
`;

    return code;
  }
}