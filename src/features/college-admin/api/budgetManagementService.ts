import { apiPost } from '@/shared/api/apiClient';
import type { DepartmentBudget, Expenditure, BudgetReport, ApiResponse } from '@/shared/types/college';

export const budgetManagementService = {
  async allocateBudget(data: Partial<DepartmentBudget>): Promise<ApiResponse<DepartmentBudget>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'allocate-budget', ...data });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'ALLOCATE_ERROR', message: error?.message || error?.error?.message || 'Failed to allocate budget' } };
    }
  },

  async submitBudgetRequest(budgetId: string, justification: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/finance', { action: 'submit-budget', budget_id: budgetId });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'SUBMIT_ERROR', message: error?.message || error?.error?.message || 'Failed to submit budget request' } };
    }
  },

  async approveBudget(budgetId: string, approvedBy: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/finance', { action: 'approve-budget', budget_id: budgetId, approved_by: approvedBy });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'APPROVE_ERROR', message: error?.message || error?.error?.message || 'Failed to approve budget' } };
    }
  },

  async recordExpenditure(data: Partial<Expenditure>): Promise<ApiResponse<Expenditure>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'record-expenditure', ...data });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'EXPENDITURE_ERROR', message: error?.message || error?.error?.message || 'Failed to record expenditure' } };
    }
  },

  async validateBudgetLimit(deptId: string, budgetHeadId: string, amount: number): Promise<ApiResponse<boolean>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'validate-budget', department_id: deptId, budget_head_id: budgetHeadId, amount });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: error?.message || error?.error?.message || 'Failed to validate budget limit' } };
    }
  },

  async getBudgetReport(deptId: string, period: { from: string; to: string }): Promise<ApiResponse<BudgetReport>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'get-budget-report', department_id: deptId, period_from: period.from, period_to: period.to });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'REPORT_ERROR', message: error?.message || error?.error?.message || 'Failed to generate budget report' } };
    }
  },

  async exportExpenditureReport(filters: { department_id?: string; budget_id?: string; date_from?: string; date_to?: string }): Promise<ApiResponse<Blob>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'get-expenditures', ...filters });
      const content = JSON.stringify(result.data || [], null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      return { success: true, data: blob };
    } catch (error: any) {
      return { success: false, error: { code: 'EXPORT_ERROR', message: error?.message || error?.error?.message || 'Failed to export report' } };
    }
  },

  async getDepartmentBudgets(filters: { department_id?: string; status?: string }): Promise<ApiResponse<DepartmentBudget[]>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'get-budgets', ...filters });
      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: { code: 'FETCH_ERROR', message: error?.message || error?.error?.message || 'Failed to fetch budgets' } };
    }
  },

  async getExpenditures(filters: { department_id?: string; budget_id?: string; budget_head_id?: string }): Promise<ApiResponse<Expenditure[]>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'get-expenditures', ...filters });
      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: { code: 'FETCH_ERROR', message: error?.message || error?.error?.message || 'Failed to fetch expenditures' } };
    }
  },
};
