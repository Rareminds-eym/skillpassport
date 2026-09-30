# SkillPassport Industrial-Grade Database Backup Engine

Standards Compliance: **IEEE 730-2026** (SQA & Verification) | **ISO/IEC 12207** | **DORA 2026** (Elite Performer)

This directory houses automated, cryptographic database backups extracted from the remote Supabase production project (`dpooleduinyyzxgrcwko`).

---

## 🏛️ Architecture Overview

The backup engine enforces strict separation of concerns between structure and data, preventing schema-data entanglement and ensuring atomic reliability.

```text
supabase/backups/
├── latest/
│   ├── manifest.json            # Cryptographic audit manifest of the latest backup
│   ├── migration_schema.sql     # Schema DDL (tables, views, functions, triggers, RLS)
│   ├── migration_schema.sql.sha256 # SHA-256 checksum for migration_schema.sql
│   ├── roles.sql                # Cluster roles & permissions DDL
│   ├── roles.sql.sha256         # SHA-256 checksum for roles.sql
│   ├── seed_data.sql            # Seed DML records (COPY statements with replica mode)
│   └── seed_data.sql.sha256     # SHA-256 checksum for seed_data.sql
└── backup_<YYYYMMDD_HHMMSS>/
    ├── manifest.json            # Machine-readable audit manifest
    ├── migration_schema.sql
    ├── migration_schema.sql.sha256
    ├── roles.sql
    ├── roles.sql.sha256
    ├── seed_data.sql
    └── seed_data.sql.sha256
```

---

## 🛡️ Industrial-Grade Guarantees

| Capability | Implementation | Standard / Benefit |
| :--- | :--- | :--- |
| **Separation of Concerns** | Schema DDL, Data DML, and Roles dumped into separate files | Independent review, branch diffing, safe migrations |
| **Cryptographic Integrity** | SHA-256 calculated on streaming completion + `.sha256` files | Bit-rot detection, tamper protection, auditable |
| **Atomic Safety** | Writes to `.tmp` files first; atomically committed on exit 0 | Zero risk of partial / corrupted files if interrupted |
| **Pre-Flight Validation** | Checks Supabase CLI, remote link, and free disk space (≥500MB) | Prevents runtime aborts and disk exhaustion |
| **Audit Traceability** | `manifest.json` tracks Git commit, branch, author, timestamps, sizes | Full provenance tracking for SOC 2 / ISO compliance |
| **Storage Efficiency** | Optional Gzip compression (`--compress` / `-z`) | 80–90% disk space reduction for large seed files |
| **Retention Policy** | Automated pruning (`--keep <N>`, default 5) | Prevents long-term local disk bloat |
| **Self-Verification** | Built-in verification mode (`--verify latest`) | Instant confirmation of backup health |

---

## 🚀 Execution Commands

All commands can be invoked via `npm run` or directly via Python / Bash:

### 1. Full Backup (Schema + Seed + Roles)
```bash
npm run db:backup
# or
python3 scripts/backup_remote_db.py
```

### 2. Migration Schema Only (DDL)
```bash
npm run db:backup:schema
# or
python3 scripts/backup_remote_db.py --schema-only
```

### 3. Seed Data Only (DML)
```bash
npm run db:backup:seed
# or
python3 scripts/backup_remote_db.py --seed-only
```

### 4. Public-Schema Seed Data Only (Application records only)
```bash
npm run db:backup:seed:public
# or
python3 scripts/backup_remote_db.py --public-only
```

### 5. Gzip Compressed Backup (Storage Optimization)
```bash
npm run db:backup:compress
# or
python3 scripts/backup_remote_db.py --compress
```

### 6. Verify Backup Integrity
```bash
npm run db:backup:verify
# or
python3 scripts/backup_remote_db.py --verify latest
```

---

## 🔄 Disaster Recovery & Restore Runbook

### Scenario A: Local Development Reset (`supabase start`)
```bash
# 1. Start local Supabase instance
npm run supabase:start

# 2. Apply Schema (DDL)
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/backups/latest/migration_schema.sql

# 3. Restore Data (DML)
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/backups/latest/seed_data.sql
```

### Scenario B: Restoring to Remote Staging / DR Database
```bash
# Target connection: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

# 1. Restore Cluster Roles (Optional)
psql "<TARGET_DB_URL>" -f supabase/backups/latest/roles.sql

# 2. Restore Schema (DDL)
psql "<TARGET_DB_URL>" -f supabase/backups/latest/migration_schema.sql

# 3. Restore Seed Records (DML)
psql "<TARGET_DB_URL>" -f supabase/backups/latest/seed_data.sql
```
