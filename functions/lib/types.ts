/// <reference types="@cloudflare/workers-types" />
import type { R2Bucket } from '@cloudflare/workers-types';
import type {
  EmailWorkerRpc,
  EmbeddingWorkerRpc,
  PaymentWorkerRpc,
  RealtimeEventsQueue,
  RealtimeWorkerRpc,
  SsoReverseSyncQueue,
  SsoWorkerRpc
} from './rpc-types';

/**
 * Shared TypeScript types for Cloudflare Pages Functions
 */

/**
 * Standard environment variables available to all Pages Functions
 */
export interface PagesEnv {
  // SSO / Auth configuration
  SSO_DOMAIN?: string;
  VITE_SSO_URL?: string;
  /** Cloudflare Service Binding to the SSO worker (sso-api) */
  SSO_SERVICE?: SsoWorkerRpc;

  // Supabase configuration
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  // Payment Worker configuration
  VITE_PAYMENTS_API_URL?: string;
  RAZORPAY_SERVICE_SECRET?: string;
  RAZORPAY_KEY_ID?: string;
  INTERNAL_WEBHOOK_SECRET?: string;
  /** Cloudflare Service Binding to the Payment worker */
  PAYMENT_WORKER?: PaymentWorkerRpc;

  // Realtime Worker configuration
  /** Cloudflare Service Binding to the Realtime worker */
  REALTIME_WORKER?: RealtimeWorkerRpc;

  // Embedding Worker configuration
  /** Cloudflare Service Binding to the Embedding worker */
  EMBEDDING_SERVICE?: EmbeddingWorkerRpc;

  // Email Worker configuration
  EMAIL_WORKER_URL?: string;
  EMAIL_API_KEY?: string;
  /** Cloudflare Service Binding to the Email worker */
  EMAIL_SERVICE?: EmailWorkerRpc;
  ADMIN_EMAIL?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;

  // Queue Bindings
  /** Cloudflare Queue for realtime events */
  REALTIME_EVENTS_QUEUE?: RealtimeEventsQueue;
  /** Cloudflare Queue for SSO reverse sync */
  SSO_REVERSE_SYNC_QUEUE?: SsoReverseSyncQueue;

  // App configuration
  APP_URL?: string;

  // Storage / Media configuration
  SIGNING_SECRET?: string;

  // AI API keys
  CLAUDE_API_KEY?: string;
  VITE_CLAUDE_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;

  // R2 Storage configuration
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_R2_ACCESS_KEY_ID?: string;
  CLOUDFLARE_R2_SECRET_ACCESS_KEY?: string;
  CLOUDFLARE_R2_BUCKET_NAME?: string;
  CLOUDFLARE_R2_PUBLIC_URL?: string;
  R2_BUCKET?: R2Bucket;

  // KV Cache namespace removed - dependency eliminated
}

/**
 * Backward compatibility alias
 */
export type Env = PagesEnv;

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response format
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

/**
 * User authentication context
 */
export interface AuthContext {
  userId: string;
  email: string;
  role?: string;
}

/**
 * Request context passed to handlers
 */
export interface RequestContext {
  request: Request;
  env: PagesEnv;
  params?: Record<string, string>;
}

/**
 * Cloudflare Pages Function handler type
 */
export type PagesFunction<Env = PagesEnv> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
  data: Record<string, any>;
}) => Response | Promise<Response>;
