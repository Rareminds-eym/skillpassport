import { APIFunction, StoreIntegration, ZustandStore, StoreAction } from '@/features/student-profile/model';

/**
 * Analyzes API functions to determine which Zustand stores they should integrate with
 * and what store actions they should trigger.
 */
export class StoreIntegrationAnalyzer {
  private readonly storeMapping: Map<string, ZustandStore>;

  constructor() {
    this.storeMapping = this.initializeStoreMapping();
  }

  /**
   * Initialize the mapping of store names to their configurations
   */
  private initializeStoreMapping(): Map<string, ZustandStore> {
    const stores = new Map<string, ZustandStore>();

    // Auth Store Configuration
    stores.set('auth', {
      name: 'useAuthStore',
      path: 'src/stores/authStore.ts',
      actions: [
        { name: 'login', parameters: ['user', 'session'], returnType: 'void' },
        { name: 'logout', parameters: [], returnType: 'void' },
        { name: 'updateUser', parameters: ['user'], returnType: 'void' },
        { name: 'initialize', parameters: [], returnType: 'Promise<void>' },
        { name: 'refreshSession', parameters: [], returnType: 'Promise<void>' },
        { name: 'showErrorNotification', parameters: ['message'], returnType: 'void' },
        { name: 'dismissErrorNotification', parameters: [], returnType: 'void' }
      ],
      selectors: [
        { name: 'user', returnType: 'User | null' },
        { name: 'session', returnType: 'Session | null' },
        { name: 'isAuthenticated', returnType: 'boolean' },
        { name: 'loading', returnType: 'boolean' },
        { name: 'role', returnType: 'string | null' }
      ],
      state: {
        properties: ['user', 'session', 'isAuthenticated', 'loading', 'role', 'errorNotification']
      }
    });

    // Search Store Configuration
    stores.set('search', {
      name: 'useSearchStore',
      path: 'src/stores/searchStore.ts',
      actions: [
        { name: 'handleSearch', parameters: ['query'], returnType: 'void' },
        { name: 'clearSearch', parameters: [], returnType: 'void' },
        { name: 'setSearchQuery', parameters: ['query'], returnType: 'void' },
        { name: 'setSearchResults', parameters: ['results'], returnType: 'void' },
        { name: 'setIsSearching', parameters: ['isSearching'], returnType: 'void' },
        { name: 'addFilter', parameters: ['key', 'value'], returnType: 'void' },
        { name: 'removeFilter', parameters: ['key'], returnType: 'void' },
        { name: 'clearFilters', parameters: [], returnType: 'void' },
        { name: 'addToHistory', parameters: ['query'], returnType: 'void' }
      ],
      selectors: [
        { name: 'searchQuery', returnType: 'string' },
        { name: 'searchResults', returnType: 'SearchResult[]' },
        { name: 'isSearching', returnType: 'boolean' },
        { name: 'filters', returnType: 'SearchFilters' },
        { name: 'searchHistory', returnType: 'string[]' }
      ],
      state: {
        properties: ['searchQuery', 'searchResults', 'isSearching', 'filters', 'searchHistory']
      }
    });

    // Subscription Store Configuration
    stores.set('subscription', {
      name: 'useSubscriptionStore',
      path: 'src/stores/subscriptionStore.ts',
      actions: [
        { name: 'updateSubscription', parameters: ['subscription'], returnType: 'void' },
        { name: 'setLoading', parameters: ['loading'], returnType: 'void' },
        { name: 'setError', parameters: ['error'], returnType: 'void' }
      ],
      selectors: [
        { name: 'subscription', returnType: 'Subscription | null' },
        { name: 'loading', returnType: 'boolean' },
        { name: 'error', returnType: 'string | null' }
      ],
      state: {
        properties: ['subscription', 'loading', 'error']
      }
    });

    // Portfolio Store Configuration
    stores.set('portfolio', {
      name: 'usePortfolioStore',
      path: 'src/stores/portfolioStore.ts',
      actions: [
        { name: 'setPortfolio', parameters: ['portfolio'], returnType: 'void' },
        { name: 'updatePortfolioSettings', parameters: ['settings'], returnType: 'void' },
        { name: 'setLoading', parameters: ['loading'], returnType: 'void' },
        { name: 'setError', parameters: ['error'], returnType: 'void' }
      ],
      selectors: [
        { name: 'portfolio', returnType: 'Portfolio | null' },
        { name: 'settings', returnType: 'PortfolioSettings' },
        { name: 'loading', returnType: 'boolean' },
        { name: 'error', returnType: 'string | null' }
      ],
      state: {
        properties: ['portfolio', 'settings', 'loading', 'error']
      }
    });

    return stores;
  }

