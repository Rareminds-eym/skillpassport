import { 
  APIFunction, 
  StoreIntegration, 
  ZustandStore, 
  StoreAction, 
  Integration,
  IntegrationPattern 
} from '../types';
import { StoreIntegrationAnalyzer } from './StoreIntegrationAnalyzer';

/**
 * Main store integrator that connects migrated API functions with Zustand stores
 */
export class StoreIntegrator {
  private analyzer: StoreIntegrationAnalyzer;

  constructor() {
    this.analyzer = new StoreIntegrationAnalyzer();
  }

  /**
   * Identify store actions that an API function should trigger
   */
  async identifyStoreActions(apiFunction: APIFunction): Promise<StoreAction[]> {
    const integrations = await this.analyzer.identifyStoreIntegrations([apiFunction]);
    const functionIntegrations = integrations.get(apiFunction.name) || [];
    
    const storeActions: StoreAction[] = [];
    
    for (const integration of functionIntegrations) {
      const store = this.analyzer.getStoreConfig(integration.storeName);
      if (store) {
        // Find matching actions from store configuration
        const matchingActions = store.actions.filter(action => 
          integration.actions.includes(action.name)
        );
        storeActions.push(...matchingActions);
      }
    }

    return storeActions;
  }

  /**
   * Integrate an API function with a Zustand store
   */
  async integrateWithStore(apiFunction: APIFunction, store: ZustandStore): Promise<Integration> {
    const integrations = await this.analyzer.identifyStoreIntegrations([apiFunction]);
    const functionIntegrations = integrations.get(apiFunction.name) || [];
    
    // Find the integration for this specific store
    const storeIntegration = functionIntegrations.find(
      integration => integration.storeName === store.name.replace('use', '').replace('Store', '').toLowerCase()
    );

    if (!storeIntegration) {
      throw new Error(`No integration found for function ${apiFunction.name} with store ${store.name}`);
    }

    const integration: Integration = {
      apiFunction: apiFunction.name,
      storeName: store.name,
      storeHook: storeIntegration.storeHook,
      actions: storeIntegration.actions,
      selectors: storeIntegration.selectors,
      pattern: this.determineIntegrationPattern(apiFunction, storeIntegration),
      generatedCode: await this.generateIntegrationCode(apiFunction, storeIntegration, store)
    };

    return integration;
  }

