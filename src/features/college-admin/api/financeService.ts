import { apiPost } from '@/shared/api/apiClient';

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

export interface LearnerLedger {
  id: string;
  learner_id: string;
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

export interface ExpenditureSummary {
  total_due_amount: number;
  total_paid_amount: number;
  total_balance: number;
  total_learners: number;
  overdue_learners: number;
  paid_learners: number;
  pending_learners: number;
  collection_percentage: number;
}

export interface DepartmentExpenditure {
  department_id: string;
  department_name: string;
  department_code?: string;
  total_due_amount: number;
  total_paid_amount: number;
  total_balance: number;
  learner_count: number;
  collection_percentage: number;
}

export interface ProgramExpenditure {
  program_id: string;
  program_name: string;
  program_code?: string;
  department_name: string;
  total_due_amount: number;
  total_paid_amount: number;
  total_balance: number;
  learner_count: number;
  collection_percentage: number;
}

export async function createFeeStructure(data: Partial<FeeStructure>): Promise<FeeStructure> {
  const result: any = await apiPost('/college-admin/finance', { action: 'create-fee-structure', ...data });
  return result.data;
}

export async function recordPayment(learnerId: string, feeHeadId: string, payment: Partial<Payment>): Promise<Payment> {
  const result: any = await apiPost('/college-admin/finance', { action: 'record-payment', learner_id: learnerId, fee_head_id: feeHeadId, ...payment });
  return result.data;
}

export async function getlearnerLedger(learnerId: string): Promise<LearnerLedger[]> {
  const result: any = await apiPost('/college-admin/finance', { action: 'get-learner-ledger', learner_id: learnerId });
  return result.data || [];
}

export async function applyScholarship(learnerId: string, feeHeadId: string, amount: number, reason: string): Promise<void> {
  await apiPost('/college-admin/finance', { action: 'apply-scholarship', learner_id: learnerId, fee_head_id: feeHeadId, amount, reason });
}

export async function getDefaulterReport(filters?: { program_id?: string; semester?: number }): Promise<any[]> {
  const result: any = await apiPost('/college-admin/finance', { action: 'get-defaulter-report', ...filters });
  return result.data?.learners || [];
}

export async function allocateBudget(data: Partial<DepartmentBudget>): Promise<DepartmentBudget> {
  const result: any = await apiPost('/college-admin/finance', { action: 'allocate-budget', ...data });
  return result.data;
}

export async function recordExpenditure(data: Partial<Expenditure>): Promise<Expenditure> {
  const result: any = await apiPost('/college-admin/finance', { action: 'record-expenditure', ...data });
  return result.data;
}

export async function validateBudgetLimit(deptId: string, budgetHeadId: string, amount: number): Promise<boolean> {
  try {
    const result: any = await apiPost('/college-admin/finance', { action: 'validate-budget', department_id: deptId, budget_head_id: budgetHeadId, amount });
    return result.data === true;
  } catch {
    return false;
  }
}

export async function getBudgetReport(deptId: string, period?: { from: string; to: string }): Promise<any> {
  const result: any = await apiPost('/college-admin/finance', {
    action: 'get-budget-report',
    department_id: deptId,
    period_from: period?.from,
    period_to: period?.to,
  });
  return result.data;
}

export async function getExpenditureSummary(collegeId: string): Promise<ExpenditureSummary> {
  try {
    const result: any = await apiPost('/college-admin/finance', { action: 'get-expenditure-summary', college_id: collegeId });
    return result.data || {
      total_due_amount: 0,
      total_paid_amount: 0,
      total_balance: 0,
      total_learners: 0,
      overdue_learners: 0,
      paid_learners: 0,
      pending_learners: 0,
      collection_percentage: 0
    };
  } catch {
    return {
      total_due_amount: 0,
      total_paid_amount: 0,
      total_balance: 0,
      total_learners: 0,
      overdue_learners: 0,
      paid_learners: 0,
      pending_learners: 0,
      collection_percentage: 0
    };
  }
}

export async function getDepartmentExpenditure(collegeId: string): Promise<DepartmentExpenditure[]> {
  try {
    const result: any = await apiPost('/college-admin/finance', { action: 'get-department-expenditure', college_id: collegeId });
    return result.data || [];
  } catch {
    return [];
  }
}

export async function getProgramExpenditure(collegeId: string): Promise<ProgramExpenditure[]> {
  try {
    const result: any = await apiPost('/college-admin/finance', { action: 'get-program-expenditure', college_id: collegeId });
    return result.data || [];
  } catch {
    return [];
  }
}
