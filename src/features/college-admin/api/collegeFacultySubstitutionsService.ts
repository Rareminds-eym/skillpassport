import { apiPost } from '@/shared/api/apiClient';

export const collegeFacultySubstitutionsService = {
  async createSubstitutions(substitutionEntries: any[]) {
    const result = await apiPost('/college-admin/faculty', { action: 'create-substitutions', entries: substitutionEntries });
    if (!result.success) throw new Error(result.error || 'Failed to create substitutions');
  }
};
