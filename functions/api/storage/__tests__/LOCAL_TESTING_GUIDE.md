# Local Testing Guide - Storage API Authentication

## Quick Start

### Step 1: Start Your Local Environment

```bash
# Build the frontend
npm run build

# Start all services (frontend, pages, workers, supabase)
npm run dev:fast
```

Wait for all services to start. The Storage API will be available at:
- **Local:** `http://localhost:8788/api/storage`

### Step 2: Get a Valid JWT Token

Open your browser and navigate to your local app (`http://localhost:3000`). Then:

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Run this command:**

```javascript
// Get your current session token
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  console.log('Your JWT Token:');
  console.log(session.access_token);
  console.log('\nYour User ID:');
  console.log(session.user.id);
  
  // Copy to clipboard
  navigator.clipboard.writeText(session.access_token);
  console.log('\n✅ Token copied to clipboard!');
} else {
  console.log('❌ Not logged in. Please log in first.');
}
```

4. **Copy the token** (it's already in your clipboard)
5. **Save your User ID** for later tests

### Step 3: Test with curl

Now you can test the API using curl. Replace `YOUR_TOKEN` and `YOUR_USER_ID` with the values from Step 2.

## Basic Tests

### Test 1: Public Endpoint (No Auth Required)

```bash
curl http://localhost:8788/api/storage/
```

**Expected:** JSON response with service status

### Test 2: Protected Endpoint Without Token (Should Fail)

```bash
curl -X POST http://localhost:8788/api/storage/upload ^
  -F "file=@test.txt" ^
  -F "filename=test.txt"
```

**Expected:** 401 error with "Authentication required"

### Test 3: Upload File With Token (Should Work)

First, create a test file:
```bash
echo "Hello, this is a test file" > test.txt
```

Then upload it:
```bash
curl -X POST http://localhost:8788/api/storage/upload ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -F "file=@test.txt" ^
  -F "filename=test.txt"
```

**Expected:** 200 OK with file URL and key containing your user ID

**Save the returned `key` value for the next test!**

### Test 4: Delete Your Own File (Should Work)

```bash
curl -X POST http://localhost:8788/api/storage/delete ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"key\": \"uploads/YOUR_USER_ID/YOUR_FILE_KEY\"}"
```

**Expected:** 200 OK with success message

### Test 5: Try to Delete Another User's File (Should Fail)

```bash
curl -X POST http://localhost:8788/api/storage/delete ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"key\": \"uploads/different-user-id/some-file.txt\"}"
```

**Expected:** 403 Forbidden with "Access denied"

## Testing from Browser Console

You can also test directly from your browser console:

### Test Upload

```javascript
// Create a test file
const testFile = new File(['Test content'], 'test.txt', { type: 'text/plain' });

// Upload using the utility function
const result = await uploadToCloudflareR2(testFile, 'test');
console.log('Upload result:', result);

// Check that the key contains your user ID
if (result.success) {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session.user.id;
  console.log('Your user ID:', userId);
  console.log('File key:', result.key);
  console.log('Contains user ID?', result.key.includes(userId));
}
```

### Test Delete

```javascript
// Delete a file (use the URL from upload result)
const fileUrl = 'YOUR_FILE_URL_HERE';
const success = await deleteFromCloudflareR2(fileUrl);
console.log('Delete success:', success);
```

### Test Authentication Error

```javascript
// Try to upload without being logged in
await supabase.auth.signOut();

const testFile = new File(['Test'], 'test.txt', { type: 'text/plain' });
const result = await uploadToCloudflareR2(testFile, 'test');
console.log('Result:', result);
// Should show: "Authentication required. Please log in."
```

## Interactive Testing Script

Create a file `test-storage-auth.html` and open it in your browser:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Storage API Auth Tester</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <h1>Storage API Authentication Tester</h1>
  
  <div>
    <h2>1. Get Token</h2>
    <button onclick="getToken()">Get My Token</button>
    <pre id="token-output"></pre>
  </div>

  <div>
    <h2>2. Test Upload</h2>
    <input type="file" id="file-input">
    <button onclick="testUpload()">Upload File</button>
    <pre id="upload-output"></pre>
  </div>

  <div>
    <h2>3. Test Delete</h2>
    <input type="text" id="file-key" placeholder="File key from upload">
    <button onclick="testDelete()">Delete File</button>
    <pre id="delete-output"></pre>
  </div>

  <div>
    <h2>4. Test Unauthorized Delete</h2>
    <button onclick="testUnauthorizedDelete()">Try to Delete Other User's File</button>
    <pre id="unauth-output"></pre>
  </div>

  <script>
    // Initialize Supabase (use your actual values)
    const supabase = window.supabase.createClient(
      'YOUR_SUPABASE_URL',
      'YOUR_SUPABASE_ANON_KEY'
    );

    const API_URL = 'http://localhost:8788/api/storage';

    async function getToken() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        document.getElementById('token-output').textContent = 
          `Token: ${session.access_token}\n\nUser ID: ${session.user.id}`;
        navigator.clipboard.writeText(session.access_token);
        alert('Token copied to clipboard!');
      } else {
        document.getElementById('token-output').textContent = 
          'Not logged in. Please log in to your app first.';
      }
    }

    async function testUpload() {
      const fileInput = document.getElementById('file-input');
      const file = fileInput.files[0];
      
      if (!file) {
        alert('Please select a file first');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        document.getElementById('upload-output').textContent = 
          'Error: Not logged in';
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);

      try {
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        });

        const data = await response.json();
        document.getElementById('upload-output').textContent = 
          `Status: ${response.status}\n\n${JSON.stringify(data, null, 2)}`;
        
        if (data.key) {
          document.getElementById('file-key').value = data.key;
        }
      } catch (error) {
        document.getElementById('upload-output').textContent = 
          `Error: ${error.message}`;
      }
    }

    async function testDelete() {
      const fileKey = document.getElementById('file-key').value;
      
      if (!fileKey) {
        alert('Please enter a file key');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        document.getElementById('delete-output').textContent = 
          'Error: Not logged in';
        return;
      }

      try {
        const response = await fetch(`${API_URL}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ key: fileKey })
        });

        const data = await response.json();
        document.getElementById('delete-output').textContent = 
          `Status: ${response.status}\n\n${JSON.stringify(data, null, 2)}`;
      } catch (error) {
        document.getElementById('delete-output').textContent = 
          `Error: ${error.message}`;
      }
    }

    async function testUnauthorizedDelete() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        document.getElementById('unauth-output').textContent = 
          'Error: Not logged in';
        return;
      }

      // Try to delete a file from a different user
      const fakeKey = 'uploads/different-user-id-12345/fake-file.txt';

      try {
        const response = await fetch(`${API_URL}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ key: fakeKey })
        });

        const data = await response.json();
        document.getElementById('unauth-output').textContent = 
          `Status: ${response.status}\n\n${JSON.stringify(data, null, 2)}\n\n` +
          `Expected: 403 Forbidden\n` +
          `Actual: ${response.status === 403 ? '✅ PASS' : '❌ FAIL'}`;
      } catch (error) {
        document.getElementById('unauth-output').textContent = 
          `Error: ${error.message}`;
      }
    }
  </script>
