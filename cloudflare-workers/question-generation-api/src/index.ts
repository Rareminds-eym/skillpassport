/**
 * Question Generation API - Unified Cloudflare Worker
 * 
 * Merges functionality from:
 * - assessment-api (career aptitude/knowledge questions)
 * - adaptive-aptitude-api (adaptive test questions)
 * 
 * Endpoints:
 * 
 * HEALTH:
 * - GET /health - Health check
 * 
 * CAREER ASSESSMENT (from assessment-api):
 * - POST /career-assessment/generate-aptitude - Generate 50 aptitude questions
 * - POST /career-assessment/generate-knowledge - Generate 20 knowledge questions
 * - POST /generate - Generate course-specific assessment questions
 * 
 * ADAPTIVE ASSESSMENT (from adaptive-aptitude-api):
 * - POST /generate/diagnostic - Generate 6 diagnostic screener questions
 * - POST /generate/adaptive - Generate 8-11 adaptive core questions
 * - POST /generate/stability - Generate 4-6 stability confirmation questions
 * - POST /generate/single - Generate a single adaptive question
 */

import type { Env } from './types';
import { handleCorsPreflightRequest } from './utils/cors';
import { notFoundResponse } from './utils/response';
import { handleHealthCheck } from './handlers/healthHandler';
import { handleAptitudeGeneration, handleKnowledgeGeneration } from './handlers/career';
import { handleDiagnosticGeneration, handleCoreGeneration, handleStabilityGeneration, handleSingleGeneration } from './handlers/adaptive';
import { handleCourseAssessment } from './handlers/course';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCorsPreflightRequest();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ==========================================================================
    // HEALTH CHECK
    // ==========================================================================
    if (path === '/health' || path === '/api/health') {
      return handleHealthCheck();
    }

    // ==========================================================================
    // CAREER ASSESSMENT ENDPOINTS (from assessment-api)
    // ==========================================================================
    
    // Generate aptitude questions (50 questions)
    if ((path === '/career-assessment/generate-aptitude' || 
         path === '/api/career-assessment/generate-aptitude') && 
        request.method === 'POST') {
      return handleAptitudeGeneration(request, env);
    }

    // Generate knowledge questions (20 questions)
    if ((path === '/career-assessment/generate-knowledge' || 
         path === '/api/career-assessment/generate-knowledge') && 
        request.method === 'POST') {
      return handleKnowledgeGeneration(request, env);
    }

    // Generate course-specific assessment
    if ((path === '/generate' || path === '/api/assessment/generate') && 
        request.method === 'POST') {
      return handleCourseAssessment(request, env);
    }

    // ==========================================================================
    // ADAPTIVE ASSESSMENT ENDPOINTS (from adaptive-aptitude-api)
    // ==========================================================================
    
    // Generate diagnostic screener questions (6 questions)
    if ((path === '/generate/diagnostic' || path === '/api/generate/diagnostic') && 
        request.method === 'POST') {
      return handleDiagnosticGeneration(request, env);
    }

    // Generate adaptive core questions (8-11 questions)
    if ((path === '/generate/adaptive' || path === '/api/generate/adaptive') && 
        request.method === 'POST') {
      return handleCoreGeneration(request, env);
    }

    // Generate stability confirmation questions (4-6 questions)
    if ((path === '/generate/stability' || path === '/api/generate/stability') && 
        request.method === 'POST') {
      return handleStabilityGeneration(request, env);
    }

    // Generate single adaptive question
    if ((path === '/generate/single' || path === '/api/generate/single') && 
        request.method === 'POST') {
      return handleSingleGeneration(request, env);
    }

    // ==========================================================================
    // 404 - NOT FOUND
    // ==========================================================================
    return notFoundResponse(path);
  },
};
