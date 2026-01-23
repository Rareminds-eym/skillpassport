# N+1 Query Analysis - Pre-Registration System

**Date**: January 23, 2026  
**Status**: ✅ No N+1 Issues Found

---

## Overview

Analyzed the pre-registration payment flow for N+1 query problems in both frontend and Cloudflare worker.

---

## Frontend Analysis (`SimpleEventRegistration.jsx`)

### Database Queries

#### 1. Check for Existing Registration
```javascript
const { data: existingReg, error: checkError } = await supabase
  .from('pre_registrations')
  .select('id, payment_status, razorpay_order_id, payment_history')
  .eq('email', form.email.trim().toLowerCase())
  .maybeSingle();
```

**Analysis**: ✅ **No N+1 Issue**
- Single query with `.maybeSingle()`
- Returns at most 1 record
- No loops or iterations

---

#### 2. Insert New Registration
```javascript
const { data: registration, error: insertError } = await supabase
  .from('pre_registrations')
  .insert(registrationData)
  .select()
  .single();
```

**Analysis**: ✅ **No N+1 Issue**
- Single insert operation
- Returns single record
- No loops

---

#### 3. Update Order ID
```javascript
await supabase
  .from('pre_registrations')
  .update({
    razorpay_order_id: orderData.id,
  })
  .eq('id', registration.id);
```

**Analysis**: ✅ **No N+1 Issue**
- Single update by primary key
- No loops or iterations
- Executed once per payment attempt

---

### Frontend Summary

**Total Queries**: 3 (max)
- 1 SELECT (check existing)
- 1 INSERT (new registration) OR 0 (reuse existing)
- 1 UPDATE (order ID)

**N+1 Risk**: ❌ None
- All queries are single operations
- No loops iterating over results
- No nested queries

---

## Worker Analysis (`payments-api/src/index.ts`)

### handleCreateEventOrder()

#### Query 1: Verify Registration Exists
```typescript
const { data: registration, error: regError } = await supabaseAdmin
  .from(tableName)
  .select('id, payment_status, payment_history')
  .eq('id', registrationId)
  .maybeSingle();
```

**Analysis**: ✅ **No N+1 Issue**
- Single query by primary key
- Returns at most 1 record

---

#### Query 2: Update Payment History
```typescript
await supabaseAdmin
  .from(tableName)
  .update({ 
    razorpay_order_id: order.id,
    payment_history: paymentHistory
  })
  .eq('id', registrationId);
```

**Analysis**: ✅ **No N+1 Issue**
- Single update by primary key
- Atomic operation

---

### handleUpdateEventPaymentStatus()

#### Query 1: Get Current Registration
```typescript
const { data: registration, error: regError } = await supabaseAdmin
  .from(tableName)
  .select('id, payment_history, razorpay_order_id')
  .eq('id', registrationId)
  .maybeSingle();
```

**Analysis**: ✅ **No N+1 Issue**
- Single query by primary key

---

#### Query 2: Update Payment Status
```typescript
const { error: updateError } = await supabaseAdmin
  .from(tableName)
  .update(updateData)
  .eq('id', registrationId);
```

**Analysis**: ✅ **No N+1 Issue**
- Single update by primary key
- Atomic operation

---

### Worker Summary

**Total Queries per Request**:
- `createEventOrder`: 2 queries (1 SELECT, 1 UPDATE)
- `updateEventPaymentStatus`: 2 queries (1 SELECT, 1 UPDATE)

**N+1 Risk**: ❌ None
- All queries use primary key lookups
- No loops or iterations
- No nested queries

---

## Complete Payment Flow Query Count

### New Registration Flow

```
1. Frontend: Check existing registration
   └─ SELECT ... WHERE email = ? (1 query)

2. Frontend: Insert new registration
   └─ INSERT INTO pre_registrations (1 query)

3. Worker: Create order
   ├─ SELECT ... WHERE id = ? (1 query)
   └─ UPDATE ... WHERE id = ? (1 query)

4. Worker: Update payment status
   ├─ SELECT ... WHERE id = ? (1 query)
   └─ UPDATE ... WHERE id = ? (1 query)

Total: 6 queries (all single operations)
```

### Retry Payment Flow

```
1. Frontend: Check existing registration
   └─ SELECT ... WHERE email = ? (1 query)

2. Worker: Create order
   ├─ SELECT ... WHERE id = ? (1 query)
   └─ UPDATE ... WHERE id = ? (1 query)

3. Worker: Update payment status
   ├─ SELECT ... WHERE id = ? (1 query)
   └─ UPDATE ... WHERE id = ? (1 query)

Total: 5 queries (all single operations)
```

---

## N+1 Pattern Detection

### What is N+1?

```javascript
// ❌ N+1 Problem Example
const users = await db.select('*').from('users'); // 1 query

for (const user of users) {
  // N queries (one per user)
  const posts = await db.select('*').from('posts').where('user_id', user.id);
}
// Total: 1 + N queries
```

### Our Implementation

```javascript
// ✅ No N+1 - Single Query
const registration = await supabase
  .from('pre_registrations')
  .select('id, payment_status, payment_history')
  .eq('email', email)
  .maybeSingle();
// Total: 1 query
```

---

## Potential N+1 Scenarios (Not Present)