  /**
   * Validate that a store integration is correct
   */
  async validateStoreIntegration(integration: Integration): Promise<boolean> {
    try {
      // Check if the store exists
      const storeName = integration.storeName.replace('use', '').replace('Store', '').toLowerCase();
      const store = this.analyzer.getStoreConfig(storeName);
      
      if (!store) {
        console.warn(`Store ${integration.storeName} not found in configuration`);
        return false;
      }

      // Validate actions exist in store
      const storeActionNames = store.actions.map(action => action.name);
      const invalidActions = integration.actions.filter(
        action => !storeActionNames.includes(action)
      );
      
      if (invalidActions.length > 0) {
        console.warn(`Invalid actions for store ${integration.storeName}: ${invalidActions.join(', ')}`);
        return false;
      }

      // Validate selectors exist in store
      const storeSelectorNames = store.selectors.map(selector => selector.name);
      const invalidSelectors = integration.selectors.filter(
        selector => !storeSelectorNames.includes(selector)
      );
      
      if (invalidSelectors.length > 0) {
        console.warn(`Invalid selectors for store ${integration.storeName}: ${invalidSelectors.join(', ')}`);
        return false;
      }

      // Validate generated code syntax (basic check)
      if (!integration.generatedCode || integration.generatedCode.trim().length === 0) {
        console.warn(`No generated code for integration ${integration.apiFunction}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error validating integration for ${integration.apiFunction}:`, error);
      return false;
    }
  }

  /**
   * Generate all store integrations for a list of API functions
   */
  async generateAllIntegrations(apiFunctions: APIFunction[]): Promise<Map<string, Integration[]>> {
    const allIntegrations = new Map<string, Integration[]>();
    
    // Get store integrations from analyzer
    const storeIntegrations = await this.analyzer.identifyStoreIntegrations(apiFunctions);
    
    for (const [functionName, integrations] of storeIntegrations) {
      const apiFunction = apiFunctions.find(fn => fn.name === functionName);
      if (!apiFunction) continue;

      const functionIntegrations: Integration[] = [];
      
      for (const storeIntegration of integrations) {
        const store = this.analyzer.getStoreConfig(storeIntegration.storeName);
        if (store) {
          try {
            const integration = await this.integrateWithStore(apiFunction, store);
            functionIntegrations.push(integration);
          } catch (error) {
            console.warn(`Failed to create integration for ${functionName} with ${store.name}:`, error);
          }
        }
      }
      
      if (functionIntegrations.length > 0) {
        allIntegrations.set(functionName, functionIntegrations);
      }
    }

    return allIntegrations;
  }

  /**
   * Determine the appropriate integration pattern for a function
   */
  private determineIntegrationPattern(
    apiFunction: APIFunction, 
    storeIntegration: StoreIntegration
  ): IntegrationPattern {
    // For now, use direct integration for most cases
    // Could be enhanced to use event-driven or callback patterns based on complexity
    return {
      type: storeIntegration.integrationPattern,
      description: `Direct integration with ${storeIntegration.storeName} store`,
      implementation: 'inline'
    };
  }

  /**
   * Generate TypeScript code for store integration
   */
  private async generateIntegrationCode(
    apiFunction: APIFunction,
    storeIntegration: StoreIntegration,
    store: ZustandStore
  ): Promise<string> {
    const storeHook = storeIntegration.storeHook;
    const actions = storeIntegration.actions;
    const selectors = storeIntegration.selectors;

    // Generate import statement
    const importPath = store.path.replace('src/', '../').replace('.ts', '');
    let code = `import { ${storeHook}`;
    
    if (selectors.length > 0) {
      const selectorHooks = selectors.map(selector => {
        // Convert selector name to hook name (e.g., 'user' -> 'useUser')
        const hookName = selector === 'user' ? 'useUser' : 
                        selector === 'session' ? 'useSession' :
                        selector === 'isAuthenticated' ? 'useIsAuthenticated' :
                        `use${selector.charAt(0).toUpperCase() + selector.slice(1)}`;
        return hookName;
      });
      code += `, ${selectorHooks.join(', ')}`;
    }
    
    code += ` } from '${importPath}';\n\n`;

    // Generate the enhanced function
    code += `// Enhanced ${apiFunction.name} with store integration\n`;
    code += `export const ${apiFunction.name}Enhanced = async (...args: any[]) => {\n`;
    code += `  const ${actions.map(action => action).join(', ')} = ${storeHook}();\n`;
    
    if (selectors.length > 0) {
      code += `  // Access current state if needed\n`;
      selectors.forEach(selector => {
        const hookName = selector === 'user' ? 'useUser' : 
                        selector === 'session' ? 'useSession' :
                        selector === 'isAuthenticated' ? 'useIsAuthenticated' :
                        `use${selector.charAt(0).toUpperCase() + selector.slice(1)}`;
        code += `  // const current${selector.charAt(0).toUpperCase() + selector.slice(1)} = ${hookName}();\n`;
      });
    }

    code += `\n  try {\n`;
    code += `    // Call original API function\n`;
    code += `    const result = await originalApi.${apiFunction.name}(...args);\n\n`;

    // Generate store action calls based on function type
    if (storeIntegration.storeName === 'auth') {
      code += this.generateAuthIntegrationCode(apiFunction, actions);
    } else if (storeIntegration.storeName === 'search') {
      code += this.generateSearchIntegrationCode(apiFunction, actions);
    } else if (storeIntegration.storeName === 'subscription') {
      code += this.generateSubscriptionIntegrationCode(apiFunction, actions);
    } else if (storeIntegration.storeName === 'portfolio') {
      code += this.generatePortfolioIntegrationCode(apiFunction, actions);
    }

    code += `\n    return result;\n`;
    code += `  } catch (error) {\n`;
    code += `    // Handle errors and update store if needed\n`;
    
    if (actions.includes('showErrorNotification')) {
      code += `    showErrorNotification(error.message || 'An error occurred');\n`;
    }
    if (actions.includes('setError')) {
      code += `    setError(error.message || 'An error occurred');\n`;
    }
    
    code += `    throw error;\n`;
    code += `  }\n`;
    code += `};\n`;

    return code;
  }

  /**
   * Generate auth-specific integration code
   */
  private generateAuthIntegrationCode(apiFunction: APIFunction, actions: string[]): string {
    const functionName = apiFunction.name.toLowerCase();
    let code = '';

    if (functionName.includes('login') || functionName.includes('signin')) {
      code += `    // Update auth store with login result\n`;
      code += `    if (result.user && result.session) {\n`;
      code += `      login(result.user, result.session);\n`;
      code += `    }\n`;
    } else if (functionName.includes('logout') || functionName.includes('signout')) {
      code += `    // Clear auth store on logout\n`;
      code += `    logout();\n`;
    } else if (functionName.includes('update') && functionName.includes('user')) {
      code += `    // Update user in store\n`;
      code += `    if (result.user) {\n`;
      code += `      updateUser(result.user);\n`;
      code += `    }\n`;
    } else if (functionName.includes('refresh')) {
      code += `    // Refresh session in store\n`;
      code += `    await refreshSession();\n`;
    }

    return code;
  }

  /**
   * Generate search-specific integration code
   */
  private generateSearchIntegrationCode(apiFunction: APIFunction, actions: string[]): string {
    const functionName = apiFunction.name.toLowerCase();
    let code = '';

    if (functionName.includes('search')) {
      code += `    // Update search store with results\n`;
      code += `    if (result.results) {\n`;
      code += `      setSearchResults(result.results);\n`;
      code += `    }\n`;
      code += `    if (args[0]) {\n`;
      code += `      addToHistory(args[0]);\n`;
      code += `    }\n`;
    } else if (functionName.includes('history')) {
      code += `    // Add search term to history\n`;
      code += `    if (args[1]) {\n`;
      code += `      addToHistory(args[1]);\n`;
      code += `    }\n`;
    }

    return code;
  }

  /**
   * Generate subscription-specific integration code
   */
  private generateSubscriptionIntegrationCode(apiFunction: APIFunction, actions: string[]): string {
    const functionName = apiFunction.name.toLowerCase();
    let code = '';

    if (functionName.includes('subscription') || functionName.includes('plan')) {
      code += `    // Update subscription in store\n`;
      code += `    if (result.subscription) {\n`;
      code += `      updateSubscription(result.subscription);\n`;
      code += `    }\n`;
    }

    return code;
  }

  /**
   * Generate portfolio-specific integration code
   */
  private generatePortfolioIntegrationCode(apiFunction: APIFunction, actions: string[]): string {
    const functionName = apiFunction.name.toLowerCase();
    let code = '';

    if (functionName.includes('portfolio')) {
      code += `    // Update portfolio in store\n`;
      code += `    if (result.portfolio) {\n`;
      code += `      setPortfolio(result.portfolio);\n`;
      code += `    }\n`;
    } else if (functionName.includes('settings')) {
      code += `    // Update portfolio settings in store\n`;
      code += `    if (result.settings) {\n`;
      code += `      updatePortfolioSettings(result.settings);\n`;
      code += `    }\n`;
    }

    return code;
  }
}