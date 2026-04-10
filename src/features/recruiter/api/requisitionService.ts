// Requisition API Service
import { supabase } from '@/shared/api/supabaseClient';
import type { RequisitionImportRow } from '../model/types';

/**
 * Import requisitions from Excel/CSV data
 */
export async function importRequisitions(rows: RequisitionImportRow[]) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ row: number; error: string }>
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    try {
      const requisitionData = {
        title: row.job_title,
        job_title: row.job_title,
        company_name: row.company_name,
        department: row.department,
        location: row.location,
        work_mode: row.work_mode,
        employment_type: row.employment_type,
        experience_required: row.experience_required,
        salary_range: row.salary_range,
        description: row.description,
        requirements: row.requirements,
        posted_date: row.posted_date,
        status: row.status || 'open',
        type: 'job'
      };

      const { error } = await supabase
        .from('opportunities')
        .insert(requisitionData);

      if (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error.message
        });
      } else {
        results.success++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
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
