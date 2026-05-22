/**
 * Integration Test Helpers
 * 
 * Shared utilities for integration tests
 */

import { vi } from 'vitest';

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis()
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
        error: null 
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token', user: { id: 'test-user-id' } } },
        error: null
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: 'new-user-id' }, session: null },
        error: null
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-created-user-id' } },
          error: null
        }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
        listUsers: vi.fn().mockResolvedValue({
          data: { users: [] },
          error: null
        })
      }
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/file.pdf' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/file.pdf' } }))
      }))
    }
  };
}

/**
 * Create mock environment variables for Cloudflare Pages Functions
 */
export function createMockEnv() {
  return {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key'
  };
}

/**
 * Create a mock Request object
 */
export function createMockRequest(
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
): Request {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new Request(url, init);
}

/**
 * Create a mock FormData request
 */
export function createMockFormDataRequest(
  url: string,
  formData: FormData,
  headers?: Record<string, string>
): Request {
  return new Request(url, {
    method: 'POST',
    body: formData,
    headers: {
      ...headers
    }
  });
}

/**
 * Parse response JSON safely
 */
export async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Invalid JSON response', body: text };
  }
}

/**
 * Create a mock File object for testing
 */
export function createMockFile(
  name: string = 'test.pdf',
  size: number = 1024,
  type: string = 'application/pdf'
): File {
  const blob = new Blob(['test content'], { type });
  return new File([blob], name, { type });
}

/**
 * Wait for async operations
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate test user data
 */
export function generateTestUser(overrides?: Partial<TestUser>): TestUser {
  const timestamp = Date.now();
  return {
    email: `test${timestamp}@example.com`,
    password: 'Test@123456',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+919876543210',
    ...overrides
  };
}

/**
 * Generate test organization data
 */
export function generateTestOrganization(type: 'school' | 'college' | 'university' | 'company'): any {
  const timestamp = Date.now();
  const code = `TEST${timestamp}`;
  
  const base = {
    name: `Test ${type} ${timestamp}`,
    code,
    email: `${code.toLowerCase()}@example.com`,
    phoneNumber: '+919876543210',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456'
  };

  if (type === 'school') {
    return {
      ...base,
      principalName: 'Test Principal',
      principalEmail: `principal${timestamp}@example.com`,
      principalPhone: '+919876543211',
      boardAffiliation: 'CBSE'
    };
  }

  if (type === 'college' || type === 'university') {
    return {
      ...base,
      registrarName: 'Test Registrar',
      registrarEmail: `registrar${timestamp}@example.com`,
      registrarPhone: '+919876543211',
      accreditation: 'NAAC A+'
    };
  }

  if (type === 'company') {
    return {
      ...base,
      industry: 'Technology',
      companySize: '50-200',
      website: 'https://example.com'
    };
  }

  return base;
}

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}
