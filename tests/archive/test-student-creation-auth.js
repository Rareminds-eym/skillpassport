/**
 * Test student creation authentication
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('🔍 Testing authentication for student creation...')
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
      return
    }
    
    if (!session) {
      console.log('❌ No active session found')
      console.log('💡 You need to be logged in to test this')
      return
    }
    
    console.log('✅ Session found')
    console.log('📧 User email:', session.user.email)
    console.log('🔑 Token length:', session.access_token.length)
    console.log('⏰ Token expires at:', new Date(session.expires_at * 1000).toISOString())
    
    // Test API call
    const WORKER_URL = process.env.VITE_USER_API_URL || 'https://user-api.dark-mode-d021.workers.dev'
    
    console.log('🌐 Testing API call to:', `${WORKER_URL}/create-student`)
    
    const testData = {
      userEmail: session.user.email,
      schoolId: 'test-school-id',
      student: {
        name: 'Test Student',
        email: 'test.student@example.com',
        contactNumber: '1234567890',
        approval_status: 'approved',
        student_type: 'educator_added'
      }
    }
    
    const response = await fetch(`${WORKER_URL}/create-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(testData)
    })
    
    console.log('📡 Response status:', response.status, response.statusText)
    
    const result = await response.json()
    console.log('📄 Response body:', JSON.stringify(result, null, 2))
    
    if (response.status === 401) {
      console.log('❌ Authentication failed - token might be invalid')
      
      // Try refreshing the session
      console.log('🔄 Attempting to refresh session...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('❌ Refresh failed:', refreshError)
      } else {
        console.log('✅ Session refreshed')
        console.log('🔑 New token length:', refreshData.session.access_token.length)
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAuth()