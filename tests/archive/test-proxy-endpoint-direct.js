// Direct test of the proxy endpoint
async function testProxyEndpoint() {
  console.log('🧪 Testing Proxy Endpoint Directly...');
  
  const storageApiUrl = 'https://storage-api.dark-mode-d021.workers.dev';
  
  // Test with a real-looking URL (but fake)
  const testUrl = 'https://pub-12345.r2.dev/teachers/123/documents/degree/certificate.pdf';
  const proxyUrl = `${storageApiUrl}/document-access?url=${encodeURIComponent(testUrl)}&mode=inline`;
  
  console.log(`Testing URL: ${proxyUrl}`);
  
  try {
    const response = await fetch(proxyUrl);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 404) {
      console.log('✅ Proxy endpoint exists and is working (404 expected for fake URL)');
    } else if (response.status === 401) {
      console.log('❌ Proxy endpoint returning 401 - Worker authentication issue');
    } else if (response.status === 500) {
      console.log('❌ Proxy endpoint has server error');
    } else {
      console.log(`Response: ${response.status}`);
    }
    
    const text = await response.text();
    console.log('Response body:', text.substring(0, 200));
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Test the health endpoint to make sure worker is accessible
async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...');
  
  try {
    const response = await fetch('https://storage-api.dark-mode-d021.workers.dev/health');
    const data = await response.json();
    console.log('Health check:', data);
    
    if (data.endpoints && data.endpoints.includes('/document-access')) {
      console.log('✅ /document-access endpoint is available');
    } else {
      console.log('❌ /document-access endpoint not found in health check');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

// Run tests
testHealthEndpoint().then(() => testProxyEndpoint());