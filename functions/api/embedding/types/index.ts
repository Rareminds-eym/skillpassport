/**
 * Shared Embedding Types
 * Single source of truth for all embedding-related types
 */

export interface EmbeddingResponse {
  success: boolean;
  embedding: number[];
  dimensions: number;
  model?: string;
}

export interface EmbeddingOptions {
  table: string;
  id: string;
  returnEmbedding?: boolean;
  skipDatabaseUpdate?: boolean;
  fromDatabase?: boolean;
}

export interface EmbeddingGenerationResult {
  success: boolean;
  embedding?: number[];
  dimensions?: number;
  mode?: 'database' | 'direct';
  textLength?: number;
  message?: string;
  error?: string;
}

export type EmbeddingErrorCode = 
  | 'AUTH_REQUIRED' 
  | 'INVALID_TEXT' 
  | 'API_ERROR' 
  | 'RATE_LIMIT'
  | 'INSUFFICIENT_DATA'
  | 'INVALID_RESPONSE';

export class EmbeddingError extends Error {
  constructor(
    message: string,
    public code: EmbeddingErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EmbeddingError';
    
    // Improve stack traces in V8 environments (Node.js, Chrome, etc.)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmbeddingError);
    }
  }
}

export interface StudentData {
  id: string;
  name?: string;
  branch_field?: string;
  course_name?: string;
  university?: string;
  bio?: string;
  interests?: string[];
  hobbies?: string[];
}

export interface SkillData {
  name: string;
  level?: number;
  type?: string;
  description?: string;
}

export interface CertificateData {
  title: string;
  issuer?: string;
  level?: string;
  category?: string;
  description?: string;
  platform?: string;
}

export interface ProjectData {
  title: string;
  description?: string;
  tech_stack?: string[];
  role?: string;
  organization?: string;
}

export interface CourseEnrollmentData {
  course_title: string;
  status: string;
  skills_acquired?: string[];
}

export interface TrainingData {
  title: string;
  organization?: string;
  description?: string;
  source?: string;
}

export interface CourseData {
  id: string;
  title?: string;
  name?: string;
  provider?: string;
  category?: string;
  level?: string;
  skills_taught?: string[] | string;
  description?: string;
}

export interface OpportunityData {
  id: string;
  job_title?: string;
  title?: string;
  company_name?: string;
  location?: string;
  skills_required: string[] | string;
  description?: string;
}
