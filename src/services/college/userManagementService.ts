import { supabase } from '../../lib/supabaseClient';
import type { User, BulkImportResult, ApiResponse } from '../../types/college';

/**
 * User Management Service
 * Handles all user-related operations for the College Dashboard
 */

export const userManagementService = {
  /**
   * Create a new user
   * Property 1: User uniqueness enforcement
   * Creates user via Edge Function: auth.users → users → college_lecturers
   */
  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      console.log('🆕 Creating user via Edge Function:', userData);

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

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          error: {
            code: 'NO_SESSION',
            message: 'You must be logged in to create users',
          },
        };
      }

      // Call Edge Function to create user
      const { data, error } = await supabase.functions.invoke('create-college-user', {
        body: { userData },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      if (!data.success) {
        console.error('❌ User creation failed:', data.error);
        return {
          success: false,
          error: {
            code: data.error.code || 'CREATE_ERROR',
            message: data.error.message || 'Failed to create user',
          },
        };
      }

      console.log('✅ User created successfully:', data.data);
      console.log('📧 Temporary password:', data.data.metadata?.temporary_password);

      return { success: true, data: data.data };
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
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
        .single();

      if (fetchError) throw fetchError;

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

      console.log('✅ Password reset for user:', lecturer.email);
      console.log('📧 New temporary password:', tempPassword);

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
      console.log('🔍 Fetching users with filters:', filters);
      const users: User[] = [];

      // Fetch lecturers from college_lecturers table
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
        `);

      if (filters.status) {
        lecturersQuery = lecturersQuery.eq('accountStatus', filters.status);
      }

      if (filters.department_id) {
        lecturersQuery = lecturersQuery.eq('department', filters.department_id);
      }

      const { data: lecturers, error: lecturersError } = await lecturersQuery;

      console.log('📚 Lecturers query result:', { 
        count: lecturers?.length || 0, 
        error: lecturersError 
      });

      if (lecturersError) {
        console.error('❌ Error fetching lecturers:', lecturersError);
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

      console.log('✅ Total staff users fetched:', {
        total: users.length,
        filtered: filteredUsers.length,
        byRole: {
          'College Admin': filteredUsers.filter(u => u.roles?.includes('College Admin')).length,
          'HoD': filteredUsers.filter(u => u.roles?.includes('HoD')).length,
          'Faculty': filteredUsers.filter(u => u.roles?.includes('Faculty')).length,
          'Lecturer': filteredUsers.filter(u => u.roles?.includes('Lecturer')).length,
          'Exam Cell': filteredUsers.filter(u => u.roles?.includes('Exam Cell')).length,
          'Finance Admin': filteredUsers.filter(u => u.roles?.includes('Finance Admin')).length,
        }
      });

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
