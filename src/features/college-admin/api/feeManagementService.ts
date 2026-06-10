import { apiPost } from '@/shared/api/apiClient';
import type { FeeStructure, LearnerLedger, Payment, DefaulterReport, ApiResponse } from '@/shared/types/college';

export const feeManagementService = {
  async createFeeStructure(data: Partial<FeeStructure>): Promise<ApiResponse<FeeStructure>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'create-fee-structure', ...data });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'CREATE_ERROR', message: error?.message || error?.error?.message || 'Failed to create fee structure' } };
    }
  },

  async recordPayment(learnerId: string, feeHeadId: string, payment: Partial<Payment>): Promise<ApiResponse<Payment>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'record-payment', learner_id: learnerId, fee_head_id: feeHeadId, ...payment });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'PAYMENT_ERROR', message: error?.message || error?.error?.message || 'Failed to record payment' } };
    }
  },

  async generateReceipt(paymentId: string): Promise<ApiResponse<Blob>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'get-payment', payment_id: paymentId });
      const payment = result.data;
      const receiptContent = { receipt_number: payment.receipt_number, amount: payment.amount, mode: payment.mode, date: payment.paid_at };
      const blob = new Blob([JSON.stringify(receiptContent, null, 2)], { type: 'application/json' });
      return { success: true, data: blob };
    } catch (error: any) {
      return { success: false, error: { code: 'RECEIPT_ERROR', message: error?.message || error?.error?.message || 'Failed to generate receipt' } };
    }
  },

  async getlearnerLedger(learnerId: string): Promise<ApiResponse<LearnerLedger[]>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'get-learner-ledger', learner_id: learnerId });
      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: { code: 'FETCH_ERROR', message: error?.message || error?.error?.message || 'Failed to fetch ledger' } };
    }
  },

  async applyScholarship(learnerId: string, feeHeadId: string, amount: number, reason: string, appliedBy: string): Promise<ApiResponse<void>> {
    try {
      if (!reason?.trim()) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Reason is required for scholarship application', field: 'reason' } };
      }
      await apiPost('/college-admin/finance', { action: 'apply-scholarship', learner_id: learnerId, fee_head_id: feeHeadId, amount, reason, applied_by: appliedBy });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'SCHOLARSHIP_ERROR', message: error?.message || error?.error?.message || 'Failed to apply scholarship' } };
    }
  },

  async getDefaulterReport(filters: { program_id?: string; department_id?: string; semester?: number }): Promise<ApiResponse<DefaulterReport>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'get-defaulter-report', ...filters });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'REPORT_ERROR', message: error?.message || error?.error?.message || 'Failed to generate defaulter report' } };
    }
  },

  async exportFeeReports(filters: { program_id?: string; semester?: number; payment_status?: string }, format: 'excel' | 'pdf'): Promise<ApiResponse<Blob>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'get-fee-structures', ...filters });
      const content = JSON.stringify(result.data || [], null, 2);
      const blob = new Blob([content], { type: format === 'excel' ? 'application/vnd.ms-excel' : 'application/pdf' });
      return { success: true, data: blob };
    } catch (error: any) {
      return { success: false, error: { code: 'EXPORT_ERROR', message: error?.message || error?.error?.message || 'Failed to export reports' } };
    }
  },

  async getFeeStructures(filters: { program_id?: string; semester?: number; academic_year?: string }): Promise<ApiResponse<FeeStructure[]>> {
    try {
      const result: any = await apiPost('/college-admin/finance', { action: 'get-fee-structures', ...filters });
      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: { code: 'FETCH_ERROR', message: error?.message || error?.error?.message || 'Failed to fetch fee structures' } };
    }
  },
};
