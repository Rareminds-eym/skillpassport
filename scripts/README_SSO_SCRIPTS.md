# SSO Helper Scripts

Two convenient scripts to manage and test SSO authentication in your local development environment.

## 📜 Available Scripts

### 1. Update SSO Passwords

**Script**: `scripts/update-sso-passwords.mjs`  
**Command**: `npm run update-passwords`

Updates all SSO user passwords to match their email addresses (for easy testing).

### 2. Test SSO Login

**Script**: `scripts/test-sso-login.mjs`  
**Command**: `npm run test:login`

Runs comprehensive login tests against the SSO worker.

---

## 🚀 Quick Start

### Step 1: Start the SSO Worker

The SSO worker must be running before you can test login or use the app.

**Option A: Start all workers**
```bash
npm run dev:fastrun
```

**Option B: Start only SSO worker**
```bash
npm run workers:sso
```

**Option C: Start from SSO worker directory**
```bash
cd ../workers/sso-worker
npm run dev
```

### Step 2: Update Passwords (One Time)

Make all user passwords match their email addresses:
```bash
npm run update-passwords
```

**Output:**
```
🔐 SSO Password Update Tool
============================================================
📡 Connecting to: postgresql://postgres:****@127.0.0.1:54332/postgres

✅ Connected to SSO database

Found 20 users to update

✅ seainfo@seaedu.ac.in
✅ seaeduinfo@seaedu.ac.in
...

✨ Complete!
   Updated: 20 users
```

### Step 3: Test Login

Run the login test suite:
```bash
npm run test:login
```

**Output:**
```
🔐 SSO Login Test Suite
============================================================

📋 Checking Prerequisites:
✅ Database connected (20 users found)
✅ SSO Worker is running at http://127.0.0.1:8787

✅ Testing Successful Logins:
  ✅ Login successful for seainfo@seaedu.ac.in
  ✅ Login successful for seaeduinfo@seaedu.ac.in
  ...

❌ Testing Failed Login Scenarios:
  ✅ Correctly rejected login with wrong password
  ✅ Correctly rejected non-existent user
  ...

============================================================
📊 Test Summary:
  Total Tests: 7
  ✅ Passed: 7
  ❌ Failed: 0
============================================================

🎉 All tests passed!
```

---

## 📖 Detailed Usage

### Update Passwords Script

**What it does:**
- Connects to SSO database (port 54332)
- Retrieves all users
- Hashes each user's email using bcrypt (cost 12)
- Updates password_hash for each user

**When to use:**
- Setting up new development environment
- After resetting the database
- After adding new test users
- Forgot test user passwords

**Prerequisites:**
- SSO database running on localhost:54332
- bcryptjs and pg packages installed

**Example:**
```bash
# Default usage
npm run update-passwords

# With custom database URL
SSO_DB_URL='postgresql://user:pass@host:port/db' npm run update-passwords
```

**Test Accounts After Running:**
| Email | Password |
|-------|----------|
| `seainfo@seaedu.ac.in` | `seainfo@seaedu.ac.in` |
| `seaeduinfo@seaedu.ac.in` | `seaeduinfo@seaedu.ac.in` |
| `admin@freshtest1780937941574.edu` | `admin@freshtest1780937941574.edu` |
| ... any user | ... their email |

---

### Test Login Script

**What it does:**
- Checks if SSO database is accessible
- Checks if SSO worker is running
- Tests successful login with valid credentials
- Tests failed login scenarios:
  - Wrong password
  - Non-existent user
  - Invalid email format
  - Missing password

**When to use:**
- After making changes to authentication code
- Before committing auth-related changes
- Debugging login issues
- Verifying SSO worker is working correctly

**Prerequisites:**
- SSO database running on localhost:54332
- SSO worker running on localhost:8787
- Passwords updated (run `npm run update-passwords`)

**Test Coverage:**
- ✅ Successful login (3 test accounts)
- ❌ Wrong password
- ❌ Non-existent user
- ❌ Invalid email format
- ❌ Missing password field

**Environment Variables:**
```bash
# Customize endpoints
SSO_DB_URL='postgresql://postgres:postgres@127.0.0.1:54332/postgres'
SSO_API_URL='http://127.0.0.1:8787'

# Run with custom values
SSO_API_URL='http://localhost:9000' npm run test:login
```

---

## 🔧 Troubleshooting

### "Cannot connect to database"

**Problem:** SSO database not running

**Solution:**
```bash
# Check if Supabase is running
supabase status

# Start Supabase if not running
supabase start

# Or check if port 54332 is listening
lsof -i :54332
```

### "SSO Worker not reachable"

**Problem:** SSO worker not started

**Solution:**
```bash
# Option 1: Start from skillpassport directory
npm run workers:sso

# Option 2: Start from SSO worker directory
cd ../workers/sso-worker
npm run dev

# Verify it's running
curl http://127.0.0.1:8787/health
```

### "Module not found: bcryptjs or pg"

**Problem:** Dependencies not installed

**Solution:**
```bash
npm install
```

### "Login tests fail but UI works"

**Problem:** Password mismatch

**Solution:**
```bash
# Re-update all passwords
npm run update-passwords

# Then test again
npm run test:login
```

---

## 🎯 Common Workflows

### New Developer Setup
```bash
# 1. Start database
supabase start

# 2. Start SSO worker
npm run workers:sso

# 3. Update passwords for easy testing
npm run update-passwords

# 4. Verify everything works
npm run test:login

# 5. Start developing!
npm run dev:fastrun
```

### Before Committing Auth Changes
```bash
# 1. Make sure workers are running
npm run workers:sso

# 2. Run login tests
npm run test:login

# 3. If all pass, commit your changes
git add .
git commit -m "auth: your changes"
```

### Debugging Login Issues
```bash
# 1. Check if database has users
npm run update-passwords  # Shows user count

# 2. Test login flow
npm run test:login

# 3. Check the output for specific failures
```

---

## 📂 Files

| File | Purpose |
|------|---------|
| `scripts/update-sso-passwords.mjs` | Password update script |
| `scripts/test-sso-login.mjs` | Login test script |
| `scripts/README_SSO_SCRIPTS.md` | This documentation |

---

## 🔒 Security Note

⚠️ **FOR LOCAL DEVELOPMENT ONLY!**

These scripts are designed for local testing and should **NEVER** be used in production or staging environments. Using email addresses as passwords is insecure and only acceptable for local development.

---

## 📝 Contributing

When modifying these scripts:
1. Test thoroughly in local environment
2. Update this README if adding new features
3. Keep error messages helpful and clear
4. Maintain consistent formatting
