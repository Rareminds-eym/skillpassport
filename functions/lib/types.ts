/**
 * Shared TypeScript types for Cloudflare Pages Functions
 */

/**
 * Standard environment variables available to all Pages Functions
 */
export interface PagesEnv {
  // Supabase configuration
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  // AI API keys
  CLAUDE_API_KEY?: string;
  VITE_CLAUDE_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_API_KEY?: string;

  // Other service keys
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RESEND_API_KEY?: string;

  // AWS credentials (for SNS, S3, etc.)
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;

  // OTP configuration
  OTP_LENGTH?: string;
  OTP_EXPIRY_MINUTES?: string;
  SMS_SENDER_ID?: string;

  // R2 Storage configuration
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_R2_ACCESS_KEY_ID?: string;
  CLOUDFLARE_R2_SECRET_ACCESS_KEY?: string;
  CLOUDFLARE_R2_BUCKET_NAME?: string;
  CLOUDFLARE_R2_PUBLIC_URL?: string;
}

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
