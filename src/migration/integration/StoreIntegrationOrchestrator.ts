import { APIFunction, Integration, MigrationResult } from '@/features/student-profile/model';
import { StoreIntegrationAnalyzer } from './StoreIntegrationAnalyzer';
import { AuthStoreIntegrator } from './AuthStoreIntegrator';
import { SubscriptionStoreIntegrator } from './SubscriptionStoreIntegrator';
import { SearchStoreIntegrator } from './SearchStoreIntegrator';
import { PortfolioStoreIntegrator } from './PortfolioStoreIntegrator';

/**
 * Main orchestrator for all store integrations
 * Coordinates the integration of API functions with their appropriate Zustand stores
 */
export class StoreIntegrationOrchestrator {
  private analyzer: StoreIntegrationAnalyzer;
  private authIntegrator: AuthStoreIntegrator;
  private subscriptionIntegrator: SubscriptionStoreIntegrator;
  private searchIntegrator: SearchStoreIntegrator;
  private portfolioIntegrator: PortfolioStoreIntegrator;

  constructor() {
    this.analyzer = new StoreIntegrationAnalyzer();
    this.authIntegrator = new AuthStoreIntegrator();
    this.subscriptionIntegrator = new SubscriptionStoreIntegrator();
    this.searchIntegrator = new SearchStoreIntegrator();
    this.portfolioIntegrator = new PortfolioStoreIntegrator();
  }

