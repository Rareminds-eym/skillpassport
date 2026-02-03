# Certificate Data Flow - Visual Guide

## Where Your Data Lives

```
┌─────────────────────────────────────────────────────────────────┐
│                    CERTIFICATES TABLE                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Single Row for "Sports club" Certificate                  │ │
│  │                                                            │ │
│  │  Main Fields (Current Data):                              │ │
│  │  ├─ id: "abc-123"                                         │ │
│  │  ├─ title: "Sports club" ← Dashboard reads this          │ │
│  │  ├─ issuer: "Aditya College"                             │ │
│  │  ├─ approval_status: "pending"                           │ │
│  │  └─ has_pending_edit: true                               │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────┐        │ │
│  │  │ verified_data (JSONB) - OLD VERIFIED DATA    │        │ │
│  │  │ ┌──────────────────────────────────────────┐ │        │ │
│  │  │ │ {                                        │ │        │ │
│  │  │ │   "title": "Sports club",  ← ORIGINAL   │ │        │ │
│  │  │ │   "issuer": "Aditya College",           │ │        │ │
│  │  │ │   "description": "Achievement...",      │ │        │ │
│  │  │ │   "approval_status": "verified",        │ │        │ │
│  │  │ │   "enabled": true,                      │ │        │ │
│  │  │ │   ... all other original fields         │ │        │ │
│  │  │ │ }                                        │ │        │ │
│  │  │ └──────────────────────────────────────────┘ │        │ │
│  │  └──────────────────────────────────────────────┘        │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────┐        │ │
│  │  │ pending_edit_data (JSONB) - YOUR NEW CHANGES │        │ │
│  │  │ ┌──────────────────────────────────────────┐ │        │ │
│  │  │ │ {                                        │ │        │ │
│  │  │ │   "title": "Sports",  ← YOUR CHANGE     │ │        │ │
│  │  │ │   "issuer": "Aditya College",           │ │        │ │
│  │  │ │   "description": "Achievement...",      │ │        │ │
│  │  │ │   "approval_status": "pending",         │ │        │ │
│  │  │ │   "enabled": true,                      │ │        │ │
│  │  │ │   ... all other updated fields          │ │        │ │
│  │  │ │ }                                        │ │        │ │
│  │  │ └──────────────────────────────────────────┘ │        │ │
│  │  └──────────────────────────────────────────────┘        │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow When You Edit

```
┌─────────────────────────────────────────────────────────────────┐
│                         EDIT FLOW                               │
└─────────────────────────────────────────────────────────────────┘

Step 1: Original State (Verified)
┌──────────────────────────────────┐
│ title: "Sports club"             │
│ approval_status: "verified"      │
│ verified_data: null              │
│ pending_edit_data: null          │
└──────────────────────────────────┘
                │
                │ User edits to "Sports"
                ▼
Step 2: After Edit (Versioning Activated)
┌──────────────────────────────────┐
│ title: "Sports club" (unchanged) │ ← Dashboard shows this
│ approval_status: "pending"       │
│                                  │
│ verified_data: {                 │ ← OLD DATA SAVED HERE
│   "title": "Sports club",        │
│   "approval_status": "verified"  │
│ }                                │
│                                  │
│ pending_edit_data: {             │ ← NEW DATA SAVED HERE
│   "title": "Sports",             │
│   "approval_status": "pending"   │
│ }                                │
└──────────────────────────────────┘
                │
                │ Admin approves
                ▼
Step 3: After Approval
┌──────────────────────────────────┐
│ title: "Sports" (updated!)       │ ← Dashboard shows this now
│ approval_status: "verified"      │
│ verified_data: null (cleared)    │
│ pending_edit_data: null (cleared)│
└──────────────────────────────────┘
```

## What Each Component Sees

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT VIEWS                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐     ┌──────────────────────────┐
│      DASHBOARD           │     │     EDIT MODAL           │
│                          │     │                          │
│  Reads from:             │     │  Reads from:             │
│  ├─ verified_data        │     │  ├─ pending_edit_data    │
│  │  (if has_pending_edit)│     │  │  (if has_pending_edit)│
│  └─ OR main fields       │     │  └─ OR main fields       │
│                          │     │                          │
│  Shows:                  │     │  Shows:                  │
│  "Sports club"           │     │  "Sports"                │
│  Badge: "Verified"       │     │  Badge: "Pending Approval"│
└──────────────────────────┘     └──────────────────────────┘
```

## Database Schema

```sql
CREATE TABLE certificates (
  -- Primary fields (current data)
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  title TEXT,
  issuer TEXT,
  level TEXT,
  credential_id TEXT,
  link TEXT,
  issued_on DATE,
  expiry_date DATE,
  description TEXT,
  document_url TEXT,
  platform TEXT,
  instructor TEXT,
  category TEXT,
  
  -- Status fields
  status TEXT DEFAULT 'active',
  approval_status TEXT DEFAULT 'pending',
  enabled BOOLEAN DEFAULT true,
  
  -- Versioning fields (JSONB)
  has_pending_edit BOOLEAN DEFAULT false,
  verified_data JSONB,        ← OLD DATA STORED HERE
  pending_edit_data JSONB,    ← NEW DATA STORED HERE
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Example Data in Database

```json
{
  "id": "abc-123",
  "title": "Sports club",
  "issuer": "Aditya College",
  "approval_status": "pending",
  "has_pending_edit": true,
  
  "verified_data": {
    "title": "Sports club",
    "issuer": "Aditya College",
    "description": "Achievement during college",
    "approval_status": "verified",
    "enabled": true
  },
  
  "pending_edit_data": {
    "title": "Sports",
    "issuer": "Aditya College",
    "description": "Achievement during college",
    "approval_status": "pending",
    "enabled": true
  }
}
```

## Quick Reference

| Field | Contains | Used By |
|-------|----------|---------|
| `title`, `issuer`, etc. | Current data (old until approved) | Internal queries |
| `verified_data` | Complete old verified version | Dashboard display |
| `pending_edit_data` | Complete new pending version | Edit modal display |
| `has_pending_edit` | Boolean flag | Determines which data to show |
| `approval_status` | Current status | Workflow logic |

## SQL to See Everything

```sql
-- See all three versions side by side
SELECT 
  -- Current fields
  title as current_title,
  approval_status as current_status,
  
  -- Old verified data
  verified_data->>'title' as old_title,
  verified_data->>'approval_status' as old_status,
  
  -- New pending data
  pending_edit_data->>'title' as new_title,
  pending_edit_data->>'approval_status' as new_status,
  
  -- Flags
  has_pending_edit
  
FROM certificates
WHERE id = 'your-certificate-id';
```

## Summary

✅ **Old Data**: Stored in `verified_data` JSONB field
✅ **New Data**: Stored in `pending_edit_data` JSONB field  
✅ **Dashboard**: Shows old data from `verified_data`
✅ **Edit Modal**: Shows new data from `pending_edit_data`
✅ **After Approval**: Both JSONB fields cleared, main fields updated

Use `check_old_data_storage.sql` to explore your actual data!
