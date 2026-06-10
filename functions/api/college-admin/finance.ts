/**
 * College Admin - Finance API
 * POST: Action-based dispatch for budgets, fees, and expenditures
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
      // ── Budget Management ──
      case 'allocate-budget': {
        const { data, error } = await supabase.from('department_budgets').insert([{ ...params, status: 'draft' }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'submit-budget': {
        const { budget_id, justification } = params;
        const { error } = await supabase.from('department_budgets').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', budget_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'approve-budget': {
        const { budget_id, approved_by } = params;
        const { error } = await supabase.from('department_budgets').update({ status: 'approved', approved_by, approved_at: new Date().toISOString() }).eq('id', budget_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'record-expenditure': {
        const { budget_id, budget_head_id, amount, ...expData } = params;
        const { data: budget, error: budgetError } = await supabase.from('department_budgets').select('budget_heads').eq('id', budget_id).single();
        if (budgetError) return apiDbError(budgetError, context.request, { startTime });
        const budgetHead = (budget.budget_heads || []).find((h: any) => h.id === budget_head_id);
        if (!budgetHead) return apiError(404, 'NOT_FOUND', 'Budget head not found', context.request, { startTime });
        const { data: existingExpenses } = await supabase.from('expenditures').select('amount').eq('budget_id', budget_id).eq('budget_head_id', budget_head_id);
        const currentSpent = existingExpenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0;
        const newTotal = currentSpent + (amount || 0);
        if (newTotal > budgetHead.allocated_amount && !params.override_reason) {
          return apiError(400, 'LIMIT_EXCEEDED', `Expenditure would exceed allocated budget`, context.request, { startTime });
        }
        const { data: expenditure, error: expError } = await supabase.from('expenditures').insert([{ ...expData, budget_id, budget_head_id, amount }]).select().single();
        if (expError) return apiDbError(expError, context.request, { startTime });
        const updatedHeads = (budget.budget_heads || []).map((h: any) =>
          h.id === budget_head_id ? { ...h, spent_amount: (h.spent_amount || 0) + (amount || 0), remaining: h.allocated_amount - ((h.spent_amount || 0) + (amount || 0)) } : h
        );
        await supabase.from('department_budgets').update({ budget_heads: updatedHeads }).eq('id', budget_id);
        return apiSuccess(expenditure, context.request, { startTime });
      }

      case 'validate-budget': {
        const { department_id, budget_head_id, amount } = params;
        const { data: budget, error } = await supabase.from('department_budgets').select('budget_heads').eq('department_id', department_id).eq('status', 'approved').order('created_at', { ascending: false }).limit(1).single();
        if (error) return apiDbError(error, context.request, { startTime });
        const head = (budget.budget_heads || []).find((h: any) => h.id === budget_head_id);
        return apiSuccess(!!head && amount <= (head.remaining || 0), context.request, { startTime });
      }

      case 'get-budget-report': {
        const { department_id, period_from, period_to } = params;
        const { data: budget, error: bError } = await supabase.from('department_budgets').select('*').eq('department_id', department_id).gte('period_from', period_from).lte('period_to', period_to).single();
        if (bError) return apiDbError(bError, context.request, { startTime });
        const { data: dept } = await supabase.from('departments').select('name').eq('id', department_id).single();
        const budgetHeads = (budget.budget_heads || []).map((h: any) => ({
          name: h.name, planned: h.allocated_amount || 0, actual: h.spent_amount || 0,
          variance: (h.spent_amount || 0) - (h.allocated_amount || 0),
          utilization_percentage: h.allocated_amount > 0 ? Math.round(((h.spent_amount || 0) / h.allocated_amount) * 10000) / 100 : 0,
        }));
        const totalPlanned = budgetHeads.reduce((s: number, h: any) => s + h.planned, 0);
        const totalActual = budgetHeads.reduce((s: number, h: any) => s + h.actual, 0);
        return apiSuccess({ department_id, department_name: dept?.name || '', period: { from: period_from, to: period_to }, budget_heads: budgetHeads, total_planned: totalPlanned, total_actual: totalActual, total_variance: totalActual - totalPlanned }, context.request, { startTime });
      }

      case 'get-budgets': {
        let query = supabase.from('department_budgets').select('*');
        if (params.department_id) query = query.eq('department_id', params.department_id);
        if (params.status) query = query.eq('status', params.status);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-expenditures': {
        let query = supabase.from('expenditures').select('*');
        if (params.department_id) query = query.eq('department_id', params.department_id);
        if (params.budget_id) query = query.eq('budget_id', params.budget_id);
        if (params.budget_head_id) query = query.eq('budget_head_id', params.budget_head_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Fee Management ──
      case 'create-fee-structure': {
        const { data: existing } = await supabase.from('fee_structures').select('id').eq('program_id', params.program_id).eq('semester', params.semester).eq('category', params.category).eq('academic_year', params.academic_year).single();
        if (existing) return apiError(409, 'DUPLICATE', 'Fee structure already exists', context.request, { startTime });
        const { data, error } = await supabase.from('fee_structures').insert([params]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-fee-structures': {
        let query = supabase.from('fee_structures').select('*');
        if (params.program_id) query = query.eq('program_id', params.program_id);
        if (params.semester) query = query.eq('semester', params.semester);
        if (params.academic_year) query = query.eq('academic_year', params.academic_year);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'record-payment': {
        const { learner_id, fee_head_id, ...paymentData } = params;
        const { data: ledger, error: ledgerError } = await supabase.from('learner_ledgers').select('*').eq('learner_id', learner_id).eq('fee_head_id', fee_head_id).single();
        if (ledgerError) return apiDbError(ledgerError, context.request, { startTime });
        if (paymentData.amount && paymentData.amount > ledger.balance) {
          return apiError(400, 'LIMIT_EXCEEDED', `Payment exceeds remaining balance`, context.request, { startTime });
        }
        const receiptNumber = `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const { data: payment, error: pError } = await supabase.from('payments').insert([{ ...paymentData, ledger_id: ledger.id, receipt_number: receiptNumber, paid_at: new Date().toISOString() }]).select().single();
        if (pError) return apiDbError(pError, context.request, { startTime });
        await supabase.from('learner_ledgers').update({ paid_amount: ledger.paid_amount + (paymentData.amount || 0) }).eq('id', ledger.id);
        return apiSuccess(payment, context.request, { startTime });
      }

      case 'get-learner-ledger': {
        const { learner_id } = params;
        const { data, error } = await supabase.from('learner_ledgers').select('*, payments:payments(*)').eq('learner_id', learner_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'apply-scholarship': {
        const { learner_id, fee_head_id, amount, reason } = params;
        const { id: appliedBy } = getContextUser(context);
        if (!reason?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Reason is required', context.request, { startTime });
        const { data: ledger, error: lError } = await supabase.from('learner_ledgers').select('*').eq('learner_id', learner_id).eq('fee_head_id', fee_head_id).single();
        if (lError) return apiDbError(lError, context.request, { startTime });
        const { error } = await supabase.from('learner_ledgers').update({ due_amount: ledger.due_amount - amount }).eq('id', ledger.id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'get-payment': {
        const { payment_id } = params;
        if (!payment_id) return apiError(400, 'VALIDATION_ERROR', 'Missing payment_id', context.request, { startTime });
        const { data, error } = await supabase.from('payments').select('*').eq('id', payment_id).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case       'get-defaulter-report': {
        let query = supabase.from('learner_ledgers').select('*, learner:users!learner_id(*), admission:learner_admissions!learner_id(roll_number, program_id)').gt('balance', 0);
        const { data: ledgers, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        const defaulters = (ledgers || []).filter((l: any) => l.balance > 0).sort((a: any, b: any) => b.balance - a.balance).map((l: any) => ({
          learner_id: l.learner_id, name: l.learner?.name || '', roll_number: l.admission?.roll_number || '', program: '', balance: l.balance, due_date: '',
        }));
        const totalPending = defaulters.reduce((sum: number, d: any) => sum + d.balance, 0);
        return apiSuccess({ learners: defaulters, total_pending: totalPending }, context.request, { startTime });
      }

      // ── Financial Summaries (formerly RPCs) ──
      case 'get-expenditure-summary': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data: ledgers, error: lError } = await supabase.from('learner_ledgers').select('due_amount, paid_amount, balance, is_overdue').eq('college_id', college_id);
        if (lError) return apiDbError(lError, context.request, { startTime });
        const totalLearners = new Set((ledgers || []).map((l: any) => l.learner_id)).size;
        const paidLearners = new Set((ledgers || []).filter((l: any) => l.balance <= 0).map((l: any) => l.learner_id)).size;
        const pendingLearners = new Set((ledgers || []).filter((l: any) => l.balance > 0).map((l: any) => l.learner_id)).size;
        const overdueLearners = new Set((ledgers || []).filter((l: any) => l.is_overdue).map((l: any) => l.learner_id)).size;
        const totals = (ledgers || []).reduce((acc: any, l: any) => ({
          total_due: acc.total_due + Number(l.due_amount || 0),
          total_paid: acc.total_paid + Number(l.paid_amount || 0),
          total_balance: acc.total_balance + Number(l.balance || 0),
        }), { total_due: 0, total_paid: 0, total_balance: 0 });
        return apiSuccess({
          total_due_amount: totals.total_due,
          total_paid_amount: totals.total_paid,
          total_balance: totals.total_balance,
          total_learners: totalLearners,
          overdue_learners: overdueLearners,
          paid_learners: paidLearners,
          pending_learners: pendingLearners,
          collection_percentage: totals.total_due > 0 ? Math.round((totals.total_paid / totals.total_due) * 10000) / 100 : 0,
        }, context.request, { startTime });
      }

      case 'get-department-expenditure': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data: depts, error: dError } = await supabase.from('departments').select('id, name, code').eq('college_id', college_id);
        if (dError) return apiDbError(dError, context.request, { startTime });
        const deptIds = (depts || []).map((d: any) => d.id);
        let deptLedgers: any[] = [];
        if (deptIds.length > 0) {
          const { data: learners } = await supabase.from('learners').select('id, program_id').in('program_id', deptIds);
          const learnerIds = (learners || []).map((l: any) => l.id);
          if (learnerIds.length > 0) {
            const { data: ll } = await supabase.from('learner_ledgers').select('learner_id, due_amount, paid_amount, balance').in('learner_id', learnerIds);
            deptLedgers = ll || [];
          }
        }
        const deptData = (depts || []).map((dept: any) => {
          const relatedLearners = deptLedgers.filter((l: any) => l.learner_id);
          const lSet = new Set(relatedLearners.map((l: any) => l.learner_id));
          const due = relatedLearners.reduce((s: number, l: any) => s + Number(l.due_amount || 0), 0);
          const paid = relatedLearners.reduce((s: number, l: any) => s + Number(l.paid_amount || 0), 0);
          const balance = relatedLearners.reduce((s: number, l: any) => s + Number(l.balance || 0), 0);
          return {
            department_id: dept.id, department_name: dept.name, department_code: dept.code,
            total_due_amount: due, total_paid_amount: paid, total_balance: balance,
            learner_count: lSet.size,
            collection_percentage: due > 0 ? Math.round((paid / due) * 10000) / 100 : 0,
          };
        });
        return apiSuccess(deptData, context.request, { startTime });
      }

      case 'get-program-expenditure': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data: progs, error: pError } = await supabase.from('programs').select('id, name, code, department_id').eq('status', 'active');
        if (pError) return apiDbError(pError, context.request, { startTime });
        const { data: depts } = await supabase.from('departments').select('id, name').eq('college_id', college_id);
        const deptMap = new Map((depts || []).map((d: any) => [d.id, d.name]));
        const filteredProgs = (progs || []).filter((p: any) => deptMap.has(p.department_id));
        const progIds = filteredProgs.map((p: any) => p.id);
        const { data: learners } = await supabase.from('learners').select('id, program_id').in('program_id', progIds);
        const learnerIds = (learners || []).map((l: any) => l.id);
        let progLedgers: any[] = [];
        if (learnerIds.length > 0) {
          const { data: ll } = await supabase.from('learner_ledgers').select('learner_id, due_amount, paid_amount, balance').in('learner_id', learnerIds);
          progLedgers = ll || [];
        }
        const progData = filteredProgs.map((prog: any) => {
          const pLearners = (learners || []).filter((l: any) => l.program_id === prog.id).map((l: any) => l.id);
          const pLedgers = progLedgers.filter((l: any) => pLearners.includes(l.learner_id));
          const lSet = new Set(pLedgers.map((l: any) => l.learner_id));
          const due = pLedgers.reduce((s: number, l: any) => s + Number(l.due_amount || 0), 0);
          const paid = pLedgers.reduce((s: number, l: any) => s + Number(l.paid_amount || 0), 0);
          const balance = pLedgers.reduce((s: number, l: any) => s + Number(l.balance || 0), 0);
          return {
            program_id: prog.id, program_name: prog.name, program_code: prog.code,
            department_name: deptMap.get(prog.department_id) || '',
            total_due_amount: due, total_paid_amount: paid, total_balance: balance,
            learner_count: lSet.size,
            collection_percentage: due > 0 ? Math.round((paid / due) * 10000) / 100 : 0,
          };
        });
        return apiSuccess(progData, context.request, { startTime });
      }

      // ── Fee Structure CRUD (for useFeeStructures) ──
      case 'update-fee-structure': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('fee_structures')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-fee-structure': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase
          .from('fee_structures')
          .delete()
          .eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'toggle-fee-structure-active': {
        const { id, is_active } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('fee_structures')
          .update({ is_active, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'duplicate-fee-structure': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data: original } = await supabase
          .from('fee_structures')
          .select('*')
          .eq('id', id)
          .single();
        if (!original) return apiError(404, 'NOT_FOUND', 'Fee structure not found', context.request, { startTime });
        const { id: _id, created_at, updated_at, ...rest } = original;
        const { data, error } = await supabase
          .from('fee_structures')
          .insert({ ...rest, academic_year: `${original.academic_year} (Copy)`, is_active: false })
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Fee Payments & Ledgers (for useFeeTracking) ──
      case 'get-fee-payments': {
        let query = supabase.from('fee_payments').select('*').order('payment_date', { ascending: false });
        if (params.learner_id) query = query.eq('learner_id', params.learner_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'record-fee-payment': {
        const { ledger_id, learner_id, amount, ...paymentData } = params;
        if (!ledger_id || !learner_id || !amount) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing ledger_id, learner_id, or amount', context.request, { startTime });
        }
        const receiptNumber = `RCP${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const { data: payment, error: pError } = await supabase
          .from('fee_payments')
          .insert({
            ledger_id,
            learner_id,
            amount,
            receipt_number: receiptNumber,
            payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
            paid_at: new Date().toISOString(),
            status: 'completed',
            mode: paymentData.mode,
            reference_number: paymentData.reference_number || null,
            transaction_id: paymentData.transaction_id || null,
            bank_name: paymentData.bank_name || null,
            cheque_number: paymentData.cheque_number || null,
            cheque_date: paymentData.cheque_date || null,
            dd_number: paymentData.dd_number || null,
            remarks: paymentData.remarks || null,
            recorded_by: user.id,
            is_verified: false,
            is_reconciled: false,
          })
          .select()
          .single();
        if (pError) return apiDbError(pError, context.request, { startTime });

        const { data: ledger } = await supabase
          .from('learner_ledgers')
          .select('paid_amount, due_amount')
          .eq('id', ledger_id)
          .single();

        if (ledger) {
          const newPaidAmount = (ledger.paid_amount || 0) + (amount || 0);
          const newBalance = ledger.due_amount - newPaidAmount;
          const newStatus = newBalance <= 0 ? 'paid' : newBalance < ledger.due_amount ? 'partial' : 'pending';
          await supabase
            .from('learner_ledgers')
            .update({ paid_amount: newPaidAmount, balance: newBalance, payment_status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', ledger_id);
        }

        return apiSuccess(payment, context.request, { startTime });
      }

      case 'verify-fee-payment': {
        const { payment_id } = params;
        if (!payment_id) return apiError(400, 'VALIDATION_ERROR', 'Missing payment_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('fee_payments')
          .update({ is_verified: true, verified_by: user.id, verified_at: new Date().toISOString() })
          .eq('id', payment_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-learner-ledgers': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('learner_ledgers')
          .select('*')
          .eq('college_id', college_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-user-org-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase
          .from('organizations')
          .select('id')
          .eq('organization_type', 'college')
          .or(`admin_id.eq.${user.id},email.eq.${email}`)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[finance POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
