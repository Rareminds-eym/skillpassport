import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
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

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const { userData } = await req.json()

    console.log('Creating user:', userData)

    // Validate required fields
    if (!userData.email || !userData.name || !userData.roles || userData.roles.length === 0) {
      throw new Error('Missing required fields: email, name, and roles')
    }

    // Check for duplicate email in college_lecturers
    const { data: existingLecturer } = await supabaseAdmin
      .from('college_lecturers')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle()

    if (existingLecturer) {
      throw new Error('A user with this email already exists')
    }

    // Get college ID from current user
    let collegeId = null

    // Try college_lecturers first
    const { data: lecturerData } = await supabaseAdmin
      .from('college_lecturers')
      .select('collegeId')
      .eq('email', user.email)
      .maybeSingle()

    if (lecturerData?.collegeId) {
      collegeId = lecturerData.collegeId
    } else {
      // Try colleges table
      const { data: collegeData } = await supabaseAdmin
        .from('colleges')
        .select('id')
        .or(`email.eq.${user.email},deanEmail.eq.${user.email}`)
        .maybeSingle()

      if (collegeData?.id) {
        collegeId = collegeData.id
      } else {
        // Use first available college
        const { data: firstCollege } = await supabaseAdmin
          .from('colleges')
          .select('id')
          .limit(1)
          .maybeSingle()

        collegeId = firstCollege?.id
      }
    }

    if (!collegeId) {
      throw new Error('Could not determine college ID')
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 
                        Math.random().toString(36).slice(-8).toUpperCase()

    // Step 1: Create auth user
    const { data: authUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: userData.name,
        name: userData.name,
        roles: userData.roles,
      },
    })

    if (authCreateError || !authUser.user) {
      console.error('Auth creation error:', authCreateError)
      throw new Error(`Failed to create auth user: ${authCreateError?.message}`)
    }

    const userId = authUser.user.id

    // Step 2: Create user in public.users table
    const { error: publicUserError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: userId,
        email: userData.email,
        full_name: userData.name,
        name: userData.name,
      }])

    if (publicUserError) {
      console.error('Public user creation error:', publicUserError)
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create user record: ${publicUserError.message}`)
    }

    // Step 3: Create college_lecturers record
    const nameParts = userData.name.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    const { error: lecturerError } = await supabaseAdmin
      .from('college_lecturers')
      .insert([{
        user_id: userId,
        collegeId: collegeId,
        employeeId: userData.employee_id || null,
        department: userData.department_id || null,
        accountStatus: userData.status || 'active',
        first_name: firstName,
        last_name: lastName,
        email: userData.email,
        temporary_password: tempPassword,
        password_created_at: new Date().toISOString(),
        verification_status: 'pending',
        metadata: {
          role: userData.roles[0].toLowerCase().replace(/ /g, '_'),
          roles: userData.roles,
          created_by_email: user.email,
        },
      }])

    if (lecturerError) {
      console.error('Lecturer creation error:', lecturerError)
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await supabaseAdmin.from('users').delete().eq('id', userId)
      throw new Error(`Failed to create lecturer record: ${lecturerError.message}`)
    }

    // Return success with temporary password
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: userId,
          name: userData.name,
          email: userData.email,
          roles: userData.roles,
          employee_id: userData.employee_id,
          department_id: userData.department_id,
          status: userData.status || 'active',
          metadata: {
            temporary_password: tempPassword,
          },
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create user',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
