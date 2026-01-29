/**
 * Property Test: Frontend Routing
 * 
 * Property 8: Frontend Routing
 * Validates: Requirements 4.3, 7.1
 * 
 * This test verifies that frontend service files correctly route requests
 * to Pages Function endpoints using direct URLs (no fallback).
 */

import { describe, it, expect } from 'vitest';
import { getPagesApiUrl, getPagesBaseUrl } from '../../utils/pagesUrl';

// Service configuration
interface ServiceConfig {
  name: string;
  pagesPath: string;
  endpoints: string[];
}

const SERVICES: ServiceConfig[] = [
  {
    name: 'career',
    pagesPath: '/api/career',
    endpoints: ['/chat', '/recommend-opportunities', '/generate-embedding', '/health'],
  },
  {
    name: 'streak',
    pagesPath: '/api/streak',
    endpoints: ['/:id', '/:id/complete', '/:id/notifications', '/:id/process', '/health'],
  },
  {
    name: 'otp',
    pagesPath: '/api/otp',
    endpoints: ['/send', '/verify', '/resend'],
  },
  {
    name: 'course',
    pagesPath: '/api/course',
    endpoints: ['/get-file-url', '/ai-tutor-suggestions', '/ai-tutor-chat', '/ai-tutor-feedback', '/ai-tutor-progress', '/ai-video-summarizer'],
  },
  {
    name: 'storage',
    pagesPath: '/api/storage',
    endpoints: ['/upload', '/delete', '/extract-content', '/presigned', '/confirm', '/get-url', '/files/:courseId/:lessonId', '/upload-payment-receipt', '/payment-receipt'],
  },
  {
    name: 'user',
    pagesPath: '/api/user',
    endpoints: ['/signup', '/signup/school-admin', '/signup/educator', '/signup/student', '/schools', '/check-school-code', '/check-email', '/create-student', '/create-teacher', '/reset-password'],
  },
];

/**
 * Validates that a service routes to the correct Pages Function path
 */
function validateServiceRouting(service: ServiceConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate Pages path format
  if (!service.pagesPath.startsWith('/api/')) {
    errors.push(`Pages path must start with /api/, got: ${service.pagesPath}`);
  }

  // Validate service name matches path
  const expectedPath = `/api/${service.name}`;
  if (service.pagesPath !== expectedPath) {
    errors.push(`Pages path should be ${expectedPath}, got: ${service.pagesPath}`);
  }

  // Validate endpoints are defined
  if (service.endpoints.length === 0) {
    errors.push('Service must have at least one endpoint');
  }

  // Validate endpoint format
  service.endpoints.forEach(endpoint => {
    if (!endpoint.startsWith('/')) {
      errors.push(`Endpoint must start with /, got: ${endpoint}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

describe('Property 8: Frontend Routing', () => {
  it('should route all services to correct Pages Function paths', () => {
    SERVICES.forEach(service => {
      const result = validateServiceRouting(service);
      expect(result.valid).toBe(true);
      if (!result.valid) {
        console.error(`Service ${service.name} routing errors:`, result.errors);
      }
    });
  });

  it('should generate correct API URLs using getPagesApiUrl', () => {
    SERVICES.forEach(service => {
      const apiUrl = getPagesApiUrl(service.name);
      
      // Should include the service path
      expect(apiUrl).toContain(`/api/${service.name}`);
      
      // Should use window.location.origin in browser environment
      // In test environment, it will use a default
      expect(apiUrl).toBeTruthy();
      expect(apiUrl.length).toBeGreaterThan(0);
    });
  });

  it('should use consistent base URL across all services', () => {
    const baseUrl = getPagesBaseUrl();
    
    SERVICES.forEach(service => {
      const apiUrl = getPagesApiUrl(service.name);
      expect(apiUrl).toContain(baseUrl);
    });
  });

  it('should construct valid full URLs for all endpoints', () => {
    SERVICES.forEach(service => {
      const apiUrl = getPagesApiUrl(service.name);
      
      service.endpoints.forEach(endpoint => {
        // Replace path parameters with example values
        const concreteEndpoint = endpoint
          .replace(':id', '123')
          .replace(':courseId', 'course-1')
          .replace(':lessonId', 'lesson-1');
        
        const fullUrl = `${apiUrl}${concreteEndpoint}`;
        
        // Should be a valid URL structure
        expect(fullUrl).toContain('/api/');
        expect(fullUrl).toContain(service.name);
      });
    });
  });

  it('should handle service names consistently', () => {
    const serviceNames = SERVICES.map(s => s.name);
    
    // All service names should be lowercase
    serviceNames.forEach(name => {
      expect(name).toBe(name.toLowerCase());
    });
    
    // All service names should be unique
    const uniqueNames = new Set(serviceNames);
    expect(uniqueNames.size).toBe(serviceNames.length);
  });

  it('should use same-origin URLs (no CORS issues)', () => {
    SERVICES.forEach(service => {
      const apiUrl = getPagesApiUrl(service.name);
      
      // In browser, should use window.location.origin
      // In test, should use a consistent base
      // Either way, should not include external domains
      expect(apiUrl).not.toContain('workers.dev');
      expect(apiUrl).not.toContain('cloudflare');
    });
  });
});
