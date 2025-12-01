import { supabase } from '../lib/supabaseClient';

/**
 * Admin Authentication Service
 * Handles authentication for school/college/university admins using Supabase Auth
 */

/**
 * Login admin (school/college/university) with Supabase Auth
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<{success: boolean, admin: object|null, session: object|null, error: string|null}>}
 */
export const loginAdmin = async (email, password) => {
  try {
    // Validate inputs
    if (!email || !password) {
      return { success: false, admin: null, session: null, error: 'Email and password are required.' };
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
        admin: null, 
        session: null, 
        error: authError.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.' 
          : authError.message 
      };
    }

    if (!authData.user) {
      return { success: false, admin: null, session: null, error: 'Authentication failed. Please try again.' };
    }

    // Step 2: Check user role from metadata
    const userRole = authData.user.user_metadata?.role || authData.user.raw_user_meta_data?.role;
    
    // Step 3: Check user role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userError) {
      console.error('❌ Database error fetching user:', userError);
    }

    // Get effective role from metadata or users table
    const effectiveRole = userRole || userData?.role;

    // Step 4: Fetch admin profile from schools table (using created_by or email match)
    // Use .limit(1) to handle multiple matches gracefully
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .or(`created_by.eq.${authData.user.id},email.eq.${authData.user.email}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (schoolError && schoolError.code !== 'PGRST116') {
      console.error('❌ Database error:', schoolError);
    }

    const school = schools?.[0];

    if (school) {
      // Check if the school is approved
      if (school.approval_status === 'approved') {
        // Check account status - allow active, pending, or approved
        if (school.account_status === 'inactive' || school.account_status === 'suspended') {
          await supabase.auth.signOut();
          return { success: false, admin: null, session: null, error: 'Your school account is inactive. Please contact RareMinds admin.' };
        }

        return {
          success: true,
          admin: {
            id: school.id,
            user_id: authData.user.id,
            name: school.principal_name || school.name,
            email: school.email,
            role: 'school_admin',
            schoolId: school.id,
            schoolName: school.name,
            schoolCode: school.code,
          },
          session: authData.session,
          error: null
        };
      }
      
      // School exists but not approved - check if user has admin role in users table
      // If they have the role, allow login without requiring school approval
      if (effectiveRole === 'school_admin') {
        return {
          success: true,
          admin: {
            id: authData.user.id,
            user_id: authData.user.id,
            name: userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : school.principal_name || school.name || authData.user.email,
            email: authData.user.email,
            role: 'school_admin',
            schoolId: school.id,
            schoolName: school.name,
          },
          session: authData.session,
          error: null
        };
      }
      
      // No admin role in users table, reject with approval message
      await supabase.auth.signOut();
      const statusMessage = school.approval_status === 'pending'
        ? 'Your school registration is pending approval. Please contact RareMinds admin.'
        : school.approval_status === 'rejected'
        ? `Your school registration was rejected. Reason: ${school.rejection_reason || 'Not specified'}. Please contact RareMinds admin.`
        : 'Your school account is not approved. Please contact RareMinds admin.';
      
      return { success: false, admin: null, session: null, error: statusMessage };
    }

    // Step 5: Check colleges table for college admin
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('*')
      .or(`created_by.eq.${authData.user.id},email.eq.${authData.user.email}`)
      .maybeSingle();

    if (collegeError && collegeError.code !== 'PGRST116') {
      console.error('❌ Database error:', collegeError);
    }

    if (college) {
      return {
        success: true,
        admin: {
          id: college.id,
          user_id: authData.user.id,
          name: college.name,
          email: college.email || authData.user.email,
          role: 'college_admin',
          collegeId: college.id,
          collegeName: college.name,
        },
        session: authData.session,
        error: null
      };
    }

    // Step 6: Check universities table for university admin
    const { data: university, error: universityError } = await supabase
      .from('universities')
      .select('*')
      .or(`created_by.eq.${authData.user.id},email.eq.${authData.user.email}`)
      .maybeSingle();

    if (universityError && universityError.code !== 'PGRST116') {
      console.error('❌ Database error:', universityError);
    }

    if (university) {
      return {
        success: true,
        admin: {
          id: university.id,
          user_id: authData.user.id,
          name: university.name,
          email: university.email || authData.user.email,
          role: 'university_admin',
          universityId: university.id,
          universityName: university.name,
        },
        session: authData.session,
        error: null
      };
    }

    // No admin profile found - check if user has admin role in metadata OR users table
    if (effectiveRole === 'school_admin' || effectiveRole === 'college_admin' || effectiveRole === 'university_admin') {
      return {
        success: true,
        admin: {
          id: authData.user.id,
          user_id: authData.user.id,
          name: userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : authData.user.email,
          email: authData.user.email,
          role: effectiveRole,
        },
        session: authData.session,
        error: null
      };
    }

    // No admin profile found
    await supabase.auth.signOut();
    return { 
      success: false, 
      admin: null, 
      session: null, 
      error: 'No admin account found. Please check if you are using the correct login portal.' 
    };

  } catch (err) {
    console.error('❌ Unexpected login error:', err);
    return { success: false, admin: null, session: null, error: err.message || 'Login failed' };
  }
};

/**
 * Get current admin profile
 * @returns {Promise<{success: boolean, admin: object|null, error: string|null}>}
 */
export const getCurrentAdmin = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, admin: null, error: 'Not authenticated' };
    }

    // Check schools table
    const { data: school } = await supabase
      .from('schools')
      .select('*')
      .or(`created_by.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    if (school) {
      return {
        success: true,
        admin: {
          id: school.id,
          user_id: user.id,
          name: school.principal_name || school.name,
          email: school.email,
          role: 'school_admin',
          schoolId: school.id,
          schoolName: school.name,
          schoolCode: school.code,
        },
        error: null
      };
    }

    // Check colleges table
    const { data: college } = await supabase
      .from('colleges')
      .select('*')
      .or(`created_by.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    if (college) {
      return {
        success: true,
        admin: {
          id: college.id,
          user_id: user.id,
          name: college.name,
          email: college.email || user.email,
          role: 'college_admin',
          collegeId: college.id,
          collegeName: college.name,
        },
        error: null
      };
    }

    // Check universities table
    const { data: university } = await supabase
      .from('universities')
      .select('*')
      .or(`created_by.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    if (university) {
      return {
        success: true,
        admin: {
          id: university.id,
          user_id: user.id,
          name: university.name,
          email: university.email || user.email,
          role: 'university_admin',
          universityId: university.id,
          universityName: university.name,
        },
        error: null
      };
    }

    return { success: false, admin: null, error: 'Admin profile not found' };

  } catch (error) {
    console.error('❌ Error fetching current admin:', error);
    return { success: false, admin: null, error: error.message };
  }
};

/**
 * Sign out admin
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const logoutAdmin = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
