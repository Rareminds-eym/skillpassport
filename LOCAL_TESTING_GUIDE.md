# Local Testing Guide - Data Import System

This guide ensures you can test the data import system safely without affecting production data.

## 🛡️ Safety First

**CRITICAL**: This setup creates completely isolated local databases that have NO connection to production. All test data goes to Docker containers on your machine only.

## 🚀 Quick Start

### 1. Set Up Local Testing Environment

```bash
# Make the setup script executable
chmod +x setup-local-test.sh

# Run the setup (creates Docker containers and configures environment)
./setup-local-test.sh
```

This will:
- ✅ Create isolated Docker containers for SSO and Skillpassport databases
- ✅ Configure environment variables for local-only testing  
- ✅ Enable `FORCE_LOCAL_ONLY` mode to block production access
- ✅ Install necessary dependencies

### 2. Verify Local Setup

```bash
# Test database connections and environment isolation
node test-local-import.js
```

Expected output:
```
🚀 Local Data Import Test Suite
===============================

🧪 Testing Local Database Connections
====================================
✅ SSO database connected successfully
✅ Skillpassport database connected successfully

🔬 Testing Data Creation  
========================
✅ Created SSO organization: [uuid]
✅ Created Skillpassport organization: [uuid]
✅ Test data cleaned up

🔒 Checking Environment Isolation
=================================
✅ No production variables detected
✅ FORCE_LOCAL_ONLY mode is active

🎉 All tests passed! Local environment is ready for data import testing.
```

### 3. Start Development Server

```bash
# Start Cloudflare Pages development server
npx wrangler pages dev . --compatibility-date=2023-11-30
```

### 4. Access Data Import Interface

Open your browser to: **http://localhost:8788/data-import.html**

## 📊 Testing with Sample Data

### Use Provided Test Data

1. **Reference**: Check `test-data-samples.json` for sample university, college, and student data
2. **Templates**: Download Excel templates from the web interface
3. **Fill Data**: Use the sample data to populate the Excel templates
4. **Import Order**: Universities → Colleges → Students

### Sample Import Process

1. **Universities**:
   - Download template
   - Add: Test University Alpha, Test University Beta
   - Import using "Local" environment

2. **Colleges**:
   - Download template  
   - Add: Test College of Engineering, Test College of Science, Independent Test College
   - Import using "Local" environment

3. **Students**:
   - Download template
   - Add: Test Student Alpha, Beta, Gamma, Delta
   - Import using "Local" environment

## 🔍 Verification

### Check Imported Data

After importing, verify data was created in local databases:

```bash
# Connect to local SSO database
docker exec -it sso-supabase-db-test psql -U postgres -d postgres

# Check organizations
SELECT id, name, slug FROM organizations WHERE metadata->>'test' IS NOT NULL;

# Exit
\q
```

```bash
# Connect to local Skillpassport database  
docker exec -it skillpassport-supabase-db-test psql -U postgres -d postgres

# Check organizations
SELECT id, name, organization_type FROM organizations WHERE metadata->>'test' IS NOT NULL;

# Check learners
SELECT id, name, email, learner_type FROM learners WHERE metadata->>'imported_via' = 'excel_upload';

# Exit
\q
```

### Web Interface Verification

1. Go to http://localhost:8788/data-import.html
2. Environment should show: "Local Environment - Safe Testing"
3. Try switching to "Production" - you should see warning messages
4. All imports should work only in "Local" mode

## 🛠️ Environment Configuration

### Key Safety Features

**`.dev.vars.local-test`** contains:
```bash
# Force local-only mode (blocks production access)
FORCE_LOCAL_ONLY=true

# Local Docker Supabase URLs
SSO_LOCAL_URL=http://localhost:54321
SKILLPASSPORT_LOCAL_URL=http://localhost:54322

# Production variables are commented out/empty
# SSO_SUPABASE_URL=
# SKILLPASSPORT_SUPABASE_URL=
```

**Docker Compose** (`docker-compose.local-test.yml`):
- Creates isolated containers on ports 54321 and 54322
- Fresh PostgreSQL databases with no existing data
- Named volumes for data persistence during testing
- Isolated network to prevent external access

### Production Protection

The system has multiple layers of protection:

1. **Environment Check**: API validates environment variables
2. **Force Local Mode**: `FORCE_LOCAL_ONLY=true` blocks production access
3. **URL Validation**: Only local URLs are accepted in local mode
4. **UI Warnings**: Production mode shows prominent warnings
5. **Confirmation Prompts**: Production imports require explicit confirmation

## 🧹 Cleanup

### Stop Testing Environment
```bash
# Stop containers but keep data
docker-compose -f docker-compose.local-test.yml down
```

### Remove All Test Data
```bash  
# Stop containers and remove volumes (permanent deletion)
docker-compose -f docker-compose.local-test.yml down -v

# Clean up Docker images (optional)
docker system prune
```

### Reset for Fresh Testing
```bash
# Full reset - run setup again
./setup-local-test.sh
```

## 🚨 Troubleshooting

### Docker Issues

**Problem**: Containers won't start
```bash
# Check Docker is running
docker info

# Check port conflicts  
netstat -an | grep -E ':(54321|54322)'

# View container logs
docker-compose -f docker-compose.local-test.yml logs
```

**Solution**: Change ports in `docker-compose.local-test.yml` if conflicts exist

### Database Connection Issues  

**Problem**: Cannot connect to local databases
```bash
# Test direct connection
docker exec -it sso-supabase-db-test pg_isready -U postgres

# Check environment variables
cat .dev.vars | grep LOCAL
```

**Solution**: Verify containers are running and environment variables match

### Import Failures

**Problem**: Data import fails
1. Check browser console for errors
2. Verify Excel file format (.xlsx or .xls)
3. Ensure required fields are filled
4. Check API logs in terminal

### Production Access Attempts

**Problem**: Trying to access production accidentally
- ✅ **Expected**: Error message "Production access is disabled"
- ✅ **Expected**: UI warnings and confirmation prompts
- ❌ **Unexpected**: If production access works, check `FORCE_LOCAL_ONLY` setting

## 📋 Testing Checklist

Before considering the local setup complete:

- [ ] ✅ Docker containers are running
- [ ] ✅ Local database connections work
- [ ] ✅ Test data creation succeeds
- [ ] ✅ `FORCE_LOCAL_ONLY` mode is active
- [ ] ✅ Production variables are disabled/empty
- [ ] ✅ Web interface loads at localhost:8788
- [ ] ✅ Environment shows "Local - Safe Testing"
- [ ] ✅ Production mode shows warnings
- [ ] ✅ Template download works
- [ ] ✅ Excel import works for all data types
- [ ] ✅ Data appears in local databases only

## 🎯 Next Steps

Once local testing is working perfectly:

1. **Test thoroughly** with your actual university/college data
2. **Verify all features** work as expected
3. **Document any issues** encountered
4. **Only then** consider production deployment with proper backups

## 🔐 Security Reminders

- ⚠️ **Never** test with real student emails or personal data
- ⚠️ **Always** use `FORCE_LOCAL_ONLY=true` for testing
- ⚠️ **Backup** production databases before any production imports
- ⚠️ **Double-check** environment selection before importing
- ⚠️ **Test scenarios** include error conditions and large datasets
- ✅ **Email verification** is automatically set to verified for imported users (no manual verification needed)

---

**Remember**: This local testing environment is completely isolated from production. Feel free to test extensively without any risk to your live data!