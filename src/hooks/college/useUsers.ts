import { useState, useEffect } from 'react';
import { userManagementService } from '../../services/college';
import type { User } from '../../types/college';

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
      const result = await userManagementService.getUsers(options);
      
      if (result.success) {
        setUsers(result.data || []);
      } else {
        setError(result.error.message);
        setUsers([]); // Set empty array on error
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      setUsers([]); // Set empty array on exception
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [options.role, options.department_id, options.status, options.search]);

  const createUser = async (userData: Partial<User>) => {
    const result = await userManagementService.createUser(userData);
    if (result.success) {
      await fetchUsers();
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const result = await userManagementService.updateUser(userId, updates);
    if (result.success) {
      await fetchUsers();
      return { success: true };
    }
    return { success: false, error: result.error.message };
  };

  const deactivateUser = async (userId: string) => {
    const result = await userManagementService.deactivateUser(userId);
    if (result.success) {
      await fetchUsers();
      return { success: true };
    }
    return { success: false, error: result.error.message };
  };

  const resetPassword = async (userId: string) => {
    const result = await userManagementService.resetPassword(userId);
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error.message };
  };

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deactivateUser,
    resetPassword,
    refetch: fetchUsers,
  };
};
