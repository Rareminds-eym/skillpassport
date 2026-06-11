// Requisition API Service
import type { RequisitionImportRow } from '../model/types';
import { apiPost } from '@/shared/api/apiClient';

/**
 * Import requisitions from Excel/CSV data
 */
export async function importRequisitions(rows: RequisitionImportRow[]) {
  try {
    const { data } = await apiPost('/recruiter/actions', { action: 'import-requisitions', rows });
    return data || { success: 0, failed: 0, errors: [] };
  } catch (error) {
    return { success: 0, failed: rows.length, errors: [{ row: 0, error: error instanceof Error ? error.message : 'Import failed' }] };
  }
}

/**
 * Generate requisition import template data
 */
export function generateRequisitionTemplate() {
  return [
    {
      job_title: 'Software Engineer',
      company_name: 'Example Corp',
      department: 'Engineering',
      location: 'Chennai',
      work_mode: 'Hybrid',
      employment_type: 'Full-time',
      experience_required: '2-4 years',
      salary_range: '8-12 LPA',
      description: 'We are looking for a talented software engineer...',
      requirements: 'Bachelor\'s degree in CS, 2+ years experience with React',
      posted_date: new Date().toISOString().split('T')[0],
      status: 'open'
    }
  ];
}
