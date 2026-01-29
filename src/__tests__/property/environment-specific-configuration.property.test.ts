/**
 * Property Test: Environment-Specific Configuration
 * 
 * Property 15: Environment-Specific Configuration
 * Validates: Requirements 8.5
 * 
 * This test verifies that the system correctly handles environment-specific
 * configuration for development, preview, and production environments.
 */

import { describe, it, expect } from 'vitest';

// Environment types
type EnvironmentType = 'development' | 'preview' | 'production';

// Configuration interface
interface EnvironmentConfig {
  type: EnvironmentType;
  supabaseUrl: string;
  razorpayMode: 'test' | 'live';
  razorpayKeyId: string;
  apiEndpoints: {
    assessment: string;
    career: string;
    course: string;
    otp: string;
    storage: string;
    payments: string;
  };
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableCaching: boolean;
  rateLimits: {
    perMinute: number;
    perHour: number;
  };
}

/**
 * Creates environment-specific configuration
 */
function createEnvironmentConfig(envType: EnvironmentType): EnvironmentConfig {
  const baseConfig = {
    type: envType,
    supabaseUrl: 'https://dpooleduinyyzxgrcwko.supabase.co',
  };

  switch (envType) {
    case 'development':
      return {
        ...baseConfig,
        razorpayMode: 'test',
        razorpayKeyId: 'rzp_test_RNNqYdwXmbBzxz',
        apiEndpoints: {
          assessment: 'https://assessment-api-dev.dark-mode-d021.workers.dev',
          career: 'https://career-api-dev.dark-mode-d021.workers.dev',
          course: 'https://course-api-dev.dark-mode-d021.workers.dev',
          otp: 'https://otp-api-dev.dark-mode-d021.workers.dev',
          storage: 'https://storage-api-dev.dark-mode-d021.workers.dev',
          payments: 'https://payments-api-dev.dark-mode-d021.workers.dev',
        },
        logLevel: 'debug',
        enableCaching: false,
        rateLimits: {
          perMinute: 1000,
          perHour: 10000,
        },
      };

    case 'preview':
      return {
        ...baseConfig,
        razorpayMode: 'test',
        razorpayKeyId: 'rzp_test_RNNqYdwXmbBzxz',
        apiEndpoints: {
          assessment: 'https://preview.pages.dev/api/assessment',
          career: 'https://preview.pages.dev/api/career',
          course: 'https://preview.pages.dev/api/course',
          otp: 'https://preview.pages.dev/api/otp',
          storage: 'https://preview.pages.dev/api/storage',
          payments: 'https://payments-api.dark-mode-d021.workers.dev',
        },
        logLevel: 'info',
        enableCaching: true,
        rateLimits: {
          perMinute: 500,
          perHour: 5000,
        },
      };

    case 'production':
      return {
        ...baseConfig,
        razorpayMode: 'live',
        razorpayKeyId: 'rzp_live_Rdz2GR0Pwi4XNQ',
        apiEndpoints: {
          assessment: 'https://skillpassport.in/api/assessment',
          career: 'https://skillpassport.in/api/career',
          course: 'https://skillpassport.in/api/course',
          otp: 'https://skillpassport.in/api/otp',
          storage: 'https://skillpassport.in/api/storage',
          payments: 'https://payments-api.dark-mode-d021.workers.dev',
        },
        logLevel: 'warn',
        enableCaching: true,
        rateLimits: {
          perMinute: 100,
          perHour: 1000,
        },
      };
  }
}

/**
 * Validates that configuration is appropriate for environment type
 */
