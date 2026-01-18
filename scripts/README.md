# Assessment Management Scripts

This directory contains utility scripts for managing assessment data.

## Scripts

### delete-user-assessment-records.js

Deletes all assessment-related records for a specific user identified by email.

#### What it deletes:
- Assessment attempts (all statuses: completed, in_progress, abandoned)
- Assessment results
- Individual question responses
- Adaptive aptitude sessions and responses
- AI-generated questions linked to attempts

#### Usage:

```bash
# Using Node.js directly
node scripts/delete-user-assessment-records.js

# Or make it executable and run
chmod +x scripts/delete-user-assessment-records.js
./scripts/delete-user-assessment-records.js
```

#### Environment Variables Required:

```bash
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### Interactive Flow:

1. **Enter email**: Script prompts for user email
2. **User lookup**: Finds user in database
3. **Show records**: Displays all records that will be deleted
4. **Confirmation**: Asks for confirmation (type "yes")
5. **Double confirmation**: Asks to re-type email address
6. **Deletion**: Removes all records in correct order
7. **Verification**: Confirms all records are deleted

#### Example Session:

```
╔══════════════════════════════════════════════════════════════╗
║     Delete User Assessment Records Script                    ║
╚══════════════════════════════════════════════════════════════╝

⚠️  WARNING: This will permanently delete all assessment records

📧 Enter user email: gokul@rareminds.in

🔍 Looking up user: gokul@rareminds.in...

✅ User found:
   Name: Gokul
   Email: gokul@rareminds.in
   Grade: Grade 10
   User ID: 95364f0d-23fb-4616-b0f4-48caafee5439

📊 Counting assessment records...

📋 Records to be deleted:
   • Assessment Attempts: 8
   • Assessment Results: 1
   • Assessment Responses: 140
   • Adaptive Sessions: 1
   • Adaptive Responses: 21
   • AI Questions: 1
   ─────────────────────────────────────
   TOTAL RECORDS: 172

📝 Assessment Attempts:
   1. middle - middle_school
      Status: completed
      Started: 1/17/2026, 11:08:32 AM
      Completed: 1/17/2026, 11:11:44 AM
   2. after12 - science
      Status: abandoned
      Started: 1/16/2026, 5:46:36 PM
   ...

⚠️  This action cannot be undone!

❓ Are you sure you want to delete all these records? (yes/no): yes

❓ Type the email address again to confirm: gokul@rareminds.in

🗑️  Starting deletion process...

1️⃣  Deleting assessment results...
   ✅ Assessment results deleted
2️⃣  Deleting assessment responses...
   ✅ Assessment responses deleted
3️⃣  Deleting AI questions...
   ✅ AI questions deleted
4️⃣  Deleting adaptive aptitude responses...
   ✅ Adaptive responses deleted
5️⃣  Deleting adaptive aptitude sessions...
   ✅ Adaptive sessions deleted
6️⃣  Deleting assessment attempts...
   ✅ Assessment attempts deleted

✅ Verifying deletion...

📊 Final verification:
   • Assessment Attempts: 0
   • Assessment Results: 0
   • Assessment Responses: 0
   • Adaptive Sessions: 0
   • Adaptive Responses: 0
   • AI Questions: 0

✅ SUCCESS! All assessment records have been deleted.
   User gokul@rareminds.in can now start fresh with a new assessment.
```

#### Safety Features:

- ✅ Shows all records before deletion
- ✅ Requires explicit "yes" confirmation
- ✅ Requires re-typing email address
- ✅ Deletes in correct order (respects foreign keys)
- ✅ Verifies deletion after completion
- ✅ Handles errors gracefully
- ✅ Shows detailed progress

#### Error Handling:

- Invalid email format → Script exits
- User not found → Script exits
- No records found → Script exits (no deletion needed)
- Confirmation mismatch → Script exits
- Database errors → Shows error message and stops

#### Notes:

- This script does NOT delete the user account itself
- This script does NOT delete the student record
- Only assessment-related data is removed
- User can take a new assessment immediately after deletion
- The 6-month restriction is reset (no previous results exist)

## Development

To add new scripts:

1. Create a new `.js` file in this directory
2. Add shebang: `#!/usr/bin/env node`
3. Make it executable: `chmod +x scripts/your-script.js`
4. Document it in this README
5. Follow the same error handling patterns
