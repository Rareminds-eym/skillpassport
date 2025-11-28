import { supabase } from '../lib/supabaseClient';

/**
 * Student Authentication Service
 * Handles authentication for students using Supabase Auth
 */

/**
 * Authenticate student with email and password using Supabase Auth
 * @param {string} email - Student email
 * @param {string} password - Student password
 * @returns {Promise<{success: boolean, student: object|null, session: object|null, error: string|null}>}
 */
export const loginStudent = async (email, password) => {
  try {
    // Validate inputs
    if (!email || !password) {
      return { success: false, student: null, session: null, error: 'Email and password are required.' };
    }

    // Step 1: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      return { 
        success: false, 
        student: null, 
        session: null, 
        error: authError.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.' 
          : authError.message 
      };
    }

    if (!authData.user) {
      return { success: false, student: null, session: null, error: 'Authentication failed. Please try again.' };
    }

    // Step 2: Fetch student profile from students table
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        user_id,
        email,
        name,
        approval_status,
        school_id,
        university_college_id,
        profile,
        schools:school_id (
          id,
          name,
          code,
          approval_status
        ),
        university_colleges:university_college_id (
          id,
          name
        )
      `)
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (studentError) {
      console.error('❌ Database error:', studentError);
      // Sign out since we couldn't get the student profile
      await supabase.auth.signOut();
      return { success: false, student: null, session: null, error: 'Error fetching student profile.' };
    }

    if (!student) {
      // User exists in auth but not in students table - might be wrong role
      await supabase.auth.signOut();
      return { success: false, student: null, session: null, error: 'No student account found. Please check if you are using the correct login portal.' };
    }

    // Success: return student and session
    return { 
      success: true, 
      student, 
      session: authData.session, 
      error: null 
    };
  } catch (err) {
    console.error('❌ Unexpected login error:', err);
    return { success: false, student: null, session: null, error: err.message || 'Login failed' };
  }
};

/**
 * Sign up a new student
 * @param {object} studentData - Student registration data
 * @returns {Promise<{success: boolean, student: object|null, user: object|null, error: string|null}>}
 */
export const signupStudent = async (studentData) => {
  try {
    const { email, password, name, school_id, university_college_id, ...additionalData } = studentData;

    // Validate required fields
    if (!email || !password) {
      return {
        success: false,
        student: null,
        user: null,
        error: 'Email and password are required.'
      };
    }

    // Ensure student has either school_id or university_college_id (not both)
    if (school_id && university_college_id) {
      return {
        success: false,
        student: null,
        user: null,
        error: 'Student can only be associated with either a school or a university college, not both.'
      };
    }

    if (!school_id && !university_college_id) {
      return {
        success: false,
        student: null,
        user: null,
        error: 'Student must be associated with either a school or a university college.'
      };
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
          role: 'student'
        }
      }
    });

    if (authError) {
      console.error('❌ Signup auth error:', authError);
      return {
        success: false,
        student: null,
        user: null,
        error: authError.message || 'Failed to create account.'
      };
    }

    if (!authData.user) {
      return {
        success: false,
        student: null,
        user: null,
        error: 'Failed to create user account.'
      };
    }

    // Step 2: Create student record in students table
    const studentRecord = {
      user_id: authData.user.id,
      email: email,
      name: name || '',
      school_id: school_id || null,
      university_college_id: university_college_id || null,
      approval_status: 'pending',
      profile: {
        name: name || '',
        ...additionalData
      },
      ...additionalData
    };

    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert([studentRecord])
      .select()
      .single();

    if (studentError) {
      console.error('❌ Student record creation error:', studentError);
      
      // Cleanup: delete auth user if student record creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return {
        success: false,
        student: null,
        user: null,
        error: 'Failed to create student profile. Please try again.'
      };
    }

    return {
      success: true,
      student: newStudent,
      user: authData.user,
      error: null,
      message: 'Account created successfully. Please wait for approval from your institution.'
    };

  } catch (error) {
    console.error('❌ Unexpected signup error:', error);
    return {
      success: false,
      student: null,
      user: null,
      error: error.message || 'An unexpected error occurred during signup.'
    };
  }
};

/**
 * Get current authenticated student
 * @returns {Promise<{success: boolean, student: object|null, error: string|null}>}
 */
export const getCurrentStudent = async () => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        student: null,
        error: 'Not authenticated'
      };
    }

    // Fetch student profile
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        schools:school_id (
          id,
          name,
          code
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (studentError || !studentData) {
      return {
        success: false,
        student: null,
        error: 'Student profile not found'
      };
    }

    return {
      success: true,
      student: studentData,
      error: null
    };

  } catch (error) {
    console.error('❌ Error fetching current student:', error);
    return {
      success: false,
      student: null,
      error: error.message
    };
  }
};

/**
 * Get student by email (for validation)
 * @param {string} email - Student email
 * @returns {Promise<{success: boolean, student: object|null, error: string|null}>}
 */
export const getStudentByEmail = async (email) => {
  try {
    const { data: studentData, error } = await supabase
      .from('students')
      .select(`
        *,
        schools:school_id (
          id,
          name,
          code
        )
      `)
      .eq('email', email)
      .single();

    if (error || !studentData) {
      return {
        success: false,
        student: null,
        error: 'Student not found'
      };
    }

    return {
      success: true,
      student: studentData,
      error: null
    };

  } catch (error) {
    return {
      success: false,
      student: null,
      error: error.message
    };
  }
};

/**
 * Get students by school_id
 * @param {string} schoolId - School ID
 * @returns {Promise<{success: boolean, students: array, error: string|null}>}
 */
export const getStudentsBySchool = async (schoolId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', schoolId)
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        students: [],
        error: error.message
      };
    }

    return {
      success: true,
      students: data || [],
      error: null
    };

  } catch (error) {
    return {
      success: false,
      students: [],
      error: error.message
    };
  }
};

/**
 * Get students by university_college_id
 * @param {string} universityCollegeId - University College ID
 * @returns {Promise<{success: boolean, students: array, error: string|null}>}
 */
export const getStudentsByUniversityCollege = async (universityCollegeId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('university_college_id', universityCollegeId)
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        students: [],
        error: error.message
      };
    }

    return {
      success: true,
      students: data || [],
      error: null
    };

  } catch (error) {
    return {
      success: false,
      students: [],
      error: error.message
    };
  }
};

/**
 * Update student profile
 * @param {string} studentId - Student ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, student: object|null, error: string|null}>}
 */
export const updateStudentProfile = async (studentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        student: null,
        error: error.message
      };
    }

    return {
      success: true,
      student: data,
      error: null
    };

  } catch (error) {
    return {
      success: false,
      student: null,
      error: error.message
    };
  }
};

/**
 * Sign out student
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const logoutStudent = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      error: null
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Validate student credentials (for custom validation)
 * @param {string} email - Student email
 * @param {string} schoolId - School ID (optional)
 * @param {string} universityCollegeId - University College ID (optional)
 * @returns {Promise<{success: boolean, valid: boolean, student: object|null, error: string|null}>}
 */
export const validateStudentCredentials = async (email, schoolId = null, universityCollegeId = null) => {
  try {
    let query = supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .eq('approval_status', 'approved');

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    if (universityCollegeId) {
      query = query.eq('university_college_id', universityCollegeId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return {
        success: false,
        valid: false,
        student: null,
        error: 'Invalid credentials or student not found'
      };
    }

    return {
      success: true,
      valid: true,
      student: data,
      error: null
    };

  } catch (error) {
    return {
      success: false,
      valid: false,
      student: null,
      error: error.message
    };
  }
};
