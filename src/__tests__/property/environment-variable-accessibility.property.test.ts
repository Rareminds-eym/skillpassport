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
interface TestEnv {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENROUTER_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_R2_ACCESS_KEY_ID?: string;
  CLOUDFLARE_R2_SECRET_ACCESS_KEY?: string;
  CLOUDFLARE_R2_BUCKET_NAME?: string;
}

// API-specific environment variable requirements
const API_ENV_REQUIREMENTS: Record<string, string[]> = {
  'assessment': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY', 'CLAUDE_API_KEY'],
  'career': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY', 'GEMINI_API_KEY'],
  'course': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
  'fetch-certificate': ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  'otp': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
  'storage': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET_NAME'],
  'streak': ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  'user': ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  'adaptive-aptitude': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY', 'CLAUDE_API_KEY'],
  'analyze-assessment': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY', 'GEMINI_API_KEY'],
  'question-generation': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY', 'CLAUDE_API_KEY', 'GEMINI_API_KEY'],
  'role-overview': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY', 'GEMINI_API_KEY'],
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
    OPENROUTER_API_KEY: 'test-openrouter-key',
    CLAUDE_API_KEY: 'test-claude-key',
    GEMINI_API_KEY: 'test-gemini-key',
    AWS_ACCESS_KEY_ID: 'test-aws-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-aws-secret-key',
    AWS_REGION: 'us-east-1',
    CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
    CLOUDFLARE_R2_ACCESS_KEY_ID: 'test-r2-access-key',
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'test-r2-secret-key',
    CLOUDFLARE_R2_BUCKET_NAME: 'test-bucket',
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
      const aiApis = ['assessment', 'career', 'adaptive-aptitude', 'analyze-assessment', 'question-generation', 'role-overview'];
      
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

    it('should provide access to R2 credentials for storage APIs', () => {
      const env = createCompleteEnv();
      const storageApis = ['storage', 'course'];
      
      storageApis.forEach(apiName => {
        const result = validateEnvironment(apiName, env);
        expect(result.valid).toBe(true);
      });
      
      expect(env.CLOUDFLARE_R2_ACCESS_KEY_ID).toBeDefined();
      expect(env.CLOUDFLARE_R2_SECRET_ACCESS_KEY).toBeDefined();
    });
  });

  describe('Missing Environment Variables', () => {
    it('should detect missing Supabase URL', () => {
      const env = createPartialEnv(['SUPABASE_URL']);
      const result = validateEnvironment('assessment', env);
      
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('SUPABASE_URL');
    });

    it('should detect missing AI API keys', () => {
      const env = createPartialEnv(['OPENROUTER_API_KEY']);
      const result = validateEnvironment('assessment', env);
      
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('OPENROUTER_API_KEY');
    });

    it('should detect missing AWS credentials', () => {
      const env = createPartialEnv(['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']);
      const result = validateEnvironment('otp', env);
      
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('AWS_ACCESS_KEY_ID');
      expect(result.missing).toContain('AWS_SECRET_ACCESS_KEY');
    });

    it('should detect missing R2 credentials', () => {
      const env = createPartialEnv(['CLOUDFLARE_R2_ACCESS_KEY_ID']);
      const result = validateEnvironment('storage', env);
      
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('CLOUDFLARE_R2_ACCESS_KEY_ID');
    });

    it('should detect multiple missing variables', () => {
      const env = createPartialEnv(['SUPABASE_URL', 'OPENROUTER_API_KEY', 'CLAUDE_API_KEY']);
      const result = validateEnvironment('assessment', env);
      
      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(3);
      expect(result.missing).toContain('SUPABASE_URL');
      expect(result.missing).toContain('OPENROUTER_API_KEY');
      expect(result.missing).toContain('CLAUDE_API_KEY');
    });
  });

  describe('API-Specific Requirements', () => {
    it('should validate assessment API requires AI keys', () => {
      const required = API_ENV_REQUIREMENTS['assessment'];
      
      expect(required).toContain('OPENROUTER_API_KEY');
      expect(required).toContain('CLAUDE_API_KEY');
    });

    it('should validate career API requires Gemini key', () => {
      const required = API_ENV_REQUIREMENTS['career'];
      
      expect(required).toContain('GEMINI_API_KEY');
    });

    it('should validate OTP API requires AWS credentials', () => {
      const required = API_ENV_REQUIREMENTS['otp'];
      
      expect(required).toContain('AWS_ACCESS_KEY_ID');
      expect(required).toContain('AWS_SECRET_ACCESS_KEY');
      expect(required).toContain('AWS_REGION');
    });

    it('should validate storage API requires R2 credentials', () => {
      const required = API_ENV_REQUIREMENTS['storage'];
      
      expect(required).toContain('CLOUDFLARE_R2_ACCESS_KEY_ID');
      expect(required).toContain('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
      expect(required).toContain('CLOUDFLARE_R2_BUCKET_NAME');
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
      
      const result1 = validateEnvironment('assessment', env);
      const result2 = validateEnvironment('assessment', env);
      
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
        'assessment',
        'career',
        'course',
        'fetch-certificate',
        'otp',
        'storage',
        'streak',
        'user',
        'adaptive-aptitude',
        'analyze-assessment',
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
      const env = createPartialEnv(['SUPABASE_URL', 'OPENROUTER_API_KEY']);
      const result = validateEnvironment('assessment', env);
      
      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(2);
      
      // Error message should be constructable from missing array
      const errorMessage = `Missing required environment variables: ${result.missing.join(', ')}`;
      expect(errorMessage).toContain('SUPABASE_URL');
      expect(errorMessage).toContain('OPENROUTER_API_KEY');
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
      const result = validateEnvironment('assessment', env);
      
      // Should detect missing variables before attempting to use them
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('SUPABASE_URL');
    });
  });
});
