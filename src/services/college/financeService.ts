import { supabase } from '@/lib/supabaseClient';

export interface FeeStructure {
  id: string;
  program_id: string;
  semester: number;
  category: string;
  academic_year: string;
  fee_heads: FeeHead[];
  due_schedule: DueSchedule[];
}

export interface FeeHead {
  id: string;
  name: string;
  amount: number;
}

export interface DueSchedule {
  due_date: string;
  percentage: number;
}

export interface StudentLedger {
  id: string;
  student_id: string;
  fee_structure_id: string;
  fee_head_id: string;
  due_amount: number;
  paid_amount: number;
  balance: number;
}

export interface Payment {
  id: string;
  ledger_id: string;
  amount: number;
  mode: 'cash' | 'upi' | 'card' | 'cheque' | 'bank_transfer';
  reference_number?: string;
  receipt_number: string;
  paid_at: string;
  recorded_by: string;
}

export interface DepartmentBudget {
  id: string;
  department_id: string;
  period_from: string;
  period_to: string;
  budget_heads: BudgetHead[];
  status: 'draft' | 'submitted' | 'approved';
}

export interface BudgetHead {
  id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
  remaining: number;
}

export interface Expenditure {
  id: string;
  department_id: string;
  budget_id: string;
  budget_head_id: string;
  vendor_name: string;
  amount: number;
  category: string;
  invoice_file_id?: string;
  expenditure_date: string;
  description?: string;
  override_reason?: string;
  recorded_by: string;
}

export async function createFeeStructure(data: Partial<FeeStructure>): Promise<FeeStructure> {
  const { data: structure, error } = await supabase
    .from('fee_structures')
    .insert([data])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('DUPLICATE_ENTRY: Fee structure already exists for this program/semester/category/year');
    }
    throw error;
  }
  return structure;
}

export async function recordPayment(studentId: string, feeHeadId: string, payment: Partial<Payment>): Promise<Payment> {
  // Get ledger
  const { data: ledger, error: ledgerError } = await supabase
    .from('student_ledgers')
    .select('*')
    .eq('student_id', studentId)
    .eq('fee_head_id', feeHeadId)
    .single();

  if (ledgerError) throw ledgerError;

  // Check overpayment
  if (payment.amount! > ledger.balance && !payment.reference_number?.includes('OVERRIDE')) {
    throw new Error('LIMIT_EXCEEDED: Payment exceeds due amount. Authorization required.');
  }

  // Generate receipt number
  const receiptNumber = `RCP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Record payment
  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payments')
    .insert([{
      ...payment,
      ledger_id: ledger.id,
      receipt_number: receiptNumber,
      paid_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Update ledger
  const { error: updateError } = await supabase
    .from('student_ledgers')
    .update({ paid_amount: ledger.paid_amount + payment.amount! })
    .eq('id', ledger.id);

  if (updateError) throw updateError;

  return paymentRecord;
}

export async function getStudentLedger(studentId: string): Promise<StudentLedger[]> {
  const { data, error } = await supabase
    .from('student_ledgers')
    .select('*')
    .eq('student_id', studentId);

  if (error) throw error;
  return data || [];
}

export async function applyScholarship(studentId: string, feeHeadId: string, amount: number, reason: string): Promise<void> {
  const { data: ledger, error: ledgerError } = await supabase
    .from('student_ledgers')
    .select('*')
    .eq('student_id', studentId)
    .eq('fee_head_id', feeHeadId)
    .single();

  if (ledgerError) throw ledgerError;

  const { error } = await supabase
    .from('student_ledgers')
    .update({ due_amount: ledger.due_amount - amount })
    .eq('id', ledger.id);

  if (error) throw error;

  // Log scholarship (would need a scholarships table in real implementation)
}

export async function getDefaulterReport(filters?: { program_id?: string; semester?: number }): Promise<any[]> {
  let query = supabase
    .from('student_ledgers')
    .select(`
      *,
      student:student_id (name, email),
      fee_structure:fee_structure_id (program_id, semester)
    `)
    .gt('balance', 0);

  const { data, error } = await query;
  if (error) throw error;

  return (data || [])
    .filter(ledger => {
      if (filters?.program_id && (ledger.fee_structure as any)?.program_id !== filters.program_id) return false;
      if (filters?.semester && (ledger.fee_structure as any)?.semester !== filters.semester) return false;
      return true;
    })
    .sort((a, b) => b.balance - a.balance);
}

export async function allocateBudget(data: Partial<DepartmentBudget>): Promise<DepartmentBudget> {
  const { data: budget, error } = await supabase
    .from('department_budgets')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return budget;
}

export async function recordExpenditure(data: Partial<Expenditure>): Promise<Expenditure> {
  // Validate budget limit
  const isValid = await validateBudgetLimit(data.department_id!, data.budget_head_id!, data.amount!);
  
  if (!isValid && !data.override_reason) {
    throw new Error('LIMIT_EXCEEDED: Expenditure exceeds allocated budget. Override reason required.');
  }

  const { data: expenditure, error } = await supabase
    .from('expenditures')
    .insert([{ ...data, created_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) throw error;

  // Update budget spent amount
  // This would need proper implementation with budget_heads JSONB update

  return expenditure;
}

export async function validateBudgetLimit(deptId: string, budgetHeadId: string, amount: number): Promise<boolean> {
  // Get current budget
  const { data: budget, error } = await supabase
    .from('department_budgets')
    .select('budget_heads')
    .eq('department_id', deptId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return false;

  const budgetHead = (budget.budget_heads as BudgetHead[]).find(bh => bh.id === budgetHeadId);
  if (!budgetHead) return false;

  return budgetHead.remaining >= amount;
}

export async function getBudgetReport(deptId: string, period?: { from: string; to: string }): Promise<any> {
  let query = supabase
    .from('department_budgets')
    .select('*')
    .eq('department_id', deptId);

  if (period) {
    query = query.gte('period_from', period.from).lte('period_to', period.to);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}
