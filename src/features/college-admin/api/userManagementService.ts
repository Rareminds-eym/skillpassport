import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';
// @ts-ignore - userApiService is a .js file
import type { ApiResponse, BulkImportResult, User } from '@/shared/types/college';
import userApiService from '@/entities/user/api/userApiService';

const logger = getLogger('user-management-service');

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
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .maybeSingle();

      if (existingUser) {
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
      const { data: { session } } = getCurrentSession();
      if (!session?.access_token) {
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Not authenticated. Please log in again.',
          },
        };
      }

      // Get college ID from current user context
      const { data: { user: currentUser } } = getCurrentUser();
      let collegeId = null;

      if (currentUser?.id || currentUser?.email) {
        const { data: collegeData } = await supabase
          .from('organizations')
          .select('id')
          .eq('organization_type', 'college')
          .or(`admin_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
          .maybeSingle();

        collegeId = collegeData?.id;
      }

      if (!collegeId) {
        const { data: firstCollege } = await supabase
          .from('organizations')
          .select('id')
          .eq('organization_type', 'college')
          .limit(1)
          .maybeSingle();
        
        collegeId = firstCollege?.id;
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
        }, session.access_token);

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
          role: 'college_student',
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
      logger.error('Error creating user', error as Error);
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

      const { data, error } = await supabase
        .from('college_lecturers')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

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
      const { error } = await supabase
        .from('college_lecturers')
        .update({ accountStatus: 'deactivated' })
        .eq('id', userId);

      if (error) throw error;

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
      // Get user email from college_lecturers
      const { data: lecturer, error: fetchError } = await supabase
        .from('college_lecturers')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!lecturer) throw new Error('User not found');

      if (!lecturer?.email) {
        throw new Error('User email not found');
      }

      // Generate new temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

      // Update temporary password in college_lecturers
      const { error: updateError } = await supabase
        .from('college_lecturers')
        .update({
          temporary_password: tempPassword,
          password_created_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .contains('roles', [role])
        .eq('status', 'active');

      if (error) throw error;

      return { success: true, data: data || [] };
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
   * Fetches from both college_lecturers and students tables
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
      const { data: { user: currentUser } } = getCurrentUser();
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Check college_lecturers table first
      const { data: lecturerData } = await supabase
        .from('college_lecturers')
        .select('collegeId')
        .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
        .maybeSingle();

      let collegeId = lecturerData?.collegeId;

      // If not found, check organizations table
      if (!collegeId) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .eq('admin_id', currentUser.id)
          .eq('organization_type', 'college')
          .maybeSingle();

        collegeId = orgData?.id;
      }

      if (!collegeId) {
        logger.error('No college ID found for current user', new Error('College ID lookup failed'));
        return {
          users: [],
          total: 0,
          page: filters.page || 1,
          limit: filters.limit || 10,
        };
      }

      // Fetch lecturers from college_lecturers table - FILTER BY COLLEGE
      let lecturersQuery = supabase
        .from('college_lecturers')
        .select(`
          id,
          user_id,
          collegeId,
          employeeId,
          department,
          specialization,
          qualification,
          experienceYears,
          dateOfJoining,
          accountStatus,
          createdAt,
          updatedAt,
          metadata,
          first_name,
          last_name,
          email
        `)
        .eq('collegeId', collegeId);

      if (filters.status) {
        lecturersQuery = lecturersQuery.eq('accountStatus', filters.status);
      }

      if (filters.department_id) {
        lecturersQuery = lecturersQuery.eq('department', filters.department_id);
      }

      const { data: lecturers, error: lecturersError } = await lecturersQuery;

      if (lecturersError) {
        logger.error('Error fetching lecturers', lecturersError as Error, { collegeId });
      } else if (lecturers && lecturers.length > 0) {
        // Fetch user details separately for each lecturer
        const userIds = lecturers
          .map(l => l.user_id)
          .filter(Boolean);

        let usersMap: Record<string, any> = {};
        
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, email, full_name, name')
            .in('id', userIds);

          if (usersData) {
            usersMap = usersData.reduce((acc, user) => {
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

      // NOTE: Students are NOT included in User Management
      // Students should be managed through the Student Admission module

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
      const { data, error } = await supabase
        .from('course_mappings')
        .select('credits')
        .eq('faculty_id', facultyId);

      if (error) throw error;

      const totalCredits = data?.reduce((sum, course) => sum + course.credits, 0) || 0;

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
