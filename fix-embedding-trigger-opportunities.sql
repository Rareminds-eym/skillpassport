  -- Fix for missing queue_embedding_generation function
  -- This creates the function and related infrastructure needed for the opportunities table trigger

  -- 1. Create embedding_queue table if it doesn't exist
  CREATE TABLE IF NOT EXISTS embedding_queue (
    id BIGSERIAL PRIMARY KEY,
    record_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    UNIQUE(record_id, table_name, operation, status)
  );

  -- 2. Create index for efficient queue processing
  CREATE INDEX IF NOT EXISTS idx_embedding_queue_status_priority 
  ON embedding_queue(status, priority DESC, created_at ASC)
  WHERE status = 'pending';

  -- 3. Create the queue_embedding_generation function
  CREATE OR REPLACE FUNCTION queue_embedding_generation(
    p_record_id UUID,
    p_table_name TEXT,
    p_operation TEXT DEFAULT 'update',
    p_priority TEXT DEFAULT 'normal'
  )
  RETURNS VOID AS $$
  BEGIN
    -- Insert into queue with ON CONFLICT to prevent duplicates
    INSERT INTO embedding_queue (record_id, table_name, operation, priority)
    VALUES (p_record_id, p_table_name, p_operation, p_priority)
    ON CONFLICT (record_id, table_name, operation, status) 
    DO UPDATE SET
      priority = CASE 
        WHEN EXCLUDED.priority = 'urgent' THEN 'urgent'
        WHEN EXCLUDED.priority = 'high' AND embedding_queue.priority != 'urgent' THEN 'high'
        WHEN EXCLUDED.priority = 'normal' AND embedding_queue.priority NOT IN ('urgent', 'high') THEN 'normal'
        ELSE embedding_queue.priority
      END,
      updated_at = NOW();
      
  EXCEPTION
    WHEN OTHERS THEN
      -- Silently fail if there's an issue - don't block the main operation
      RAISE WARNING 'Failed to queue embedding generation: %', SQLERRM;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- 4. Grant permissions
  GRANT EXECUTE ON FUNCTION queue_embedding_generation TO authenticated;
  GRANT EXECUTE ON FUNCTION queue_embedding_generation TO service_role;
  GRANT EXECUTE ON FUNCTION queue_embedding_generation TO anon;

  -- 5. Verify the trigger exists and recreate if needed
  DROP TRIGGER IF EXISTS trigger_queue_opportunity_embedding ON opportunities;

  CREATE TRIGGER trigger_queue_opportunity_embedding
  AFTER INSERT OR UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION queue_embedding_generation_trigger_opportunities();

  -- 6. Create the trigger function if it doesn't exist
  CREATE OR REPLACE FUNCTION queue_embedding_generation_trigger_opportunities()
  RETURNS TRIGGER AS $$
  BEGIN
    PERFORM queue_embedding_generation(
      NEW.id,
      'opportunities',
      TG_OP::TEXT,
      'normal'
    );
    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      -- Don't fail the insert/update if embedding queue fails
      RAISE WARNING 'Embedding queue trigger failed: %', SQLERRM;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Success message
  DO $$
  BEGIN
    RAISE NOTICE 'Embedding queue system created successfully for opportunities table';
  END $$;
