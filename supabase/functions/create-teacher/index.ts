import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubjectExpertise {
  name: string
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  years_experience: number
}

interface TeacherData {
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  date_of_birth?: string
  address?: string
  qualification?: string
  role: 'school_admin' | 'principal' | 'it_admin' | 'class_teacher' | 'subject_teacher'
  subject_expertise?: SubjectExpertise[]
  degree_certificate_url?: string
  id_proof_url?: string
  experience_letters_url?: string[]
  onboarding_status?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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
    )

    // Create regular client for user context
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the current user (school admin)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Unauthorized: Please login to add teachers')
    }

    // Get request body
    const { teacher } = await req.json() as { teacher: TeacherData }

    if (!teacher || !teacher.first_name || !teacher.last_name || !teacher.email) {
      throw new Error('Missing required fields: first_name, last_name, and email are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(teacher.email)) {
      throw new Error('Invalid email format')
    }

    // Get the school ID from the current user
    const { data: currentUserData, error: currentUserError } = await supabaseAdmin
      .from('users')
      .select('organizationId, role, entity_type')
      .eq('id', user.id)
      .single()

    if (currentUserError) {
      console.error('Error fetching current user:', currentUserError)
    }

    let schoolId = currentUserData?.organizationId || null

    // If not found in users.organizationId, check school_educators table
    if (!schoolId) {
      const { data: educatorData } = await supabaseAdmin
        .from('school_educators')
        .select('school_id')
        .eq('email', user.email)
        .maybeSingle()

      schoolId = educatorData?.school_id || null
    }

    // If still not found, check schools table
    if (!schoolId) {
      const { data: schoolData } = await supabaseAdmin
        .from('schools')
        .select('id')
        .or(`email.eq.${user.email},principal_email.eq.${user.email}`)
        .maybeSingle()

      schoolId = schoolData?.id || null
    }

    if (!schoolId) {
      throw new Error('School ID not found. Please ensure you are logged in as a school admin.')
    }

    console.log('Creating teacher for school:', schoolId)

    // Generate a random password for the teacher
    const generatePassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
      let password = ''
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return password
    }

    const teacherPassword = generatePassword()

    // Check if email already exists in auth.users
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingAuthUser?.users?.some(u => u.email === teacher.email.toLowerCase())

    if (emailExists) {
      throw new Error(`A user with email ${teacher.email} already exists`)
    }

    // Check if email exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', teacher.email.toLowerCase())
      .maybeSingle()

    if (existingUser) {
      throw new Error(`A user with email ${teacher.email} already exists in the system`)
    }

    // Check if email exists in school_educators table
    const { data: existingTeacher } = await supabaseAdmin
      .from('school_educators')
      .select('teacher_id')
      .eq('email', teacher.email.toLowerCase())
      .maybeSingle()

    if (existingTeacher) {
      throw new Error(`A teacher with email ${teacher.email} already exists`)
    }

    console.log('Creating teacher:', teacher.first_name, teacher.last_name, teacher.email)

    // STEP 1: Create auth.users record
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: teacher.email.toLowerCase(),
      password: teacherPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        role: 'educator',
        school_id: schoolId,
        added_by: user.id,
        added_at: new Date().toISOString()
      }
    })

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError)
      throw new Error(`Failed to create authentication account: ${authError?.message || 'Unknown error'}`)
    }

    console.log('✅ Created auth.users record:', authUser.user.id)

    let publicUserId: string | null = null
    let teacherId: string | null = null

    try {
      // STEP 2: Create public.users record
      const { data: publicUser, error: publicUserError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id, // Use same ID as auth.users
          email: teacher.email.toLowerCase(),
          firstName: teacher.first_name,
          lastName: teacher.last_name,
          role: 'educator',
          organizationId: schoolId,
          isActive: true,
          entity_type: 'educator',
          metadata: {
            source: 'school_admin_added',
            schoolId: schoolId,
            addedBy: user.id,
            addedByEmail: user.email,
            addedAt: new Date().toISOString(),
            teacherRole: teacher.role,
            phone: teacher.phone_number || null
          }
        })
        .select()
        .single()

      if (publicUserError) {
        console.error('Error creating public.users record:', publicUserError)
        throw new Error(`Failed to create user record: ${publicUserError.message}`)
      }

      publicUserId = publicUser.id
      console.log('✅ Created public.users record:', publicUserId)

      // STEP 3: Create public.school_educators record
      const { data: teacherRecord, error: teacherError } = await supabaseAdmin
        .from('school_educators')
        .insert({
          user_id: authUser.user.id, // Link to auth.users
          school_id: schoolId,
          email: teacher.email.toLowerCase(),
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          phone_number: teacher.phone_number || null,
          dob: teacher.date_of_birth || null,
          address: teacher.address || null,
          qualification: teacher.qualification || null,
          role: teacher.role,
          subject_expertise: teacher.subject_expertise || [],
          onboarding_status: teacher.onboarding_status || 'active',
          degree_certificate_url: teacher.degree_certificate_url || null,
          id_proof_url: teacher.id_proof_url || null,
          experience_letters_url: teacher.experience_letters_url || null,
          metadata: {
            temporary_password: teacherPassword,
            password_created_at: new Date().toISOString(),
            created_by: user.id,
            created_by_email: user.email,
            source: 'school_admin_added'
          }
        })
        .select()
        .single()

      if (teacherError) {
        console.error('Error creating school_educators record:', teacherError)
        throw new Error(`Failed to create teacher profile: ${teacherError.message}`)
      }

      teacherId = teacherRecord.teacher_id
      console.log('✅ Created public.school_educators record:', teacherId)

      // Success! Return the created teacher data
      return new Response(
        JSON.stringify({
          success: true,
          message: `Teacher ${teacher.first_name} ${teacher.last_name} created successfully`,
          data: {
            authUserId: authUser.user.id,
            publicUserId: publicUserId,
            teacherId: teacherId,
            email: teacher.email,
            name: `${teacher.first_name} ${teacher.last_name}`,
            password: teacherPassword, // Return password so admin can share with teacher
            role: teacher.role,
            loginUrl: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/auth/login`
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )

    } catch (error) {
      // Rollback: Delete auth user if public.users or school_educators creation failed
      console.error('Error in teacher creation, rolling back auth user:', error)
      
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        console.log('✅ Rolled back auth.users record')
      } catch (rollbackError) {
        console.error('Failed to rollback auth user:', rollbackError)
      }

      throw error
    }

  } catch (error) {
    console.error('Error in create-teacher function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
