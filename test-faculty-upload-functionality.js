/**
 * Test Faculty Document Upload Functionality
 * Tests the new file upload service integration
 */

const STORAGE_API_URL = 'https://storage-api.dark-mode-d021.workers.dev';

async function testStorageAPIHealth() {
  console.log('🔍 Testing Storage API Health...');
  
  try {
    const response = await fetch(`${STORAGE_API_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Storage API is healthy:', data);
      return true;
    } else {
      console.log('❌ Storage API health check failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Storage API connection failed:', error.message);
    return false;
  }
}

async function testFileUpload() {
  console.log('🔍 Testing File Upload...');
  
  try {
    // Create a test file (small text file)
    const testContent = 'This is a test document for faculty onboarding';
    const testFile = new File([testContent], 'test-document.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('filename', 'teachers/test/test-document.txt');
    
    const response = await fetch(`${STORAGE_API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ File upload successful:', result);
      return result.url;
    } else {
      console.log('❌ File upload failed:', result);
      return null;
    }
  } catch (error) {
    console.log('❌ File upload error:', error.message);
    return null;
  }
}

async function testDocumentAccess(fileUrl) {
  console.log('🔍 Testing Document Access...');
  
  try {
    const encodedUrl = encodeURIComponent(fileUrl);
    const accessUrl = `${STORAGE_API_URL}/document-access?url=${encodedUrl}&mode=inline`;
    
    const response = await fetch(accessUrl);
    
    if (response.ok) {
      const content = await response.text();
      console.log('✅ Document access successful, content length:', content.length);
      return true;
    } else {
      console.log('❌ Document access failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Document access error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Faculty Upload Functionality Tests\n');
  
  // Test 1: Storage API Health
  const healthOk = await testStorageAPIHealth();
  if (!healthOk) {
    console.log('❌ Cannot proceed - Storage API is not healthy');
    return;
  }
  
  console.log('');
  
  // Test 2: File Upload
  const uploadedUrl = await testFileUpload();
  if (!uploadedUrl) {
    console.log('❌ Cannot proceed - File upload failed');
    return;
  }
  
  console.log('');
  
  // Test 3: Document Access
  const accessOk = await testDocumentAccess(uploadedUrl);
  
  console.log('\n📊 Test Results Summary:');
  console.log(`Storage API Health: ${healthOk ? '✅' : '❌'}`);
  console.log(`File Upload: ${uploadedUrl ? '✅' : '❌'}`);
  console.log(`Document Access: ${accessOk ? '✅' : '❌'}`);
  
  if (healthOk && uploadedUrl && accessOk) {
    console.log('\n🎉 All tests passed! Faculty document upload is ready to use.');
    console.log('\n📝 Next steps:');
    console.log('1. Go to College Admin → Faculty → Onboarding');
    console.log('2. Fill out faculty details');
    console.log('3. Upload documents (they will upload immediately)');
    console.log('4. Submit the form');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
  }
}

// Run the tests
runTests().catch(console.error);