const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testCreateStudent() {
  console.log('Testing create-student Edge Function...\n')

  // First, login as a school admin
  console.log('1. Logging in...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'your-admin-email@example.com', // Replace with your admin email
    password: 'your-password' // Replace with your password
  })

  if (authError) {
    console.error('❌ Login failed:', authError.message)
    console.log('\nPlease update the email and password in this script with your admin credentials')
    return
  }

  console.log('✅ Logged in as:', authData.user.email)

  // Test the Edge Function
  console.log('\n2. Calling create-student Edge Function...')
  const { data, error } = await supabase.functions.invoke('create-student', {
    body: {
      student: {
        name: 'Test Student',
        email: `test${Date.now()}@example.com`, // Unique email
        contactNumber: '+919876543210',
        dateOfBirth: '2000-01-15',
        gender: 'Male',
        enrollmentNumber: 'TEST001'
      }
    }
  })

  console.log('\n3. Response:')
  console.log('Data:', JSON.stringify(data, null, 2))
  console.log('Error:', error)

  if (error) {
    console.error('\n❌ Edge Function Error:', error)
    console.log('\nPossible issues:')
    console.log('- Edge Function not deployed')
    console.log('- CORS issue')
    console.log('- Authentication issue')
    console.log('- Service role key not set')
  } else if (data?.success) {
    console.log('\n✅ Success! Student created:')
    console.log('Email:', data.data.email)
    console.log('Password:', data.data.password)
  } else {
    console.log('\n❌ Failed:', data?.error || 'Unknown error')
  }

  // Logout
  await supabase.auth.signOut()
}

testCreateStudent().catch(console.error)
