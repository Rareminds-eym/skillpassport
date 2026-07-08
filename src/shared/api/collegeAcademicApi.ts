import { apiPost } from '@/shared/api/apiClient'

type ServiceResponse<T> = { data: T; error: null } | { data: null; error: string }

interface ProgramSectionLearnersResponse {
  success: boolean
  data?: Record<string, unknown>[]
  error?: string
}

/**
 * Get learners from lecturer's assigned program sections with full rich data.
 * Placed in shared so entities layer can import it without violating FSD rules.
 */
export const getProgramSectionlearners = async (userId: string): Promise<ServiceResponse<Record<string, unknown>[]>> => {
  try {
    const response = await apiPost<ProgramSectionLearnersResponse>('/college-admin/academic', { action: 'get-program-section-learners', userId })
    if (!response.success) {
      return { data: null, error: response.error || 'Unable to fetch learners' }
    }
    return { data: response.data || [], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unable to fetch learners' }
  }
}
