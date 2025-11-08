// Supabase Edge Function for student management
// Handles creating students with proper auth integration

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StudentData {
  name: string
  email: string
  phone?: string
  gender?: string
  country?: string
  // Add other fields as needed
}

interface BulkStudentData extends StudentData {
  alternatePhone?: string
  dateOfBirth?: string
  age?: number
  bloodGroup?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  university?: string
  college?: string
  department?: string
  registrationNumber?: string
  enrollmentNumber?: string
  enrollmentDate?: string
  expectedGraduationDate?: string
  cgpa?: number
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  guardianRelation?: string
  studentType?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client with service role key
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

    // Create regular Supabase client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action, studentData, studentsArray } = await req.json()

    if (action === 'create_single') {
      // Handle single student creation
      const result = await createSingleStudent(supabaseAdmin, supabase, studentData)
      return new Response(
        JSON.stringify(result),
        {
          status: result.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else if (action === 'create_bulk') {
      // Handle bulk student creation
      const result = await createBulkStudents(supabaseAdmin, supabase, studentsArray)
      return new Response(
        JSON.stringify(result),
        {
          status: result.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      throw new Error('Invalid action. Use "create_single" or "create_bulk"')
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function createSingleStudent(supabaseAdmin: any, supabase: any, studentData: StudentData) {
  try {
    console.log(`Starting student creation for: ${studentData.email}`)

    if (!studentData.email || !studentData.email.includes("@")) {
      return { success: false, error: "Invalid email address" }
    }

    // Check existing auth user
    console.log('Checking for existing auth user...')
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) {
      console.error('Error listing users:', listError)
      return { success: false, error: `Failed to check existing users: ${listError.message}` }
    }

    const exists = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === studentData.email.toLowerCase()
    )
    if (exists) {
      console.log('User already exists in auth.users')
      return { success: false, error: "User already exists in auth.users" }
    }

    // Check if student already exists in students table
    console.log('Checking for existing student record...')
    const { data: existingStudent, error: studentCheckError } = await supabase
      .from("students")
      .select("id, email")
      .eq("email", studentData.email)
      .maybeSingle()

    if (studentCheckError) {
      console.error('Error checking existing student:', studentCheckError)
      return { success: false, error: `Failed to check existing student: ${studentCheckError.message}` }
    }

    if (existingStudent) {
      console.log('Student already exists in students table')
      return { success: false, error: "Student already exists in students table" }
    }

    // Try to create auth user, but don't fail if it doesn't work
    console.log(`Attempting to create auth user for: ${studentData.email}`)
    let userId = null
    let authUserCreated = false

    try {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: studentData.email,
        password: "TempPass123!",
        email_confirm: true,
        user_metadata: { name: studentData.name ?? "Unnamed Student" },
      })

      if (authUser && authUser.user) {
        userId = authUser.user.id
        authUserCreated = true
        console.log(`Auth user created successfully with ID: ${userId}`)
      } else {
        console.log('Auth user creation returned no user, proceeding without auth user')
      }
    } catch (authError) {
      console.log('Auth user creation failed, proceeding without auth user:', authError.message)
    }

    // Generate a UUID for the student if we don't have an auth user ID
    if (!userId) {
      userId = crypto.randomUUID()
      console.log(`Generated student ID: ${userId}`)
    }

    // Create the student record directly (bypass triggers)
    console.log('Creating student record directly...')
    const { data, error } = await supabase
      .from("students")
      .insert({
        id: userId,
        user_id: authUserCreated ? userId : null, // Only set user_id if auth user was created
        name: studentData.name,
        email: studentData.email,
        contactNumber: studentData.phone,
        gender: studentData.gender,
        country: studentData.country || "India",
        approval_status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating student record:", error)
      // If student creation fails and we created an auth user, try to clean up
      if (authUserCreated) {
        try {
          console.log('Attempting to cleanup auth user...')
          await supabaseAdmin.auth.admin.deleteUser(userId)
          console.log('Auth user cleanup successful')
        } catch (cleanupError) {
          console.error("Failed to cleanup auth user:", cleanupError)
        }
      }
      throw error
    }

    console.log('Student creation completed successfully')
    return {
      success: true,
      data: {
        ...data,
        auth_user_created: authUserCreated
      }
    }
  } catch (err: any) {
    console.error("Error adding student:", err)
    return { success: false, error: err.message }
  }
}

async function createBulkStudents(supabaseAdmin: any, supabase: any, studentsArray: BulkStudentData[]) {
  try {
    const results = {
      successful: [],
      failed: [],
    }

    // Helper functions
    const toNullIfEmpty = (value: any) => (value === "" || value === undefined || value === null) ? null : value
    const toNumberOrNull = (value: any) => {
      if (value === "" || value === undefined || value === null) return null
      const num = Number(value)
      return isNaN(num) ? null : num
    }

    // Get all existing auth users once to avoid repeated API calls
    let existingAuthUsers: any[] = []
    try {
      const { data: authUsersList } = await supabaseAdmin.auth.admin.listUsers()
      if (authUsersList && authUsersList.users) {
        existingAuthUsers = authUsersList.users
      }
    } catch (err) {
      console.log("Could not fetch existing auth users:", err)
    }

    for (const studentData of studentsArray) {
      // Check if student already exists in students table
      const { data: existingStudent } = await supabase
        .from("students")
        .select("id, email")
        .eq("email", studentData.email)
        .maybeSingle()

      if (existingStudent) {
        results.failed.push({
          email: studentData.email,
          name: studentData.name,
          reason: "Student already exists",
        })
        continue
      }

      const defaultPassword = "TempPass123!"
      let userId = null

      // Check if auth user already exists
      const foundAuthUser = existingAuthUsers.find((u: any) => u.email === studentData.email)
      let authUserCreated = false

      if (foundAuthUser) {
        console.log("Auth user already exists, using existing user:", foundAuthUser.id)
        userId = foundAuthUser.id
        authUserCreated = true
      } else {
        // Try to create new auth user (don't fail if it doesn't work)
        try {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: studentData.email,
            password: defaultPassword,
            user_metadata: {
              name: studentData.name,
              role: 'student'
            },
            email_confirm: true
          })

          if (authData && authData.user) {
            existingAuthUsers.push(authData.user)
            userId = authData.user.id
            authUserCreated = true
            console.log(`Auth user created for ${studentData.email}`)
          } else {
            console.log(`Auth user creation failed for ${studentData.email}, proceeding without auth user`)
          }
        } catch (authError) {
          console.log(`Auth user creation failed for ${studentData.email}: ${authError.message}, proceeding without auth user`)
        }

        // Generate a UUID if we don't have an auth user ID
        if (!userId) {
          userId = crypto.randomUUID()
          console.log(`Generated student ID for ${studentData.email}: ${userId}`)
        }
      }

      // Create or update student record directly (bypass triggers)
      const studentRecord = {
        id: userId,
        user_id: authUserCreated ? userId : null, // Only set user_id if auth user was created
        name: studentData.name,
        email: studentData.email,
        contactNumber: toNullIfEmpty(studentData.phone),
        alternate_number: toNullIfEmpty(studentData.alternatePhone),
        dateOfBirth: toNullIfEmpty(studentData.dateOfBirth),
        age: toNumberOrNull(studentData.age),
        gender: toNullIfEmpty(studentData.gender),
        bloodGroup: toNullIfEmpty(studentData.bloodGroup),
        address: toNullIfEmpty(studentData.address),
        city: toNullIfEmpty(studentData.city),
        state: toNullIfEmpty(studentData.state),
        country: studentData.country || "India",
        pincode: toNullIfEmpty(studentData.pincode),
        university: toNullIfEmpty(studentData.university),
        college_school_name: toNullIfEmpty(studentData.college),
        branch_field: toNullIfEmpty(studentData.department),
        registration_number: toNullIfEmpty(studentData.registrationNumber),
        enrollmentNumber: toNullIfEmpty(studentData.enrollmentNumber),
        enrollmentDate: toNullIfEmpty(studentData.enrollmentDate),
        expectedGraduationDate: toNullIfEmpty(studentData.expectedGraduationDate),
        currentCgpa: toNumberOrNull(studentData.cgpa),
        guardianName: toNullIfEmpty(studentData.guardianName),
        guardianPhone: toNullIfEmpty(studentData.guardianPhone),
        guardianEmail: toNullIfEmpty(studentData.guardianEmail),
        guardianRelation: toNullIfEmpty(studentData.guardianRelation),
        student_type: studentData.studentType || "direct",
        approval_status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from("students")
        .upsert(studentRecord, {
          onConflict: 'email',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        results.failed.push({
          email: studentData.email,
          name: studentData.name,
          reason: error.message,
        })
        // Try to cleanup auth user if we created it and the student creation failed
        if (authUserCreated && !foundAuthUser) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(userId)
          } catch (cleanupError) {
            console.error("Failed to cleanup auth user:", cleanupError)
          }
        }
      } else {
        results.successful.push({
          ...data,
          auth_user_created: authUserCreated
        })
      }
    }

    return {
      success: true,
      data: {
        successful: results.successful.length,
        failed: results.failed.length,
        successfulStudents: results.successful,
        failedStudents: results.failed,
      },
    }
  } catch (err: any) {
    console.error("Unexpected error in bulk add:", err)
    return { success: false, error: err.message }
  }
}