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
   */
  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      console.log('🆕 Creating user:', userData);

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

      // Check for duplicate email in students table
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('email', userData.email)
        .maybeSingle();

      if (existingStudent) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'A student with this email already exists',
            field: 'email',
          },
        };
      }

      // Check for duplicate email in college_lecturers metadata
      const { data: existingLecturer } = await supabase
        .from('college_lecturers')
        .select('id')
        .eq('metadata->>email', userData.email)
        .maybeSingle();

      if (existingLecturer) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'A lecturer with this email already exists',
            field: 'email',
          },
        };
      }

      // Step 1: Create user in auth.users (Supabase Auth)
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: userData.name,
          name: userData.name,
          roles: userData.roles,
        },
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      if (!authUser.user) {
        throw new Error('No user returned from auth creation');
      }

      const userId = authUser.user.id;

      // Step 2: Create user in public.users table
      const { data: publicUser, error: publicUserError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: userData.email,
          full_name: userData.name,
          name: userData.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (publicUserError) {
        console.error('Public user creation error:', publicUserError);
        // Rollback: delete auth user
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Failed to create user record: ${publicUserError.message}`);
      }

      // Step 3: Create role-specific record
      const isStaff = userData.roles.some(role => 
        ['College Admin', 'HoD', 'Faculty', 'Exam Cell', 'Finance Admin', 'Placement Officer', 'Lecturer'].includes(role)
      );

      if (isStaff) {
        // Create in college_lecturers table
        // Get college ID from current user context
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        let collegeId = null;

        if (currentUser?.email) {
          const { data: collegeData } = await supabase
            .from('colleges')
            .select('id')
            .or(`email.eq.${currentUser.email},admin_email.eq.${currentUser.email}`)
            .maybeSingle();

          collegeId = collegeData?.id;
        }

        if (!collegeId) {
          console.warn('No college ID found, using first available college');
          const { data: firstCollege } = await supabase
            .from('colleges')
            .select('id')
            .limit(1)
            .single();
          
          collegeId = firstCollege?.id;
        }

        const { error: lecturerError } = await supabase
          .from('college_lecturers')
          .insert([{
            userId: userId,
            user_id: userId,
            collegeId: collegeId,
            employeeId: userData.employee_id || null,
            department: userData.department_id || null,
            accountStatus: userData.status || 'active',
            metadata: {
              first_name: userData.name.split(' ')[0],
              last_name: userData.name.split(' ').slice(1).join(' '),
              email: userData.email,
              role: userData.roles[0].toLowerCase().replace(' ', '_'),
              temporary_password: tempPassword,
              password_created_at: new Date().toISOString(),
              created_by: currentUser?.email,
            },
          }]);

        if (lecturerError) {
          console.error('Lecturer creation error:', lecturerError);
          // Rollback
          await supabase.auth.admin.deleteUser(userId);
          await supabase.from('users').delete().eq('id', userId);
          throw new Error(`Failed to create lecturer record: ${lecturerError.message}`);
        }
      }

      // Return the created user
      const createdUser: User = {
        id: userId,
        name: userData.name,
        email: userData.email,
        roles: userData.roles,
        employee_id: userData.employee_id,
        student_id: userData.student_id,
        department_id: userData.department_id,
        status: userData.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('✅ User created successfully:', createdUser);

      return { success: true, data: createdUser };
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
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
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
        .from('users')
        .update({ status: 'inactive' })
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
      // Get user email
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);

      if (error) throw error;

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
          userId,
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
          metadata
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
          .map(l => l.userId || l.user_id)
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
          const userId = lecturer.userId || lecturer.user_id;
          const userData = userId ? usersMap[userId] : null;
          const metadata = lecturer.metadata || {};
          
          // Get name from metadata or users table
          const firstName = metadata.first_name || '';
          const lastName = metadata.last_name || '';
          const fullName = firstName && lastName 
            ? `${firstName} ${lastName}` 
            : userData?.full_name || userData?.name || lecturer.employeeId || 'Unknown';
          
          // Get email from metadata or users table
          const email = metadata.email || userData?.email || `lecturer-${lecturer.id}@unknown.com`;
          
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
