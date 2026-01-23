-- Fix the trigger to use the correct function signature
-- The existing function is: queue_embedding_generation(uuid, text, text)

-- First, drop all existing embedding triggers
DROP TRIGGER IF EXISTS trigger_queue_opportunity_embedding ON opportunities;
DROP TRIGGER IF EXISTS trg_opportunity_embedding_queue ON opportunities;
DROP TRIGGER IF EXISTS auto_opportunity_embedding ON opportunities;

-- Create the trigger function with correct signature
CREATE OR REPLACE FUNCTION trigger_opportunity_embedding_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the existing queue_embedding_generation function with correct parameters
  -- Function signature: queue_embedding_generation(record_id uuid, table_name text, operation text)
  PERFORM queue_embedding_generation(
    NEW.id::uuid,           -- record_id as uuid
    'opportunities'::text,  -- table_name as text
    TG_OP::text            -- operation as text (INSERT, UPDATE, DELETE)
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the insert/update if embedding queue fails
    RAISE WARNING 'Embedding queue trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trg_opportunity_embedding_queue
AFTER INSERT OR UPDATE ON opportunities
FOR EACH ROW
EXECUTE FUNCTION trigger_opportunity_embedding_queue();

-- Verify it works
SELECT 
  '✅ Trigger created successfully! Import should now work.' as status,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'opportunities'
  AND trigger_name = 'trg_opportunity_embedding_queue';
