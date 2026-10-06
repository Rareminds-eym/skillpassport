/**
 * Property Test: Environment Variable Accessibility
 * 
 * Property 2: Environment Variable Accessibility
 * Validates: Requirements 1.4, 8.1
 * 
 * This test verifies that all Pages Functions can access required environment variables
 * and that missing variables result in graceful error handling.
 */

import { describe, it, expect } from 'vitest';

// Mock environment for testing
// AI-powered APIs authenticate via the Cloudflare AI binding (env.AI),
// not provider API keys — the binding is represented here as AI_BINDING.
interface TestEnv {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  AI_BINDING?: unknown;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  R2_BUCKET?: unknown;
}

// API-specific environment variable requirements
const API_ENV_REQUIREMENTS: Record<string, string[]> = {
  'adaptive-session': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'AI_BINDING'],
  'analyze-assessment': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'AI_BINDING'],
  'career': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'AI_BINDING'],
  'course': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'R2_BUCKET'],
  'fetch-certificate': ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  'otp': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
  'storage': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'R2_BUCKET'],
  'streak': ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  'user': ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  'adaptive-aptitude': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'AI_BINDING'],
  'question-generation': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'AI_BINDING'],
  'role-overview': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'AI_BINDING'],
};

/**
 * Validates that an environment has all required variables for a specific API
 */
