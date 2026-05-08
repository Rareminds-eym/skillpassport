import { supabase } from '@/shared/api/supabaseClient';
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
    const foundRoles: UserRole[] = [];
    const foundUserData: UserData[] = [];

    // 1. Check learners table
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!learnerError && learnerData) {
      foundRoles.push('learner');
      foundUserData.push({
        id: learnerData.id,
        email: learnerData.email,
        name: learnerData.name,
        school_id: learnerData.school_id,
        university_college_id: learnerData.university_college_id,
        role: 'learner',
        ...learnerData
      });
    }

    // 2. Check recruiters table
    const { data: recruiterData, error: recruiterError } = await supabase
      .from('recruiters')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!recruiterError && recruiterData) {
      foundRoles.push('recruiter');
      foundUserData.push({
        id: recruiterData.id,
        email: recruiterData.email,
        name: recruiterData.name,
        role: 'recruiter',
        ...recruiterData
      });
    }

    // 3. Check school_educators table
    const { data: educatorData, error: educatorError } = await supabase
      .from('school_educators')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!educatorError && educatorData) {
      foundRoles.push('educator');
      foundUserData.push({
        id: educatorData.id,
        email: educatorData.email,
        name: educatorData.first_name && educatorData.last_name 
          ? `${educatorData.first_name} ${educatorData.last_name}`
          : educatorData.first_name || educatorData.last_name || undefined,
        school_id: educatorData.school_id,
        role: 'educator',
        ...educatorData
      });
    }

    // Note: Removed fallback to 'educators' table as it doesn't exist
    // The system uses 'school_educators' table for all educator data

    // 5. Check users table for admin roles
    // Note: users table uses 'id' column that references auth.users(id) directly
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!userError && userData && userData.role) {
      const userRole = userData.role as string;
      
      // Handle admin roles
      if (['school_admin', 'college_admin', 'university_admin'].includes(userRole)) {
        const adminRole = userRole as UserRole;
        foundRoles.push(adminRole);
        foundUserData.push({
          id: userData.id,
          email: userData.email || email,
          name: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData.firstName || userData.lastName || undefined,
          role: adminRole,
          ...userData
        });
      }
      // Handle educator roles (college_educator, school_educator)
      else if (['college_educator', 'school_educator'].includes(userRole)) {
        foundRoles.push('educator');
        foundUserData.push({
          id: userData.id,
          email: userData.email || email,
          name: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData.firstName || userData.lastName || undefined,
          role: 'educator',
          school_id: userRole === 'school_educator' ? userData.organizationId : undefined,
          university_college_id: userRole === 'college_educator' ? userData.organizationId : undefined,
          ...userData
        });
      }
      // Handle learner roles (learner, learner)
      else if (['learner', 'learner'].includes(userRole)) {
        foundRoles.push('learner');
        foundUserData.push({
          id: userData.id,
          email: userData.email || email,
          name: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData.firstName || userData.lastName || undefined,
          role: 'learner',
          school_id: userRole === 'learner' ? userData.organizationId : undefined,
          university_college_id: userRole === 'learner' ? userData.organizationId : undefined,
          ...userData
        });
      }
      // Handle recruiter role
      else if (userRole === 'recruiter') {
        foundRoles.push('recruiter');
        foundUserData.push({
          id: userData.id,
          email: userData.email || email,
          name: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData.firstName || userData.lastName || undefined,
          role: 'recruiter',
          ...userData
        });
      }
      // Handle special admin roles (super_admin, company_admin) - treat as school_admin for now
      else if (['super_admin', 'company_admin'].includes(userRole)) {
        foundRoles.push('school_admin');
        foundUserData.push({
          id: userData.id,
          email: userData.email || email,
          name: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData.firstName || userData.lastName || undefined,
          role: 'school_admin',
          ...userData
        });
      }
    }

    // No roles found
    if (foundRoles.length === 0) {
      return {
        role: null,
        userData: null,
        error: 'Account not properly configured. Contact support'
      };
    }

    // Single role - return directly
    if (foundRoles.length === 1) {
      return {
        role: foundRoles[0],
        userData: foundUserData[0]
      };
    }

    // Multiple roles - return all for user to choose
    return {
      role: null, // User needs to select
      roles: foundRoles,
      userData: null,
      allUserData: foundUserData
    };

  } catch (error) {
    logger.error('Role lookup error', error as Error);
    return {
      role: null,
      userData: null,
      error: 'System error. Please try again'
    };
  }
};
