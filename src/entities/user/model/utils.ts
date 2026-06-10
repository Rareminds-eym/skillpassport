/**
 * User Entity - Utility Functions
 * Helper functions for user data manipulation
 */

import { isSameEntity } from '@/shared/lib/comparison';
import type { User, UserRole } from './types';

// ============================================================================
// User Display Utilities
// ============================================================================

export const getUserDisplayName = (user: User | null | undefined): string => {
  if (!user) return 'Unknown User';

  if (user.name) return user.name;

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;

  return user.email || 'Unknown User';
};

export const getUserInitials = (user: User | null | undefined): string => {
  if (!user) return 'U';

  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }

  if (user.name) {
    const parts = user.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name[0].toUpperCase();
  }

  if (user.email) {
    return user.email[0].toUpperCase();
  }

  return 'U';
};

// ============================================================================
// Role Mapping Utilities
// ============================================================================

export const mapRoleToWorkerAPI = (role: UserRole): string => {
  const roleMapping: Record<string, string> = {
    'learner': 'learner',
    'educator': 'school_educator',
    'school_educator': 'school_educator',
    'college_educator': 'college_educator',
    'recruiter': 'recruiter',
    'admin': 'school_admin',
    'school_admin': 'school_admin',
    'college_admin': 'college_admin',
    'university_admin': 'university_admin',
  };

  return roleMapping[role] || 'learner';
};

export const getRoleDisplayName = (role: UserRole | string | null | undefined): string => {
  if (!role) return 'User';

  const displayNames: Record<string, string> = {
    'learner': 'Learner',
    'educator': 'Educator',
    'school_educator': 'School Educator',
    'college_educator': 'College Educator',
    'recruiter': 'Recruiter',
    'hr': 'HR',
    'admin': 'Admin',
    'school_admin': 'School Admin',
    'college_admin': 'College Admin',
    'university_admin': 'University Admin',
    'principal': 'Principal',
    'vice_principal': 'Vice Principal',
    'it_admin': 'IT Admin',
    'class_teacher': 'Class Teacher',
    'subject_teacher': 'Subject Teacher',
  };

  return displayNames[role] || role;
};

// ============================================================================
// Admin Role Utilities
// ============================================================================

export const getSpecificAdminRole = (
  sessionUser: any,
  storedUser: User | null
): string => {
  const sessionRole = sessionUser.user_metadata?.user_role ||
    sessionUser.user_metadata?.role ||
    'user';

  // Handle legacy "admin" role
  if (sessionRole === 'admin' && storedUser?.role) {
    const specificRoles = ['school_admin', 'college_admin', 'university_admin'];
    if (specificRoles.includes(storedUser.role)) {
      return storedUser.role;
    }
  }

  return sessionRole;
};

// ============================================================================
// User Data Transformation
// ============================================================================

export const restoreUserFromStorage = (
  sessionUser: any,
  storedUser: User | null
): User => {
  const sessionRole = getSpecificAdminRole(sessionUser, storedUser);

  if (storedUser) {
    try {
      const userMatches =
        storedUser.id === sessionUser.id ||
        storedUser.email === sessionUser.email;

      if (userMatches) {
        return {
          ...storedUser,
          id: sessionUser.id,
          role: sessionRole as UserRole,
        };
      }
    } catch {
      // Ignore errors
    }
  }

  // Create new user from session
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    role: sessionRole as UserRole,
    name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name,
    user_metadata: sessionUser.user_metadata,
  };
};

// ============================================================================
// User Filtering Utilities
// ============================================================================

export const filterUsersByRole = (users: User[], role: UserRole): User[] => {
  return users.filter(user => user.role === role);
};

export const filterActiveUsers = (users: User[]): User[] => {
  return users.filter(user => user.isActive !== false);
};

export const searchUsers = (users: User[], searchTerm: string): User[] => {
  const term = searchTerm.toLowerCase();
  return users.filter(user => {
    const displayName = getUserDisplayName(user).toLowerCase();
    const email = user.email?.toLowerCase() || '';
    return displayName.includes(term) || email.includes(term);
  });
};

// ============================================================================
// User Comparison Utilities
// ============================================================================

export const isSameUser = isSameEntity<User>;

export const sortUsersByName = (users: User[]): User[] => {
  return [...users].sort((a, b) => {
    const nameA = getUserDisplayName(a).toLowerCase();
    const nameB = getUserDisplayName(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
};
