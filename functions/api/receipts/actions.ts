import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { Fetcher } from '@cloudflare/workers-types';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';
import { ssoGetUserTransactions, ssoGetUserSubscription } from '../../lib/sso-client';

// Define proper transaction interface
interface Transaction {
  id: string;
  subscription_id?: string;
  razorpay_payment_id?: string;
  payment_id?: string;
  razorpay_order_id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Subscription {
  plan_type?: string;
  billing_cycle?: string;
}

interface UserDetails {
  name: string;
  email: string;
  phone?: string;
}

interface ReceiptData {
  id: string;
  payment_id?: string;
  razorpay_order_id: string;
  amount: number;
  status: string;
  created_at: string;
  plan_type: string;
  billing_cycle: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
}

interface RequestBody {
  action: string;
  orderId?: string;
  paymentId?: string;
  id?: string;
}

export const onRequest = async (context: AuthenticatedContext) => {
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string | Fetcher>;
  const supabase = getServiceClient(env);

  // Type-safe SSO environment extraction with validation
  const ssoService = env.SSO_SERVICE;
  if (typeof ssoService !== 'function') {
    return apiError(500, 'CONFIGURATION_ERROR', 'SSO_SERVICE binding is not configured', context.request);
  }
  const ssoEnv = { SSO_SERVICE: ssoService as Fetcher };

  let body: RequestBody;
  try {
    const parsedBody = await context.request.json() as Record<string, unknown>;
    // Validate required 'action' field exists and is a string
    if (typeof parsedBody.action !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'Missing required field: action', context.request);
    }
    body = parsedBody as unknown as RequestBody;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action } = body;

  // Helper to fetch user details with input validation
  const getUserDetails = async (): Promise<UserDetails> => {
    // Validate user.id is a valid UUID and non-empty
    if (!user.id || typeof user.id !== 'string' || user.id.trim() === '') {
      throw new Error('Invalid user ID');
    }
    
    // UUID validation pattern - accepts all valid UUID formats (any version)
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidPattern.test(user.id)) {
      throw new Error('Invalid user ID format');
    }
    
