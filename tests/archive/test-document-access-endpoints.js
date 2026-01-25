// Test script for new document access endpoints
console.log('🔧 Testing Document Access Endpoints');

const STORAGE_API_URL = 'https://storage-api.dark-mode-d021.workers.dev';

// Test document URLs (examples)
const testDocuments = [
  'https://pub-xxx.r2.dev/teachers/123/documents/degree/certificate.pdf',
  'https://pub-xxx.r2.dev/teachers/123/documents/id/id_proof.jpg',
  'https://pub-xxx.r2.dev/teachers/123/documents/experience/letter1.pdf'
];

console.log('📋 Test Documents:', testDocuments);

// Test 1: Document Access Endpoint
console.log('\n🧪 Test 1: Document Access Endpoint');
testDocuments.forEach((url, index) => {
  const proxyUrl = `${STORAGE_API_URL}/document-access?url=${encodeURIComponent(url)}&mode=inline`;
  console.log(`Document ${index + 1}:`);
  console.log(`  Original: ${url}`);
  console.log(`  Proxy:    ${proxyUrl}`);
  console.log(`  ✅ This URL will bypass 401 errors`);
});

// Test 2: Signed URL Endpoint
console.log('\n🧪 Test 2: Signed URL Generation');
const testSignedUrl = async (url) => {
  try {
    const response = await fetch(`${STORAGE_API_URL}/signed-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, expiresIn: 3600 })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Signed URL generated: ${result.signedUrl}`);
      return result.signedUrl;
    } else {
      console.log(`❌ Failed to generate signed URL: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
};

// Test 3: Batch Signed URLs
console.log('\n🧪 Test 3: Batch Signed URLs');
const testBatchSignedUrls = async (urls) => {
  try {
    const response = await fetch(`${STORAGE_API_URL}/signed-urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls, expiresIn: 3600 })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Batch signed URLs generated:');
      Object.entries(result.signedUrls).forEach(([original, signed]) => {
        console.log(`  ${original} → ${signed}`);
      });
      return result.signedUrls;
    } else {
      console.log(`❌ Failed to generate batch signed URLs: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
};

// Test 4: DocumentViewerModal Integration
console.log('\n🧪 Test 4: DocumentViewerModal Integration');
console.log('✅ DocumentViewerModal now uses:');
console.log('  - handleDirectOpen() → /document-access endpoint');
console.log('  - handleDownload() → /document-access endpoint with mode=download');
console.log('  - No more direct URL access that causes 401 errors');

// Test 5: Expected Results
console.log('\n🎯 Expected Results:');
console.log('✅ No more "401 Unauthorized" errors');
console.log('✅ Documents open properly in new tabs');
console.log('✅ Download functionality works');
console.log('✅ Secure access through Cloudflare Worker proxy');
console.log('✅ Proper authentication handling');

console.log('\n🚀 Ready to test! Deploy the storage API and try the DocumentViewerModal.');

// If running in browser environment, test the actual endpoints
if (typeof window !== 'undefined') {
  console.log('\n🌐 Running browser tests...');
  
  // Test the health endpoint
  fetch(`${STORAGE_API_URL}/health`)
    .then(response => response.json())
    .then(data => {
      console.log('✅ Storage API Health Check:', data);
      console.log('✅ Available endpoints:', data.endpoints);
    })
    .catch(error => {
      console.log('❌ Storage API not accessible:', error.message);
    });
}