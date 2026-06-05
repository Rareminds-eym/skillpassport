import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { UserRole } from './unifiedAuthService';

const logger = getLogger('role-lookup-service');

export interface UserData {
  id: string;
  email: string;
  name?: string;
  school_id?: string;
  university_college_id?: string;
  [key: string]: any;
}

export interface RoleLookupResult {
  role: UserRole | null;
  roles?: UserRole[]; // Multiple roles if user has more than one
  userData: UserData | null;
  allUserData?: UserData[]; // All user data for each role
  error?: string;
}

/**
 * Determine user role(s) by querying appropriate database tables
 * @param userId - Supabase auth user ID
 * @param email - User email
 * @returns RoleLookupResult with role(s) and user data
 */
export const getUserRole = async (userId: string, email: string): Promise<RoleLookupResult> => {
  try {
    const response: any = await apiPost('/user/actions', { action: 'lookup-user-roles', userId, email });
    return response?.data ?? { role: null, userData: null, error: 'System error. Please try again' };
  } catch (error) {
    logger.error('Role lookup error', error as Error);
    return {
      role: null,
      userData: null,
      error: 'System error. Please try again'
    };
  }
};
