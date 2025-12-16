import { supabase } from '../../lib/supabaseClient';
import type { 
  DepartmentBudget, 
  Expenditure, 
  BudgetReport, 
  ApiResponse 
} from '../../types/college';

/**
 * Budget Management Service
 * Handles department budgets and expenditure tracking
 */

export const budgetManagementService = {
  /**
   * Allocate budget to department
   */
  async allocateBudget(data: Partial<DepartmentBudget>): Promise<ApiResponse<DepartmentBudget>> {
    try {
      const { data: budget, error } = await supabase
        .from('department_budgets')
        .insert([{ ...data, status: 'draft' }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: budget };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ALLOCATE_ERROR',
          message: error.message || 'Failed to allocate budget',
        },
      };
    }
  },

  /**
   * Submit budget request
   */
  async submitBudgetRequest(budgetId: string, justification: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('department_budgets')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', budgetId);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SUBMIT_ERROR',
          message: error.message || 'Failed to submit budget request',
        },
      };
    }
  },

  /**
   * Approve budget
   */
  async approveBudget(budgetId: string, approvedBy: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('department_budgets')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq('id', budgetId);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'APPROVE_ERROR',
          message: error.message || 'Failed to approve budget',
        },
      };
    }
  },

  /**
   * Record expenditure
   * Property 32: Budget limit enforcement
   */
  async recordExpenditure(data: Partial<Expenditure>): Promise<ApiResponse<Expenditure>> {
    try {
      // Get budget details
      const { data: budget, error: budgetError } = await supabase
        .from('department_budgets')
        .select('budget_heads')
        .eq('id', data.budget_id)
        .single();

      if (budgetError) throw budgetError;

      // Find the specific budget head
      const budgetHead = (budget.budget_heads || []).find(
        (head: any) => head.id === data.budget_head_id
      );

      if (!budgetHead) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Budget head not found',
          },
        };
      }

      // Get current expenditure for this budget head
      const { data: existingExpenses, error: expenseError } = await supabase
        .from('expenditures')
        .select('amount')
        .eq('budget_id', data.budget_id)
        .eq('budget_head_id', data.budget_head_id);

      if (expenseError) throw expenseError;

      const currentSpent = existingExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const newTotal = currentSpent + (data.amount || 0);

      // Check if exceeds budget (Property 32)
      if (newTotal > budgetHead.allocated_amount && !data.override_reason) {
        return {
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: `Expenditure would exceed allocated budget (₹${budgetHead.allocated_amount}). Current: ₹${currentSpent}, Requested: ₹${data.amount}`,
          },
        };
      }

      // Record expenditure
      const { data: expenditure, error } = await supabase
        .from('expenditures')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      // Update budget head spent amount
      const updatedBudgetHeads = (budget.budget_heads || []).map((head: any) => {
        if (head.id === data.budget_head_id) {
          return {
            ...head,
            spent_amount: (head.spent_amount || 0) + (data.amount || 0),
            remaining: head.allocated_amount - ((head.spent_amount || 0) + (data.amount || 0)),
          };
        }
        return head;
      });

      await supabase
        .from('department_budgets')
        .update({ budget_heads: updatedBudgetHeads })
        .eq('id', data.budget_id);

      return { success: true, data: expenditure };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'EXPENDITURE_ERROR',
          message: error.message || 'Failed to record expenditure',
        },
      };
    }
  },

  /**
   * Validate budget limit
   */
  async validateBudgetLimit(
    deptId: string,
    budgetHeadId: string,
    amount: number
  ): Promise<ApiResponse<boolean>> {
    try {
      // Get active budget for department
      const { data: budget, error } = await supabase
        .from('department_budgets')
        .select('budget_heads')
        .eq('department_id', deptId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      const budgetHead = (budget.budget_heads || []).find(
        (head: any) => head.id === budgetHeadId
      );

      if (!budgetHead) {
        return { success: true, data: false };
      }

      const available = budgetHead.remaining || 0;
      const isValid = amount <= available;

      return { success: true, data: isValid };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Failed to validate budget limit',
        },
      };
    }
  },

  /**
   * Get budget report
   * Property 33: Budget variance calculation
   */
  async getBudgetReport(
    deptId: string,
    period: { from: string; to: string }
  ): Promise<ApiResponse<BudgetReport>> {
    try {
      // Get budget for period
      const { data: budget, error: budgetError } = await supabase
        .from('department_budgets')
        .select('*')
        .eq('department_id', deptId)
        .gte('period_from', period.from)
        .lte('period_to', period.to)
        .single();

      if (budgetError) throw budgetError;

      // Get department name
      const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', deptId)
        .single();

      // Calculate variance for each budget head (Property 33)
      const budgetHeads = (budget.budget_heads || []).map((head: any) => {
        const planned = head.allocated_amount || 0;
        const actual = head.spent_amount || 0;
        const variance = actual - planned;
        const utilization = planned > 0 ? (actual / planned) * 100 : 0;

        return {
          name: head.name,
          planned,
          actual,
          variance,
          utilization_percentage: Math.round(utilization * 100) / 100,
        };
      });

      const totalPlanned = budgetHeads.reduce((sum, head) => sum + head.planned, 0);
      const totalActual = budgetHeads.reduce((sum, head) => sum + head.actual, 0);
      const totalVariance = totalActual - totalPlanned;

      return {
        success: true,
        data: {
          department_id: deptId,
          department_name: dept?.name || '',
          period,
          budget_heads: budgetHeads,
          total_planned: totalPlanned,
          total_actual: totalActual,
          total_variance: totalVariance,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REPORT_ERROR',
          message: error.message || 'Failed to generate budget report',
        },
      };
    }
  },

  /**
   * Export expenditure report
   */
  async exportExpenditureReport(filters: {
    department_id?: string;
    budget_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<Blob>> {
    try {
      let query = supabase.from('expenditures').select('*');

      if (filters.department_id) query = query.eq('department_id', filters.department_id);
      if (filters.budget_id) query = query.eq('budget_id', filters.budget_id);
      if (filters.date_from) query = query.gte('expenditure_date', filters.date_from);
      if (filters.date_to) query = query.lte('expenditure_date', filters.date_to);

      const { data, error } = await query;

      if (error) throw error;

      // Generate export (simplified)
      const content = JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: 'application/json' });

      return { success: true, data: blob };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error.message || 'Failed to export report',
        },
      };
    }
  },

  /**
   * Get department budgets
   */
  async getDepartmentBudgets(filters: {
    department_id?: string;
    status?: string;
  }): Promise<ApiResponse<DepartmentBudget[]>> {
    try {
      let query = supabase.from('department_budgets').select('*');

      if (filters.department_id) query = query.eq('department_id', filters.department_id);
      if (filters.status) query = query.eq('status', filters.status);

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch budgets',
        },
      };
    }
  },

  /**
   * Get expenditures
   */
  async getExpenditures(filters: {
    department_id?: string;
    budget_id?: string;
    budget_head_id?: string;
  }): Promise<ApiResponse<Expenditure[]>> {
    try {
      let query = supabase.from('expenditures').select('*');

      if (filters.department_id) query = query.eq('department_id', filters.department_id);
      if (filters.budget_id) query = query.eq('budget_id', filters.budget_id);
      if (filters.budget_head_id) query = query.eq('budget_head_id', filters.budget_head_id);

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch expenditures',
        },
      };
    }
  },
};
