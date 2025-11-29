const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkCurrentUser() {
  console.log('🔍 Checking Current User School Association\n')

  // Get current session from browser (you'll need to be logged in)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    console.log('❌ No active session found')
    console.log('Please login in your browser first, then run this script\n')
    console.log('Or provide credentials below:')
    
    // Try to login
    const email = 'your-email@example.com' // Replace with your email
    const password = 'your-password' // Replace with your password
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    console.log('✅ Logged in as:', authData.user.email)
    var userId = authData.user.id
    var userEmail = authData.user.email
  } else {
    console.log('✅ Active session found')
    var userId = session.user.id
    var userEmail = session.user.email
  }

  console.log('\n📋 User Info:')
  console.log('User ID:', userId)
  console.log('Email:', userEmail)

  // Check public.users table
  console.log('\n1️⃣ Checking public.users table...')
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) {
    console.log('❌ Error:', userError.message)
  } else if (userData) {
    console.log('✅ Found in public.users:')
    console.log('   - Role:', userData.role)
    console.log('   - Organization ID:', userData.organizationId || '❌ NOT SET')
    console.log('   - Entity Type:', userData.entity_type)
    console.log('   - Active:', userData.isActive)
  } else {
    console.log('❌ Not found in public.users table')
  }

  // Check school_educators table
  console.log('\n2️⃣ Checking school_educators table...')
  const { data: educatorData, error: educatorError } = await supabase
    .from('school_educators')
    .select('*')
    .eq('email', userEmail)
    .maybeSingle()

  if (educatorError) {
    console.log('❌ Error:', educatorError.message)
  } else if (educatorData) {
    console.log('✅ Found in school_educators:')
    console.log('   - School ID:', educatorData.school_id || '❌ NOT SET')
    console.log('   - Role:', educatorData.role)
    console.log('   - Name:', educatorData.first_name, educatorData.last_name)
  } else {
    console.log('❌ Not found in school_educators table')
  }

  // Check schools table
  console.log('\n3️⃣ Checking schools table...')
  const { data: schoolData, error: schoolError } = await supabase
    .from('schools')
    .select('*')
    .or(`email.eq.${userEmail},principal_email.eq.${userEmail}`)
    .maybeSingle()

  if (schoolError) {
    console.log('❌ Error:', schoolError.message)
  } else if (schoolData) {
    console.log('✅ Found in schools table:')
    console.log('   - School ID:', schoolData.id)
    console.log('   - School Name:', schoolData.name)
    console.log('   - Email:', schoolData.email)
  } else {
    console.log('❌ Not found in schools table')
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 SUMMARY')
  console.log('='.repeat(50))

  const schoolId = userData?.organizationId || educatorData?.school_id || schoolData?.id

  if (schoolId) {
    console.log('✅ School ID Found:', schoolId)
    console.log('✅ You should be able to add students!')
  } else {
    console.log('❌ NO SCHOOL ID FOUND!')
    console.log('\n🔧 SOLUTION:')
    console.log('Your user account is not linked to any school.')
    console.log('You need to:')
    console.log('1. Add organizationId to your public.users record, OR')
    console.log('2. Add a record in school_educators table, OR')
    console.log('3. Add your email to schools table')
    console.log('\nSQL to fix:')
    console.log(`UPDATE public.users SET "organizationId" = 'YOUR_SCHOOL_UUID' WHERE id = '${userId}';`)
  }

  await supabase.auth.signOut()
}

checkCurrentUser().catch(console.error)
