import { apiPost } from '@/shared/api/apiClient';
// @ts-ignore - userApiService is a .js file
import type { ApiResponse, BulkImportResult, User } from '@/shared/types/college';
import userApiService from '@/entities/user/api/userApiService';
import { useAuthStore } from '@/shared/model/authStore';
import { ssoClient } from '@/shared/api/ssoClient';

/**
 * User Management Service
 * Handles all user-related operations for the College Dashboard
 */

export const userManagementService = {
  /**
   * Create a new user using Worker API with proper rollback
   * Property 1: User uniqueness enforcement
   * Creates user via Edge Function: auth.users → users → college_lecturers
   */
  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {

      // Validate required fields
      if (!userData.email || !userData.name) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name and email are required',
          },
        };
      }

      if (!userData.roles || userData.roles.length === 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one role must be selected',
          },
        };
      }

      // Check for duplicate email in users table
      const duplicateResult = await apiPost('/college-admin/faculty', { action: 'check-duplicate-email', email: userData.email });

      if (!duplicateResult.success) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'A user with this email already exists',
            field: 'email',
          },
        };
      }

      // Get auth token for worker API
      const token = ssoClient.getAccessToken();
      if (!token) {
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication required. Please log in.',
          },
        };
      }

      // Get college ID from current user context
      const currentUser = useAuthStore.getState().user;
      let collegeId = null;

      if (currentUser?.id || currentUser?.email) {
        const collegeResult = await apiPost('/college-admin/faculty', { action: 'get-college-by-admin', admin_id: currentUser.id, email: currentUser.email });
        collegeId = collegeResult?.data?.id;
      }

      if (!collegeId) {
        const firstCollegeResult = await apiPost('/college-admin/faculty', { action: 'get-first-college' });
        collegeId = firstCollegeResult?.data?.id;
      }

      // Determine role for worker API
      const isStaff = userData.roles.some(role => 
        ['College Admin', 'HoD', 'Faculty', 'Exam Cell', 'Finance Admin', 'Placement Officer', 'Lecturer'].includes(role)
      );

      if (isStaff) {
        // Use createCollegeStaff worker endpoint
        const nameParts = userData.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const staffResult = await userApiService.createCollegeStaff({
          email: userData.email,
          firstName,
          lastName,
          collegeId: collegeId,
          employeeId: userData.employee_id,
          department: userData.department_id,
          role: userData.roles[0]?.toLowerCase().replace(' ', '_') || 'lecturer',
        }, ssoClient.getAccessToken());

        if (!staffResult.success) {
          return {
            success: false,
            error: {
              code: 'CREATE_ERROR',
              message: staffResult.error || 'Failed to create staff member',
            },
          };
        }

        const createdUser: User = {
          id: staffResult.data.userId,
          name: userData.name,
          email: userData.email,
          roles: userData.roles,
          employee_id: userData.employee_id,
          department_id: userData.department_id,
          status: userData.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return { success: true, data: createdUser };
      } else {
        // For non-staff users, use unified signup
        const nameParts = userData.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const result = await userApiService.unifiedSignup({
          email: userData.email,
          password: Math.random().toString(36).slice(-8) + 'Temp@123',
          firstName,
          lastName,
          role: 'learner',
        });

        if (!result.success) {
          return {
            success: false,
            error: {
              code: 'CREATE_ERROR',
              message: result.error || 'Failed to create user',
            },
          };
        }

        const createdUser: User = {
          id: result.data.userId,
          name: userData.name,
          email: userData.email,
          roles: userData.roles,
          status: userData.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return { success: true, data: createdUser };
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create user',
        },
      };
    }
  },

  /**
   * Update an existing user
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      // Prepare update data for college_lecturers
      const updateData: any = {};
      
      if (updates.name) {
        const nameParts = updates.name.trim().split(' ');
        updateData.first_name = nameParts[0];
        updateData.last_name = nameParts.slice(1).join(' ') || '';
      }
      
      if (updates.email) updateData.email = updates.email;
      if (updates.employee_id) updateData.employeeId = updates.employee_id;
      if (updates.department_id) updateData.department = updates.department_id;
      if (updates.status) updateData.accountStatus = updates.status;
      
      if (updates.roles) {
        updateData.metadata = {
          role: updates.roles[0].toLowerCase().replace(/ /g, '_'),
          roles: updates.roles,
        };
      }

      const result = await apiPost('/college-admin/faculty', { action: 'update-user', user_id: userId, ...updateData });

      if (!result.success) throw new Error(result.error || 'Failed to update user');

      const data = result.data;

      // Transform back to User format
      const updatedUser: User = {
        id: data.id,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        email: data.email,
        roles: data.metadata?.roles || [],
        employee_id: data.employeeId,
        department_id: data.department,
        status: data.accountStatus,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      };

      return { success: true, data: updatedUser };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to update user',
        },
      };
    }
  },

  /**
   * Deactivate a user
   * Property 5: Deactivation preserves data
   */
  async deactivateUser(userId: string): Promise<ApiResponse<void>> {
    try {
      const result = await apiPost('/college-admin/faculty', { action: 'deactivate-user', user_id: userId });

      if (!result.success) throw new Error(result.error || 'Failed to deactivate user');

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DEACTIVATE_ERROR',
          message: error.message || 'Failed to deactivate user',
        },
      };
    }
  },

  /**
   * Bulk import users from CSV data
   * Property 3: Bulk import validation completeness
   */
  async bulkImportUsers(csvData: any[]): Promise<ApiResponse<BulkImportResult>> {
    try {
      const result: BulkImportResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 2; // +2 for header row and 0-index

        // Validate required fields
        if (!row.email || !row.name) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            field: !row.email ? 'email' : 'name',
            message: 'Required field is missing',
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            field: 'email',
            message: 'Invalid email format',
          });
          continue;
        }

        // Validate roles
        if (!row.roles || !Array.isArray(row.roles) || row.roles.length === 0) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            field: 'roles',
            message: 'At least one role must be assigned',
          });
          continue;
        }

        // Attempt to create user
        const createResult = await this.createUser(row);
        if (createResult.success) {
          result.success++;
        } else {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            field: createResult.error.field || 'unknown',
            message: createResult.error.message,
          });
        }
      }

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BULK_IMPORT_ERROR',
          message: error.message || 'Failed to import users',
        },
      };
    }
  },

  /**
   * Reset user password
   */
  async resetPassword(userId: string): Promise<ApiResponse<void>> {
    try {
      const result = await apiPost('/college-admin/faculty', { action: 'reset-password', user_id: userId });

      if (!result.success) throw new Error(result.error || 'Failed to reset password');

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'RESET_PASSWORD_ERROR',
          message: error.message || 'Failed to reset password',
        },
      };
    }
  },

  /**
   * Get users by role
   * Property 2: Role-based access control
   */
  async getUsersByRole(role: string): Promise<ApiResponse<User[]>> {
    try {
      const result = await apiPost('/college-admin/faculty', { action: 'get-users-by-role', role });

      if (!result.success) throw new Error(result.error || 'Failed to fetch users');

      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch users',
        },
      };
    }
  },

  /**
   * Get users with filters
   * Property 6: User filtering correctness
   * Fetches from both college_lecturers and learners tables
   */
  async getUsers(filters: {
    role?: string;
    department_id?: string;
    status?: 'active' | 'inactive';
    search?: string;
  }): Promise<ApiResponse<User[]>> {
    try {
      const users: User[] = [];

      // Get current user's college ID
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Check college_lecturers table first
      const lecturerCollegeResult = await apiPost('/college-admin/faculty', { action: 'get-lecturer-college', user_id: currentUser.id, email: currentUser.email });

      let collegeId = lecturerCollegeResult?.data?.collegeId;

      // If not found, check organizations table
      if (!collegeId) {
        const orgResult = await apiPost('/college-admin/faculty', { action: 'get-college-by-admin', admin_id: currentUser.id });
        collegeId = orgResult?.data?.id;
      }

      if (!collegeId) {
        return {
          users: [],
          total: 0,
          page: filters.page || 1,
          limit: filters.limit || 10,
        };
      }

      // Fetch lecturers from college_lecturers table - FILTER BY COLLEGE
      const lecturersResult = await apiPost('/college-admin/faculty', {
        action: 'get-lecturers',
        college_id: collegeId,
        status: filters.status,
        department_id: filters.department_id,
      });

      const lecturers = lecturersResult?.data || [];

      if (lecturers && lecturers.length > 0) {
        // Fetch user details separately for each lecturer
        const userIds = lecturers
          .map((l: any) => l.user_id)
          .filter(Boolean);

        let usersMap: Record<string, any> = {};
        
        if (userIds.length > 0) {
          const usersResult = await apiPost('/college-admin/faculty', { action: 'get-users-by-ids', user_ids: userIds });
          const usersData = usersResult?.data || [];

          if (usersData) {
            usersMap = usersData.reduce((acc: Record<string, any>, user: any) => {
              acc[user.id] = user;
              return acc;
            }, {} as Record<string, any>);
          }
        }

        // Transform lecturers data to User format
        for (const lecturer of lecturers) {
          const userId = lecturer.user_id;
          const userData = userId ? usersMap[userId] : null;
          const metadata = lecturer.metadata || {};
          
          // Get name from direct columns or metadata or users table
          const firstName = lecturer.first_name || metadata.first_name || '';
          const lastName = lecturer.last_name || metadata.last_name || '';
          const fullName = firstName && lastName 
            ? `${firstName} ${lastName}` 
            : userData?.full_name || userData?.name || lecturer.employeeId || 'Unknown';
          
          // Get email from direct column or metadata or users table
          const email = lecturer.email || metadata.email || userData?.email || `lecturer-${lecturer.id}@unknown.com`;
          
          // Determine roles from metadata
          let roles: string[] = [];
          if (metadata.role) {
            const roleMap: Record<string, string> = {
              'college_admin': 'College Admin',
              'dean': 'Dean',
              'hod': 'HoD',
              'professor': 'Faculty',
              'assistant_professor': 'Faculty',
              'lecturer': 'Lecturer',
              'exam_cell': 'Exam Cell',
              'finance_admin': 'Finance Admin',
              'placement_officer': 'Placement Officer',
            };
            roles = [roleMap[metadata.role] || 'Faculty'];
          } else {
            roles = ['Faculty', 'Lecturer'];
          }
          
          const user: User = {
            id: userId || lecturer.id,
            name: fullName,
            email: email,
            roles: roles,
            employee_id: lecturer.employeeId || undefined,
            department_id: lecturer.department || undefined,
            status: lecturer.accountStatus || 'active',
            created_at: lecturer.createdAt,
            updated_at: lecturer.updatedAt,
            metadata: {
              type: 'lecturer',
              specialization: lecturer.specialization,
              qualification: lecturer.qualification,
              experienceYears: lecturer.experienceYears,
              dateOfJoining: lecturer.dateOfJoining,
            },
          };

          // Apply search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            if (
              user.name.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower) ||
              user.employee_id?.toLowerCase().includes(searchLower)
            ) {
              users.push(user);
            }
          } else {
            users.push(user);
          }
        }
      }

      // NOTE: Learners are NOT included in User Management
      // Learners should be managed through the Learner Admission module

      // Apply role filter
      let filteredUsers = users;
      if (filters.role) {
        filteredUsers = users.filter(user => 
          user.roles?.some(role => role.toLowerCase().includes(filters.role!.toLowerCase()))
        );
      }

      return { success: true, data: filteredUsers };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch users',
        },
      };
    }
  },

  /**
   * Calculate faculty workload
   * Property 4: Faculty workload calculation accuracy
   */
  async calculateFacultyWorkload(facultyId: string): Promise<ApiResponse<number>> {
    try {
      const result = await apiPost('/college-admin/faculty', { action: 'calculate-faculty-workload', faculty_id: facultyId });

      if (!result.success) throw new Error(result.error || 'Failed to calculate workload');

      const totalCredits = result.data?.totalCredits || 0;

      return { success: true, data: totalCredits };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'WORKLOAD_CALCULATION_ERROR',
          message: error.message || 'Failed to calculate workload',
        },
      };
    }
  },
};