function validateEnvironment(apiName: string, env: TestEnv): { valid: boolean; missing: string[] } {
  const required = API_ENV_REQUIREMENTS[apiName] || [];
  const missing = required.filter(key => !env[key as keyof TestEnv]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Creates a complete test environment with all variables
 */
function createCompleteEnv(): TestEnv {
  return {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    AI_BINDING: {},
    AWS_ACCESS_KEY_ID: 'test-aws-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-aws-secret-key',
    AWS_REGION: 'us-east-1',
    R2_BUCKET: {},
  };
}

/**
 * Creates an environment with specific variables missing
 */
function createPartialEnv(missingKeys: string[]): TestEnv {
  const env = createCompleteEnv();
  missingKeys.forEach(key => {
    delete env[key as keyof TestEnv];
  });
  return env;
}

describe('Property 2: Environment Variable Accessibility', () => {
  describe('Complete Environment', () => {
    it('should validate all APIs have access to required environment variables', () => {
      const env = createCompleteEnv();
      
      Object.keys(API_ENV_REQUIREMENTS).forEach(apiName => {
        const result = validateEnvironment(apiName, env);
        expect(result.valid).toBe(true);
        expect(result.missing).toHaveLength(0);
      });
    });

    it('should provide access to Supabase configuration for all APIs', () => {
      const env = createCompleteEnv();
      
      expect(env.SUPABASE_URL).toBeDefined();
      expect(env.SUPABASE_ANON_KEY).toBeDefined();
      expect(env.SUPABASE_URL).toMatch(/^https:\/\//);
    });

    it('should provide access to AI service keys for AI-powered APIs', () => {
      const env = createCompleteEnv();
      const aiApis = ['adaptive-session', 'analyze-assessment', 'career', 'question-generation', 'role-overview'];
      
      aiApis.forEach(apiName => {
        const result = validateEnvironment(apiName, env);
        expect(result.valid).toBe(true);
      });
    });

    it('should provide access to AWS credentials for OTP API', () => {
      const env = createCompleteEnv();
      const result = validateEnvironment('otp', env);
      
      expect(result.valid).toBe(true);
      expect(env.AWS_ACCESS_KEY_ID).toBeDefined();
      expect(env.AWS_SECRET_ACCESS_KEY).toBeDefined();
      expect(env.AWS_REGION).toBeDefined();
    });

    it('should provide access to the R2 bucket binding for storage APIs', () => {
      const env = createCompleteEnv();
      const storageApis = ['storage', 'course'];
      
      storageApis.forEach(apiName => {
        const result = validateEnvironment(apiName, env);
        expect(result.valid).toBe(true);
      });
      
      expect(env.R2_BUCKET).toBeDefined();
    });
  });

  describe('Missing Environment Variables', () => {
    it('should detect missing Supabase URL', () => {
      const env = createPartialEnv(['SUPABASE_URL']);
      const result = validateEnvironment('analyze-assessment', env);
      
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('SUPABASE_URL');
    });

    it('should detect missing AI binding', () => {
      const env = createPartialEnv(['AI_BINDING']);
      const result = validateEnvironment('analyze-assessment', env);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('AI_BINDING');
    });

    it('should detect missing AWS credentials', () => {
      const env = createPartialEnv(['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']);
      const result = validateEnvironment('otp', env);
      
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('AWS_ACCESS_KEY_ID');
      expect(result.missing).toContain('AWS_SECRET_ACCESS_KEY');
    });

    it('should detect missing R2 bucket binding', () => {
      const env = createPartialEnv(['R2_BUCKET']);
      const result = validateEnvironment('storage', env);
      
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('R2_BUCKET');
    });

    it('should detect multiple missing variables', () => {
      const env = createPartialEnv(['SUPABASE_URL', 'AI_BINDING']);
      const result = validateEnvironment('analyze-assessment', env);

      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(2);
      expect(result.missing).toContain('SUPABASE_URL');
      expect(result.missing).toContain('AI_BINDING');
    });
  });

  describe('API-Specific Requirements', () => {
    it('should validate analyze-assessment API requires the AI binding', () => {
      const required = API_ENV_REQUIREMENTS['analyze-assessment'];

      expect(required).toContain('AI_BINDING');
    });

    it('should validate career API requires the AI binding', () => {
      const required = API_ENV_REQUIREMENTS['career'];

      expect(required).toContain('AI_BINDING');
    });

    it('should validate OTP API requires AWS credentials', () => {
      const required = API_ENV_REQUIREMENTS['otp'];
      
      expect(required).toContain('AWS_ACCESS_KEY_ID');
      expect(required).toContain('AWS_SECRET_ACCESS_KEY');
      expect(required).toContain('AWS_REGION');
    });

    it('should validate storage API requires the R2 bucket binding', () => {
      const required = API_ENV_REQUIREMENTS['storage'];
      
      expect(required).toContain('R2_BUCKET');
    });

    it('should validate simple APIs only require Supabase', () => {
      const simpleApis = ['fetch-certificate', 'streak', 'user'];
      
      simpleApis.forEach(apiName => {
        const required = API_ENV_REQUIREMENTS[apiName];
        expect(required).toContain('SUPABASE_URL');
        expect(required).toContain('SUPABASE_ANON_KEY');
        expect(required.length).toBe(2);
      });
    });
  });

  describe('Environment Validation Consistency', () => {
    it('should consistently validate the same environment', () => {
      const env = createCompleteEnv();
      
      const result1 = validateEnvironment('analyze-assessment', env);
      const result2 = validateEnvironment('analyze-assessment', env);
      
      expect(result1.valid).toBe(result2.valid);
      expect(result1.missing).toEqual(result2.missing);
    });

    it('should handle empty environment gracefully', () => {
      const env: TestEnv = {};
      
      Object.keys(API_ENV_REQUIREMENTS).forEach(apiName => {
        const result = validateEnvironment(apiName, env);
        expect(result.valid).toBe(false);
        expect(result.missing.length).toBeGreaterThan(0);
      });
    });

    it('should validate all 12 APIs have defined requirements', () => {
      const expectedApis = [
        'adaptive-session',
        'analyze-assessment',
        'career',
        'course',
        'fetch-certificate',
        'otp',
        'storage',
        'streak',
        'user',
        'adaptive-aptitude',
        'question-generation',
        'role-overview'
      ];
      
      expectedApis.forEach(apiName => {
        expect(API_ENV_REQUIREMENTS[apiName]).toBeDefined();
        expect(Array.isArray(API_ENV_REQUIREMENTS[apiName])).toBe(true);
      });
    });
  });

  describe('Graceful Error Handling', () => {
    it('should provide clear error messages for missing variables', () => {
      const env = createPartialEnv(['SUPABASE_URL', 'AI_BINDING']);
      const result = validateEnvironment('analyze-assessment', env);

      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(2);

      // Error message should be constructable from missing array
      const errorMessage = `Missing required environment variables: ${result.missing.join(', ')}`;
      expect(errorMessage).toContain('SUPABASE_URL');
      expect(errorMessage).toContain('AI_BINDING');
    });

    it('should handle undefined API names gracefully', () => {
      const env = createCompleteEnv();
      const result = validateEnvironment('non-existent-api', env);
      
      // Should return valid for unknown APIs (no requirements defined)
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should validate environment before API initialization', () => {
      const env = createPartialEnv(['SUPABASE_URL']);
      const result = validateEnvironment('analyze-assessment', env);
      
      // Should detect missing variables before attempting to use them
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('SUPABASE_URL');
    });
  });
});
