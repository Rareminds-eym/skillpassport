# Department Creation Fix - Summary

## Problem
When creating a department, the constraint `chk_departments_institution` was failing because:
1. The constraint requires **exactly one** of `school_id` OR `college_id` to be set (not both, not neither)
2. The code was setting `college_id` to the **user ID** instead of the **college ID**

## Root Cause
```typescript
const collegeId = user?.college_id;
```
This was returning the user ID (`91bf6be4-31a5-4d6a-853d-675596755cee`) instead of the actual college ID (`c16a95cf-6ee5-4aa9-8e47-84fbda49611d`).

## Solution Applied

### 1. Fetch Actual College ID
Add