/**
 * Core type definitions for Email Worker
 */

// ==================== ENVIRONMENT ====================

export interface Env {
  // KV Namespaces
  RATE_LIMIT_KV: KVNamespace;
  
  // Environment variables
  ENVIRONMENT: 'development' | 'staging' | 'production';
  
  // Tenant API Keys (format: TENANT_{TENANT_ID}_API_KEY)
  TENANT_SKILLPASSPORT_API_KEY: string;
  TENANT_WEBSITE_B_API_KEY: string;
  TENANT_WEBSITE_C_API_KEY: string;
  
  // SMTP Configuration (per tenant, format: SMTP_{TENANT_ID}_{FIELD})
  SMTP_SKILLPASSPORT_HOST: string;
  SMTP_SKILLPASSPORT_PORT: string;
  SMTP_SKILLPASSPORT_USER: string;
  SMTP_SKILLPASSPORT_PASS: string;
  SMTP_SKILLPASSPORT_FROM_EMAIL: string;
  SMTP_SKILLPASSPORT_FROM_NAME: string;
}

// ==================== TENANT ====================

export type TenantId = 'skillpassport' | 'website-b' | 'website-c';

export interface TenantConfig {
  id: TenantId;
  name: string;
  apiKey: string;
  
  // Email provider config
  provider: {
    type: 'smtp' | 'resend' | 'sendgrid';
    config: SMTPConfig | ResendConfig | SendGridConfig;
  };
  
  // Default from address
  from: {
    email: string;
    name: string;
  };
  
  // Rate limits
  rateLimit: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  
  // Available templates
  templates: string[];
  
  // Feature flags
  features: {
    templateSending: boolean;
    rawHtmlSending: boolean;
    attachments: boolean;
  };
}

// ==================== PROVIDER CONFIGS ====================

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  startTls: boolean;
  authType: 'plain' | 'login';
  credentials: {
    username: string;
    password: string;
  };
}

export interface ResendConfig {
  apiKey: string;
}

export interface SendGridConfig {
  apiKey: string;
}

// ==================== REQUEST/RESPONSE ====================

export interface SendEmailRequest {
  tenant?: TenantId; // Optional, derived from API key
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  metadata?: Record<string, any>;
}

export interface SendTemplateRequest {
  tenant?: TenantId;
  to: string | string[];
  templateId: string;
  variables: Record<string, any>;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  contentType: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  recipient?: string | string[];
  timestamp?: string;
  error?: string;
  errorCode?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  tenant?: TenantId;
  provider?: {
    type: string;
    status: 'connected' | 'disconnected' | 'unknown';
  };
  rateLimit?: {
    remaining: number;
    limit: number;
    resetAt: string;
  };
}

export interface TemplateListResponse {
  success: boolean;
  tenant: TenantId;
  templates: TemplateInfo[];
}

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  variables: string[];
  category: 'transactional' | 'marketing' | 'system';
  previewUrl?: string;
}

// ==================== INTERNAL TYPES ====================

export interface EmailMessage {
  to: string[];
  from: {
    email: string;
    name: string;
  };
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  metadata?: Record<string, any>;
}

export interface ProviderResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  errorType?: 'permanent' | 'temporary' | 'unknown';
  shouldRetry?: boolean;
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  retryAfter?: number;
}

// ==================== TEMPLATE TYPES ====================

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'transactional' | 'marketing' | 'system';
  subject: string;
  html: string;
  text?: string;
  variables: string[];
  requiredVariables: string[];
}

export interface TemplateRenderContext {
  variables: Record<string, any>;
  tenant: TenantConfig;
  metadata?: Record<string, any>;
}

// ==================== ERROR TYPES ====================

export class EmailWorkerError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'EmailWorkerError';
  }
}

export class AuthenticationError extends EmailWorkerError {
  constructor(message: string = 'Invalid API key') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends EmailWorkerError {
  constructor(message: string = 'Rate limit exceeded', public retryAfter: number) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends EmailWorkerError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class TemplateNotFoundError extends EmailWorkerError {
  constructor(templateId: string) {
    super(`Template not found: ${templateId}`, 'TEMPLATE_NOT_FOUND', 404);
    this.name = 'TemplateNotFoundError';
  }
}

export class ProviderError extends EmailWorkerError {
  constructor(message: string, public shouldRetry: boolean = false) {
    super(message, 'PROVIDER_ERROR', 500);
    this.name = 'ProviderError';
  }
}
