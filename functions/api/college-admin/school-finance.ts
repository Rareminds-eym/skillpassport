/**
 * School Finance API
 * POST: Action-based dispatch for fee structures, ledgers, payments
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      // ── Fee Structures ──
      case 'get-fee-structures': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('school_fee_structures').select('*').eq('school_id', school_id).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'create-fee-structure': {
        const { school_id, class_id, class_name, academic_year, fee_head, custom_fee_head, amount, frequency, late_fee_percentage, is_active } = params;
        if (!school_id || !class_id || !fee_head) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request, { startTime });
        const { error } = await supabase.from('school_fee_structures').insert({ school_id, class_id, class_name, academic_year, fee_head, custom_fee_head, amount, frequency, late_fee_percentage, is_active: is_active ?? true, created_at: new Date().toISOString() });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'update-fee-structure': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('school_fee_structures').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'delete-fee-structure': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('school_fee_structures').delete().eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'toggle-fee-structure': {
        const { id, is_active } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('school_fee_structures').update({ is_active, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Learner Ledgers ──
      case 'get-learner-ledgers': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('learner_ledgers').select('*').eq('school_id', school_id).order('learner_name', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'create-learner-ledger': {
        const { school_id, learner_id, learner_name, roll_number, learner_email, fee_structure_id, fee_head_id, fee_head_name, due_amount } = params;
        if (!school_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request, { startTime });
        const { data, error } = await supabase.from('learner_ledgers').insert({
          school_id, learner_id, learner_name, roll_number, learner_email,
          fee_structure_id, fee_head_id, fee_head_name, due_amount,
          paid_amount: 0, balance: due_amount || 0, payment_status: 'pending',
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-learner-ledger': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing ledger id', context.request, { startTime });
        const { error } = await supabase.from('learner_ledgers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Fee Payments ──
      case 'get-fee-payments': {
        const { learner_id } = params;
        let query = supabase.from('school_fee_payments').select('*').order('payment_date', { ascending: false });
        if (learner_id) query = query.eq('learner_id', learner_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'create-fee-payment': {
        const { ledger_id, learner_id, amount, mode, reference_number, transaction_id, bank_name, cheque_number, cheque_date, dd_number, receipt_number, payment_date, remarks, recorded_by } = params;
        if (!ledger_id || !learner_id || !amount) return apiError(400, 'VALIDATION_ERROR', 'Missing required payment fields', context.request, { startTime });
        const receipt = receipt_number || `SCH${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const { data, error } = await supabase.from('school_fee_payments').insert({
          ledger_id, learner_id, amount, mode, reference_number, transaction_id,
          bank_name, cheque_number, cheque_date, dd_number, receipt_number: receipt,
          payment_date: payment_date || new Date().toISOString().split('T')[0],
          paid_at: new Date().toISOString(), status: 'completed',
          remarks, recorded_by: recorded_by || user.id,
          is_verified: false, is_reconciled: false,
        }).select().single();
        if (error) return apiDbError(error, context.request, { startTime });

        // Update ledger
        const { data: ledger } = await supabase.from('learner_ledgers').select('paid_amount, due_amount').eq('id', ledger_id).single();
        if (ledger) {
          const newPaid = (ledger.paid_amount || 0) + (amount || 0);
          const newBal = ledger.due_amount - newPaid;
          const newStatus = newBal <= 0 ? 'paid' : newBal < ledger.due_amount ? 'partial' : 'pending';
          await supabase.from('learner_ledgers').update({ paid_amount: newPaid, balance: newBal, payment_status: newStatus, updated_at: new Date().toISOString() }).eq('id', ledger_id);
        }

        return apiSuccess({ payment: data, receipt_number: receipt }, context.request, { startTime });
      }

      // ── Learners ──
      case 'get-school-learners': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('learners').select('id, user_id, name, roll_number, email, school_id, grade, section').eq('school_id', school_id).order('name', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[school-finance POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
