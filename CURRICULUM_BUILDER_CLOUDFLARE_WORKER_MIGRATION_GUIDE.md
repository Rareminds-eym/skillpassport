# Curriculum Builder - Cloudflare Worker Migration Guide

## 🎯 Overview

The **Curriculum Builder** module currently uses **10+ SQL functions** for managing curriculum changes and approvals. This guide explains how to convert them to Cloudflare Workers.

---

## 📊 Current SQL Functions

### **Core Change Management Functions:**

1. ✅ `add_pending_change()` - Add new change request
2. ✅ `get_pending_changes()` - Get changes for a curriculum
3. ✅ `approve_pending_change()` - Approve a change
4. ✅ `reject_pending_change()` - Reject a change
5. ✅ `cancel_pending_change()` - Cancel a change
6. ✅ `get_all_pending_changes_for_university()` - Get all university changes
7. ✅ `get_my_university_pending_changes()` - Get current user's university changes

### **Curriculum Management Functions:**

8. ✅ `submit_curriculum_for_approval()` - Submit curriculum for review
9. ✅ `review_curriculum()` - Approve/reject curriculum
10. ✅ `validate_curriculum()` - Validate curriculum structure
11. ✅ `copy_curriculum_template()` - Copy curriculum to another school
12. ✅ `approve_pending_change()` (from apply-approved-changes-to-tables.sql) - Apply approved changes to tables

---

## 🔍 Detailed Function Analysis

### **1. add_pending_change()**

**Current SQL Function:**
```sql
CREATE FUNCTION add_pending_change(
    p_curriculum_id UUID,
    p_change_type VARCHAR,
    p_entity_id UUID,
    p_change_data JSONB,
    p_message TEXT
) RETURNS UUID
```

**What it does:**
1. Validates user has permission to request changes
2. Checks if curriculum requires approval
3. Inserts record into `pending_changes` JSONB column
4. Returns change ID

**Frontend Call:**
```typescript
await supabase.rpc('add_pending_change', {
  p_curriculum_id: curriculumId,
  p_change_type: 'unit_add',
  p_entity_id: null,
  p_change_data: { data: unitData },
  p_message: 'Adding new unit'
});
```

---

### **2. get_pending_changes()**

**Current SQL Function:**
```sql
CREATE FUNCTION get_pending_changes(p_curriculum_id UUID)
RETURNS TABLE(
    change_id UUID,
    change_type VARCHAR,
    entity_id UUID,
    timestamp TIMESTAMP,
    requested_by UUID,
    requester_name TEXT,
    request_message TEXT,
    status VARCHAR,
    before_data JSONB,
    after_data JSONB,
    data JSONB
)
```

**What it does:**
1. Reads `pending_changes` JSONB from curriculum
2. Parses JSON array
3. Joins with users table for requester names
4. Returns formatted table

**Frontend Call:**
```typescript
const { data } = await supabase.rpc('get_pending_changes', {
  p_curriculum_id: curriculumId
});
```

---

### **3. approve_pending_change()**

**Current SQL Function:**
```sql
CREATE FUNCTION approve_pending_change(
    p_curriculum_id UUID,
    p_change_id UUID,
    p_approved_by UUID
) RETURNS BOOLEAN
```

**What it does:**
1. Validates university admin has permission
2. Finds change in `pending_changes` JSONB
3. Updates change status to 'approved'
4. Applies change to actual curriculum data
5. Updates `pending_changes` JSONB
6. Returns success

**Frontend Call:**
```typescript
await supabase.rpc('approve_pending_change', {
  p_curriculum_id: curriculumId,
  p_change_id: changeId,
  p_approved_by: userId
});
```

---

### **4. reject_pending_change()**

**Current SQL Function:**
```sql
CREATE FUNCTION reject_pending_change(
    p_curriculum_id UUID,
    p_change_id UUID,
    p_rejected_by UUID,
    p_rejection_reason TEXT
) RETURNS BOOLEAN
```

**What it does:**
1. Validates university admin has permission
2. Finds change in `pending_changes` JSONB
3. Updates change status to 'rejected'
4. Adds rejection reason
5. Updates `pending_changes` JSONB
6. Returns success