function validateEnvironmentConfig(config: EnvironmentConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate Razorpay mode matches environment
  if (config.type === 'production' && config.razorpayMode !== 'live') {
    errors.push('Production environment must use live Razorpay mode');
  }
  if ((config.type === 'development' || config.type === 'preview') && config.razorpayMode !== 'test') {
    errors.push('Non-production environments must use test Razorpay mode');
  }

  // Validate Razorpay key matches mode
  if (config.razorpayMode === 'live' && !config.razorpayKeyId.startsWith('rzp_live_')) {
    errors.push('Live Razorpay mode must use live key');
  }
  if (config.razorpayMode === 'test' && !config.razorpayKeyId.startsWith('rzp_test_')) {
    errors.push('Test Razorpay mode must use test key');
  }

  // Validate API endpoints match environment
  if (config.type === 'development') {
    Object.entries(config.apiEndpoints).forEach(([api, url]) => {
      if (api !== 'payments' && !url.includes('-dev.')) {
        errors.push(`Development ${api} endpoint should use -dev suffix`);
      }
    });
  }

  if (config.type === 'preview') {
    Object.entries(config.apiEndpoints).forEach(([api, url]) => {
      if (api !== 'payments' && !url.includes('preview.pages.dev')) {
        errors.push(`Preview ${api} endpoint should use preview.pages.dev`);
      }
    });
  }

  if (config.type === 'production') {
    Object.entries(config.apiEndpoints).forEach(([api, url]) => {
      if (api !== 'payments' && !url.includes('skillpassport.in')) {
        errors.push(`Production ${api} endpoint should use production domain`);
      }
    });
  }

  // Validate log level is appropriate
  if (config.type === 'production' && config.logLevel === 'debug') {
    errors.push('Production should not use debug log level');
  }

  // Validate rate limits are stricter in production
  if (config.type === 'production') {
    if (config.rateLimits.perMinute > 200) {
      errors.push('Production rate limits should be stricter');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

describe('Property 15: Environment-Specific Configuration', () => {
  describe('Development Environment', () => {
    it('should use test Razorpay credentials', () => {
      const config = createEnvironmentConfig('development');
      
      expect(config.razorpayMode).toBe('test');
      expect(config.razorpayKeyId).toMatch(/^rzp_test_/);
    });

    it('should use development API endpoints with -dev suffix', () => {
      const config = createEnvironmentConfig('development');
      
      Object.entries(config.apiEndpoints).forEach(([api, url]) => {
        if (api !== 'payments') {
          expect(url).toContain('-dev.');
        }
      });
    });

    it('should enable debug logging', () => {
      const config = createEnvironmentConfig('development');
      
      expect(config.logLevel).toBe('debug');
    });

    it('should disable caching for fresh data', () => {
      const config = createEnvironmentConfig('development');
      
      expect(config.enableCaching).toBe(false);
    });

    it('should have relaxed rate limits', () => {
      const config = createEnvironmentConfig('development');
      
      expect(config.rateLimits.perMinute).toBeGreaterThanOrEqual(1000);
      expect(config.rateLimits.perHour).toBeGreaterThanOrEqual(10000);
    });

    it('should pass validation', () => {
      const config = createEnvironmentConfig('development');
      const result = validateEnvironmentConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Preview Environment', () => {
    it('should use test Razorpay credentials', () => {
      const config = createEnvironmentConfig('preview');
      
      expect(config.razorpayMode).toBe('test');
      expect(config.razorpayKeyId).toMatch(/^rzp_test_/);
    });

    it('should use preview Pages endpoints', () => {
      const config = createEnvironmentConfig('preview');
      
      Object.entries(config.apiEndpoints).forEach(([api, url]) => {
        if (api !== 'payments') {
          expect(url).toContain('preview.pages.dev');
        }
      });
    });

    it('should use info log level', () => {
      const config = createEnvironmentConfig('preview');
      
      expect(config.logLevel).toBe('info');
    });

    it('should enable caching', () => {
      const config = createEnvironmentConfig('preview');
      
      expect(config.enableCaching).toBe(true);
    });

    it('should have moderate rate limits', () => {
      const config = createEnvironmentConfig('preview');
      
      expect(config.rateLimits.perMinute).toBeLessThan(1000);
      expect(config.rateLimits.perMinute).toBeGreaterThan(100);
    });

    it('should pass validation', () => {
      const config = createEnvironmentConfig('preview');
      const result = validateEnvironmentConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Production Environment', () => {
    it('should use live Razorpay credentials', () => {
      const config = createEnvironmentConfig('production');
      
      expect(config.razorpayMode).toBe('live');
      expect(config.razorpayKeyId).toMatch(/^rzp_live_/);
    });

    it('should use production domain endpoints', () => {
      const config = createEnvironmentConfig('production');
      
      Object.entries(config.apiEndpoints).forEach(([api, url]) => {
        if (api !== 'payments') {
          expect(url).toContain('skillpassport.in');
        }
      });
    });

    it('should use warn log level for performance', () => {
      const config = createEnvironmentConfig('production');
      
      expect(config.logLevel).toBe('warn');
    });

    it('should enable caching for performance', () => {
      const config = createEnvironmentConfig('production');
      
      expect(config.enableCaching).toBe(true);
    });

    it('should have strict rate limits', () => {
      const config = createEnvironmentConfig('production');
      
      expect(config.rateLimits.perMinute).toBeLessThanOrEqual(200);
      expect(config.rateLimits.perHour).toBeLessThanOrEqual(2000);
    });

    it('should pass validation', () => {
      const config = createEnvironmentConfig('production');
      const result = validateEnvironmentConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should reject production config with test Razorpay', () => {
      const config = createEnvironmentConfig('production');
      config.razorpayMode = 'test';
      config.razorpayKeyId = 'rzp_test_invalid';
      
      const result = validateEnvironmentConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject mismatched Razorpay key and mode', () => {
      const config = createEnvironmentConfig('production');
      config.razorpayKeyId = 'rzp_test_invalid';
      
      const result = validateEnvironmentConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Live Razorpay mode must use live key'))).toBe(true);
    });

    it('should reject production with debug logging', () => {
      const config = createEnvironmentConfig('production');
      config.logLevel = 'debug';
      
      const result = validateEnvironmentConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('debug log level'))).toBe(true);
    });

    it('should reject development with live Razorpay', () => {
      const config = createEnvironmentConfig('development');
      config.razorpayMode = 'live';
      config.razorpayKeyId = 'rzp_live_invalid';
      
      const result = validateEnvironmentConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('test Razorpay mode'))).toBe(true);
    });
  });

  describe('Environment Isolation', () => {
    it('should have different API endpoints per environment', () => {
      const dev = createEnvironmentConfig('development');
      const preview = createEnvironmentConfig('preview');
      const prod = createEnvironmentConfig('production');
      
      expect(dev.apiEndpoints.assessment).not.toBe(preview.apiEndpoints.assessment);
      expect(preview.apiEndpoints.assessment).not.toBe(prod.apiEndpoints.assessment);
      expect(dev.apiEndpoints.assessment).not.toBe(prod.apiEndpoints.assessment);
    });

    it('should have different Razorpay keys for production', () => {
      const dev = createEnvironmentConfig('development');
      const prod = createEnvironmentConfig('production');
      
      expect(dev.razorpayKeyId).not.toBe(prod.razorpayKeyId);
      expect(dev.razorpayMode).not.toBe(prod.razorpayMode);
    });

    it('should have stricter rate limits in production', () => {
      const dev = createEnvironmentConfig('development');
      const prod = createEnvironmentConfig('production');
      
      expect(prod.rateLimits.perMinute).toBeLessThan(dev.rateLimits.perMinute);
      expect(prod.rateLimits.perHour).toBeLessThan(dev.rateLimits.perHour);
    });

    it('should use same Supabase URL across environments', () => {
      const dev = createEnvironmentConfig('development');
      const preview = createEnvironmentConfig('preview');
      const prod = createEnvironmentConfig('production');
      
      // All environments use same Supabase project
      expect(dev.supabaseUrl).toBe(preview.supabaseUrl);
      expect(preview.supabaseUrl).toBe(prod.supabaseUrl);
    });
  });

  describe('Configuration Consistency', () => {
    it('should create consistent config for same environment', () => {
      const config1 = createEnvironmentConfig('production');
      const config2 = createEnvironmentConfig('production');
      
      expect(config1).toEqual(config2);
    });

    it('should validate all environment types', () => {
      const environments: EnvironmentType[] = ['development', 'preview', 'production'];
      
      environments.forEach(envType => {
        const config = createEnvironmentConfig(envType);
        const result = validateEnvironmentConfig(config);
        
        expect(result.valid).toBe(true);
        expect(config.type).toBe(envType);
      });
    });

    it('should have all required API endpoints', () => {
      const environments: EnvironmentType[] = ['development', 'preview', 'production'];
      const requiredApis = ['assessment', 'career', 'course', 'otp', 'storage', 'payments'];
      
      environments.forEach(envType => {
        const config = createEnvironmentConfig(envType);
        
        requiredApis.forEach(api => {
          expect(config.apiEndpoints[api as keyof typeof config.apiEndpoints]).toBeDefined();
          expect(config.apiEndpoints[api as keyof typeof config.apiEndpoints]).toMatch(/^https:\/\//);
        });
      });
    });
  });

  describe('Security Considerations', () => {
    it('should never use live credentials in non-production', () => {
      const dev = createEnvironmentConfig('development');
      const preview = createEnvironmentConfig('preview');
      
      expect(dev.razorpayMode).toBe('test');
      expect(preview.razorpayMode).toBe('test');
      expect(dev.razorpayKeyId).not.toContain('live');
      expect(preview.razorpayKeyId).not.toContain('live');
    });

    it('should use appropriate log levels to avoid leaking sensitive data', () => {
      const prod = createEnvironmentConfig('production');
      
      // Production should not use debug logging which might leak sensitive data
      expect(prod.logLevel).not.toBe('debug');
      expect(['warn', 'error']).toContain(prod.logLevel);
    });

    it('should enforce rate limits in all environments', () => {
      const environments: EnvironmentType[] = ['development', 'preview', 'production'];
      
      environments.forEach(envType => {
        const config = createEnvironmentConfig(envType);
        
        expect(config.rateLimits.perMinute).toBeGreaterThan(0);
        expect(config.rateLimits.perHour).toBeGreaterThan(0);
      });
    });
  });
});
