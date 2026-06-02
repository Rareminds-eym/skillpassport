/**
 * User management hook for college admin
 */

import { useState, useEffect } from 'react';
import type { User } from '@/shared/types/college';
import { userManagementService } from '@/entities/user/api/userManagementService';

interface UseUsersOptions {
  role?: string;
  department_id?: string;
  status?: 'active' | 'inactive';
  search?: string;
}

export const useUsers = (options: UseUsersOptions = {}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await userManagementService.getUsers(options);
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [options.role, options.department_id, options.status, options.search]);

  const createUser = async (userData: Partial<User>) => {
    try {
      const user = await userManagementService.createUser(userData as any);
      await fetchUsers();
      return { success: true, data: user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await userManagementService.updateUser(userId, updates as any);
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deactivateUser = async (userId: string) => {
    try {
      await userManagementService.deleteUser(userId);
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deactivateUser,
    refetch: fetchUsers,
  };
};