</body>
</html>
```

## Troubleshooting

### "Authentication required" on all requests
- Make sure you're logged in to your app
- Check that your token hasn't expired (tokens expire after 1 hour by default)
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are set in your environment

### "Access denied" when deleting own file
- Verify the file key contains your actual user ID
- Check that the user ID in the token matches the user ID in the file path
- Use the browser console to compare: `session.user.id` vs the ID in the file key

### CORS errors
- Make sure you're testing from `localhost:3000` (same origin as your app)
- Or use curl instead of browser fetch

### 404 errors
- Check that the Storage API is running on port 8788
- Verify the endpoint path is correct
- Make sure you ran `npm run build` before starting the pages dev server

## Quick Verification Checklist

Run through these tests to verify everything works:

```bash
# 1. Public endpoint works without auth
curl http://localhost:8788/api/storage/

# 2. Protected endpoint rejects without auth
curl -X POST http://localhost:8788/api/storage/upload -F "file=@test.txt" -F "filename=test.txt"

# 3. Get your token (from browser console)
# Then test upload with auth (should work)

# 4. Verify file key contains your user ID

# 5. Test delete with auth (should work)

# 6. Test delete other user's file (should fail with 403)
```

All tests passing? You're good to go! 🎉

## Next Steps

Once local testing is complete:
1. Test in staging environment
2. Verify with multiple user accounts
3. Test edge cases (expired tokens, invalid tokens, etc.)
4. Monitor logs for any authentication failures
