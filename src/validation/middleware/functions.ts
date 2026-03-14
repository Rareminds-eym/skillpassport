/**
 * Validation middleware for Cloudflare Functions
 */

import { z } from 'zod';
import { createZodErrorResponse } from '../errors/handler.js';

export interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}

export interface ValidatedRequest {
  body?: any;
  query?: any;
  params?: any;
  headers?: any;
}

/**
 * Validate request data against provided schemas
 */
export async function validateRequest(
  request: Request,
  options: ValidationOptions,
  context?: any
): Promise<{ success: true; data: ValidatedRequest } | { success: false; response: Response }> {
  try {
    const validatedData: ValidatedRequest = {};
    
    // Parse URL for query parameters and path parameters
    const url = new URL(request.url);
    
    // Validate query parameters
    if (options.query) {
      const queryParams = Object.fromEntries(url.searchParams.entries());
      validatedData.query = options.query.parse(queryParams);
    }
    
    // Validate request body
    if (options.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const body = await request.json();
        validatedData.body = options.body.parse(body);
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        const body = Object.fromEntries(formData.entries());
        validatedData.body = options.body.parse(body);
      }
    }
    
    // Validate path parameters (if provided in context)
    if (options.params && context?.params) {
      validatedData.params = options.params.parse(context.params);
    }
    
    // Validate headers
    if (options.headers) {
      const headers = Object.fromEntries(request.headers.entries());
      validatedData.headers = options.headers.parse(headers);
    }
    
    return { success: true, data: validatedData };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse = createZodErrorResponse(error);
      return {
        success: false,
        response: new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      };
    }
    
    // Handle other errors
    return {
      success: false,
      response: new Response(JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during validation'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
}

/**
 * Create a validation middleware function
 */
export function createValidationMiddleware(options: ValidationOptions) {
  return async (request: Request, context?: any) => {
    return validateRequest(request, options, context);
  };
}