  /**
   * Identify which API functions should integrate with Zustand stores
   */
  async identifyStoreIntegrations(apiFunctions: APIFunction[]): Promise<Map<string, StoreIntegration[]>> {
    const integrations = new Map<string, StoreIntegration[]>();

    for (const apiFunction of apiFunctions) {
      const storeIntegrations = await this.analyzeFunction(apiFunction);
      if (storeIntegrations.length > 0) {
        integrations.set(apiFunction.name, storeIntegrations);
      }
    }

    return integrations;
  }

  /**
   * Analyze a single API function to determine store integrations
   */
  private async analyzeFunction(apiFunction: APIFunction): Promise<StoreIntegration[]> {
    const integrations: StoreIntegration[] = [];

    // Auth-related functions
    if (this.isAuthFunction(apiFunction)) {
      const authStore = this.storeMapping.get('auth')!;
      integrations.push({
        storeName: 'auth',
        storeHook: 'useAuthActions',
        actions: this.getAuthActions(apiFunction),
        selectors: this.getAuthSelectors(apiFunction),
        integrationPattern: 'direct'
      });
    }

    // Search-related functions
    if (this.isSearchFunction(apiFunction)) {
      const searchStore = this.storeMapping.get('search')!;
      integrations.push({
        storeName: 'search',
        storeHook: 'useSearchActions',
        actions: this.getSearchActions(apiFunction),
        selectors: this.getSearchSelectors(apiFunction),
        integrationPattern: 'direct'
      });
    }

    // Subscription-related functions
    if (this.isSubscriptionFunction(apiFunction)) {
      const subscriptionStore = this.storeMapping.get('subscription')!;
      integrations.push({
        storeName: 'subscription',
        storeHook: 'useSubscriptionStore',
        actions: this.getSubscriptionActions(apiFunction),
        selectors: this.getSubscriptionSelectors(apiFunction),
        integrationPattern: 'direct'
      });
    }

    // Portfolio-related functions
    if (this.isPortfolioFunction(apiFunction)) {
      const portfolioStore = this.storeMapping.get('portfolio')!;
      integrations.push({
        storeName: 'portfolio',
        storeHook: 'usePortfolioActions',
        actions: this.getPortfolioActions(apiFunction),
        selectors: this.getPortfolioSelectors(apiFunction),
        integrationPattern: 'direct'
      });
    }

    return integrations;
  }

  /**
   * Check if an API function is auth-related
   */
  private isAuthFunction(apiFunction: APIFunction): boolean {
    const authKeywords = [
      'auth', 'login', 'logout', 'signin', 'signout', 'signup', 'register',
      'password', 'reset', 'otp', 'verification', 'session', 'token',
      'user', 'profile', 'account'
    ];

    const functionName = apiFunction.name.toLowerCase();
    const filePath = apiFunction.filePath?.toLowerCase() || '';

    return authKeywords.some(keyword => 
      functionName.includes(keyword) || filePath.includes(keyword)
    );
  }

  /**
   * Check if an API function is search-related
   */
  private isSearchFunction(apiFunction: APIFunction): boolean {
    const searchKeywords = [
      'search', 'query', 'filter', 'find', 'lookup', 'history'
    ];

    const functionName = apiFunction.name.toLowerCase();
    const filePath = apiFunction.filePath?.toLowerCase() || '';

    return searchKeywords.some(keyword => 
      functionName.includes(keyword) || filePath.includes(keyword)
    );
  }

  /**
   * Check if an API function is subscription-related
   */
  private isSubscriptionFunction(apiFunction: APIFunction): boolean {
    const subscriptionKeywords = [
      'subscription', 'subscribe', 'plan', 'billing', 'payment',
      'entitlement', 'license', 'upgrade', 'downgrade'
    ];

    const functionName = apiFunction.name.toLowerCase();
    const filePath = apiFunction.filePath?.toLowerCase() || '';

    return subscriptionKeywords.some(keyword => 
      functionName.includes(keyword) || filePath.includes(keyword)
    );
  }

  /**
   * Check if an API function is portfolio-related
   */
  private isPortfolioFunction(apiFunction: APIFunction): boolean {
    const portfolioKeywords = [
      'portfolio', 'profile', 'student', 'achievement', 'skill',
      'experience', 'education', 'certification'
    ];

    const functionName = apiFunction.name.toLowerCase();
    const filePath = apiFunction.filePath?.toLowerCase() || '';

    return portfolioKeywords.some(keyword => 
      functionName.includes(keyword) || filePath.includes(keyword)
    );
  }

