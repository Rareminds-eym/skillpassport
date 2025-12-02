import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  console.log('🚀 create-student function called');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    console.log('✅ Starting student creation process...');
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // Get request body FIRST
    const { student, userEmail, schoolId: requestSchoolId } = await req.json();
    if (!student || !student.name || !student.email || !student.contactNumber) {
      throw new Error('Missing required fields: name, email, and contactNumber are required');
    }
    // Use userEmail from request body (custom auth via localStorage)
    console.log('User email from request:', userEmail);
    if (!userEmail) {
      throw new Error('No user email provided. Please login and try again.');
    }
    // Create a simple object to represent the user
    const user = {
      email: userEmail,
      id: null // We'll get this from the database
    };
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(student.email)) {
      throw new Error('Invalid email format');
    }
    // Get the user ID and school/organization ID from the database using email
    const { data: currentUserData, error: currentUserError } = await supabaseAdmin.from('users').select('id, organizationId, role').eq('email', user.email).maybeSingle();
    if (currentUserError) {
      console.error('Error fetching current user:', currentUserError);
    }
    // Update user object with ID from database
    if (currentUserData?.id) {
      user.id = currentUserData.id;
    }
    // Use schoolId from request if provided (from localStorage)
    let schoolId = requestSchoolId || null;
    console.log('School ID from request:', schoolId);
    // If not provided, try to get from database
    if (!schoolId) {
      const organizationId = currentUserData?.organizationId || null;
      schoolId = organizationId;
      // If not found in users.organizationId, check school_educators table
      if (!schoolId) {
        console.log('No organizationId in users table, checking school_educators...');
        const { data: educatorData } = await supabaseAdmin.from('school_educators').select('school_id').eq('email', user.email).maybeSingle();
        schoolId = educatorData?.school_id || null;
        console.log('School ID from school_educators:', schoolId);
      }
      // If still not found, check schools table
      if (!schoolId) {
        console.log('Not found in school_educators, checking schools table...');
        const { data: schoolData } = await supabaseAdmin.from('schools').select('id').or(`email.eq.${user.email},principal_email.eq.${user.email}`).maybeSingle();
        schoolId = schoolData?.id || null;
        console.log('School ID from schools table:', schoolId);
      }
    }
    if (!schoolId) {
      throw new Error('School ID not found. Please ensure you are logged in as a school admin.');
    }
    
    // Validate that the school exists
    console.log('Validating school_id:', schoolId);
    const { data: schoolExists, error: schoolCheckError } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('id', schoolId)
      .maybeSingle();
    
    if (schoolCheckError) {
      console.error('Error checking school:', schoolCheckError);
      throw new Error(`Failed to validate school: ${schoolCheckError.message}`);
    }
    
    if (!schoolExists) {
      throw new Error(`School with ID ${schoolId} does not exist. Please contact your administrator.`);
    }
    
    console.log('✅ School validated. Creating student for school_id:', schoolId);
    // Generate a random password for the student
    const generatePassword = ()=>{
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
      let password = '';
      for(let i = 0; i < 12; i++){
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    const studentPassword = generatePassword();
    // Check if email already exists in auth.users
    console.log('Checking for existing auth user...');
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingAuthUser?.users?.some((u)=>u.email === student.email.toLowerCase());
    if (emailExists) {
      console.log('❌ Email already exists in auth.users');
      return new Response(JSON.stringify({
        success: false,
        error: `Student with email ${student.email} already exists. Please use a different email.`
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // Check if email exists in public.users
    console.log('Checking for existing user...');
    const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', student.email.toLowerCase()).maybeSingle();
    if (existingUser) {
      console.log('❌ Email already exists in public.users');
      return new Response(JSON.stringify({
        success: false,
        error: `Student with email ${student.email} already exists. Please use a different email.`
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // Check if email exists in students table
    console.log('Checking for existing student...');
    const { data: existingStudent } = await supabaseAdmin.from('students').select('id').eq('email', student.email.toLowerCase()).maybeSingle();
    if (existingStudent) {
      console.log('❌ Email already exists in students table');
      return new Response(JSON.stringify({
        success: false,
        error: `Student with email ${student.email} already exists. Please use a different email.`
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    console.log('Creating student:', student.name, student.email);
    // STEP 1: Create auth.users record
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: student.email.toLowerCase(),
      password: studentPassword,
      email_confirm: true,
      user_metadata: {
        name: student.name,
        role: 'school_student',
        phone: student.contactNumber,
        password: studentPassword, // Store password in metadata for CSV imports
        added_by: user.id,
        added_at: new Date().toISOString()
      }
    });
    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError);
      throw new Error(`Failed to create authentication account: ${authError?.message || 'Unknown error'}`);
    }
    console.log('✅ Created auth.users record:', authUser.user.id);
    let publicUserId = null;
    let studentId = null;
    try {
      // STEP 2: Create public.users record
      const nameParts = student.name.trim().split(' ');
      const firstName = nameParts[0] || student.name;
      const lastName = nameParts.slice(1).join(' ') || '';
      const { data: publicUser, error: publicUserError } = await supabaseAdmin.from('users').insert({
        id: authUser.user.id,
        email: student.email.toLowerCase(),
        firstName: firstName,
        lastName: lastName,
        role: 'school_student',
        organizationId: schoolId,
        isActive: true,
        metadata: {
          source: 'school_admin_added',
          schoolId: schoolId,
          addedBy: user.id,
          addedByEmail: user.email,
          addedAt: new Date().toISOString(),
          contactNumber: student.contactNumber,
          enrollmentNumber: student.enrollmentNumber || null,
          password: studentPassword // Store password in metadata for CSV imports
        }
      }).select().single();
      if (publicUserError) {
        console.error('Error creating public.users record:', publicUserError);
        throw new Error(`Failed to create user record: ${publicUserError.message}`);
      }
      publicUserId = publicUser.id;
      console.log('✅ Created public.users record:', publicUserId);
      // STEP 3: Create public.students record
      // Calculate age from dateOfBirth if provided
      let age: number | null = null;
      if (student.dateOfBirth) {
        const birthDate = new Date(student.dateOfBirth);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        age = calculatedAge;
      }

      // Insert into actual columns, not profile JSONB
      const { data: studentRecord, error: studentError } = await supabaseAdmin.from('students').insert({
        id: authUser.user.id,
        user_id: authUser.user.id,
        email: student.email.toLowerCase(),
        name: student.name,
        contactNumber: student.contactNumber || null,
        contact_number: student.contactNumber || null, // Also set snake_case version
        alternate_number: student.alternateNumber || null,
        dateOfBirth: student.dateOfBirth || null,
        date_of_birth: student.dateOfBirth || null, // Also set snake_case version
        age: age,
        gender: student.gender || null,
        enrollmentNumber: student.enrollmentNumber || null,
        registration_number: student.registrationNumber || null,
        roll_number: student.rollNumber || null,
        admission_number: student.admissionNumber || null,
        grade: student.grade || null,
        section: student.section || null,
        school_class_id: student.schoolClassId || null,
        guardianName: student.guardianName || null,
        guardianPhone: student.guardianPhone || null,
        guardianEmail: student.guardianEmail || null,
        guardianRelation: student.guardianRelation || 'Parent',
        bloodGroup: student.bloodGroup || null,
        profilePicture: student.profilePicture || null,
        address: student.address || null,
        city: student.city || null,
        state: student.state || null,
        country: student.country || 'India',
        pincode: student.pincode || null,
        district_name: student.district || student.districtName || null,
        university: student.university || null,
        university_main: student.university || null,
        college_school_name: student.collegeSchoolName || null,
        school_id: schoolId,
        student_type: student.student_type || 'school_student',
        approval_status: student.approval_status || 'approved',
        universityId: null,
        metadata: {
          source: 'school_admin_added',
          addedBy: user.id,
          addedByEmail: user.email,
          addedAt: new Date().toISOString(),
          password: studentPassword // Store password in metadata for CSV imports
        }
      }).select().single();
      if (studentError) {
        console.error('Error creating students record:', studentError);
        throw new Error(`Failed to create student profile: ${studentError.message}`);
      }
      studentId = studentRecord.id;
      console.log('✅ Created public.students record:', studentId);
      // Success! Return the created student data
      return new Response(JSON.stringify({
        success: true,
        message: `Student ${student.name} created successfully`,
        data: {
          authUserId: authUser.user.id,
          publicUserId: publicUserId,
          studentId: studentId,
          email: student.email,
          name: student.name,
          password: studentPassword,
          loginUrl: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/auth/login`
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    } catch (error) {
      // Rollback: Delete auth user if public.users or students creation failed
      console.error('Error in student creation, rolling back auth user:', error);
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        console.log('✅ Rolled back auth.users record');
      } catch (rollbackError) {
        console.error('Failed to rollback auth user:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error in create-student function:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    const errorResponse = {
      success: false,
      error: error?.message || 'An unexpected error occurred',
      details: error?.toString() || 'Unknown error',
      errorName: error?.name || 'Unknown',
      stack: error?.stack || 'No stack trace'
    };
    console.error('Sending error response:', JSON.stringify(errorResponse, null, 2));
    return new Response(JSON.stringify(errorResponse), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
