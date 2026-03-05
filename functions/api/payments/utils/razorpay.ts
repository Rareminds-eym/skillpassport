/**
 * Razorpay helper functions
 * 
 * NOTE: All Razorpay API operations are now handled by the centralized
 * Razorpay worker at cloudflare-workers/razorpay-api/
 * 
 * This file is kept minimal - only for legacy compatibility if needed.
 */

import type { Env } from '../types';

// This file is intentionally minimal.
// All Razorpay operations should go through the Razorpay worker:
// - POST /create-order
// - POST /verify-payment
// - GET /payment/:id
// - POST /subscription/:id/cancel
// - POST /verify-webhook