    const { data } = await supabase.from('users_shadow').select('email').eq('id', user.id).maybeSingle();
    const { data: learner } = await supabase.from('learners').select('name, phone').eq('user_id', user.id).maybeSingle();
    return {
      name: learner?.name || user.email,
      email: data?.email || user.email,
      phone: learner?.phone
    };
  };

  // Validation function for transaction data
  const validateTransaction = (tx: Record<string, unknown>): Transaction => {
    // Validate required field
    if (!tx.razorpay_order_id) {
      throw new Error('Invalid transaction: missing razorpay_order_id');
    }

    // Validate ID - must have either id or subscription_id
    if (!tx.id && !tx.subscription_id) {
      throw new Error('Invalid transaction: missing both id and subscription_id');
    }

    // Validate and transform with type checking
    const transaction: Transaction = {
      id: String(tx.id || tx.subscription_id || ''),
      subscription_id: tx.subscription_id ? String(tx.subscription_id) : undefined,
      razorpay_payment_id: tx.razorpay_payment_id ? String(tx.razorpay_payment_id) : undefined,
      payment_id: tx.payment_id ? String(tx.payment_id) : undefined,
      razorpay_order_id: String(tx.razorpay_order_id),
      amount: typeof tx.amount === 'number' ? tx.amount : Number(tx.amount || 0),
      status: String(tx.status || 'pending'),
      created_at: String(tx.created_at || new Date().toISOString())
    };

    // Additional validation for critical fields
    if (isNaN(transaction.amount) || transaction.amount < 0) {
      throw new Error('Invalid transaction: invalid amount');
    }

    return transaction;
  };

  const getSsoReceiptData = async (filterFn: (tx: Transaction) => boolean): Promise<ReceiptData | null> => {
    try {
      // Fetch transactions with explicit error handling
      let rawTransactions: Record<string, unknown>[];
      try {
        rawTransactions = await ssoGetUserTransactions(ssoEnv, user.id);
      } catch (ssoError) {
        const errorInstance = ssoError instanceof Error ? ssoError : new Error(String(ssoError));
        throw new Error(`SSO transaction fetch failed: ${errorInstance.message}`);
      }
      
      // Validate transactions is an array before processing
      if (!Array.isArray(rawTransactions)) {
        throw new Error('SSO transactions response is not an array');
      }

      // Validate and map transactions data
      const transactions: Transaction[] = rawTransactions
        .map((tx: Record<string, unknown>) => {
          try {
            return validateTransaction(tx);
          } catch (validationError) {
            // Skip invalid transactions and continue processing others
            return null;
          }
        })
        .filter((tx): tx is Transaction => tx !== null);
      
      const tx = transactions.find(filterFn);
      if (!tx) return null;

      // Fetch subscription with explicit error handling
      let ssoResponse: { subscription?: unknown } | null = null;
      try {
        ssoResponse = await ssoGetUserSubscription(ssoEnv, user.id);
      } catch (ssoError) {
        const errorInstance = ssoError instanceof Error ? ssoError : new Error(String(ssoError));
        throw new Error(`SSO subscription fetch failed: ${errorInstance.message}`);
      }
      
      if (!ssoResponse) {
        throw new Error('SSO subscription response is null');
      }

      // Validate subscription structure before type assertion
      const subscription = ssoResponse.subscription;
      if (subscription !== null && subscription !== undefined && typeof subscription !== 'object') {
        throw new Error('Invalid subscription data structure: expected object or null');
      }

      // Only assert type after validating structure
      const typedSubscription = subscription as Subscription | null;
      
      const userDetails = await getUserDetails();

      // Ensure we have a valid ID for the receipt
      const receiptId = tx.id || tx.subscription_id;
      if (!receiptId) {
        throw new Error('Transaction missing valid ID');
      }

      return {
        id: receiptId,
        payment_id: tx.razorpay_payment_id || tx.payment_id,
        razorpay_order_id: tx.razorpay_order_id,
        amount: tx.amount,
        status: tx.status,
        created_at: tx.created_at,
        plan_type: typedSubscription?.plan_type || 'Subscription',
        billing_cycle: typedSubscription?.billing_cycle || 'Annual',
        user_name: userDetails.name,
        user_email: userDetails.email,
        user_phone: userDetails.phone
      };
    } catch (error) {
      // Return specific error information instead of null
      throw new Error(`Failed to fetch SSO receipt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (action === 'get-receipt-by-order-id') {
    const { orderId } = body;
    if (!orderId) {
      return apiError(400, 'VALIDATION_ERROR', 'orderId is required', context.request);
    }
    
    try {
      // First try SSO worker for payment transactions
      const ssoData = await getSsoReceiptData(tx => tx.razorpay_order_id === orderId);
      if (ssoData) return apiSuccess(ssoData, context.request);
    } catch (ssoError) {
      // SSO lookup failed, fall through to legacy source
    }

    // Fallback to pre_registrations for older data (legacy source)
    const { data: preRegData, error: preRegError } = await supabase
      .from('pre_registrations')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();
    
    if (preRegError) return apiDbError(preRegError, context.request);
    
    // Mark legacy data source
    if (preRegData) {
      return apiSuccess({ ...preRegData, _legacy_source: true }, context.request);
    }
    
    return apiSuccess(null, context.request);
  }

  if (action === 'get-receipt-by-payment-id') {
    const { paymentId } = body;
    if (!paymentId) {
      return apiError(400, 'VALIDATION_ERROR', 'paymentId is required', context.request);
    }
    
    try {
      // First try SSO worker
      const ssoData = await getSsoReceiptData(tx =>
        tx.razorpay_payment_id === paymentId || tx.payment_id === paymentId
      );
      if (ssoData) return apiSuccess(ssoData, context.request);
    } catch (ssoError) {
      // SSO lookup failed, fall through to legacy source
    }

    // Fallback to pre_registrations (legacy source)
    const { data: preRegData, error: preRegError } = await supabase
      .from('pre_registrations')
      .select('*')
      .eq('payment_id', paymentId)
      .maybeSingle();
    
    if (preRegError) return apiDbError(preRegError, context.request);
    
    // Mark legacy data source
    if (preRegData) {
      return apiSuccess({ ...preRegData, _legacy_source: true }, context.request);
    }
    
    return apiSuccess(null, context.request);
  }

  if (action === 'get-receipt-by-id') {
    const { id } = body;
    if (!id) {
      return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);
    }
    
    try {
      // First try SSO worker
      // The frontend may pass either a transaction ID or a subscription ID
      const ssoData = await getSsoReceiptData(tx => tx.id === id || tx.subscription_id === id);
      if (ssoData) return apiSuccess(ssoData, context.request);
    } catch (ssoError) {
      // SSO lookup failed, fall through to legacy source
    }

    // Fallback to pre_registrations (legacy source)
    const { data: preRegData, error: preRegError } = await supabase
      .from('pre_registrations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (preRegError) return apiDbError(preRegError, context.request);
    
    // Mark legacy data source
    if (preRegData) {
      return apiSuccess({ ...preRegData, _legacy_source: true }, context.request);
    }
    
    return apiSuccess(null, context.request);
  }

  return apiError(400, 'BAD_REQUEST', `Unknown action: ${action}`, context.request);
});
