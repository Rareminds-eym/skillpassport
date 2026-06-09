# SSO Password Update Tool

## Quick Start

Update all SSO user passwords to match their email addresses (for easy testing):

```bash
npm run update-passwords
```

## What It Does

This script:
1. Connects to the SSO worker database (port 54332)
2. Updates ALL users' passwords to match their email addresses
3. Uses bcrypt with cost factor 12 (same as production)

## Usage

### From the skillpassport directory:

```bash
# Using npm script (recommended)
npm run update-passwords

# Or directly
node scripts/update-sso-passwords.mjs
```

### From any directory:

```bash
cd /Users/Apple/FrontEnd/Rm-Work/skillpassport
npm run update-passwords
```

## Login After Running

Once updated, you can login with any user using their email as both username and password:

| Email | Password |
|-------|----------|
| `seainfo@seaedu.ac.in` | `seainfo@seaedu.ac.in` |
| `seaeduinfo@seaedu.ac.in` | `seaeduinfo@seaedu.ac.in` |
| `admin@testuniv2024.edu` | `admin@testuniv2024.edu` |
| `gokul@rareminds.in` | `gokul@rareminds.in` |
| ... any user in the database | ... their email address |

## When to Use

Run this script when:
- Setting up a new local development environment
- After resetting the SSO database
- After adding new test users
- When you need easy-to-remember passwords for testing

## Requirements

- SSO worker database running on `localhost:54332`
- Dependencies installed (`bcryptjs`, `pg`)
  - These are installed as dev dependencies in package.json

## Troubleshooting

### "Cannot connect to database"

Make sure the SSO database is running:
```bash
# Check if Supabase is running
supabase status

# Or check if port 54332 is listening
lsof -i :54332
```

### "Module not found: bcryptjs or pg"

Install dependencies:
```bash
npm install
```

### Custom Database URL

You can override the default database URL:
```bash
SSO_DB_URL='postgresql://user:pass@host:port/db' npm run update-passwords
```

## Security Note

⚠️ **FOR LOCAL DEVELOPMENT ONLY!**

This tool is designed for local testing and should **NEVER** be used in production or staging environments. Using email addresses as passwords is insecure and only acceptable for local development.

## Files

- **Script**: `/scripts/update-sso-passwords.mjs`
- **npm Command**: `npm run update-passwords` (defined in `package.json`)
- **Target Database**: SSO Worker DB (port 54332)
- **Target Table**: `users`

## Example Output

```
🔐 SSO Password Update Tool
============================================================
📡 Connecting to: postgresql://postgres:****@127.0.0.1:54332/postgres

✅ Connected to SSO database

Found 20 users to update

✅ seainfo@seaedu.ac.in
✅ seaeduinfo@seaedu.ac.in
✅ admin@testuniv2024.edu
...

============================================================
✨ Complete!
   Updated: 20 users
   Blocked: 0 users (updated but cannot login)
   Failed: 0 users
============================================================
```