### ❌ Scenario 1: Fetching Multiple Registrations
```javascript
// This would be N+1 if we did this:
const registrations = await supabase
  .from('pre_registrations')
  .select('*');

for (const reg of registrations) {
  // N queries
  const history = await supabase
    .from('payment_history')
    .select('*')
    .eq('registration_id', reg.id);
}
```

**Why we don't have this**:
- We use JSONB `payment_history` column
- All history fetched in single query
- No separate table or loop

---

### ❌ Scenario 2: Batch Processing
```javascript
// This would be N+1 if we did this:
const emails = ['user1@example.com', 'user2@example.com', ...];

for (const email of emails) {
  // N queries
  const reg = await supabase
    .from('pre_registrations')
    .select('*')
    .eq('email', email)
    .single();
}
```

**Why we don't have this**:
- We only process one registration at a time
- No batch operations
- No loops over multiple records

---

## Query Optimization

### Current Optimizations

#### 1. Primary Key Lookups
```typescript
// ✅ Optimized - Uses primary key index
.eq('id', registrationId)
```

#### 2. Indexed Email Lookups
```sql
-- Unique index on email
CREATE UNIQUE INDEX idx_pre_registrations_email_unique 
ON pre_registrations(LOWER(email));
```

#### 3. JSONB for Payment History
```typescript
// ✅ Single query gets all history
payment_history: [
  { order_id, payment_id, status, ... },
  { order_id, payment_id, status, ... }
]
```

**Benefits**:
- No joins required
- No N+1 risk
- Atomic updates

---

### Recommended Indexes

```sql
-- Already have these
CREATE UNIQUE INDEX idx_pre_registrations_email_unique 
ON pre_registrations(LOWER(email));

CREATE INDEX idx_pre_registrations_payment_status 
ON pre_registrations(payment_status);

CREATE INDEX idx_pre_registrations_email_status 
ON pre_registrations(email, payment_status);

-- For payment history queries
CREATE INDEX idx_pre_registrations_payment_history 
ON pre_registrations USING GIN (payment_history);
```

---

## Performance Metrics

### Query Execution Times (Estimated)

| Query | Type | Index | Est. Time |
|-------|------|-------|-----------|
| SELECT by email | Single | Unique | <5ms |
| SELECT by ID | Single | Primary Key | <2ms |
| INSERT | Single | - | <10ms |
| UPDATE by ID | Single | Primary Key | <5ms |

### Total Flow Time

- **New Registration**: ~22ms (6 queries)
- **Retry Payment**: ~17ms (5 queries)

**Note**: Actual times depend on network latency and database load

---

## Monitoring Queries

### Check for Slow Queries

```sql
-- Enable query logging in Supabase
-- Check slow query log for patterns

-- Find queries taking >100ms
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;
```

### Monitor N+1 Patterns

```sql
-- Check for repeated queries
SELECT 
  query,
  calls,
  total_time / calls as avg_time
FROM pg_stat_statements
WHERE calls > 100
ORDER BY calls DESC
LIMIT 20;
```

---

## Best Practices Applied

### ✅ 1. Use Primary Keys
```typescript
// Always query by primary key when possible
.eq('id', registrationId)
```

### ✅ 2. Single Queries
```typescript
// Fetch all needed data in one query
.select('id, payment_status, payment_history')
```

### ✅ 3. Avoid Loops
```typescript
// No loops over database results
// Process one record at a time
```

### ✅ 4. Use JSONB for Related Data
```typescript
// Store related data in JSONB
payment_history: [...]
```

### ✅ 5. Atomic Operations
```typescript
// Update everything in one query
.update({ 
  payment_status: 'completed',
  payment_history: updatedHistory
})
```

---

## Future Considerations

### If Scaling to Batch Operations

If we ever need to process multiple registrations:

```typescript
// ✅ Good - Single query with IN clause
const registrations = await supabase
  .from('pre_registrations')
  .select('*')
  .in('email', emails);

// ❌ Bad - N queries in loop
for (const email of emails) {
  const reg = await supabase
    .from('pre_registrations')
    .select('*')
    .eq('email', email);
}
```

### If Adding Related Tables

If we ever split payment_history into a separate table:

```typescript
// ✅ Good - Join in single query
const registrations = await supabase
  .from('pre_registrations')
  .select(`
    *,
    payment_attempts:payment_history(*)
  `);

// ❌ Bad - Separate queries
const registrations = await supabase
  .from('pre_registrations')
  .select('*');

for (const reg of registrations) {
  const attempts = await supabase
    .from('payment_history')
    .select('*')
    .eq('registration_id', reg.id);
}
```

---

## Conclusion

### ✅ No N+1 Issues Found

**Reasons**:
1. All queries use primary key or unique index lookups
2. No loops iterating over database results
3. No nested queries
4. JSONB used for related data (payment_history)
5. Atomic operations for updates

### Performance Characteristics

- **Query Count**: 5-6 queries per payment flow
- **Query Type**: All single-record operations
- **Indexes**: Properly indexed on email and ID
- **Optimization**: JSONB eliminates need for joins

### Recommendations

1. ✅ **Keep current implementation** - No changes needed
2. ✅ **Monitor query performance** - Use pg_stat_statements
3. ✅ **Maintain indexes** - Ensure indexes stay optimal
4. ✅ **Document patterns** - For future developers

---

**Status**: ✅ N+1 Analysis Complete  
**Result**: No N+1 issues detected  
**Action Required**: None - Implementation is optimal
