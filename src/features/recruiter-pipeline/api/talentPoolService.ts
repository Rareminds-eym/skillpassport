import { apiPost } from '@/shared/api/apiClient';

interface RecruiterTalentRow {
  id: string;
}

/** Primary recruiter discovery reader; the server filters private profiles and
 * masks contacts. Errors must reach the existing learner-hook error state. */
export async function loadRecruiterTalentRows(): Promise<RecruiterTalentRow[]> {
  const response = await apiPost<{ success: boolean; data: RecruiterTalentRow[] }>(
    '/recruiter/actions', { action: 'list-learners', include_details: true },
  );
  if (!response.success || !Array.isArray(response.data) ||
      response.data.some(row => !row || typeof row.id !== 'string')) {
    throw new Error('Candidate discovery returned an invalid response.');
  }
  return response.data;
}
