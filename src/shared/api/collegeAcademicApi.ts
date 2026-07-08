import { apiPost } from '@/shared/api/apiClient'

type ServiceResponse<T> = { data: T; error: null } | { data: null; error: string }

/**
 * Get learners from lecturer's assigned program sections with full rich data.
 * Placed in shared so entities layer can import it without violating FSD rules.
 */
export const getProgramSectionlearners = async (userId: string): Promise<ServiceResponse<any[]>> => {
  try {
    const response = await apiPost('/college-admin/academic', { action: 'get-program-section-learners', userId }) as any
    if (!response.success) {
      return { data: null, error: response.error || 'Unable to fetch learners' }
    }
    return { data: response.data || [], error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || 'Unable to fetch learners' }
  }
}
