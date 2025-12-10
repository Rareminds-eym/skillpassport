import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  console.log('🚀 create-student function called');
  console.log('Method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('✅ Starting student creation process...');

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get request body
    const { student, userEmail, schoolId: requestSchoolId, collegeId: requestCollegeId } = await req.json();

    if (!student || !student.name || !student.email || !student.contactNumber) {
      throw new Error('Missing required fields: name, email, and contactNumber are required');
    }

    console.log('User email from request:', userEmail);
    console.log('School ID from request:', requestSchoolId);
    console.log('College ID from request:', requestCollegeId);

    if (!userEmail) {
      throw new Error('No user email provided. Please login and try again.');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(student.email)) {
      throw new Error('Invalid email format');
    }

    // Get the user ID from the database
    const { data: currentUserData, error: currentUserError } = await supabaseAdmin
      .from('users')
      .select('id, organizationId, role')
      .eq('email', userEmail)
      .maybeSingle();

    if (currentUserError) {
      console.error('Error fetching current user:', currentUserError);
    }

    const userId = currentUserData?.id || null;
    const userRole = currentUserData?.role || null;

    // Determine if this is a school or college student
    let schoolId = requestSchoolId || null;
    let collegeId = requestCollegeId || null;
    let institutionType = null;

    // Use collegeId if provided (college admin)
    if (collegeId) {
      institutionType = 'college';
      console.log('✅ College context detected, college_id:', collegeId);
    }
    // Otherwise use schoolId (school admin)
    else if (schoolId) {
      institutionType = 'school';
      console.log('✅ School context detected, school_id:', schoolId);
    }
    // If neither provided, try to determine from user data
    else {
      if (userRole === 'college_admin') {
        // Fetch college by deanEmail
        const { data: college } = await supabaseAdmin
          .from('colleges')
          .select('id')
          .ilike('deanEmail', userEmail)
          .maybeSingle();
        
        if (college?.id) {
          collegeId = college.id;
          institutionType = 'college';
          console.log('✅ Found college_id from deanEmail:', collegeId);
        }
      } else {
        // Try to get schoolId from various sources
        const organizationId = currentUserData?.organizationId || null;
        schoolId = organizationId;

        if (!schoolId) {
          const { data: educatorData } = await supabaseAdmin
            .from('school_educators')
            .select('school_id')
            .eq('email', userEmail)
            .maybeSingle();
          schoolId = educatorData?.school_id || null;
        }

        if (!schoolId) {
          const { data: schoolData } = await supabaseAdmin
            .from('schools')
            .select('id')
            .or(`email.eq.${userEmail},principal_email.eq.${userEmail}`)
            .maybeSingle();
          schoolId = schoolData?.id || null;
        }

        if (schoolId) {
          institutionType = 'school';
          console.log('✅ Found school_id:', schoolId);
        }
      }
    }

    if (!schoolId && !collegeId) {
      throw new Error('School/College ID not found. Please ensure you are logged in as a school or college admin.');
    }

    // Validate that the institution exists
    if (institutionType === 'college') {
      console.log('Validating college_id:', collegeId);
      const { data: collegeExists, error: collegeCheckError } = await supabaseAdmin
        .from('colleges')
        .select('id')
        .eq('id', collegeId)
        .maybeSingle();

      if (collegeCheckError) {
        console.error('Error checking college:', collegeCheckError);
        throw new Error(`Failed to validate college: ${collegeCheckError.message}`);
      }

      if (!collegeExists) {
        throw new Error(`College with ID ${collegeId} does not exist. Please contact your administrator.`);
      }

      console.log('✅ College validated. Creating student for college_id:', collegeId);
    } else {
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
    }

    // Generate a random password
    const generatePassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    const studentPassword = generatePassword();

    // Check if email already exists
    console.log('Checking for existing auth user...');
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingAuthUser?.users?.some((u) => u.email === student.email.toLowerCase());

    if (emailExists) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Student with email ${student.email} already exists. Please use a different email.`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Check if email exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', student.email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Student with email ${student.email} already exists. Please use a different email.`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Check if email exists in students table
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', student.email.toLowerCase())
      .maybeSingle();

    if (existingStudent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Student with email ${student.email} already exists. Please use a different email.`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Creating student:', student.name, student.email);

    // Determine student role based on institution type
    const studentRole = institutionType === 'college' ? 'college_student' : 'school_student';

    // STEP 1: Create auth.users record
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: student.email.toLowerCase(),
      password: studentPassword,
      email_confirm: true,
      user_metadata: {
        name: student.name,
        role: studentRole,
        phone: student.contactNumber,
        password: studentPassword,
        added_by: userId,
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

      const { data: publicUser, error: publicUserError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          email: student.email.toLowerCase(),
          firstName: firstName,
          lastName: lastName,
          role: studentRole,
          organizationId: schoolId || collegeId,
          isActive: true,
          metadata: {
            source: institutionType === 'college' ? 'college_admin_added' : 'school_admin_added',
            schoolId: schoolId,
            collegeId: collegeId,
            addedBy: userId,
            addedByEmail: userEmail,
            addedAt: new Date().toISOString(),
            contactNumber: student.contactNumber,
            enrollmentNumber: student.enrollmentNumber || null,
            password: studentPassword
          }
        })
        .select()
        .single();

      if (publicUserError) {
        console.error('Error creating public.users record:', publicUserError);
        throw new Error(`Failed to create user record: ${publicUserError.message}`);
      }

      publicUserId = publicUser.id;
      console.log('✅ Created public.users record:', publicUserId);

      // STEP 3: Create public.students record
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

      const { data: studentRecord, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          id: authUser.user.id,
          user_id: authUser.user.id,
          email: student.email.toLowerCase(),
          name: student.name,
          contactNumber: student.contactNumber || null,
          contact_number: student.contactNumber || null,
          alternate_number: student.alternateNumber || null,
          dateOfBirth: student.dateOfBirth || null,
          date_of_birth: student.dateOfBirth || null,
          age: age,
          gender: student.gender || null,
          enrollmentNumber: student.enrollmentNumber || null,
          registration_number: student.registrationNumber || null,
          roll_number: student.rollNumber || null,
          admission_number: student.admissionNumber || null,
          category: student.category || null,
          quota: student.quota || null,
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
          college_id: collegeId,
          student_type: institutionType === 'college' ? 'direct' : 'school_student',
          approval_status: student.approval_status || 'approved',
          universityId: null,
          metadata: {
            source: institutionType === 'college' ? 'college_admin_added' : 'school_admin_added',
            addedBy: userId,
            addedByEmail: userEmail,
            addedAt: new Date().toISOString(),
            password: studentPassword
          }
        })
        .select()
        .single();

      if (studentError) {
        console.error('Error creating students record:', studentError);
        throw new Error(`Failed to create student profile: ${studentError.message}`);
      }

      studentId = studentRecord.id;
      console.log('✅ Created public.students record:', studentId);

      // Success!
      return new Response(
        JSON.stringify({
          success: true,
          message: `Student ${student.name} created successfully`,
          data: {
            authUserId: authUser.user.id,
            publicUserId: publicUserId,
            studentId: studentId,
            email: student.email,
            name: student.name,
            password: studentPassword,
            institutionType: institutionType,
            schoolId: schoolId,
            collegeId: collegeId
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (error) {
      // Rollback: Delete auth user if creation failed
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
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'An unexpected error occurred',
        details: error?.toString() || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
