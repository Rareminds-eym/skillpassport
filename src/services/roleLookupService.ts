import { supabase } from '../lib/supabaseClient';
import { UserRole } from './unifiedAuthService';

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

    // 1. Check students table
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!studentError && studentData) {
      foundRoles.push('student');
      foundUserData.push({
        id: studentData.id,
        email: studentData.email,
        name: studentData.name,
        school_id: studentData.school_id,
        university_college_id: studentData.university_college_id,
        role: 'student',
        ...studentData
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

    // 4. Check educators table (fallback)
    if (!foundRoles.includes('educator')) {
      const { data: educatorAltData, error: educatorAltError } = await supabase
        .from('educators')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!educatorAltError && educatorAltData) {
        foundRoles.push('educator');
        foundUserData.push({
          id: educatorAltData.id,
          email: educatorAltData.email,
          name: educatorAltData.first_name && educatorAltData.last_name 
            ? `${educatorAltData.first_name} ${educatorAltData.last_name}`
            : educatorAltData.first_name || educatorAltData.last_name || undefined,
          role: 'educator',
          ...educatorAltData
        });
      }
    }

    // 5. Check users table for admin roles
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!userError && userData && userData.role) {
      const adminRole = userData.role as UserRole;
      if (['school_admin', 'college_admin', 'university_admin'].includes(adminRole)) {
        foundRoles.push(adminRole);
        foundUserData.push({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: adminRole,
          ...userData
        });
      }
    }

    // No roles found
    if (foundRoles.length === 0) {
      console.warn('No role found for user:', userId, email);
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
    console.error('Role lookup error:', error);
    return {
      role: null,
      userData: null,
      error: 'System error. Please try again'
    };
  }
};