---

### **5. get_all_pending_changes_for_university()**

**Current SQL Function:**
```sql
CREATE FUNCTION get_all_pending_changes_for_university(p_university_id UUID)
RETURNS TABLE(
    curriculum_id UUID,
    curriculum_name TEXT,
    college_name TEXT,
    change_id UUID,
    change_type VARCHAR,
    ...
)
```

**What it does:**
1. Finds all curriculums for university
2. Extracts pending changes from each
3. Joins with colleges, users tables
4. Returns aggregated list

---

## 🏗️ Cloudflare Worker Architecture

### **Proposed Structure:**

```
cloudflare-workers/
└── curriculum-api/
    ├── src/
    │   ├── index.ts                          # Main entry point
    │   ├── handlers/
    │   │   ├── changeManagement.ts           # Change CRUD operations
    │   │   ├── approvalWorkflow.ts           # Approve/reject logic
    │   │   ├── curriculumValidation.ts       # Validation logic
    │   │   └── curriculumCopy.ts             # Copy template logic
    │   ├── services/
    │   │   ├── changeService.ts              # Business logic for changes
    │   │   ├── approvalService.ts            # Approval workflow logic
    │   │   ├── permissionService.ts          # Permission checks
    │   │   └── notificationService.ts        # Send notifications
    │   └── utils/
    │       ├── supabase.ts                   # Database client
    │       ├── jsonbHelper.ts                # JSONB manipulation
    │       └── validators.ts                 # Input validation
    ├── wrangler.toml
    ├── package.json
    └── tsconfig.json
```

---

## 🔄 Migration Strategy

### **API Endpoints to Create:**

```
POST   /changes/add                    → add_pending_change()
GET    /changes/:curriculumId          → get_pending_changes()
POST   /changes/approve                → approve_pending_change()
POST   /changes/reject                 → reject_pending_change()
POST   /changes/cancel                 → cancel_pending_change()
GET    /changes/university/:id         → get_all_pending_changes_for_university()
GET    /changes/my-university          → get_my_university_pending_changes()

POST   /curriculum/submit-approval     → submit_curriculum_for_approval()
POST   /curriculum/review              → review_curriculum()
POST   /curriculum/validate            → validate_curriculum()
POST   /curriculum/copy-template       → copy_curriculum_template()
```

---

## 💡 Implementation Approach

### **Example: add_pending_change() → Worker**

**Current (SQL Function):**
```typescript
// Frontend
await supabase.rpc('add_pending_change', {
  p_curriculum_id: curriculumId,
  p_change_type: 'unit_add',
  p_entity_id: null,
  p_change_data: { data: unitData },
  p_message: 'Adding new unit'
});
```

**New (Cloudflare Worker):**

**Frontend:**
```typescript
await fetch('https://curriculum-api.workers.dev/changes/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    curriculumId,
    changeType: 'unit_add',
    entityId: null,
    changeData: { data: unitData },
    message: 'Adding new unit'
  })
});
```

**Worker Logic:**
```typescript
// handlers/changeManagement.ts
export async function handleAddChange(request: Request, supabase: SupabaseClient) {
  // 1. Parse request
  const { curriculumId, changeType, entityId, changeData, message } = await request.json();
  
  // 2. Validate input
  if (!curriculumId || !changeType) {
    return errorResponse('Missing required fields', 400);
  }
  
  // 3. Check permissions
  const hasPermission = await permissionService.canRequestChange(
    supabase,
    userId,
    curriculumId
  );
  
  if (!hasPermission) {
    return errorResponse('Unauthorized', 403);
  }
  
  // 4. Get current curriculum
  const { data: curriculum } = await supabase
    .from('college_curriculums')
    .select('pending_changes')
    .eq('id', curriculumId)
    .single();
  
  // 5. Parse existing pending_changes JSONB
  const pendingChanges = curriculum.pending_changes || [];
  
  // 6. Create new change object
  const newChange = {
    id: crypto.randomUUID(),
    change_type: changeType,
    entity_id: entityId,
    timestamp: new Date().toISOString(),
    requested_by: userId,
    request_message: message,
    status: 'pending',
    data: changeData
  };
  
  // 7. Add to array
  pendingChanges.push(newChange);
  
  // 8. Update database
  await supabase
    .from('college_curriculums')
    .update({ pending_changes: pendingChanges })
    .eq('id', curriculumId);
  
  // 9. Send notification (optional)
  await notificationService.notifyUniversityAdmin(curriculumId, newChange);
  
  // 10. Return success
  return new Response(JSON.stringify({
    success: true,
    changeId: newChange.id
  }), { status: 200 });
}
```