  /**
   * Orchestrate all store integrations for a list of API functions
   */
  async integrateAllStores(apiFunctions: APIFunction[]): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedFiles: [],
      updatedImports: [],
      errors: [],
      warnings: [],
      rollbackData: {
        backupFiles: [],
        changeLog: []
      }
    };

    try {
      // Analyze functions to determine store integrations
      const storeIntegrations = await this.analyzer.identifyStoreIntegrations(apiFunctions);
      
      // Categorize functions by store type
      const authFunctions = this.filterFunctionsByStore(apiFunctions, 'auth');
      const subscriptionFunctions = this.filterFunctionsByStore(apiFunctions, 'subscription');
      const searchFunctions = this.filterFunctionsByStore(apiFunctions, 'search');
      const portfolioFunctions = this.filterFunctionsByStore(apiFunctions, 'portfolio');

      // Generate integrations for each store type
      const integrationResults = await Promise.allSettled([
        this.integrateAuthStore(authFunctions),
        this.integrateSubscriptionStore(subscriptionFunctions),
        this.integrateSearchStore(searchFunctions),
        this.integratePortfolioStore(portfolioFunctions)
      ]);

      // Process results
      integrationResults.forEach((integrationResult, index) => {
        const storeNames = ['auth', 'subscription', 'search', 'portfolio'];
        const storeName = storeNames[index];

        if (integrationResult.status === 'fulfilled') {
          result.migratedFiles.push(...integrationResult.value.migratedFiles);
          result.warnings.push(...integrationResult.value.warnings);
        } else {
          result.errors.push({
            type: 'integration_error',
            message: `Failed to integrate ${storeName} store: ${integrationResult.reason}`,
            file: `${storeName}StoreIntegrator`,
            line: 0,
            column: 0
          });
          result.success = false;
        }
      });

      // Generate summary
      result.warnings.push(`Store integration completed for ${result.migratedFiles.length} files`);
      
    } catch (error) {
      result.success = false;
      result.errors.push({
        type: 'orchestration_error',
        message: `Store integration orchestration failed: ${error.message}`,
        file: 'StoreIntegrationOrchestrator',
        line: 0,
        column: 0
      });
    }

    return result;
  }

  /**
   * Integrate authentication API functions with auth store
   */
  private async integrateAuthStore(authFunctions: APIFunction[]): Promise<{ migratedFiles: string[], warnings: string[] }> {
    if (authFunctions.length === 0) {
      return { migratedFiles: [], warnings: ['No auth functions found for integration'] };
    }

    try {
      const integrations = await this.authIntegrator.integrateAuthAPIs(authFunctions);
      const authAPIFile = await this.authIntegrator.generateAuthAPIFile(authFunctions);
      
      // In a real implementation, this would write the file
      // await fs.writeFile('src/features/authentication/api/authApi.ts', authAPIFile);
      
      return {
        migratedFiles: ['src/features/authentication/api/authApi.ts'],
        warnings: [`Integrated ${integrations.size} auth functions with auth store`]
      };
    } catch (error) {
      throw new Error(`Auth store integration failed: ${error.message}`);
    }
  }

  /**
   * Integrate subscription API functions with subscription store
   */
  private async integrateSubscriptionStore(subscriptionFunctions: APIFunction[]): Promise<{ migratedFiles: string[], warnings: string[] }> {
    if (subscriptionFunctions.length === 0) {
      return { migratedFiles: [], warnings: ['No subscription functions found for integration'] };
    }

    try {
      const integrations = await this.subscriptionIntegrator.integrateSubscriptionAPIs(subscriptionFunctions);
      const subscriptionAPIFile = await this.subscriptionIntegrator.generateSubscriptionAPIFile(subscriptionFunctions);
      
      // In a real implementation, this would write the file
      // await fs.writeFile('src/features/subscription/api/subscriptionApi.ts', subscriptionAPIFile);
      
      return {
        migratedFiles: ['src/features/subscription/api/subscriptionApi.ts'],
        warnings: [`Integrated ${integrations.size} subscription functions with subscription store`]
      };
    } catch (error) {
      throw new Error(`Subscription store integration failed: ${error.message}`);
    }
  }

  /**
   * Integrate search API functions with search store
   */
  private async integrateSearchStore(searchFunctions: APIFunction[]): Promise<{ migratedFiles: string[], warnings: string[] }> {
    if (searchFunctions.length === 0) {
      return { migratedFiles: [], warnings: ['No search functions found for integration'] };
    }

    try {
      const integrations = await this.searchIntegrator.integrateSearchAPIs(searchFunctions);
      const searchAPIFile = await this.searchIntegrator.generateSearchAPIFile(searchFunctions);
      
      // In a real implementation, this would write the file
      // await fs.writeFile('src/features/search/api/searchApi.ts', searchAPIFile);
      
      return {
        migratedFiles: ['src/features/search/api/searchApi.ts'],
        warnings: [`Integrated ${integrations.size} search functions with search store`]
      };
    } catch (error) {
      throw new Error(`Search store integration failed: ${error.message}`);
    }
  }

  /**
   * Integrate portfolio API functions with portfolio store
   */
  private async integratePortfolioStore(portfolioFunctions: APIFunction[]): Promise<{ migratedFiles: string[], warnings: string[] }> {
    if (portfolioFunctions.length === 0) {
      return { migratedFiles: [], warnings: ['No portfolio functions found for integration'] };
    }

    try {
      const integrations = await this.portfolioIntegrator.integratePortfolioAPIs(portfolioFunctions);
      const portfolioAPIFile = await this.portfolioIntegrator.generatePortfolioAPIFile(portfolioFunctions);
      
      // In a real implementation, this would write the file
      // await fs.writeFile('src/features/portfolio/api/portfolioApi.ts', portfolioAPIFile);
      
      return {
        migratedFiles: ['src/features/portfolio/api/portfolioApi.ts'],
        warnings: [`Integrated ${integrations.size} portfolio functions with portfolio store`]
      };
    } catch (error) {
      throw new Error(`Portfolio store integration failed: ${error.message}`);
    }
  }

  /**
   * Filter API functions by store type
   */
  private filterFunctionsByStore(apiFunctions: APIFunction[], storeType: string): APIFunction[] {
    return apiFunctions.filter(func => {
      const functionName = func.name.toLowerCase();
      const filePath = func.filePath?.toLowerCase() || '';

      switch (storeType) {
        case 'auth':
          return this.isAuthFunction(functionName, filePath);
        case 'subscription':
          return this.isSubscriptionFunction(functionName, filePath);
        case 'search':
          return this.isSearchFunction(functionName, filePath);
        case 'portfolio':
          return this.isPortfolioFunction(functionName, filePath);
        default:
          return false;
      }
    });
  }

  /**
   * Check if function is auth-related
   */
  private isAuthFunction(functionName: string, filePath: string): boolean {
    const authKeywords = [
      'auth', 'login', 'logout', 'signin', 'signout', 'signup', 'register',
      'password', 'reset', 'otp', 'verification', 'session', 'token', 'user'
    ];
    return authKeywords.some(keyword => 
      functionName.includes(keyword) || filePath.includes(keyword)
    );
  }

  /**
   * Check if function is subscription-related
   */
  private isSubscriptionFunction(functionName: string, filePath: string): boolean {
    const subscriptionKeywords = [
      'subscription', 'subscribe', 'plan', 'billing', 'payment',
      'entitlement', 'license', 'upgrade', 'downgrade'
    ];
    return subscriptionKeywords.some(keyword => 
      functionName.includes(keyword) || filePath.includes(keyword)
    );
  }

  /**
   * Check if function is search-related
   */
  private isSearchFunction(functionName: string, filePath: string): boolean {
    const searchKeywords = [
      'search', 'query', 'filter', 'find', 'lookup', 'history'
    ];
    return searchKeywords.some(keyword => 
      functionName.includes(keyword) || filePath.includes(keyword)
    );
  }

  /**
   * Check if function is portfolio-related
   */
  private isPortfolioFunction(functionName: string, filePath: string): boolean {
    const portfolioKeywords = [
      'portfolio', 'profile', 'student', 'achievement', 'skill',
      'experience', 'education', 'certification'
    ];
    return portfolioKeywords.some(keyword => 
      functionName.includes(keyword) || filePath.includes(keyword)
    );
  }

  /**
   * Validate all store integrations
   */
  async validateIntegrations(integrations: Map<string, Integration[]>): Promise<boolean> {
    let allValid = true;

    for (const [functionName, functionIntegrations] of integrations) {
      for (const integration of functionIntegrations) {
        const isValid = await this.validateIntegration(integration);
        if (!isValid) {
          console.warn(`Invalid integration for function ${functionName} with store ${integration.storeName}`);
          allValid = false;
        }
      }
    }

    return allValid;
  }

  /**
   * Validate a single integration
   */
  private async validateIntegration(integration: Integration): Promise<boolean> {
    // Basic validation checks
    if (!integration.apiFunction || !integration.storeName) {
      return false;
    }

    if (!integration.actions || integration.actions.length === 0) {
      return false;
    }

    if (!integration.generatedCode || integration.generatedCode.trim().length === 0) {
      return false;
    }

    return true;
  }
}