# Quick Start: Unlock Video Portfolio Access

## For User: amruthareddy.9353@gmail.com

### Step 1: Check Current Status

```bash
cd /mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport
npx tsx scripts/unlock-video-portfolio.ts amruthareddy.9353@gmail.com --env=production --check-only
```

**Expected Output:**
- User ID: `59dc759d-45ff-4d14-b7f3-34c435cbf4ae`
- Current Status: ❌ NO ACCESS

---

### Step 2: Unlock Access (Production)

```bash
npx tsx scripts/unlock-video-portfolio.ts amruthareddy.9353@gmail.com --env=production --billing=lifetime
```

**What happens:**
1. Script connects to production database
2. Shows production warning (requires confirmation)
3. Looks up user by email
4. Displays current status
5. Asks for confirmation to create entitlement
6. Creates lifetime access grant
7. Displays success confirmation

**Safety:** Script will ask for confirmation twice before modifying production.

---

### Step 3: Verify Access

```bash
npx tsx scripts/unlock-video-portfolio.ts amruthareddy.9353@gmail.com --env=production --check-only
```

**Expected Output:**
- Status: ✅ ACTIVE
- Billing: lifetime
- Granted: Yes (Grandfathered)

---

## Alternative: Non-Interactive Mode (Skip Confirmations)

**⚠️ USE WITH CAUTION:**

```bash
npx tsx scripts/unlock-video-portfolio.ts amruthareddy.9353@gmail.com \
  --env=production \
  --billing=lifetime \
  --force
```

This skips all confirmation prompts. Only use if you're absolutely certain.

---

## Manual Database Verification

```sql
-- Connect to production database and run:
SELECT 
  u.email,
  ue.feature_key,
  ue.status,
  ue.billing_period,
  ue.start_date,
  ue.end_date,
  ue.is_grandfathered
FROM 
  users u
  JOIN user_entitlements ue ON u.id = ue.user_id
WHERE 
  u.email = 'amruthareddy.9353@gmail.com'
  AND ue.feature_key = 'video-portfolio';
```

---

## Troubleshooting

### "Service role key not found"

Add to `.env.production`:
```bash
PRODUCTION_SERVICE_ROLE_KEY=your_service_role_key_here
```

### "Database URL not configured"

Add to `.env.production`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
```

### "No user found"

Verify email is correct:
```sql
SELECT id, email FROM users WHERE email = 'amruthareddy.9353@gmail.com';
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `--check-only` | View current status (no changes) |
| `--env=production` | Target production database |
| `--billing=lifetime` | Grant lifetime access |
| `--force` | Skip confirmation prompts |

---

**Full Documentation:** See `VIDEO_PORTFOLIO_README.md` for complete details.
