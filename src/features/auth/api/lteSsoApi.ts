import { apiPost } from '@/shared/api/apiClient';
import type { ApiEnvelope, GenerateLteCodeResponse } from '../model/lteSsoTypes';

export async function generateLteCode(): Promise<GenerateLteCodeResponse> {
  try {
    const response = await apiPost<ApiEnvelope<GenerateLteCodeResponse>>('/auth/generate-lte-code');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message ?? 'Unable to start LTE session');
    }

    return response.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to start LTE session due to network failure');
  }
}
