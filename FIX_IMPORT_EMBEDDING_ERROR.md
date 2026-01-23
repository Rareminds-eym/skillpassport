# Fix for Embedding Generation Error During Import

## Problem
When importing requisitions, you see this error:
```
Row 2: function queue_embedding_generation(integer, unknown, text, integer) does not exist
```

This happens because there's a database trigger on the `opportunities` table that tries to queue embedding generation, but the function doesn't exist.

## Quick Fix (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Disable the embedding trigger temporarily
DROP TRIGGER IF EXISTS trigger_queue_opportunity_embedding ON opportunities;
```

This will allow imports to work immediately.

## Complete Fix (If You Want Embedding Queue)

If you want the full embedding queue system, run the SQL from `fix-embedding-trigger-opportunities.sql`:

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `fix-embedding-trigger-opportunities.sql`
3. Run the SQL
4. This creates:
   - `embedding_queue` table
   - `queue_embedding_generation` function
   - Proper trigger with error handling

## Test After Fix

1. Go to http://localhost:3000/recruitment/requisition
2. Click "Import"
3. Download template
4. Upload template (with sample data)
5. Click "Import Requisitions"
6. Should work without errors!

## Why This Happened

The `opportunities` table has a trigger that automatically queues embedding generation for AI-powered job matching. The trigger was created but the underlying function/table was missing.

## Which Fix Should I Use?

- **Quick Fix**: If you don't need AI embeddings right now → Use `disable-embedding-trigger-opportunities.sql`
- **Complete Fix**: If you want AI job matching features → Use `fix-embedding-trigger-opportunities.sql`

Both fixes are safe and won't affect existing data.
