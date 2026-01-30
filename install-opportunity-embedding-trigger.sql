-- ============================================================================
-- Install Opportunity Embedding Trigger
-- ============================================================================
-- This trigger automatically generates embeddings for opportunities when they
-- are created or updated. This ensures all opportunities have embeddings for
-- accurate AI matching.
--
-- Run this SQL in your Supabase SQL Editor to install the trigger.
-- ============================================================================

-- Step 1: Create the trigger function
-- This function calls the career-api to generate embeddings
CREATE OR REPLACE FUNCTION trigger_opportunity_embedding()
RETURNS TRIGGER AS $$
DECLARE
  embedding_api_url TEXT;
  embedding_text TEXT;
  request_id UUID;
BEGIN
  -- Get the API URL from app settings or use default
  embedding_api_url := 'https://career-api.skillpassport.workers.dev/generate-embedding';

  -- Build the embedding text from opportunity data
  embedding_text := NEW.title || ' at ' || COALESCE(NEW.company_name, 'Company');
  
  IF NEW.description IS NOT NULL THEN
    embedding_text := embedding_text || '. ' || NEW.description;
  END IF;
  
  IF NEW.skills_required IS NOT NULL THEN
    embedding_text := embedding_text || '. Required Skills: ' || 
                     (SELECT string_agg(value::text, ', ') 
             ription IS NOT NULL THEN
    embedding_text := embedding_text || '. ' || NEW.description;
  END IF;
  
  IF NEW.skills_required IS NOT NULL THEN
    embedding_text := embedding_text || '. Required Skills: ' || 
                     (SELECT string_agg(value::text, ', ') 
                      FROM jsonb_array_elements_text(NEW.skills_required));
  END IF;

  -- Queue the embedding generation via HTTP POST
  -- This is async