  /**
   * Get appropriate auth store actions for a function
   */
  private getAuthActions(apiFunction: APIFunction): string[] {
    const functionName = apiFunction.name.toLowerCase();
    const actions: string[] = [];

    if (functionName.includes('login') || functionName.includes('signin')) {
      actions.push('login');
    }
    if (functionName.includes('logout') || functionName.includes('signout')) {
      actions.push('logout');
    }
    if (functionName.includes('update') && functionName.includes('user')) {
      actions.push('updateUser');
    }
    if (functionName.includes('refresh')) {
      actions.push('refreshSession');
    }
    if (functionName.includes('error') || functionName.includes('notification')) {
      actions.push('showErrorNotification');
    }

    return actions;
  }

  /**
   * Get appropriate auth store selectors for a function
   */
  private getAuthSelectors(apiFunction: APIFunction): string[] {
    const functionName = apiFunction.name.toLowerCase();
    const selectors: string[] = [];

    if (functionName.includes('user') || functionName.includes('profile')) {
      selectors.push('user');
    }
    if (functionName.includes('session') || functionName.includes('auth')) {
      selectors.push('session', 'isAuthenticated');
    }
    if (functionName.includes('role')) {
      selectors.push('role');
    }

    return selectors;
  }

  /**
   * Get appropriate search store actions for a function
   */
  private getSearchActions(apiFunction: APIFunction): string[] {
    const functionName = apiFunction.name.toLowerCase();
    const actions: string[] = [];

    if (functionName.includes('search')) {
      actions.push('handleSearch', 'setSearchResults');
    }
    if (functionName.includes('filter')) {
      actions.push('addFilter', 'removeFilter');
    }
    if (functionName.includes('history')) {
      actions.push('addToHistory');
    }
    if (functionName.includes('clear')) {
      actions.push('clearSearch');
    }

    return actions;
  }

  /**
   * Get appropriate search store selectors for a function
   */
  private getSearchSelectors(apiFunction: APIFunction): string[] {
    const functionName = apiFunction.name.toLowerCase();
    const selectors: string[] = [];

    if (functionName.includes('search')) {
      selectors.push('searchQuery', 'searchResults', 'isSearching');
    }
    if (functionName.includes('filter')) {
      selectors.push('filters');
    }
    if (functionName.includes('history')) {
      selectors.push('searchHistory');
    }

    return selectors;
  }

  /**
   * Get appropriate subscription store actions for a function
   */
  private getSubscriptionActions(apiFunction: APIFunction): string[] {
    const functionName = apiFunction.name.toLowerCase();
    const actions: string[] = [];

    if (functionName.includes('subscription') || functionName.includes('plan')) {
      actions.push('updateSubscription');
    }
    if (functionName.includes('loading')) {
      actions.push('setLoading');
    }
    if (functionName.includes('error')) {
      actions.push('setError');
    }

    return actions;
  }

  /**
   * Get appropriate subscription store selectors for a function
   */
  private getSubscriptionSelectors(apiFunction: APIFunction): string[] {
    const functionName = apiFunction.name.toLowerCase();
    const selectors: string[] = [];

    if (functionName.includes('subscription') || functionName.includes('plan')) {
      selectors.push('subscription');
    }
    if (functionName.includes('loading')) {
      selectors.push('loading');
    }
    if (functionName.includes('error')) {
      selectors.push('error');
    }

    return selectors;
  }

  /**
   * Get appropriate portfolio store actions for a function
   */
  private getPortfolioActions(apiFunction: APIFunction): string[] {
    const functionName = apiFunction.name.toLowerCase();
    const actions: string[] = [];

    if (functionName.includes('portfolio')) {
      actions.push('setPortfolio');
    }
    if (functionName.includes('settings')) {
      actions.push('updatePortfolioSettings');
    }
    if (functionName.includes('loading')) {
      actions.push('setLoading');
    }
    if (functionName.includes('error')) {
      actions.push('setError');
    }

    return actions;
  }

  /**
   * Get appropriate portfolio store selectors for a function
   */
  private getPortfolioSelectors(apiFunction: APIFunction): string[] {
    const functionName = apiFunction.name.toLowerCase();
    const selectors: string[] = [];

    if (functionName.includes('portfolio')) {
      selectors.push('portfolio');
    }
    if (functionName.includes('settings')) {
      selectors.push('settings');
    }
    if (functionName.includes('loading')) {
      selectors.push('loading');
    }
    if (functionName.includes('error')) {
      selectors.push('error');
    }

    return selectors;
  }

  /**
   * Get store configuration by name
   */
  getStoreConfig(storeName: string): ZustandStore | undefined {
    return this.storeMapping.get(storeName);
  }

  /**
   * Get all available stores
   */
  getAllStores(): Map<string, ZustandStore> {
    return new Map(this.storeMapping);
  }
}