---

## 🎯 Key Differences: SQL vs Worker

### **SQL Function Approach:**

```
Frontend
    ↓
supabase.rpc('add_pending_change')
    ↓
Database executes SQL function
    ↓
- Validates permissions (SQL)
- Reads pending_changes JSONB
- Modifies JSONB array
- Updates database
- Returns result
    ↓
Frontend receives response
```

### **Cloudflare Worker Approach:**

```
Frontend
    ↓
fetch('https://curriculum-api.workers.dev/changes/add')
    ↓
Worker receives request
    ↓
- Validates permissions (TypeScript)
- Queries database for pending_changes
- Modifies JSON array (JavaScript)
- Updates database via Supabase client
- Sends notifications
- Returns result
    ↓
Frontend receives response
```

---

## 📋 Step-by-Step Migration Process

### **Phase 1: Setup Worker Infrastructure**

1. Create `cloudflare-workers/curriculum-api/` directory
2. Initialize with `wrangler init`
3. Install dependencies: `@supabase/supabase-js`
4. Configure `wrangler.toml`
5. Set environment secrets (SUPABASE_URL, SUPABASE_SERVICE_KEY)

### **Phase 2: Implement Core Services**

1. **Permission Service** - Check user roles and permissions
2. **JSONB Helper** - Parse and manipulate pending_changes arrays
3. **Notification Service** - Send emails/notifications
4. **Validation Service** - Validate curriculum structure

### **Phase 3: Implement Handlers**

1. **Change Management Handler**
   - Add change
   - Get changes
   - Cancel change

2. **Approval Workflow Handler**
   - Approve change
   - Reject change
   - Apply changes to curriculum

3. **Curriculum Management Handler**
   - Submit for approval
   - Review curriculum
   - Validate curriculum
   - Copy template

### **Phase 4: Update Frontend**

1. Create `curriculumApiService.ts` wrapper
2. Replace all `supabase.rpc()` calls with `fetch()` calls
3. Update error handling
4. Test all workflows

### **Phase 5: Deploy and Test**

1. Deploy worker: `wrangler deploy`
2. Test each endpoint
3. Monitor logs
4. Gradual rollout

---

## ⚠️ Challenges and Considerations

### **1. JSONB Manipulation**

**Challenge:** SQL has native JSONB operators, JavaScript doesn't

**Solution:**
```typescript
// SQL: pending_changes || jsonb_build_array(new_change)
// JavaScript:
const pendingChanges = JSON.parse(curriculum.pending_changes || '[]');
pendingChanges.push(newChange);
await supabase.update({ pending_changes: JSON.stringify(pendingChanges) });
```

### **2. Transaction Safety**

**Challenge:** SQL functions run in transactions, workers don't

**Solution:**
- Use optimistic locking (version numbers)
- Implement retry logic
- Handle concurrent updates gracefully

### **3. Permission Checks**

**Challenge:** SQL can use `auth.uid()` directly

**Solution:**
```typescript
// Extract user from JWT token
const token = request.headers.get('Authorization');
const { data: { user } } = await supabase.auth.getUser(token);
const userId = user.id;
```

### **4. Complex Queries**

**Challenge:** `get_all_pending_changes_for_university()` joins multiple tables

