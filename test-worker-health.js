/**
 * Test Cloudflare Worker health and authentication
 */

const WORKER_URL = 'https://user-api.dark-mode-d021.workers.dev'

async function testWorkerHealth() {
  console.log('🏥 Testing worker health...')
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${WORKER_URL}/health`)
    console.log('📡 Health check status:', healthResponse.status)
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('✅ Worker is healthy:', healthData)
    } else {
      console.log('❌ Worker health check failed')
    }
    
    // Test authenticated endpoint without token
    console.log('\n🔒 Testing authenticated endpoint without token...')
    const noAuthResponse = await fetch(`${WORKER_URL}/create-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    })
    
    console.log('📡 No auth response status:', noAuthResponse.status)
    const noAuthData = await noAuthResponse.json()
    console.log('📄 No auth response:', noAuthData)
    
    // Test with invalid token
    console.log('\n🔒 Testing with invalid token...')
    const invalidTokenResponse = await fetch(`${WORKER_URL}/create-student`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-123'
      },
      body: JSON.stringify({ test: 'data' })
    })
    
    console.log('📡 Invalid token response status:', invalidTokenResponse.status)
    const invalidTokenData = await invalidTokenResponse.json()
    console.log('📄 Invalid token response:', invalidTokenData)
    
  } catch (error) {
    console.error('❌ Worker test failed:', error.message)
  }
}

testWorkerHealth()