# Delete User Assessment Records - Quick Guide

## 🎯 Purpose

This script allows you to delete all assessment records for a specific user, useful for:
- Testing the assessment system
- Resetting a user's assessment history
- Removing test data
- Allowing users to retake assessments (bypasses 6-month restriction)

## 🚀 Quick Start

### 1. Set Environment Variables

Make sure you have Supabase credentials in your `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Run the Script

```bash
node scripts/delete-user-assessment-records.js
```

### 3. Follow the Prompts

1. Enter the user's email address
2. Review the records that will be deleted
3. Type "yes" to confirm
4. Re-type the email address to double-confirm
5. Wait for deletion to complete

## 📋 What Gets Deleted

| Record Type | Description |
|-------------|-------------|
| **Assessment Attempts** | All attempts (completed, in_progress, abandoned) |
| **Assessment Results** | Final analysis results with RIASEC, Big Five, etc. |
| **Assessment Responses** | Individual answers to questions |
| **Adaptive Sessions** | Adaptive aptitude test sessions |
| **Adaptive Responses** | Individual adaptive test answers |
| **AI Questions** | AI-generated questions linked to attempts |

## ⚠️ What Does NOT Get Deleted

- ❌ User account (auth.users)
- ❌ Student record (students table)
- ❌ Other user data (courses, applications, etc.)

## 🔒 Safety Features

- ✅ **Preview before deletion** - Shows all records first
- ✅ **Double confirmation** - Requires "yes" + email re-entry
- ✅ **Verification** - Confirms deletion was successful
- ✅ **Error handling** - Stops on errors, shows clear messages
- ✅ **Correct order** - Deletes in proper sequence (respects foreign keys)

## 📊 Example Output

```
╔══════════════════════════════════════════════════════════════╗
║     Delete User Assessment Records Script                    ║
╚══════════════════════════════════════════════════════════════╝

📧 Enter user email: test@example.com

✅ User found:
   Name: Test User
   Email: test@example.com
   Grade: Grade 10
   User ID: abc-123-def

📋 Records to be deleted:
   • Assessment Attempts: 3
   • Assessment Results: 1
   • Assessment Responses: 95
   • Adaptive Sessions: 1
   • Adaptive Responses: 21
   • AI Questions: 0
   ─────────────────────────────────────
   TOTAL RECORDS: 121

❓ Are you sure you want to delete all these records? (yes/no): yes
❓ Type the email address again to confirm: test@example.com

🗑️  Starting deletion process...
   ✅ All records deleted successfully!
```

## 🛠️ Troubleshooting

### "User not found"
- Check the email spelling
- Verify the user exists in the database
- Check both auth.users and students tables

### "Missing Supabase credentials"
- Ensure `.env` file exists
- Check `VITE_SUPABASE_URL` is set
- Check `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_ANON_KEY` is set

### "Error during deletion"
- Check database permissions
- Verify foreign key constraints
- Check Supabase logs for details

### Script won't run
```bash
# Make sure it's executable
chmod +x scripts/delete-user-assessment-records.js

# Or run with node directly
node scripts/delete-user-assessment-records.js
```

## 💡 Use Cases

### 1. Testing Assessment Flow
```bash
# Take test assessment
# Run script to delete
# Take assessment again to test resume/restriction features
```

### 2. Resetting User Data
```bash
# User wants to retake assessment
# Run script to remove old results
# User can now take fresh assessment
```

### 3. Cleaning Test Data
```bash
# After testing with multiple test accounts
# Run script for each test email
# Database is clean for production
```

## 📝 Notes

- **Irreversible**: Deleted data cannot be recovered
- **No backup**: Script does not create backups
- **Immediate effect**: Changes apply instantly
- **6-month restriction**: Reset after deletion (no previous results)
- **Fresh start**: User can take assessment immediately after

## 🔗 Related Documentation

- [Assessment System Complete Guide](.kiro/specs/assessment-system-documentation/ASSESSMENT_SYSTEM_COMPLETE_GUIDE.md)
- [Database Schema](.kiro/specs/assessment-system-documentation/ASSESSMENT_SYSTEM_COMPLETE_GUIDE.md#database-schema)
- [Scripts README](scripts/README.md)

---

**Last Updated**: January 17, 2026  
**Script Location**: `scripts/delete-user-assessment-records.js`