**Solution:**
```typescript
// Fetch curriculums
const { data: curriculums } = await supabase
  .from('college_curriculums')
  .select('id, name, pending_changes, college_id')
  .eq('university_id', universityId);

// Fetch colleges
const collegeIds = curriculums.map(c => c.college_id);
const { data: colleges } = await supabase
  .from('colleges')
  .select('id, name')
  .in('id', collegeIds);

// Combine in JavaScript
const result = curriculums.flatMap(curriculum => {
  const college = colleges.find(c => c.id === curriculum.college_id);
  const changes = JSON.parse(curriculum.pending_changes || '[]');
  
  return changes.map(change => ({
    curriculum_id: curriculum.id,
    curriculum_name: curriculum.name,
    college_name: college?.name,
    ...change
  }));
});
```

---

## ✅ Benefits of Worker Approach

### **Advantages:**

1. ✅ **Better Error Handling** - Rich error messages, logging
2. ✅ **Easier Testing** - Can unit test business logic
3. ✅ **More Flexible** - Easy to add features (notifications, webhooks)
4. ✅ **Better Debugging** - Console logs, error tracking
5. ✅ **Version Control** - All logic in TypeScript files
6. ✅ **Easier Maintenance** - No SQL migrations needed
7. ✅ **Richer Logic** - Can integrate external APIs easily

### **Disadvantages:**

1. ❌ **More Code** - Need to write more boilerplate
2. ❌ **Network Overhead** - Extra hop between worker and database
3. ❌ **Complexity** - More moving parts to manage
4. ❌ **JSONB Handling** - Manual JSON parsing/stringifying
5. ❌ **Transaction Safety** - Need to implement manually

---

## 🎯 Recommendation

### **Should You Migrate Curriculum Builder to Workers?**

**✅ YES - Good candidate for migration**

**Reasons:**

1. **Complex Business Logic** - Approval workflows, permissions, notifications
2. **Frequent Changes** - Requirements change often, easier in TypeScript
3. **Integration Needs** - May need to send emails, webhooks, etc.
4. **Testing Requirements** - Easier to test business logic in TypeScript
5. **Maintainability** - Easier for developers to understand TypeScript than SQL

### **Migration Priority:**

**High Priority (Migrate First):**
- ✅ `add_pending_change()` - Core functionality
- ✅ `approve_pending_change()` - Core functionality
- ✅ `reject_pending_change()` - Core functionality
- ✅ `get_pending_changes()` - Core functionality

**Medium Priority:**
- ⚠️ `get_all_pending_changes_for_university()` - Complex query
- ⚠️ `submit_curriculum_for_approval()` - Workflow logic
- ⚠️ `review_curriculum()` - Workflow logic

**Low Priority (Can Keep in SQL):**
- 🔵 `validate_curriculum()` - Pure validation, works well in SQL
- 🔵 `copy_curriculum_template()` - Complex data copying, better in SQL

---

## 📊 Comparison Summary

| Aspect | SQL Functions | Cloudflare Workers |
|--------|--------------|-------------------|
| **Complexity** | Medium | High |
| **Maintainability** | ❌ Hard (SQL) | ✅ Easy (TypeScript) |
| **Testing** | ❌ Difficult | ✅ Easy |
| **Debugging** | ❌ Limited | ✅ Rich logging |
| **Flexibility** | ❌ Limited | ✅ Very flexible |
| **Performance** | ✅ Fast | ⚠️ Slightly slower |
| **Integration** | ❌ Limited | ✅ Easy (APIs, webhooks) |
| **Error Handling** | ❌ Basic | ✅ Rich |
| **Business Logic** | ❌ SQL only | ✅ Full TypeScript |

---

## 🚀 Next Steps

1. **Review this guide** with your team
2. **Decide on migration scope** (all functions or subset)
3. **Create worker project** structure
4. **Implement one function** as proof of concept
5. **Test thoroughly** before full migration
6. **Gradual rollout** - migrate one function at a time
7. **Monitor performance** and errors

---

## 📝 Conclusion

The Curriculum Builder module is a **GOOD candidate** for Cloudflare Worker migration because:

- Complex approval workflows
- Needs rich business logic
- Benefits from better error handling
- Easier to maintain in TypeScript
- Can integrate notifications and webhooks

However, consider keeping some functions in SQL:
- `validate_curriculum()` - Pure validation
- `copy_curriculum_template()` - Complex data operations

**Recommended Approach:** Hybrid - migrate approval workflow to workers, keep data-heavy operations in SQL.
